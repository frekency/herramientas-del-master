#!/usr/bin/env python
"""Opciones de clase (invocaciones, maniobras, metamagia, estilos, infusiones, runas, disparos) de Xanathar y Tasha.

Solo uso personal. Parte de las entradas ya extraídas con libro_dotes_xt.py (ficheros .json en la carpeta que se indica) y de los
rasgos de subclase ya guardados en el módulo: elige las que son opciones, les pone clase y las deja como «Opción de clase».
Uso: python tools/libro_opciones_xt.py <carpeta_con_json> <modulo_xge.json> <modulo_tce.json>
"""
import sys, os, re, json


def op(x, cls, req=None):
    d = x['d']
    r = req if req is not None else x.get('req', '')
    if r:
        d = '<p><i>Requisito: %s.</i></p>' % r.rstrip('.') + d
    o = {'n': '%s (%s)' % (x['n'], cls), 'base': x['n'], 'cls': cls, 'sub': '', 'nv': None, 'tipo': 'Opción de clase', 'pg': x['pg'], 'd': d, 'pend': True}
    du = [q for q in x.get('dudas', []) if 'maquetación' not in q] + ['opción de clase extraída de un PDF: compruébala con el libro']
    o['dudas'] = du
    return o


def carga(carp, nom):
    return {x['n']: x for x in json.load(open(os.path.join(carp, nom), encoding='utf-8'))['dotes']}


def texto_plano(html):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', html)).strip()


def main():
    carp, fxge, ftce = sys.argv[1:4]
    # ---- Xanathar
    ei = carga(carp, 'xge-ei.json')
    sal = []
    for n in ['Aspecto de la luna', 'Capa de moscas', 'Castigo sobrenatural', 'Mirada fantasmal', 'Regalo de las profundidades', 'Regalo de los inmortales', 'Agarre de hadar',
              'Arma del pacto', 'Lanza de letargo', 'Maleficio enloquecedor', 'Maleficio implacable', 'Sudario de sombras', 'Tumba de levistus', 'Escape del embaucador']:
        if n in ei:
            x = dict(ei[n]); x['n'] = x['n'].replace('Levistus', 'levistus') if False else x['n']
            sal.append(op(x, 'Brujo'))
    m = json.load(open(fxge, encoding='utf-8'))
    disp = next((f for f in m['rasgos'] if f['base'] == 'Opciones de disparo arcano'), None)
    if disp:
        partes = re.split(r'(?=<p><b><i>Flecha [^<]+\.</i></b>)', disp['d'])
        for q in partes[1:]:
            nom = re.match(r'<p><b><i>(Flecha [^<]+?)\.</i></b>', q).group(1)
            cuerpo = re.sub(r'^<p><b><i>[^<]+</i></b>\s*', '<p>', q)
            sal.append(op({'n': nom, 'd': cuerpo, 'pg': disp['pg'], 'dudas': ['separada del rasgo «Opciones de disparo arcano»: compruébala']}, 'Guerrero', ''))
    # quitar de los rasgos el bloque entero de opciones (queda como rasgo la introducción)
    m['rasgos'] = [f for f in m['rasgos'] if f.get('tipo') != 'Opción de clase'] + sal
    json.dump(m, open(fxge, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('XGE opciones', len(sal), [x['base'] for x in sal])
    # ---- Tasha
    t = json.load(open(ftce, encoding='utf-8'))
    sal = []
    e33, e50, e55, e60, e22 = (carga(carp, 'o_%d.json' % k) for k in (33, 50, 55, 60, 22))
    for n in ['Mente sobrenatural', 'Don de los protectores', 'Escriba lejano', 'Cadena', 'Protección del talismán', 'Reprensión del talismán', 'Servidumbre eterna', 'Vínculo del talismán']:
        if n in e33: sal.append(op(e33[n], 'Brujo'))
    for n in ['Combate a ciegas', 'Combate con armas arrojadizas', 'Guerrero druídico']:
        if n in e50: sal.append(op(e50[n], 'Explorador'))
    for n in ['Combate a ciegas', 'Combate con armas arrojadizas', 'Combate sin armas', 'Intercepción', 'Técnica superior']:
        if n in e55: sal.append(op(e55[n], 'Guerrero'))
    for n in ['Ataque y agarre', 'Emboscada', 'Evaluación técnica', 'Evaluación táctica', 'Lanzamiento rápido', 'Prepararse', 'Presencia dominante', 'Señuelo y cambio']:
        if n in e55: sal.append(op(e55[n], 'Guerrero'))
    for n in ['Conjuro buscador', 'Conjuro transmutado']:
        if n in e60: sal.append(op(e60[n], 'Hechicero'))
    junk = {'Sacudida arcana', 'Defensor mejorado'}
    hom = None
    for n, x in e22.items():
        if n in junk: continue
        if n == 'Sirviente homúnculo':
            continue
        sal.append(op(x, 'Artífice'))
    # el sirviente homúnculo ocupa dos columnas: se unen sus dos trozos
    raw = json.load(open(os.path.join(carp, 'o_22.json'), encoding='utf-8'))['dotes']
    hs = [x for x in raw if x['n'] == 'Sirviente homúnculo']
    if hs:
        x = dict(hs[0]); x['d'] = ''.join(h['d'] for h in hs); sal.append(op(x, 'Artífice'))
    tr = next((f for f in t['rasgos'] if f['base'] == 'Tallador de runas'), None)
    if tr:
        pl = texto_plano(tr['d'])
        ms = list(re.finditer(r'(Runa de (?:Nube|Fuego|Escarcha|Piedra|Colina|Tormenta))(?: \(Nivel 7 o Superior\))?\.\s', pl))
        for k, mm in enumerate(ms):
            fin = ms[k + 1].start() if k + 1 < len(ms) else len(pl)
            req = 'nivel 7 o superior' if 'Nivel 7' in mm.group(0) else ''
            sal.append(op({'n': mm.group(1), 'd': '<p>%s</p>' % pl[mm.end():fin].strip(), 'pg': tr['pg'], 'dudas': ['separada del rasgo «Tallador de runas»: compruébala']}, 'Guerrero', req))
    t['rasgos'] = [f for f in t['rasgos'] if f.get('tipo') != 'Opción de clase'] + sal
    json.dump(t, open(ftce, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('TCE opciones', len(sal), [x['base'] for x in sal])


if __name__ == '__main__':
    main()
