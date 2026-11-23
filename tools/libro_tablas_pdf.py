#!/usr/bin/env python
"""Tablas aleatorias de PDFs con capa de texto y filas sombreadas (Caldero de Tasha, Guía de Xanathar) → «tablas» de un módulo.

Solo uso personal: la salida va a datos/privado/ (fuera de git).
Uso: python tools/libro_tablas_pdf.py <pdf> <pag_ini> <pag_fin> <modulo.json> <etiqueta> [offset_pagina=2]
La maqueta (Homebrewery) pinta las tablas con franjas sombreadas en las filas alternas y pequeños rectángulos verticales entre columnas.
Cada tabla empieza en una línea de cabecera «d6 Contacto» (el dado seguido del nombre de la columna); su anchura y columnas salen de las
franjas y de los rectángulos finos; las filas son cada franja y cada hueco blanco entre franjas (así se unen las líneas de una celda y se
sitúa el número de fila aunque salga centrado). Una tabla sin cabecera pegada a una tabla anterior con las mismas columnas es su
continuación (tablas partidas en dos columnas o páginas). «d20 | Resultado» con rangos («1-2») se expande a un resultado por cada número.
Todo queda pendiente con dudas.
"""
import sys, os, re, json, collections
import pymupdf

RX_DADO = re.compile(r'^\s*d\s*(\d{1,3})\s*$', re.I)
FILA_MAX = 90         # hueco máximo entre franjas dentro de una misma tabla
THIN = 6.5


def lineas_celda(words):
    ws = sorted(words, key=lambda w: (round(w[1] / 3), w[0]))
    out, cur, y = [], [], None
    for w in ws:
        if y is None or abs(w[1] - y) < 3:
            cur.append(w)
            y = w[1] if y is None else y
        else:
            out.append(cur)
            cur, y = [w], w[1]
    if cur:
        out.append(cur)
    return [' '.join(w[4] for w in sorted(l, key=lambda w: w[0])) for l in out]


def en_rect(words, x0, x1, y0, y1):
    return [w for w in words if x0 <= (w[0] + w[2]) / 2 <= x1 and y0 <= (w[1] + w[3]) / 2 <= y1]


def texto(ws):
    return re.sub(r'\s+', ' ', ' '.join(lineas_celda(ws))).strip()


def numeros(ws):
    n = []
    for w in sorted(ws, key=lambda w: w[0]):
        n += [int(m) for m in re.findall(r'\d+', w[4])]
    return n


def cabeceras(words):
    """Palabras «dN» que abren una línea de cabecera (otra palabra de texto a su derecha en la misma línea y nada a su izquierda)."""
    hs = []
    for w in words:
        if not RX_DADO.match(w[4]):
            continue
        misma = [v for v in words if v is not w and abs(v[1] - w[1]) < 3]
        der = [v for v in misma if v[0] >= w[2] - 1 and v[0] - w[2] < 260]
        izq = [v for v in misma if v[2] <= w[0] + 1 and w[0] - v[2] < 12]
        if der and not izq and any(not re.match(r'^[\d(]', v[4]) for v in der):
            hs.append(w)
    return hs


def color_franja(fills):
    c = collections.Counter()
    for r, col in fills:
        if col and not (max(col) < 0.2 or min(col) > 0.97) and r.height > 2:
            c[col] += r.height
    return c.most_common(1)[0][0] if c else None


def franjas_de(fills, col, x0, x1, y_ini):
    """Rectángulos de la franja dentro de [x0, x1] por debajo de y_ini, fusionados en intervalos verticales."""
    rs = sorted((r for r, c in fills if c == col and r.x0 < x1 + 2 and r.x1 > x0 - 2 and r.y0 >= y_ini - 1), key=lambda r: r.y0)
    iv = []
    for r in rs:
        if iv and r.y0 <= iv[-1][1] + 1.5:
            iv[-1][1] = max(iv[-1][1], r.y1)
        else:
            iv.append([r.y0, r.y1])
    return iv


