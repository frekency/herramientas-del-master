#!/usr/bin/env python
"""Subclases de Xanathar y de Tasha (PDF con texto) → rasgos para un módulo de «Mi copia».

Solo uso personal: la salida va a datos/privado/ (fuera de git).
Uso: python tools/libro_subclases_xt.py <pdf> <XGE|TCE> <pag_ini> <pag_fin> <abrev> <libro> <salida.json>
Estructura: título de subclase (15 pt o dibujado) → introducción → «Rasgos de…» → tabla «Nivel de…» → rasgos (13 pt o dibujados).
Los títulos dibujados se detectan por el hueco que dejan entre dos líneas de texto y se leen con el OCR de Windows.
Las subclases se emparejan por orden con las de 5etools (clases en orden alfabético inglés) para saber la clase.
"""
import sys, os, re, json, difflib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pymupdf
import libro_entradas as E

CLASES = [('barbarian', 'Bárbaro'), ('bard', 'Bardo'), ('warlock', 'Brujo'), ('cleric', 'Clérigo'), ('druid', 'Druida'), ('ranger', 'Explorador'), ('fighter', 'Guerrero'),
          ('sorcerer', 'Hechicero'), ('wizard', 'Mago'), ('monk', 'Monje'), ('paladin', 'Paladín'), ('rogue', 'Pícaro')]
PAGOFF = int(os.environ.get('PAGOFF', '1'))
RX_NIV = re.compile(r'(\d{1,2})\s*(?:º|°|\.?\s*er|\.?\s*o)?\s*nivel|nivel\s*(?:de\s+\w+\s+)?(\d{1,2})', re.I)


def esperadas(fuente, base):
    out = []
    for c, es in CLASES:
        d = json.load(open(os.path.join(base, 'class-%s.json' % c), encoding='utf-8'))
        vistas = set()
        for s in d.get('subclass', []):
            if s['source'] != fuente or s['name'] in vistas:
                continue
            vistas.add(s['name']); out.append((es, s['name']))
    return out


def flujo(d, pi, pf):
    """Líneas de todas las páginas + marcas de imagen (títulos dibujados)."""
    L = []
    for p in range(pi, pf + 1):
        ls, n = E.lineas_pag(d, p)
        for r in ls:
            r['num'] = n
        L += [r for r in ls if 'CAPITULO' not in r['t'].upper() and 'CAPÍTULO' not in r['t'].upper() and not (r['y'] > 740 and re.match(r'^\d{1,3}$', r['t'])) and not (r['size'] < 9.5 and r['t'].startswith('RASGOS '))]
        W = d[p - 1].rect.width
        for b in d[p - 1].get_text('dict')['blocks']:
            for l in b.get('lines', []):      # líneas en blanco con cuerpo de título: el título está dibujado
                if ''.join(sp['text'] for sp in l['spans']).strip() == '' and max(sp['size'] for sp in l['spans']) >= 12 and l['bbox'][0] < W - 12:
                    x0, y0, x1, y1 = l['bbox']
                    L.append({'t': '', 'x0': x0, 'x1': x0 + 250, 'y': y0, 'y1': y1, 'size': 0, 'col': 0 if x0 < W * 0.5 - 20 else 1, 'p': p, 'img': True, 'num': n})
        for im in d[p - 1].get_image_info():
            x0, y0, x1, y1 = im['bbox']
            if y1 - y0 < 30 and 40 < x1 - x0 < 400 and y0 > 30 and x0 > 0:
                L.append({'t': '', 'x0': x0, 'x1': x1, 'y': y0, 'y1': y1, 'size': 0, 'col': 0 if x0 < 290 else 1, 'p': p, 'img': True, 'num': n})
    L.sort(key=lambda r: (r['p'], r['col'], r['y']))
    return L


