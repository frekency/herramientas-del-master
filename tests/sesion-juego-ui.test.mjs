// Sesión en juego: introducción → escenas con Siguiente/Atrás, modo libre y altas rápidas guardadas como notas.
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
    const it=cpNew("sesion","Sesión de prueba");
    it.texto="Los héroes llegan a la posada.";it.campos.lectura="Bajo la lluvia veis una luz.";
    it.campos.escenas=[{t:"La posada",d:"Un posadero nervioso.",l:"Entráis y el posadero os mira.",r:"",enc:[],lugar:"Posada",pnj:"",ok:false,tipo:"social"},{t:"El bosque",d:"Lobos en la niebla.",r:"",enc:[],lugar:"",pnj:"",ok:false,tipo:"combate"}];
    cpDirty=true;cpFlush();
    cpTipo="sesion";cpSel=it.id;cpTab="juego";cpRenderDet();
    const det=()=>document.querySelector("#cp-det");
    ok("empieza por la introducción",det().textContent.includes("Los héroes llegan a la posada")&&det().textContent.includes("1/4"));
    ok("la introducción muestra lo que les cuentas",!!det().querySelector(".juegoleer")&&det().textContent.includes("Bajo la lluvia"));
    ok("Atrás desactivado en la introducción",!!det().querySelector("[data-act=jprev][disabled]"));
    det().querySelector("[data-act=jnext]").click();await wait(200);
    ok("Siguiente muestra la primera escena",det().textContent.includes("Un posadero nervioso")&&cpGet(it.id).campos.paso==="0");
    ok("la escena muestra su texto para los jugadores",det().textContent.includes("Entráis y el posadero"));
    det().querySelector("[data-act=jnext]").click();await wait(200);
    ok("nunca se publica",!/Bajo la lluvia|Entráis/.test(JSON.stringify(scPub((()=>{const c=cpGet(it.id);c.campos.estado="jugada";c.campos.publico="resumen";return c;})()))));
    ok("segunda escena",det().textContent.includes("Lobos en la niebla"));
    det().querySelector("[data-act=jprev]").click();await wait(200);
    ok("Atrás vuelve a la anterior",det().textContent.includes("Un posadero nervioso"));
    const chk=det().querySelector("[data-jhecha]");chk.checked=true;chk.dispatchEvent(new Event("change",{bubbles:true}));await wait(200);
    ok("marcar la escena como hecha",cpGet(it.id).campos.escenas[0].ok===true);
    det().querySelector("[data-act=jgo][data-p=l]").click();await wait(200);
    ok("modo libre",det().textContent.includes("Fuera de la planificación")&&cpGet(it.id).campos.paso==="l");
    Dlg.texto=async()=>"Orco Gruñón";
    const antes=CP.length;
    det().querySelector("[data-act=jadd][data-t=npc]").click();await wait(400);
    const npc=CP.find(x=>x.tipo==="npc"&&x.nombre==="Orco Gruñón");
    ok("añadir un PNJ lo guarda como nota enlazada a la sesión",!!npc&&CP.length===antes+1&&cpGet(it.id).campos.extras.includes(npc.id));
    ok("aparece en la lista de lo añadido",det().textContent.includes("Orco Gruñón"));
    det().querySelector("[data-act=jadd][data-t=encuentro]").click();await wait(400);
    ok("encuentro improvisado como nota",CP.some(x=>x.tipo==="nota"&&x.nombre.includes("Orco Gruñón")&&x.nombre.startsWith("Encuentro")));
    det().querySelector("[data-act=jgo]").click();await wait(200);
    ok("Volver al guion lleva a la primera escena sin hacer",cpGet(it.id).campos.paso==="1");
  }catch(e){(window.__err=window.__err||[]).push("flujo: "+e+" "+String(e.stack).slice(0,300));}
  R.err=window.__err||[];
  const pre=document.createElement("pre");pre.id="__res";pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__juego.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('sesión en juego: introducción, escenas, modo libre y altas rápidas',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-juego-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__juego.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=14,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
