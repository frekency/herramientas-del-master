#!/usr/bin/env python
"""Manual del Jugador 2024 -> dotes, trasfondos y especies para el módulo «Mi copia» (solo uso personal).
Uso: python tools/libro_mdj.py <pdf> <salida.json>   (añade/actualiza dotes, trasfondos y especies; conserva lo que ya haya)
Pendiente de revisar (pend:true) con «dudas» cuando algo no cuadra con 5etools (XPHB)."""
import sys, re, json, os
import pymupdf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import libro_entradas as E

OFFSET = 2           # página impresa = página del PDF − 2
CATS = {'origen': 'Origen', 'general': 'General', 'estilo': 'Estilo de combate', 'don': 'Don épico'}
CAT5 = {'Origen': 'O', 'General': 'G', 'Estilo de combate': 'FS', 'Don épico': 'EB'}


def dotes(d, f5):
    sig = lambda ls: bool(ls) and re.match(r'^Dote (de origen|general|de estilo|de don)', ls[0]['t'])
    pags = [p for p in range(195, 240) if re.search(r'Dote (de origen|general|de estilo|de don)', d[p - 1].get_text())]
    R = E.entradas(d, pags[0], pags[-1] + 1, sig)
    out, ntot = [], {}
    for r in R:
        cab = r['lineas'][0]['t']
        i = 1
        # el encabezado puede continuar en la línea siguiente «(requisitos: … 13 / o más)»
        while '(' in cab and ')' not in cab and i < len(r['lineas']) and i < 3:
            cab += ' ' + r['lineas'][i]['t']; i += 1
        k = 'origen' if 'origen' in cab[:16] else 'estilo' if 'estilo' in cab[:16] else 'don' if 'don' in cab[:12] else 'general'
        m = re.search(r'\((?:requisitos?):\s*(.*?)\)?\s*$', cab)
        req = m.group(1).strip().rstrip(')') if m else ''
        cuerpo = r['lineas'][i:]
        pars = E.parrafos(cuerpo)
        x = {'n': r['n'], 'cat': CATS[k], 'req': req, 'd': E.html(pars), 'pg': str(r['p'] - OFFSET), 'pend': True}
        dudas = []
        if len(x['d']) < 60: dudas.append('texto muy corto: puede faltar parte')
        if re.search(r'[0O][^\w]*$', x['n']) or re.search(r'[|¦]', x['d']): dudas.append('el OCR dejó signos raros: compáralo con el libro')
        if dudas: x['dudas'] = dudas
        out.append(x)
    esp = {}
    for f in f5:
        if f.get('source') == 'XPHB': esp[f.get('category', '')] = esp.get(f.get('category', ''), 0) + 1
    return out, esp


def _previo():
    ruta = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'datos', 'privado', 'libros', 'manual-del-jugador-2024.json')
    return json.load(open(ruta, encoding='utf-8'))


def _ocr(d, p, x0, y0, alto):
    import tempfile, subprocess, shutil
    tmp = tempfile.mkdtemp(prefix='tit_')
    try:
        d[p - 1].get_pixmap(dpi=200, clip=pymupdf.Rect(x0 - 6, y0, x0 + 420, y0 + alto)).save(os.path.join(tmp, 't.png'))
        ps = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ocr_lote.ps1')
        subprocess.run(['powershell', '-NoProfile', '-File', ps, tmp, os.path.join(tmp, 'o.json')], check=True, capture_output=True)
        r = json.load(open(os.path.join(tmp, 'o.json'), encoding='utf-8-sig'))
        ls = r.get('t') or []
        ls = [x['t'] for x in ls if len(x['t']) > 2]
        return ls[0] if ls else ''
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def _campo(txt, rot):
    m = re.search(rot + r':\s*(.*)', txt)
    return m.group(1).strip() if m else ''


