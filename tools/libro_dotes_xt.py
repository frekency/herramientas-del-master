#!/usr/bin/env python
"""Dotes de Xanathar y de Tasha (PDF con texto, títulos a veces dibujados) → dotes pendientes de revisar.

Solo uso personal: la salida va a datos/privado/ (fuera de git).
Uso: python tools/libro_dotes_xt.py <pdf> <pag_ini> <pag_fin> <categoria> <salida.json> [PAGOFF]
Cada dote empieza en un título (texto de 15 pt o hueco dibujado leído con OCR); «Requisito(s) Previo(s):» da el requisito.
"""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pymupdf
import libro_entradas as E
import libro_subclases_xt as X


def main():
    pdf, a, b, cat, salida = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], sys.argv[5]
    pagoff = int(sys.argv[6]) if len(sys.argv) > 6 else 2
    d = pymupdf.open(pdf)
    L = X.flujo(d, a, b)
    H = X.huecos(L)
    por = {}
    for r in L:
        if not r.get('img'):
            por.setdefault((r['p'], r['col']), []).append(r)
    for (pp, col), ls in por.items():       # título dibujado arriba de una columna: sin hueco con la línea anterior
        r0 = min(ls, key=lambda r: r['y'])
        if 62 < r0['y'] < 110 and r0['size'] < 11 and not r0['t'].startswith('•'):
            if not any(abs(h['y'] - (r0['y'] - 12)) < 20 and h['p'] == pp and h['col'] == col for h in H):
                H.append({'p': pp, 'col': col, 'y': r0['y'] - 12, 'y0': r0['y'] - 26, 'y1': r0['y'], 'x0': r0['x0'], 'img': False, 'hid': True, 'size': 0, 't': '', 'x1': r0['x0'] + 250})
    X.ocr_lote(d, H)
    H = [h for h in H if X.titulo_ocr(h['t']) or (not h['img'] and not h['t'] and h['y1'] - h['y0'] >= 28)]   # un título que el OCR no lee: se deja con su hueco
    items = [r for r in L if not r.get('img')] + H
    items.sort(key=lambda r: (r['p'], r['col'], r['y']))
    # un «Requisito previo» sin título justo encima: el título (dibujado) está pegado arriba, al borde de la columna
    extra = []
    for k, r in enumerate(items):
        if not r.get('hid') and re.match(r'^Requisitos?( [Pp]revios?)?\s*:', r['t']):
            prev = items[k - 1] if k else None
            if not (prev and prev['p'] == r['p'] and prev['col'] == r['col'] and r['y'] - prev['y'] < 40 and (prev.get('hid') or prev['size'] >= 14.5)):
                extra.append({'p': r['p'], 'col': r['col'], 'y': r['y'] - 12, 'y0': r['y'] - 28, 'y1': r['y'] - 4, 'x0': r['x0'], 'img': False, 'hid': True, 'size': 0, 't': '', 'x1': r['x0'] + 250})
    if extra:
        X.ocr_lote(d, extra)
        items += [h for h in extra if X.titulo_ocr(h['t'])]
        items.sort(key=lambda r: (r['p'], r['col'], r['y']))
    marcas = []
    for k, r in enumerate(items):
        if r.get('hid'):
            marcas.append((k, X.limpia_ocr(r['t']) or '(título ilegible)', True))
        elif r['size'] >= 14.5 and len(r['t']) < 60:
            marcas.append((k, E.titulo_bonito(r['t']), False))
    pnum = {}
    for r in L:
        if r.get('num'): pnum[r['p']] = r['num']
    out = []
    for i, (k, nom, hid) in enumerate(marcas):
        fin = marcas[i + 1][0] if i + 1 < len(marcas) else len(items)
        cuerpo = [r for r in items[k + 1:fin] if not r.get('hid')]
        req = ''
        if cuerpo and re.match(r'^Requisitos?( [Pp]revios?)?\s*:', cuerpo[0]['t']):
            req = re.sub(r'^Requisitos?( [Pp]revios?)?\s*:\s*', '', cuerpo[0]['t']); cuerpo = cuerpo[1:]
            while cuerpo and cuerpo[0]['t'][:1].islower() and len(req) < 120 and not cuerpo[0]['t'].startswith('Tienes'):
                req += ' ' + cuerpo[0]['t']; cuerpo = cuerpo[1:]
        if not cuerpo:
            continue
        html = E.html(E.parrafos(cuerpo))
        du = ['texto leído de un PDF con maquetación compleja: compruébalo con el libro']
        if hid: du.append('título leído con OCR: compruébalo')
        if len(html) < 120: du.append('texto muy corto: puede faltar parte')
        out.append({'n': nom, 'cat': cat, 'req': req.strip().rstrip('.'), 'd': html, 'pg': str(pnum.get(items[k]['p']) or items[k]['p'] - pagoff), 'pend': True, 'dudas': du})
    for x in out:
        print(x['pg'], '|', x['n'], '|', x['req'], '|', len(x['d']), x['dudas'][1:] )
    json.dump({'dotes': out}, open(salida, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(out), 'dotes')


if __name__ == '__main__':
    main()
