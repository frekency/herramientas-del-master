// Manuales por campaña: qué manuales (SRD y módulos) se aplican a la campaña, guardado en su configuración.
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

const head=`<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));addEventListener('unhandledrejection',e=>__err.push(String(e.reason)));window.__SRD=true;localStorage.clear();</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  const go=async h=>{location.hash=h;await wait(500);};
  try{
    await wait(1200);
    await go('#compendio/objetos');
    for(let i=0;i<40&&!COMP_SRD;i++)await wait(250);
    ok('por defecto el SRD se aplica a la campaña',modOn('srd521')&&compList('objetos').length>300);
    await go('#modulos');
    ok('el panel de manuales de la campaña lista el SRD marcado',!!document.querySelector('#md-camp input[data-man="srd521"]:checked'));
    const ck=document.querySelector('#md-camp input[data-man="srd521"]');ck.checked=false;ck.dispatchEvent(new Event('change',{bubbles:true}));await wait(300);
    ok('al quitarlo, la campaña deja de usar el SRD',!modOn('srd521')&&modOnG('srd521')&&compList('objetos').length===0&&compList('reglas').length===0&&allBest().length===0);
    ok('la selección se guarda en la configuración de la campaña',Array.isArray(JSON.parse(Store.get('camp-config-v1')).manuales)&&!JSON.parse(Store.get('camp-config-v1')).manuales.includes('srd521'));
    ok('en tu cuenta sigue activado',modOnG('srd521'));
    Store.campaigns.setRol(Store.campaigns.active(),'jugador');renderMdCamp();
    ok('un jugador no puede cambiarlos',document.querySelector('#md-camp input[data-man="srd521"]').disabled);
    Store.campaigns.setRol(Store.campaigns.active(),'master');
    // llega la selección del DM a un jugador
    SC.l=Sincro.editar(Sincro.vacio(),'cfg:permisos',{manuales:['srd521']},1).l;scApply({bajados:['cfg:permisos'],borrados:[]});await wait(200);
    ok('lo que llega del DM se aplica enseguida',modOn('srd521')&&compList('objetos').length>300);
    manSet('srd521',false);refreshMods();
    ok('la campaña sin manuales no rompe el buscador',searchAll('todo','espada').length===0);
    manSet('srd521',true);refreshMods();
    ok('volver a marcarlo lo devuelve',compList('objetos').length>300&&allBest().length>100);
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+String(e.stack).slice(0,200));}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__manuales.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('manuales por campaña',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-man-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__manuales.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=9,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
