#!/usr/bin/env python
"""Pone título a las tablas de un módulo que salieron sin él, leyendo con el OCR de Windows la franja de la página encima de cada tabla.

Solo uso personal. Uso: python tools/libro_titulos_tablas.py <pdf> <modulo.json> [alto_franja=44]
Cada tabla sin título lleva «_pos»: [página del PDF, x0, y de la cabecera, x1]. Se recorta la franja justo encima, se lee con tres
resoluciones y se queda con la lectura de la línea más alta (los títulos son la letra más grande). Se quita «_pos» de todas.
La tabla pasa a llamarse con el título leído (con el prefijo que ya tuviera, p. ej. «Nombres: ») y queda anotado en dudas.
"""
import sys, os, re, json, tempfile, subprocess, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pymupdf
import libro_entradas as E
import libro_subclases_xt as X


def limpia(t):
    t = re.sub(r'[^A-Za-zÁÉÍÓÚÑÜáéíóúñü0-9 ,:\-–()/]', '', t.replace('�', ''))
    t = re.sub(r'(\d)\s*[-–—]\s*(\d)', r'-', re.sub(r'\s+', ' ', t)).strip()
    return E.titulo_bonito(t)


def main():
    pdf, modulo = sys.argv[1], sys.argv[2]
    alto = float(sys.argv[3]) if len(sys.argv) > 3 else 44
    esc = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0      # 0,5 si las posiciones vienen de un OCR a doble resolución (Guía del Máster)
    alto *= 1
    d = pymupdf.open(pdf)
    m = json.load(open(modulo, encoding='utf-8'))
    T = [t for t in m.get('tablas', []) if t.get('_pos')]
    print(len(T), 'tablas sin título')
    tmp = tempfile.mkdtemp(prefix='tt_')
    DPIS = (400, 300)
    try:
        for i, t in enumerate(T):
            p, x0, y0, x1 = t['_pos']
            x0, y0, x1 = x0 * esc, y0 * esc, x1 * esc
            for dp in DPIS:
                d[p - 1].get_pixmap(dpi=dp, clip=pymupdf.Rect(max(0, x0 - 4), max(0, y0 - (alto if x1 - x0 > 130 * esc else 26)), min(d[p - 1].rect.width, x1 if x1 - x0 >= 100 * esc else x0 + 200 * esc), y0 - 1)).save(os.path.join(tmp, 't%04d_%d.png' % (i, dp)))
        ps = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ocr_lote.ps1')
        subprocess.run(['powershell', '-NoProfile', '-File', ps, tmp, os.path.join(tmp, 'o.json')], check=True, capture_output=True)
        with open(os.path.join(tmp, 'o.json'), encoding='utf-8-sig') as f:
            r = json.load(f)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    ok = 0
    for i, t in enumerate(T):
        mejor = ''
        for dp in DPIS:
            ls = r.get('t%04d_%d' % (i, dp)) or []
            ls = [l for l in ls if len(l['t'].strip()) > 2]
            if not ls:
                continue
            # los títulos van en mayúsculas o en la letra más grande: la línea más alta de la franja
            alt = max(l.get('y1', 0) - l.get('y', 0) for l in ls)
            c = [l for l in ls if l.get('y1', 0) - l.get('y', 0) >= alt * 0.8]
            tx = limpia(' '.join(l['t'] for l in sorted(c, key=lambda l: l.get('y', 0))))
            if len(tx) > len(mejor) and len(tx) < 80:
                mejor = tx
        t.pop('_pos', None)
        mejor = re.split(r'\s+(?:[1il]?d\s?[\dlo]+|id[lo]+)', mejor, flags=re.I)[0].strip()      # el recorte cogió también la cabecera: se corta ahí
        if len(mejor) > 48 or len(mejor.split()) > 8:
            mejor = ''      # un párrafo, no un título
        if mejor and len(mejor) >= 4:
            pref = re.match(r'^(Nombres: )', t['n'])
            t['n'] = (pref.group(1) if pref else '') + mejor
            t['dudas'] = [x for x in t['dudas'] if 'no se encontró el título' not in x] + ['título leído con OCR del libro: compruébalo']
            ok += 1
    for t in m['tablas']:
        t.pop('_pos', None)
    # nombres repetidos
    vistos = {}
    for t in m['tablas']:
        n = t['n']
        if n in vistos:
            vistos[n] += 1
            t['n'] = '%s (%d)' % (n, vistos[n])
        else:
            vistos[n] = 1
    json.dump(m, open(modulo, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(ok, 'títulos leídos de', len(T))
    for t in m['tablas'][:0]:
        pass


if __name__ == '__main__':
    main()
