#!/usr/bin/env python
"""Entradas de un libro con capa de texto (títulos en mayúsculas grandes) → listas para un módulo de «Mi copia».

Solo uso personal: la salida va a datos/privado/ (fuera de git).
Biblioteca: lineas_pag(), entradas(), parrafos_html(). Los guiones de cada libro están en libro_mdj.py.
"""
import re, unicodedata
import pymupdf


def fold(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').lower().strip()


def lineas_pag(d, p, pie=0.955):
    """Líneas de la página (col 0/1 por la mitad), sin pie. Devuelve (líneas, número impreso)."""
    pg = d[p - 1]
    W, H = pg.rect.width, pg.rect.height
    out, num = [], None
    for b in pg.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            sp = l['spans']
            t = ''.join(s['text'] for s in sp)
            if not t.strip():
                continue
            x0, y0, x1, y1 = l['bbox']
            size = max(sp, key=lambda s: len(s['text']))['size']
            if y0 > H * pie or y0 < H * 0.012:
                m = re.match(r'^\s*(\d{1,3})\b', t) or re.search(r'(?<!\d)(\d{1,3})\s*$', t)
                if m and size > 12: num = int(m.group(1))
                continue
            if size < 7 or x0 > W - 12:        # ruido de los bordes
                continue
            out.append({'t': t.strip(), 'x0': x0, 'x1': x1, 'y': y0, 'size': size, 'col': 0 if x0 < W * 0.5 - 20 else 1, 'p': p})
    out.sort(key=lambda r: (r['col'], r['y']))
    # el OCR parte a veces una línea en trozos (junto a una ilustración): se vuelven a unir
    uni = []
    for r in out:
        for q in uni[-3:]:
            if q['col'] == r['col'] and abs(q['y'] - r['y']) < 7 and not (q['x0'] <= r['x0'] < q['x1'] - 4):
                if r['x0'] >= q['x1'] - 4:
                    q['t'] += ' ' + r['t']; q['x1'] = max(q['x1'], r['x1'])
                else:
                    q['t'] = r['t'] + ' ' + q['t']; q['x0'] = r['x0']
                q['size'] = max(q['size'], r['size'])
                break
        else:
            uni.append(dict(r))
    return uni, num


def es_titulo(r, minsize=17):
    t = re.sub(r'[^A-Za-zÁÉÍÓÚÑÜáéíóúñü ]', '', r['t'])
    letras = [c for c in t if c.isalpha()]
    return r['size'] >= minsize and len(letras) >= 3 and sum(c.isupper() for c in letras) / len(letras) > 0.55 and len(r['t']) < 70


def titulo_bonito(t):
    """«ATACANTE A LA CARGA» → «Atacante a la carga»."""
    t = re.sub(r'\s+', ' ', t.strip().rstrip('.')).lower()
    return t[:1].upper() + t[1:]


def entradas(d, pi, pf, sigue=None, minsize=17):
    """Corta por títulos. sigue(líneas siguientes) → True si de verdad es un título de entrada. Devuelve [{n, lineas, pg, p}]."""
    L, nums = [], {}
    for p in range(pi, pf + 1):
        ls, n = lineas_pag(d, p)
        nums[p] = n
        L += ls
    # títulos partidos en dos líneas
    marcas = []
    i = 0
    while i < len(L):
        r = L[i]
        if es_titulo(r, minsize) or (sigue and r['size'] >= minsize and len(r['t']) < 60 and sigue(L[i + 1:i + 5])):
            j = i
            t = r['t']
            while j + 1 < len(L) and es_titulo(L[j + 1], minsize) and L[j + 1]['col'] == r['col'] and 0 < L[j + 1]['y'] - L[j]['y'] < r['size'] * 1.6 and L[j + 1]['p'] == r['p']:
                j += 1; t += ' ' + L[j]['t']
            if sigue is None or sigue(L[j + 1:j + 5]):
                marcas.append((i, j, t))
            i = j + 1
        else:
            i += 1
    res = []
    for k, (i, j, t) in enumerate(marcas):
        fin = marcas[k + 1][0] if k + 1 < len(marcas) else len(L)
        cuerpo = L[j + 1:fin]
        res.append({'n': titulo_bonito(t), 'lineas': cuerpo, 'p': L[i]['p'], 'pg': nums.get(L[i]['p']), 'y': L[i]['y'], 'col': L[i]['col']})
    return res


def parrafos(lineas):
    """Junta líneas en párrafos: sangría de primera línea = párrafo nuevo, guion de fin de línea, viñetas."""
    if not lineas:
        return []
    res, cur, prev = [], '', None
    por_col = {}
    for r in lineas:
        k = (r['p'], r['col'])
        por_col[k] = min(por_col.get(k, 9999), r['x0'])
    for r in lineas:
        t = r['t']
        base = por_col[(r['p'], r['col'])]
        sangria = r['x0'] > base + 8 and (prev is None or r['x0'] > prev['x0'] + 6 or prev['col'] != r['col'] or prev['p'] != r['p'])
        # el siguiente párrafo empieza con sangría; una línea con sangría tras otra sangrada también es nueva
        if prev is not None and (sangria or re.match(r'^[•·▪■]\s', t)):
            res.append(cur); cur = t
        elif prev is None:
            cur = t
        elif cur.endswith('-') and t[:1].islower():
            cur = cur[:-1] + t
        else:
            cur += ' ' + t
        prev = r
    if cur:
        res.append(cur)
    return [re.sub(r'\s+', ' ', x).strip() for x in res if x.strip()]


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def html(pars):
    """Párrafos → HTML; «Nombre del rasgo. Texto» lleva el nombre en negrita cursiva."""
    out = []
    for p in pars:
        m = re.match(r'^([A-ZÁÉÍÓÚÑ][^.:]{2,55}?)\.\s+(.*)$', p)
        if m and len(m.group(1).split()) <= 8 and not re.match(r'^(Obtienes|Si |Cuando|Puedes|Tu |Tus )', p):
            out.append('<p><b><i>%s.</i></b> %s</p>' % (esc(m.group(1)), esc(m.group(2))))
        elif re.match(r'^[•·▪■]\s', p):
            out.append('<ul><li>%s</li></ul>' % esc(p[1:].strip()))
        else:
            out.append('<p>%s</p>' % esc(p))
    return ''.join(out).replace('</ul><ul>', '')
