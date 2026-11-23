// Asistente de creación de personaje (pasos del Manual del Jugador) en el navegador.
// Necesita Edge o Chrome (variable BROWSER para indicar otro); si no hay ninguno, el test se salta.
import {assert,http,readFileSync,existsSync,mkdtempSync,rmSync,execFile,os,path,ROOT,PAGE,testNav} from './creador-lib.mjs';

const BROWSERS=[process.env.BROWSER,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome','/usr/bin/chromium','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const BROWSER=BROWSERS.find(b=>existsSync(b));

const head=`<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));addEventListener('unhandledrejection',e=>__err.push(String(e.reason)));localStorage.clear();</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  const q=s=>document.querySelector(s),body=()=>document.getElementById('pj-body');
  const click=async s=>{const b=q(s);if(!b)throw new Error('no hay '+s);b.click();await wait(120);};
  const sel=async(s,v)=>{const e=q(s);if(!e)throw new Error('no hay '+s);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));await wait(120);};
  const chk=async(s,v)=>{const e=q(s);if(!e)throw new Error('no hay '+s);e.checked=v;e.dispatchEvent(new Event('change',{bubbles:true}));await wait(120);};
  const sig=()=>q('[data-w="sig"]'),op=(w,v)=>'[data-act="pjw"][data-w="'+w+'"][data-v="'+v+'"]';
  try{
    await wait(1500);
    location.hash='#personajes';await wait(400);
    await click('[data-act="pjnew"]');
    ok('se abre el asistente en el paso 1 con 6 pasos',!!q('.pjw')&&q('.pjw-pasos').children.length===6&&q('[aria-current="step"]').textContent.includes('Clase')&&body().textContent.includes('Origen'));
    ok('no deja avanzar sin clase',sig().disabled);
    await click(op('cls','guerrero'));
    ok('el guerrero pide 2 habilidades y sigue bloqueado',!!q('.pjw-chips input[value="atletismo"]')&&sig().disabled);
    await chk('[data-pjw="sk"][value="atletismo"]',true);await chk('[data-pjw="sk"][value="percepcion"]',true);
    ok('con las 2 elegidas las demás se bloquean y se puede seguir',q('[data-pjw="sk"][value="historia"]').disabled&&!sig().disabled);
    await click('[data-w="sig"]');
    ok('paso 2 Origen: las 9 especies y los 4 trasfondos en la misma pantalla',document.querySelectorAll('[data-w="esp"]').length===9&&document.querySelectorAll('[data-w="tf"]').length===4);
    await click(op('esp','Humano'));
    await click(op('tf','Acólito'));
    ok('el trasfondo pide repartir los puntos y bloquea hasta hacerlo',!!q('[data-pjw="tfa"]')&&sig().disabled);
    await sel('[data-pjw="tfa"][data-i="0"]','sab');await sel('[data-pjw="tfa"][data-i="1"]','sab');
    ok('no se permiten +2 y +1 en la misma característica',sig().disabled);
    await sel('[data-pjw="tfa"][data-i="1"]','car');
    ok('con +2 SAB y +1 CAR ya se puede seguir',!sig().disabled);
    await click('[data-w="sig"]');
    ok('paso 4: sin asignar no avanza',sig().disabled);
    const orden=['fue','con','des','sab','car','int'];
    for(const [i,a] of orden.entries())await sel('[data-pjw="asig"][data-a="'+a+'"]',String(i));
    ok('con los 6 valores asignados avanza y no repite valores',!sig().disabled&&q('[data-pjw="asig"][data-a="des"] option[value="0"]').disabled);
    ok('la tabla suma el trasfondo (SAB 12+2=14, CAR 10+1=11)',q('.pjw-car').textContent.includes('14')&&q('.pjw-car').textContent.includes('11'));
    await click('[data-w="atras"]');await click('[data-w="sig"]');
    ok('atrás y adelante conservan lo asignado',q('[data-pjw="asig"][data-a="fue"]').value==='0');
    await chk('[data-pjw="met"][value="compra"]',true);
    ok('compra de puntos: todo a 8 gasta 0 y deja avanzar',body().textContent.includes('0 / 27')&&!sig().disabled);
    for(let i=0;i<4;i++)await click(op('mas','fue'));
    ok('el coste de compra sube (FUE 12 = 4 puntos)',body().textContent.includes('4 / 27'));
    await chk('[data-pjw="met"][value="std"]',true);
    for(const [i,a] of orden.entries())await sel('[data-pjw="asig"][data-a="'+a+'"]',String(i));
    await click('[data-w="sig"]');
    ok('paso 4 Alineamiento aparte',!!q('[data-pjw="alin"]')&&!q('#pjw-n'));
    await sel('[data-pjw="alin"]','Legal bueno');
    await click('[data-w="sig"]');
    ok('paso 5 Detalles con el nombre',!!q('#pjw-n')&&!q('[data-pjw="alin"]'));
    q('#pjw-n').value='Brenna';q('#pjw-n').dispatchEvent(new Event('input',{bubbles:true}));
    await click('[data-w="sig"]');
    ok('el resumen muestra el origen de cada cosa',body().textContent.includes('trasfondo Acólito')&&body().textContent.includes('clase Guerrero'));
    await click('[data-w="sig"]');
    const f=PJ[PJ.length-1];
    ok('la ficha creada lleva nombre, clase, especie y trasfondo',!!f&&f.nombre==='Brenna'&&f.niveles[0].c==='guerrero'&&f.especie==='Humano'&&f.trasfondo==='Acólito');
    ok('características: reparto + trasfondo',f.car.fue===15&&f.car.con===14&&f.car.des===13&&f.car.sab===14&&f.car.car===11&&f.car.int===8);
    ok('competencias de clase y trasfondo',f.habil.atletismo===1&&f.habil.percepcion===1&&f.habil.perspicacia===1&&f.habil.religion===1);
    ok('salvaciones del guerrero, dote y alineamiento',f.salvac.join()==='fue,con'&&f.dotes.length===1&&f.dotes[0].includes('Iniciado en la magia')&&f.pers.alineamiento==='Legal bueno');
    ok('el registro guarda el desglose',f.registro.length>=8&&f.registro.some(r=>r.d.includes('trasfondo Acólito')));
    ok('se abre la hoja del personaje',location.hash==='#personajes/'+f.id);
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+(e.stack||'').split('\\n')[1]);}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__creador.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('el asistente crea un personaje paso a paso',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-cr-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__creador.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=23,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
