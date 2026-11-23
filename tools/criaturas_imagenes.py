"""Descarga los tokens e imágenes de ambientación de 5e.tools de las criaturas de otros libros (XPHB, TCE, XGE, XDMG…) para uso personal.
Uso: python -I tools/criaturas_imagenes.py <carpeta_5etools> <carpeta_salida> <FUENTE> [FUENTE ...]
Lee <carpeta_5etools>/bestiary-<fuente>.json (y fluff-bestiary-<fuente>.json si existe) y guarda
<salida>/<FUENTE>/tok/<slug>.webp, <salida>/<FUENTE>/img/<slug>.webp y <salida>/<FUENTE>/index.json.
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
    carp, out = sys.argv[1], sys.argv[2]
    for fuente in sys.argv[3:]:
        f = fuente.lower()
        best = json.load(open(os.path.join(carp, 'bestiary-%s.json' % f), encoding='utf-8')).get('monster', [])
        pf = os.path.join(carp, 'fluff-bestiary-%s.json' % f)
        fluff = {x['name']: x for x in json.load(open(pf, encoding='utf-8')).get('monsterFluff', [])} if os.path.exists(pf) else {}
        dest = os.path.join(out, fuente.upper())
        os.makedirs(os.path.join(dest, 'tok'), exist_ok=True)
        os.makedirs(os.path.join(dest, 'img'), exist_ok=True)
        trabajos = []
        for m in best:
            if m.get('source', '').upper() != fuente.upper():
                continue
            s = slug(m['name'])
            trabajos.append((s, 'tok', 'bestiary/tokens/%s/%s.webp' % (fuente.upper(), m['name'])))
            for im in (fluff.get(m['name']) or {}).get('images', []):
                p = (im.get('href') or {}).get('path')
                if p:
                    trabajos.append((s, 'img', p))
                    break

        def hace(t):
            s, k, ruta = t
            return s, k, baja(ruta, os.path.join(dest, k, s + '.webp'))
        idx, fallos = {}, []
        with ThreadPoolExecutor(8) as ex:
            for t, (s, k, ok) in zip(trabajos, ex.map(hace, trabajos)):
                if ok:
                    idx.setdefault(s, {})[k] = 1
                else:
                    fallos.append((s, k))
        json.dump(idx, open(os.path.join(dest, 'index.json'), 'w', encoding='utf-8'))
        print('%s: %d criaturas, %d tokens, %d imágenes -> %s; sin imagen: %s' % (fuente.upper(), len({t[0] for t in trabajos}), sum(1 for v in idx.values() if v.get('tok')), sum(1 for v in idx.values() if v.get('img')), dest, fallos))


if __name__ == '__main__':
    main()