def huecos(L):
    """Títulos dibujados: hueco de más de 17 pt entre dos líneas de texto normal en la misma columna, o una imagen pequeña."""
    H, por = [], {}
    for r in L:
        if not r.get('img'):
            por.setdefault((r['p'], r['col']), []).append(r)
    for (p, col), ls in por.items():
        ls.sort(key=lambda r: r['y'])
        for a, b in zip(ls, ls[1:]):
            if a['size'] < 11 and b['size'] < 11 and b['y'] - a['y1'] > 7.5 and b['y'] - a['y'] > 17.5 and abs(b['x0'] - a['x0']) < 20:
                x0 = min(a['x0'], b['x0'])
                H.append({'p': p, 'col': col, 'y': (a['y1'] + b['y']) / 2, 'y0': a['y1'], 'y1': b['y'], 'x0': x0, 'img': False, 'hid': True, 'size': 0, 't': '', 'x1': x0 + 250})
    for r in L:
        if r.get('img'):
            H.append({'p': r['p'], 'col': r['col'], 'y': r['y'], 'y0': r['y'] - 4, 'y1': r['y'] + 14, 'x0': r['x0'], 'img': True, 'hid': True, 'size': 0, 't': '', 'x1': r['x1']})
    imgs = [h for h in H if h['img']]
    return [h for h in H if h['img'] or not any(i['p'] == h['p'] and i['col'] == h['col'] and abs(i['y'] - h['y']) < 16 for i in imgs)]


def ocr_lote(d, H):
    import tempfile, subprocess, shutil
    tmp = tempfile.mkdtemp(prefix='hid_')
    try:
        for k, h in enumerate(H):
            alto = max(12, min(h['y1'] - h['y0'], 26))
            y0 = max(h['y0'], h['y1'] - alto) if not h['img'] else h['y0']
            d[h['p'] - 1].get_pixmap(dpi=300, clip=pymupdf.Rect(h['x0'] - 6, y0 - 2, h['x0'] + 265, y0 + alto + 2)).save(os.path.join(tmp, 'h%04d.png' % k))
        ps = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ocr_lote.ps1')
        subprocess.run(['powershell', '-NoProfile', '-File', ps, tmp, os.path.join(tmp, 'o.json')], check=True, capture_output=True)
        with open(os.path.join(tmp, 'o.json'), encoding='utf-8-sig') as f:
            r = json.load(f)
        for k, h in enumerate(H):
            ls = r.get('h%04d' % k) or []
            h['t'] = ' '.join(x['t'] for x in ls).strip()
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def limpia_ocr(t):
    t = re.sub(r'[^A-Za-zÁÉÍÓÚÑÜáéíóúñü ,:\-]', '', t.replace('�', ''))
    return E.titulo_bonito(re.sub(r'\s+', ' ', t))


def filas_de(tabla):
    """Líneas de la tabla de rasgos («3º Protectores ancestrales», con continuaciones) → {nivel: texto}."""
    f, ult, prev = {}, None, None
    for r in tabla:
        t = r['t'].strip()
        if len(t) > 75 or (prev is not None and r['y'] - prev > 14):
            break
        prev = r['y']
        m = re.match(r'^(\d{1,2})(?:\.?\S{0,3})?\s+(.+)$', t) or re.match(r'^(\d{1,2})\S{0,3}$', t)
        if m:
            ult = int(m.group(1)); f[ult] = (m.group(2) if m.lastindex == 2 else '')
        elif ult is not None and r['size'] < 11:
            f[ult] = (f[ult] + ' ' + t).strip()
    return f


def nombres_tabla(filas):
    out = []
    for txt in filas.values():
        for pz in re.split(r',\s*|\s+y\s+', txt):
            pz = E.fold(re.sub(r'\(.*?\)', '', pz))
            if len(pz) > 2:
                out.append(pz)
    return out


def parecido(a, b):
    return a == b or difflib.SequenceMatcher(None, a, b).ratio() > 0.8


def titulo_ocr(t):
    letras = re.sub(r'[^A-Za-zÁÉÍÓÚÑÜáéíóúñü]', '', t)
    return len(letras) >= 4 and len(t) <= 48 and '.' not in t and sum(c.isupper() for c in letras) / len(letras) >= 0.55


def en_tabla(nom, cur):
    f = E.fold(nom)
    pal = [w for w in re.split(r'\W+', f) if len(w) > 2]
    todo = set(re.split(r'\W+', E.fold(' '.join(cur['filas'].values()))))
    return any(parecido(f, n) or f in n for n in cur['pend_nombres']) or (bool(pal) and all(w in todo for w in pal))


