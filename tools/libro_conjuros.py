#!/usr/bin/env python
"""Conjuros de un libro con texto (Guía de Xanathar, Caldero de Tasha…) a módulo JSON para «Mi copia».

Solo para uso personal: el resultado va a datos/privado/ (fuera de git) y no debe publicarse.
Uso: python tools/libro_conjuros.py <pdf> <spells-5etools.json> <FUENTE> <modulo> <abrev> <salida.json>
Lee el texto del PDF (sin OCR), separa cada conjuro por su línea «Evocación de 2.º nivel» / «Truco de …» y empareja
con 5etools (nombre en inglés, clases, comprobación de nivel/escuela) para completar lo que el PDF no dice.
Todo sale con pend:true; lo dudoso lleva «dudas».
"""
import sys, os, re, json, unicodedata
import pymupdf

SCH = {'abjuracion': ('abjuracion', 'A'), 'conjuracion': ('conjuracion', 'C'), 'adivinacion': ('adivinacion', 'D'),
       'encantamiento': ('encantamiento', 'E'), 'evocacion': ('evocacion', 'V'), 'ilusion': ('ilusionismo', 'I'),
       'ilusionismo': ('ilusionismo', 'I'), 'nigromancia': ('nigromancia', 'N'), 'transmutacion': ('transmutacion', 'T')}
CLS = {'Artificer': 'Artífice', 'Bard': 'Bardo', 'Cleric': 'Clérigo', 'Druid': 'Druida', 'Paladin': 'Paladín', 'Ranger': 'Explorador',
       'Sorcerer': 'Hechicero', 'Warlock': 'Brujo', 'Wizard': 'Mago'}
SCH_RE = r'(abjuracion|conjuracion|adivinacion|encantamiento|evocacion|ilusionismo|ilusion|nigromancia|transmutacion)'
NIVEL = [re.compile(r'^' + SCH_RE + r' de (\d)\W{0,4}\s*nivel(\s*\(ritual\))?$'),
         re.compile(r'^' + SCH_RE + r' nivel (\d)(\s*\(ritual\))?$'),
         re.compile(r'^truco de ' + SCH_RE + r'()(\s*\(ritual\))?$'),
         re.compile(r'^truco ' + SCH_RE + r'()(\s*\(ritual\))?$'),
         re.compile(r'^' + SCH_RE + r'()\s*\(truco\)(\s*\(ritual\))?$')]
DUR = re.compile(r'^(Instant[aá]nea|Concentraci[oó]n,\s*hasta\s+\S+\s+\S+|Hasta que se disipe(?: o se desencadene)?|Especial|'
                 r'\d+\s+(?:rondas?|minutos?|horas?|d[ií]as?)|Hasta que se disipe)', re.I)
LABELS = [('ct', 'Tiempo de lanzamiento:'), ('rg', 'Alcance:'), ('comp', 'Componentes:'), ('dur', 'Duración:')]


