// Web: la pestaña no guarda datos entre refrescos. sessionStorage solo conserva lo que hace falta para las recargas que provoca la propia app
// (cambiar de campaña, bajar la cuenta...) y, aparte, el bloqueo de pantalla; al abrir o refrescar a mano se vacía y todo se baja de la cuenta.
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

// Estado que dejó una sesión anterior de la pestaña; «interna» marca que la recarga la provocó la propia app
const head=interna=>`<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));addEventListener('unhandledrejection',e=>__err.push(String(e.reason)));
sessionStorage.clear();
sessionStorage.setItem('combat-campaigns-v1',JSON.stringify({v:1,active:'local',list:[{id:'local',nombre:'Mi campaña'},{id:'cx',nombre:'Otra',remoto:'11111111-1111-4111-8111-111111111111'}]}));
sessionStorage.setItem('camp-fichas-v1','[{"id":"c1"}]');sessionStorage.setItem('fichas-v1','[{"id":"f1"}]');sessionStorage.setItem('combat-sync-v2','{"l":{"items":{}},"base":true}');
sessionStorage.setItem('bloqueo-v1','{"on":true}');sessionStorage.setItem('acceso-previo','1');
${interna?"sessionStorage.setItem('recarga-interna','1');":''}</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  try{
    await wait(800);
    const g=k=>sessionStorage.getItem(k);
    R.estado={fichas:g('camp-fichas-v1'),libres:g('fichas-v1'),sync:g('combat-sync-v2'),reg:g('combat-campaigns-v1'),bloqueo:g('bloqueo-v1'),previo:g('acceso-previo'),marca:g('recarga-interna')};
    ok('hay web de la nube',WEB_NUBE===true);
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+(e.stack||'').split('\\n')[1]);}
  R.err=window.__err||[];R.fin=1;
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(interna){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__refresco.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});
      return r.end(head(interna)+PAGE.replace("location.protocol==='https:'","true")+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}
async function abre(interna){
  const srv=await serve(interna),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-rf-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=20000','--dump-dom',`http://127.0.0.1:${port}/__refresco.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    return R;
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
}

testNav('web: al abrir o refrescar la pestaña se vacían los datos y solo queda el bloqueo y el aviso de acceso previo',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const e=(await abre(false)).estado;
  assert.equal(e.fichas,null);assert.equal(e.libres,null);assert.equal(e.sync,null);
  assert.ok(!e.reg||!/"cx"/.test(e.reg),'el registro de campañas de la sesión anterior no debe sobrevivir');
  assert.equal(e.bloqueo,'{"on":true}');assert.equal(e.previo,'1');
});

testNav('web: en una recarga provocada por la propia app se conservan los datos de la pestaña y se consume la marca',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const e=(await abre(true)).estado;
  assert.match(e.fichas,/"id":"c1"/);assert.match(e.libres,/"id":"f1"/);assert.ok(e.sync);assert.match(e.reg,/"cx"/);
  assert.equal(e.marca,null,'la marca vale para una sola recarga');
});
