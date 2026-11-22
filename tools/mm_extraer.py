#!/usr/bin/env python
"""Extractor del Manual de Monstruos 2024 (PDF escaneado) a módulo JSON para «Mi copia».

Solo para uso personal: el resultado va a datos/privado/ (fuera de git) y no debe publicarse.
Uso: python tools/mm_extraer.py <pdf> <pag_ini> <pag_fin> <salida.json>
Necesita PyMuPDF y el OCR de Windows (es-ES). Cada criatura sale con pend:true y, si algo no cuadra,
con «dudas» (lista de comprobaciones fallidas) para revisarla con el libro en la mano.
"""
import sys, os, re, json, subprocess, tempfile, math, unicodedata
import pymupdf

DPI = 150
HERE = os.path.dirname(os.path.abspath(__file__))
OCR_PS = os.path.join(HERE, 'ocr_lote.ps1')
OFFSET = 3  # pág. impresa = pág. PDF - 3

SIZES = {'diminuto': 'Tiny', 'pequeno': 'Small', 'mediano': 'Medium', 'grande': 'Large', 'enorme': 'Huge', 'gargantuesco': 'Gargantuan'}
TYPES = {'aberracion': 'Aberration', 'bestia': 'Beast', 'celestial': 'Celestial', 'constructo': 'Construct', 'dragon': 'Dragon',
         'elemental': 'Elemental', 'feerico': 'Fey', 'infernal': 'Fiend', 'gigante': 'Giant', 'humanoide': 'Humanoid',
         'monstruosidad': 'Monstrosity', 'cieno': 'Ooze', 'planta': 'Plant', 'no muerto': 'Undead'}
CR_XP = {'0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900, '8': 3900,
         '9': 5000, '10': 5900, '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000, '16': 15000, '17': 18000, '18': 20000,
         '19': 22000, '20': 25000, '21': 33000, '22': 41000, '23': 50000, '24': 62000, '25': 75000, '26': 90000, '27': 105000,
         '28': 120000, '29': 135000, '30': 155000}
AB = ['FUE', 'DES', 'CON', 'INT', 'SAB', 'CAR']


