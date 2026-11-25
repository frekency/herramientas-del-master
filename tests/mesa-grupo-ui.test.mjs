// Capa «Resumen del grupo» del estudio de la mesa: se añade, se normaliza y envía a la ventana solo cifras de los personajes de la campaña.
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
    await wait(1200);
    // un personaje de campaña con vida, espacios, pacto y un recurso (furia)
    pjLoad();
    const f=Ficha.norm({id:'p1',nombre:'Brakka',origen:'campana',niveles:[{c:'barbaro',hp:12},{c:'barbaro',hp:7}],car:{fue:16,des:12,con:14,int:8,sab:10,car:10},hp:11,temp:3,ca:16,
      recursos:[{id:'r1',n:'Furia',max:3,uso:1}]});
    PJC.push(f);
    const d=mesaGrupoData();
    ok('el dato lleva al personaje',d.tipo==='grupo'&&d.lista.length===1&&d.lista[0].n==='Brakka');
    ok('vida actual y máxima',d.lista[0].pg===11&&d.lista[0].max===Ficha.hpMax(f)&&d.lista[0].tmp===3);
    ok('la furia como recurso',JSON.stringify(d.lista[0].rec)===JSON.stringify([{n:'Furia',max:3,uso:1}]));
    ok('sin secretos del máster',!('notas' in d.lista[0])&&!('dm' in d.lista[0])&&!('registro' in d.lista[0]));
    ok('un retirado no sale',(()=>{PJC.push(Ficha.norm({id:'p2',nombre:'Fuera',origen:'campana',estado:'retirado',niveles:[{c:'mago',hp:6}],car:{fue:8,des:10,con:10,int:16,sab:10,car:10}}));return mesaGrupoData().lista.length===1;})());
    location.hash='#mesa';await wait(600);
    const b=document.querySelector('[data-ms="add"][data-t="grupo"]');
    ok('hay botón para añadir la capa',!!b);
    b.click();await wait(150);
    const c=MS.capas.find(x=>x.tipo==='grupo');
    ok('la capa se crea con todo visible',!!c&&c.pg&&c.esp&&c.rec&&!c.ca&&c.cols===0);
    ok('normaliza columnas y banderas',(()=>{const n=msNorm({...c,cols:'9',pg:false,ca:true});return n.cols===4&&n.pg===false&&n.ca===true;})());
    ok('el inspector ofrece las opciones',/data-msf="pg"/.test(document.body.innerHTML)&&/data-msf="cols"/.test(document.body.innerHTML));
    window.__env.length=0;
    window.__AppShell.mesa.abrir=()=>{};mesaEst.abierta=true;
    mesaGrupoSend();
    const e=window.__env.find(x=>x.tipo==='grupo');
    ok('con la capa visible se envía el dato a la mesa',!!e&&e.lista.length===1&&e.ventana==='todas');
    c.visible=false;window.__env.length=0;mesaGrupoSend();
    ok('con la capa oculta no se envía',!window.__env.some(x=>x.tipo==='grupo'));
    c.visible=true;window.__env.length=0;PJC[0].hp=5;pjGuardar();
    ok('al guardar una ficha se actualiza la mesa',window.__env.some(x=>x.tipo==='grupo'&&x.lista[0].pg===5));
  }catch(e){R.fail=String(e&&e.stack||e);}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__grupo.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('resumen del grupo en la mesa: capa, dato y envío',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-grp-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=30000','--dump-dom',`http://127.0.0.1:${port}/__grupo.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.equal(R.fail,undefined,R.fail);
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=12,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
