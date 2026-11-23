#!/usr/bin/env python
"""Capítulo 2 de la Guía de Xanathar para todo (herramientas del DM) → «reglas» para un módulo de «Mi copia».

Solo uso personal: la salida va a datos/privado/ (fuera de git).
Uso: python tools/libro_reglas_xge.py <pdf> <modulo.json>
Títulos por tamaño de letra: 20 = sección, 15 = subsección, 13 = apartado. Cada sección es una regla; las que traen varios
elementos parecidos (herramientas, actividades en tiempo de inactividad, trampas de ejemplo) se parten en una regla por elemento.
Las tablas salen como texto suelto y quedan marcadas en dudas. Las tablas de encuentros aleatorios y las de objetos mágicos no se incluyen.
"""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pymupdf
import libro_entradas as E

PI, PF = 79, 145            # páginas del PDF (la impresa es una menos)
SALTA = (96, 113)           # tablas de encuentros aleatorios
PADRES_H4 = ('descripciones de herramientas', 'ejemplo de actividades en tiempo de inactividad', 'ejemplos de trampas simples', 'ejemplo de trampas complejas')
TAG = {'Efectos simultáneos': 'Reglas', 'Caída': 'Reglas', 'Armas de adamantina': 'Reglas', 'Atar nudos': 'Reglas'}


def nivel(r):
    s = round(r['size'])
    return {20: 2, 15: 3, 13: 4}.get(s)


def main():
    pdf, modulo = sys.argv[1], sys.argv[2]
    d = pymupdf.open(pdf)
    L = []
    for p in list(range(63, 75)) + list(range(PI, PF + 1)):
        if SALTA[0] <= p <= SALTA[1]:
            continue
        ls, n = E.lineas_pag(d, p)
        ls = [r for r in ls if not r['t'].startswith('15/8/2019')]
        if p == SALTA[1] + 1:        # la página tras las tablas: solo desde el primer título de sección
            k = next((i for i, r in enumerate(ls) if nivel(r) == 2 and r['size'] < 80), None)
            ls = ls[k:] if k is not None else []
        L += ls
    # unir los títulos partidos en dos o tres líneas (mismo nivel, misma columna y página, seguidas)
    I = []
    for r in L:
        lv = nivel(r) if r['size'] < 80 else None
        if lv and I and I[-1].get('lv') == lv and I[-1]['col'] == r['col'] and I[-1]['p'] == r['p'] and I[-1]['y'] < r['y'] and r['y'] - I[-1]['y1'] < 8:
            I[-1]['t'] += ' ' + r['t']; I[-1]['y1'] = r['y1']; I[-1]['y'] = max(I[-1]['y'], 0) if False else I[-1]['y']
        else:
            q = dict(r); q['lv'] = lv if r['size'] < 80 else None
            I.append(q)
    ent, cur = [], None
    h2 = h3 = ''
    trampas = False
    for r in I:
        lv = r.get('lv')
        if r['p'] == 115 and not trampas:          # el título «Trampas revisadas» no sale en el texto: empieza la sección
            trampas = True
            h2, h3 = 'Trampas Revisadas', ''
            cur = {'n': h2, 'cat': h2, 'p': r['p'], 'cuerpo': []}
            ent.append(cur)
        if lv:
            tit = re.sub(r'\s+', ' ', r['t']).strip().rstrip('.')
            if tit.lower().startswith(('tablas de objetos m', 'objetos magicos comunes', 'objetos mágicos comunes')):
                break
            if lv == 2 and trampas and 'trampas' not in tit.lower():
                trampas = False
            if lv == 2:
                h2, h3 = tit, ''
                cur = {'n': tit, 'cat': tit, 'p': r['p'], 'cuerpo': []}
                ent.append(cur)
            elif lv == 3:
                h3 = tit
                if h2.lower().startswith(('esta es tu vida', 'competencias con', 'tiempo de inactividad', 'trampas', 'diseñar trampas', 'disenar trampas')) or tit.lower().startswith(('trampas complejas', 'diseñar trampas complejas', 'ejemplos de trampas', 'ejemplo de trampas')):
                    cur = {'n': tit, 'cat': h2, 'p': r['p'], 'cuerpo': []}
                    ent.append(cur)
                elif cur is not None:
                    cur['cuerpo'].append(('h3', tit))
            else:
                if h3.lower().startswith(PADRES_H4):
                    cur = {'n': tit, 'cat': h2 + ': ' + h3, 'p': r['p'], 'cuerpo': []}
                    ent.append(cur)
                elif cur is not None:
                    cur['cuerpo'].append(('h4', tit))
            continue
        if cur is not None and r['size'] >= 7.5 and r['size'] < 80:
            cur['cuerpo'].append(('l', r))
    nums = {}
    for p in list(range(63, 75)) + list(range(PI, PF + 1)):
        _, n = E.lineas_pag(d, p)
        nums[p] = n
    out = []
    for e in ent:
        html, buf = '', []

        def vuelca():
            nonlocal html, buf
            if buf:
                html += E.html(E.parrafos(buf)); buf = []
        for tp, v in e['cuerpo']:
            if tp == 'l':
                buf.append(v)
            else:
                vuelca(); html += '<%s>%s</%s>' % ('h3' if tp == 'h3' else 'h4', v, 'h3' if tp == 'h3' else 'h4')
        vuelca()
        if len(re.sub('<[^>]+>', '', html)) < 30 or (e['n'].lower().startswith('ejemplo') and len(html) < 600):
            continue
        if e['cat'].lower().startswith(('diseñar trampas', 'disenar trampas', 'dise')) or 'Diseñar Trampas'.lower() in e['cat'].lower():
            e['cat'] = 'Trampas Revisadas'
        pg = (nums.get(e['p']) or e['p'] - 1)
        du = ['leída de un PDF: compruébala con el libro']
        txt = re.sub('<[^>]+>', ' ', html)
        if re.search(r'\b(d100|d20|d12|d10|d8|d6|d4)\s+\S', txt) and re.search(r'\n|\s\d{1,2}\s', txt):
            du.append('puede contener tablas: su texto puede salir desordenado')
        c0 = e['cat'].lower()
        grupo = 'Herramientas' if 'herramientas' in c0 and 'competencias' in c0 else 'Trampas' if 'trampas' in c0 else 'Tiempo de inactividad' if 'inactividad' in c0 else 'Encuentros' if 'encuentros' in c0 else 'Magia' if 'conjuros' in c0 else 'Esta es tu vida' if 'vida' in c0 else 'Objetos mágicos' if 'objetos' in c0 else 'Reglas varias'
        out.append({'n': e['n'], 'cat': 'Xanathar: ' + grupo, 'tag': e['cat'].split(':')[0].strip(), 'd': html, 'pg': str(pg), 'pend': True, 'dudas': du})
    m = json.load(open(modulo, encoding='utf-8'))
    ya = {x['n'] for x in out}
    m['reglas'] = [x for x in m.get('reglas', []) if x['n'] not in ya] + out
    json.dump(m, open(modulo, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(out), 'reglas ->', modulo)
    for x in out:
        print(' ', x['cat'], '|', x['n'], '|', len(x['d']), '| p.', x['pg'])


if __name__ == '__main__':
    main()