def fold(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').lower().strip()


def ocr_dir(d, out):
    subprocess.run(['powershell', '-NoProfile', '-File', OCR_PS, d, out], check=True, capture_output=True)
    with open(out, encoding='utf-8-sig') as f:
        return json.load(f)


def limpia(t):
    t = t.replace('−', '-').replace('–', '-')
    t = re.sub(r'\bId(\d)', r'1d\1', t)
    t = re.sub(r'\bEI\b', 'El', t)
    t = re.sub(r'^PC:', 'PG:', t)
    t = re.sub(r'\bpx\b', 'PX', t)
    t = re.sub(r'(\d)\s*[oO]\s*(\d)', r'\1 o \2', t)
    return t.strip()


def mod(s):
    return (s - 10) // 2


# ---------- fase 1: localizar fichas ----------
TIPO_RE = re.compile(r'^(.+?)\s+(Diminuto|Pequeño|Mediano|Grande|Enorme|Gargantuesco)(?:\s+o\s+\w+)?\s*(?:\((.*?)\))?,\s*(.+)$', re.I)


def es_titulo(lines, i):
    t = lines[i]['t'].strip()
    if len(t) < 3 or i + 2 >= len(lines):
        return False
    letras = [c for c in t if c.isalpha()]
    if not letras or sum(c.isupper() for c in letras) / len(letras) < .85:
        return False
    nxt = lines[i + 1]['t'].replace('�', 'ñ')
    return bool(TIPO_RE.match(nxt)) and abs(lines[i + 1]['x'] - lines[i]['x']) < 40


def localiza(lines, W):
    mitad = W / 2
    blocks = []
    for i, l in enumerate(lines):
        if es_titulo(lines, i):
            blocks.append({'t': l['t'].strip(), 'x': l['x'], 'y': l['y'], 'col': 0 if l['x'] < mitad - 40 else 1})
    for b in blocks:
        otras = [c for c in blocks if c is not b and c['col'] == 1 and abs(c['y'] - b['y']) < 400]
        b['ancho'] = b['col'] == 0 and not otras
    return blocks


# ---------- fase 2: leer una ficha ----------
def crops(page, W_px, H_px, b, tmp, nombre):
    k = 72 / DPI
    pie = 2290
    x0 = max(0, b['x'] - 12)
    rects = []
    if b['col'] == 0:
        rects.append(('A', pymupdf.Rect(x0 * k, (b['y'] - 6) * k, (W_px / 2 + 5) * k, pie * k)))
        if b['ancho']:
            rects.append(('B', pymupdf.Rect((W_px / 2 + 5) * k, (b['y'] - 6) * k, (W_px - 70) * k, pie * k)))
    else:
        rects.append(('A', pymupdf.Rect(x0 * k, (b['y'] - 6) * k, (W_px - 70) * k, pie * k)))
    for tag, r in rects:
        page.get_pixmap(dpi=220, clip=r).save(os.path.join(tmp, f'{nombre}_{tag}.png'))
    return [t for t, _ in rects], rects[0][1]


def celdas_crops(page, rectA, rows, tmp, nombre):
    """Recorta cada celda de la tabla de características (3 columnas x 2 filas) a 300 ppp."""
    k = 72 / 220
    w = (rectA.x1 - rectA.x0) / 3
    for r, y in enumerate(rows):
        for c in range(3):
            rc = pymupdf.Rect(rectA.x0 + c * w, rectA.y0 + (y - 14) * k, rectA.x0 + (c + 1) * w, rectA.y0 + (y + 40) * k)
            page.get_pixmap(dpi=300, clip=rc).save(os.path.join(tmp, f'{nombre}_c{r}{c}.png'))


ETIQ = re.compile(r'^(CA|PG|Iniciativa|Velocidad|Habilidades|Inmunidades|Resistencias|Vulnerabilidades|Sentidos|Idiomas|VD|Equipo)\s*:', re.I)
SECC = {'atributos': 't', 'rasgos': 't', 'acciones': 'a', 'acciones adicionales': 'b', 'reacciones': 'r', 'acciones legendarias': 'l'}


def filas(lines, tol=16):
    """El OCR devuelve fragmentos desordenados: se agrupan por altura y se ordenan por x."""
    out = []
    for l in sorted([l for l in lines if l.get('t')], key=lambda l: l['y']):
        if out and abs(l['y'] - out[-1]['y']) <= tol:
            out[-1]['p'].append(l)
        else:
            out.append({'y': l['y'], 'p': [l]})
    res = []
    for r in out:
        ps = sorted(r['p'], key=lambda l: l['x'])
        res.append({'y': r['y'], 'x': ps[0]['x'], 't': limpia(' '.join(p['t'] for p in ps))})
    return res


def parte_texto(lines):
    out = []
    for r in filas(lines):
        t = r['t']
        if re.match(r'^\d[\d\s]*\(\d+d\d+', t):
            t = 'PG: ' + t   # el OCR pierde a veces la etiqueta
        if t: out.append(t)
    return out


def parsea(nombre, texto, pag):
    dudas = []
    L = [l for l in texto if l]
    ficha = {'n': nombre.title().replace(' De ', ' de ').replace(' Del ', ' del ').replace(' La ', ' la ').replace(' Y ', ' y '), 'pg': str(pag)}
    # tipo
    k0 = next((i for i, x in enumerate(L[:4]) if TIPO_RE.match(x)), None)
    if k0 is None:
        return None
    L = L[k0:]
    m = TIPO_RE.match(L[0])
    tipo = fold(m.group(1)); tam = fold(m.group(2))
    ficha['tyl'] = L[0]
    ficha['sz'] = SIZES.get(tam, 'Medium')
    ty = next((v for k, v in TYPES.items() if tipo.startswith(k)), None)
    if not ty: dudas.append('tipo de criatura no reconocido: ' + m.group(1))
    ficha['ty'] = ty or 'Monstrosity'
    al = m.group(4).strip()
    alf = fold(al)
    mp = {'legal': 'lawful', 'caotico': 'chaotic', 'bueno': 'good', 'malvado': 'evil'}
    if alf in ('neutral', 'sin alineamiento'):
        ficha['al'] = 'neutral' if alf == 'neutral' else 'unaligned'
    elif re.fullmatch(r'(legal|neutral|caotico)( (bueno|neutral|malvado))?', alf):
        ficha['al'] = alf.replace('neutral neutral', 'neutral') and ' '.join(mp.get(w, w) for w in alf.split())
    else:
        ficha['al'] = al
    # campos de cabecera
    cuerpo = L[1:]
    campos = {}
    i = 0; actual = None; resto = []
    sec = None; entradas = {k: [] for k in 'tabrl'}
    tabla = []
    j = 0
    while j < len(cuerpo):
        s = cuerpo[j]
        f = fold(s)
        if f in SECC and s.upper() == s or (f in SECC and len(s) < 26 and s[:1].isupper() and s.upper() == s):
            sec = SECC[f]; j += 1; continue
        if sec is None:
            em = ETIQ.match(s)
            if em:
                actual = fold(em.group(1)); campos[actual] = s[em.end():].strip()
            elif re.match(r'^(MOD|FUE|DES|CON|INT|SAB|CAR)\b', s):
                tabla.append(s)
            elif actual and not re.match(r'^(MOD|SALV)', s):
                campos[actual] += ' ' + s
            j += 1; continue
        entradas[sec].append(s); j += 1
    return ficha, campos, tabla, entradas, dudas


def entradas_a_lista(lineas):
    out = []; cur = None
    for s in lineas:
        mm = re.match(r'^([A-ZÁÉÍÓÚÑ][^.:,]{1,80}?)\.\s*(.*)$', s)
        nuevo = False
        if mm and len(mm.group(1).split()) <= 8 and not re.search(r'\d{2,}', mm.group(1)):
            prev = cur['txt'] if cur else ''
            nuevo = (not cur) or prev.rstrip().endswith(('.', ')', ':')) and not prev.rstrip().endswith('-')
        if nuevo:
            cur = {'n': mm.group(1).strip(), 'txt': mm.group(2).strip()}; out.append(cur)
        elif cur is not None:
            if cur['txt'].endswith('-') and s[:1].islower():
                cur['txt'] = cur['txt'][:-1] + s
            else:
                cur['txt'] = (cur['txt'] + ' ' + s).strip()
        else:
            out.append({'n': '', 'txt': s}); cur = out[-1]
    return out


def a_pares(lista):
    res = []
    for e in lista:
        if not e['n']:
            continue
        n = e['n']; tag = None
        mt = re.match(r'^(.*?)\s*\((recarga[^)]*|\d+\s*/\s*d[ií]a[^)]*)\)$', n, re.I)
        if mt:
            n = mt.group(1); tag = mt.group(2).strip().replace('recarga', 'Recarga').replace('-', '–')
        res.append([n, e['txt']] + ([tag] if tag else []))
    return res


def valida(f, dudas):
    ab = f.get('ab'); sv = f.get('sv')
    cr = f.get('cr')
    if cr in CR_XP and f.get('xp') is not None and f['xp'] != CR_XP[cr] and not re.search('guarida', str(f.get('_xpraw', ''))):
        dudas.append(f'PX {f["xp"]} no cuadra con VD {cr}')
    if f.get('hd') and f.get('hp') is not None:
        m = re.fullmatch(r'(\d+)d(\d+)([+-]\d+)?', f['hd'])
        if m:
            n, s, k = int(m.group(1)), int(m.group(2)), int(m.group(3) or 0)
            if (n * (s + 1)) // 2 + k != f['hp']:
                dudas.append(f'PG {f["hp"]} no cuadra con {f["hd"]}')
    if ab:
        for i in range(6):
            if sv and sv[i] < mod(ab[i]):
                dudas.append(f'salvación {AB[i]} menor que el modificador')
    # dados con media: «19 (2d8 + 10)»
    def revisa(txt, quien):
        for m in re.finditer(r'(\d+)\s*\((\d+)d(\d+)(?:\s*([+-])\s*(\d+))?\)', txt):
            media, n, s = int(m.group(1)), int(m.group(2)), int(m.group(3))
            k = int(m.group(5) or 0) * (-1 if m.group(4) == '-' else 1)
            if (n * (s + 1)) // 2 + k != media:
                dudas.append(f'{quien}: «{m.group(0)}» no cuadra')
    for key in 'tabrl':
        for e in f.get(key, []):
            revisa(e[1], e[0])


def construye(ficha, campos, tabla, entradas, dudas, celdas):
    f = ficha
    def num(s, d=None):
        m = re.search(r'-?\d+', s or '')
        return int(m.group(0)) if m else d
    if 'ca' in campos: f['ac'] = num(campos['ca'])
    else: dudas.append('falta CA')
    if 'iniciativa' in campos: f['in'] = num(campos['iniciativa'])
    if 'pg' in campos:
        m = re.match(r'\s*(\d[\d\s]*)\s*\(([^)]*)\)', campos['pg'])
        if m:
            f['hp'] = int(re.sub(r'\s', '', m.group(1))); f['hd'] = re.sub(r'\s', '', m.group(2))
        else: f['hp'] = num(campos['pg']); dudas.append('PG sin dados legibles')
    else: dudas.append('falta PG')
    if 'velocidad' in campos: f['sp'] = campos['velocidad']
    if 'habilidades' in campos: f['sk'] = campos['habilidades']
    if 'inmunidades' in campos: f['im'] = campos['inmunidades']
    if 'resistencias' in campos: f['re'] = campos['resistencias']
    if 'vulnerabilidades' in campos: f['vu'] = campos['vulnerabilidades']
    if 'idiomas' in campos: f['la'] = campos['idiomas']
    if 'equipo' in campos: f['eq'] = campos['equipo']
    if 'sentidos' in campos:
        s = campos['sentidos']; mp = re.search(r'Percepci[oó]n pasiva\s+(\d+)', s)
        if mp: f['pp'] = int(mp.group(1))
        f['se'] = re.sub(r';?\s*Percepci[oó]n pasiva\s+\d+\.?', '', s).strip(' ;')
    if 'vd' in campos:
        m = re.match(r'\s*([\d/]+)\s*\(([^)]*)\)', campos['vd'])
        if m:
            f['cr'] = m.group(1)
            px = re.match(r'\s*([\d\s\.]+)\s*PX', m.group(2))
            if px: f['xp'] = int(re.sub(r'[\s\.]', '', px.group(1)))
            f['_xpraw'] = m.group(2)
        else: dudas.append('VD ilegible')
    else: dudas.append('falta VD')
    # características
    ab = [None] * 6; sv = [None] * 6
    for t in (celdas or tabla):
        for m in re.finditer(r'\b(FUE|DES|CON|INT|SAB|CAR)\s+(\d{1,2})\s+([+-]\s*\d+)\s+([+-]\s*\d+)', t):
            i = AB.index(m.group(1)); ab[i] = int(m.group(2)); sv[i] = int(m.group(4).replace(' ', ''))
    falt = [AB[i] for i in range(6) if ab[i] is None]
    if falt: dudas.append('características ilegibles: ' + ', '.join(falt))
    f['ab'] = [a if a is not None else 10 for a in ab]
    f['sv'] = [s if s is not None else mod(f['ab'][i]) for i, s in enumerate(sv)]
    for k in 'tabrl':
        lst = a_pares(entradas_a_lista(entradas[k]))
        if k == 'l':
            ent = entradas_a_lista(entradas[k])
            for e in ent:
                if e['n'].lower().startswith('usos de acciones legendarias'):
                    pass
            intro = [e for e in ent if not e['n']]
            mu = re.search(r'Usos de acciones legendarias:\s*(\d+)', ' '.join(entradas[k]))
            if mu: f['lu'] = int(mu.group(1))
            lst = [x for x in lst if not x[0].lower().startswith('usos de acciones')]
        if lst: f[k] = lst
    f['pend'] = True
    valida(f, dudas)
    f.pop('_xpraw', None)
    if dudas: f['dudas'] = dudas
    return f


def main():
    pdf, a, b, salida = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
    d = pymupdf.open(pdf)
    tmp = tempfile.mkdtemp(prefix='mm_')
    pag_dir = os.path.join(tmp, 'pag'); os.makedirs(pag_dir)
    for n in range(a, b + 1):
        d[n - 1].get_pixmap(dpi=DPI).save(os.path.join(pag_dir, f'p{n:03d}.png'))
    P = ocr_dir(pag_dir, os.path.join(tmp, 'pag.json'))
    blk_dir = os.path.join(tmp, 'blk'); os.makedirs(blk_dir)
    pendientes = []
    for n in range(a, b + 1):
        lines = P.get(f'p{n:03d}') or []
        lines = [l for l in lines if l.get('t')]
        W = d[n - 1].rect.width * DPI / 72
        for k, bl in enumerate(localiza(lines, W)):
            nombre = f'p{n:03d}_{k}'
            partes, rectA = crops(d[n - 1], W, d[n - 1].rect.height * DPI / 72, bl, blk_dir, nombre)
            pendientes.append((n, nombre, bl, partes, rectA))
    R = ocr_dir(blk_dir, os.path.join(tmp, 'blk.json'))
    cel_dir = os.path.join(tmp, 'cel'); os.makedirs(cel_dir)
    filas_tab = {}
    for n, nombre, bl, partes, rectA in pendientes:
        fs_ = filas(R.get(f'{nombre}_A') or [])
        yf = next((r['y'] for r in fs_ if re.match(r'^(FUE|FUF|PUE)', r['t'])), None)
        yi = next((r['y'] for r in fs_ if re.match(r'^(INT|1NT|lNT)', r['t'])), None)
        if yf is not None and yi is not None:
            filas_tab[nombre] = (yf, yi)
            celdas_crops(d[n - 1], rectA, (yf, yi), cel_dir, nombre)
    C = ocr_dir(cel_dir, os.path.join(tmp, 'cel.json')) if filas_tab else {}
    criaturas = []; dudosas = 0
    for n, nombre, bl, partes, rectA in pendientes:
        texto = []
        for p in partes:
            texto += parte_texto(R.get(f'{nombre}_{p}') or [])
        r = parsea(bl['t'], texto, n - OFFSET)
        if not r:
            print('! no se pudo leer', bl['t'], 'pág', n - OFFSET); continue
        ficha, campos, tabla, entradas, dudas = r
        celdas = None
        if nombre in filas_tab:
            celdas = []
            for r_ in range(2):
                for c_ in range(3):
                    t_ = ' '.join(l['t'] for l in (C.get(f'{nombre}_c{r_}{c_}') or []))
                    celdas.append(f'{AB[r_ * 3 + c_]} ' + re.sub(r'^[A-Za-z]{2,4}\s+', '', limpia(t_)))
        c = construye(ficha, campos, tabla, entradas, dudas, celdas)
        criaturas.append(c)
        if c.get('dudas'): dudosas += 1
    out = {'modulo': 'Manual de Monstruos 2024', 'ab': 'MM2024', 'version': '2024', 'criaturas': criaturas}
    with open(salida, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f'{len(criaturas)} criaturas, {dudosas} con dudas -> {salida}  (temporales en {tmp})')


if __name__ == '__main__':
    main()
