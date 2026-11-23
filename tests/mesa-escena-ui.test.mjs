// La ventana de la mesa pinta escenas: capas colocadas en %, datos en vivo de iniciativa y cuentas, y vuelta a las vistas de siempre.
// Necesita Edge o Chrome (variable BROWSER para indicar otro); si no hay ninguno, el test se salta.
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFileSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
import {execFile} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {ROOT,testNav} from './lib.mjs';

const BROWSERS=[process.env.BROWSER,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome','/usr/bin/chromium','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const BROWSER=BROWSERS.find(b=>existsSync(b));
const MESA=readFileSync(path.join(ROOT,'desktop','mesa.html'),'utf8');

const STUB=`<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));
window.__cb=null;window.__Mesa={onMostrar:cb=>{window.__cb=cb;},listo:()=>{},pantallaCompleta:()=>{}};</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  const until=async(c,ms=3000)=>{for(let x=0;x<ms;x+=50){if(c())return true;await wait(50);}return false;};
  const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const q=s=>document.querySelector(s);
  try{
    await wait(300);
    ok('la página registra su receptor',typeof __cb==='function');
    __cb({tipo:'iniciativa',abrir:false,activo:true,ronda:2,lista:[{n:'Lyra',actual:true,caido:false,color:'#3b82f6'},{n:'Goblin 1',actual:false,caido:false,color:'#d0453c'}],cuenta:null});
    await wait(100);
    ok('la iniciativa sin capa en pantalla no se enseña',q('#ini').style.display!=='flex'&&!q('#lienzo'));
    __cb({tipo:'escena',nombre:'Taberna',fondo:'#102030',fundido:0,capas:[
      {tipo:'imagen',id:'a',x:5,y:10,w:60,h:80,visible:true,op:1,src:PNG,ajuste:'contener',titulo:'Mapa',marco:true},
      {tipo:'texto',id:'b',x:5,y:2,w:60,h:8,visible:true,op:1,t:'La taberna',tam:5,color:'#ffffff',fondo:'',alin:'centro',fuente:'serif',negrita:true},
      {tipo:'iniciativa',id:'c',x:70,y:10,w:25,h:60,visible:true,op:1},
      {tipo:'cuentas',id:'d',x:70,y:75,w:25,h:20,visible:true,op:1},
      {tipo:'texto',id:'e',x:0,y:0,w:10,h:10,visible:false,op:1,t:'oculta',tam:5,color:'#fff',fondo:'',alin:'centro',fuente:'sans',negrita:false}]});
    ok('la escena aparece',await until(()=>q('#lienzo')&&q('#esc').style.display==='flex'));
    ok('las capas llevan su posición y tamaño en porcentaje',(c=>c&&c.style.left==='5%'&&c.style.top==='10%'&&c.style.width==='60%'&&c.style.height==='80%')(q('.capa[data-id="a"]')));
    ok('una capa oculta no se pinta',!q('.capa[data-id="e"]'));
    ok('el texto va tal cual, sin interpretarse',q('.capa[data-id="b"]').textContent==='La taberna');
    ok('la iniciativa dentro de la escena usa los últimos datos',q('.capa.iniciativa').textContent.includes('Lyra')&&q('.capa.iniciativa').textContent.includes('Ronda 2'));
    __cb({tipo:'iniciativa',abrir:false,activo:true,ronda:3,lista:[{n:'Goblin 1',actual:true,caido:false,color:'#d0453c'}],cuenta:null});
    await wait(100);
    ok('un cambio de iniciativa actualiza la capa sin cambiar de vista',q('.capa.iniciativa').textContent.includes('Ronda 3')&&q('#esc').style.display==='flex');
    __cb({tipo:'cuentas',lista:[{n:'Antorcha',seg:125,pausa:false,fin:false}]});
    await wait(100);
    ok('las cuentas atrás van a su capa y la esquina se oculta',q('.capa.cuentas').textContent.includes('02:05')&&getComputedStyle(q('#cuentas')).display==='none');
    __cb({tipo:'escena',nombre:'Otra',fondo:'#000000',fundido:0,capas:[{tipo:'texto',id:'z',x:0,y:0,w:100,h:100,visible:true,op:1,t:'Solo texto',tam:8,color:'#fff',fondo:'',alin:'centro',fuente:'sans',negrita:false}]});
    ok('sin capa de cuentas, la esquina vuelve',await until(()=>q('.capa[data-id="z"]')&&getComputedStyle(q('#cuentas')).display!=='none'));
    ok('al cambiar de escena solo queda un lienzo',await until(()=>document.querySelectorAll('#lienzo').length===1));
    __cb({tipo:'iniciativa',abrir:true,activo:true,ronda:1,lista:[{n:'Lyra',actual:true,caido:false,color:'#3b82f6'}],cuenta:null});
    await until(()=>q('.capa.iniciativa'));
    ok('«mostrar el orden» sustituye a la escena por una con su capa de iniciativa',!!q('.capa.iniciativa .fl')&&document.querySelectorAll('#lienzo').length===1&&q('#ini').style.display!=='flex');
    __cb({tipo:'escena',nombre:'Otra vez',fondo:'#000000',fundido:0,capas:[]});
    await until(()=>q('#lienzo'));
    __cb({tipo:'limpiar'});
    await wait(100);
    ok('limpiar quita la escena',!q('#lienzo')&&q('#nada').style.display==='grid');
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+String(e.stack).slice(0,200));}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    if(new URL(q.url,'http://x').pathname==='/__mesa.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(MESA.replace('<head>','<head>'+STUB).replace('</body>',TAIL+'</body>'));}
    r.writeHead(404);r.end();
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('mesa: pinta escenas con capas, datos en vivo y vuelve a las vistas de siempre',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-mesa-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=30000','--dump-dom',`http://127.0.0.1:${port}/__mesa.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=13,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
