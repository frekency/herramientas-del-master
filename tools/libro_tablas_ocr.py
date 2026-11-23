#!/usr/bin/env python
"""Tablas aleatorias de un libro escaneado (OCR en JSON de líneas {t,x,y,y1,x1}) → «tablas» de un módulo.

Solo uso personal: la salida va a datos/privado/ (fuera de git).
Uso: python tools/libro_tablas_ocr.py <ocr.json> <modulo.json> <etiqueta> [offset_pagina=1]
La cabecera de una tabla es una línea que empieza por un dado («Id20», «1d100», «IdlOO» del OCR) sola o con el nombre de la primera columna.
Las demás cabeceras son las líneas de su misma altura a la derecha. Cada fila empieza con un número o rango en la columna del dado; las líneas
sin número continúan la celda de la fila anterior. El título es la línea en mayúsculas más cercana por encima. Se corrigen los fallos típicos del
OCR en dados y números (I/l→1, O→0). Todo queda pendiente con dudas; las tablas con huecos en el dado se anotan.
"""
import sys, re, json, collections

RX_DADO = re.compile(r'^([1Il]?)[dD]\s?([\dlIO]{1,4})\b(.*)$')
RX_NUM = re.compile(r'^([\dOlI]{1,3})\s*(?:[-–—−�]\s*([\dOlI]{1,3}))?$')
MITAD = 540


def num(s):
    s = s.translate(str.maketrans('OlI', '011'))
    return int(s) if s.isdigit() else None


def dado(t):
    m = RX_DADO.match(t.strip())
    if not m or m.group(1) == '' and False:
        return None
    n = num(m.group(2))
    if not n or n not in (3, 4, 6, 8, 10, 12, 20, 100, 66, 30, 100):
        return None
    return n, m.group(3).strip()


def procesa(pag, ls, etiq, off):
    out = []
    ds = []
    for l in ls:
        r = dado(l['t'])
        if r and l['x1'] - l['x'] < 330 and not re.search(r'x \d|perforante|radiante|necr|de da', l['t']):
            ds.append((l, r))
    ds.sort(key=lambda a: (a[0]['x'] >= MITAD, a[0]['y']))
    for k, (h, (die, resto)) in enumerate(ds):
        hx, hy = h['x'], h['y']
        lado = hx >= MITAD
        lo, hi = (MITAD, 2000) if lado else (0, MITAD)
        # cabeceras de las demás columnas: mismas alturas, a la derecha
        cab = [(hx + 60, resto)] if resto else []
        for l in ls:
            if abs(l['y'] - hy) < 14 and l['x'] > h['x1'] + 2 and lo <= l['x'] < hi and l is not h and not dado(l['t']) and not re.fullmatch(r'[\dOlI\s\-–—−�.]{1,9}', l['t'].strip()) and l['t'].strip().upper() != l['t'].strip():
                cab.append((l['x'], l['t'].strip()))
        cab.sort()
        if not cab:
            cab = [(hx + 60, '')]
        # una sola cabecera sin nombre: columna única a la derecha del número
        xs = [c[0] for c in cab]
        # siguientes tablas en la misma mitad limitan la región
        sig = [a[0]['y'] for a in ds[k + 1:] if (a[0]['x'] >= MITAD) == lado and a[0]['y'] > hy + 20]
        ymax = min(sig) - 25 if sig else 99999
        L = sorted((l for l in ls if lo <= l['x'] < hi and hy + 12 < l['y'] < ymax), key=lambda l: (l['y'], l['x']))
        # la columna del número: trozos de línea cortos junto al dado, unidos por altura («01» + «�20», «21-» + «30»)
        zona = [l for l in L if l['x'] < hx + 55 and l['x1'] < hx + 85 and re.fullmatch(r'[\dOlI\s\-–—−�.]{1,9}', l['t'].strip())]
        nums = []
        for l in zona:
            if nums and abs(nums[-1]['y'] - l['y']) < 9:
                nums[-1]['t'] += ' ' + l['t'].strip()
            else:
                nums.append({'y': l['y'], 'x': l['x'], 't': l['t'].strip()})
        usados = {id(l) for l in zona}
        ev = sorted([('n', n['y'], n) for n in nums] + [('l', l['y'], l) for l in L if id(l) not in usados], key=lambda e: (e[1] - (9 if e[0] == 'n' else 0), e[0] == 'l'))
        filas, cur, ult_y = [], None, hy
        for tp, _, l in ev:
            if tp == 'n':
                dg = [num(x) for x in re.findall(r'[\dOlI]+', l['t'])]
                dg = [d for d in dg if d is not None and d <= 100]
                if not dg or (die != 100 and dg[0] > die and not (die == 100)):
                    continue
                a, b = dg[0], dg[-1]
                if a == 0 and die == 100:
                    a = 100
                if b == 0 and die == 100:
                    b = 100
                if b < a:
                    b = a
                cur = {'lo': a, 'hi': b, 'cel': collections.defaultdict(list), 'y': l['y']}
                filas.append(cur)
                ult_y = l['y']
                continue
            t = l['t'].strip()
            enx = False
            if cur is None:
                if filas == [] and l['y'] - hy < 90 and not enx and l['x'] > hx + 20:
                    cur = {'lo': 1, 'hi': 1, 'cel': collections.defaultdict(list), 'y': l['y'], 'prov': True}
                    filas.append(cur)
                else:
                    continue
            if l['y'] - ult_y > 75 or (abs(l['x'] - hx) < 30 and l['x1'] - l['x'] > 300 and l['y'] - ult_y > 30):
                break                           # fin de la tabla (párrafo de texto debajo)
            if l['x'] < hx + 35 and not enx and len(t) > 3 and l['x'] < xs[0] - 5:
                break
            # la columna es la última cabecera cuya x queda a la izquierda (con margen)
            ci = 0
            for i, x in enumerate(xs):
                if l['x'] >= x - 20:
                    ci = i
            cur['cel'][ci].append(t)
            ult_y = l['y']
        if len(filas) > 1 and filas[0].get('prov') and filas[1]['lo'] != 2:
            filas = filas[1:]
        if len(filas) < 2:
            continue
        n_col = len(cab)
        # título: línea en mayúsculas más cercana por encima en la misma mitad
        tit = ''
        cand = [l for l in ls if lo <= l['x'] < hi and l['y'] < hy - 5 and hy - l['y'] < 110 and l['t'].strip().isupper() and len(l['t'].strip()) > 3 and l['x1'] - l['x'] > 60]
        if cand:
            c0 = max(cand, key=lambda l: l['y'])
            grupo = [l for l in cand if c0['y'] - l['y'] < 30 and abs(l['x'] - c0['x']) < 60]
            tit = ' '.join(l['t'].strip() for l in sorted(grupo, key=lambda l: l['y']))
        res = [None] * die
        for f in filas:
            for j in range(f['lo'], min(f['hi'], die) + 1):
                if j >= 1:
                    res[j - 1] = f
        falta = sum(1 for r in res if r is None)
        cols = {}
        used = set()
        for i, (x, nm) in enumerate(cab):
            nm = re.sub(r'\s+', ' ', nm).strip() or ('Resultado' if n_col == 1 else 'Columna %d' % (i + 1))
            while nm in used:
                nm += ' '
            used.add(nm)
            cols[nm] = [re.sub(r'\s+', ' ', ' '.join(r['cel'].get(i, []))).strip() if r else '' for r in res]
        n = re.sub(r'\s+', ' ', tit).strip().rstrip(':.')
        if not n:
            n = 'Tabla d%d, p. %d' % (die, pag - off)
        du = ['tabla leída con OCR de un PDF escaneado: compruébala con el libro']
        if falta:
            du.append('faltan resultados del dado (%d de %d): compruébala con el libro' % (falta, die))
        if not tit:
            du.append('no se encontró el título: se le ha puesto uno provisional')
        out.append({'n': n.title() if n.isupper() else n, 'cat': etiq, 'columnas': cols, 'modo': 'fila' if len(cols) > 1 else 'columna',
                    'pg': str(pag - off), 'pend': True, 'dudas': du, '_falta': falta, '_die': die})
    return out


