#!/usr/bin/env python
"""Objetos mágicos de la Guía del Dungeon Master 2024 (capa OCR en ocr-dmg2024.json) -> módulo «Guía del Máster 2024».

Solo uso personal. Cada objeto lleva una línea de tipo y rareza; su título (mayúsculas) está justo encima.
Uso: python tools/libro_objetos_gdm.py <ocr.json> <salida.json> [pag_ini pag_fin]
"""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import libro_entradas as E
from libro_objetos_xt import parte_tipo

OFFSET = 1
TIPO0 = re.compile(r'^(Objeto|Arma|Armadura|Poci.n|Pergamino|Anillo|Vara|Varita|Bast.n|Munici)', re.I)
RX = re.compile(r'^(Objeto maravilloso|Arma|Armadura|Poci.n|Pergamino|Anillo|Vara|Varita|Bast.n|Municion|Munici.n)\b.*?,\s*(com.n|infrecuente|rar[oa]|muy rar[oa]|legendari[oa]|artefacto|rareza|var)', re.I)
RX = re.compile(RX.pattern.replace('Objeto maravilloso', 'Objeto \\w+'), re.I)


def es_titulo(t):
    t = t.strip()
    letras = [c for c in t if c.isalpha()]
    return 3 <= len(t) <= 60 and len(letras) >= 3 and sum(c.isupper() for c in letras) / len(letras) >= 0.7 and not re.search(r'[.:;]\s*$', t) and not t.startswith('CAP')


def arregla(t):
    t = re.sub(r'(?<=\bpor )10(?= (que|dem|tanto|general|cual))', 'lo', t)
    t = re.sub(r'(?<=\bsobre )10(?= (que|dem))', 'lo', t)
    t = re.sub(r'\bd2\(\)', 'd20', t)
    return t


def main():
    ocr = json.load(open(sys.argv[1], encoding='utf-8'))
    pi = int(sys.argv[3]) if len(sys.argv) > 3 else 225
    pf = int(sys.argv[4]) if len(sys.argv) > 4 else 326
    flujo = []
    for p in range(pi, pf + 1):
        ls = [l for l in ocr.get('p%03d' % p, []) if 60 < l['y'] < 1530 and l['t'].strip()]
        for col in (0, 1):
            cl = sorted((l for l in ls if (l['x'] >= 400) == bool(col)), key=lambda l: l['y'])
            for l in cl: flujo.append({'p': p, 'col': col, 't': l['t'].strip(), 'y': l['y'], 'h': l['y1'] - l['y']})
    anclas = []
    k = 0
    while k < len(flujo):
        r = flujo[k]
        if TIPO0.match(r['t']) and r['t'][:1].isupper() and (',' in r['t'] or '(' in r['t']):
            txt, j = r['t'], k
            while not RX.match(txt) and j + 1 < len(flujo) and j - k < 2 and flujo[j + 1]['p'] == r['p']:
                j += 1; txt += ' ' + flujo[j]['t']
            if RX.match(txt) and not re.search(r'(tira|puedes|debes|si )', txt[:40], re.I):
                i = k
                while i - 1 >= 0 and es_titulo(flujo[i - 1]['t']) and not RX.match(flujo[i - 1]['t']) and (i == k or (flujo[i - 1]['p'] == flujo[i]['p'] and flujo[i - 1]['col'] == flujo[i]['col'] and flujo[i]['y'] - flujo[i - 1]['y'] <= 34)) and k - i < 2 and (i == k or True):
                    i -= 1
                anclas.append((i, k, j, txt)); k = j + 1; continue
        k += 1
    out = []
    for n, (i, k, j, txt) in enumerate(anclas):
        fin = anclas[n + 1][0] if n + 1 < len(anclas) else len(flujo)
        nom = ' '.join(flujo[q]['t'] for q in range(i, k)).strip()
        nom = re.sub(r'\s+', ' ', nom)
        du = ['texto leído de un escaneado con OCR: compruébalo con el libro']
        if not nom: nom = '(título no hallado)'; du.append('no se halló el título: compruébalo')
        else: nom = E.titulo_bonito(nom)
        cuerpo = [{'t': arregla(flujo[q]['t']), 'y': flujo[q]['y'], 'size': 15.0, 'p': flujo[q]['p'], 'col': flujo[q]['col'], 'x0': 0, 'y1': flujo[q]['y'] + flujo[q]['h']} for q in range(j + 1, fin)]
        t, ra, s = parte_tipo(txt)
        html = E.html(E.parrafos(cuerpo)) if cuerpo else ''
        if len(html) < 60: du.append('texto muy corto: puede faltar parte')
        if not ra: du.append('no se pudo separar la rareza: compruébala')
        out.append({'n': nom, 't': t, 'r': ra, 's': s, 'k': 'magico', 'd': html, 'pg': str(flujo[k]['p'] - OFFSET), 'pend': True, 'dudas': du})
    m = {'modulo': 'Guía del Dungeon Master 2024', 'abrev': 'GdM', 'version': '2024', 'objetos': out}
    json.dump(m, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(out), 'objetos')
    for o in out[:25] + out[-8:]: print(' ', o['pg'], o['n'], '|', o['t'], '|', o['r'], '|', o['s'][:25], '|', len(o['d']))


if __name__ == '__main__':
    main()
