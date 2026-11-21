// Escenas del plan de sesión y lo que ve el jugador (resumen y escenas marcadas como visibles).
// Necesita Edge o Chrome (variable BROWSER para indicar otro); si no hay ninguno, el test se salta.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFileSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
import {execFile} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {ROOT,PAGE} from './lib.mjs';

const BROWSERS=[process.env.BROWSER,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome','/usr/bin/chromium','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const BROWSER=BROWSERS.find(b=>existsSync(b));

const STORE={'camp-fichas-v1':[{v:1,id:'c1',nombre:'Lyra',origen:'campana',campana:'local',car:{fue:8,des:14,con:14,int:16,sab:10,car:10},niveles:[{c:'mago',hp:6}]}]};
const head=`<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));addEventListener('unhandledrejection',e=>__err.push(String(e.reason)));
localStorage.clear();for(const[k,v]of Object.entries(${JSON.stringify(STORE)}))localStorage.setItem(k,JSON.stringify(v));</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  const click=async sel=>{const b=document.querySelector(sel);if(!b)throw new Error('no hay '+sel);b.click();await wait(150);};
  const typeIn=async(sel,v)=>{const i=document.querySelector(sel);if(!i)throw new Error('no hay '+sel);i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}));await wait(100);};
  try{
    await wait(1200);
    const s=Notas.nuevo('sesion','La cripta');CP.push(s);cpDirty=true;cpFlush();
    location.hash=Notas.href(s);await wait(500);
    ok('no hay nada público mientras no se marque',scPub(cpGet(s.id))===null);
    await click('#cp-det [data-act="cpadd"][data-f="escenas"]');
    ok('la escena nueva se abre con sus campos',!!document.querySelector('#cp-det details.esc[open] textarea'));
    await typeIn('[data-cpesc="0:t"]','El puente roto');
    await typeIn('[data-cpesc="0:d"]','El jefe espera abajo. SECRETO: es el padre de Lyra.');
    await typeIn('[data-cpesc="0:lugar"]','Garganta Negra');
    const t=document.querySelector('[data-cpesc="0:tipo"]');t.value='combate';t.dispatchEvent(new Event('input',{bubbles:true}));
    ok('la escena guarda título, descripción, lugar y tipo',(r=>r.t==='El puente roto'&&r.lugar==='Garganta Negra'&&r.tipo==='combate'&&/SECRETO/.test(r.d))(cpGet(s.id).campos.escenas[0]));
    ok('sin marcar «mostrar», los jugadores no reciben nada',scPub(cpGet(s.id))===null);
    const p=document.querySelector('[data-cpesc="0:pub"]');p.checked=true;p.dispatchEvent(new Event('input',{bubbles:true}));
    const pb=scPub(cpGet(s.id));
    ok('al marcarla sale en lo público',pb&&pb.escenas.length===1&&pb.escenas[0].t==='El puente roto');
    cpGet(s.id).campos.escenas[0].d='x';
    ok('lo público lleva la descripción de la escena visible, no el texto del plan',!/padre/.test(JSON.stringify(scPub((()=>{const c=cpGet(s.id);c.texto='SECRETO del plan';return c;})()))));
    ok('un resumen solo también se publica',scPub({tipo:'sesion',visibilidad:'dm',nombre:'x',campos:{publico:'Llegáis al pueblo',escenas:[]}}).publico==='Llegáis al pueblo');
    ok('una sesión ya compartida no duplica',scPub({tipo:'sesion',visibilidad:'jugadores',nombre:'x',campos:{publico:'a',escenas:[]}})===null);
    const n=scPubNota('abc',{nombre:'La cripta',fecha:'2026-11-21',estado:'planeada',publico:'Resumen',escenas:[{t:'Uno',tipo:'social',d:'d',lugar:'l',ok:false}]});
    ok('el jugador recibe una copia de solo lectura con las escenas',n&&n.id==='pub_abc'&&n.campos.escenas.length===1&&n.visibilidad==='jugadores');
    CP.push(n);cpSel=n.id;cpRenderDet();
    ok('la vista del jugador no tiene campos editables',!document.querySelector('#cp-det input,#cp-det textarea')&&/Uno/.test(document.getElementById('cp-det').textContent));
    ok('la copia del jugador no se vuelve a subir como nota',!('nota:pub_abc' in scSnapshot()));
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+String(e.stack).slice(0,200));}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__escenas.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

test('escenas de sesión y lo que ven los jugadores',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-esc-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__escenas.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=10,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
