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

const BROWSERS=[process.env.BROWSER,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome','/usr/bin/chromium','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const BROWSER=BROWSERS.find(b=>existsSync(b));

const STORE={'camp-fichas-v1':[{v:1,id:'c1',nombre:'Lyra',origen:'campana',campana:'local',car:{fue:8,des:14,con:14,int:16,sab:10,car:10},niveles:[{c:'mago',hp:6}]}]};
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
    location.hash='#personajes/c1';await wait(500);
    await rol('jugador');
    // libre: los PG
    document.getElementById('pj-amt').value='3';await click('[data-act="pjdano"]');
    ok('PG: libre, se aplica directo',F().hp===Ficha.hpMax(F())-3&&F().pendientes.length===0);
    // con aprobación: inventario y oro
    document.getElementById('pji-n').value='Espada larga';await click('[data-act="pjinvadd"]');
    ok('inventario: queda pendiente y la ficha aprobada no cambia',F().inventario.length===0&&F().pendientes.length===1);
    ok('el jugador ve su objeto y el aviso de pendiente',body().textContent.includes('Espada larga')&&!!body().querySelector('.pjpend [data-act="pjretirar"]'));
    await typeIn('[data-pjf="mon.po"]','50');
    ok('oro: pendiente',F().mon.po===0&&F().pendientes.length===2);
    ok('el jugador no ve lo del máster ni conceder subidas',!body().querySelector('.pjdm')&&!body().querySelector('[data-act="pjconceder"]'));
    // bloqueado: las características no se tocan
    await typeIn('[data-pjf="notas"]','Mis notas');
    ok('notas: libre',F().notas==='Mis notas'&&F().pendientes.length===2);
    // máster
    await rol('dm');
    ok('el máster ve la bandeja con aceptar y rechazar',!!body().querySelector('.pjpend [data-act="pjaceptar"]')&&!!body().querySelector('[data-act="pjaceptartodo"]'));
    ok('el máster tiene su sección privada',!!body().querySelector('.pjdm'));
    await click('.pjpend [data-act="pjaceptar"]');
    ok('aceptar aplica el cambio',F().pendientes.length===1&&(F().inventario.length===1||F().mon.po===50));
    await click('[data-act="pjrechazar"]');
    ok('rechazar lo descarta',F().pendientes.length===0&&(F().inventario.length+(F().mon.po?1:0))===1);
    // política: el máster bloquea el inventario
    location.hash='#personajes';await wait(400);
    const sel=document.querySelector('[data-pjperm="inventario"]');sel.value='bloqueado';sel.dispatchEvent(new Event('change',{bubbles:true}));await wait(150);
    ok('la política se guarda',JSON.parse(Store.get('camp-config-v1')).permisos.inventario==='bloqueado');
    const antes=F().inventario.length;
    location.hash='#personajes/c1';await wait(400);await rol('jugador');
    document.getElementById('pji-n').value='Escudo';await click('[data-act="pjinvadd"]');
    ok('bloqueado: no se añade ni queda pendiente',F().inventario.length===antes&&F().pendientes.length===0);
    // y cambiar el criterio de subida no borra los permisos
    location.hash='#personajes';await wait(400);
    const cr=document.querySelector('[data-pjcfg]');cr.value='xp';cr.dispatchEvent(new Event('change',{bubbles:true}));await wait(150);
    ok('el criterio de subida conserva los permisos',JSON.parse(Store.get('camp-config-v1')).permisos.inventario==='bloqueado');
    await rol('dm');
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+(e.stack||'').split('\\n')[1]);}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__permisos.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

test('permisos de la hoja: el jugador propone, el máster decide y los bloqueos se respetan',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-perm-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__permisos.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=13,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
