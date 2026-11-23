#!/usr/bin/env python
"""Tablas de nombres del Apéndice B de la Guía de Xanathar (d100 con rangos «01-02» y el nombre al lado) → «tablas» de un módulo.

Solo uso personal: la salida va a datos/privado/ (fuera de git).
Uso: python tools/libro_tablas_nombres_xge.py <pdf> <pag_ini> <pag_fin> <modulo.json> [offset=1]
Las listas de 50 filas fluyen por columnas (y páginas): la segunda mitad no lleva cabecera. Se recorren las columnas de izquierda a derecha;
un rango que empieza en 01 abre una tabla nueva (su título es el texto de 12 pt en mayúsculas encima de esa columna) y cualquier otro
continúa la anterior. El nombre es el texto a la derecha del rango (varias líneas se unen).
"""
import sys, re, json, collections
import pymupdf

RX_R = re.compile(r'^(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?$')


def main():
    pdf, a, b, modulo = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
    off = int(sys.argv[5]) if len(sys.argv) > 5 else 1
    d = pymupdf.open(pdf)
    tablas, cur = [], None
    for p in range(a, b + 1):
        pg = d[p - 1]
        L = []
        for bl in pg.get_text('dict')['blocks']:
            for l in bl.get('lines', []):
                t = ''.join(s['text'] for s in l['spans']).strip()
                if t:
                    L.append({'x': l['bbox'][0], 'x1': l['bbox'][2], 'y': l['bbox'][1], 'y1': l['bbox'][3], 't': t, 'sz': max(s['size'] for s in l['spans'])})
        rangos = [l for l in L if abs(l['sz'] - 11) < 0.6 and RX_R.match(l['t']) and l['y'] > 60 and l['y'] < 740]
        xs = sorted({round(l['x'] / 10) * 10 for l in rangos})
        # agrupa columnas cercanas (±15)
        cols = []
        for x in xs:
            if cols and x - cols[-1][-1] <= 15:
                cols[-1].append(x)
            else:
                cols.append([x])
        titulos = [l for l in L if 11.5 < l['sz'] < 13 and l['t'].upper() == l['t'] and len(l['t']) > 3]
        for cx in cols:
            x0 = min(cx) - 8
            x1 = max(cx) + 8
            R = sorted([l for l in rangos if x0 <= l['x'] <= x1], key=lambda l: l['y'])
            for i, r in enumerate(R):
                m = RX_R.match(r['t'])
                lo = int(m.group(1)); hi = int(m.group(2)) if m.group(2) else lo
                lo = 100 if lo == 0 else lo
                hi = 100 if hi == 0 else hi
                ynext = R[i + 1]['y'] - 1 if i + 1 < len(R) else r['y1'] + 8
                cel = [l for l in L if r['y'] - 3 <= l['y'] < ynext and l['x'] > r['x1'] + 3 and l['x'] < r['x'] + 140 and l is not r and abs(l['sz'] - 11) < 0.6]
                nom = re.sub(r'\s+', ' ', ' '.join(l['t'] for l in sorted(cel, key=lambda l: (l['y'], l['x'])))).strip()
                if lo <= 2 and (cur is None or cur['ult'] >= 90 or lo == 1):
                    tt = [t for t in titulos if abs(t['x'] - r['x']) < 30 and t['y'] < r['y'] and r['y'] - t['y'] < 55]
                    tit = max(tt, key=lambda t: t['y'])['t'] if tt else ''
                    cur = {'n': tit, 'pg': p - off, 'res': [''] * 100, 'ult': 0, 'pos': None if tit else [p, r['x'] - 6, r['y'] - 14, r['x'] + 112]}
                    tablas.append(cur)
                if cur is None:
                    continue
                for k in range(lo, min(hi, 100) + 1):
                    cur['res'][k - 1] = nom
                cur['ult'] = hi
    res = []
    for t in tablas:
        falta = sum(1 for v in t['res'] if not v)
        n = t['n'].title() if t['n'] else 'Tabla de nombres, p. %d' % t['pg']
        n = n.replace(' De ', ' de ')
        base = 'Nombres: ' + n
        k = 2
        while any(r['n'] == base for r in res):
            base = 'Nombres: %s (%d)' % (n, k)
            k += 1
        du = ['tabla leída de un PDF: compruébala con el libro'] + (['faltan resultados del dado (%d de 100): compruébala con el libro' % falta] if falta else []) + ([] if t['n'] else ['no se encontró el título: se le ha puesto uno provisional'])
        res.append({'n': base, 'cat': 'Xanathar: Nombres', 'columnas': {'Nombre': t['res']}, 'modo': 'columna', 'pg': str(t['pg']), 'pend': True, 'dudas': du, '_pos': t['pos']})
        print(t['pg'], '|', base, '| faltan', falta)
    m = json.load(open(modulo, encoding='utf-8'))
    ya = {x['n'] for x in res}
    m['tablas'] = [x for x in m.get('tablas', []) if x['n'] not in ya and x.get('cat') != 'Xanathar: Nombres'] + res
    json.dump(m, open(modulo, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(res), 'tablas ->', modulo)


if __name__ == '__main__':
    main()
