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

const STORE={'camp-config-v1':{permisos:{pg:'libre'}},'camp-grupos-v1':[{id:'ga1',n:'Jugadores',tipo:'jugadores',miembros:[]}],'camp-notes-v1':{v:1,items:[{id:'s1',tipo:'sesion',nombre:'La cripta',campos:{estado:'planeada'}}]},'camp-fichas-v1':[{v:1,id:'c1',nombre:'Lyra',origen:'campana',campana:'local',car:{fue:8,des:14,con:14,int:16,sab:10,car:10},niveles:[{c:'mago',hp:6}]}]};
const head=`<script>window.claude={};window.__err=[];addEventListener('error',e=>__err.push(e.message));addEventListener('unhandledrejection',e=>__err.push(String(e.reason)));
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
    scLoad();
    const snap=scSnapshot();
    ok('la campaña sube sus notas, la ficha, el grupo y los permisos',!!snap['nota:s1']&&!!snap['fch:c1']&&Object.keys(snap).some(k=>k.startsWith('grp:'))&&!!snap['cfg:permisos']);
    // llegan de otro dispositivo: una ficha nueva, un grupo y los permisos
    const nueva=JSON.parse(JSON.stringify(PJC[0]));nueva.id='zz1';nueva.nombre='Brann';
    let l=Sincro.editar(SC.l,'fch:zz1',nueva,1).l;
    l=Sincro.editar(l,'grp:gx1',{id:'gx1',n:'Rivales',tipo:'rivales',miembros:[]},1).l;
    l=Sincro.editar(l,'cfg:permisos',{permisos:{inventario:'libre'}},1).l;
    SC.l=l;scApply({bajados:['fch:zz1','grp:gx1','cfg:permisos'],borrados:[]});
    ok('la ficha que llega de otro dispositivo se guarda',PJC.some(f=>f.id==='zz1'&&f.nombre==='Brann')&&JSON.parse(Store.get(PJCKEY)).some(f=>f.id==='zz1'));
    ok('el grupo que llega se guarda',GRP.some(g=>g.id==='gx1')&&JSON.parse(Store.get(GKEY)).some(g=>g.id==='gx1'));
    ok('los permisos que llegan se guardan',JSON.parse(Store.get(PJCFG)).permisos.inventario==='libre');
    // borrados en el otro dispositivo
    scApply({bajados:[],borrados:['fch:zz1','grp:gx1']});
    ok('lo borrado en otro dispositivo desaparece aquí',!PJC.some(f=>f.id==='zz1')&&!GRP.some(g=>g.id==='gx1'));
    // la biblioteca de la cuenta incluye los personajes libres
    ok('los personajes libres viajan con la biblioteca de la cuenta',SYNC_KEYS.fichas==='fichas-v1');
    ok('el estado de sincronización no viaja en la copia de seguridad',!Copia.claveOk('combat-sync-v2')&&!Copia.claveOk('combat-sync-v1'));
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+(e.stack||'').split('\\n')[1]);}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__sincro.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('sincronización: fichas, grupos y permisos de la campaña',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-sc-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__sincro.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=7,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
