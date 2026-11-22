// Genera referencias.html: la referencia rápida del SRD 5.2.1 con el mismo aspecto que la de la web (secciones, tarjetas en columnas e iconos),
// en un solo archivo sin relación con la app (ni cuenta, ni datos propios, ni scripts externos).
// Es algo temporal para compartir: para quitarlo basta borrar este script y referencias.html.
// Uso: node tools/build_referencias.mjs
import {readFileSync,writeFileSync} from 'node:fs';

const ROOT=new URL('../',import.meta.url);
const APP=readFileSync(new URL('index.html',ROOT),'utf8');
const reglas=JSON.parse(readFileSync(new URL('datos/es/compendio.json',ROOT),'utf8')).reglas;

// secciones e iconos: se leen de la propia app para que no se desajusten
const lit=(nombre)=>{const m=APP.match(new RegExp('const '+nombre+'=(\\[\\[[\\s\\S]*?\\]\\]|\\{[\\s\\S]*?\\});\\n'));if(!m)throw new Error('no encuentro '+nombre);return new Function('return '+m[1])();};
const QR_SECS=lit('QR_SECS').filter(([c])=>c!=='Homebrew');
const QR_ICON=lit('QR_ICON');
const sprite=APP.match(/<svg width="0" height="0"[^>]*><defs>([\s\S]*?)<\/defs><\/svg>/)[1];
const simbolo=id=>{const m=sprite.match(new RegExp('<symbol id="i-'+id+'"[\\s\\S]*?</symbol>'));return m?m[0]:'';};

