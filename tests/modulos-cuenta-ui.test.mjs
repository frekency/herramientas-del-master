// Módulos en la cuenta (Supabase): lo que se sube desde un dispositivo lo baja el otro tal cual (con ilustraciones), lo que se quita se quita
// en la nube y el dispositivo que vigila la marca de versión baja los cambios. Supabase se simula con una tabla en memoria.
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

const head=`<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));addEventListener('unhandledrejection',e=>__err.push(String(e.reason)));localStorage.clear();</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  try{
    await wait(4000);   // que el cliente real de Supabase termine su arranque antes de sustituirlo
    const toasts=[];toast=m=>{toasts.push(String(m).slice(0,160));};tokGuardar=async()=>true;   // el almacén de imágenes del navegador no es lo que se prueba aquí (bajo tiempo virtual se atasca)
    const libre=async()=>{SB_USER={id:'u1'};MDB.listo=true;   // el cliente real de Supabase del arranque puede vaciar la sesión a destiempo
      for(let i=0;i<60&&(MDB.ocupado||MDB.t);i++)await wait(100);};
    const tabla=new Map(),copia=v=>JSON.parse(JSON.stringify(v));
    const inerte={};for(const k of ['select','eq','order','gt','not','in','insert','update','upsert','delete','limit','single','maybeSingle'])inerte[k]=()=>inerte;inerte.then=r=>r({data:[],error:null});
    SB={from:nombre=>{if(nombre!=='modulos_usuario')return inerte;const q={_eq:null};
      q.select=()=>q;q.limit=async()=>({data:[...tabla].map(([clave,valor])=>({clave,valor:copia(valor)})),error:null});
      q.eq=(c,v)=>{q._eq=v;return q;};q.maybeSingle=async()=>({data:tabla.has(q._eq)?{valor:copia(tabla.get(q._eq))}:null,error:null});
      q.upsert=async row=>{tabla.set(row.clave,copia(row.valor));return {error:null};};
      q.delete=()=>({in:async(c,claves)=>{for(const k of claves)tabla.delete(k);return {error:null};}});
      return q;}};
    clearInterval(MDB.vig);SB_USER={id:'u1'};MDB.listo=true;MDB.hash={};
    const modulo=JSON.stringify({libro:'Libro de prueba',abrev:'LDP',criaturas:[{n:'Orco de prueba',en:'Test Orc',sz:'Medium',ty:'Humanoid',al:'caótico malvado',cr:'1',ac:13,hp:15,hd:'2d8+6',sp:'9 m',in:7,ab:[16,12,16,7,11,10],sv:[3,1,3,-2,0,0],pp:10,t:[],a:[['Hacha','Ataque cuerpo a cuerpo: +5, 1d12+3']],tok:'data:image/png;base64,AAAA'}],
      dotes:[{n:'Dote de prueba',cat:'General',req:'',d:'<p>Texto</p>',pg:'10',img:'data:image/png;base64,BBBB'}]});
    importModule(modulo,'libro-de-prueba.json','');
    await wait(300);clearTimeout(MDB.t);MDB.t=null;
    await libre();await mdbSubir();
    const claves=[...tabla.keys()];
    ok('se suben cfg, meta y un trozo por tipo',claves.includes('cfg')&&claves.some(k=>/\\.meta$/.test(k))&&claves.some(k=>/\\.criaturas\\.0$/.test(k))&&claves.some(k=>/\\.dotes\\.0$/.test(k)));
    ok('la marca de versión (v) va en cfg',typeof tabla.get('cfg').v==='number');
    const txt=JSON.stringify([...tabla.values()]);
    ok('las ilustraciones suben dentro de las fichas',txt.includes('AAAA')&&txt.includes('BBBB'));
    // otro dispositivo: sin nada local
    Store.root.remove(MKEY);Store.root.remove('combat-mdb-union-v1');MODS=null;TOKC.clear();MDB.hash={};MDB.v=0;
    await libre();await mdbBajar();
    const md=mods().list.find(m=>m.n==='Libro de prueba'||m.ab==='LDP');
    ok('el otro dispositivo recibe el módulo',!!md&&md.criaturas.length===1&&md.dotes.length===1);
    ok('con sus ilustraciones',!!md&&TOKC.get(tokKey(md,md.criaturas[0]))==='data:image/png;base64,AAAA'&&TOKC.get(imgKey(md,'dotes',md.dotes[0]))==='data:image/png;base64,BBBB');
    ok('sin cambios no se vuelve a subir nada',await (async()=>{const antes=JSON.stringify([...tabla]);await libre();await mdbSubir();return JSON.stringify([...tabla])===antes;})());
    // se quita el módulo en un dispositivo: desaparece de la nube
    mods().list.length=0;saveMods();clearTimeout(MDB.t);MDB.t=null;
    await libre();await mdbSubir();
    ok('al quitarlo solo queda cfg en la nube',[...tabla.keys()].join()==='cfg'&&tabla.get('cfg').orden.length===0);
    // el otro dispositivo vigila la marca y baja el cambio
    const v0=tabla.get('cfg').v;
    tabla.set('cfg',{...tabla.get('cfg'),v:v0+5,on:{}});
    MDB.v=v0;await libre();await mdbVigila();
    ok('el dispositivo que vigila baja el cambio',MDB.v===v0+5&&mods().list.length===0);
    // un módulo local que la nube no tiene no se pierde la primera vez que el dispositivo se une
    Store.root.remove('combat-mdb-union-v1');
    importModule(modulo,'libro-de-prueba.json','');await wait(300);clearTimeout(MDB.t);MDB.t=null;
    tabla.clear();MDB.hash={};MDB.v=0;
    tabla.set('cfg',{on:{},orden:[],v:1});
    await libre();await mdbBajar();for(let i=0;i<80&&![...tabla.keys()].some(k=>/\.dotes\.0$/.test(k));i++){SB_USER={id:'u1'};await wait(100);}
    R.diag=JSON.stringify({n:mods().list.length,keys:[...tabla.keys()],ocupado:MDB.ocupado,t:!!MDB.t,listo:MDB.listo,repite:MDB.repite,toasts});
    ok('lo propio se suma y sube en la primera unión',mods().list.length===1&&[...tabla.keys()].some(k=>/\\.dotes\\.0$/.test(k)));
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+String(e.stack).slice(0,300));}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__modcuenta.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('módulos en la cuenta: suben, bajan con ilustraciones, se quitan y se vigilan',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-mdb-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=120000','--dump-dom',`http://127.0.0.1:${port}/__modcuenta.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan '+(R.diag||''));
    assert.ok(R.c.length>=9,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
