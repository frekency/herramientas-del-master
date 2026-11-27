// Linaje de la especie (goliat: ascendencia gigante) en la hoja del personaje, en el navegador: solo se muestra, se elige en el creador.
// Necesita Edge o Chrome (variable BROWSER para indicar otro); si no hay ninguno, el test se salta.
import {assert,http,MANUAL_JS,readFileSync,existsSync,mkdtempSync,rmSync,execFile,os,path,ROOT,PAGE,testNav} from './creador-lib.mjs';

const BROWSERS=[process.env.BROWSER,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome','/usr/bin/chromium','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const BROWSER=BROWSERS.find(b=>existsSync(b));

const head=`<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));addEventListener('unhandledrejection',e=>__err.push(String(e.reason)));localStorage.clear();</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  const click=async s=>{const b=q(s);if(!b)throw new Error('no hay '+s);b.click();await wait(150);};
  try{
    await wait(1500);
    ${MANUAL_JS}
    document.querySelectorAll('dialog[open]').forEach(d=>{try{d.close();}catch{}});document.body.classList.remove('modal-open');
    if(!pjCargado)pjLoad();
    const esp=compFind('especies','Goliat'),nv=n=>Array.from({length:n},(_,i)=>({c:'guerrero',hp:i?6:10}));
    const car={fue:15,des:12,con:14,int:10,sab:10,car:10};
    PJ.push(Ficha.sincEspecie(Ficha.norm({id:'g1',nombre:'Grog',especie:'Goliat',car,niveles:nv(5),origen:'libre',lin:{v:{linaje:'frio_de_la_escarcha'},insp:false}}),esp));
    PJ.push(Ficha.sincEspecie(Ficha.norm({id:'m1',nombre:'Pipo',especie:'Mediano',car,niveles:nv(1),origen:'libre'}),compFind('especies','Mediano')));pjSave();
    location.hash='#personajes/g1';await wait(800);
    await click('[data-act="pjtab"][data-t="rasgos"]');
    const g=PJ.find(x=>x.id==='g1');
    ok('la cabecera del goliat lleva la ascendencia elegida en el creador y no hay bloque de especie en Rasgos',q('.pjorg').textContent.includes('Goliat (Frío de la escarcha)')&&!q('.pjesp'));
    ok('la hoja no ofrece elegir ni cambiar nada de la especie (ni botón de aviso)',qa('[data-act="pjlin"]').length===0&&!q('.pjelige-esp'));
    ok('tiene su recurso con usos = competencia (3 en nivel 5) y su rasgo enlazado, más Forma grande',(r=>!!r&&r.max===3&&r.rec==='largo'&&g.rasgos.some(x=>x.n==='Linaje gigante: Frío de la escarcha'&&x.r===r.id))(g.recursos.find(r=>r.n==='Frío de la escarcha'))&&g.recursos.some(r=>r.n==='Forma grande'));
    PJROL='dm';pjRender();await click('[data-act="pjtab"][data-t="rasgos"]');
    ok('ni el máster ve forma de cambiarla (como la subclase)',qa('[data-act="pjlin"]').length===0&&!q('.pjesp'));
    location.hash='#personajes/m1';await wait(600);
    await click('[data-act="pjtab"][data-t="rasgos"]');
    ok('una especie sin elecciones (mediano) no muestra bloque de elección pero sí sus rasgos',!q('.pjesp')&&PJ.find(x=>x.id==='m1').rasgos.map(r=>r.n).includes('Fortuna'));
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+(e.stack||'').split('\\n')[1]);}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__especie.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('la hoja muestra el linaje elegido en el creador y no deja cambiarlo',{manual:true,skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-esp-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=40000','--dump-dom',`http://127.0.0.1:${port}/__especie.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=5,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
