#!/usr/bin/env python
"""Arregla los títulos de tablas de Xanathar leídos con OCR (tools/libro_titulos_tablas.py): niveles de los encuentros por orden, nombres cortados.
Solo uso personal. Uso: python tools/libro_titulos_arreglos_xge.py <modulo.json>"""
import sys, re, json, collections, difflib
sys.path.insert(0, __file__.rsplit('tools', 1)[0] + 'tools')
import libro_entradas as E

NIV = ['1-4', '5-10', '11-16', '17-20']
ENT = {'artico': 'árticos', 'costero': 'costeros', 'desertico': 'desérticos', 'forestal': 'forestales', 'colina': 'en colina', 'montana': 'en montaña', 'pantano': 'en pantano', 'pradera': 'en pradera', 'subacuatico': 'subacuáticos', 'underdark': 'en el Underdark', 'urbano': 'urbanos'}
ENT_VIEJO = {'articos': 'árticos', 'arti': 'árticos', 'desert': 'desérticos', 'sub acuaticos': 'subacuáticos', 'subacuaticos': 'subacuáticos', 'underdark': 'en el Underdark'}
CORTES = {'Nombres: Elfo, adulto femenin': 'Nombres: Elfo, adulto femenino', 'Nombres: Elfo, adulto masculi': 'Nombres: Elfo, adulto masculino',
          'Nombres: Semiorco, masculinc': 'Nombres: Semiorco, masculino', 'Nombres: Mesoamericano, femi': 'Nombres: Mesoamericano, femenino',
          'Nombres: Mesoamericano, mas(': 'Nombres: Mesoamericano, masculino', 'Nombres: Arabe, femenino': 'Nombres: Árabe, femenino', 'Nombres: Arabe, masculino': 'Nombres: Árabe, masculino',
          'Nombres: Elfo, niño': 'Nombres: Elfo, niño'}


def main():
    modulo = sys.argv[1]
    m = json.load(open(modulo, encoding='utf-8'))
    cuenta = collections.Counter()
    for t in m['tablas']:
        n = t['n']
        mm = re.match(r'^(?:[A-Za-z,]?ncuentros |Incuentros |En )?(.+?) \(niveles [^)]*\)(?: \(\d+\))?$', n) if t.get('cat') == 'Xanathar: Encuentros' else None
        if mm:
            amb = difflib.get_close_matches(E.fold(re.sub(r'^en (el |la )?', '', mm.group(1))), list(ENT), n=1, cutoff=0.5)
            amb = ENT[amb[0]] if amb else mm.group(1)
            cuenta[amb] += 1
            t['n'] = 'Encuentros %s (niveles %s)' % (amb, NIV[min(cuenta[amb] - 1, 3)])
            t['dudas'] = [d for d in t['dudas'] if 'OCR del libro' not in d] + ['el título se ha puesto por el orden del libro (entorno y niveles): compruébalo']
            continue
        if n in CORTES:
            t['n'] = CORTES[n]
        elif n in ('Nombres: Femenino', 'Nombres: Masculino') and t['pg'] == '198':
            t['n'] = 'Nombres: Niger-Congo, ' + n.split(': ')[1].lower()
    m['tablas'] = m['tablas']
    json.dump(m, open(modulo, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print([t['n'] for t in m['tablas'] if t['n'].startswith('Encuentros')])


if __name__ == '__main__':
    main()