const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fold=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const slug=s=>fold(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const plano=h=>String(h).replace(/<table[\s\S]*?<\/table>/g,'').replace(/<\/p>/g,' ').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#x27;|&#39;/g,"'").replace(/\s+/g,' ').trim();
// mismo resumen que la app: la primera frase; si acaba en «:», la lista de efectos en cursiva
function resumen(d){
  const p=plano(d);let s=(p.match(/^.*?[.:](?=\s|$)/)||[p])[0];
  if(s.endsWith(':')){const labs=[...String(d).matchAll(/<b><i>([\s\S]*?)<\/i>\.?<\/b>/g)].map(m=>m[1].replace(/<[^>]+>/g,'').replace(/\.\s*$/,'').trim()).filter(Boolean);if(labs.length)s=labs.join(' · ');else s=(p.match(/^.*?:\s*(.*?\.)(?=\s|$)/)||[0,s])[1];}
  return s.length>180?s.slice(0,177).replace(/\s\S*$/,'')+'…':s;
}

const porNombre=new Map(reglas.map(r=>[fold(r.n),r]));
const idDe=r=>'r-'+slug(r.n);
const enlazar=h=>h.includes('“')?h.replace(/“([^”<]{2,60})”/g,(m,n)=>{const r=porNombre.get(fold(n));return r?`“<a href="#${idDe(r)}" data-r="${idDe(r)}">${n}</a>”`:m;}):h;

const secciones=QR_SECS.map(([c,si,col])=>({c,si,col,L:reglas.filter(r=>r.cat===c).sort((a,b)=>a.n.localeCompare(b.n,'es'))})).filter(s=>s.L.length);
const sobran=reglas.filter(r=>!QR_SECS.some(([c])=>c===r.cat));
if(sobran.length)console.log('Sin sección en la referencia (como en la app):',sobran.map(r=>r.n+' ['+r.cat+']').join(', '));
const enSecciones=secciones.flatMap(s=>s.L);

const iconos=new Set(['x']);for(const s of secciones){iconos.add(s.si);for(const r of s.L)iconos.add(QR_ICON[r.n]||s.si);}
const defs=[...iconos].map(simbolo).filter(Boolean).join('');
const ic=id=>`<svg class="ic" aria-hidden="true"><use href="#i-${id}"/></svg>`;

const cuerpo=secciones.map(s=>`<section class="qrsec" data-cat="${esc(s.c)}" style="--qc:${s.col}">
<h3>${ic(s.si)} ${esc(s.c)} <span class="pcsub">${s.L.length}</span></h3>
<div class="qrgrid">
${s.L.map(r=>`<button type="button" class="qrcard" id="${idDe(r)}" data-q="${esc(fold(r.n+' '+plano(r.d)))}"><span class="qi">${ic(QR_ICON[r.n]||s.si)}</span><span class="qt">${esc(r.n)}</span><span class="qs">${esc(resumen(r.d))}</span><template>${enlazar(r.d)}</template></button>`).join('\n')}
</div>
</section>`).join('\n');

const html=`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="color-scheme" content="light dark">
<title>Referencia rápida · D&amp;D 2024</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya+SC:wght@500;700;800&family=Alegreya+Sans:wght@400;500;700&family=Alegreya:ital,wght@0,400;0,700;1,400&display=swap">
<style>
:root{--bg:#efe7d8;--surface:#faf5ec;--surface-2:#ebe1cf;--line:#d3c4ab;--fg:#2a2118;--muted:#6a5a46;--accent:#8a5a12;--accent-fg:#fff8ea;--sb:#f6efe1;--sb-rule:#8f2f22;
  --shadow:0 1px 2px rgb(48 32 14/.08),0 6px 18px rgb(48 32 14/.07);
  --f-display:"Alegreya SC",Georgia,"Times New Roman",serif;--f-body:"Alegreya Sans",system-ui,-apple-system,"Segoe UI",sans-serif;--f-sb:"Alegreya",Georgia,serif}
@media (prefers-color-scheme:dark){:root{--bg:#14110e;--surface:#1d1915;--surface-2:#29231d;--line:#3b3229;--fg:#ece3d2;--muted:#ab9d88;--accent:#d9a441;--accent-fg:#1a1306;--sb:#211b15;--sb-rule:#cf6b53;
  --shadow:0 1px 2px rgb(0 0 0/.4),0 8px 24px rgb(0 0 0/.3)}}
*{box-sizing:border-box}
[hidden]{display:none!important}
body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--f-body);font-size:15px;line-height:1.4}
body.abierto{overflow:hidden}
button,input,select{font:inherit;color:inherit}
button{cursor:pointer}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.ic{width:1.15em;height:1.15em;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;vertical-align:-.2em;flex:none;overflow:visible}
.wrap{max-width:1320px;margin:0 auto;padding:0 max(16px,env(safe-area-inset-right)) 40px max(16px,env(safe-area-inset-left))}
header{padding-top:22px}
h1{font-family:var(--f-display);font-weight:800;font-size:28px;letter-spacing:.02em;margin:0}
.pcsub{color:var(--muted);font-weight:400;font-size:.85em}
.modline{color:var(--muted);margin:6px 0 12px}
.barra{position:sticky;top:0;z-index:5;background:var(--bg);padding:10px 0;display:flex;gap:8px;flex-wrap:wrap}
.barra input,.barra select{padding:9px 11px;border:1px solid var(--line);border-radius:8px;background:var(--surface)}
.barra input{flex:1 1 240px;min-width:0}
.qrsec{margin:18px 0 6px}
.qrsec h3{display:flex;align-items:center;gap:8px;margin:0 0 10px;font-size:18px}
.qrsec h3 .ic{color:var(--sb-rule)}
.qrgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px}
.qrcard{display:grid;grid-template-columns:40px minmax(0,1fr);grid-template-rows:auto auto;gap:2px 10px;align-items:start;text-align:left;color:var(--fg);background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:9px 11px;min-width:0}
.qrcard:hover{background:color-mix(in srgb,var(--qc) 10%,var(--surface))}
.qrcard .qi{grid-row:1/3;width:40px;height:40px;border-radius:9px;display:grid;place-items:center;font-size:22px;color:color-mix(in srgb,var(--qc) 65%,var(--fg));background:color-mix(in srgb,var(--qc) 20%,var(--surface))}
.qrcard .qt{font-weight:700;line-height:1.25}
.qrcard .qs{font-size:13px;color:var(--muted);line-height:1.35;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.vacio{padding:24px 0;color:var(--muted)}
dialog{border:0;padding:0;background:transparent;color:var(--fg);max-width:100%;max-height:100%;width:min(720px,100%)}
dialog::backdrop{background:rgb(10 12 16/.55)}
.mbox{background:var(--surface);border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow);max-height:calc(100vh - 32px);display:flex;flex-direction:column;margin:16px auto}
.mhead{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--line)}
.mhead h2{margin:0;font-family:var(--f-display);font-size:22px;flex:1}
.mhead .pcsub{margin-left:8px}
.mhead button{background:none;border:1px solid var(--line);border-radius:8px;padding:5px 10px}
.mbody{padding:14px 16px;overflow:auto}
.sb{background:var(--sb);border-top:3px solid var(--sb-rule);border-bottom:3px solid var(--sb-rule);border-radius:4px;padding:12px 14px;font-family:var(--f-sb);font-size:16px;line-height:1.5}
.sb p{margin:.55em 0}.sb ul{padding-left:1.3em}.sb a{color:var(--sb-rule)}
.sb table{border-collapse:collapse;width:100%;font-size:14.5px;margin:.6em 0;display:block;overflow-x:auto}
.sb th,.sb td{border:1px solid var(--line);padding:4px 8px;text-align:left}.sb th{background:var(--surface-2)}
.pie{color:var(--muted);font-size:13px;padding-top:28px}
.pie a{color:var(--accent)}
@media print{.barra{display:none}.qrcard{break-inside:avoid}}
</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${defs}</defs></svg>
<div class="wrap">
<header>
<h1>Referencia rápida</h1>
<p class="modline">Reglas de 2024 (SRD 5.2.1) en español: ${enSecciones.length} reglas. Pulsa una tarjeta para ver la regla completa.</p>
</header>
<div class="barra">
<input id="q" type="search" placeholder="Filtrar por nombre o texto" aria-label="Filtrar reglas" autocomplete="off">
<select id="cat" aria-label="Categoría"><option value="">Todas las categorías</option>${secciones.map(s=>`<option>${esc(s.c)}</option>`).join('')}</select>
</div>
<main id="lista">
${cuerpo}
</main>
<p class="vacio" id="vacio" hidden>Nada coincide.</p>
<p class="pie">Contenido del Documento de Referencia del Sistema 5.2.1 (SRD 5.2.1) © Wizards of the Coast LLC, bajo licencia
<a href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Atribución 4.0 (CC-BY-4.0)</a>. Traducción al español del SRD. Página no oficial, sin relación con Wizards of the Coast.</p>
</div>
<dialog id="reg" aria-labelledby="reg-h"><div class="mbox"><div class="mhead"><h2 id="reg-h"></h2><button type="button" id="reg-x" aria-label="Cerrar">✕</button></div><div class="mbody"><div class="sb" id="reg-b"></div></div></div></dialog>
<script>
(function(){
var q=document.getElementById('q'),cat=document.getElementById('cat'),vacio=document.getElementById('vacio'),dlg=document.getElementById('reg');
var cards=[].slice.call(document.querySelectorAll('.qrcard')),secs=[].slice.call(document.querySelectorAll('.qrsec'));
function f(s){return s.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');}
function filtrar(){
  var t=f(q.value.trim()),c=cat.value,n=0;
  cards.forEach(function(k){var ok=(!t||k.getAttribute('data-q').indexOf(t)>-1)&&(!c||k.closest('.qrsec').getAttribute('data-cat')===c);k.hidden=!ok;if(ok)n++;});
  secs.forEach(function(s){s.hidden=!s.querySelector('.qrcard:not([hidden])');});
  vacio.hidden=n>0;
}
function abrir(id,hist){
  var k=document.getElementById(id);if(!k||!k.classList.contains('qrcard'))return;
  document.getElementById('reg-h').innerHTML=k.querySelector('.qt').innerHTML+'<span class="pcsub">'+k.closest('.qrsec').getAttribute('data-cat')+'</span>';
  document.getElementById('reg-b').innerHTML=k.querySelector('template').innerHTML;
  document.querySelector('#reg .mbody').scrollTop=0;
  if(!dlg.open)dlg.showModal();
  document.body.classList.add('abierto');
  if(hist!==false)history.replaceState(null,'','#'+id);
}
function cerrar(){if(dlg.open)dlg.close();}
dlg.addEventListener('close',function(){document.body.classList.remove('abierto');history.replaceState(null,'',location.pathname+location.search);});
dlg.addEventListener('click',function(e){if(e.target===dlg)cerrar();var a=e.target.closest&&e.target.closest('a[data-r]');if(a){e.preventDefault();abrir(a.getAttribute('data-r'));}});
document.getElementById('reg-x').addEventListener('click',cerrar);
document.getElementById('lista').addEventListener('click',function(e){var k=e.target.closest('.qrcard');if(k)abrir(k.id);});
q.addEventListener('input',filtrar);cat.addEventListener('change',filtrar);
if(location.hash)abrir(location.hash.slice(1),false);
})();
</script>
</body>
</html>
`;
writeFileSync(new URL('referencias.html',ROOT),html);
console.log('referencias.html',Math.round(html.length/1024)+' KB,',enSecciones.length,'reglas en',secciones.length,'secciones');