def trasfondos(d):
    out = []
    for p in range(180, 188):
        ls, _ = E.lineas_pag(d, p)
        izq = [r for r in ls if r['col'] == 0]
        anc = [r for r in izq if r['t'].startswith('Puntuaciones de caract')]
        for k, a in enumerate(anc):
            tit = [r for r in izq if E.es_titulo(r) and a['y'] - 90 < r['y'] < a['y']]
            ocr = False
            if tit:
                nombre = E.titulo_bonito(' '.join(r['t'] for r in tit))
            else:
                nombre = E.titulo_bonito(_ocr(d, p, a['x0'], a['y'] - 78, 46)); ocr = True
            fin = anc[k + 1]['y'] - 70 if k + 1 < len(anc) else 99999
            bloque = [r for r in izq if r['y'] >= a['y'] and r['y'] < fin and not E.es_titulo(r)]
            txt, equipo_fin = [], False
            for r in bloque:
                if equipo_fin: break
                txt.append(r)
                if re.search(r'\(B\)\s*50\s*po', ' '.join(x['t'] for x in txt)): equipo_fin = True
            plano = re.sub(r'\s+', ' ', ' '.join(r['t'] for r in txt))
            etq = [('car', 'Puntuaciones de caracter[^:]*'), ('dote', 'Dote'), ('hab', 'Competencias en habilidades'), ('herr', 'Competencia con herramientas'), ('equipo', 'Equipo')]
            pos = []
            for kk, rot in etq:
                mm = re.search(rot + r':\s*', plano)
                if mm: pos.append((mm.start(), mm.end(), kk))
            pos.sort()
            x = {'n': nombre, 'pg': str(p - OFFSET)}
            for q, (i0, i1, kk) in enumerate(pos):
                x[kk] = plano[i1:(pos[q + 1][0] if q + 1 < len(pos) else len(plano))].strip()
            x['dote'] = re.sub(r'\s*\(consulta el cap.tulo \d+\)', '', x.get('dote', ''))
            der = [r for r in ls if r['col'] == 1 and a['y'] - 70 <= r['y'] < (anc[k + 1]['y'] - 70 if k + 1 < len(anc) else 99999)]
            hist = ' '.join(E.parrafos(der)).strip()
            cab = ''.join('<p><b>%s:</b> %s</p>' % (t, E.esc(x.get(kk, ''))) for kk, t in (('car', 'Puntuaciones de característica'), ('dote', 'Dote'), ('hab', 'Competencias en habilidades'), ('herr', 'Competencia con herramientas'), ('equipo', 'Equipo')) if x.get(kk))
            x['d'] = cab + ('<p><i>%s</i></p>' % E.esc(hist) if hist else '')
            x['pend'] = True
            du = []
            DEDU = {'fabricante': 'Artesano', 'iniciado en la magia (druida)': 'Guía', 'habilidoso': 'Noble'}
            if (not x['n'] or x['n'] == 'Comercian') and E.fold(x.get('dote', '')) in DEDU or x['n'] == 'Comercian':
                x['n'] = DEDU.get(E.fold(x.get('dote', '')), 'Comerciante'); du.append('el título no se leyó bien: nombre deducido de la dote, compruébalo')
            elif ocr: du.append('el título no venía en el texto del PDF: leído con OCR, compruébalo')
            if not x.get('car') or not x.get('hab') or not x.get('equipo'): du.append('falta algún campo (características, habilidades o equipo)')
            if len(x.get('equipo', '')) < 20: du.append('el equipo parece cortado')
            if du: x['dudas'] = du
            out.append(x)
    return out


ESPECIES = ['Aasimar', 'Dracónido', 'Elfo', 'Enano', 'Gnomo', 'Goliat', 'Humano', 'Mediano', 'Orco', 'Tiefling']


def especies(d):
    """Las diez especies del Manual del Jugador 2024 (págs. 188-200): «ATRIBUTOS DE LOS X» hasta el título de la siguiente."""
    ls = []
    for p in range(188, 201):
        l, _ = E.lineas_pag(d, p); ls += l
    out = []
    for k, nom in enumerate(ESPECIES):
        f = E.fold(nom)
        i = next((q for q, r in enumerate(ls) if re.match(r'^atributos de l[oa]s ' + f[:4], E.fold(r['t']))), None)
        if i is None:
            continue
        sig = E.fold(ESPECIES[k + 1]) if k + 1 < len(ESPECIES) else None
        j = next((q for q in range(i + 1, len(ls)) if sig and ls[q]['size'] >= 24 and sig[:4] in E.fold(ls[q]['t'])), len(ls))
        cuerpo = ls[i + 1:j]
        plano = re.sub(r'\s+', ' ', ' '.join(r['t'] for r in cuerpo))
        x = {'n': nom, 'pg': str(ls[i]['p'] - OFFSET), 'pend': True}
        m = re.search(r'Tipo de criatura:\s*(.*?)\s+Tama.o:\s*(.*?)\s+Velocidad:\s*(\S+(?:\s*m)?)', plano)
        if m:
            x['tipo'], x['tam'], x['vel'] = m.group(1), m.group(2), m.group(3)
        k0 = next((q for q, r in enumerate(cuerpo) if re.match(r'^Como (un |una )?\w+,', r['t'])), None)
        x['d'] = E.html(E.parrafos(cuerpo[k0:] if k0 is not None else cuerpo))
        du = [] if x.get('tipo') and x.get('tam') and x.get('vel') else ['falta tipo, tamaño o velocidad']
        du.append('puede incluir tablas o subtipos (linajes) aplanados en texto: compruébalo')
        x['dudas'] = du
        out.append(x)
    return out