def tablas_pagina(pg, ultima):
    words = pg.get_text('words')
    fills = [(x['rect'], tuple(round(v, 2) for v in x['fill'])) for x in pg.get_drawings() if x.get('fill')]
    col = color_franja(fills)
    out = []
    if col is None:
        return out
    hs = cabeceras(words)
    usadas = []
    for h in sorted(hs, key=lambda w: (w[1], w[0])):
        hx, hy0, hy1 = h[0], h[1], h[3]
        # franja bajo la cabecera que contiene su x
        base = [r for r, c in fills if c == col and r.y0 >= hy1 - 4 and r.y0 - hy1 < 45 and r.x0 - 2 <= hx + 1 <= r.x1 + 2]
        if not base:
            continue
        y_top = min(r.y0 for r in base)
        banda = sorted((r for r, c in fills if c == col and abs(r.y0 - y_top) < 1.5 and r.x1 > hx - 20), key=lambda r: r.x0)
        # cadena de rectángulos contiguos que contienen la x de la cabecera
        X0 = X1 = None
        for r in banda:
            if X0 is None and r.x0 - 2 <= hx + 1 <= r.x1 + 2:
                X0, X1 = r.x0, r.x1
            elif X0 is not None and r.x0 <= X1 + 1.5:
                X1 = max(X1, r.x1)
        if X0 is None:
            continue
        iv = franjas_de(fills, col, X0, X1, hy1 - 4)
        # corta cuando otra cabecera de la misma zona empieza o el hueco es enorme
        sig = [w[1] for w in hs if w is not h and w[1] > hy1 + 4 and X0 - 3 <= w[0] <= X1 + 3]
        tope = min(sig) if sig else 1e9
        fr, prev = [], hy1
        for a, b in iv:
            if a >= tope - 1 or a - prev > FILA_MAX:
                break
            fr.append([a, b])
            prev = b
        if not fr:
            continue
        # divisores de columna: rectángulos finos y altos dentro de la tabla
        thin = [r for r, c in fills if c == col and r.width <= THIN and r.height >= 7 and X0 - 1 <= r.x0 and r.x1 <= X1 + 1 and fr[0][0] - 1 <= r.y0 <= fr[-1][1]]
        centros = sorted({round((r.x0 + r.x1) / 2) for r in thin})
        div, ult = [], None
        for x in centros:
            if X0 + 10 < x < X1 - 10 and (ult is None or x - ult > 10):
                div.append(x)
                ult = x
        lim = [X0] + div + [X1]
        # cabecera: palabras de la línea del dado y las de su banda hasta la primera franja
        cab_ws = en_rect(words, X0 - 1, X1 + 1, hy0 - 3, max(hy1, fr[0][0] - 1))
        cols = []
        for i in range(len(lim) - 1):
            ws = [w for w in cab_ws if lim[i] - 1 <= (w[0] + w[2]) / 2 <= lim[i + 1] + 1]
            cols.append(texto(ws))
        die = int(RX_DADO.match(h[4]).group(1))
        # el primer divisor aísla la columna del número
        num_x1 = lim[1] if len(lim) > 2 else X0 + 25
        # filas: franjas y huecos
        filas, prev = [], hy1 + 1
        for a, b in fr:
            if a - prev > 3:
                filas.append((prev, a))
            filas.append((a, b))
            prev = b
        # última fila blanca (la tabla acaba en fila par): líneas seguidas sin hueco tras la última franja
        ws_ab = sorted((w for w in words if X0 <= (w[0] + w[2]) / 2 <= X1 and prev - 1 <= w[1] < prev + 70 and w[1] < tope - 1), key=lambda w: w[1])
        y_fin, yl = prev, None
        for w in ws_ab:
            if yl is not None and w[1] - yl > 14:
                break
            yl = w[1]
            y_fin = max(y_fin, w[3])
        # solo cuenta si hay un número de fila en la columna del número
        if y_fin > prev + 3 and numeros(en_rect(words, X0, num_x1, prev, y_fin)):
            filas.append((prev, y_fin + 0.5))
        rows = []
        for y0, y1 in filas:
            nums = numeros(en_rect(words, X0, num_x1, y0, y1))
            cel = [texto(en_rect(words, lim[i], lim[i + 1], y0, y1)) for i in range(1, len(lim) - 1)] if len(lim) > 2 else [texto(en_rect(words, num_x1, X1, y0, y1))]
            rows.append((nums, cel))
        nombres = [c for c in cols[1:]] if len(lim) > 2 else [texto(en_rect(words, num_x1, X1, hy0 - 3, hy1 + 1))]
        if not nombres:
            continue
        out.append({'die': die, 'cols': nombres, 'filas': rows, 'x0': X0, 'x1': X1, 'y0': hy0, 'cont': False})
        usadas.append((X0, X1, fr[0][0], prev))
    # continuaciones: franjas con divisores que no pertenecen a ninguna cabecera (tabla partida en columnas o páginas)
    if ultima is not None:
        rest = sorted((r for r, c in fills if c == col and r.height > 2 and not any(u[0] - 3 <= r.x0 and r.x1 <= u[1] + 3 and u[2] - 3 <= r.y0 <= u[3] + 3 for u in usadas)), key=lambda r: (round(r.x0 / 150), r.y0))
        grupos = []
        for r in rest:
            for g in grupos:
                if abs(g['x0'] - r.x0) < 60 and abs(g['x1'] - r.x1) < 60 and r.y0 - g['y1'] <= FILA_MAX and r.y0 >= g['y0'] - 1:
                    g['x0'], g['x1'], g['y1'] = min(g['x0'], r.x0), max(g['x1'], r.x1), max(g['y1'], r.y1)
                    g['rs'].append(r)
                    break
            else:
                grupos.append({'x0': r.x0, 'x1': r.x1, 'y0': r.y0, 'y1': r.y1, 'rs': [r]})
        for g in grupos:
            if g['y1'] - g['y0'] < 20 or g['x1'] - g['x0'] < 100:
                continue
            thin = [r for r in g['rs'] if r.width <= THIN and r.height >= 7]
            centros = sorted({round((r.x0 + r.x1) / 2) for r in thin})
            div, ult = [], None
            for x in centros:
                if g['x0'] + 10 < x < g['x1'] - 10 and (ult is None or x - ult > 10):
                    div.append(x)
                    ult = x
            lim = [g['x0']] + div + [g['x1']]
            if len(lim) - 2 != ultima['cols_n'] and not (len(lim) == 2 and ultima['cols_n'] == 1):
                continue
            iv = franjas_de(fills, col, g['x0'], g['x1'], g['y0'])
            iv = [i for i in iv if i[0] >= g['y0'] - 1 and i[1] <= g['y1'] + 1]
            if not iv:
                continue
            filas, prev = [], iv[0][0] - 0.01
            y_ini = g['y0']
            prev = y_ini
            for a, b in iv:
                if a - prev > 3:
                    filas.append((prev, a))
                filas.append((a, b))
                prev = b
            ws_ab = sorted((w for w in words if g['x0'] <= (w[0] + w[2]) / 2 <= g['x1'] and prev - 1 <= w[1] < prev + 70), key=lambda w: w[1])
            y_fin, yl = prev, None
            for w in ws_ab:
                if yl is not None and w[1] - yl > 14:
                    break
                yl = w[1]
                y_fin = max(y_fin, w[3])
            num_x1 = lim[1] if len(lim) > 2 else g['x0'] + 25
            if y_fin > prev + 3 and numeros(en_rect(words, g['x0'], num_x1, prev, y_fin)):
                filas.append((prev, y_fin + 0.5))
            rows = []
            for y0, y1 in filas:
                nums = numeros(en_rect(words, g['x0'], num_x1, y0, y1))
                cel = [texto(en_rect(words, lim[i], lim[i + 1], y0, y1)) for i in range(1, len(lim) - 1)] if len(lim) > 2 else [texto(en_rect(words, num_x1, g['x1'], y0, y1))]
                rows.append((nums, cel))
            out.append({'die': ultima['die'], 'cols': ultima['cols'], 'filas': rows, 'x0': g['x0'], 'x1': g['x1'], 'y0': g['y0'], 'cont': True})
    return out


