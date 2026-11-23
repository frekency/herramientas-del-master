#!/usr/bin/env python
"""Limpia el texto de los objetos de un módulo sacado con OCR (Guía del Máster 2024).

Solo uso personal. Uso: python tools/gdm_objetos_limpiar.py <modulo.json>
 1. Quita los pies de ilustración que el OCR coló en el texto («FICHA OE PLUMA OE QUAAL (ANCLA)»): tres o más palabras seguidas en mayúsculas.
 2. En los objetos que tienen una tabla propia (campo «rel» de las tablas), corta del texto la tabla que el OCR dejó en línea
    (desde su título en mayúsculas y el dado hasta el final del párrafo): ya sale incrustada en la ficha.
 3. Separa en párrafos las variantes «Nombre (rareza).» (fichas de pluma, cuentas, etc.) y las pone en negrita cursiva como el libro.
Anota en dudas lo que ha tocado. Es idempotente.
"""
import sys, re, json

RAR = r'(?:com[uú]n|infrecuente|rara|muy rara|legendaria|artefacto)'
CONECT = {'DE', 'OE', 'LA', 'EL', 'DEL', 'LOS', 'LAS', 'Y'}


def mayus(tok):
    letras = [c for c in tok if c.isalpha()]
    return len(letras) >= 2 and sum(c.isupper() for c in letras) >= 0.6 * len(letras)


def quita_pies(t):
    toks = t.split(' ')
    out, i = [], 0
    while i < len(toks):
        j = i
        while j < len(toks) and (mayus(toks[j]) or (toks[j] in CONECT and j > i)):
            j += 1
        # tramo de >=3 palabras que empieza y acaba en mayúsculas
        while j > i and not mayus(toks[j - 1]):
            j -= 1
        if j - i >= 3 and sum(1 for k in toks[i:j] if mayus(k)) >= 3:
            i = j
            continue
        out.append(toks[i])
        i += 1
    return re.sub(r' {2,}', ' ', ' '.join(out))


def corta_tabla(t):
    m = re.search(r'\b[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ ]{5,}\s+[1Il]d[\dlOI]{1,4}\b', t)
    if not m:
        return t
    fin = t.find('</p>', m.start())
    return t[:m.start()].rstrip() + (t[fin:] if fin >= 0 else '')


def parrafos(t):
    pat = re.compile(r'(?<=[.!?»”)]) (?=[A-ZÁÉÍÓÚÑ][\wáéíóúñü\' -]{2,40} \(' + RAR + r'(?:, [^)]{3,40})?\)\. )')
    t = pat.sub('</p><p>', t)
    return re.sub(r'<p>([A-ZÁÉÍÓÚÑ][\wáéíóúñü\' -]{2,40} \(' + RAR + r'(?:, [^)]{3,40})?\)\.)', r'<p><b><i>\1</i></b>', t)


def main():
    f = sys.argv[1]
    m = json.load(open(f, encoding='utf-8'))
    con_tabla = {t['rel']['n'] for t in m.get('tablas', []) if t.get('rel') and t['rel'].get('ty') == 'objetos'}
    n = 0
    for o in m['objetos']:
        d = o['d']
        if o['n'] in con_tabla:
            d = corta_tabla(d)
        # los pies de ilustración se quitan solo del texto, no de las etiquetas
        d = re.sub(r'(?<=>)([^<]+)(?=<)|^([^<]+)', lambda x: quita_pies(x.group(0)), d)
        d = parrafos(d)
        if d != o['d']:
            o['d'] = d
            marca = 'texto limpiado del OCR (pies de ilustración, tabla en línea, párrafos): compruébalo con el libro'
            if marca not in o['dudas']:
                o['dudas'].append(marca)
            n += 1
    json.dump(m, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(n, 'objetos tocados de', len(m['objetos']))


if __name__ == "__main__" and len(sys.argv) == 2:
    main()


def arregla_quaal(f):
    """Retoques a mano de la Ficha de pluma de Quaal: el pie «QunnL (BOTE CISNE)», el final del látigo (el OCR lo dejó tras el pájaro) y su tabla."""
    m = json.load(open(f, encoding='utf-8'))
    for o in m['objetos']:
        if 'quaal' not in o['n'].lower() or 'QunnL' not in o['d'] and 'Como acci' not in o['d']:
            continue
        d = o['d'].replace(' QunnL (BOTE CISNE)', '')
        cola = re.search(r' (Como acci.n adicional, puedes mover el l.tigo.*?incapacitado\.)</p>$', d)
        if cola:
            d = d[:cola.start()] + '</p>'
            d = re.sub(r'(<b><i>L.tigo \(rara\)\.</i></b>.*?fuerza\.)</p>', lambda x: x.group(1) + ' ' + cola.group(1) + '</p>', d, count=1)
        o['d'] = d
    for t in m['tablas']:
        if t.get('rel', {}).get('n') and 'quaal' in t['rel']['n'].lower():
            filas = [(1, 15, 'Abanico', 'Infrecuente'), (16, 35, 'Ancla', 'Infrecuente'), (36, 60, 'Árbol', 'Infrecuente'),
                     (61, 75, 'Bote cisne', 'Rara'), (76, 85, 'Látigo', 'Rara'), (86, 100, 'Pájaro', 'Rara')]
            ficha, rareza = [''] * 100, [''] * 100
            for a, b, x, r in filas:
                for i in range(a - 1, b):
                    ficha[i], rareza[i] = x, r
            t['columnas'] = {'Ficha': ficha, 'Rareza': rareza}
            t['dudas'] = [x for x in t['dudas'] if 'faltan' not in x] + ['tabla rehecha a mano a partir del texto del libro (el OCR había descolocado las filas): compruébala']
    json.dump(m, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__' and len(sys.argv) > 2 and sys.argv[2] == 'quaal':
    arregla_quaal(sys.argv[1])