def fold(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').lower().strip()


def lineas(d, p):
    """Líneas de la página en orden de lectura (columna izquierda y luego derecha), sin cabeceras ni pies."""
    pg = d[p - 1]
    W, H = pg.rect.width, pg.rect.height
    out, num = [], None
    for b in pg.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            sp = l['spans']
            t = ''.join(s['text'] for s in sp).replace(chr(0xf0b7), '•').replace('·', '•')
            x0, y0, x1, y1 = l['bbox']
            if not t.strip() and not any(s_['size'] > 11 for s_ in sp):
                continue
            pie = y0 < 40 or y0 > H - 45 or ('|' in t and len(t) < 70 and (re.match(r'^\s*\d{1,3}\s', t) or re.search(r'\s\d{1,3}\s*$', t)))
            if pie:
                m = re.match(r'^\s*(\d{1,3})(?!\d)', t) or re.search(r'(?<!\d)(\d{1,3})\s*$', t)
                if m: num = int(m.group(1))
                continue
            s0 = max(sp, key=lambda s: len(s['text']))
            out.append({'t': t.rstrip(), 'x0': x0, 'x1': x1, 'y': y0, 'size': round(s0['size'], 1), 'font': s0['font'],
                        'bold': 'bold' in s0['font'].lower() or any('bold' in s['font'].lower() for s in sp[:1]), 'col': 0 if x0 < W / 2 - 5 else 1, 'p': p})
    out.sort(key=lambda r: (r['col'], r['y']))
    return out, num


def une(lines):
    """Junta líneas en párrafos: guiones de fin de línea, viñetas y líneas cortas."""
    if not lines:
        return ''
    maxx, minx = {}, {}
    for r in lines:
        k = (r['p'], r['col'])
        maxx[k] = max(maxx.get(k, 0), r['x1']); minx[k] = min(minx.get(k, 999), r['x0'])
    llenas = sum(1 for r in lines if r['x1'] >= maxx[(r['p'], r['col'])] - 3)
    justificado = llenas / len(lines) > 0.45
    paras, cur, prev = [], '', None
    for r in lines:
        t = r['t'].strip()
        if t == '•':
            if cur: paras.append(cur)
            cur = '• '; prev = None; continue
        nuevo = False
        if prev is not None:
            sangria = r['x0'] > minx[(r['p'], r['col'])] + 4 and r['x0'] > prev['x0'] + 4
            corta = prev['x1'] < maxx[(prev['p'], prev['col'])] - 18
            nuevo = (corta if justificado else sangria) or re.match(r'^(A niveles superiores|En niveles superiores)', t) is not None
        if cur.endswith('• ') and prev is None:
            cur += t
        elif prev is None or nuevo:
            if cur and not cur.endswith('• '): paras.append(cur)
            cur = t
        elif cur.endswith('-') and t[:1].islower():
            cur = cur[:-1] + t
        else:
            cur += ' ' + t
        prev = r
    if cur: paras.append(cur)
    return '\n'.join(p.strip() for p in paras if p.strip())


PEQ = {'de', 'del', 'la', 'el', 'los', 'las', 'a', 'y', 'en', 'con', 'un', 'una', 'por', 'para', 'al', 'o', 'e'}


def nombre_es(n, en):
    """Los títulos vienen en versalitas (cada palabra con mayúscula): en español solo la primera y los nombres propios del original."""
    propios = {fold(w.strip("'s")) for w in re.findall(r"[A-Za-z'-]+", en or '') if w[:1].isupper()}
    out = []
    for i, w in enumerate(n.split()):
        base = fold(re.sub(r"[^\w'-]", '', w))
        w = w.lower()
        out.append(w[:1].upper() + w[1:] if i == 0 or (base in propios and len(base) > 3) else w)
    return ' '.join(out)


def ocr_titulo(d, p, x0, y0, alto=19):
    """Algún título viene como dibujo, no como texto: se recorta y se lee con el OCR de Windows."""
    import tempfile, subprocess, shutil
    tmp = tempfile.mkdtemp(prefix='tit_')
    try:
        d[p - 1].get_pixmap(dpi=300, clip=pymupdf.Rect(x0 - 6, y0 - 3, x0 + 265, y0 + alto - 3)).save(os.path.join(tmp, 't.png'))
        ps = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ocr_lote.ps1')
        subprocess.run(['powershell', '-NoProfile', '-File', ps, tmp, os.path.join(tmp, 'o.json')], check=True, capture_output=True)
        with open(os.path.join(tmp, 'o.json'), encoding='utf-8-sig') as f:
            r = json.load(f)
        ls = r.get('t') or []
        return ls[0]['t'] if ls else ''
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def parsea(d, pi, pf):
    L, nums = [], {}
    for p in range(pi, pf + 1):
        ls, n = lineas(d, p)
        nums[p] = n
        L += ls
    # índices de las líneas de nivel/escuela
    marcas = []
    for i, r in enumerate(L):
        f = fold(re.sub(r'[º°ª]', '', r['t'])).strip()
        for k, rx in enumerate(NIVEL):
            m = rx.match(f)
            if m and r['size'] <= 11:
                lv = 0 if k >= 2 else int(m.group(2))
                marcas.append((i, SCH[m.group(1)][0], lv, bool(m.group(3))))
                break
    res = []
    for j, (i, sch, lv, rit) in enumerate(marcas):
        # nombre: líneas anteriores con la misma tipografía que la inmediatamente anterior
        k = i - 1; nombre = []
        if k >= 0:
            ref = (L[k]['font'], L[k]['size'])
            while k >= 0 and L[k]['size'] > L[i]['size'] + 0.5 and (L[k]['font'], L[k]['size']) == ref and L[k]['col'] == L[i]['col'] and (not nombre or nombre[0]['y'] - L[k]['y'] < 22):
                nombre.insert(0, L[k]); k -= 1
        ini = k + 1
        fin = (marcas[j + 1][0] - 1) if j + 1 < len(marcas) else len(L)
        # el nombre del siguiente conjuro no es cuerpo de este
        if j + 1 < len(marcas):
            kk = marcas[j + 1][0] - 1
            if kk >= 0:
                ref = (L[kk]['font'], L[kk]['size']); tam = 0
                while kk >= 0 and L[kk]['size'] > L[kk + 1 if kk + 1 < len(L) else kk]['size'] + 0.5 and (L[kk]['font'], L[kk]['size']) == ref and tam < 3 and kk > i:
                    kk -= 1; tam += 1
                fin = kk
        n = re.sub(r'\s+', ' ', ' '.join(x['t'].strip() for x in nombre)).strip()
        ocr = False
        if not n and i > 0 and L[i - 1]['size'] > L[i]['size'] + 0.5:
            n = ocr_titulo(d, L[i - 1]['p'], L[i - 1]['x0'], L[i - 1]['y']).strip(); ocr = bool(n)
        elif not n and L[i]['y'] > 30:
            n = ocr_titulo(d, L[i]['p'], L[i]['x0'], L[i]['y'] - 20, 24).strip(); ocr = bool(n)
        cuerpo = L[i + 1:fin + 1]
        campos = {}; actual = None; resto = []
        for r in cuerpo:
            t = r['t'].strip()
            lab = next((c for c, l in LABELS if t.startswith(l)), None)
            if lab:
                actual = lab; campos[lab] = t.split(':', 1)[1].strip(); continue
            if actual and actual != 'dur' and not campos.get('dur') and not resto:
                campos[actual] += ' ' + t; continue
            if actual == 'dur' and not resto and not campos.get('dur_listo'):
                # lo que sigue a «Duración:» ya es el cuerpo
                campos['dur_listo'] = '1'
            resto.append(r)
        dur = campos.get('dur', ''); extra = ''
        m = DUR.match(dur)
        if m and m.end() < len(dur):
            extra = dur[m.end():].strip(); dur = dur[:m.end()].strip()
        elif not m:
            m2 = re.match(r'^(.{3,40}?[a-záéíóúñ0-9])\s+([A-ZÁÉÍÓÚ].*)$', dur)
            if m2: dur, extra = m2.group(1), m2.group(2)
        txt = une(([{'t': extra, 'x0': 0, 'x1': 999, 'y': 0, 'p': 0, 'col': 0}] if extra else []) + resto)
        pgn = nums.get(nombre[0]['p'] if nombre else L[i]['p'])
        res.append({'_ocr': ocr, 'n': n, 'lv': lv, 'sch': sch, 'rit': rit or 'ritual' in fold(campos.get('ct', '')), 'ct': campos.get('ct', ''), 'rg': campos.get('rg', ''),
                    'comp': campos.get('comp', ''), 'dur': dur, 'conc': 'concentracion' in fold(dur), 'd': txt, '_pdf': (nombre[0]['p'] if nombre else L[i]['p']), 'pg': pgn})
    return res


def aplana(e):
    if isinstance(e, str): return e
    if isinstance(e, list): return ' '.join(aplana(x) for x in e)
    if isinstance(e, dict):
        return ' '.join(aplana(v) for k, v in e.items() if k in ('entries', 'items', 'entry', 'rows', 'caption', 'name') or isinstance(v, (list, dict)))
    return ''


def nums_de(t):
    return set(re.findall(r'\d+d\d+|\d+', t.lower()))


def empareja(es, en):
    for x in en:
        x['_n'] = nums_de(aplana(x.get('entries', [])) + ' ' + aplana(x.get('entriesHigherLevel', [])))
        x['_c'] = any(d.get('concentration') for d in x.get('duration', []))
        x['_t'] = x['time'][0]['unit'] if x.get('time') else ''
    cand = []
    for i, s in enumerate(es):
        ns = nums_de(s['d'])
        for j, x in enumerate(en):
            if x['level'] != s['lv'] or x['school'] != SCH[s['sch']][1]:
                continue
            sc = 10.0 + (3 if x['_c'] == s['conc'] else 0)
            ct = fold(s['ct'])
            u = {'action': 'accion', 'bonus': 'accion adicional', 'reaction': 'reaccion', 'minute': 'minuto', 'hour': 'hora'}.get(x['_t'], '')
            if u and u in ct: sc += 2
            if ns or x['_n']:
                sc += 6 * len(ns & x['_n']) / max(1, len(ns | x['_n']))
            cand.append((sc, i, j))
    cand.sort(reverse=True)
    uso_i, uso_j, par = set(), set(), {}
    for sc, i, j in cand:
        if i in uso_i or j in uso_j: continue
        uso_i.add(i); uso_j.add(j); par[i] = (j, sc)
    return par


def main():
    pdf, f5, fuente, modulo, ab, salida = sys.argv[1:7]
    d = pymupdf.open(pdf)
    pags = [p for p in range(1, d.page_count + 1) if 'Tiempo de lanzamiento' in d[p - 1].get_text()]
    pi, pf = pags[0], pags[-1]
    # el primer conjuro puede empezar en la página anterior
    es = parsea(d, max(1, pi - 1), pf)
    with open(f5, encoding='utf-8') as f:
        en = [x for x in json.load(f)['spell'] if x.get('source') == fuente]
    global SRC
    SRC = json.load(open(os.path.join(os.path.dirname(f5), 'spells-sources.json'), encoding='utf-8')).get(fuente, {})
    par = empareja(es, en)
    out = []; dudosos = 0
    for i, s in enumerate(es):
        dudas = []
        if i in par:
            j, sc = par[i]; x = en[j]
            s['en'] = x['name']
            o = SRC.get(x['name'], {})
            cls = [CLS[c['name']] for c in (o.get('class', []) + o.get('classVariant', [])) if c['name'] in CLS]
            s['cls'] = sorted(set(cls))
            if sc < 14: dudas.append('emparejado con «%s» con poca seguridad' % x['name'])
        else:
            s['en'] = ''; s['cls'] = []; dudas.append('sin pareja en 5etools')
        if not s['n']: dudas.append('nombre vacío')
        if not s['ct'] or not s['rg'] or not s['comp'] or not s['dur']: dudas.append('falta algún campo (lanzamiento, alcance, componentes o duración)')
        if len(s['d']) < 40: dudas.append('descripción muy corta')
        s['pend'] = True
        if s.pop('_ocr', False): dudas.append('el título estaba dibujado, no escrito: leído con OCR, compruébalo')
        s['n'] = re.sub(r't asha', 'Tasha', nombre_es(s['n'], s['en']), flags=re.I)
        if dudas: s['dudas'] = dudas; dudosos += 1
        s['pg'] = s['pg'] if s['pg'] else ''
        s.pop('_pdf', None)
        out.append(s)
    sin = [x['name'] for j, x in enumerate(en) if j not in {v[0] for v in par.values()}]
    modj = {'modulo': modulo, 'abrev': ab, 'version': '2024' if fuente == 'XPHB' else '2017', 'conjuros': out}
    with open(salida, 'w', encoding='utf-8') as f:
        json.dump(modj, f, ensure_ascii=False, indent=1)
    print(f'{len(out)} conjuros en el PDF · {len(en)} en 5etools · {dudosos} con dudas · sin pareja en el PDF: {sin}')


if __name__ == '__main__':
    main()