def titulo_sobre(pg, x0, x1, y):
    """Texto de 10,8 pt o más justo encima de la tabla (dentro de 40 pt), en su columna; une las líneas seguidas de un título partido."""
    ls = []
    for b in pg.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            sp = l['spans']
            sz = max(s['size'] for s in sp)
            lx0, ly0, lx1, ly1 = l['bbox']
            if 10.8 <= sz <= 22 and ly1 <= y + 2 and y - ly1 < 60 and lx0 < x1 and lx1 > x0 - 5:
                t = ''.join(s['text'] for s in sp).strip()
                if t:
                    ls.append((ly0, ly1, t, round(sz)))
    ls.sort()
    if not ls:
        return ''
    fin = ls[-1]
    if y - fin[1] > 40:
        return ''
    tit = [fin]
    for l in reversed(ls[:-1]):
        if l[3] == tit[0][3] and tit[0][0] - l[1] < 6:
            tit.insert(0, l)
        else:
            break
    return ' '.join(t[2] for t in tit)


def a_tabla(tb):
    die, n = tb['die'], len(tb['cols'])
    res = [None] * die
    ult = None
    for nums, celdas in tb['filas']:
        celdas = (celdas + [''] * n)[:n]
        if not nums:
            if ult is not None and any(celdas):
                for i in range(n):
                    if celdas[i]:
                        ult[i] = (ult[i] + ' ' + celdas[i]).strip()
            continue
        lo, hi = (nums[0], nums[-1]) if len(nums) > 1 else (nums[0], nums[0])
        if die == 100 and lo == 0:
            lo = 100
        if die == 100 and hi == 0:
            hi = 100
        if hi < lo:
            lo, hi = hi, lo
        ult = list(celdas)
        for k in range(lo, min(hi, die) + 1):
            res[k - 1] = ult
    falta = sum(1 for r in res if r is None)
    du = ['faltan resultados del dado (%d de %d): compruébala con el libro' % (falta, die)] if falta else []
    cols = {}
    usados = set()
    for i, nm in enumerate(tb['cols']):
        k = nm or 'Resultado'
        while k in usados:
            k += ' '
        usados.add(k)
        cols[k] = [(r[i] if r else '') for r in res]
    return cols, du


