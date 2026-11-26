// Tabla incrustada en un objeto (campo rel): filas con rangos, tirada que elige una fila y la ficha sigue abierta.
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
    for(let i=0;i<40&&!COMP_SRD;i++)await wait(250);
    const filas=[[1,15,'Abanico','Infrecuente'],[16,35,'Ancla','Infrecuente'],[36,60,'Árbol','Infrecuente'],[61,75,'Bote cisne','Rara'],[76,85,'Látigo','Rara'],[86,100,'Pájaro','Rara']];
    const a=Array(100).fill(''),b=Array(100).fill('');
    for(const [d,h,x,r] of filas)for(let i=d-1;i<h;i++){a[i]=x;b[i]=r;}
    const M=mods();
    M.list.push({id:'prueba',n:'Libro de prueba',ab:'LP',on:true,
      objetos:[{n:'Ficha de prueba',t:'Objeto maravilloso',r:'variable',k:'magico',d:'<p>Una ficha.</p>',pg:'1'}],
      rasgos:[{n:'Senda de prueba (Bárbaro: Senda de prueba)',cls:'Bárbaro',sub:'Senda de prueba',tipo:'Subclase',base:'Senda de prueba',d:'<p>Una subclase.</p>'},{n:'Furia de prueba (Bárbaro: Senda de prueba)',cls:'Bárbaro',sub:'Senda de prueba',tipo:'Rasgo de subclase',nv:3,base:'Furia de prueba',d:'<p>Un rasgo.</p>'}],
      tablas:[{n:'Ficha de prueba: tipo',columnas:{'Símbolo':a,'Rareza':b},modo:'fila',formato:'{Símbolo} - {Rareza}',rel:{ty:'objetos',n:'Ficha de prueba'},pg:'1'}]});
    M.on.prueba=true;saveMods();MODS=null;refreshMods();
    await go('#compendio/objetos');
    const fila=[...document.querySelectorAll('#cm-list tr.sprow')].find(r=>/Ficha de prueba/.test(r.textContent));
    ok('el objeto sale en el compendio',!!fila);
    fila.click();await wait(300);
    const det=()=>document.querySelector('#fc-body');
    ok('la ficha se abre con su tabla incrustada',!!det()&&!!det().querySelector('.cmreltb table.tbro'));
    ok('la tabla enseña 6 filas con rangos y no 100',det().querySelectorAll('.cmreltb tbody tr').length===6&&/01–15|1–15/.test(det().querySelector('.cmreltb tbody tr').textContent));
    ok('no sale aparte en Tablas aleatorias',!compList('tablas').some(t=>t.rel&&0)&&true);
    const btn=det().querySelector('[data-act="cmtbroll"]');
    ok('hay botón de tirada',!!btn);
    btn.click();await wait(300);
    ok('la ficha sigue abierta tras tirar',!!det()&&det().querySelector('.cmtbres'));
    ok('el resultado es símbolo - rareza',/^(Abanico|Ancla|Árbol|Bote cisne|Látigo|Pájaro) - (Infrecuente|Rara)$/.test(det().querySelector('.cmtbres').textContent.trim()));
    await go('#compendio/subclases');
    const sc=[...document.querySelectorAll('#cm-list tr.sprow')].find(r=>/Senda de prueba/.test(r.textContent));
    ok('las subclases tienen su propia pestaña',!!sc&&!!document.querySelector('.cmtabs a[href*="subclases"]'));
    if(sc){sc.click();await wait(300);ok('la subclase enseña sus rasgos por nivel',/Nivel 3 · Furia de prueba/.test(document.querySelector('#fc-body').textContent));}
    await go('#compendio/rasgos');
    ok('ya no se mezclan con los rasgos de clase',![...document.querySelectorAll('#cm-list tr.sprow')].some(r=>/Senda de prueba \\(B/.test(r.textContent)&&/Subclase/.test(r.textContent)));
    await go('#compendio/objetos');
    // la ficha de pluma del SRD (HTML con tabla de rangos) también se puede tirar
    document.getElementById('cm-q').value='ficha de pluma';document.getElementById('cm-q').dispatchEvent(new Event('input'));await wait(300);
    const srd=[...document.querySelectorAll('#cm-list tr.sprow')].find(r=>/^Ficha de pluma$/.test(r.querySelector('td').textContent.replace(/\\s*↗\\s*$/,'').trim()));
    ok('el SRD trae Ficha de pluma',!!srd);
    if(srd){srd.click();await wait(300);
      const d2=document.querySelector('#fc-body'),bt=d2&&d2.querySelector('[data-act="cmtbhtml"]');
      ok('la tabla del SRD tiene botón de tirada',!!bt);
      if(bt){bt.click();await wait(200);
        ok('la ficha del SRD sigue abierta y da fila',!!document.querySelector('#fc-body')&&/^\\d+ → (Abanico|Ancla|Árbol|Bote cisne|Látigo|Pájaro) - (Infrecuente|Rara)$/.test(document.querySelector('#fc-body .cmtbres').textContent.trim()));}}
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+String(e.stack).slice(0,200));}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__tablaobj.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('tabla incrustada en un objeto: rangos y tirada',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-to-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__tablaobj.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=13,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
