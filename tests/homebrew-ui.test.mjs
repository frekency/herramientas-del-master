// Reglas homebrew: sección propia, etiqueta Homebrew y paso opcional a la referencia rápida.
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
    await go('#homebrew');
    for(let i=0;i<40&&!COMP_SRD;i++)await wait(250);
    renderHB();
    ok('la sección existe y está vacía al principio',!document.getElementById('view-homebrew').hidden&&/Aún no hay/.test(document.getElementById('hb-body').textContent));
    ok('hay enlace en el menú',!!document.querySelector('.pagenav a[href="#homebrew"]'));
    document.querySelector('#view-homebrew [data-act="itnew"]').click();await wait(200);
    ok('el editor abre con la categoría Homebrew y la casilla de referencia',document.getElementById('it-f-cat').value==='Homebrew'&&!!document.getElementById('it-f-ref'));
    document.getElementById('it-n').value='Crítico con mala pata';
    document.getElementById('it-d').value='Con un 1 natural en un ataque, el atacante tira en la tabla de pifias.';
    document.getElementById('it-f-ref').checked=true;
    document.getElementById('itform').requestSubmit();await wait(400);
    ok('la regla aparece en la sección con la etiqueta Homebrew',/Crítico con mala pata/.test(document.getElementById('hb-body').textContent)&&!!document.querySelector('#hb-body .hbtag'));
    await go('#referencia');
    const card=[...document.querySelectorAll('#qr-body .qrcard')].find(c=>/Crítico con mala pata/.test(c.textContent));
    ok('sale en la referencia rápida con su etiqueta Homebrew',!!card&&!!card.querySelector('.hbtag'));
    await go('#homebrew');
    document.querySelector('#hb-body [data-act="hbref"]').click();await wait(300);
    await go('#referencia');
    ok('al quitarla de la referencia deja de salir ahí',![...document.querySelectorAll('#qr-body .qrcard')].some(c=>/Crítico con mala pata/.test(c.textContent)));
    await go('#compendio/reglas');
    ok('en el compendio sigue con la etiqueta',[...document.querySelectorAll('#cm-list tr.sprow')].some(r=>/Crítico con mala pata/.test(r.textContent)&&r.querySelector('.hbtag')));
    await go('#homebrew');
    ok('el SRD no lleva etiqueta',compList('reglas').filter(x=>!x._mine).length>100&&compList('reglas').filter(x=>x._mine).length===1);
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+String(e.stack).slice(0,200));}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__homebrew.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('reglas homebrew y referencia rápida',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-hb-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__homebrew.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=8,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