def main():
    pdf, a, b, modulo, etiq = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], sys.argv[5]
    off = int(sys.argv[6]) if len(sys.argv) > 6 else 2
    d = pymupdf.open(pdf)
    out, ultima = [], None
    for p in range(a, b + 1):
        pg = d[p - 1]
        for tb in tablas_pagina(pg, ultima):
            if tb['cont']:
                if ultima is not None:
                    ultima['filas'] += tb['filas']
                continue
            ultima = {'die': tb['die'], 'cols': tb['cols'], 'cols_n': len(tb['cols']), 'filas': list(tb['filas']), 'p': p,
                      'titulo': titulo_sobre(pg, tb['x0'], tb['x1'], tb['y0'])}
            out.append(ultima)
    # una tabla de la misma forma cuyo primer número no es 1 continúa a la anterior (mitades en paralelo)
    fus = []
    for tb in out:
        pr = fus[-1] if fus else None
        n1 = next((nn[0] for nn, _ in tb['filas'] if nn), None)
        if pr and pr['die'] == tb['die'] and pr['cols'] == tb['cols'] and n1 not in (None, 0, 1) and not tb['titulo'].strip():
            pr['filas'] += tb['filas']
            continue
        fus.append(tb)
    out = fus
    toc = [(t, pg_) for lv, t, pg_ in d.get_toc() if lv >= 2]
    res = []
    for tb in out:
        cols, du = a_tabla(tb)
        if not cols or all(not any(v) for v in cols.values()):
            continue
        base = re.sub(r'\s+', ' ', tb['titulo']).strip().rstrip(':.')
        if not base:
            c1 = next((c for c in tb['cols'] if c), 'Resultado')
            base = 'Tabla d%d «%s», p. %d' % (tb['die'], c1, tb['p'] - off)
            k = sum(1 for r in res if r['n'].startswith(base))
            if k:
                base += ' (%d)' % (k + 1)
        n = base
        res.append({'n': n, 'cat': etiq, 'columnas': cols, 'modo': 'fila' if len(cols) > 1 else 'columna', 'pg': str(tb['p'] - off), 'pend': True,
                    'dudas': ['tabla leída de un PDF: compruébala con el libro'] + du + ([] if tb['titulo'] else ['no se encontró el título: se le ha puesto uno provisional'])})
        print(tb['p'] - off, '| d%d |' % tb['die'], n[:60], '|', [c for c in cols], '|', len(du))
    # tablas partidas por salto de página: dos seguidas con el mismo dado y columnas cuyos huecos se complementan son una sola
    def vacios(t):
        c = list(t['columnas'].values())
        return {i for i in range(len(c[0])) if not any(col[i] for col in c)}
    fin = []
    for t in res:
        pr = fin[-1] if fin else None
        if pr and list(pr['columnas']) == list(t['columnas']) and len(next(iter(pr['columnas'].values()))) == len(next(iter(t['columnas'].values()))):
            va, vb = vacios(pr), vacios(t)
            if va and vb and not (va & vb) and len(va) + len(vb) >= len(next(iter(t['columnas'].values()))) - 0 and int(t['pg']) - int(pr['pg']) <= 1:
                for k in pr['columnas']:
                    pr['columnas'][k] = [a or b for a, b in zip(pr['columnas'][k], t['columnas'][k])]
                if pr['n'].split(':')[0] in (etiq,) or 'tabla d' in pr['n'] or 'tabla d' not in t['n']:
                    pr['n'] = t['n'] if 'tabla d' not in t['n'] else pr['n']
                pr['dudas'] = [d for d in pr['dudas'] if not d.startswith('faltan')] + (['faltan resultados del dado: compruébala con el libro'] if vacios(pr) else [])
                continue
        fin.append(t)
    res = fin
    m = json.load(open(modulo, encoding='utf-8'))
    ya = {x['n'] for x in res}
    m['tablas'] = [x for x in m.get('tablas', []) if x['n'] not in ya and x.get('cat') != etiq] + res
    json.dump(m, open(modulo, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(res), 'tablas ->', modulo)


if __name__ == '__main__':
    main()
