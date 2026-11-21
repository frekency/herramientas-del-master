// Permisos y cambios propuestos en la hoja de personaje, en el navegador: el jugador propone, el máster acepta y los bloqueos se respetan.
// Necesita Edge o Chrome (variable BROWSER para indicar otro); si no hay ninguno, el test se salta.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFileSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
import {execFile} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {ROOT,PAGE} from './lib.mjs';
import {testNav} from './lib.mjs';

const BROWSERS=[process.env.BROWSER,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome','/usr/bin/chromium','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const BROWSER=BROWSERS.find(b=>existsSync(b));

const STORE={'camp-notes-v1':{v:1,items:[{id:'s1',tipo:'sesion',nombre:'La cripta',texto:'Hablan con [[Ana la herrera]].',campos:{estado:'planeada',fecha:'2026-12-01',escenas:[{t:'Abrir la puerta',ok:false}],encuentros:['e1']}},{id:'n1',tipo:'npc',nombre:'Ana la herrera',texto:'Fuerte y callada.',campos:{rol:'Herrera'}}]},'combat-presets-v1':[{id:'e1',n:'Emboscada',items:[{name:'Goblin 1',tpl:'x'}]}],'camp-fichas-v1':[{v:1,id:'c1',nombre:'Lyra',origen:'campana',campana:'local',car:{fue:8,des:14,con:14,int:16,sab:10,car:10},niveles:[{c:'mago',hp:6},{c:'mago',hp:4},{c:'mago',hp:4},{c:'mago',hp:4},{c:'mago',hp:4}],habil:{arcanos:2}}]};
const head=`<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));addEventListener('unhandledrejection',e=>__err.push(String(e.reason)));
localStorage.clear();for(const[k,v]of Object.entries(${JSON.stringify(STORE)}))localStorage.setItem(k,JSON.stringify(v));</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  const body=()=>document.getElementById('pj-body'),F=()=>PJC.find(x=>x.id==='c1');
  const rol=async v=>{const s=document.getElementById('pj-rol');s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}));await wait(150);};
  const click=async sel=>{const b=document.querySelector(sel);if(!b)throw new Error('no hay '+sel);b.click();await wait(150);};
  const typeIn=async(sel,v)=>{const i=document.querySelector(sel);if(!i)throw new Error('no hay '+sel);i.value=v;i.dispatchEvent(new Event('change',{bubbles:true}));await wait(150);};
  try{
    await wait(1200);
    window.__sinImprimir=true;
    location.hash='#campana/sesion/s1';await wait(500);
    await click('[data-act="sesprint"]');
    const m=document.getElementById('prtprev');
    ok('la ventana de impresión ofrece los apartados con su número y una vista previa',!m.hidden&&!!m.querySelector('iframe')&&/class="prts"/.test(m.querySelector('iframe').srcdoc)&&!!m.querySelector('[data-prts="plan"]')&&m.textContent.includes('PNJ (1)'));
    ok('lo que la sesión no menciona queda desactivado',m.querySelector('[data-prts="tienda"]').disabled&&m.querySelector('[data-prts="lugar"]').disabled);
    await click('[data-act="sesprintgo"]');
    const d=document.getElementById('printdoc');
    ok('el cuaderno lleva el plan con casillas',!!d&&d.textContent.includes('La cripta')&&d.textContent.includes('☐ Abrir la puerta'));
    ok('lleva el encuentro con su tabla y el PNJ mencionado',d.textContent.includes('Emboscada')&&d.textContent.includes('Goblin 1')&&d.textContent.includes('Ana la herrera'));
    ok('cada apartado empieza en su página y la hoja en blanco va aparte (desactivada)',d.querySelectorAll('.prts').length>=4&&!d.querySelector('.hoja'));
    ok('el documento solo se muestra al imprimir',getComputedStyle(d).display==='none'&&document.documentElement.classList.contains('printing'));
    // hoja de personaje
    document.documentElement.classList.remove('printing');
    location.hash='#personajes/c1';await wait(500);
    await click('[data-act="pjprint"]');
    ok('la hoja se ve primero en la vista previa',!!document.querySelector('#prtprev iframe')&&/class="hoja|hs-pg|class="hs/.test(document.querySelector('#prtprev iframe').srcdoc));
    await click('[data-act="prtvgo"]');
    ok('la hoja de un personaje se imprime rellena',d.querySelector('.hoja')&&d.textContent.includes('Lyra')&&d.textContent.includes('Arcanos')&&d.textContent.includes('+6'));
    location.hash='#personajes';await wait(400);
    await click('[data-act="pjprintblank"]');
    ok('la hoja en blanco no lleva datos',d.querySelector('.hoja')&&!d.textContent.includes('Lyra')&&d.textContent.includes('Tirada de salvación'));
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+(e.stack||'').split('\\n')[1]);}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__imprimir.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('imprimir: cuaderno de la sesión y hojas de personaje',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-prt-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__imprimir.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=8,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
