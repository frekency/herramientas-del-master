#!/usr/bin/env python
"""Las 12 clases del Manual del Jugador 2024 (escaneado con capa OCR): ficha, texto y rasgos de clase.

Solo uso personal. Añade al módulo «clases» (ficha) y «rasgos» de tipo «Rasgo de clase». Las subclases y las opciones de clase
(invocaciones, maniobras, metamagia) las sacan libro_mdj.py y libro_opciones_mdj.py; la tabla de rasgos por nivel y las listas
de conjuros no se incluyen (los conjuros ya llevan su clase).
Uso: python tools/libro_clases_mdj.py <pdf> <modulo.json> [Clase ...]
"""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pymupdf
import libro_entradas as E
from libro_mdj import CLASES_INI, RX_NIV, CANON, OFFSET

X_VAL = 262
ROWS = [('caracteristica', 'Característica principal'), ('dado', 'Dado de puntos de golpe'), ('salvacion', 'Competencias en tiradas de salvación'),
        ('habilidades', 'Competencias en habilidades'), ('armas', 'Competencias con armas'), ('armaduras', 'Entrenamiento con armaduras'),
        ('herramientas', 'Competencias con herramientas'), ('inicial', 'Equipo inicial')]


def info_tabla(d, p, y0, y1):
    """Filas «etiqueta | valor» de «Atributos básicos»: etiqueta a la izquierda (x<262), valor a la derecha."""
    W = [w for w in d[p - 1].get_text('words') if y0 < w[1] < y1 and 75 < w[0] < 540]
    lin = {}
    for w in W:
        lin.setdefault(round(w[1] / 9), []).append(w)
    filas, cur = [], None
    prev = None
    for k in sorted(lin):
        if prev is not None and (k - prev) * 9 > 40:      # un hueco grande: acaba la tabla
            break
        prev = k
        ws = sorted(lin[k], key=lambda w: w[0])
        et = ' '.join(w[4] for w in ws if w[0] < X_VAL)
        va = ' '.join(w[4] for w in ws if w[0] >= X_VAL)
        f = E.fold(et)
        if re.match(r'^(caracteristica|dado|competencias|entrenamiento|equipo)', f):
            cur = {'et': et, 'va': va}
            filas.append(cur)
        elif cur is not None:
            cur['et'] += ' ' + et
            cur['va'] += ' ' + va
    out = {}
    for fl in filas:
        f = E.fold(fl['et'])
        clave = next((k for k, _ in ROWS if k in f), None)
        if clave:
            out[clave] = re.sub(r'\s+', ' ', fl['va'].replace('|', ' ')).replace('- ', '').strip()
    return {nom: out[k] for k, nom in ROWS if out.get(k)}


def clase(d, a, nom, sig):
    ini = a - 1
    L = []
    for p in range(ini, sig):
        ls, _ = E.lineas_pag(d, p)
        L += ls
    fin = next((i for i, r in enumerate(L) if r['size'] >= 26 and E.fold(r['t']).startswith('subclases de')), len(L))
    L = L[:fin]
    ia = next((i for i, r in enumerate(L) if r['size'] >= 17 and 'atributos basicos' in E.fold(r['t'])[:20]), None)
    info, yc = {}, None
    if ia is not None:
        h = L[ia]
        sig_t = next((r for r in L[ia + 1:] if r['p'] == h['p'] and r['col'] == h['col'] and r['size'] >= 20), None)
        yc = sig_t['y'] if sig_t else h['y'] + 330
        info = info_tabla(d, h['p'], h['y'] + 8, yc - 4)
    marcas = []
    for i, r in enumerate(L):
        if r['size'] < 17.5 or len(r['t']) > 70 or len(r['t'].strip()) <= 2:
            continue
        letras = [c for c in r['t'] if c.isalpha()]
        if len(letras) < 4 or sum(c.isupper() for c in letras) / len(letras) < 0.6:
            continue
        f = re.sub(r'^(n[a-z]{2,6})\s*[l|i1]\s*[:;.,]', r'\1 1:', E.fold(r['t']))
        m = RX_NIV.match(f)
        if m and 1 <= int(m.group(1)) <= 20 and r['size'] >= 16.5:
            marcas.append((i, 'f', int(m.group(1)), re.sub(r'^\S+\s*\S{1,2}\s*[:;.,]\s*', '', r['t']).strip()))
        elif not m:
            marcas.append((i, 's', 0, r['t']))
    secs, feats = [], []
    previo = [r for r in L[:marcas[0][0]]] if marcas else []
    for k, (i, tp, nv, tx) in enumerate(marcas):
        fin_i = marcas[k + 1][0] if k + 1 < len(marcas) else len(L)
        cuerpo = list(L[i + 1:fin_i])
        if ia is not None and i == ia:
            cuerpo = [r for r in cuerpo if not (r['p'] == L[ia]['p'] and r['col'] == L[ia]['col'] and r['y'] < yc)]
        if tp == 'f':
            nom_f = E.titulo_bonito(tx)
            while cuerpo and E.es_titulo(cuerpo[0], 17) and len(cuerpo[0]['t']) < 40 and cuerpo[0]['size'] >= 17.5 and cuerpo[0]['y'] - L[i]['y'] < 40 and cuerpo[0]['p'] == L[i]['p']:
                nom_f += ' ' + cuerpo[0]['t'].lower()
                cuerpo = cuerpo[1:]
            feats.append({'n': nom_f, 'nv': nv, 'lineas': cuerpo, 'p': L[i]['p']})
        else:
            secs.append({'n': E.titulo_bonito(tx), 'lineas': cuerpo, 'p': L[i]['p'], 'raw': tx})
    return {'n': nom, 'info': info, 'feats': feats, 'secs': secs, 'previo': previo, 'p': ini}


