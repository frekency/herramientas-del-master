// Recursos de clase en la hoja: al cargar el compendio, el personaje recibe y ajusta solo los recursos de su clase (furia…).
// Necesita Edge o Chrome (variable BROWSER para indicar otro); si no hay ninguno, el test se salta.
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFileSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
import {execFile} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {ROOT,PAGE,testNav} from './lib.mjs';
import {MANUAL_JS} from './lib.mjs';

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
    await wait(1200);
    pjLoad();
    const f=Ficha.norm({id:'p1',nombre:'Brakka',niveles:[{c:'barbaro',hp:12},{c:'barbaro',hp:7},{c:'barbaro',hp:7}],car:{fue:16,des:12,con:14,int:8,sab:10,car:10}});
    PJ.push(f);pjGuardar();
    ${MANUAL_JS}
    await wait(400);
    ok('el compendio trae la progresión y los recursos de las clases',compList('clases').every(c=>c.prog&&c.prog.filas.length===20)&&compList('clases').find(c=>c.n==='Bárbaro').recursos.length===1);
    const r=PJ[0].recursos.find(x=>x.a==='barbaro:furia');
    ok('al cargar el compendio la ficha recibe su furia sola',!!r&&r.max===3&&r.rec==='largo'&&r.cor===1);
    ok('se guardó',JSON.parse(Store.root.get(PJKEY)).find(x=>x.id==='p1').recursos.some(x=>x.a==='barbaro:furia'));
    PJ[0].niveles.push({c:'barbaro',hp:7},{c:'barbaro',hp:7},{c:'barbaro',hp:7});pjGuardar();
    ok('al guardar con más nivel sube el máximo',PJ[0].recursos.find(x=>x.a==='barbaro:furia').max===4);
    PJ[0].niveles.push({c:'barbaro',hp:7});pjGuardar();pjSel='p1';
    const box=document.createElement('div');box.id='__fx';document.body.append(box);
    box.innerHTML=pjSheetHTML(PJ[0],'libre');
    ok('la hoja trae la caja de efectos con el botón de furia',box.innerHTML.includes('Efectos de clase')&&!!box.querySelector('[data-act="pjact"][data-id="furia"]'));
    box.querySelector('[data-act="pjact"][data-id="furia"]').click();await wait(300);
    ok('pulsar activa la furia y gasta un uso',PJ[0].activos.furia===true&&PJ[0].recursos.find(x=>x.a==='barbaro:furia').uso===1);
    PJ[0].inventario=[{id:'i1',n:'Hacha a dos manos',q:1,eq:true},{id:'i2',n:'Escudo',q:1,eq:true}];pjGuardar();
    box.innerHTML=pjSheetHTML(PJ[0],'libre');
    const bs=box.querySelector('[data-act="pjstat"]');ok('la hoja tiene el botón Statblock',!!bs);
    bs.click();await wait(300);
    const mb=document.getElementById('pjm-body');
    ok('el statblock sale con CA del equipo, ataque con su tirada y acciones del Bárbaro',!!mb.querySelector('.sb')&&/Hacha a dos manos/.test(mb.textContent)&&/Defensa sin armadura, escudo|escudo/.test(mb.textContent)&&!!mb.querySelector('[data-roll="hit"],[data-roll="dmg"]')&&/Furia/.test(mb.textContent));
  }catch(e){R.fail=String(e&&e.stack||e);}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__recursos.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('recursos de clase: se crean solos al cargar el compendio',{manual:true,skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-rec-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=30000','--dump-dom',`http://127.0.0.1:${port}/__recursos.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.equal(R.fail,undefined,R.fail);
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=8,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
