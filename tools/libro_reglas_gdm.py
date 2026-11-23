#!/usr/bin/env python
"""Capítulos de reglas de la Guía del Dungeon Master 2024 (OCR propio) → «reglas» de un módulo de «Mi copia».

Solo uso personal: la entrada y la salida van en datos/privado/.
Uso: python tools/libro_reglas_gdm.py <ocr-dmg2024.json> <modulo.json> [pag_ini pag_fin ...]
El PDF no tiene capa de texto: se usa el OCR en JSON (claves 'p###', líneas {t,x,y,y1,x1}). Un título es una línea casi toda en mayúsculas y más
alta que el texto; no hay niveles, así que cada título abre una regla (los títulos seguidos se unen). Las páginas de objetos mágicos (225-326) se saltan.
Todo queda pendiente con dudas: el corte por títulos del OCR es aproximado.
"""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import libro_entradas as E

TRAMOS = [(7, 224), (327, 380)]
OFFSET = 1            # página impresa = página del PDF − 1
CORTE_COL = 400


def mayus(t):
    L = [c for c in t if c.isalpha()]
    return len(L) >= 4 and sum(c.isupper() for c in L) / len(L) >= 0.8


def main():
    ocr, modulo = sys.argv[1], sys.argv[2]
    tr = TRAMOS
    if len(sys.argv) > 4:
        v = list(map(int, sys.argv[3:]))
        tr = list(zip(v[::2], v[1::2]))
    o = json.load(open(ocr, encoding='utf-8'))
    out = []
    for a, b in tr:
        L = []
        for p in range(a, b + 1):
            for l in o.get('p%03d' % p, []):
                t = l['t'].strip()
                if not t or re.match(r'^(\d{1,3}|CAP[IÍ]TULO.*|.*\|.*CAP[IÍ]TULO.*)$', t, re.I) or l['y'] < 40:
                    continue
                L.append({'t': t, 'x0': l['x'], 'y': l['y'], 'y1': l['y1'], 'size': l['y1'] - l['y'], 'p': p, 'col': 0 if l['x'] < CORTE_COL else 1})
        L.sort(key=lambda r: (r['p'], r['col'], r['y']))
        cur, buf = None, []

        def cierra():
            if cur is not None:
                cur['d'] = E.html(E.parrafos(buf))
        for r in L:
            if r['size'] >= 22 and mayus(r['t']) and len(r['t']) < 70:
                if cur is not None and not buf and cur['p'] == r['p'] and cur['col'] == r['col'] and r['y'] - cur['y1'] < 45:
                    cur['n'] += ' ' + r['t']; cur['y1'] = r['y1']        # título en dos líneas
                    continue
                cierra()
                cur = {'n': r['t'], 'p': r['p'], 'col': r['col'], 'y1': r['y1']}
                out.append(cur); buf = []
            elif cur is not None:
                buf.append(r)
        cierra()
    res = []
    for x in out:
        n = E.titulo_bonito(x['n'])
        d = x.get('d', '')
        if len(re.sub('<[^>]+>', '', d)) < 80:
            continue
        du = ['leída del OCR de un escaneado: compruébala con el libro', 'el corte por títulos es aproximado (el OCR no distingue niveles de título)']
        if re.search(r'\bd\d+\b', re.sub('<[^>]+>', ' ', d)) and re.search(r'\b1d\d+\b|\bd100\b|\bd20\b|\bd12\b|\bd10\b|\bd8\b|\bd6\b|\bd4\b', d):
            du.append('puede contener tablas: su texto puede salir desordenado')
        res.append({'n': n, 'cat': 'Guía del Dungeon Master', 'tag': '', 'd': d, 'pg': str(x['p'] - OFFSET), 'pend': True, 'dudas': du})
    m = json.load(open(modulo, encoding='utf-8'))
    ya = {x['n'] for x in res}
    m['reglas'] = [x for x in m.get('reglas', []) if x['n'] not in ya] + res
    json.dump(m, open(modulo, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(res), 'reglas ->', modulo)
    for x in res:
        print(' ', x['pg'], '|', x['n'], '|', len(x['d']))


if __name__ == '__main__':
    main()