def main():
    pdf, salida = sys.argv[1], sys.argv[2]
    d = pymupdf.open(pdf)
    f5 = json.load(open(os.path.join(os.path.dirname(salida), '..', '5etools', 'feats.json'), encoding='utf-8'))['feat']
    base = {}
    if os.path.exists(salida): base = json.load(open(salida, encoding='utf-8'))
    df, esp = dotes(d, f5)
    previo = _previo()
    ya = lambda k: {E.fold(x['n']) for x in previo.get(k, [])}
    base['dotes'] = df          # también lo que ya traiga otro módulo
    tb = trasfondos(d)
    base['trasfondos'] = tb
    base['especies'] = especies(d)
    ya_sub = {E.fold(t) for c in previo.get('clases', []) for t in c.get('sub', [])}
    sc = normaliza_subclases(subclases(d))
    base['rasgos'] = sc
    print('subclases nuevas', len({(x['cls'], x['sub']) for x in sc}), '· rasgos', len(sc))
    print('trasfondos', [x['n'] for x in tb], '-> nuevos', len(base['trasfondos']), '· especies', [x['n'] for x in base['especies']])
    base.setdefault('libro', 'Manual del Jugador 2024'); base.setdefault('abrev', 'XPHB')
    json.dump(base, open(salida, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    cnt = {}
    for x in df: cnt[x['cat']] = cnt.get(x['cat'], 0) + 1
    print('dotes', len(df), cnt, '· 5etools', esp)



CLASES_INI = [(54, 'Bárbaro'), (62, 'Bardo'), (72, 'Brujo'), (84, 'Clérigo'), (94, 'Druida'), (106, 'Explorador'), (116, 'Guerrero'),
              (126, 'Hechicero'), (140, 'Mago'), (152, 'Monje'), (160, 'Paladín'), (170, 'Pícaro'), (180, None)]
RX_NIV = re.compile(r'^n[a-z]{2,6}\s*(\d{1,2})\s*[:;.,]\s*(.+)$')


def subclases(d):
    """Subclases (Manual del Jugador): cada «NIVEL n: Rasgo» es un rasgo; el título grande que lo precede, la subclase."""
    out = []
    for (a, clase), (b, _) in zip(CLASES_INI, CLASES_INI[1:]):
        L, nums = [], {}
        for p in range(a, b):
            ls, n = E.lineas_pag(d, p); L += ls
        marcas = []                      # (índice, tipo, texto)
        for i, r in enumerate(L):
            if r['size'] < 15.5 or len(r['t']) > 70:
                continue
            f = E.fold(r['t'])
            m = RX_NIV.match(f)
            if m and 1 <= int(m.group(1)) <= 20 and r['size'] >= 16.5:
                marcas.append((i, 'f', int(m.group(1)), re.sub(r'^\S+\s*\d+\s*[:;.,]\s*', '', r['t']).strip()))
            elif r['size'] >= 21.5 and not m and not f.startswith('subclase') and len(f) > 5:
                marcas.append((i, 't', 0, r['t']))
        # los títulos grandes que no abren subclase («TERRENO ÁRIDO»…) forman parte del texto del rasgo anterior
        for k, m in enumerate(marcas):
            if m[1] == 't':
                sig = marcas[k + 1:k + 2]
                if not (sig and sig[0][1] == 'f' and sig[0][2] == 3 and (sig[0][0] - m[0]) < 20):
                    marcas[k] = (m[0], 'x', 0, m[3])
        marcas = [m for m in marcas]
        util = [m for m in marcas if m[1] != 'x']
        sub = None
        for k, (i, tp, nv, tx) in enumerate(util):
            fin = util[k + 1][0] if k + 1 < len(util) else len(L)
            cuerpo = [r for r in L[i + 1:fin]]
            if tp == 't':
                sub = E.titulo_bonito(tx)
                out.append({'n': '%s (%s: %s)' % (sub, clase, sub), 'base': sub, 'cls': clase, 'sub': sub, 'nv': None, 'tipo': 'Subclase', 'pg': str(L[i]['p'] - OFFSET), 'd': E.html(E.parrafos(cuerpo)), 'pend': True})
            elif sub:
                nom = E.titulo_bonito(tx)
                if cuerpo and E.es_titulo(cuerpo[0], 16.5) and len(cuerpo[0]['t']) < 40 and cuerpo[0]['size'] >= 17:
                    nom += ' ' + cuerpo[0]['t'].lower(); cuerpo = cuerpo[1:]
                x = {'n': '%s (%s: %s)' % (nom, clase, sub), 'base': nom, 'cls': clase, 'sub': sub, 'nv': nv, 'tipo': 'Rasgo de subclase', 'pg': str(L[i]['p'] - OFFSET), 'd': E.html(E.parrafos(cuerpo)), 'pend': True}
                if len(x['d']) < 40: x['dudas'] = ['texto muy corto: puede faltar parte']
                out.append(x)
    return out


CANON = {'Bárbaro': ['Senda del árbol del mundo', 'Senda del berserker', 'Senda del corazón salvaje', 'Senda del fanático'],
         'Bardo': ['Colegio de la danza', 'Colegio del conocimiento', 'Colegio del glamour', 'Colegio del valor'],
         'Brujo': ['Patrón celestial', 'Patrón feérico', 'Patrón infernal', 'Patrón primigenio'],
         'Clérigo': ['Dominio de la guerra', 'Dominio de la luz', 'Dominio de la vida', 'Dominio del engaño'],
         'Druida': ['Círculo de la luna', 'Círculo de la tierra', 'Círculo de las estrellas', 'Círculo del mar'],
         'Explorador': ['Acechador en la penumbra', 'Cazador', 'Errante feérico', 'Señor de las bestias'],
         'Guerrero': ['Caballero arcano', 'Campeón', 'Guerrero psiónico', 'Maestro del combate'],
         'Hechicero': ['Hechicería aberrante', 'Hechicería de magia salvaje', 'Hechicería dracónica', 'Hechicería mecánica'],
         'Mago': ['Abjurador', 'Adivino', 'Evocador', 'Ilusionista'],
         'Monje': ['Guerrero de la mano abierta', 'Guerrero de la misericordia', 'Guerrero de la sombra', 'Guerrero de los elementos'],
         'Paladín': ['Juramento de entrega', 'Juramento de gloria', 'Juramento de los antiguos', 'Juramento de venganza'],
         'Pícaro': ['Asesino', 'Embaucador arcano', 'Ladrón', 'Rebanaalmas']}


def normaliza_subclases(R):
    import difflib
    # un título ilegible se asigna a la única subclase de la clase que aún no ha aparecido
    usados = {}
    for x in R:
        if x['tipo'] == 'Subclase':
            c = x['cls']; mejor = max(CANON[c], key=lambda k: difflib.SequenceMatcher(None, E.fold(k), E.fold(x['sub'])).ratio())
            if difflib.SequenceMatcher(None, E.fold(mejor), E.fold(x['sub'])).ratio() >= 0.6 and not x['sub'].startswith(('Del ', 'Conjuros')):
                usados.setdefault(c, set()).add(mejor)
    for x in R:
        if x['tipo'] == 'Subclase':
            c = x['cls']; mejor = max(CANON[c], key=lambda k: difflib.SequenceMatcher(None, E.fold(k), E.fold(x['sub'])).ratio())
            if difflib.SequenceMatcher(None, E.fold(mejor), E.fold(x['sub'])).ratio() < 0.6 and not x['sub'].startswith(('Del ', 'Conjuros')):
                libres = [k for k in CANON[c] if k not in usados.get(c, set())]
                if len(libres) == 1:
                    x['sub'] = libres[0]; x['base'] = libres[0]; x['dudas'] = ['el título no se leyó bien: nombre deducido, compruébalo']; usados[c].add(libres[0])
    sal, ult, ultnv = [], {}, {}
    for x in R:
        c = x['cls']
        mejor = max(CANON[c], key=lambda k: difflib.SequenceMatcher(None, E.fold(k), E.fold(x['sub'])).ratio())
        r = difflib.SequenceMatcher(None, E.fold(mejor), E.fold(x['sub'])).ratio()
        malo = r < 0.6 or x['sub'].startswith(('Del ', 'Conjuros'))
        if x['tipo'] == 'Subclase':
            if malo: continue                      # título ilegible o continuación: no abre subclase
            ult[c] = mejor; ultnv[c] = 0
        else:
            if c not in ult: continue              # rasgos de la propia clase, anteriores a sus subclases
            mejor = ult[c]
            if x['nv'] < max(3, ultnv[c]): continue  # número suelto del OCR dentro de una tabla
            ultnv[c] = x['nv']
        x['sub'] = mejor
        x['n'] = '%s (%s: %s)' % (x['base'], c, mejor)
        sal.append(x)
    # una sola introducción por subclase y rasgos repetidos (mismo nombre y nivel)
    vistos, fin = set(), []
    for x in sal:
        k = (x['cls'], x['sub'], x['base'] if x['nv'] is None else '%s|%s' % (x['base'], x['nv']))
        if x['tipo'] == 'Subclase': k = (x['cls'], x['sub'], 'intro')
        if k in vistos: continue
        vistos.add(k); fin.append(x)
    return fin

if __name__ == '__main__':
    main()
