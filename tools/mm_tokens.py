"""Mete en el módulo del Manual de Monstruos el token (reducido) de cada criatura, a partir de las imágenes de tools/mm_imagenes.py.
Uso: python tools/mm_tokens.py <modulo.json> <carpeta_imagenes> <salida.json> [lado_px=128] [calidad=70]
Necesita Pillow (pip install --target <dir> pillow y poner <dir> en PYTHONPATH). El token va como data URL en el campo «tok» (máx. 60000 caracteres).
Uso personal: entrada y salida en datos/privado/."""
import sys, os, re, json, io, base64
from PIL import Image


def slug(n):
    return re.sub(r'[^a-z0-9]+', '-', n.lower()).strip('-')


def main():
    mod = json.load(open(sys.argv[1], encoding='utf-8'))
    carpeta, salida = sys.argv[2], sys.argv[3]
    lado = int(sys.argv[4]) if len(sys.argv) > 4 else 128
    calidad = int(sys.argv[5]) if len(sys.argv) > 5 else 70
    hechos = 0; total = 0
    for c in mod['criaturas']:
        en = c.get('en')
        if not en:
            continue
        f = os.path.join(carpeta, 'tok', slug(en) + '.webp')
        if not os.path.exists(f):
            continue
        im = Image.open(f).convert('RGBA')
        s = min(im.size)
        im = im.crop(((im.width - s) // 2, (im.height - s) // 2, (im.width + s) // 2, (im.height + s) // 2)).resize((lado, lado), Image.LANCZOS)
        q = calidad
        while True:
            b = io.BytesIO(); im.save(b, 'WEBP', quality=q, method=6)
            d = 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
            if len(d) <= 58000 or q <= 20:
                break
            q -= 10
        if len(d) <= 58000:
            c['tok'] = d; hechos += 1; total += len(d)
    json.dump(mod, open(salida, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{hechos} tokens ({total // 1024} KB) -> {salida}')


if __name__ == '__main__':
    main()
