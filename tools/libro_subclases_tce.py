#!/usr/bin/env python
"""Subclases del Caldero de Tasha → rasgos para un módulo de «Mi copia».

Solo uso personal: la salida va a datos/privado/ (fuera de git).
Uso: python tools/libro_subclases_tce.py <pdf> <pag_ini> <pag_fin> <salida.json>
En Tasha casi todos los títulos están dibujados; cada rasgo lleva debajo una línea «Rasgo de la Senda de la Bestia de nivel 3»
que da subclase y nivel. El título del rasgo y el de la subclase se leen con el OCR de Windows (recorte del hueco).
"""
import sys, os, re, json, difflib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pymupdf
import libro_entradas as E
import libro_subclases_xt as X

RX = re.compile(r'^Rasgo (?:de la |del |de los |de las |de )(.+?) de nivel (\d{1,2})\b', re.I)
CLASES_ES = {'barbaro', 'bardo', 'brujo', 'clerigo', 'druida', 'explorador', 'guerrero', 'hechicero', 'mago', 'monje', 'paladin', 'picaro', 'artificiero', 'artifice'}
PAGOFF = int(os.environ.get('PAGOFF', '2'))


def corrige(w, vocab):
    f = E.fold(w.strip(':,'))
    if len(f) < 4 or f in vocab or not f.isalpha():
        return w
    cand = difflib.get_close_matches(f, vocab_lista(vocab), 1, 0.7)
    return (cand[0] if cand else w)


_VL = {}


def vocab_lista(vocab):
    if id(vocab) not in _VL:
        _VL[id(vocab)] = sorted(w for w in vocab if len(w) >= 4 and w.isalpha())
    return _VL[id(vocab)]


def ocr_recortes(d, lst, vocab):
    """Lee el título dibujado sobre cada línea con tres resoluciones y se queda con la lectura cuyas palabras más aparecen en el libro."""
    import tempfile, subprocess, shutil
    tmp = tempfile.mkdtemp(prefix='tr_')
    DPIS = (400, 500, 300)
    try:
        for i, (p, x0, y) in enumerate(lst):
            for dp in DPIS:
                d[p - 1].get_pixmap(dpi=dp, clip=pymupdf.Rect(x0 - 6, y - 27, x0 + 270, y - 2)).save(os.path.join(tmp, 'r%04d_%d.png' % (i, dp)))
        ps = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ocr_lote.ps1')
        subprocess.run(['powershell', '-NoProfile', '-File', ps, tmp, os.path.join(tmp, 'o.json')], check=True, capture_output=True)
        with open(os.path.join(tmp, 'o.json'), encoding='utf-8-sig') as f:
            r = json.load(f)
        out = []
        for i in range(len(lst)):
            mejor, sc = '', -1
            for dp in DPIS:
                ls = r.get('r%04d_%d' % (i, dp)) or []
                ls = sorted(ls, key=lambda x: -(x.get('y1', 0) - x.get('y', 0)))
                t = X.limpia_ocr(ls[0]['t']) if ls else ''
                if len(t) < 3:
                    continue
                pal = [E.fold(w) for w in re.split(r'[\s:,]+', t) if w]
                pt = sum(1 for w in pal if w in vocab) / max(1, len(pal))
                if pt > sc:
                    mejor, sc = t, pt
            out.append(mejor)
        return out
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


CLASE_POR = [('alquimista', 'Artífice'), ('armero', 'Artífice'), ('artillero', 'Artífice'), ('herrero de batalla', 'Artífice'), ('senor de las bestias', 'Explorador'), ('creacion', 'Bardo'), ('elocuencia', 'Bardo'), ('bestia', 'Bárbaro'), ('magia salvaje', 'Bárbaro'), ('genio', 'Brujo'), ('insondable', 'Brujo'),
             ('paz', 'Clérigo'), ('crepusculo', 'Clérigo'), ('orden', 'Clérigo'), ('esporas', 'Druida'), ('estrellas', 'Druida'), ('fuego salvaje', 'Druida'),
             ('enjambre', 'Explorador'), ('vagabundo', 'Explorador'), ('runico', 'Guerrero'), ('psionico', 'Guerrero'), ('mecanica', 'Hechicero'), ('aberrante', 'Hechicero'),
             ('hoja', 'Mago'), ('escribas', 'Mago'), ('misericordia', 'Monje'), ('astral', 'Monje'), ('gloria', 'Paladín'), ('vigilantes', 'Paladín'),
             ('fantasma', 'Pícaro'), ('cuchillo del alma', 'Pícaro')]