FICH5E = {'Bárbaro': 'barbarian', 'Bardo': 'bard', 'Brujo': 'warlock', 'Clérigo': 'cleric', 'Druida': 'druid', 'Explorador': 'ranger', 'Guerrero': 'fighter',
          'Hechicero': 'sorcerer', 'Mago': 'wizard', 'Monje': 'monk', 'Paladín': 'paladin', 'Pícaro': 'rogue'}


def dado_5e(nom):
    try:
        f = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'datos', 'privado', '5etools', 'class-%s.json' % FICH5E[nom])
        for c in json.load(open(f, encoding='utf-8'))['class']:
            if c['source'] in ('XPHB', 'PHB'):
                if c['source'] == 'XPHB' or True:
                    return c['hd']['faces']
    except Exception:
        return None


def main():
    pdf, modulo = sys.argv[1], sys.argv[2]
    solo = set(sys.argv[3:])
    d = pymupdf.open(pdf)
    m = json.load(open(modulo, encoding='utf-8'))
    cls_out, rasgos = [], []
    for (a, nom), (b, _) in zip(CLASES_INI, CLASES_INI[1:]):
        if solo and nom not in solo:
            continue
        c = clase(d, a, nom, b)
        dh = E.html(E.parrafos(c['previo']))
        notas = []
        for s in c['secs']:
            f = E.fold(s['raw'])
            if 'atributos basicos' in f[:20]:
                dh += E.html(E.parrafos(s['lineas']))
            elif 'convertirse' in f[:20]:
                dh += '<h3>%s</h3>' % s['n'] + E.html(E.parrafos(s['lineas']))
            elif 'como personaje' in f[:16]:
                dh += '<h4>%s</h4>' % s['n'] + E.html(E.parrafos(s['lineas']))
            elif 'rasgos de clase' in f[:20]:
                pass
            else:
                notas.append(s['n'])
        dh += '<h3>Rasgos de clase de %s</h3>' % nom.lower()
        cnt = {}
        for f in c['feats']:
            cnt[f['n']] = cnt.get(f['n'], 0) + 1
        for f in c['feats']:
            cuerpo = E.html(E.parrafos(f['lineas']))
            dh += '<h4>Nivel %d: %s</h4>%s' % (f['nv'], f['n'], cuerpo)
            n = '%s (%s)' % (f['n'], nom) if cnt[f['n']] == 1 else '%s (%s, nivel %d)' % (f['n'], nom, f['nv'])
            x = {'n': n, 'base': f['n'], 'cls': nom, 'sub': '', 'nv': f['nv'], 'tipo': 'Rasgo de clase', 'pg': str(f['p'] - OFFSET), 'd': cuerpo, 'pend': True,
                 'dudas': ['leído de un escaneado con OCR: compruébalo con el libro']}
            if len(cuerpo) < 40:
                x['dudas'].append('texto muy corto: puede faltar parte')
            rasgos.append(x)
        hd = dado_5e(nom)
        dd = c['info'].get('Dado de puntos de golpe', '')
        du0 = []
        if hd and not re.match(r'^1d%d' % hd, dd):
            c['info']['Dado de puntos de golpe'] = '1d%d por nivel de %s' % (hd, nom.lower())
            du0.append('el dado de golpe se leyó mal con OCR («%s») y se corrigió con 5etools: compruébalo' % dd)
        du = du0 + ['clase leída de un escaneado con OCR: compruébala con el libro', 'la tabla de rasgos por nivel y las listas de conjuros no están incluidas']
        if len(c['info']) < 6:
            du.append('ficha incompleta (%d de 8 datos): compruébala' % len(c['info']))
        if notas:
            du.append('secciones no incluidas en el texto: ' + ', '.join(notas))
        cls_out.append({'n': nom, 'pg': str(c['p'] - OFFSET), 'info': c['info'], 'sub': CANON.get(nom, []), 'd': dh, 'pend': True, 'dudas': du})
        print(nom, 'ficha', len(c['info']), '| niveles', [f['nv'] for f in c['feats']], '| otras secciones', notas)
    nombres = {x['n'] for x in cls_out}
    m['clases'] = [x for x in m.get('clases', []) if x['n'] not in nombres] + cls_out
    m['rasgos'] = [x for x in m['rasgos'] if not (x.get('tipo') == 'Rasgo de clase' and x.get('cls') in nombres)] + rasgos
    json.dump(m, open(modulo, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(cls_out), 'clases,', len(rasgos), 'rasgos de clase')


if __name__ == '__main__':
    main()
