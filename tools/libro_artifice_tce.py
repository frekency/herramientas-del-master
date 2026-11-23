#!/usr/bin/env python
"""Clase Artífice del Caldero de Tasha (págs. impresas 9-23): ficha de clase + rasgos de clase.

Solo uso personal. Los títulos son dibujados (se leen con OCR); cada rasgo lleva «Rasgo de artífice de nivel N».
Uso: python tools/libro_artifice_tce.py <pdf> <modulo_tce.json> <subclases.json> [pag_ini pag_fin]
 - subclases.json: salida de libro_subclases_tce.py sobre las mismas páginas (las 4 especializaciones).
Añade al módulo la clase (clases), sus rasgos de clase y las subclases con sus rasgos (rasgos).
"""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pymupdf
import libro_entradas as E
import libro_subclases_xt as X

PAGOFF = 2
RXC = re.compile(r'^Rasgo de art[ií]fice de nivel (\d{1,2})\b', re.I)
NOMBRES_SUPUESTOS = {3: 'La herramienta adecuada para el trabajo'}
SUBS = ['Alquimista', 'Armero', 'Artillero', 'Herrero de batalla']


def main():
    pdf, modulo, fsub = sys.argv[1:4]
    pi = int(sys.argv[4]) if len(sys.argv) > 4 else 11
    pf = int(sys.argv[5]) if len(sys.argv) > 5 else 16
    d = pymupdf.open(pdf)
    L = X.flujo(d, pi, pf); H = X.huecos(L); X.ocr_lote(d, H)
    H = [h for h in H if X.titulo_ocr(h['t'])]
    items = [r for r in L if not r.get('img') and len(r['t'].strip()) > 1] + H
    items.sort(key=lambda r: (r['p'], r['col'], r['y']))
    # la clase acaba donde empiezan las especializaciones
    cut = next(i for i, r in enumerate(items) if r.get('hid') and E.fold(X.limpia_ocr(r['t'])).startswith('especializaciones'))
    items = items[:cut]
    pnum = {r['p']: r['num'] for r in L if r.get('num')}
    pg = lambda p: str(pnum.get(p) or p - PAGOFF)
    tit = [i for i, r in enumerate(items) if r.get('hid')]
    segs = []
    for n, i in enumerate(tit):
        fin = tit[n + 1] if n + 1 < len(tit) else len(items)
        cuerpo = [r for r in items[i + 1:fin] if not r.get('hid')]
        nom = E.titulo_bonito(X.limpia_ocr(items[i]['t']))
        nv = None
        if cuerpo and RXC.match(cuerpo[0]['t']):
            nv = int(RXC.match(cuerpo[0]['t']).group(1)); cuerpo = cuerpo[1:]
        nom = re.sub(r'^Trucos.*', 'Trucos', nom)
        corte = next((k for k, r in enumerate(cuerpo) if k > 0 and RXC.match(r['t'])), None) if nv is not None else None
        if corte is not None:      # un rasgo cuyo título no se pudo leer: empieza en su propia línea «Rasgo de artífice de nivel N»
            segs.append({'n': nom, 'nv': nv, 'lineas': cuerpo[:corte], 'p': items[i]['p']})
            nv2 = int(RXC.match(cuerpo[corte]['t']).group(1))
            segs.append({'n': NOMBRES_SUPUESTOS.get(nv2, '(título ilegible)'), 'nv': nv2, 'lineas': cuerpo[corte + 1:], 'p': cuerpo[corte]['p'], 'supuesto': True})
            continue
        segs.append({'n': nom, 'nv': nv, 'lineas': cuerpo, 'p': items[i]['p']})
    previo = [r for r in items[:tit[0]] if not r.get('hid')]
    # agrupar: cada rasgo (con nivel) recoge las secciones sin nivel que le siguen
    feats, general, cur = [], [], None
    for s in segs:
        if s['nv'] is not None:
            cur = {'n': s['n'], 'nv': s['nv'], 'p': s['p'], 'partes': [(None, s['lineas'])], 'supuesto': s.get('supuesto')}; feats.append(cur)
        elif cur is None:
            general.append(s)
        else:
            cur['partes'].append((s['n'], s['lineas']))
    html_f = lambda f: ''.join(('<h5>%s</h5>' % t if t else '') + E.html(E.parrafos(l)) for t, l in f['partes'])
    rasgos = []
    for f in feats:
        du = ['título leído con OCR: compruébalo', 'puede incluir tablas aplanadas en texto: compruébalo']
        if f.get('supuesto'): du.append('el título no se pudo leer del libro: el nombre es una suposición, compruébalo')
        rasgos.append({'n': '%s (Artífice)' % f['n'], 'base': f['n'], 'cls': 'Artífice', 'sub': '', 'nv': f['nv'], 'tipo': 'Rasgo de clase', 'pg': pg(f['p']), 'd': html_f(f), 'pend': True, 'dudas': du})
    # ficha de la clase
    plano = lambda ls: re.sub(r'\s+', ' ', ' '.join(r['t'] for r in ls))
    comp = next((s for s in general if 'competencias' in E.fold(s['n'])), None)
    ct = plano(comp['lineas']) if comp else plano(sum([s['lineas'] for s in general], []))
    def campo(a, b):
        m = re.search(a + r'\s*:?\s*(.*?)\s*(?=' + b + ')', ct)
        return m.group(1).strip(' .') if m else ''
    info = {'Dado de puntos de golpe': '1d8 por nivel de artífice',
            'Competencias en tiradas de salvación': campo('Tiradas de Salvaci.n', 'Habilidades:') or 'Constitución, Inteligencia',
            'Competencias en habilidades': campo('Habilidades', r'Los secretos|Adem.s del|\Z'),
            'Competencias con armas': campo('Armas', 'Herramientas:'),
            'Entrenamiento con armaduras': campo('Armadura', 'Armas:'),
            'Competencias con herramientas': campo('Herramientas', 'Tiradas de Salvaci.n')}
    info = {k: v for k, v in info.items() if v}
    dcl = E.html(E.parrafos(previo)) if previo else ''
    for s in general:
        dcl += '<h3>%s</h3>' % s['n'] + E.html(E.parrafos(s['lineas']))
    dcl += '<h3>Rasgos de clase de artífice</h3>' + ''.join('<h4>Nivel %d: %s</h4>%s' % (f['nv'], f['n'], html_f(f)) for f in feats)
    clase = {'n': 'Artífice', 'pg': pg(items[0]['p']), 'info': info, 'sub': SUBS, 'd': dcl, 'pend': True,
             'dudas': ['clase leída de un PDF con títulos dibujados (OCR): compruébala con el libro; las tablas de rasgos y de conjuros están aplanadas en texto',
                       'los datos de la ficha (competencias) se sacaron del texto: compruébalos']}
    sub = json.load(open(fsub, encoding='utf-8'))['rasgos']
    m = json.load(open(modulo, encoding='utf-8'))
    m['clases'] = [c for c in m.get('clases', []) if c['n'] != 'Artífice'] + [clase]
    m['rasgos'] = [x for x in m['rasgos'] if x.get('cls') != 'Artífice' or x.get('tipo') == 'Opción de clase'] + rasgos + sub
    json.dump(m, open(modulo, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('clase', clase['pg'], list(info.items()))
    for f in feats: print(' nivel', f['nv'], f['n'], [t for t, _ in f['partes'] if t], len(html_f(f)))
    print('general:', [(s['n'], len(s['lineas'])) for s in general], 'previo', len(previo))
    print('rasgos de clase', len(rasgos), '+ subclases', len(sub))


if __name__ == '__main__':
    main()