def clase_de(sub):
    f = E.fold(sub)
    for k, c in CLASE_POR:
        if k in f:
            return c
    return None


def atribucion(items, a, b):
    """Índice de la línea de atribución de la cita («TASHA») entre a y b, o None."""
    for j in range(b - 1, a - 1, -1):
        r = items[j]
        if not r.get('hid') and 10.4 <= r['size'] <= 12.5 and r['t'].isupper() and len(r['t']) <= 32 and '.' not in r['t']:
            return j
    return None


def main():
    pdf, a, b, salida = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
    d = pymupdf.open(pdf)
    L = X.flujo(d, a, b)
    H = X.huecos(L)
    H = [h for h in H if h['img'] or True]
    X.ocr_lote(d, H)
    H = [h for h in H if X.titulo_ocr(h['t'])]
    items = [r for r in L if not r.get('img')] + H
    items.sort(key=lambda r: (r['p'], r['col'], r['y']))
    if os.environ.get('HASTA'):      # «pagina:y»: se descarta lo que viene después (p. ej. el inicio de otra sección)
        hp, hy = os.environ['HASTA'].split(':')
        items = [r for r in items if (r['p'], r['y']) < (int(hp), float(hy))]
    marcas = []      # (índice, subclase, nivel)
    for k, r in enumerate(items):
        if r.get('hid'):
            continue
        m = RX.match(r['t'])
        if m:
            sub = re.sub(r'\s+', ' ', m.group(1)).strip()
            if E.fold(sub) in CLASES_ES:
                continue
            marcas.append((k, sub, int(m.group(2))))
    print(len(marcas), 'rasgos de subclase')
    vocab = {E.fold(w) for r in items if not r.get('hid') for w in re.split(r'\W+', r['t']) if len(w) > 1}
    tit = ocr_recortes(d, [(items[k]['p'], items[k]['x0'], items[k]['y']) for k, _, _ in marcas], vocab)
    # el título del rasgo: el hueco dibujado justo encima de la línea «Rasgo de…»
    tdir = {k: tit[i] for i, (k, _, _) in enumerate(marcas)}

    def titulo_de(k):
        if tdir.get(k):
            for j in range(k - 1, max(k - 4, -1), -1):
                if items[j].get('hid') and items[j]['p'] == items[k]['p'] and items[j]['col'] == items[k]['col'] and items[k]['y'] - items[j]['y'] < 40:
                    return tdir[k], items[j]['y'], j
            return tdir[k], items[k]['y'] - 12, k
        for j in range(k - 1, max(k - 4, -1), -1):
            it = items[j]
            if it.get('hid') and it['p'] == items[k]['p'] and it['col'] == items[k]['col'] and items[k]['y'] - it['y'] < 40:
                return X.limpia_ocr(it['t']), it['y'], j
        return None, None, None
    subs = []   # en orden de aparición
    for k, sub, nv in marcas:
        if clase_de(sub) is None:
            continue
        sub = next((q['nombre'] for q in subs if clase_de(q['nombre']) == clase_de(sub) and difflib.SequenceMatcher(None, E.fold(q['nombre']), E.fold(sub)).ratio() > 0.8), sub)
        if not subs or E.fold(subs[-1]['nombre']) != E.fold(sub):
            subs.append({'nombre': sub, 'feats': []})
        t, y, j = titulo_de(k)
        if subs[-1]['feats'] and subs[-1]['feats'][-1]['nv'] == nv and subs[-1]['feats'][-1]['titulo'] == t and t:
            continue
        subs[-1]['feats'].append({'k': k, 'nv': nv, 'titulo': t, 'j': j if j is not None else k, 'hid': True})
    # cortes: la subclase siguiente empieza en su título dibujado (parecido al nombre) o en su primer rasgo
    def hueco_de_sub(nombre, desde, hasta):
        f = E.fold(nombre)
        mejor = None
        for j in range(hasta - 1, desde - 1, -1):
            it = items[j]
            if it.get('hid'):
                g = E.fold(X.limpia_ocr(it['t']))
                if difflib.SequenceMatcher(None, g, f).ratio() >= 0.72 or f in g:
                    mejor = j; break
        return mejor
    res = []
    for si, sb in enumerate(subs):
        f0 = sb['feats'][0]
        prev_fin = sb_prev = subs[si - 1]['feats'][-1]['k'] if si else 0
        jt = hueco_de_sub(sb['nombre'], prev_fin, f0['j'])
        sb['jt'] = jt
        if jt is None and os.environ.get('DBG'):
            print('SIN TITULO', sb['nombre'], [(items[j]['p'], round(items[j]['y']), items[j]['t']) for j in range(prev_fin, f0['j']) if items[j].get('hid')])
    for si, sb in enumerate(subs):
        # introducción: líneas entre el título de la subclase y el título del primer rasgo
        j0, jf = sb['jt'], sb['feats'][0]['j']
        ja = atribucion(items, j0 if j0 is not None else (subs[si - 1]['feats'][-1]['k'] + 1 if si else 0), jf)
        ini_i = (ja + 1) if ja is not None else (j0 + 1 if j0 is not None else None)
        intro = [r for r in items[ini_i:jf] if not r.get('hid')] if ini_i is not None else []
        dudas_sub = [] if j0 is not None else (['no se encontró el título de la subclase: la introducción se delimita por la cita'] if ja is not None else ['no se encontró el título de la subclase: introducción vacía o incompleta'])
        fin_sub = subs[si + 1]['jt'] if si + 1 < len(subs) and subs[si + 1]['jt'] is not None else (subs[si + 1]['feats'][0]['j'] if si + 1 < len(subs) else len(items))
        res.append({'sub': sb['nombre'], 'intro': intro, 'dudas': dudas_sub, 'p': items[j0]['p'] if j0 is not None else (items[ja]['p'] if ja is not None else items[sb['feats'][0]['k']]['p']), 'feats': []})
        for fi, f in enumerate(sb['feats']):
            ini = f['k'] + 1
            fin = sb['feats'][fi + 1]['j'] if fi + 1 < len(sb['feats']) else fin_sub
            cuerpo = [r for r in items[ini:fin] if not r.get('hid')]
            res[-1]['feats'].append({'n': f['titulo'] or '?', 'nv': f['nv'], 'lineas': cuerpo, 'p': items[f['k']]['p']})
    pnum = {}
    for r in L:
        if r.get('num'): pnum[r['p']] = r['num']
    pg = lambda p: str(pnum.get(p) or (p - PAGOFF))
    out = []
    for sc in res:
        sub = E.titulo_bonito(sc['sub'])
        sub = sub[:1].upper() + sub[1:]
        cl = clase_de(sub) or '?'
        out.append({'n': '%s (%s: %s)' % (sub, cl, sub), 'base': sub, 'cls': cl, 'sub': sub, 'nv': None, 'tipo': 'Subclase', 'pg': pg(sc['p']), 'd': E.html(E.parrafos(sc['intro'])), 'pend': True, **({'dudas': sc['dudas']} if sc['dudas'] else {})})
        for f in sc['feats']:
            du = ['título leído con OCR: compruébalo']
            html = E.html(E.parrafos(f['lineas']))
            if len(html) < 40: du.append('texto muy corto: puede faltar parte')
            out.append({'n': '%s (%s: %s)' % (f['n'], cl, sub), 'base': f['n'], 'cls': cl, 'sub': sub, 'nv': f['nv'], 'tipo': 'Rasgo de subclase', 'pg': pg(f['p']), 'd': html, 'pend': True, 'dudas': du})
        print('##', sub, '| intro', len(sc['intro']), sc['dudas'], [(f['nv'], f['n'], len(f['lineas'])) for f in sc['feats']])
    json.dump({'rasgos': out}, open(salida, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('rasgos', len(out), '->', salida)


if __name__ == '__main__':
    main()
