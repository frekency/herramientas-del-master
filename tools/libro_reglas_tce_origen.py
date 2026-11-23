#!/usr/bin/env python
"""Reglas de «Personalizar tu origen», «Cambiar una habilidad» y «Cambiar tu subclase» del Caldero de Tasha de todo (págs. 9-11 del PDF).

Solo uso personal: la salida va a datos/privado/ (fuera de git).
Uso: python tools/libro_reglas_tce_origen.py <pdf> <modulo.json>
Los títulos están dibujados: el corte se hace por la primera frase de cada apartado (anclas).
"""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pymupdf
import libro_entradas as E

ANCLAS = [('A nivel 1, eliges varios aspectos', 'Personalizar tu origen'), ('A veces, eliges una habilidad', 'Cambiar una habilidad'), ('Cada clase de personaje implica', 'Cambiar tu subclase')]
FIN = 'Maestros de la invenci'     # empieza el artífice (pág. 11)


def main():
    pdf, modulo = sys.argv[1], sys.argv[2]
    d = pymupdf.open(pdf)
    L = []
    for p in (9, 10, 11):
        ls, n = E.lineas_pag(d, p)
        L += [r for r in ls if r['y'] < 740 and r['size'] < 12.5 and not re.match(r'^[A-Z][a-z]+ [A-Z][a-z]+$', r['t']) and r['size'] > 8.6]
    idx = []
    for a, n in ANCLAS:
        k = next((i for i, r in enumerate(L) if r['t'].startswith(a)), None)
        if k is None:
            print('SIN ANCLA', a); return
        idx.append((k, n))
    fin = next((i for i, r in enumerate(L) if r['t'].startswith(FIN)), len(L))
    out = []
    for j, (k, n) in enumerate(idx):
        f = idx[j + 1][0] if j + 1 < len(idx) else fin
        html, buf = '', []
        for r in L[k:f]:
            if 11 <= r['size'] < 13 and len(r['t']) < 40 and not r['t'].endswith('.'):
                if buf:
                    html += E.html(E.parrafos(buf)); buf = []
                html += '<h4>%s</h4>' % E.titulo_bonito(r['t'])
            else:
                buf.append(r)
        if buf:
            html += E.html(E.parrafos(buf))
        out.append({'n': n, 'cat': 'Tasha: Opciones de personaje', 'tag': '', 'd': html, 'pg': str(7 + (0 if j == 0 else 1)), 'pend': True,
                    'dudas': ['título tomado del libro (índice); el corte del texto se hizo por su primera frase: compruébalo', 'los subtítulos dibujados («Mejora de característica», «Idiomas»…) no se leyeron: el texto sigue sin ellos']})
        print(n, len(html))
    m = json.load(open(modulo, encoding='utf-8'))
    ya = {x['n'] for x in out}
    m['reglas'] = [x for x in m.get('reglas', []) if x['n'] not in ya] + out
    json.dump(m, open(modulo, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
