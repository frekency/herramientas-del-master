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
window.claude={};localStorage.clear();for(const[k,v]of Object.entries(${JSON.stringify(STORE)}))localStorage.setItem(k,JSON.stringify(v));</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  const body=()=>document.getElementById('pj-body'),F=()=>PJC.find(x=>x.id==='c1');
  const rol=async v=>{const s=document.getElementById('pj-rol');s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}));await wait(150);};
  const click=async sel=>{const b=document.querySelector(sel);if(!b)throw new Error('no hay '+sel);b.click();await wait(150);};
  const typeIn=async(sel,v)=>{const i=document.querySelector(sel);if(!i)throw new Error('no hay '+sel);i.value=v;i.dispatchEvent(new Event('change',{bubbles:true}));await wait(150);};
  try{
    await wait(1200);
    const calls=[];let sesion=null,respuesta={};
    SB={auth:{
      signInWithPassword:async a=>{calls.push(['in',a.email,a.password]);return respuesta.in||{data:{},error:null};},
      signUp:async a=>{calls.push(['up',a.email,a.options.data.usuario]);return respuesta.up||{data:{session:null,user:{identities:[{}]}},error:null};},
      resetPasswordForEmail:async e=>{calls.push(['rs',e]);return {error:null};},
      updateUser:async a=>{calls.push(['np',a.password]);return {error:null};}},
      rpc:async()=>({data:true}),from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null})})})})};
    const rellena=(id,v)=>{document.getElementById(id).value=v;};
    const envia=async pane=>{document.querySelector('#acctmodal form[data-pane="'+pane+'"]').requestSubmit();await wait(250);};
    const visible=()=>[...document.querySelectorAll('#acctmodal [data-pane]')].filter(e=>!e.hidden).map(e=>e.dataset.pane)[0];
    const msg=()=>document.getElementById('ac-msg').textContent;
    document.getElementById('acct-btn').hidden=false;
    document.querySelector('[data-act="acopen"]').click();await wait(150);
    ok('al abrir la cuenta se ve el formulario de correo y contraseña',visible()==='in'&&!!document.getElementById('ac-in-mail')&&!!document.querySelector('[data-act="acdiscord"]'));
    // entrar
    rellena('ac-in-mail','ana@ejemplo.com');rellena('ac-in-pass','secreta123');await envia('in');
    ok('entrar llama a signInWithPassword con lo escrito',calls.some(c=>c[0]==='in'&&c[1]==='ana@ejemplo.com'&&c[2]==='secreta123')&&document.getElementById('acctmodal').hidden);
    // credenciales malas
    document.querySelector('[data-act="acopen"]').click();await wait(100);
    respuesta.in={data:{},error:{message:'Invalid login credentials'}};rellena('ac-in-mail','ana@ejemplo.com');rellena('ac-in-pass','mala');await envia('in');
    ok('credenciales incorrectas muestran un aviso claro',msg()==='Correo o contraseña incorrectos'&&visible()==='in');
    // crear cuenta
    document.querySelector('[data-act="acgo"][data-to="signup"]').click();await wait(100);
    ok('se puede pasar a crear una cuenta',visible()==='signup');
    rellena('ac-su-user','Ana_DM');rellena('ac-su-mail','ana@ejemplo.com');rellena('ac-su-pass','secreta123');rellena('ac-su-pass2','otra-distinta');await envia('signup');
    ok('contraseñas distintas no crean la cuenta',msg()==='Las contraseñas no coinciden'&&!calls.some(c=>c[0]==='up'));
    rellena('ac-su-pass2','secreta123');await envia('signup');
    ok('crear cuenta envía correo y nombre de usuario',calls.some(c=>c[0]==='up'&&c[1]==='ana@ejemplo.com'&&c[2]==='Ana_DM'));
    ok('sin sesión inmediata se pide confirmar el correo',visible()==='in'&&msg().startsWith('Te hemos enviado un correo')&&document.getElementById('ac-in-mail').value==='ana@ejemplo.com');
    // correo ya registrado
    document.querySelector('[data-act="acgo"][data-to="signup"]').click();await wait(100);
    respuesta.up={data:{session:null,user:{identities:[]}},error:null};
    rellena('ac-su-user','Ana_DM');rellena('ac-su-mail','ana@ejemplo.com');rellena('ac-su-pass','secreta123');rellena('ac-su-pass2','secreta123');await envia('signup');
    ok('un correo ya registrado se avisa',msg()==='Ese correo ya tiene una cuenta');
    // contraseña olvidada
    document.querySelector('[data-act="acgo"][data-to="in"]').click();await wait(100);
    document.querySelector('[data-act="acgo"][data-to="reset"]').click();await wait(100);
    rellena('ac-rs-mail','ana@ejemplo.com');await envia('reset');
    ok('recuperar contraseña envía el enlace y no revela si existe la cuenta',calls.some(c=>c[0]==='rs'&&c[1]==='ana@ejemplo.com')&&visible()==='in'&&msg().startsWith('Si ese correo tiene cuenta'));
    // contraseña nueva (llegada desde el enlace del correo)
    acOpen('newpass');await wait(100);
    rellena('ac-np-pass','nueva-clave-1');rellena('ac-np-pass2','nueva-clave-2');await envia('newpass');
    ok('la contraseña nueva debe repetirse igual',!calls.some(c=>c[0]==='np')&&msg()==='Las contraseñas no coinciden');
    rellena('ac-np-pass2','nueva-clave-1');await envia('newpass');
    ok('la contraseña nueva se guarda',calls.some(c=>c[0]==='np'&&c[1]==='nueva-clave-1')&&msg()==='Contraseña cambiada');
    // campañas de la cuenta: al iniciar sesión se añaden solas, salvo las que se quitaron a propósito
    SB_USER={id:'u1'};
    SB.from=()=>({select:()=>({eq:()=>({order:async()=>({data:[{id:'11111111-1111-1111-1111-111111111111',nombre:'Faro'},{id:'22222222-2222-2222-2222-222222222222',nombre:'Cripta'}],error:null})})})});
    scSoltar('22222222-2222-2222-2222-222222222222');
    await scRemotas(true);await wait(200);
    const nombres=Store.campaigns.list().map(c=>c.nombre);
    ok('las campañas de la cuenta se añaden solas al iniciar sesión',nombres.includes('Faro')&&Store.campaigns.remote(Store.campaigns.list().find(c=>c.nombre==='Faro').id)==='11111111-1111-1111-1111-111111111111');
    ok('una campaña quitada a propósito no vuelve sola',!nombres.includes('Cripta'));
    await scRemotas(true);await wait(100);
    ok('no se duplican al repetirse',Store.campaigns.list().filter(c=>c.nombre==='Faro').length===1);
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+(e.stack||'').split('\\n')[1]);}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__correo.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

test('inicio de sesión con correo y contraseña: entrar, crear cuenta y recuperar',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-mail-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__correo.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=14,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
