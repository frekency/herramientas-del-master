#!/usr/bin/env python
"""Capítulos 2 y 4 del Caldero de Tasha de todo (patrones de grupo, sesión cero, compañeros, peligros, puzles) → «reglas» de un módulo.

Solo uso personal: la salida va a datos/privado/ (fuera de git).
Uso: python tools/libro_reglas_tce.py <pdf> <modulo.json>
Casi todos los títulos están dibujados: se leen con el OCR de Windows (como en libro_subclases_tce.py) y cada uno se empareja con el
título más parecido del índice (marcadores del PDF) de su misma página. El texto de cada regla va de su título al siguiente.
Los subtítulos con letra (11 pt) salen como <h4>. Las tablas salen como texto suelto (queda anotado en dudas).
"""
import sys, os, re, json, difflib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pymupdf
import libro_entradas as E
import libro_subclases_xt as X

TRAMOS = [(86, 105, 'Patrones de grupo'), (138, 190, None)]
SALTA = {'Contraportada A', 'Contraportada B'}


def grupo_de(nom, nivel, actual):
    f = E.fold(nom)
    if f in ('sesion cero', 'negociar con monstruos'):
        return 'Herramientas del DM'
    if f == 'companeros':
        return 'Compañeros'
    if f in ('peligros ambientales', 'regiones sobrenaturales', 'fenomenos magicos', 'peligros en la naturaleza'):
        return 'Peligros ambientales'
    if f in ('puzles', 'ayudas de puzles'):
        return 'Puzles'
    return actual


def main():
    pdf, modulo = sys.argv[1], sys.argv[2]
    d = pymupdf.open(pdf)
    toc = [(lv, t, p) for lv, t, p in d.get_toc() if lv >= 2 and t not in SALTA]
    out = []
    for pi, pf, fijo in TRAMOS:
        esp = [(lv, t, p) for lv, t, p in toc if pi <= p <= pf]
        # los títulos van dibujados y empiezan siempre en página nueva: cada regla va de su página a la anterior a la siguiente
        # (un título que comparte página con el siguiente es un apartado sin texto propio y se descarta)
        marcas = [e for i, e in enumerate(esp) if i + 1 == len(esp) or esp[i + 1][2] != e[2]]
        for n, (lv, t, p) in enumerate(marcas):
            fin_p = marcas[n + 1][2] - 1 if n + 1 < len(marcas) else pf
            L = [r for r in X.flujo(d, p, max(p, fin_p)) if not r.get('img')]
            grupo = fijo or grupo_de(t, lv, locals().get('grupo')) or 'Tasha'
            html, buf = '', []
            for r in L:
                if 11 <= r['size'] < 13 and len(r['t']) < 60 and not r['t'].endswith('.'):
                    if buf:
                        html += E.html(E.parrafos(buf)); buf = []
                    html += '<h4>%s</h4>' % r['t']
                else:
                    buf.append(r)
            if buf:
                html += E.html(E.parrafos(buf))
            if len(re.sub('<[^>]+>', '', html)) < 40:
                print('VACÍA', t)
                continue
            du = ['título tomado del índice del libro; el texto empieza en su página: compruébalo', 'texto de un PDF: compruébalo con el libro']
            if re.search(r'd100|d20 |d12 |d10 |d8 |d6 |d4 ', re.sub('<[^>]+>', ' ', html)):
                du.append('puede contener tablas: su texto puede salir desordenado')
            pg = (L[0].get('num') or (p - 2)) if L else p - 2
            out.append({'n': t, 'cat': 'Tasha: ' + grupo, 'tag': '', 'd': html, 'pg': str(pg), 'pend': True, 'dudas': du})
            print(grupo, '|', t, '|', len(html), '| p.', pg, '-', fin_p - 2)
    m = json.load(open(modulo, encoding='utf-8'))
    ya = {x['n'] for x in out}
    m['reglas'] = [x for x in m.get('reglas', []) if x['n'] not in ya] + out
    json.dump(m, open(modulo, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(out), 'reglas ->', modulo)


if __name__ == '__main__':
    main()
