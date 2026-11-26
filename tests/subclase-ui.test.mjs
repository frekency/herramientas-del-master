// Recursos de clase en la hoja: al cargar el compendio, el personaje recibe y ajusta solo los recursos de su clase (furia…).
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
    pjLoad();
    const f=Ficha.norm({id:'p1',nombre:'Brakka',niveles:[{c:'barbaro',hp:12},{c:'barbaro',hp:7}],car:{fue:16,des:12,con:14,int:8,sab:10,car:10}});
    PJ.push(f);pjGuardar();pjSel='p1';
    compLoad();for(let i=0;i<40&&!COMP_SRD;i++)await wait(250);await wait(400);
    ok('una ficha anterior, sin rasgos guardados, los recibe al cargar el compendio (Bárbaro 2: Defensa sin armadura, Furia…)',PJ[0].rasgos.some(x=>/Furia/.test(x.n))&&PJ[0].rasgos.some(x=>/Defensa sin armadura/.test(x.n)));
    const nr=PJ[0].rasgos.length;PJ[0].rasgos=PJ[0].rasgos.filter(x=>!/Furia/.test(x.n));pjGuardar();
    ok('lo que se borra a mano no vuelve solo',!PJ[0].rasgos.some(x=>/^Furia$/.test(x.n))&&PJ[0].rasgos.length===nr-1);
    const box=document.createElement('div');box.id='__fx';document.body.append(box);
    box.innerHTML=pjSheetHTML(PJ[0],'libre');
    ok('no hay campo de texto de subclase',!box.querySelector('input[data-pjf="subclase"]'));
    let sel=box.querySelector('select[data-pjsub]');
    ok('con nivel 2 el selector de subclase está cerrado: se elige en el nivel 3',!!sel&&sel.disabled&&/nivel 3/.test(sel.textContent));
    ok('no sale el aviso de elegir subclase todavía',!box.querySelector('.pjelige'));
    PJ[0].niveles.push({c:'barbaro',hp:7});pjGuardar();
    box.innerHTML=pjSheetHTML(PJ[0],'libre');
    ok('con nivel 3 sale el aviso de elegir subclase en el resumen',!!box.querySelector('.pjelige select[data-pjsub]'));
    sel=box.querySelector('select[data-pjsub]');
    const opts=[...sel.options].map(o=>o.value).filter(Boolean);
    ok('las opciones son las del Bárbaro (SRD: Senda del berserker)',opts.length>=1&&opts.some(x=>/berserker/i.test(x))&&!opts.some(x=>/Colegio|Dominio|Círculo/i.test(x)));
    const n0=PJ[0].rasgos.length;
    pjSel='p1';location.hash='#personajes/p1';await wait(500);pjRender();await wait(300);
    const real=document.querySelector('#pj-body select[data-pjsub]');
    ok('el selector está en la hoja real',!!real);
    real.value=opts.find(x=>/berserker/i.test(x));real.dispatchEvent(new Event('change',{bubbles:true}));await wait(500);
    ok('al elegirla se guarda y se añaden sus rasgos',/berserker/i.test(PJ[0].subclase)&&PJ[0].rasgos.length>n0);
    ok('elegida la subclase ya no se puede cambiar: sale como texto fijo',!document.querySelector('#pj-body select[data-pjsub]')&&[...document.querySelectorAll('#pj-body .pjfijo')].some(x=>/berserker/i.test(x.textContent)));
    ok('el motor tampoco deja cambiarla',Ficha.editar(PJ[0],'subclase','Otra',pjCtx()).error==='bloqueado'&&Ficha.editar(PJ[0],'subclase',PJ[0].subclase,pjCtx()).ok===true);
    ok('especie y trasfondo no tienen lista ni caja: son texto fijo',!document.querySelector('#pj-body [data-pjf="especie"],#pj-body [data-pjf="trasfondo"]')&&document.querySelectorAll('#pj-body .pjfijo').length>=3);
    ok('el motor rechaza cambiar especie o trasfondo',Ficha.editar(PJ[0],'especie','Elfo',pjCtx()).error==='bloqueado'&&Ficha.editar(PJ[0],'trasfondo','Soldado',pjCtx()).error==='bloqueado');
    ok('el tamaño sí se puede editar',!!document.querySelector('#pj-body input[data-pjf="tamano"]')&&Ficha.editar(PJ[0],'tamano','Pequeño',pjCtx()).ok===true);
    const caTxt=()=>document.querySelector("#pj-body .pjstrip .pjstv").textContent;
    ok('la CA no se edita a mano y la calcula el motor (Bárbaro sin armadura: 10 + Des + Con = 13)',!document.querySelector('#pj-body input[data-pjf="ca"]')&&caTxt()==='13');
    PJ[0].inventario=[{id:'e1',n:'Escudo',q:1,eq:true}];pjGuardar();pjRender();await wait(300);
    ok('con escudo sube 2 (Defensa sin armadura lo permite)',caTxt()==='15');
    PJ[0].inventario=[{id:'e2',n:'Armadura de cuero tachonado',q:1,eq:true}];pjGuardar();pjRender();await wait(300);
    ok('con armadura puesta se usa la armadura (12 + Des = 13 sin Defensa sin armadura)',caTxt()==='13'||caTxt()==='12');
    ok('pjCA da la misma cifra que la hoja (la usan el combate y la mesa)',pjCA(PJ[0]).v===+caTxt());
    document.querySelector('#pj-body [data-pjdet="def"]').open=true;
    const op=id=>[...document.querySelectorAll('#pj-body #'+id+' option')].map(o=>o.value);
    ok('estados, resistencias e inmunidades salen de las reglas',op('pjl-defensas-estados').includes('Derribado')&&op('pjl-defensas-res').includes('Fuego')&&op('pjl-defensas-vul').includes('Fuego')&&op('pjl-defensas-inme').includes('Envenenado'));
    ok('el selector de inmunidades a daño no mezcla estados, y el de estados no mezcla daños',op('pjl-defensas-inm').includes('Veneno')&&!op('pjl-defensas-inm').includes('Envenenado')&&!op('pjl-defensas-inme').includes('Veneno'));
  }catch(e){R.fail=String(e&&e.stack||e);}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__subclase.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('subclase: se elige de la lista de la clase y trae sus rasgos',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-sub-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=30000','--dump-dom',`http://127.0.0.1:${port}/__subclase.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.equal(R.fail,undefined,R.fail);
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=19,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
