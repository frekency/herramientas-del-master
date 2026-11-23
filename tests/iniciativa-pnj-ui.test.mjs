// Tabla incrustada en un objeto (campo rel): filas con rangos, tirada que elige una fila y la ficha sigue abierta.
// Necesita Edge o Chrome (variable BROWSER para indicar otro); si no hay ninguno, el test se salta.
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

const head=`<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));addEventListener('unhandledrejection',e=>__err.push(String(e.reason)));localStorage.clear();</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  const go=async h=>{location.hash=h;await wait(500);};
  try{
    await wait(1500);
    const q=s=>document.querySelector(s),click=async s=>{q(s).click();await wait(250);};
    const pjF=state.factions.find(f=>f.pc),enF=state.factions.find(f=>!f.pc);
    const mk=(n,f,t)=>({id:uid(),name:n,factionId:f.id,init:null,initBonus:2,hp:10,maxHp:10,temp:0,ac:12,conds:[],notes:'',ds:0,df:0,tpl:t,used:{},uses:{},la:0,lr:0,ex:false});
    state.creatures=[mk('Goblin 1',enF,'srd:Goblin'),mk('Goblin 2',enF,'srd:Goblin'),mk('Jefe',pjF,'srd:Goblin Boss'),mk('Lyra',pjF,null)];
    const pcs=state.factions.filter(f=>!f.pc);
    sortInto(state);render();await wait(200);
    ok('hay criaturas',state.creatures.length===4);
    // una criatura puesta por error en la banda de los jugadores también cuenta como PNJ
    const gob=state.creatures[2];
    ok('la criatura en banda de jugadores es PNJ',esPNJ(gob));
    state.creatures.forEach(c=>c.init=null);
    const enem=enF;
    let orig=Math.random;
    q('[data-act="rollnpc"]').click();await wait(300);
    ok('pregunta quién lleva la sorpresa',!!q('dialog.ask [data-fid]')&&q('dialog.ask [data-nadie]').checked);
    q('dialog.ask [data-fid="'+enem.id+'"]').click();await wait(100);
    ok('marcar una banda desmarca «Nadie»',!q('dialog.ask [data-nadie]').checked);
    Math.random=()=>0.99;   // d20 = 20 para todos
    q('dialog.ask button[type=submit]').click();await wait(400);
    Math.random=orig;
    const sorp=state.creatures.filter(c=>c.factionId===enem.id&&esPNJ(c)),otros=state.creatures.filter(c=>c.factionId!==enem.id&&esPNJ(c));
    ok('todos los PNJ tienen iniciativa',state.creatures.filter(esPNJ).every(c=>c.init!=null));
    ok('la banda sorprendida tira con desventaja (20 y 20 → 20 +bono) y los demás normal',sorp.every(c=>c.init===20+(c.initBonus||0))&&otros.every(c=>c.init===20+(c.initBonus||0)));
    ok('queda ordenado automáticamente',state.order.map(id=>get(id).init??-99).every((v,i,a)=>!i||a[i-1]>=v));
    // desventaja real: forzamos 1.er dado alto y 2.º bajo → debe quedarse el bajo
    let n=0;Math.random=()=>(n++%2?0:0.99);
    state.creatures.filter(esPNJ).forEach(c=>c.init=null);
    q('[data-act="rollnpc"]').click();await wait(300);
    q('dialog.ask [data-fid="'+enem.id+'"]').click();q('dialog.ask button[type=submit]').click();await wait(400);Math.random=orig;
    ok('con desventaja se queda el dado más bajo',state.creatures.filter(c=>c.factionId===enem.id&&esPNJ(c)).every(c=>c.init===1+(c.initBonus||0)));
    q('[data-act="rollnpc"]').click();await wait(300);q('dialog.ask button.ghost').click();await wait(200);
    ok('cancelar no cambia nada',!q('dialog.ask'));
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+String(e.stack).slice(0,200));}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__iniciativa.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('iniciativa PNJ: sorpresa por bandas y orden automático',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-in-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__iniciativa.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=9,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
