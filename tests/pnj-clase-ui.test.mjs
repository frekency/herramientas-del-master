// PNJ con clase de referencia: el statblock sale de clase, nivel, características y equipo, y es lo que entra al combate.
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
window.__SRD=true;localStorage.clear();</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  try{
    await wait(1200);
    compLoad();
    for(let i=0;i<40&&!COMP_SRD;i++)await wait(250);
    await wait(500);
    const it=Notas.norm({tipo:'npc',nombre:'Capitán Varo',campos:{ref:{c:'guerrero',n:5,sub:'Campeón',car:[16,12,14,10,10,10],hab:'Atletismo, Percepción',eq:'Cota de malla, Escudo, Espada larga'}}});
    CP.push(it);
    ok('la clase de referencia se conserva al normalizar',it.campos.ref.c==='guerrero'&&it.campos.ref.n===5&&it.campos.ref.car[0]===16&&it.campos.ref.eq.includes('Escudo'));
    const f=pjRefFicha(it);
    ok('de la referencia sale una ficha de guerrero de nivel 5',!!f&&Ficha.nivel(f)===5&&f.inventario.length===3&&f.habil.atletismo===1);
    const m=cpRefM(it);
    ok('statblock: CA 18 con cota de malla y escudo, multiataque y ataque con espada',!!m&&m.ac.startsWith('18')&&m.a.some(a=>a[0]==='Multiataque')&&m.a.some(a=>a[0]==='Espada larga'&&/\\+6/.test(a[1])));
    const fila=cpNpcFila(it);
    ok('al combate entra con su CA, iniciativa y PG derivados',!!fila&&fila.ac===18&&fila.initBonus===1&&fila.maxHp>=40&&/Guerrero 5/.test(fila.notes)&&/Espada larga/.test(fila.notes));
    ok('el formulario trae la clase, el equipo y el statblock',(()=>{const h=cpRef(it);return h.includes('data-cpref="c"')&&h.includes('Capitán Varo')&&h.includes('class="sb"')&&h.includes('Multiataque');})());
    it.campos.stats={ca:12,pg:30,bi:0,vel:'',ab:[null,null,null,null,null,null],ataques:'',notas:''};
    ok('las estadísticas propias mandan sobre la clase',cpNpcFila(it).ac===12);
    const sin=Notas.norm({tipo:'npc',nombre:'Sin clase',campos:{}});
    ok('sin clase no hay fila ni statblock',cpNpcFila(sin)===null&&cpRefM(sin)===null);
  }catch(e){R.fail=String(e&&e.stack||e);}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__pnj-clase.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('PNJ con clase de referencia: statblock y combate',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-pnjc-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=30000','--dump-dom',`http://127.0.0.1:${port}/__pnj-clase.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.equal(R.fail,undefined,R.fail);
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=7,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
