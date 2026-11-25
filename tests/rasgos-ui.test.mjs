// Compendio: pestaña «Rasgos de clase» con los rasgos, rasgos de subclase y opciones de las clases.
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
  try{
    await wait(1200);
    location.hash='#compendio/rasgos';
    for(let i=0;i<40&&!(COMP_SRD&&COMP_SRD.rasgos);i++)await wait(250);
    await wait(500);
    ok('los rasgos se sacan de las clases',COMP_SRD&&COMP_SRD.rasgos&&COMP_SRD.rasgos.length>=260);
    ok('la pestaña lista los rasgos',document.querySelectorAll('#cm-list tr.sprow').length>=260);
    ok('hay filtros de clase y tipo y no hay botón de crear',!document.getElementById('cm-f1').hidden&&!document.getElementById('cm-f2').hidden&&document.getElementById('cm-new').hidden);
    const q=document.getElementById('cm-q');q.value='furtivo';q.dispatchEvent(new Event('input',{bubbles:true}));await wait(300);
    const f=[...document.querySelectorAll('#cm-list tr.sprow')];
    ok('se busca por nombre',f.length>=1&&f.some(r=>/Ataque furtivo/.test(r.textContent)));
    f[0].click();await wait(200);
    const det=document.querySelector('#fc-body');
    ok('al abrir uno su página enseña el texto sin botones de edición',!!det&&/dados|daño/i.test(det.textContent)&&!det.querySelector('[data-act="itclone"]'));
    ok('la clase y el nivel salen en su página',!!det&&/Clase:/.test(det.textContent)&&/Nivel:/.test(det.textContent));
    ok('el buscador global también los encuentra',searchAll('todo','manos rapidas').some(x=>x.ty==='rasgos'));
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+String(e.stack).slice(0,200));}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__rasgos.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('compendio: rasgos de clase',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-ras-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__rasgos.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=7,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
