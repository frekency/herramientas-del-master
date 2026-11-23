#!/usr/bin/env python
"""Rasgos de clase opcionales del Caldero de Tasha (Conocimiento primigenio, Inspiración mágica, Compañero salvaje…).

Solo uso personal: la salida va a datos/privado/ (fuera de git).
Uso: python tools/libro_rasgos_opcionales_tce.py <pdf> <pag_ini> <pag_fin> <salida.json>
Cada rasgo lleva una línea «Rasgo de bárbaro de nivel 3» (la clase en minúsculas, no una subclase) y un título dibujado justo encima,
que se lee con el OCR de Windows. Se guardan como «Opción de clase» con su nivel; el texto de «que reemplaza el rasgo de…» se conserva.
"""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pymupdf
import libro_entradas as E
import libro_subclases_xt as X
import libro_subclases_tce as T

RX = re.compile(r'^Rasgo de (b[aá]rbaro|bardo|brujo|cl[eé]rigo|druida|explorador|guerrero|hechicero|mago|monje|palad[ií]n|p[ií]caro)\s+de nivel (\d{1,2})\b(.*)$', re.I)
RX_FIN = re.compile(r'^A nivel \d+, un[a]? \w+ obtiene el rasgo', re.I)
CLASE = {'barbaro': 'Bárbaro', 'bardo': 'Bardo', 'brujo': 'Brujo', 'clerigo': 'Clérigo', 'druida': 'Druida', 'explorador': 'Explorador', 'guerrero': 'Guerrero',
         'hechicero': 'Hechicero', 'mago': 'Mago', 'monje': 'Monje', 'paladin': 'Paladín', 'picaro': 'Pícaro'}


def main():
    pdf, a, b, salida = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
    d = pymupdf.open(pdf)
    L = X.flujo(d, a, b)
    H = X.huecos(L)
    X.ocr_lote(d, H)
    H = [h for h in H if X.titulo_ocr(h['t'])]
    items = [r for r in L if not r.get('img')] + H
    items.sort(key=lambda r: (r['p'], r['col'], r['y']))
    marcas = []
    for k, r in enumerate(items):
        if r.get('hid'):
            continue
        m = RX.match(r['t'].strip())
        if m:
            marcas.append((k, CLASE[E.fold(m.group(1))], int(m.group(2)), m.group(3).strip(' ,')))
    print(len(marcas), 'rasgos opcionales')
    vocab = {E.fold(w) for r in items if not r.get('hid') for w in re.split(r'\W+', r['t']) if len(w) > 1}
    tit = T.ocr_recortes(d, [(items[k]['p'], items[k]['x0'], items[k]['y']) for k, _, _, _ in marcas], vocab)
    pnum = {r['p']: r['num'] for r in L if r.get('num')}
    out = []
    for i, (k, cl, nv, reemp) in enumerate(marcas):
        p, col = items[k]['p'], items[k]['col']
        nombre = tit[i] or ''
        ini = k + 1
        fin = marcas[i + 1][0] if i + 1 < len(marcas) else len(items)
        cuerpo = []
        for j in range(ini, fin):
            r = items[j]
            if r.get('hid'):
                if (r['p'], r['col']) == (p, col) and not cuerpo:
                    continue
                break           # un título dibujado (el del rasgo siguiente o una subclase) corta el texto
            if RX_FIN.match(r['t'].strip()):
                break
            if r['size'] > 10.3 and r['t'].isupper():     # cita con atribución
                break
            cuerpo.append(r)
        # el título dibujado del rasgo siguiente puede venir antes de su línea «Rasgo de…»: ya cortó arriba
        html = E.html(E.parrafos(cuerpo))
        pre = '<p><i>Rasgo opcional de %s de nivel %d%s.</i></p>' % (cl.lower(), nv, (', ' + reemp) if reemp else '')
        du = ['título leído con OCR: compruébalo', 'rasgo opcional: el DM decide si se usa']
        if not nombre:
            nombre = 'Rasgo de %s de nivel %d' % (cl.lower(), nv)
            du.append('no se pudo leer el título dibujado: pon el nombre del libro')
        if reemp:
            du.append('el rasgo incluye una sustitución («%s»): comprueba el texto' % reemp)
        if len(html) < 40:
            du.append('texto muy corto: puede faltar parte')
        n = E.titulo_bonito(nombre)
        n = n[:1].upper() + n[1:]
        out.append({'n': '%s (%s)' % (n, cl), 'base': n, 'cls': cl, 'sub': '', 'nv': nv, 'tipo': 'Opción de clase', 'pg': str(pnum.get(p) or (p - T.PAGOFF)), 'd': pre + html, 'pend': True, 'dudas': du})
        print(cl, nv, '|', n, '|', len(html), '|', reemp)
    json.dump({'rasgos': out}, open(salida, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(out), '->', salida)


if __name__ == '__main__':
    main()
