// Jugador y DM en el navegador: el DM ve avisos de lo que tocan los jugadores; quien es jugador no ve combate, criaturas ni objetos mágicos.
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

const AHORA=Date.now();
const STORE={'camp-fichas-v1':[{v:1,id:'c1',nombre:'Lyra',origen:'campana',campana:'local',car:{fue:8,des:14,con:14,int:16,sab:10,car:10},niveles:[{c:'mago',hp:6}],
  pendientes:[{id:'p1',t:AHORA,por:'Jugador',desc:'Espada',partes:[{c:'inventario',antes:[],despues:[{n:'Espada larga',cant:1}]}]}],
  registro:[{t:AHORA,a:'dano',d:'3',por:'Jugador'},{t:AHORA-1000,a:'cura',d:'2',por:'Máster'}]}]};
const head=`<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));addEventListener('unhandledrejection',e=>__err.push(String(e.reason)));
localStorage.clear();for(const[k,v]of Object.entries(${JSON.stringify(STORE)}))localStorage.setItem(k,JSON.stringify(v));</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  try{
    await wait(1200);
    // ---- DM
    location.hash='#inicio';await wait(400);renderHome();
    const c=pjCambios();
    ok('el DM cuenta 1 cambio por aprobar y 1 de un jugador',c.pend===1&&c.ev.length===1&&c.nuevos===1);
    ok('insignia en el menú de Personajes',!document.getElementById('nav-pjb').hidden&&document.getElementById('nav-pjb').textContent==='1');
    ok('aviso en el inicio',!document.getElementById('hs-cambios').hidden&&document.getElementById('hs-cambios').textContent.includes('por aprobar'));
    location.hash='#personajes';await wait(500);
    ok('la lista de personajes enseña los cambios de los jugadores',!!document.querySelector('.pjcambios')&&document.querySelector('.pjcambios').textContent.includes('Lyra'));
    document.querySelector('[data-act="pjvisto"]').click();await wait(200);
    ok('marcar como vistos apaga lo nuevo',pjCambios().nuevos===0);
    ok('el DM ve el combate y las criaturas',!document.querySelector('.pagenav a[href="#combate"]').hidden&&CTABS.length===ctabs().length);
    // ---- jugador
    Store.campaigns.setRol(Store.campaigns.active(),'jugador');navRev();
    location.hash='#combate';await wait(500);
    ok('el jugador no entra en el combate',location.hash==='#inicio');
    location.hash='#compendio/criaturas';await wait(500);
    ok('ni en las criaturas del compendio',location.hash==='#compendio/conjuros');
    location.hash='#mesa';await wait(400);
    ok('ni en la ventana de mesa',location.hash==='#inicio');
    ok('el menú esconde combate, mesa, tablas y módulos',['#combate','#mesa','#tablas','#modulos'].every(h=>document.querySelector('.pagenav a[href="'+h+'"]').hidden));
    ok('el jugador conserva compendio y personajes',!document.querySelector('.pagenav a[href="#compendio"]').hidden&&!document.querySelector('.pagenav a[href="#personajes"]').hidden);
    ok('la pestaña de criaturas desaparece',!ctabs().some(x=>x[0]==='criaturas'));
    ok('solo módulos del Manual del Jugador',modVeJug({ref:'mdj'})&&modVeJug({n:'Manual del Jugador 2024'})&&!modVeJug({ref:'gdm',n:'Guía del Máster 2024'})&&!modVeJug({n:'Mi módulo',mine:true}));
    ok('sin objetos mágicos',compList('objetos').every(x=>x.k!=='magico'));
    ok('la búsqueda no devuelve criaturas',!searchAll('todo','a').some(x=>x.ty==='criaturas'));
    // ---- ver como jugador
    Store.campaigns.setRol(Store.campaigns.active(),'master');Store.campaigns.verComo({m:'x',n:'Ana',pj:'c1'});
    ok('en «ver como jugador» el rol es de jugador y se sabe quién',Store.campaigns.rol()==='jugador'&&Store.campaigns.vista().n==='Ana');
    navRev();ok('sale el aviso de la vista de jugador',!document.getElementById('vistabar').hidden&&document.getElementById('vistabar').textContent.includes('Ana'));
    Store.campaigns.verComo(null);
    ok('al salir vuelve a ser el máster',Store.campaigns.rol()==='master'&&!Store.campaigns.vista());
    Store.campaigns.setRol(Store.campaigns.active(),'jugador');
    ok('el jugador no ve avisos de cambios',document.getElementById('nav-pjb').hidden&&document.getElementById('hs-cambios').hidden);
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+(e.stack||'').split(String.fromCharCode(10))[1]);}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__jugador.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('el DM ve los cambios de los jugadores y el jugador no ve combate ni criaturas',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-jug-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__jugador.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=18,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
