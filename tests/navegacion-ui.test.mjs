// Navegación en cuatro bloques: barra, portada, enlaces secundarios, punto de combate y vista de jugador.
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
    await wait(1200);
    const nv=document.querySelector('.pagenav'),on=sel=>!!nv.querySelector(sel+'.on'),subs=()=>[...nv.querySelectorAll('a.sub.sv')].map(a=>a.getAttribute('href'));
    await go('#inicio');
    ok('la portada tiene cuatro bloques',document.querySelectorAll('#view-inicio .bqs4 .bq').length===4&&document.querySelectorAll('#view-inicio .bq .bqc').length>=8);
    ok('la barra tiene los cuatro bloques y ninguno marcado en la portada',nv.querySelectorAll('a.main').length===4&&!nv.querySelector('a.main.on'));
    ok('en la portada no hay enlaces secundarios ni separador',subs().length===0&&nv.querySelector('.navsep').hidden);
    ok('la portada permite abrir Campañas (cambiar de campaña y ver conflictos)',!!document.querySelector('#view-inicio [data-act="campopen"]')&&!!document.getElementById('hs-campname').textContent);
    await go('#campana/sesion');
    ok('dentro de Campaña hay un botón que abre Campañas (conflictos)',!!document.querySelector('#view-campana [data-cpcamp][data-act="campopen"]'));
    ok('Campaña marcada y con Combate y Ventana de mesa',on('a.main[href="#campana"]')&&subs().join()==='#combate,#mesa');
    ok('las pestañas de Campaña van en tres grupos',[...document.querySelectorAll('#view-campana .cptabs')[0].querySelectorAll('.cpsg')].map(x=>x.textContent).join()==='Jugar,Preparar,Grupo'&&[...document.querySelectorAll('#view-campana .cptabs')[0].querySelectorAll('.cpt a')].map(a=>a.getAttribute('href')).join()==='#campana/sesion,#campana/diario,#campana/encuentros');
    await go('#combate');
    ok('el combate pertenece a Campaña y su enlace queda marcado',on('a.main[href="#campana"]')&&on('a.sub[href="#combate"]'));
    ok('sin combate no hay pastilla en la barra',document.getElementById('nav-cbpill').hidden);
    state.active=true;navCombat();
    ok('en la pantalla del combate la pastilla sobra',document.getElementById('nav-cbpill').hidden);
    await go('#campana/sesion');state.active=true;navCombat();
    ok('con un combate en curso, fuera de él, la pastilla lo enlaza con la ronda',!document.getElementById('nav-cbpill').hidden&&document.getElementById('nav-cbpill').dataset.act==='gocombate'&&/R[0-9]/.test(document.getElementById('nav-cbpill').textContent));
    state.active=false;navCombat();
    ok('la barra marca la página actual con aria-current',nv.querySelector('a.main.on').getAttribute('aria-current')==='page'&&!nv.querySelector('a.main:not(.on)[aria-current]'));
    await go('#jugadores');
    ok('los jugadores de la campaña son de Campaña',on('a.main[href="#campana"]'));
    await go('#personajes');
    ok('Personajes marcado y sin enlaces secundarios',on('a.main[href="#personajes"]')&&subs().length===0);
    await go('#compendio/conjuros');
    ok('el compendio es su bloque, con Referencia y Homebrew',on('a.main[href="#compendio"]')&&subs().join()==='#referencia,#homebrew');
    await go('#referencia');
    ok('la referencia es del Compendio y queda marcada',on('a.main[href="#compendio"]')&&on('a.sub[href="#referencia"]'));
    await go('#utilidades');
    ok('Utilidades tiene su página y su bloque marcado',!document.getElementById('view-utilidades').hidden&&on('a.main[href="#utilidades"]')&&subs().includes('#tablas')&&subs().includes('#modulos'));
    await go('#tablas');
    ok('las tablas son de Utilidades',on('a.main[href="#utilidades"]')&&on('a.sub[href="#tablas"]'));
    // jugador: sin combate, mesa, tablas ni módulos
    Store.campaigns.setRol(Store.campaigns.active(),'jugador');
    await go('#utilidades');renderHome();
    ok('el jugador no ve tablas ni módulos en Utilidades',[...document.querySelectorAll('#view-utilidades a.ucard')].filter(a=>/#(tablas|modulos)/.test(a.getAttribute('href'))).every(a=>a.hidden));
    await go('#inicio');renderHome();
    ok('al jugador la portada le oculta combate, mesa y criaturas',['#combate','#mesa','#compendio/criaturas','#tablas','#modulos'].every(h=>{const a=document.querySelector('#view-inicio .bql a[href="'+h+'"]');return !a||a.hidden;}));
    await go('#utilidades');
    ok('el jugador conserva preferencias y cuenta',!!document.querySelector('#view-utilidades [data-act="pfopen"]'));
    await go('#campana/sesion');
    ok('el jugador no ve Encuentros ni Jugadores en las pestañas de Campaña',![...document.querySelectorAll('#view-campana .cptabs')[0].querySelectorAll('a')].some(a=>/encuentros|jugadores/.test(a.getAttribute('href'))));
    await go('#combate');
    ok('el jugador no entra en el combate',location.hash==='#inicio');
    Store.campaigns.setRol(Store.campaigns.active(),'master');
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+String(e.stack).slice(0,200));}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__navegacion.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('navegación en cuatro bloques',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-nav-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__navegacion.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=22,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
