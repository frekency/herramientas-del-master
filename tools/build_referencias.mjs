// Genera referencias.html: la referencia rápida del SRD 5.2.1 en un solo archivo, sin relación con la app (ni cuenta, ni scripts externos, ni datos propios).
// Es algo temporal para compartir: para quitarlo basta borrar este script y referencias.html.
// Uso: node tools/build_referencias.mjs
import {readFileSync,writeFileSync} from 'node:fs';

const ROOT=new URL('../',import.meta.url);
const reglas=JSON.parse(readFileSync(new URL('datos/es/compendio.json',ROOT),'utf8')).reglas;
const ORDEN=['Acciones','Turno y reacciones','Estados','Combate','Daño y curación','Movimiento','Visión y luz','Áreas de efecto','Exploración','Peligros','Pruebas y tiradas','Magia','Interacción social','General'];
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const plano=h=>String(h).replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const resumen=h=>{const p=plano(h);let s=(p.match(/^.*?[.:](?=\s|$)/)||[p])[0];return s.length>170?s.slice(0,167).replace(/\s\S*$/,'')+'…':s;};
const slug=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

const cats=[...new Set([...ORDEN,...reglas.map(r=>r.cat||'General')])].filter(c=>reglas.some(r=>(r.cat||'General')===c));
const sec=cats.map(c=>{
  const L=reglas.filter(r=>(r.cat||'General')===c).sort((a,b)=>a.n.localeCompare(b.n,'es'));
  return `<section class="cat" id="${slug(c)}" data-cat="${esc(c)}"><h2>${esc(c)} <span class="n">${L.length}</span></h2>
${L.map(r=>`<details class="regla" id="r-${slug(c+'-'+r.n)}" data-q="${esc((r.n+' '+plano(r.d)).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''))}"><summary><b>${esc(r.n)}</b><span class="res">${esc(resumen(r.d))}</span></summary><div class="cuerpo">${r.d}</div></details>`).join('\n')}
</section>`;}).join('\n');

const html=`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Referencia rápida de D&amp;D 2024</title>
<style>
:root{--bg:#faf7f0;--fg:#231f1a;--mut:#6b6358;--line:#ddd4c3;--card:#fffdf8;--acc:#8a2b1f;--sel:#f1e6d0}
@media (prefers-color-scheme:dark){:root{--bg:#171513;--fg:#ece5d8;--mut:#a39a8a;--line:#3a352d;--card:#1f1c18;--acc:#e08a6e;--sel:#2c2620}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 Georgia,"Times New Roman",serif}
header,main,footer{max-width:860px;margin:0 auto;padding:0 16px}
header{padding-top:28px}
h1{font-size:1.7rem;margin:0 0 4px;color:var(--acc)}
.sub{color:var(--mut);margin:0 0 16px;font-size:.95rem}
.barra{position:sticky;top:0;z-index:5;background:var(--bg);padding:10px 0;border-bottom:1px solid var(--line);display:flex;gap:8px;flex-wrap:wrap}
.barra input,.barra select{font:inherit;padding:9px 11px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--fg)}
.barra input{flex:1 1 220px;min-width:0}
.barra button{font:inherit;padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--fg);cursor:pointer}
.cat h2{font-size:1.2rem;margin:26px 0 8px;color:var(--acc);border-bottom:2px solid var(--line);padding-bottom:4px}
.cat h2 .n{font-size:.8rem;color:var(--mut);font-weight:400}
details.regla{border:1px solid var(--line);border-radius:8px;background:var(--card);margin:0 0 6px}
details.regla summary{cursor:pointer;padding:9px 12px;list-style:none;display:flex;flex-direction:column;gap:1px}
details.regla summary::-webkit-details-marker{display:none}
details.regla[open] summary{background:var(--sel);border-radius:8px 8px 0 0}
.res{color:var(--mut);font-size:.88rem}
.cuerpo{padding:4px 14px 12px}
.cuerpo p{margin:.6em 0}.cuerpo ul{padding-left:1.3em}
.cuerpo table{border-collapse:collapse;width:100%;font-size:.92rem;margin:.6em 0;display:block;overflow-x:auto}
.cuerpo th,.cuerpo td{border:1px solid var(--line);padding:4px 8px;text-align:left}
.cuerpo th{background:var(--sel)}
.vacio{padding:24px 0;color:var(--mut)}
footer{padding:28px 16px 40px;color:var(--mut);font-size:.85rem}
footer a{color:var(--acc)}
@media print{.barra{display:none}details.regla{break-inside:avoid}}
</style>
</head>
<body>
<header>
<h1>Referencia rápida de D&amp;D 2024</h1>
<p class="sub">${reglas.length} reglas del SRD 5.2.1 en español. Toca una para abrirla.</p>
</header>
<main>
<div class="barra">
<input id="q" type="search" placeholder="Buscar una regla o una palabra…" aria-label="Buscar" autocomplete="off">
<select id="cat" aria-label="Categoría"><option value="">Todas las categorías</option>${cats.map(c=>`<option>${esc(c)}</option>`).join('')}</select>
<button id="todo" type="button">Abrir todo</button>
</div>
<div id="lista">
${sec}
</div>
<p class="vacio" id="vacio" hidden>Nada coincide.</p>
</main>
<footer>
Contenido del Documento de Referencia del Sistema 5.2.1 (SRD 5.2.1) © Wizards of the Coast LLC, bajo licencia
<a href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Atribución 4.0 (CC-BY-4.0)</a>. Traducción al español del SRD. Página no oficial, sin relación con Wizards of the Coast.
</footer>
<script>
(function(){
var q=document.getElementById('q'),cat=document.getElementById('cat'),todo=document.getElementById('todo'),vacio=document.getElementById('vacio');
var reglas=[].slice.call(document.querySelectorAll('details.regla')),secs=[].slice.call(document.querySelectorAll('section.cat'));
function f(s){return s.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');}
function filtrar(){
  var t=f(q.value.trim()),c=cat.value,n=0;
  reglas.forEach(function(r){var ok=(!t||r.getAttribute('data-q').indexOf(t)>-1)&&(!c||r.parentNode.getAttribute('data-cat')===c);r.hidden=!ok;if(ok)n++;});
  secs.forEach(function(s){s.hidden=!s.querySelector('details.regla:not([hidden])');});
  vacio.hidden=n>0;
}
q.addEventListener('input',filtrar);cat.addEventListener('change',filtrar);
todo.addEventListener('click',function(){var abrir=todo.textContent==='Abrir todo';reglas.forEach(function(r){if(!r.hidden)r.open=abrir;});todo.textContent=abrir?'Cerrar todo':'Abrir todo';});
if(location.hash){var e=document.getElementById(location.hash.slice(1));if(e&&e.tagName==='DETAILS'){e.open=true;e.scrollIntoView();}}
})();
</script>
</body>
</html>
`;
writeFileSync(new URL('referencias.html',ROOT),html);
console.log('referencias.html',Math.round(html.length/1024)+' KB,',reglas.length,'reglas');
