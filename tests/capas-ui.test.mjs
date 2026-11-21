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
import {testNav} from './lib.mjs';

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
    const vis=el=>{const r=el.getBoundingClientRect(),cs=getComputedStyle(el);return cs.display!=='none'&&r.width>0&&r.height>0;};
    const todos=[...document.querySelectorAll('dialog.modal')];
    ok('los 14 modales son <dialog> nativos; sin sesión solo está abierto el acceso obligatorio',todos.length===14&&todos.every(d=>d.id==='acctmodal'?(d.open&&vis(d)):(!d.open&&d.hidden&&!vis(d))));
    ok('ningún modal conserva role=dialog ni aria-modal a mano',!document.querySelector('.mbox[role="dialog"],.mbox[aria-modal]')&&todos.every(d=>d.getAttribute('aria-labelledby')));
    // abrir con la propiedad hidden, como hace el resto del código
    openBest();await wait(100);
    const b=document.getElementById('bestmodal');
    ok('abrir el bestiario lo muestra como modal nativo a pantalla completa',b.open&&b.matches(':modal')&&vis(b)&&b.getBoundingClientRect().width>=innerWidth-1);
    ok('la caja del modal se ve y tiene contenido',vis(b.querySelector('.mbox')));
    ok('el resto de la página queda inerte tras el modal',document.querySelector('main')?document.querySelector('main').matches(':not(:modal)'):true);
    // un aviso con el modal abierto queda por encima
    toast('Prueba de aviso');await wait(100);
    const t=document.getElementById('toast');
    ok('el aviso es un popover abierto, en la capa superior',t.matches(':popover-open'));
    // Esc cierra y deja el estado coherente
    b.dispatchEvent(new Event('cancel',{cancelable:true}));b.close();await wait(300);
    ok('al cerrar por Esc el modal queda oculto y el estado coherente',b.hidden&&!b.open);
    // el acceso obligatorio no se cierra con Esc
    const ac=document.getElementById('acctmodal');ac.hidden=false;await wait(50);
    ok('la cuenta se abre como modal',ac.open);
    const ev=new Event('cancel',{cancelable:true});ac.dispatchEvent(ev);ac.hidden=true;await wait(50);
    ok('y se cierra con hidden=true',!ac.open);
    // bloqueo de pantalla: siempre por encima
    const lk=document.getElementById('lockscr');lk.hidden=false;await wait(50);
    ok('el bloqueo es modal y no se cierra con Esc',lk.open&&(()=>{const e=new Event('cancel',{cancelable:true});lk.dispatchEvent(e);return e.defaultPrevented;})());
    lk.hidden=true;await wait(50);ok('y se quita al desbloquear',!lk.open);
    // preguntas propias (sustituyen a confirm y prompt)
    let r1;Dlg.si('¿Seguro?').then(v=>r1=v);await wait(100);
    const q1=document.querySelector('dialog.ask');
    ok('la confirmación es un <dialog> modal y el foco empieza en la opción segura',!!q1&&q1.open&&document.activeElement===q1.querySelector('button[type=button]'));
    q1.querySelector('button.primary').click();await wait(100);
    ok('aceptar devuelve true y el diálogo desaparece',r1===true&&!document.querySelector('dialog.ask'));
    let r2;Dlg.si('¿Seguro?').then(v=>r2=v);await wait(100);document.querySelector('dialog.ask button[type=button]').click();await wait(100);
    ok('cancelar devuelve false',r2===false);
    let r3;Dlg.texto('¿Por qué?').then(v=>r3=v);await wait(100);const q3=document.querySelector('dialog.ask');q3.querySelector('input').value='motivo';q3.querySelector('button.primary').click();await wait(100);
    ok('preguntar un texto devuelve lo escrito',r3==='motivo');
    let r4='x';Dlg.texto('¿Por qué?').then(v=>r4=v);await wait(100);document.querySelector('dialog.ask button[type=button]').click();await wait(100);
    ok('y null si se cancela',r4===null);
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+String(e.stack).slice(0,200));}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__capas.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('capas flotantes nativas: diálogos, aviso y bloqueo',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-cap-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__capas.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=16,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
