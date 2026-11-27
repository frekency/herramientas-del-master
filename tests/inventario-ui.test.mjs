// Compendio › Armas: las armas de los módulos activos en una tabla para cotejarla con el manual.
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

const head=`<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));addEventListener('unhandledrejection',e=>__err.push(String(e.reason)));localStorage.clear();</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  const filas=()=>[...document.querySelectorAll("#inv-body tbody tr")];
  const celdas=n=>{const tr=filas().find(r=>r.querySelector("th").textContent.startsWith(n));return tr?[...tr.children].map(c=>c.textContent.replace(/↗/,"").trim()):null;};
  try{
    await wait(1200);
    location.hash="#compendio/armas";await wait(500);${MANUAL_JS}renderInv();await wait(200);
    ok("la sección se muestra dentro del Compendio, con su pestaña marcada",!document.getElementById("view-armas").hidden&&document.querySelector(".pagenav").dataset.blk==="compendio"&&!!document.querySelector("#view-armas [data-cmnav] a[href='#compendio/armas'][aria-selected=true]"));
    ok("la barra de apartados cuenta las armas",document.querySelector("#view-armas [data-cmnav] a[href='#compendio/armas'] .pcsub").textContent==="38");
    ok("no queda en Utilidades",!document.querySelector("#view-utilidades a[href='#inventario']")&&!document.querySelector(".pagenav a[href='#inventario']"));
    ok("salen las 38 armas del manual en 4 categorías",filas().length===38&&document.querySelectorAll("#inv-body .invh").length===4);
    ok("las categorías van como en el manual",[...document.querySelectorAll("#inv-body .invh")].map(h=>h.textContent.replace(/\\s*\\d+$/,"").trim()).join("|")==="Armas cuerpo a cuerpo sencillas|Armas a distancia sencillas|Armas cuerpo a cuerpo marciales|Armas a distancia marciales");
    {const c=celdas("Espada larga");
     ok("espada larga: daño, propiedades, maestría, peso y precio",c&&c[2]==="1d8 cortante (1d10 a dos manos)"&&c[3]==="Versátil (1d10)"&&c[4]==="Debilitar"&&c[5]==="1,5 kg"&&c[6]==="15 po");}
    {const tr=filas().find(r=>r.querySelector("th").textContent.startsWith("Espada larga")),v=[...tr.querySelectorAll(".invp")].find(e=>e.textContent.startsWith("Versátil"));
     ok("las propiedades explican su efecto (versátil: una o dos manos) y hay leyenda",!!v&&/una mano o a dos/.test(v.title)&&document.querySelectorAll("#inv-body .invleg dt").length===9&&/dos manos/.test(document.querySelector("#inv-body .invleg").textContent));}
    {const c=celdas("Daga");ok("daga: propiedades con el alcance de lo arrojadizo (la app añade pies y casillas según las preferencias)",c&&c[3].startsWith("Arrojadiza (alcance 6/18 m")&&c[3].endsWith("Ligera, Sutil")&&c[5]==="0,5 kg");}
    {const c=celdas("Ballesta pesada");ok("ballesta pesada: munición con su alcance",c&&c[3].includes("Munición (alcance 30/120 m")&&c[3].includes("Recarga")&&c[6]==="50 po");}
    {const c=celdas("Maza");ok("sin propiedades sale una raya, no un aviso",c&&c[3]==="—"&&!filas().find(r=>r.querySelector("th").textContent.startsWith("Maza")).querySelector(".invfalta"));}
    ok("con el manual completo no falta ningún dato",!document.querySelector("#inv-body .invfalta"));
    ok("el contador cuenta las armas",document.getElementById("inv-count").textContent.startsWith("38 armas · 0 revisadas"));
    {const q=document.getElementById("inv-q");q.value="ballesta";q.dispatchEvent(new Event("input",{bubbles:true}));await wait(100);
     ok("buscar filtra por nombre",filas().length===3);
     q.value="ralentizar";q.dispatchEvent(new Event("input",{bubbles:true}));await wait(100);
     ok("buscar también por maestría",filas().length>=4&&filas().every(r=>r.children[4].textContent==="Ralentizar"));
     q.value="";q.dispatchEvent(new Event("input",{bubbles:true}));await wait(100);}
    {const g=document.getElementById("inv-g");g.value="ad-mar";g.dispatchEvent(new Event("change",{bubbles:true}));await wait(100);
     ok("filtrar por categoría",filas().length===6&&document.querySelectorAll("#inv-body .invh").length===1);
     g.value="";g.dispatchEvent(new Event("change",{bubbles:true}));await wait(100);}
    {const tr=filas()[0],k=tr.dataset.k;tr.querySelector(".invok").click();await wait(100);
     ok("marcar una arma como revisada se guarda y se cuenta",JSON.parse(Store.get("inv-armas-ok")).includes(k)&&filas()[0].classList.contains("invhecha")&&document.getElementById("inv-count").textContent.includes("1 revisadas"));
     const p=document.getElementById("inv-p");p.checked=true;p.dispatchEvent(new Event("change",{bubbles:true}));await wait(100);
     ok("«solo sin revisar» esconde las marcadas",filas().length===37);
     p.checked=false;p.dispatchEvent(new Event("change",{bubbles:true}));await wait(100);}
    // un módulo con un arma a medias: lo que falta se ve y se puede filtrar
    mods().list.push({id:"xx",n:"Manual de prueba",ab:"XX",on:true,objetos:[{n:"Hacha rara",k:"arma",t:"Armas cuerpo a cuerpo marciales",pg:7,arma:{cat:"marcial",dist:false,dano:"1d8",tipo:"cortante",props:[]}}]});
    saveMods();refreshMods();renderInv();await wait(200);
    {const c=celdas("Hacha rara");ok("un arma de un módulo sale con lo que falta marcado",c&&filas().find(r=>r.querySelector("th").textContent.startsWith("Hacha rara")).querySelectorAll(".invfalta").length===3&&c[7].includes("XX, p. 7")&&c[7].includes("sin maestría, peso, precio"));}
    ok("el peso se lee también del texto cuando el módulo no lo trae aparte",[["<b>Peso:</b> 0,5 kg",0.5],["<b>Peso:</b> 125 g",0.125],["<b>Peso:</b> —",0],["<b>Peso:</b> 9 kg",9]].every(([d,v])=>invArmaPeso({d})===v)&&invArmaPeso({d:"<p>sin peso</p>"})===null&&invArmaPeso({peso:2,d:"<b>Peso:</b> 9 kg"})===2);
    {const f=document.getElementById("inv-f");f.checked=true;f.dispatchEvent(new Event("change",{bubbles:true}));await wait(100);
     ok("«solo con datos que faltan» deja solo esa",filas().length===1);
     f.checked=false;f.dispatchEvent(new Event("change",{bubbles:true}));await wait(100);}
    ok("el filtro de módulo lista el manual y el de prueba",[...document.getElementById("inv-u").options].map(o=>o.value).filter(Boolean).join("|")==="XPHB|XX");
  }catch(e){(window.__err=window.__err||[]).push("flujo: "+e+" "+String(e.stack).slice(0,300));}
  R.err=window.__err||[];
  const pre=document.createElement("pre");pre.id="__res";pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__inventario.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('Compendio › Armas',{manual:true,skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-inv-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__inventario.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.ok(R.c.length>=21,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
