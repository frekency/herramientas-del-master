#!/usr/bin/env python
"""Enlaza las tablas de un módulo con el objeto, rasgo o criatura de la que forman parte (campo «rel»: {ty, n}), para que salgan dentro de su ficha.

Solo uso personal. Uso: python tools/tablas_relacionar.py <modulo.json> <gdm|auto>
 - gdm: Guía del Máster, con la correspondencia puesta a mano por página (tablas de objetos mágicos); renombra cada tabla «Objeto: columna».
 - auto: busca el objeto o rasgo del mismo módulo cuyo nombre más se parece al título de la tabla (en la misma página o la contigua).
El nombre del objeto debe existir en el módulo: si no, no se enlaza.
"""
import sys, re, json, difflib, unicodedata


def fold(s):
    return re.sub(r'[^a-z0-9 ]', '', unicodedata.normalize('NFD', str(s).lower()).encode('ascii', 'ignore').decode()).strip()


# (página, texto con el que empieza el nombre actual, objeto, nombre nuevo de la tabla)
GDM = [
    ('229', 'Alfombra', 'Alfombra voladora', 'Alfombra voladora: tamaño y capacidad'),
    ('229', 'Tabla d100', 'Amuleto de los planos', 'Amuleto de los planos: destino'),
    ('242', 'Baraja De Ilusiones', 'Baraja de ilusiones', 'Baraja de ilusiones'),
    ('243', '', 'Baraja de múltiples cosas', 'Baraja de múltiples cosas'),
    ('252', 'O determinarlo', 'Bolsa de judías', 'Bolsa de judías: efecto'),
    ('252', 'Tabla d100', 'Bolsa de judías', 'Bolsa de judías: efecto (2)'),
    ('253', 'De Trucos', 'Bolsa de trucos', 'Bolsa de trucos: criaturas'),
    ('253', 'De Trucos (2)', 'Bolsa de trucos', 'Bolsa de trucos: criaturas (2)'),
    ('253', 'Bolsa De Trucos', 'Bolsa de trucos', 'Bolsa de trucos: criaturas (3)'),
    ('262', 'Conjuro', 'Collar de plegarias', 'Collar de plegarias: cuentas'),
    ('263', 'Cubo De', 'Cubo de invocación', 'Cubo de invocación: conjuro'),
    ('265', 'Cuerno', 'Cuerno del valhalla', 'Cuerno del Valhalla: espíritus'),
    ('270', 'Esfera', 'Esfera de aniquilación', 'Esfera de aniquilación: control disputado'),
    ('277', 'Fichas', 'Pluma de Quaal', 'Pluma de Quaal: fichas'),
    ('278', 'Botella', 'Frasco de hierro', 'Frasco de hierro: contenido'),
    ('284', 'Propiedades', 'Hoja lunar', 'Hoja lunar: propiedades'),
    ('291', 'Manual', 'Manual de gólems', 'Manual de gólems'),
    ('296', 'Tabla de tipos', 'Munición asesina', 'Munición asesina: tipo de criatura'),
    ('296', 'Sustituir', 'Munición asesina', 'Munición asesina: sustituciones'),
    ('296', 'D100', 'Munición asesina', 'Munición asesina: tipo de criatura (2)'),
    ('296', '100', 'Munición asesina', 'Munición asesina: tipo de criatura (3)'),
    ('302', 'Tabla d100', 'Pergamino de invocar titán', 'Pergamino de invocar titán: titán'),
    ('302', 'Rzar', 'Pergamino de protección', 'Pergamino de protección: tipo de criatura'),
    ('311', 'Tablero', 'Tablero de espiritismo', 'Tablero de espiritismo: efecto'),
    ('311', 'Tabla d100', 'Tablero de espiritismo', 'Tablero de espiritismo: efecto (2)'),
    ('315', 'Tabla d100', 'Túnica de objetos útiles', 'Túnica de objetos útiles: parches'),
    ('319', 'Tabla d100', 'Varita de las maravillas', 'Varita de las maravillas: efecto'),
    ('323', 'Tabla d100', 'Vela de invocación', 'Vela de invocación: plano exterior'),
]


def buscar(m, ty, nombre):
    f = fold(nombre)
    for o in m.get(ty, []):
        if fold(o['n']) == f:
            return o['n']
    for o in m.get(ty, []):
        if f and (f in fold(o['n']) or fold(o['n']) in f):
            return o['n']
    return None


def main():
    f, modo = sys.argv[1], sys.argv[2]
    m = json.load(open(f, encoding='utf-8'))
    n = 0
    if modo == 'gdm':
        usados = set()
        for t in m['tablas']:
            for i, (pg, ini, obj, nuevo) in enumerate(GDM):
                if i in usados or t['pg'] != pg or not t['n'].startswith(ini):
                    continue
                real = buscar(m, 'objetos', obj)
                if not real:
                    print('NO EXISTE el objeto', obj)
                    break
                t['rel'] = {'ty': 'objetos', 'n': real}
                t['n'] = nuevo
                t['dudas'] = [d for d in t['dudas'] if 'título' not in d] + ['el objeto al que pertenece se ha deducido de la página y del contenido: compruébalo']
                usados.add(i)
                n += 1
                break
    else:
        for t in m['tablas']:
            base = re.sub(r'^(efectos? (de|del|de la|de los|de las)|tipos? de|origenes? de|regalos? de|llaves? de)\s+', '', fold(t['n']))
            best = None
            for ty in ('objetos', 'rasgos'):
                for o in m.get(ty, []):
                    if abs(int(str(o.get('pg') or 0)) - int(t['pg'])) > 1:
                        continue
                    nm = re.sub(r'\s*\(.*$', '', o.get('base') or o['n'])
                    r = difflib.SequenceMatcher(None, fold(nm), base).ratio()
                    if fold(nm) and (fold(nm) in base or base in fold(nm)):
                        r = max(r, 0.85)
                    if r >= 0.7 and (best is None or r > best[0]):
                        best = (r, ty, o['n'])
            if best:
                t['rel'] = {'ty': best[1], 'n': best[2]}
                t['dudas'] = t['dudas'] + ['enlazada con «%s» por el parecido del nombre: compruébalo' % best[2]]
                n += 1
                print(t['pg'], t['n'][:40], '->', best[1], best[2])
    json.dump(m, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(n, 'tablas enlazadas')


if __name__ == '__main__':
    main()
