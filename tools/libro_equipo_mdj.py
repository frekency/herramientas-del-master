#!/usr/bin/env python
"""Equipo de aventurero del Manual del Jugador 2024 (escaneado con capa OCR) -> objetos pendientes de revisar.

Solo uso personal. Los títulos «NOMBRE (precio)» vienen con ruido de OCR: el nombre se ajusta al más parecido de otros textos.
Uso: python tools/libro_equipo_mdj.py <pdf> <modulo.json> <compendio.json>
"""
import sys, os, re, json, difflib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pymupdf
import libro_entradas as E

OFFSET = 2


def precio(t):
    t = t.strip().lower()
    t = re.sub(r'\b(p[oO0])\b', 'po', t); t = re.sub(r'\bp[pr]\b', 'pp', t); t = re.sub(r'\bp[cC]\b', 'pc', t)
    return t


def main():
    pdf, modulo, comp = sys.argv[1:4]
    d = pymupdf.open(pdf)
    previo = [x['n'] for x in json.load(open(comp, encoding='utf-8'))['objetos'] if x.get('k') == 'equipo']
    fprevio = {E.fold(n): n for n in previo}
    L = []
    for p in range(224, 232):
        ls, _ = E.lineas_pag(d, p); L += [r for r in ls if not (r['y'] > 1380 and r['size'] > 19)]
    marcas = []
    for i, r in enumerate(L):
        m = re.match(r'^(.*?)\s*\((.{1,20})\)\s*$', r['t'])
        if r['size'] >= 19 and r['p'] != 225 and m and not r['t'].startswith('CAP'):
            marcas.append((i, m.group(1).strip(), precio(m.group(2))))
    out, vistos = [], set()
    for k, (i, nom, pr) in enumerate(marcas):
        fin = marcas[k + 1][0] if k + 1 < len(marcas) else len(L)
        cuerpo = [r for r in L[i + 1:fin] if r['size'] < 19]
        if not nom: nom = 'Paquete de explorador de mazmorras'
        if E.fold(nom).startswith('municion'): nom = 'Munición (variable)'
        f = E.fold(nom)
        du = ['texto leído de un escaneado con OCR: compruébalo con el libro']
        if f in fprevio: n = fprevio[f]
        else:
            c = difflib.get_close_matches(f, list(fprevio), 1, 0.6)
            if c: n = fprevio[c[0]]; du.append('nombre corregido desde «%s» (OCR): compruébalo' % nom)
            else: n = E.titulo_bonito(nom) if nom.isupper() else nom; du.append('nombre no reconocido: compruébalo')
        if E.fold(n) in vistos: continue
        vistos.add(E.fold(n))
        html = E.html(E.parrafos(cuerpo))
        if len(html) < 40: du.append('texto muy corto: puede faltar parte')
        out.append({'n': n, 't': 'Equipo de aventurero', 'r': '', 's': '', 'k': 'equipo', 'precio': pr, 'd': html, 'pg': str(L[i]['p'] - OFFSET), 'pend': True, 'dudas': du})
    m = json.load(open(modulo, encoding='utf-8'))
    m['objetos'] = [o for o in m.get('objetos', []) if o.get('k') != 'equipo'] + out
    json.dump(m, open(modulo, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    falt = [n for n in previo if E.fold(n) not in vistos]
    print(len(out), 'equipos; sin hallar de otros textos:', falt)
    for o in out:
        if len(o['dudas']) > 1: print(' ', o['n'], o['dudas'][1:])


if __name__ == '__main__':
    main()
