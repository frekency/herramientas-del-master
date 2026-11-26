// Ficha completa en el navegador: habilidades, ataques, rasgos con usos, magia, listas, personalidad y permisos.
// Necesita Edge o Chrome (variable BROWSER para indicar otro); si no hay ninguno, el test se salta.
import {test} from 'node:test';
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

const STORE={'camp-fichas-v1':[{v:1,id:'c1',nombre:'Lyra',origen:'campana',campana:'local',car:{fue:8,des:14,con:14,int:16,sab:10,car:10},niveles:[{c:'mago',hp:6}]}]};
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
    location.hash='#personajes/c1';await wait(500);
    const sel=async(s,v)=>{const e=document.querySelector(s);if(!e)throw new Error('no hay '+s);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));await wait(150);};
    const chk=async(s,v)=>{const e=document.querySelector(s);if(!e)throw new Error('no hay '+s);e.checked=v;e.dispatchEvent(new Event('change',{bubbles:true}));await wait(150);};
    ok('la hoja pinta los apartados nuevos',['hab','atq','ras','def','otr','per'].every(k=>!!body().querySelector('[data-pjdet="'+k+'"]')));
    // habilidades
    await sel('[data-pjsk="arcanos"]','2');
    ok('pericia en Arcanos: +2 competencia x2 + INT 3',F().habil.arcanos===2&&Ficha.habBonus(F(),'arcanos')===3+4);
    await chk('[data-pjsv="con"]',true);
    ok('salvación de CON competente',F().salvac.includes('con'));
    // ataques
    document.getElementById('pja-n').value='Daga';document.getElementById('pja-b').value='5';document.getElementById('pja-d').value='1d4+2';document.getElementById('pja-t').value='perforante';
    await click('[data-act="pjatqadd"]');
    ok('ataque añadido con sus botones de tirada',F().ataques.length===1&&!!body().querySelector('[data-pjdet="atq"] [data-roll="hit"]')&&!!body().querySelector('[data-pjdet="atq"] [data-roll="dmg"]'));
    // rasgos con usos
    ok('el registro de cambios está en la pestaña del máster y no en Notas',/Registro de cambios/.test(document.querySelector('.pjpan[data-p="dm"]').textContent)&&!/Registro de cambios/.test(document.querySelector('.pjpan[data-p="notas"]').textContent));
    ok('el máster tiene la pestaña Configuración DM con los formularios de rasgos y recursos',!!document.querySelector('.pjtab[data-t="dm"]')&&!!document.querySelector('.pjpan[data-p="dm"] #pjg-n')&&!!document.querySelector('.pjpan[data-p="dm"] #pjr-n'));
    document.getElementById('pjg-n').value='Recuperación arcana';document.getElementById('pjg-m').value='1';document.getElementById('pjg-t').value='Recupera espacios. **Una vez** al día.';
    await click('[data-act="pjrasadd"]');
    ok('rasgo con usos: crea el recurso y muestra su casilla',F().rasgos.length===1&&F().recursos.length===1&&!!body().querySelector('[data-pjdet="ras"] [data-act="pjrec"]'));
    // listas libres
    document.getElementById('pjl-defensas-res').value='Fuego';await click('[data-act="pjlistadd"][data-k="res"]');
    document.getElementById('pjl-otras-idiomas').value='Élfico';await click('[data-act="pjlistadd"][data-k="idiomas"]');
    ok('resistencia e idioma',F().defensas.res[0]==='Fuego'&&F().otras.idiomas[0]==='Élfico');
    // personalidad
    await typeIn('[data-pjf="pers.historia"]','Nació en un faro.');
    ok('historia',F().pers.historia==='Nació en un faro.');
    // magia
    document.getElementById('pj-spin').value='Escudo';await click('[data-act="pjspadd"]');
    await sel('[data-pjsplv]','1');await chk('[data-pjspprep]',true);
    ok('conjuro con nivel y preparado',F().conjuros.length===1&&F().magia.niv[F().conjuros[0]]===1&&F().magia.prep.length===1);
    await sel('[data-pjf="magia.hab"]','sab');
    ok('característica de lanzamiento',Ficha.magia(F()).hab==='sab'&&body().textContent.includes('CD '+Ficha.magia(F()).cd));
    // los apartados abiertos se recuerdan al repintar
    const d=body().querySelector('[data-pjdet="def"]');d.open=true;d.dispatchEvent(new Event('toggle'));await wait(100);await typeIn('[data-pjf="pers.edad"]','30');
    ok('el apartado abierto sigue abierto',!!body().querySelector('[data-pjdet="def"][open]'));
    // la ficha del combate lleva lo nuevo
    const c=Ficha.comoCombatiente(F());
    ok('el combate recibe habilidades, ataque y defensas',c.sk.startsWith('Arcanos')&&c.a.length===1&&c.re==='Fuego'&&c.la==='Élfico');
    // jugador: el apartado bloqueado no se toca, el de aprobación queda pendiente
    await rol('jugador');
    ok('el jugador no ve el registro de cambios',!/Registro de cambios/.test(document.getElementById('pj-body').textContent));
    ok('el jugador no tiene la pestaña ni los formularios del máster en la página',!document.querySelector('.pjtab[data-t="dm"]')&&!document.querySelector('[data-p="dm"]')&&!document.getElementById('pjg-n')&&!document.getElementById('pjr-n')&&!document.querySelector('[data-act="pjrasdel"],[data-act="pjrecdel"]'));
    await sel('[data-pjsk="sigilo"]','1');
    ok('jugador: habilidades bloqueadas',!F().habil.sigilo&&F().pendientes.length===0);
    document.getElementById('pja-n').value='Arco';await click('[data-act="pjatqadd"]');
    ok('jugador: el ataque queda pendiente',F().ataques.length===1&&F().pendientes.length===1);
    await rol('dm');
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+(e.stack||'').split('\\n')[1]);}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__fichacompleta.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('la ficha completa se rellena desde la hoja',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-fc-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__fichacompleta.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=13,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
