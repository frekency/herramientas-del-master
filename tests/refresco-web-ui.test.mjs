// Web: refrescar la página equivale a salir y volver a entrar. Se sube lo pendiente y, si todo quedó guardado en la cuenta, se descarta lo que
// la pestaña tenía a medias y se baja de nuevo; si queda algo sin subir no se toca nada. Supabase se simula con un cliente en memoria.
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

const head=`<script>window.claude={};window.__err=[];addEventListener('error',e=>__err.push(e.message));addEventListener('unhandledrejection',e=>__err.push(String(e.reason)));localStorage.clear();</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]),paso=n=>{R.paso=n;};
  const pre=document.createElement('pre');pre.id='__res';document.body.append(pre);const vuelca=()=>{R.err=window.__err||[];pre.textContent=JSON.stringify(R);};setInterval(vuelca,500);
  try{
    await wait(1200);
    paso('inicio');const rid='11111111-1111-4111-8111-111111111111',C=Store.campaigns;
    let falla=false;
    const mk=op=>{const q={_op:op};for(const m of ['select','eq','neq','not','gt','order','like','in','limit'])q[m]=()=>q;
      q.insert=()=>mk('insert');q.update=()=>mk('update');q.upsert=()=>mk('upsert');q.delete=()=>mk('delete');
      q.single=async()=>falla?{data:null,error:{message:'fallo'}}:{data:{version:1},error:null};q.maybeSingle=async()=>({data:null,error:null});
      q.then=(a,b)=>Promise.resolve({data:q._op==='update'&&!falla?[{version:2}]:[],error:falla&&q._op!=='select'?{message:'fallo'}:null}).then(a,b);return q;};
    SB={from:()=>mk('select'),rpc:async()=>({data:true}),auth:{}};SB_USER={id:'u1'};
    toast=()=>{};
    let recargas=0;nubeRecarga=()=>{recargas++;};
    const prepara=()=>{
      C.setRemote(C.BASE,rid);
      Store.set(PJCKEY,JSON.stringify([{v:1,id:'c1',nombre:'Lyra',origen:'campana',campana:'local',car:{fue:8,des:14,con:14,int:16,sab:10,car:10},niveles:[{c:'mago',hp:6}]}]));
      Store.root.set(PJKEY,JSON.stringify([]));pjLoad();
      SP.v2=null;SP.busy=false;SC.busy=false;SP.l=Sincro.vacio();SC.l=Sincro.vacio();};
    // 1) todo subido: se descarta lo local y se recarga, recordando la campaña abierta
    prepara();
    paso('1');const r1=await nubeRefresca();paso('1 hecho');
    ok('con todo guardado en la cuenta se recarga una vez',r1===true&&recargas===1);
    ok('se descartan fichas, registro de campañas y estado de sincronización',Store.root.get(PJCKEY)==null&&Store.root.get('combat-campaigns-v1')==null&&Store.root.get(SPKEY)==null&&Store.root.get(PJKEY)==null);
    ok('la campaña abierta se recuerda para volver a ella',Store.native.get('hdm-ult-camp')===rid);
    // 2) la subida falla: no se toca nada
    falla=true;recargas=0;prepara();
    const f=JSON.parse(Store.get(PJCKEY));f[0].nombre='Lyra editada';Store.set(PJCKEY,JSON.stringify(f));pjLoad();
    paso('2');const r2=await nubeRefresca();paso('2 hecho');
    ok('si no se puede subir lo pendiente no se recarga ni se descarta nada',r2===false&&recargas===0&&JSON.parse(Store.get(PJCKEY))[0].nombre==='Lyra editada'&&!!Store.root.get('combat-campaigns-v1'));
    // 3) sin conexión: tampoco
    falla=false;recargas=0;prepara();
    Object.defineProperty(navigator,'onLine',{get:()=>false,configurable:true});
    paso('3');const r3=await nubeRefresca();
    ok('sin conexión no se descarta nada',r3===false&&recargas===0&&!!Store.get(PJCKEY));
    delete navigator.onLine;
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+(e.stack||'').split('\\n')[1]);}
  vuelca();R.fin=1;vuelca();
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__refresco.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('web: refrescar baja de nuevo la cuenta solo si todo está subido',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-rf-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__refresco.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.fin,'el flujo no terminó; se quedó en el paso '+R.paso);
    assert.ok(R.c.length>=5,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
