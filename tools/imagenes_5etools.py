"""Descarga de 5e.tools (repositorio de imágenes) las ilustraciones de objetos, conjuros, clases, especies, trasfondos, dotes… de los libros
que usa la herramienta, para uso personal.
Uso: python -I tools/imagenes_5etools.py <carpeta_salida> <FUENTE,FUENTE…> <categoria> [categoria …]
Ejemplo: python -I tools/imagenes_5etools.py datos/privado/imagenes XPHB,XDMG,XGE,TCE items spells classes races backgrounds feats
Guarda <salida>/<categoria>/<FUENTE>/<archivo> con la misma ruta que en 5etools y escribe <salida>/<categoria>/index.json (lista de rutas).
La carpeta va en datos/privado/ (fuera del repositorio)."""
import sys, os, json, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor

REPO = '5etools-mirror-3/5etools-img'
UA = {'User-Agent': 'herramientas-del-master-uso-personal'}


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90) as r:
        return r.read()


def main():
    out = sys.argv[1]
    fuentes = {f.strip().upper() for f in sys.argv[2].split(',')}
    for cat in sys.argv[3:]:
        arbol = json.loads(get('https://api.github.com/repos/%s/git/trees/main:%s?recursive=1' % (REPO, cat)))
        if arbol.get('truncated'):
            print('AVISO: el listado de %s está truncado' % cat)
        lista = [t['path'] for t in arbol['tree'] if t['type'] == 'blob' and t['path'].split('/')[0].upper() in fuentes]

        def baja(p):
            dest = os.path.join(out, cat, *p.split('/'))
            if os.path.exists(dest) and os.path.getsize(dest) > 0:
                return p, True
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            try:
                datos = get('https://raw.githubusercontent.com/%s/main/%s/%s' % (REPO, cat, urllib.parse.quote(p)))
            except Exception:
                return p, False
            with open(dest, 'wb') as f:
                f.write(datos)
            return p, True
        with ThreadPoolExecutor(8) as ex:
            res = list(ex.map(baja, lista))
        bien = [p for p, ok in res if ok]
        json.dump(sorted(bien), open(os.path.join(out, cat, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False)
        print('%s: %d de %d imágenes; fallos: %s' % (cat, len(bien), len(lista), [p for p, ok in res if not ok][:10]))


if __name__ == '__main__':
    main()