def main():
    ocr, modulo, etiq = sys.argv[1], sys.argv[2], sys.argv[3]
    off = int(sys.argv[4]) if len(sys.argv) > 4 else 1
    o = json.load(open(ocr, encoding='utf-8'))
    res = []
    for k in sorted(o):
        pag = int(re.sub(r'\D', '', k))
        for t in procesa(pag, o[k], etiq, off):
            base, i = t['n'], 2
            while any(r['n'] == t['n'] for r in res):
                t['n'] = '%s (%d)' % (base, i)
                i += 1
            res.append(t)
    def llenas(t):
        c = list(t['columnas'].values())
        return {i for i in range(len(c[0])) if any(col[i] for col in c)}
    fin = []
    for t in res:
        pr = fin[-1] if fin else None
        if pr and pr['_die'] == t['_die'] and len(pr['columnas']) == len(t['columnas']) and int(t['pg']) - int(pr['pg']) <= 1:
            a, b = llenas(pr), llenas(t)
            if a and b and not (a & b) and max(a) < min(b):
                for (k1, v1), (k2, v2) in zip(pr['columnas'].items(), t['columnas'].items()):
                    pr['columnas'][k1] = [x or y for x, y in zip(v1, v2)]
                pr['_falta'] = sum(1 for i in range(pr['_die']) if i not in a | b)
                pr['dudas'] = [d for d in pr['dudas'] if not d.startswith('faltan')] + (['faltan resultados del dado (%d de %d): compruébala con el libro' % (pr['_falta'], pr['_die'])] if pr['_falta'] else [])
                if pr['n'].startswith('Tabla d') and not t['n'].startswith('Tabla d'):
                    pr['n'] = t['n']
                continue
        fin.append(t)
    res = []
    for t in fin:
        if t['_falta'] > t['_die'] * 0.5:
            print('OMITIDA p.%s d%d (faltan %d): %s' % (t['pg'], t['_die'], t['_falta'], t['n'][:40]))
        else:
            res.append(t)
    for t in res:
        print(t['pg'], '| d%d |' % t['_die'], t['n'][:50], '|', list(t['columnas'])[:3], '| faltan', t['_falta'])
        del t['_falta'], t['_die']
    m = json.load(open(modulo, encoding='utf-8'))
    ya = {x['n'] for x in res}
    m['tablas'] = [x for x in m.get('tablas', []) if x['n'] not in ya and x.get('cat') != etiq] + res
    json.dump(m, open(modulo, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(res), 'tablas ->', modulo)


if __name__ == '__main__':
    main()
