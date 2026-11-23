#!/usr/bin/env python
"""Opciones de clase del Manual del Jugador 2024 (PDF escaneado con capa OCR): invocaciones, maniobras y metamagia.

Solo uso personal. Añade «rasgos» (tipo «Opción de clase») al módulo del Manual del Jugador.
Uso: python tools/libro_opciones_mdj.py <pdf> <modulo.json>
"""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pymupdf
import libro_entradas as E

OFFSET = 2


def lineas(d, pi, pf):
    L = []
    for p in range(pi, pf + 1):
        ls, _ = E.lineas_pag(d, p); L += ls
    return L


def corta(L, ini, fin):
    """Trozo entre la línea que contiene ini (texto) y la que contiene fin."""
    a = next(i for i, r in enumerate(L) if ini in E.fold(r['t']).upper() or ini in r['t'].upper())
    b = next((i for i in range(a + 1, len(L)) if fin in r_up(L[i])), len(L))
    return L[a + 1:b]


def r_up(r):
    return E.fold(r['t']).upper()


def op(nom, cls, req, cuerpo, pg, extra=None):
    d = E.html(E.parrafos(cuerpo)) if not isinstance(cuerpo, str) else cuerpo
    if req:
        d = '<p><i>Requisitos: %s.</i></p>' % req.rstrip('.') + d
    du = ['opción de clase leída de un escaneado con OCR: compruébala con el libro']
    if extra: du += extra
    return {'n': '%s (%s)' % (nom, cls), 'base': nom, 'cls': cls, 'sub': '', 'nv': None, 'tipo': 'Opción de clase', 'pg': str(pg), 'd': d, 'pend': True, 'dudas': du}


def con_titulos(trozo, cls, minsize=17.5):
    """Entradas con título en mayúsculas grande (invocaciones y metamagia)."""
    marcas = []
    i = 0
    while i < len(trozo):
        r = trozo[i]
        if r['size'] >= minsize and E.es_titulo(r, minsize) and not r['t'].upper().startswith('NIVEL') and len(r['t']) < 50 and r['t'].upper() != 'SOBRENATURAL':
            j, t = i, r['t']
            while j + 1 < len(trozo) and trozo[j + 1]['size'] >= minsize and E.es_titulo(trozo[j + 1], minsize) and 0 < trozo[j + 1]['y'] - trozo[j]['y'] < 40 and trozo[j + 1]['col'] == r['col'] and trozo[j + 1]['p'] == r['p']:
                j += 1; t += ' ' + trozo[j]['t']
            marcas.append((i, j, t)); i = j + 1
        else:
            i += 1
    out = []
    for k, (i, j, t) in enumerate(marcas):
        fin = marcas[k + 1][0] if k + 1 < len(marcas) else len(trozo)
        cuerpo = trozo[j + 1:fin]
        req = ''
        if cuerpo and re.match(r'^Requisitos?\s*:', cuerpo[0]['t']):
            req = re.sub(r'^Requisitos?\s*:\s*', '', cuerpo[0]['t']); cuerpo = cuerpo[1:]
            while cuerpo and cuerpo[0]['t'][:1].islower() and len(req) < 140 and req.count('.') == 0 and not req.endswith('.'):
                req += ' ' + cuerpo[0]['t']; cuerpo = cuerpo[1:]
        out.append(op(E.titulo_bonito(t), cls, req, cuerpo, trozo[i]['p'] - OFFSET))
    return out


def main():
    pdf, modulo = sys.argv[1], sys.argv[2]
    d = pymupdf.open(pdf)
    sal = []
    # invocaciones sobrenaturales (Brujo)
    L = lineas(d, 73, 75)
    tr = corta(L, 'OPCIONES DE INVOCACI', 'LISTA DE CONJUROS DE BRUJO')
    sal += con_titulos(tr, 'Brujo')
    n_inv = len(sal)
    # metamagia (Hechicero)
    L = lineas(d, 127, 129)
    tr = corta(L, 'OPCIONES DE METAMAGIA', 'LISTA DE CONJUROS DE HECHICERO')
    sal += [x for x in con_titulos(tr, 'Hechicero') if x['base'].lower() != 'opciones de metamagia']
    n_mm = len(sal) - n_inv
    # maniobras (Guerrero, Maestro del combate): títulos dentro del párrafo («Ataque amenazador. Cuando…»)
    L = lineas(d, 122, 124)
    tr = corta(L, 'OPCIONES DE MANIOBRAS', 'LISTA DE')
    pars = E.parrafos(tr)
    cur = None
    mans = []
    for p in pars:
        m = re.match(r'^([A-ZÁÉÍÓÚÑ][^.:]{3,40})\.\s+(.*)$', p)
        if m and len(m.group(1).split()) <= 6 and not re.match(r'^(Cuando|Puedes|Tu |Si |Elige|Como|Una|El |La |Tira )', p):
            cur = [m.group(1), [m.group(2)]]; mans.append(cur)
        elif cur: cur[1].append(p)
    for nom, ps in mans:
        sal.append(op(nom, 'Guerrero', '', '<p>' + '</p><p>'.join(ps) + '</p>', 122 - OFFSET, ['separada de un párrafo corrido: compruébala']))
    print('invocaciones', n_inv, 'metamagia', n_mm, 'maniobras', len(mans))
    for x in sal: print(' ', x['cls'], '|', x['base'], '|', len(x['d']))
    m = json.load(open(modulo, encoding='utf-8'))
    m['rasgos'] = [f for f in m['rasgos'] if f.get('tipo') != 'Opción de clase'] + sal
    json.dump(m, open(modulo, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
