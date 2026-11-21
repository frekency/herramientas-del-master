// Sesiones de campaña en el navegador: barra, iniciar, finalizar y resumen al diario.
// Necesita Edge o Chrome (variable BROWSER para indicar otro); si no hay ninguno, el test se salta.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFileSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
import {execFile} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {ROOT,PAGE} from './lib.mjs';

const BROWSERS=[process.env.BROWSER,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome','/usr/bin/chromium','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const BROWSER=BROWSERS.find(b=>existsSync(b));

const STORE={'camp-notes-v1':{v:1,items:[{id:'s1',tipo:'sesion',nombre:'La mina',campos:{estado:'planeada',fecha:'2026-11-20'}}]},'camp-fichas-v1':[{v:1,id:'c1',nombre:'Lyra',origen:'campana',campana:'local',car:{fue:8,des:14,con:14,int:16,sab:10,car:10},niveles:[{c:'mago',hp:6}]}]};
const head=`<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));addEventListener('unhandledrejection',e=>__err.push(String(e.reason)));
localStorage.clear();for(const[k,v]of Object.entries(${JSON.stringify(STORE)}))localStorage.setItem(k,JSON.stringify(v));</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  const body=()=>document.getElementById('pj-body'),F=()=>PJC.find(x=>x.id==='c1');
  const rol=async v=>{const s=document.getElementById('pj-rol');s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}));await wait(150);};
  const click=async sel=>{const b=document.querySelector(sel);if(!b)throw new Error('no hay '+sel);b.click();await wait(150);};
  const typeIn=async(sel,v)=>{const i=document.querySelector(sel);if(!i)throw new Error('no hay '+sel);i.value=v;i.dispatchEvent(new Event('change',{bubbles:true}));await wait(150);};
  try{
    await wait(1200);
    const bar=()=>document.getElementById('sesbar'),mod=()=>document.getElementById('sesmodal'),notas=()=>JSON.parse(Store.get('camp-notes-v1')||'{"items":[]}').items;
    ok('sin sesión: la barra lo dice y ofrece iniciar',!bar().hidden&&!!bar().querySelector('[data-act="sesstart"]'));
    location.hash='#combate';await wait(300);
    const main=document.querySelector('main.wrap');
    ok('el combate se puede usar sin sesión activa',!main.inert&&!document.getElementById('sesgate'));
    location.hash='#inicio';await wait(200);
    ok('lo demás sigue libre',!main.inert);
    location.hash='#combate';await wait(200);
    await click('[data-act="sesstart"]');
    ok('la ventana ofrece la sesión planeada',!mod().hidden&&[...document.querySelectorAll('#ses-sel option')].some(o=>o.textContent.includes('La mina')));
    await click('[data-act="sesgo"]');
    ok('se inicia y la barra la enseña en curso con su plan',mod().hidden&&bar().classList.contains('on')&&bar().textContent.includes('La mina')&&!!bar().querySelector('a[href^="#campana/sesion/"]'));
    ok('queda guardada en curso',notas().find(n=>n.nombre==='La mina').campos.estado==='en curso');
    // la barra se ve en cualquier página
    location.hash='#combate';await wait(300);
    ok('con la sesión en curso el combate se abre',!bar().hidden&&bar().classList.contains('on')&&!main.inert);
    // finalizar con resumen
    await click('[data-act="sesend"]');
    ok('la ventana de finalizar pide un resumen opcional',!mod().hidden&&!!document.getElementById('ses-res')&&!!document.getElementById('ses-pub'));
    document.getElementById('ses-res').value='Bajaron a la mina y hallaron un cofre.';document.getElementById('ses-pub').checked=true;
    await click('[data-act="sesfin"]');
    const ns=notas(),d=ns.find(n=>n.tipo==='diario');
    ok('la sesión queda jugada',ns.find(n=>n.nombre==='La mina').campos.estado==='jugada');
    ok('el resumen va al diario, compartido',!!d&&d.texto.startsWith('Bajaron')&&d.visibilidad==='jugadores'&&d.campos.sesion==='La mina');
    ok('la barra vuelve a ofrecer iniciar',!bar().classList.contains('on')&&!!bar().querySelector('[data-act="sesstart"]'));
    // calendario de sesiones
    location.hash='#campana/sesion';await wait(400);
    const cal=document.getElementById('cp-cal');
    ok('el calendario se ve en Sesiones y marca la jugada',!cal.hidden&&!!cal.querySelector('.cpcd i.jugada'));
    const antes=notas().filter(n=>n.tipo==='sesion').length,hoyF=Notas.fechaDe(Date.now()),vacio=[...cal.querySelectorAll('.cpcd:not(.fuera)')].find(b=>!b.querySelector('i'));
    vacio.click();await wait(300);
    ok('pulsar un día vacío planea una sesión ese día',notas().filter(n=>n.tipo==='sesion').length===antes+1&&notas().some(n=>n.campos.fecha===vacio.dataset.f&&n.campos.estado==='planeada'));
    // la de hoy se inicia desde la barra
    const hoy=Notas.nuevo('sesion','La de hoy');hoy.campos.fecha=hoyF;CP.push(hoy);cpDirty=true;cpFlush();await wait(200);
    ok('con una sesión para hoy, la barra dice «Hoy toca» y la inicia directamente',!!bar().querySelector('[data-act="seshoy"]'));
    await click('[data-act="seshoy"]');
    ok('la de hoy queda en curso',notas().find(n=>n.nombre==='La de hoy').campos.estado==='en curso');
    await click('[data-act="sesend"]');document.getElementById('ses-next').value='2030-01-05';await click('[data-act="sesfin"]');
    ok('al finalizar se planea la próxima en su fecha',notas().some(n=>n.campos.fecha==='2030-01-05'&&n.campos.estado==='planeada'));
    // nueva sesión sin plan y finalizar sin resumen
    await click('[data-act="sesstart"]');
    ok('hay planeadas del calendario: se puede elegir o crear nueva',!!document.getElementById('ses-sel'));
    {const sl=document.getElementById('ses-sel');sl.value='';sl.dispatchEvent(new Event('change',{bubbles:true}));}
    document.getElementById('ses-nom').value='Epílogo';await click('[data-act="sesgo"]');
    ok('la nueva arranca en curso',notas().some(n=>n.nombre==='Epílogo'&&n.campos.estado==='en curso'));
    await click('[data-act="sesend"]');await click('[data-act="sesfin"]');
    ok('finalizar sin resumen no añade al diario',notas().filter(n=>n.tipo==='diario').length===1&&notas().find(n=>n.nombre==='Epílogo').campos.estado==='jugada');
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+(e.stack||'').split('\\n')[1]);}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__sesiones.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

test('sesiones: se activa la que toca y se finaliza con resumen para el diario',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-ses-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__sesiones.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=19,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
