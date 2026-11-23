#!/usr/bin/env python
"""Prepara una página local para emparejar las ilustraciones de objetos de 5e.tools con los objetos de un módulo (Guía del Máster 2024).

Solo uso personal: todo va en datos/privado/ (no se publica).
Uso: python tools/objetos_revision.py <modulo.json> <items.json> <FUENTE> <carpeta_imagenes> <salida.html>
Cada imagen sale con su nombre inglés, página y rareza, y un desplegable con los objetos del módulo de esa página (±1).
Se preselecciona por página + rareza (y parecido de nombre); lo dudoso se marca. El botón «Descargar elecciones» guarda un JSON
{nombre_en_inglés: nombre_del_módulo | null} que aplica tools/objetos_aplicar.py.
Necesita Pillow (pip install --target <dir> pillow y PYTHONPATH).
"""
import sys, os, json, io, base64, unicodedata, difflib, html
from PIL import Image


def fold(s):
    return ''.join(c for c in unicodedata.normalize('NFD', str(s)) if unicodedata.category(c) != 'Mn').lower().strip()


R = {'comun': 'common', 'infrecuente': 'uncommon', 'raro': 'rare', 'rara': 'rare', 'muy raro': 'very rare', 'muy rara': 'very rare',
     'legendario': 'legendary', 'legendaria': 'legendary', 'artefacto': 'artifact'}


def rar(s):
    f = fold(s)
    for k in sorted(R, key=len, reverse=True):
        if f.startswith(k):
            return R[k]
    return '?'


def mini(path, lado=96):
    im = Image.open(path).convert('RGBA')
    im.thumbnail((lado, lado), Image.LANCZOS)
    b = io.BytesIO()
    im.save(b, 'WEBP', quality=55, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()


def main():
    modulo, items_f, fuente, carp, salida = sys.argv[1:6]
    mod = json.load(open(modulo, encoding='utf-8'))['objetos']
    items = {i['name']: i for i in json.load(open(items_f, encoding='utf-8'))['item'] if i['source'] == fuente}
    dirimg = os.path.join(carp, 'items', fuente)
    imgs = sorted(f[:-5] for f in os.listdir(dirimg) if f.endswith('.webp'))
    # grupos por página y rareza para preseleccionar
    por_pag = {}
    for o in mod:
        por_pag.setdefault(int(o['pg']), []).append(o)
    filas = []
    for en in imgs:
        it = items.get(en, {})
        pg, ra = it.get('page'), it.get('rarity', '?')
        cand = [o for p in (pg, (pg or 0) - 1, (pg or 0) + 1) if p for o in por_pag.get(p, [])]
        if not pg:
            cand = list(mod)   # sin página en 5e.tools: se puede elegir entre todos los objetos
        mismos = [o for o in por_pag.get(pg, []) if rar(o.get('r', '')) == ra]
        n5 = [x for x in items.values() if x.get('page') == pg and x.get('rarity') == ra and x['name'] in imgs]
        sel, estado = None, 'sin'
        if len(mismos) == 1 and len(n5) == 1:
            sel, estado = mismos[0]['n'], 'seguro'
        elif mismos:
            sel = max(mismos, key=lambda o: difflib.SequenceMatcher(None, fold(en), fold(o['n'])).ratio())['n']
            estado = 'dudoso'
        elif cand:
            b = max(cand, key=lambda o: difflib.SequenceMatcher(None, fold(en), fold(o['n'])).ratio())
            if difflib.SequenceMatcher(None, fold(en), fold(b['n'])).ratio() > 0.55:
                sel, estado = b['n'], 'dudoso'
        filas.append({'en': en, 'pg': pg, 'ra': ra, 'img': mini(os.path.join(dirimg, en + '.webp')), 'sel': sel, 'estado': estado,
                      'cand': sorted({o['n'] for o in cand})})
    filas.sort(key=lambda f: ({'dudoso': 0, 'sin': 1, 'seguro': 2}[f['estado']], f['pg'] or 0, f['en']))
    datos = json.dumps(filas, ensure_ascii=False)
    pagina = """<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Emparejar ilustraciones de objetos</title>
<style>:root{color-scheme:light dark}body{font:15px system-ui;margin:0;padding:16px;max-width:980px;margin-inline:auto}
header{position:sticky;top:0;background:Canvas;padding:8px 0;border-bottom:1px solid #8884;display:flex;gap:12px;flex-wrap:wrap;align-items:center;z-index:2}
.f{display:grid;grid-template-columns:96px 1fr;gap:12px;padding:10px 0;border-bottom:1px solid #8883;align-items:center}
.f img{width:96px;height:96px;object-fit:contain;background:#8882;border-radius:8px}.m{font-size:13px;opacity:.75}
select{width:100%;max-width:520px;padding:6px;font:inherit}.d{background:#fc03}.n{background:#8881}.ok{background:#0a03}
button{padding:8px 14px;font:inherit;cursor:pointer}</style>
<header><b id=c></b><label><input type=checkbox id=solo> Solo dudosos y sin pareja</label><button id=dl>Descargar elecciones</button></header><main id=m></main>
<script>
const F=__DATOS__;const m=document.getElementById('m');
function pinta(){m.innerHTML='';F.forEach((f,i)=>{const d=document.createElement('div');d.className='f '+(f.estado=='seguro'?'ok':f.estado=='dudoso'?'d':'n');d.dataset.e=f.estado;
d.innerHTML='<img src="'+f.img+'" alt=""><div><b>'+f.en.replace(/</g,'&lt;')+'</b><div class=m>p. '+f.pg+' · '+f.ra+' · '+f.estado+'</div></div>';
const s=document.createElement('select');s.innerHTML='<option value="">— ninguno —</option>'+f.cand.map(n=>'<option'+(n===f.sel?' selected':'')+'>'+n.replace(/</g,'&lt;')+'</option>').join('');
s.onchange=()=>{f.sel=s.value||null;cuenta()};d.lastChild.appendChild(s);m.appendChild(d)});cuenta()}
function cuenta(){document.getElementById('c').textContent=F.filter(f=>f.sel).length+' de '+F.length+' emparejadas'}
document.getElementById('solo').onchange=e=>m.querySelectorAll('.f').forEach(d=>d.hidden=e.target.checked&&d.dataset.e=='seguro');
document.getElementById('dl').onclick=()=>{const o={};F.forEach(f=>o[f.en]=f.sel||null);const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(o,null,1)],{type:'application/json'}));a.download='objetos-elegidos.json';a.click()};
pinta();
</script>""".replace('__DATOS__', datos)
    open(salida, 'w', encoding='utf-8').write(pagina)
    c = {e: sum(1 for f in filas if f['estado'] == e) for e in ('seguro', 'dudoso', 'sin')}
    print(len(filas), 'imágenes ->', salida, c)


if __name__ == '__main__':
    main()