def construir(L, H):
    items = [r for r in L if not r.get('img')] + H
    items.sort(key=lambda r: (r['p'], r['col'], r['y']))
    seq = []
    for k, r in enumerate(items):
        if r.get('hid'):
            nxt = items[k + 1] if k + 1 < len(items) else None
            antes_tabla = nxt is not None and not nxt.get('hid') and nxt['t'].startswith('Nivel de') and nxt['p'] == r['p'] and nxt['col'] == r['col'] and nxt['y'] - r['y'] < 45
            if antes_tabla or E.fold(r['t']).startswith('rasgos'):
                seq.append(('R', r))
            elif titulo_ocr(r['t']):
                seq.append(('H', r))
            continue
        sz, t = r['size'], r['t']
        if sz >= 19: seq.append(('C', r))
        elif 14.5 <= sz < 19: seq.append(('T', r))
        elif 9.5 <= sz <= 12.5 and re.match(r'^(Rasgos|RASGOS)\b', t): seq.append(('R', r))
        elif 12.5 < sz < 14.5: seq.append(('F', r))
        elif sz > 7.5 and t.startswith('Nivel de'): seq.append(('N', r))
        else: seq.append(('L', r))
    fus = []        # encabezados de dos líneas seguidos
    for tp, r in seq:
        if fus and tp in 'FT' and fus[-1][0] == tp and not r.get('hid') and not fus[-1][1].get('hid') and fus[-1][1]['p'] == r['p'] and fus[-1][1]['col'] == r['col'] and 0 < r['y'] - fus[-1][1]['y'] < 17:
            fus[-1][1]['t'] += ' ' + r['t']; fus[-1][1]['y1'] = r['y1']
            continue
        fus.append((tp, dict(r)))
    construir.fus = fus
    secs, cur, pend, estado = [], None, None, 'fuera'
    for tp, r in fus:
        texto = r['t']
        if tp in 'CTH' and estado in ('tabla', 'feat'):
            if estado == 'tabla':
                cur['filas'] = filas_de(cur['tabla']); cur['pend_nombres'] = nombres_tabla(cur['filas']); estado = 'feat'
            nom = limpia_ocr(texto)
            if tp in 'HT' and ((tp == 'H' and not cur['filas']) or en_tabla(nom, cur)):
                tp = 'F'
            else:
                if cur['pend_nombres']: cur['faltan'] = list(cur['pend_nombres'])
                estado, cur = 'fuera', None
        if tp == 'C':
            estado, cur = 'fuera', None; pend = None; continue
        if estado in ('fuera', 'intro') and tp in 'TH':
            hid = bool(r.get('hid'))
            pend = {'t': limpia_ocr(texto) if hid else E.titulo_bonito(texto), 'dudas': hid, 'p': r['p'], 'intro': []}
            estado = 'intro'; continue
        if tp == 'R' and estado == 'tabla' and cur is not None and not cur['tabla']:
            continue
        if tp == 'R':
            if pend is None:
                nom = re.sub(r'^Rasgos (?:de la |del |de los |de las |de )', '', texto)
                pend = {'t': limpia_ocr(nom) if nom else '', 'dudas': True, 'p': r['p'], 'intro': []}
            cur = {'titulo': pend['t'], 'dudas': pend['dudas'], 'p': pend['p'], 'intro': pend['intro'], 'filas': {}, 'tabla': [], 'feats': [], 'pend_nombres': [], 'nf': 0}
            secs.append(cur); estado = 'tabla'; pend = None; continue
        if tp == 'N':
            continue
        if estado == 'intro' and tp == 'L':
            pend['intro'].append(r); continue
        if estado == 'tabla' and tp == 'L':
            cur['tabla'].append(r); continue
        if tp in 'FH' and estado in ('tabla', 'feat'):
            if estado == 'tabla':
                cur['filas'] = filas_de(cur['tabla'])
                cur['pend_nombres'] = nombres_tabla(cur['filas'])
                estado = 'feat'
            nom = limpia_ocr(texto) if r.get('hid') else E.titulo_bonito(texto)
            cur['feats'].append({'n': nom, 'lineas': [], 'p': r['p'], 'hid': bool(r.get('hid'))})
            cur['nf'] += 1
            f = E.fold(nom)
            cur['pend_nombres'] = [n for n in cur['pend_nombres'] if not (parecido(n, f) or f in n or n in f)]
            continue
        if tp == 'L' and estado == 'feat' and cur['feats']:
            cur['feats'][-1]['lineas'].append(r)
    return secs


