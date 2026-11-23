#!/usr/bin/env python
"""Objetos mágicos de Xanathar y de Tasha (PDF con texto, títulos a veces dibujados) → objetos pendientes de revisar.

Solo uso personal: la salida va a datos/privado/ (fuera de git).
Uso: python tools/libro_objetos_xt.py <pdf> <pag_ini> <pag_fin> <salida.json> [PAGOFF]
Cada objeto lleva una línea de tipo y rareza («Objeto maravilloso, raro (requiere sintonización)»); el título está justo encima
(texto de 13 pt o dibujado, leído con OCR) y el cuerpo llega hasta el siguiente título.
"""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pymupdf
import libro_entradas as E
import libro_subclases_xt as X

RX_TIPO = re.compile(r'^(Objeto maravilloso|Arma|Armadura|Poci[oó]n|Pergamino|Anillo|Vara|Varita|Bast[oó]n|Munici[oó]n)\b.*?,\s*(com[uú]n|infrecuente|rar[oa]|muy rar[oa]|legendari[oa]|artefacto|rareza|var)', re.I)


def parte_tipo(txt):
    txt = txt.replace('*', '').strip()
    s = ''
    m = re.search(r'\((requiere[^)]*)\)\s*$', txt, re.I)
    if m:
        s = re.sub(r'requiere (?:la )?sintonizaci[oó]n (?:de|con) ', 'requiere sintonización por parte de ', m.group(1).strip(), flags=re.I); txt = txt[:m.start()].strip()
    prof, cut = 0, None
    for i, c in enumerate(txt):
        if c == '(': prof += 1
        elif c == ')': prof -= 1
        elif c == ',' and prof == 0:
            cut = i; break
    if cut is None:
        return txt, '', s
    t, r = txt[:cut].strip(), txt[cut + 1:].strip().lower()
    if not re.match(r'(com[uú]n|infrecuente|rar[oa]|muy rar|legendari|artefacto|rareza)', r) and ',' in r:   # «Arma (hoz), arma cuerpo a cuerpo, infrecuente…»
        t2, r = r.split(',', 1); t = t + ', ' + t2.strip(); r = r.strip()
    return t, r, s


def main():
    pdf, a, b, salida = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
    pagoff = int(sys.argv[5]) if len(sys.argv) > 5 else 2
    d = pymupdf.open(pdf)
    L = X.flujo(d, a, b)
    H = X.huecos(L)
    por = {}
    for r in L:
        if not r.get('img'):
            por.setdefault((r['p'], r['col']), []).append(r)
    for (pp, col), ls in por.items():       # título dibujado arriba de una columna
        r0 = min(ls, key=lambda r: r['y'])
        if 62 < r0['y'] < 110 and r0['size'] < 11 and RX_TIPO.match(r0['t']) is None:
            if not any(abs(h['y'] - (r0['y'] - 12)) < 20 and h['p'] == pp and h['col'] == col for h in H):
                H.append({'p': pp, 'col': col, 'y': r0['y'] - 12, 'y0': r0['y'] - 26, 'y1': r0['y'], 'x0': r0['x0'], 'img': False, 'hid': True, 'size': 0, 't': '', 'x1': r0['x0'] + 250})
    X.ocr_lote(d, H)
    H = [h for h in H if X.titulo_ocr(h['t'])]
    items = [r for r in L if not r.get('img')] + H
    items.sort(key=lambda r: (r['p'], r['col'], r['y']))
    # anclas: líneas de tipo/rareza (puede ocupar dos líneas)
    anclas = []
    k = 0
    while k < len(items):
        r = items[k]
        if not r.get('hid') and r['size'] < 11 and RX_TIPO.match(r['t']) and r['t'][:1].isupper():
            txt, j = r['t'], k
            if txt.count('(') > txt.count(')') and k + 1 < len(items):
                j = k + 1; txt += ' ' + items[j]['t']
            anclas.append((k, j, txt)); k = j + 1; continue
        k += 1
    # título de cada ancla: lo que tiene justo encima
    extra = []
    tit = {}
    for (k, j, txt) in anclas:
        r = items[k]
        pr = items[k - 1] if k else None
        if pr and pr['p'] == r['p'] and pr['col'] == r['col'] and r['y'] - pr['y'] < 48 and (pr.get('hid') or 12 <= pr['size'] < 19):
            tit[k] = (pr, k - 1)
        else:
            e = {'p': r['p'], 'col': r['col'], 'y': r['y'] - 12, 'y0': r['y'] - 28, 'y1': r['y'] - 3, 'x0': r['x0'], 'img': False, 'hid': True, 'size': 0, 't': '', 'x1': r['x0'] + 250}
            extra.append((k, e))
    if extra:
        X.ocr_lote(d, [e for _, e in extra])
        for k, e in extra:
            tit[k] = (e, None)
    pnum = {}
    for r in L:
        if r.get('num'): pnum[r['p']] = r['num']
    out = []
    for n, (k, j, txt) in enumerate(anclas):
        pr, pj = tit[k]
        if pr.get('hid'):
            nom = X.limpia_ocr(pr['t']) or '(título ilegible)'
        else:
            nom = E.titulo_bonito(pr['t'])
        # el cuerpo llega hasta el título del siguiente objeto
        fin = len(items)
        if n + 1 < len(anclas):
            k2 = anclas[n + 1][0]; p2, pj2 = tit[k2]
            fin = pj2 if pj2 is not None else k2
        cuerpo = [r for r in items[j + 1:fin] if not r.get('hid')]
        t, ra, s = parte_tipo(txt)
        html = E.html(E.parrafos(cuerpo))
        du = ['texto leído de un PDF con maquetación compleja: compruébalo con el libro']
        if pr.get('hid'): du.append('título leído con OCR: compruébalo')
        if not ra: du.append('no se pudo separar la rareza: compruébala')
        if len(html) < 60: du.append('texto muy corto: puede faltar parte')
        out.append({'n': nom, 't': t, 'r': ra, 's': s, 'k': 'magico', 'd': html, 'pg': str(pnum.get(items[k]['p']) or items[k]['p'] - pagoff), 'pend': True, 'dudas': du})
    for x in out:
        print(x['pg'], '|', x['n'], '|', x['t'], '|', x['r'], '|', x['s'][:30], '|', len(x['d']), x['dudas'][1:])
    json.dump({'objetos': out}, open(salida, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(out), 'objetos')


if __name__ == '__main__':
    main()
