#!/usr/bin/env python
"""Pone en el campo «img» de los objetos de un módulo la ilustración elegida en la página de tools/objetos_revision.py.

Solo uso personal. Uso: python tools/objetos_aplicar.py <modulo.json> <elegidos.json> <FUENTE> <carpeta_imagenes> [lado_px=256] [calidad=70]
Necesita Pillow (pip install --target <dir> pillow y PYTHONPATH)."""
import sys, os, json, io, base64
from PIL import Image


def main():
    modulo, elegidos, fuente, carp = sys.argv[1:5]
    lado = int(sys.argv[5]) if len(sys.argv) > 5 else 256
    cal = int(sys.argv[6]) if len(sys.argv) > 6 else 70
    m = json.load(open(modulo, encoding='utf-8'))
    el = json.load(open(elegidos, encoding='utf-8'))
    por_n = {}
    for en, es in el.items():
        if es:
            por_n.setdefault(es, []).append(en)
    n = 0
    for o in m['objetos']:
        ens = por_n.get(o['n'])
        if not ens:
            continue
        im = Image.open(os.path.join(carp, 'items', fuente, ens[0] + '.webp')).convert('RGBA')
        im.thumbnail((lado, lado), Image.LANCZOS)
        q = cal
        while True:
            b = io.BytesIO()
            im.save(b, 'WEBP', quality=q, method=6)
            d = 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
            if len(d) <= 70000 or q <= 20:
                break
            q -= 10
        if len(d) <= 85000:
            o['img'] = d
            n += 1
    json.dump(m, open(modulo, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(n, 'objetos con ilustración;', sum(1 for v in el.values() if v and v not in {o['n'] for o in m['objetos']}), 'elecciones sin objeto')


if __name__ == '__main__':
    main()
