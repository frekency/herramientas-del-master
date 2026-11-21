// Lanzar un encuentro al combate: pregunta qué jugadores entran y se pueden añadir más adelante; sin sesión activa se usa igual.
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

const PARTY=[{id:'p1',n:'Ana',hp:20,ac:15,in:2},{id:'p2',n:'Beto',hp:25,ac:16,in:0},{id:'p3',n:'Cleo',hp:18,ac:13,in:3}];
const head=`<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));addEventListener('unhandledrejection',e=>__err.push(String(e.reason)));
localStorage.clear();localStorage.setItem('combat-party-v1',${JSON.stringify(JSON.stringify(PARTY))});</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  const enCombate=()=>state.creatures.filter(c=>c.pcId).map(c=>c.pcId).sort().join(',');
  const click=async sel=>{const b=document.querySelector(sel);if(!b)throw new Error('no hay '+sel);b.click();await wait(200);};
  try{
    await wait(1200);
    // una sesión creada pero sin activar: el combate sigue siendo usable
    CP.push(Notas.nuevo('sesion','Primera'));cpDirty=true;cpFlush();await wait(200);
    const mon={id:'gob',n:'Goblin',hp:7,ac:15,in:2,cr:'1/4'};
    epDraft={id:null,n:'Emboscada',rows:[epRowFromMon(mon,2)],eventos:[]};epSel=null;
    ok('hay una criatura con la que montar el encuentro',!!epDraft.rows[0]);
    epLanzar(false);await wait(200);
    ok('al lanzar pregunta quién entra',!document.getElementById('lanzmodal').hidden&&document.querySelectorAll('#lanz-list input').length===3);
    // Ana y Cleo van; Beto no
    document.querySelector('#lanz-list input[data-pid="p2"]').checked=false;
    await click('[data-act="lanzgo"]');
    ok('la ventana se cierra y se pasa al combate',document.getElementById('lanzmodal').hidden&&location.hash==='#combate');
    ok('entran solo los marcados',enCombate()==='p1,p3');
    ok('las criaturas del encuentro están',state.creatures.filter(c=>!c.pcId).length===2);
    ok('el combate no está bloqueado por no haber sesión activa',!document.querySelector('main.wrap').inert);
    // más adelante se puede incorporar al resto
    commit(()=>addPC(PARTY[1]));
    ok('Beto se incorpora después',enCombate()==='p1,p2,p3');
    // si todos los jugadores ya están, no se pregunta
    epDraft={id:null,n:'Otro',rows:[epRowFromMon(mon,1)],eventos:[]};
    epLanzar(false);await wait(200);
    ok('con todos dentro no pregunta',document.getElementById('lanzmodal').hidden);
    // cancelar no lanza nada
    state.creatures=state.creatures.filter(c=>!c.pcId);
    const antes=state.creatures.length;epLanzar(false);await wait(200);
    await click('[data-act="lanzclose"]');
    ok('cancelar no lanza el encuentro',document.getElementById('lanzmodal').hidden&&state.creatures.length===antes);
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+(e.stack||'').split('\\n')[1]);}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__lanzar.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('lanzar un encuentro pregunta qué jugadores entran',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-lanz-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__lanzar.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=9,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
