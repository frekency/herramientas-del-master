// Permisos y cambios propuestos en la hoja de personaje, en el navegador: el jugador propone, el máster acepta y los bloqueos se respetan.
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

const STORE={'camp-notes-v1':{v:1,items:[{id:'s1',tipo:'sesion',nombre:'La cripta',campos:{estado:'planeada'}}]},'camp-fichas-v1':[{v:1,id:'c1',nombre:'Lyra',origen:'campana',campana:'local',car:{fue:8,des:14,con:14,int:16,sab:10,car:10},niveles:[{c:'mago',hp:6}]}]};
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
    document.querySelector('[data-act="openio"]').click();await wait(200);
    const m=document.getElementById('iomodal');
    ok('la ventana de copias ofrece descargar y restaurar',!m.hidden&&!!m.querySelector('[data-act="bkdl"]')&&!!document.getElementById('bk-file'));
    ok('en el navegador la copia automática se ve, pero bloqueada',!document.getElementById('bk-solo').hidden&&[...document.getElementById('bk-auto').querySelectorAll('button,input')].every(e=>e.disabled));
    // el texto de la copia lleva lo de la persona y no sus secretos
    localStorage.setItem('sb-abc-auth-token','secreto');
    const t=bkTexto(),r=Copia.leer(t);
    ok('la copia lleva las fichas y las notas y deja fuera la sesión de cuenta',r.ok&&!t.includes('secreto')&&'camp-fichas-v1' in r.datos&&JSON.parse(r.datos['camp-notes-v1']).items.length===1);
    // elegir un archivo muestra su resumen
    const dt=new DataTransfer();dt.items.add(new File([t],'copia.json',{type:'application/json'}));
    const inp=document.getElementById('bk-file');inp.files=dt.files;inp.dispatchEvent(new Event('change',{bubbles:true}));await new Response(dt.files[0]).text();await wait(400);
    ok('el archivo elegido se resume antes de restaurar',!!document.querySelector('#bk-res [data-act="bkrestore"]')&&document.getElementById('bk-res').textContent.includes('Mi campaña'));
    // restaurar sobre datos cambiados los devuelve (se llama al almacén sin recargar la página)
    Store.set('camp-notes-v1',JSON.stringify({v:1,items:[]}));
    const n=Store.restore(r.datos,r.campanas);
    ok('restaurar recupera lo guardado',n>0&&JSON.parse(Store.get('camp-notes-v1')).items.length===1);
    // enlaces de audio
    document.querySelector('[data-act="closeio"]').click();
    document.querySelector('[data-act="audopen"]').click();await wait(100);
    document.getElementById('aud-url').value='youtube.com/watch?v=abc';document.getElementById('aud-nom').value='Taberna';
    document.querySelector('[data-act="audadd"]').click();
    document.getElementById('aud-url').value='javascript:alert(1)';document.querySelector('[data-act="audadd"]').click();
    const lk=[...document.querySelectorAll('#aud-lista a')];
    ok('el enlace se guarda con https y se abre fuera',lk.length===1&&lk[0].href==='https://youtube.com/watch?v=abc'&&lk[0].target==='_blank'&&lk[0].rel.includes('noopener')&&lk[0].textContent.includes('Taberna'));
    ok('un enlace que no es web se rechaza',audCarga().length===1);
    ok('los enlaces viajan en la copia',Copia.leer(bkTexto()).datos['audio-links-v1'].includes('youtube.com'));
    document.querySelector('[data-act="audquitar"]').click();
    ok('se puede quitar un enlace',audCarga().length===0);
    document.querySelector('[data-act="audclose"]').click();
    // un archivo que no es una copia se rechaza
    const dt2=new DataTransfer();dt2.items.add(new File(['hola'],'x.json'));inp.files=dt2.files;inp.dispatchEvent(new Event('change',{bubbles:true}));await new Response(dt2.files[0]).text();await wait(300);
    ok('un archivo que no es una copia no ofrece restaurar',!document.querySelector('#bk-res [data-act="bkrestore"]'));
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+(e.stack||'').split('\\n')[1]);}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__copia.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

test('copia completa: descargar, elegir archivo y restaurar',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-bk-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__copia.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=10,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
