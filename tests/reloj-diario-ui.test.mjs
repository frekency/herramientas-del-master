// Reloj de campaña (Harptos), diario del personaje e inventario desde el compendio, en el navegador.
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

const STORE={'camp-notes-v1':{v:1,items:[{id:'s1',tipo:'sesion',nombre:'La mina',campos:{estado:'planeada',fecha:'2026-11-20'}}]},'camp-fichas-v1':[{v:1,id:'c1',nombre:'Lyra',origen:'campana',campana:'local',car:{fue:8,des:14,con:14,int:16,sab:10,car:10},niveles:[{c:'mago',hp:6}]}]};
const head=`<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));addEventListener('unhandledrejection',e=>__err.push(String(e.reason)));
window.__SRD=true;localStorage.clear();for(const[k,v]of Object.entries(${JSON.stringify(STORE)}))localStorage.setItem(k,JSON.stringify(v));</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  const click=async sel=>{const b=document.querySelector(sel);if(!b)throw new Error('no hay '+sel);b.click();await wait(150);};
  const setv=(sel,v)=>{const i=document.querySelector(sel);if(!i)throw new Error('no hay '+sel);i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));};
  try{
    await wait(1500);
    const rb=()=>document.getElementById('relbar'),mod=()=>document.getElementById('sesmodal'),F=()=>PJC.find(x=>x.id==='c1');
    location.hash='#combate';await wait(300);
    // reloj
    ok('sin configurar, la barra del reloj ofrece configurarlo',!rb().hidden&&!!rb().querySelector('[data-act="relabrir"]'));
    await click('[data-act="relabrir"]');
    setv('#rel-a','1491');setv('#rel-m','3');setv('#rel-di','21');setv('#rel-ho','8');
    await click('[data-act="relinit"]');
    ok('el reloj arranca el 21 de Ches de 1491 a las 08:00 en primavera',rb().textContent.includes('21 de Ches, 1491 DR')&&rb().textContent.includes('08:00')&&rb().textContent.includes('Primavera'));
    mod().hidden=true;
    await click('[data-act="relcorto"]');
    ok('descanso corto suma 1 hora',rb().textContent.includes('09:00'));
    await click('[data-act="rellargo"]');
    ok('descanso largo suma 8 horas y bloquea otro durante 24 h',rb().textContent.includes('17:00')&&rb().textContent.includes('Próximo descanso largo en'));
    await click('[data-act="relabrir"]');
    setv('#rel-d','1');setv('#rel-h','2');
    await click('[data-act="relsum"]');
    ok('sumar 1 día y 2 horas de viaje',rb().textContent.includes('22 de Ches, 1491 DR')&&rb().textContent.includes('19:00'));
    await click('[data-act="relclima"]');
    ok('se sortea un clima de la estación',(JSON.parse(Store.get('camp-reloj-v1')).clima||'').length>0);
    mod().hidden=true;
    // fin de sesión con días transcurridos
    await click('[data-act="sesstart"]');await click('[data-act="sesgo"]');await click('[data-act="sesend"]');
    ok('al finalizar la sesión pregunta los días transcurridos',!!document.getElementById('ses-dias'));
    setv('#ses-dias','3');await click('[data-act="sesfin"]');
    ok('los días de la sesión se suman al reloj',rb().textContent.includes('25 de Ches, 1491 DR'));
    // diario
    location.hash='#personajes/c1';await wait(500);
    ok('la ficha de campaña tiene su diario',!!document.querySelector('.pjdia'));
    await click('[data-act="diaadd"]');
    setv('.diacap [data-dia="t"]','Infancia');setv('.diacap [data-dia="x"]','Creció en Aguas Profundas.');await wait(100);
    const dia=JSON.parse(Store.get('camp-diarios-v1')||'{}').c1;
    ok('el capítulo queda guardado en el diario',dia&&dia.cap.length===1&&dia.cap[0].t==='Infancia'&&dia.cap[0].x.startsWith('Creció'));
    ok('el diario se prepara para sincronizar',!!scSnapshot()['dia:c1']);
    // inventario desde el compendio
    await wait(800);
    setv('#pji-c','Anillo de estrellas fugaces');await click('[data-act="pjinvcomp"]');
    const it=F().inventario.find(i=>i.n==='Anillo de estrellas fugaces');
    ok('el objeto del compendio entra sintonizable y con 6 usos',it&&it.sint&&it.uso===6);
    await click('[data-act="pjinvuso"]');
    ok('usar gasta una carga',F().inventario.find(i=>i.n==='Anillo de estrellas fugaces').ug===1);
    setv('#pji-c','Munición +1, +2 o +3');await click('[data-act="pjinvcomp"]');
    ok('la munición se marca como tal',F().inventario.some(i=>i.mun));
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+(e.stack||'').split('\\n')[1]);}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__reloj.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('reloj de campaña, diario del personaje e inventario del compendio',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-rel-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__reloj.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=14,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
