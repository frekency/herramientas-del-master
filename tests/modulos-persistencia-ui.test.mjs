// Los módulos importados no se pierden: las imágenes van a IndexedDB, reimportar no pisa lo revisado y la cuenta no sustituye un módulo con más contenido.
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

const TOK='data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
const MOD=JSON.stringify({modulo:'Libro de prueba',abrev:'LP',version:'1.0',licencia:'CC-BY-4.0',criaturas:[
  {n:'Bicho Uno',en:'Bug One',sz:'M',ty:'bestia',cr:'1',ac:12,hp:10,pg:12,pend:true,tok:TOK},
  {n:'Bicho Dos',en:'Bug Two',sz:'M',ty:'bestia',cr:'2',ac:13,hp:20,pg:14,pend:true,tok:TOK}]});
const head=`<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));addEventListener('unhandledrejection',e=>__err.push(String(e.reason)));localStorage.clear();</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  const TEXTO=${JSON.stringify(MOD)};
  try{
    await wait(1200);
    const add=importModule(TEXTO,'prueba.json','');await wait(500);
    const md=mods().list.find(m=>m.id===add[0].id);
    ok('el módulo se importó con sus 2 criaturas',md&&md.criaturas.length===2);
    ok('las imágenes salen del módulo guardado',md.criaturas.every(c=>!c.tok)&&!localStorage.getItem('combat-modules-v1').includes('data:image'));
    ok('pero se siguen viendo en la criatura',MODCR.filter(c=>c.src==='Libro de prueba').every(c=>c.tok&&c.tok.startsWith('data:image')));
    const db=await tokDB(),v=await new Promise(res=>{const q=db.transaction('t').objectStore('t').get(tokKey(md,md.criaturas[0]));q.onsuccess=()=>res(q.result);q.onerror=()=>res(null);});
    ok('la imagen está en IndexedDB',typeof v==='string'&&v.startsWith('data:image'));
    // revisar una y volver a importar: no se pierde lo revisado
    revMark('criaturas',md.id,'Bicho Uno');
    const add2=importModule(TEXTO,'prueba.json','');await wait(300);
    const md2=mods().list.find(m=>m.id===md.id);
    ok('reimportar no duplica',md2.criaturas.length===2);
    ok('reimportar no deshace lo revisado',!md2.criaturas.find(c=>c.n==='Bicho Uno').pend&&md2.criaturas.find(c=>c.n==='Bicho Dos').pend);
    ok('modFusionar conserva lo añadido a mano',modFusionar({criaturas:[{n:'Mío',hp:1}]},{criaturas:[{n:'Otro',hp:2}]}).criaturas.length===2);
    // la cuenta no sustituye un módulo con más contenido
    const remoto={on:{srd521:true},list:[{id:md.id,n:'Libro de prueba',criaturas:[{n:'Bicho Uno',pend:true}]}]};
    const mez=spValorSeguro('modulos',remoto);
    ok('la cuenta no pisa el módulo local más completo',mez.list.find(m=>m.id===md.id).criaturas.length===2);
    ok('y no toca otras claves',spValorSeguro('tablas',{x:1}).x===1);
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+(e.stack||'').split(String.fromCharCode(10))[1]);}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__mods.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('módulos: las imágenes van aparte, reimportar no pisa lo revisado y la cuenta no los sustituye',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-mods-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__mods.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=9,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
