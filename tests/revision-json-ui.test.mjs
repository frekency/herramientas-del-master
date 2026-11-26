// tools/revision-json.html: se edita la tabla en la propia vista (celdas, filas y columnas) sin tocar HTML.
// Necesita Edge o Chrome (variable BROWSER para indicar otro); si no hay ninguno, el test se salta.
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFileSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
import {execFile} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {ROOT,PAGE,testNav} from './lib.mjs';

const BROWSERS=[process.env.BROWSER,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome','/usr/bin/chromium','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const BROWSER=BROWSERS.find(b=>existsSync(b));

const head=`<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));addEventListener('unhandledrejection',e=>__err.push(String(e.reason)));
window.__env=[];window.__AppShell={platform:'win32',titlebar(){},mesa:{abrir(){},cerrar(){},enviar(p){window.__env.push(p);},onEstado(){}}};
localStorage.clear();</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  try{
    for(let i=0;i<40&&!document.getElementById('fichero');i++)await wait(250);
    let blob=null;URL.createObjectURL=b=>{blob=b;return 'blob:x';};window.confirm=()=>true;window.alert=m=>{R.alert=m;};
    const json=JSON.stringify({clases:[{n:'Prueba',rev:'revisar la tabla',d:'<table class="cmtab"><thead><tr><th>Nivel</th><th>Rasgos</th></tr></thead><tbody><tr><td>1</td><td>Uno</td></tr><tr><td>2</td><td>Dos</td></tr></tbody></table><p>Texto</p>'}]});
    const dt=new DataTransfer();dt.items.add(new File([json],'t.json',{type:'application/json'}));
    const fi=document.getElementById('fichero');fi.files=dt.files;fi.dispatchEvent(new Event('change',{bubbles:true}));
    for(let i=0;i<40&&!document.querySelector('.card .prev table');i++)await wait(250);
    ok('se ve la ficha pendiente con su tabla',!!document.querySelector('.card .prev table'));
    const q=s=>document.querySelector(s);
    q('[data-a="editar"]').click();
    ok('Editar la vuelve editable y saca la barra de tabla',q('.prev').isContentEditable&&!!q('.tb'));
    const celdas=()=>[...q('.prev table').rows].map(r=>[...r.cells].map(c=>c.textContent));
    const td=q('.prev tbody tr td:nth-child(2)');td.textContent='Furia';
    const r=document.createRange();r.selectNodeContents(td);getSelection().removeAllRanges();getSelection().addRange(r);document.dispatchEvent(new Event('selectionchange'));await wait(100);
    q('[data-a="col+"]').click();q('[data-a="fila+"]').click();
    ok('añadir columna y fila deja la tabla cuadrada',celdas().every(f=>f.length===3)&&celdas().length===4);
    const td2=q('.prev tbody tr:nth-child(3) td:nth-child(3)');td2.textContent='x';
    q('[data-a="editar"]').click();
    ok('Aplicar cambios devuelve HTML limpio y deja de ser editable',!q('.prev').isContentEditable&&!q('.tb')&&!/contenteditable|style=/.test(q('.prev').innerHTML));
    q('[data-a="ok"]').click();await wait(200);
    q('#guardar').click();await wait(300);
    const out=JSON.parse(await blob.text()),d=out.clases[0].d;
    ok('el JSON guardado lleva la tabla editada y sin marca de revisión',/<td>Furia<\\/td>/.test(d)&&(d.match(/<tr>/g)||[]).length===4&&(d.match(/<th>/g)||[]).length===3&&!('rev' in out.clases[0])&&d.includes('<p>Texto</p>'));
  }catch(e){R.fail=String(e&&e.stack||e);}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__revjson.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+readFileSync(path.join(ROOT,'tools/revision-json.html'),'utf8')+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('herramienta de revisión de JSON: edición visual de tablas',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-rec-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=30000','--dump-dom',`http://127.0.0.1:${port}/__revjson.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.equal(R.fail,undefined,R.fail);
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=5,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
