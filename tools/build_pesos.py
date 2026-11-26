#!/usr/bin/env python3
"""Añade el campo numérico `peso` (kg por unidad) a cada objeto de datos/es/compendio.json.

Fuente del dato (el JSON solo lo trae dentro del HTML de «d»):
  - armas y armaduras: «<b>Peso:</b> 1,5 kg» en el propio texto.
  - herramientas:      celda de tabla «Peso: 4 kg».
  - equipo de aventurero: la tabla «Equipo de aventureros» vive solo dentro del
    primer objeto (Abrojos); se lee entera y se busca cada objeto por nombre
    (sin el sufijo « (variable)»).
Unidades: kg, g (250 g = 0,25) y lb (1 lb = 0,5 kg, convención del manual en español).
Reglas de decisión:
  - «—» (peso despreciable)           -> peso = 0
  - «Variable» / sin dato (p. ej. instrumentos, juegos, canalizadores, munición)
    y objetos mágicos (el SRD/DMG no da peso por categoría) -> sin campo `peso`
    (la carga los cuenta como 0; el jugador puede ponerlo a mano en su inventario).
Es idempotente: recalcula `peso` siempre desde «d», así que se puede relanzar.
Conserva el formato del archivo (JSON compacto, UTF-8, sin saltos de línea finales).
Uso:  python tools/build_pesos.py [--dry]
"""
import json, re, sys, pathlib

RUTA = pathlib.Path(__file__).resolve().parent.parent / 'datos' / 'es' / 'compendio.json'
UNI = {'kg': 1.0, 'g': 0.001, 'lb': 0.5}


def kg(txt):
    """'1,5 kg' -> 1.5 ; '—' -> 0.0 ; 'Variable'/otro -> None"""
    t = txt.strip().lower()
    if t in ('—', '-', '–', '-'):
        return 0.0
    m = re.fullmatch(r'([\d.,]+)\s*(kg|g|lb)', t)
    if not m:
        return None
    n = float(m.group(1).replace('.', '').replace(',', '.') if ',' in m.group(1) else m.group(1))
    return round(n * UNI[m.group(2)], 3)


def peso_en_texto(d):
    m = re.search(r'<b>Peso:?</b>:?\s*([^<]*)', d) or re.search(r'<td>\s*Peso:?\s*([^<]*)</td>', d)
    return kg(m.group(1)) if m else None


def tabla_equipo(objs):
    t = {}
    for o in objs:
        if o['t'] == 'Equipo de aventurero' and '<table' in o['d']:
            for nom, p, _ in re.findall(r'<tr><td>([^<]*)</td><td>([^<]*)</td><td>([^<]*)</td></tr>', o['d']):
                t[nom.strip()] = kg(p)
    return t


def peso_equipo(nombre, tabla):
    base = re.sub(r'\s*\((variable)\)\s*$', '', nombre).strip()
    if base in tabla:
        return tabla[base]
    # «Pergamino de conjuro (truco o nivel 1)»: filas «(truco)» y «(nivel 1)»; vale si todas coinciden
    raiz = re.sub(r'\s*\(.*\)$', '', base)
    v = {tabla[k] for k in tabla if k.startswith(raiz + ' (')}
    return v.pop() if len(v) == 1 else None


def main():
    s = RUTA.read_text(encoding='utf-8')
    j = json.loads(s)
    objs = j['objetos']
    tabla = tabla_equipo(objs)
    con = sin = 0
    sin_lista = []
    for o in objs:
        o.pop('peso', None)
        p = peso_en_texto(o['d'])
        if p is None and o['t'] == 'Equipo de aventurero':
            p = peso_equipo(o['n'], tabla)
        if p is None:
            sin += 1
            if o.get('k') != 'magico':
                sin_lista.append(o['n'])
        else:
            o['peso'] = p
            con += 1
    print(f'con peso: {con}  sin peso: {sin} (mágicos: {sin - len(sin_lista)})')
    print('no mágicos sin peso:', ', '.join(sin_lista))
    if '--dry' not in sys.argv:
        RUTA.write_text(json.dumps(j, ensure_ascii=False, separators=(',', ':')), encoding='utf-8', newline='')


if __name__ == '__main__':
    main()
