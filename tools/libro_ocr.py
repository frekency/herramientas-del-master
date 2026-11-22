#!/usr/bin/env python
"""OCR de un PDF escaneado (por ejemplo, la Guía del Dungeon Master 2024) con el OCR de Windows (es-ES).

Solo para uso personal: el resultado va a datos/privado/ (fuera de git).
Uso: python tools/libro_ocr.py <pdf> <salida.json> [pag_ini pag_fin]
Cada página sale como lista de líneas {t,x,y,x1,y1} en píxeles a 150 ppp. Se guarda cada 20 páginas y se
reanuda solo: si la salida ya existe, se saltan las páginas hechas.
"""
import sys, os, json, subprocess, tempfile, shutil
import pymupdf

DPI = 150
HERE = os.path.dirname(os.path.abspath(__file__))
OCR_PS = os.path.join(HERE, 'ocr_lote.ps1')
LOTE = 20


def ocr_dir(d, out):
    subprocess.run(['powershell', '-NoProfile', '-File', OCR_PS, d, out], check=True, capture_output=True)
    with open(out, encoding='utf-8-sig') as f:
        return json.load(f)


def main():
    pdf, salida = sys.argv[1], sys.argv[2]
    d = pymupdf.open(pdf)
    a = int(sys.argv[3]) if len(sys.argv) > 3 else 1
    b = int(sys.argv[4]) if len(sys.argv) > 4 else d.page_count
    R = {}
    if os.path.exists(salida):
        with open(salida, encoding='utf-8') as f:
            R = json.load(f)
    todo = [n for n in range(a, b + 1) if f'p{n:03d}' not in R]
    print(f'{len(todo)} páginas por leer de {b - a + 1}', flush=True)
    for i in range(0, len(todo), LOTE):
        lote = todo[i:i + LOTE]
        tmp = tempfile.mkdtemp(prefix='ocr_')
        try:
            for n in lote:
                d[n - 1].get_pixmap(dpi=DPI).save(os.path.join(tmp, f'p{n:03d}.png'))
            res = ocr_dir(tmp, os.path.join(tmp, 'o.json'))
            for n in lote:
                R[f'p{n:03d}'] = res.get(f'p{n:03d}') or []
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
        with open(salida, 'w', encoding='utf-8') as f:
            json.dump(R, f, ensure_ascii=False)
        print(f'{len(R)} páginas hechas (última {lote[-1]})', flush=True)
    print('listo', flush=True)


if __name__ == '__main__':
    main()
