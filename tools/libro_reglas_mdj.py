#!/usr/bin/env python
"""Glosario de reglas (apéndice C) del Manual del Jugador 2024 → «reglas» de un módulo de «Mi copia».

Solo uso personal: la salida va a datos/privado/ (fuera de git).
Uso: python tools/libro_reglas_mdj.py <pdf> <modulo.json>
El PDF está escaneado con capa OCR; los títulos son mayúsculas grandes («AGARRADO [ESTADO]»). «Nombre [etiqueta]» → nombre + etiqueta.
"""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pymupdf
import libro_entradas as E
from libro_mdj import OFFSET

PI, PF = 362, 380
ARREGLOS = {'Búsqueda iy': 'Búsqueda', 'A tpb un': 'Noquear a una criatura'}   # títulos que el OCR leyó mal
SALTA = ('y apendice c', 'definiciones de las reglas', 'indice de terminos', 'wizards')


def main():
    pdf, modulo = sys.argv[1], sys.argv[2]
    d = pymupdf.open(pdf)
    en = E.entradas(d, PI, PF + 2, minsize=19.5)
    out = []
    for e in en:
        f = E.fold(e['n'])
        if f.startswith(SALTA) or len(e['n']) < 3:
            continue
        m = re.match(r'^(.*?)\s*\[(.+?)[\])]?\s*$', e['n'])
        nom, tag = (m.group(1).strip(), m.group(2).strip().rstrip(']')) if m else (e['n'].strip(), '')
        nom = nom[:1].upper() + nom[1:]
        nom = ARREGLOS.get(nom, nom)
        html = E.html(E.parrafos(e['lineas']))
        du = ['leída de un escaneado con OCR: compruébala con el libro']
        if nom in ARREGLOS.values():
            du.append('el título se corrigió a mano porque el OCR lo leyó mal: compruébalo')
            html = re.sub(r'^<p>.*?NOQUEAR A UNA CRIATURA\s*', '<p>', html)
        if len(re.sub('<[^>]+>', '', html)) < 40:
            du.append('texto muy corto: puede faltar parte')
        if re.search(r'\b[a-z]{1,2}\b\s+[a-z]{1,2}\b', nom) and not re.search(r' (de|a|el|la|en|un|al|con|por|del|las|los|y) ', ' ' + nom + ' '):
            du.append('el título puede estar mal leído por el OCR')
        out.append({'n': nom, 'cat': 'Glosario de reglas', 'tag': tag, 'd': html, 'pg': str((e['p'] - OFFSET)), 'pend': True, 'dudas': du})
    m = json.load(open(modulo, encoding='utf-8'))
    ya = {x['n'] for x in out}
    m['reglas'] = [x for x in m.get('reglas', []) if x['n'] not in ya] + out
    json.dump(m, open(modulo, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(out), 'reglas ->', modulo)
    for x in out:
        print(' ', x['n'], '|', x['tag'], '|', len(x['d']), '|', x['dudas'][1:] )


if __name__ == '__main__':
    main()
