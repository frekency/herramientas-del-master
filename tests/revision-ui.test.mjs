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

const head=`<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));addEventListener('unhandledrejection',e=>__err.push(String(e.reason)));localStorage.clear();</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  try{
    await wait(1200);
    mods().list.push({id:"mm",n:"Manual de Monstruos 2024",ab:"MM2024",on:true,criaturas:[{n:"Gnomo de prueba",sz:"Small",ty:"Humanoid",cr:"1",ac:12,hp:10,ab:[8,12,10,10,10,10],sv:[-1,1,0,0,0,0],pend:true,dudas:["PG no cuadra"]},{n:"Orco sano",sz:"Medium",ty:"Humanoid",cr:"1",ac:13,hp:15,ab:[16,12,16,7,11,10],sv:[3,1,3,-2,0,0]}],objetos:[{n:"Cuerda mágica",k:"magico",d:"Una cuerda.",pend:true}]});
    saveMods();refreshMods();
    ok("hay 2 pendientes",pendAll().length===2);
    ok("el menú muestra Revisión cuando hay pendientes",!document.getElementById("nav-rv").hidden);
    ok("el menú «Más» guarda audio, modo seguro, bloqueo y preferencias",["aud-btn","safe-btn","lock-btn"].every(id=>document.getElementById(id).closest("#navmore"))&&!!document.querySelector("#navmore [data-act=pfopen]"));
    location.hash="#revision";await wait(500);
    ok("la sección Revisión muestra los pendientes",document.querySelectorAll("#rv-list .hbcard").length===2);
    ok("la ficha de criatura lleva su aviso y las dudas",!!document.querySelector("#rv-list .pendbar")&&document.body.textContent.includes("PG no cuadra"));
    document.querySelector("#rv-list [data-act=rvok][data-ty=objetos]").click();await wait(300);
    ok("marcar revisado lo quita de la lista",pendAll().length===1&&!mods().list[0].objetos[0].pend);
    ok("la lista se actualiza",document.querySelectorAll("#rv-list .hbcard").length===1);
    location.hash="#criaturas";await wait(500);
    ok("el bestiario muestra el badge del manual",document.body.textContent.includes("MM2024")||document.body.textContent.includes("Manual de Monstruos 2024"));
    mods().list.push({id:"ot",n:"Otro manual",ab:"OT",on:true,criaturas:[{n:"Orco sano",sz:"Medium",ty:"Humanoid",cr:"1",ac:99,hp:99,ab:[10,10,10,10,10,10],pend:true}]});saveMods();refreshMods();
    const orcos=MODCR.filter(c=>c.n==="Orco sano");
    ok("una ficha ya revisada no la pisa otro manual",orcos.length===1&&orcos[0].hp===15&&(orcos[0]._also||[]).includes("OT"));
    ok("revisar desde la ficha de la criatura",revMark("criaturas","mm","Gnomo de prueba")&&pendAll().length===0);
  }catch(e){(window.__err=window.__err||[]).push("flujo: "+e+" "+String(e.stack).slice(0,200));}
  R.err=window.__err||[];
  const pre=document.createElement("pre");pre.id="__res";pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__revision.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('revisión de lo importado',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-rev-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__revision.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=10,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
