#!/usr/bin/env python
"""Tabla «Bagatelas» (d100) del Manual del Jugador 2024 (PDF escaneado con capa de OCR) → «tablas» del módulo.

Solo uso personal: la salida va a datos/privado/ (fuera de git).
Uso: python tools/libro_tablas_bagatelas_mdj.py <pdf> <modulo.json>
La tabla ocupa las páginas 48-49 del PDF (46-47 impresas) en cuatro columnas. Los números de fila salen mal en el OCR, así que se
cuentan los resultados en orden de lectura: una línea que empieza en mayúscula abre un resultado (salvo dentro de unas comillas) y las demás continúan el anterior.
Debe dar exactamente 100.
"""
import sys, re, json
import pymupdf

PAGS = (48, 49)
SALTA = re.compile(r'^(1d100|BAGATELAS|CAP[IÍ�]TULO|Cuando creas|tabla|Los DM|estancia|un objeto)', re.I)


def main():
    pdf, modulo = sys.argv[1], sys.argv[2]
    d = pymupdf.open(pdf)
    items = []
    for p in PAGS:
        pg = d[p - 1]
        ls, hx = [], []
        for b in pg.get_text('dict')['blocks']:
            for l in b.get('lines', []):
                t = ''.join(s['text'] for s in l['spans']).strip()
                x0, y0 = l['bbox'][0], l['bbox'][1]
                if t == 'Bagatela':
                    hx.append(x0)
                elif t and not SALTA.match(t) and y0 > 70 and y0 < 1380:
                    ls.append((x0, y0, t))
        for x in sorted(hx):
            col = sorted((l for l in ls if x - 6 <= l[0] < x + 420 and not re.fullmatch(r'\d{1,5}|s1|[Il]\d*', l[2])), key=lambda l: l[1])
            prev = None
            for _, y, t in col:
                abiertas = items and sum(items[-1].count(c) for c in '«“') > sum(items[-1].count(c) for c in '»”')
                nueva = t[:1].isupper() and not abiertas      # un resultado empieza en mayúscula; salvo dentro de unas comillas abiertas
                if items and not nueva:
                    items[-1] += ' ' + t
                else:
                    items.append(t)
                prev = y
    items = [re.sub(r'\s+', ' ', t).strip() for t in items]
    items = [re.sub(r'^Un(trozo|anillo|orbe|disco)|^Un(trozo|anillo|orbe|disco)', lambda m: 'Un ' + (m.group(1) or m.group(2)), t).replace('Uniicono', 'Un icono') for t in items]      # el OCR pega «Untrozo», «Unanillo»
    print(len(items), 'resultados')
    du = ['tabla leída de un PDF escaneado: compruébala con el libro']
    if len(items) != 100:
        du.append('salieron %d resultados en vez de 100: faltan o sobran, compruébalos' % len(items))
    items = (items + [''] * 100)[:100]
    tb = {'n': 'Bagatelas', 'cat': 'Manual del Jugador: Equipo', 'columnas': {'Bagatela': items}, 'modo': 'columna', 'pg': '46', 'pend': True, 'dudas': du}
    m = json.load(open(modulo, encoding='utf-8'))
    m['tablas'] = [x for x in m.get('tablas', []) if x['n'] != 'Bagatelas'] + [tb]
    json.dump(m, open(modulo, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for i in (0, 1, 26, 52, 84, 99):
        print(i + 1, items[i])


if __name__ == '__main__':
    main()
