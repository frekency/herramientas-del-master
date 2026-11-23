#!/usr/bin/env python
"""Capítulos 1 («Cómo jugar») y 2 («Crear un personaje») del Manual del Jugador 2024 → «reglas» de un módulo de «Mi copia».

Solo uso personal: la salida va a datos/privado/ (fuera de git).
Uso: python tools/libro_reglas_mdj_cap1_2.py <pdf> <modulo.json>
PDF escaneado con capa OCR. Los apartados principales se fijan en PRINCIPALES (los tamaños de título del OCR no distinguen niveles);
el resto de títulos pasan a subtítulos (<h4>) del apartado principal anterior. Los pasos de «Crear un personaje» quedan como reglas
separadas (base para el futuro creador de personajes).
"""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pymupdf
import libro_entradas as E
from libro_mdj import OFFSET

PRINCIPALES = {1: ['jugador o dm', 'el ritmo de juego', 'dados', 'las seis caracteristicas', 'las pruebas con d20', 'ventaja y desventaja', 'competencia', 'acciones',
                   'interacciones sociales', 'ejemplo de interaccion social', 'exploracion', 'ejemplo de exploracion', 'combate', 'dano y curacion', 'estados',
                   'ejemplo de combate'],
               2: ['preparativos', 'paso', 'progresion de niveles', 'subir de nivel', 'multiclase', 'escalones del juego', 'comenzar en niveles', 'creacion de tu personaje', 'equipo inicial']}
RANGOS = {1: (9, 34), 2: (35, 50)}
TAG = {1: 'Cómo jugar', 2: 'Crear un personaje'}
RUIDO = ('capitulo', 'cap ')


def es_principal(f, cap):
    return any(f.startswith(p) or (p == 'jugador o dm' and p in f) for p in PRINCIPALES[cap])


def main():
    pdf, modulo = sys.argv[1], sys.argv[2]
    d = pymupdf.open(pdf)
    out = []
    for cap, (a, b) in RANGOS.items():
        en = E.entradas(d, a, b, minsize=19.5)
        cur = None
        for e in en:
            f = E.fold(e['n'])
            if f.startswith(RUIDO) or '| como jugar' in f or '| crear un' in f:
                continue
            html = E.html(E.parrafos(e['lineas']))
            if es_principal(f, cap) and (cur is None or f != cur['f']):
                nom = e['n'][:1].upper() + e['n'][1:]
                nom = re.sub(r'^Paso l:', 'Paso 1:', nom)
                cur = {'f': f, 'x': {'n': nom.replace('¿', '').replace('�', '').strip() if False else nom, 'cat': 'Manual del Jugador: ' + TAG[cap], 'tag': '', 'd': html, 'pg': str(e['p'] - OFFSET), 'pend': True,
                                    'dudas': ['leída de un escaneado con OCR: compruébala con el libro']}}
                out.append(cur['x'])
            elif cur is not None:
                if len(f) < 6 or not re.search(r'[aeiou]', f):
                    cur['x']['d'] += html          # ruido de título: se une como texto
                    continue
                cur['x']['d'] += '<h4>%s</h4>' % (e['n'][:1].upper() + e['n'][1:]) + html
    for x in out:
        if len(re.sub('<[^>]+>', '', x['d'])) < 60:
            x['dudas'].append('texto muy corto: puede faltar parte')
    m = json.load(open(modulo, encoding='utf-8'))
    ya = {x['n'] for x in out}
    m['reglas'] = [x for x in m.get('reglas', []) if x['n'] not in ya] + out
    json.dump(m, open(modulo, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(out), 'reglas ->', modulo)
    for x in out:
        print(' ', x['cat'][-20:], '|', x['n'], '|', len(x['d']), '| p.', x['pg'])


if __name__ == '__main__':
    main()
