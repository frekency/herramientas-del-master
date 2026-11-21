// Bloqueo de pantalla con PIN en la app de escritorio (se simula el puente de Electron).
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
window.__AppShell={platform:'win32',titlebar(){},mesa:{abrir(){},cerrar(){},enviar(){},onEstado(){}}};localStorage.clear();for(const[k,v]of Object.entries(${JSON.stringify(STORE)}))localStorage.setItem(k,JSON.stringify(v));</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  const body=()=>document.getElementById('pj-body'),F=()=>PJC.find(x=>x.id==='c1');
  const rol=async v=>{const s=document.getElementById('pj-rol');s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}));await wait(150);};
  const click=async sel=>{const b=document.querySelector(sel);if(!b)throw new Error('no hay '+sel);b.click();await wait(150);};
  const typeIn=async(sel,v)=>{const i=document.querySelector(sel);if(!i)throw new Error('no hay '+sel);i.value=v;i.dispatchEvent(new Event('change',{bubbles:true}));await wait(150);};
  try{
    await wait(1200);
    Bloqueo.aj.iteraciones=2000;
    const until=async f=>{for(let i=0;i<1000&&!f();i++){await Bloqueo.crear('0000');await wait(10);}};   // el cálculo del PIN es real y el tiempo virtual no lo espera: se gasta tiempo real calculando
    const set=(s,v)=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));};
    ok('el botón del candado aparece en la app de escritorio',!document.getElementById('lock-btn').hidden);
    // sin PIN no bloquea: lleva a preferencias
    await click('#lock-btn');
    ok('sin PIN no se bloquea y abre las preferencias',document.getElementById('lockscr').hidden&&!document.getElementById('prefmodal').hidden&&!document.getElementById('pf-lock').hidden);
    // poner el PIN
    set('#lk-new','1234');set('#lk-new2','9999');await click('[data-act="lkset"]');
    ok('PIN distinto en la repetición: no se guarda',!JSON.parse(Store.root.get('bloqueo-v1')||'{}').pin);
    set('#lk-new2','1234');document.getElementById('lk-new').value='1234';await click('[data-act="lkset"]');await until(()=>JSON.parse(Store.root.get('bloqueo-v1')||'{}').pin);
    const cfg=JSON.parse(Store.root.get('bloqueo-v1')||'{}');
    ok('PIN guardado como huella con sal, nunca en claro',!!cfg.pin&&!!cfg.pin.hash&&!JSON.stringify(cfg).includes('1234'));
    set('#lk-mm','Vuelvo en cinco minutos');
    document.getElementById('prefmodal').hidden=true;
    // bloquear con el atajo
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'L',ctrlKey:true,shiftKey:true,bubbles:true}));await wait(150);
    const o=document.getElementById('lockscr');
    ok('el atajo bloquea y tapa la app entera',!o.hidden&&getComputedStyle(o).position==='fixed'&&document.getElementById('view-personajes').closest('[inert]')!==null);
    ok('muestra el mensaje',document.getElementById('lk-msg').textContent==='Vuelvo en cinco minutos');
    ok('queda bloqueada aunque se cierre la app',JSON.parse(Store.root.get('bloqueo-v1')).on===true);
    // PIN erróneo y correcto
    const intenta=async v=>{document.getElementById('lk-err').textContent='';document.getElementById('lk-pin').value=v;document.getElementById('lk-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));await wait(100);await until(()=>document.getElementById('lk-err').textContent||document.getElementById('lockscr').hidden);};
    await intenta('0000');
    ok('PIN erróneo: sigue bloqueada y avisa',!o.hidden&&document.getElementById('lk-err').textContent.length>0);
    await intenta('1234');
    ok('PIN correcto: desbloquea y devuelve la app',o.hidden&&!document.querySelector('[inert]')&&JSON.parse(Store.root.get('bloqueo-v1')).on===false);
    // autobloqueo
    set('#lk-auto','1');lkUlt=Date.now()-61000;await wait(6000);
    ok('autobloqueo tras un minuto sin usarla',!o.hidden);
    await intenta('1234');
    // quitar el PIN
    document.getElementById('prefmodal').hidden=false;lkPrefs();await click('[data-act="lkclear"]');
    ok('quitar el PIN',!JSON.parse(Store.root.get('bloqueo-v1')).pin);
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+(e.stack||'').split('\\n')[1]);}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__bloqueo.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

test('el bloqueo de pantalla pide PIN, recuerda el estado y se bloquea solo',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-lock-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=900000','--dump-dom',`http://127.0.0.1:${port}/__bloqueo.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=11,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