def nivel_rasgo(nom, filas, lineas):
    f = E.fold(nom)
    for lv, txt in sorted(filas.items()):
        for pz in re.split(r',\s*|\s+y\s+', txt):
            if parecido(E.fold(re.sub(r'\(.*?\)', '', pz)), f):
                return lv, False
    cuerpo = ' '.join(r['t'] for r in lineas[:6])
    m = RX_NIV.search(cuerpo)
    if m:
        return int(m.group(1) or m.group(2)), True
    return None, True


def main():
    pdf, fuente, a, b, abrev, libro, salida = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5], sys.argv[6], sys.argv[7]
    base5 = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'datos', 'privado', '5etools')
    d = pymupdf.open(pdf)
    L = flujo(d, a, b)
    H = huecos(L)
    ocr_lote(d, H)
    secs = construir(L, H)
    esp = esperadas(fuente, base5)
    pnum = {}
    for r in L:
        if r.get('num'): pnum[r['p']] = r['num']
    print(len(secs), 'secciones;', len(esp), 'esperadas')
    if os.environ.get('DBG'):
        for tp, r in construir.fus:
            if int(os.environ['DBG'].split('-')[0]) <= r['p'] <= int(os.environ['DBG'].split('-')[1]):
                print('  ev', r['p'], r['col'], round(r['y']), tp, r['t'][:40])
    out = []
    ok = len(secs) == len(esp)
    for k, sc in enumerate(secs):
        cls = esp[k][0] if ok else '?'
        sub = sc['titulo'] or '?'
        pg = lambda p: str(pnum.get(p) or (p - PAGOFF))
        dudas = ['texto leído de un escaneado/PDF con maquetación compleja: compruébalo con el libro']
        if sc['dudas']: dudas.append('el título estaba dibujado y se leyó con OCR: compruébalo')
        if sc.get('faltan'): dudas.append('no se encontró el rasgo: ' + ', '.join(sc['faltan']))
        out.append({'n': '%s (%s: %s)' % (sub, cls, sub), 'base': sub, 'cls': cls, 'sub': sub, 'nv': None, 'tipo': 'Subclase', 'pg': pg(sc['p']), 'd': E.html(E.parrafos(sc['intro'])), 'pend': True, 'dudas': dudas[1:] if len(dudas) > 1 else []})
        if not out[-1]['dudas']: del out[-1]['dudas']
        ult = None
        for f in sc['feats']:
            nv, deduc = nivel_rasgo(f['n'], sc['filas'], f['lineas'])
            du = []
            if nv is None:
                nv = ult or 3; du.append('nivel no encontrado: se supone %s' % nv)
            elif deduc:
                du.append('nivel deducido del texto: compruébalo')
            if f['hid']: du.append('título leído con OCR: compruébalo')
            html = E.html(E.parrafos(f['lineas']))
            if len(html) < 40: du.append('texto muy corto: puede faltar parte')
            ult = nv
            x = {'n': '%s (%s: %s)' % (f['n'], cls, sub), 'base': f['n'], 'cls': cls, 'sub': sub, 'nv': nv, 'tipo': 'Rasgo de subclase', 'pg': pg(f['p']), 'd': html, 'pend': True}
            if du: x['dudas'] = du
            out.append(x)
        print('-', pg(sc['p']), cls, '|', sub, '|', [(f['n'], nv_) for f, nv_ in ((f, nivel_rasgo(f['n'], sc['filas'], f['lineas'])[0]) for f in sc['feats'])], '| faltan', sc.get('faltan'))
    base = {}
    if os.path.exists(salida):
        base = json.load(open(salida, encoding='utf-8'))
    base['libro'] = libro; base['abrev'] = abrev
    base['rasgos'] = out
    json.dump(base, open(salida, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('rasgos', len(out), '->', salida)


if __name__ == '__main__':
    main()
