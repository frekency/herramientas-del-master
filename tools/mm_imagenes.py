"""Descarga los tokens y las imágenes de ambientación de 5e.tools (Manual de Monstruos) para uso personal.
Uso: python -I tools/mm_imagenes.py <bestiary-xmm.json> <fluff-bestiary-xmm.json> <carpeta_salida>
Guarda <salida>/tok/<slug>.webp, <salida>/img/<slug>.webp y <salida>/index.json ({slug: {tok:1, img:1}}).
El slug es el nombre en inglés en minúsculas con guiones. La carpeta va en datos/privado/ (fuera del repositorio)."""
import sys, os, re, json, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor

BASE = 'https://raw.githubusercontent.com/5etools-mirror-3/5etools-img/main/'


def slug(n):
    return re.sub(r'[^a-z0-9]+', '-', n.lower()).strip('-')


def baja(ruta, destino):
    if os.path.exists(destino) and os.path.getsize(destino) > 0:
        return True
    url = BASE + urllib.parse.quote(ruta)
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'herramientas-del-master-uso-personal'}), timeout=60) as r:
            datos = r.read()
    except Exception:
        return False
    with open(destino, 'wb') as f:
        f.write(datos)
    return True


def main():
    best = json.load(open(sys.argv[1], encoding='utf-8'))['monster']
    fluff = {x['name']: x for x in json.load(open(sys.argv[2], encoding='utf-8'))['monsterFluff']}
    out = sys.argv[3]
    os.makedirs(os.path.join(out, 'tok'), exist_ok=True)
    os.makedirs(os.path.join(out, 'img'), exist_ok=True)
    trabajos = []
    for m in best:
        s = slug(m['name'])
        trabajos.append((s, 'tok', f'bestiary/tokens/XMM/{m["name"]}.webp'))
        f = fluff.get(m['name'])
        for im in (f or {}).get('images', []) if f else []:
            p = (im.get('href') or {}).get('path')
            if p:
                trabajos.append((s, 'img', p)); break

    def hace(t):
        s, k, ruta = t
        return s, k, baja(ruta, os.path.join(out, k, s + '.webp'))
    idx = {}
    with ThreadPoolExecutor(8) as ex:
        for s, k, ok in ex.map(hace, trabajos):
            if ok:
                idx.setdefault(s, {})[k] = 1
    json.dump(idx, open(os.path.join(out, 'index.json'), 'w', encoding='utf-8'))
    print(f'{sum(1 for v in idx.values() if v.get("tok"))} tokens, {sum(1 for v in idx.values() if v.get("img"))} imágenes -> {out}')


if __name__ == '__main__':
    main()
