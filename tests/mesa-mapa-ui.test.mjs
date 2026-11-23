// Estudio de la mesa: mapa de combate (calibración, fichas del combate, ocultas, arrastre), iniciativa horizontal y proporción de la pantalla.
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
localStorage.clear();</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  const q=s=>document.querySelector(s);
  const click=async sel=>{const b=q(sel);if(!b)throw new Error('no hay '+sel);b.click();await wait(120);};
  const typeIn=async(sel,v)=>{const i=q(sel);if(!i)throw new Error('no hay '+sel);i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}));await wait(80);};
  const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  try{
    await wait(1500);
    const pjF=state.factions.find(f=>f.pc),enF=state.factions.find(f=>!f.pc);
    const mk=(n,f,t,sb)=>({id:uid(),name:n,factionId:f.id,init:null,initBonus:2,hp:10,maxHp:10,temp:0,ac:12,conds:[],notes:'',ds:0,df:0,tpl:t,used:{},uses:{},la:0,lr:0,ex:false,sb});
    state.creatures=[mk('Goblin',enF,null,{n:'Goblin',tok:PNG,sz:'Small'}),mk('Ogro',enF,null,{n:'Ogro',sz:'Large'}),mk('Lyra',pjF,null)];
    sortInto(state);render();await wait(200);
    location.hash='#mesa';await wait(600);
    // capa de mapa
    await click('[data-ms="add"][data-t="mapa"]');
    const m=MS.capas[0];
    ok('el mapa se añade a pantalla completa con casilla de 2,5 cm y tele de 55"',m.tipo==='mapa'&&m.w===100&&m.h===100&&m.celda===2.5&&m.pantalla===122&&m.cuad===true);
    ok('mientras el mapa está elegido, la vista previa deja arrastrar las fichas',q('.ms-stage').classList.contains('mapasel'));
    const pa=q('[data-ms="mpant"]');pa.value='60';pa.dispatchEvent(new Event('change',{bubbles:true}));await wait(100);
    ok('elegir un monitor de la lista pone su ancho',m.pantalla===60);
    await typeIn('[data-msf="pantalla"]','900');
    ok('el ancho de pantalla se acota',m.pantalla===600);
    await typeIn('[data-msf="pantalla"]','100');await typeIn('[data-msf="celda"]','99');
    ok('la casilla se acota a 20 cm',m.celda===20);
    await typeIn('[data-msf="celda"]','2.5');
    ok('la escena enviada lleva la calibración',(c=>c.celda===2.5&&c.pantalla===100)(msEscena(false).capas[0]));
    // fichas desde el combate
    await click('[data-ms="mtokcombate"]');
    ok('una ficha por criatura del combate',m.tokens.length===3&&m.tokens.every(t=>t.cid));
    ok('el ogro (Grande) ocupa dos casillas y el goblin una',m.tokens.find(t=>t.n==='Ogro').tam===2&&m.tokens.find(t=>t.n==='Goblin').tam===1);
    ok('las fichas no se pisan: cada una en su casilla',new Set(m.tokens.map(t=>t.x+','+t.y)).size===3);
    await click('[data-ms="mtokcombate"]');
    ok('repetir no duplica fichas',m.tokens.length===3);
    const e1=msEscena(false).capas[0];
    ok('la ficha toma del combate su imagen y el color de su banda',e1.tokens.find(t=>t.n==='Goblin').src===PNG&&e1.tokens.every(t=>/^#[0-9a-f]{6}$/i.test(t.color)));
    ok('sin PG ni CA en lo que viaja',!/"hp"|"ac"|maxHp/.test(JSON.stringify(msEscena(false))));
    // arrastrar en la vista previa
    const g=m.tokens.find(t=>t.n==='Goblin');
    dispatchEvent(new MessageEvent('message',{data:{mesaToken:{capa:m.id,id:g.id,x:7,y:5}},origin:location.origin,source:q('#ms-prev').contentWindow}));await wait(100);
    ok('mover la ficha en la vista previa guarda su casilla',g.x===7&&g.y===5&&q('[data-mt="x"][data-tid="'+g.id+'"]').value==='7');
    dispatchEvent(new MessageEvent('message',{data:{mesaToken:{capa:m.id,id:g.id,x:1,y:1}},origin:location.origin,source:window}));await wait(50);
    ok('un mensaje que no viene de la vista previa se ignora',g.x===7);
    await typeIn('[data-mt="y"][data-tid="'+g.id+'"]','9');
    ok('también se puede escribir la casilla',g.y===9);
    // criatura oculta en el combate
    const gob=state.creatures[0];state.expanded=gob.id;render();await wait(150);
    ok('el combate ofrece ocultar a la criatura a los jugadores',!!q('[data-act="oculto"]'));
    q('[data-act="oculto"]').click();await wait(200);
    ok('la criatura queda oculta y se nota en su fila',gob.oculto===true&&/Oculta/.test(document.body.textContent));
    const li=mesaIniData().lista.find(x=>x.n==='Goblin');
    ok('al orden de iniciativa va marcada como oculta y sin más datos',li.oculto===true&&Object.keys(li).every(k=>['n','actual','caido','color','tok','oculto'].includes(k)));
    ok('su ficha en el mapa sigue al combate y queda oculta',msEscena(false).capas[0].tokens.find(t=>t.id===g.id).oculto===true);
    ok('el inspector no da botón manual a una ficha que sigue al combate',!q('[data-ms="mtokvis"][data-tid="'+g.id+'"]'));
    q('[data-act="oculto"]').click();await wait(200);
    ok('al mostrarla vuelve a verse',gob.oculto===false&&mesaIniData().lista.find(x=>x.n==='Goblin').oculto===false);
    // ficha en blanco, oculta a mano, tamaño y borrar
    await click('[data-ms="mtokvacio"]');
    const fb=m.tokens[m.tokens.length-1];
    ok('ficha en blanco añadida',m.tokens.length===4&&!fb.cid);
    await click('[data-ms="mtokvis"][data-tid="'+fb.id+'"]');
    ok('una ficha manual se oculta a los jugadores',fb.oculto===true&&msEscena(false).capas[0].tokens.find(t=>t.id===fb.id).oculto===true);
    const ts=q('[data-mt="tam"][data-tid="'+fb.id+'"]');ts.value='3';ts.dispatchEvent(new Event('input',{bubbles:true}));await wait(80);
    ok('el tamaño de la ficha se cambia',fb.tam===3);
    await click('[data-ms="mtokdel"][data-tid="'+fb.id+'"]');
    ok('se quita la ficha',m.tokens.length===3&&!m.tokens.some(t=>t.id===fb.id));
    // una criatura que sale del combate se lleva su ficha
    state.creatures=state.creatures.filter(c=>c!==gob);
    ok('si la criatura ya no está en el combate, su ficha no se envía',!msEscena(false).capas[0].tokens.some(t=>t.id===g.id));
    // mapa de fondo desde la galería
    const h=Notas.nuevo('handout','Mazmorra');h.img=PNG;CP.push(h);cpDirty=true;cpFlush();msBiblio();
    await click('[data-ms="mapick"][data-modo="fondo"]');await click('#ms-docs button[data-id="'+h.id+'"]');
    ok('elegir mapa de la galería lo pone de fondo y no crea otra capa',m.nid===h.id&&MS.capas.length===1&&msEscena(false).capas[0].src===PNG);
    await click('[data-ms="mapick"][data-modo="token"]');await click('#ms-docs button[data-id="'+h.id+'"]');
    ok('elegir ficha de la galería añade una ficha con su imagen',m.tokens.some(t=>t.nid===h.id)&&msEscena(false).capas[0].tokens.some(t=>t.src===PNG&&t.n==='Mazmorra'));
    // proporción de la pantalla
    const as=q('[data-msg="aspecto"]');as.value='auto';as.dispatchEvent(new Event('input',{bubbles:true}));await wait(80);
    ok('«toda la ventana» llega a la escena',MS.aspecto==='auto'&&msEscena(false).aspecto==='auto');
    as.value='21:9';as.dispatchEvent(new Event('input',{bubbles:true}));await wait(80);
    ok('la vista previa adopta la proporción elegida',msEscena(true).aspecto==='21:9'&&q('.ms-stage').style.aspectRatio.split(' ').join('')==='21/9');
    ok('se guarda con la escena',JSON.parse(Store.get('mesa-estudio-v1')).aspecto==='21:9');
    // iniciativa horizontal
    await click('[data-ms="add"][data-t="iniciativa"]');
    const ic=MS.capas.find(c=>c.tipo==='iniciativa');
    ok('la iniciativa nace vertical y con tokens',ic.orient==='v'&&ic.tokens===true);
    const so=q('[data-msf="orient"]');so.value='h';so.dispatchEvent(new Event('change',{bubbles:true}));await wait(100);
    ok('se puede poner en horizontal',ic.orient==='h'&&msEscena(false).capas.find(c=>c.tipo==='iniciativa').orient==='h');
    const ct=q('[data-msf="tokens"]');ct.checked=false;ct.dispatchEvent(new Event('change',{bubbles:true}));await wait(100);
    ok('y quitar los tokens',ic.tokens===false);
    // capa de ambiente con sonido opcional
    await click('[data-ms="add"][data-t="ambiente"]');
    const am=MS.capas.find(c=>c.tipo==='ambiente');
    ok('el ambiente nace a pantalla completa, niebla, sin sonido',am.w===100&&am.h===100&&am.efecto==='niebla'&&am.sonido===false&&!q('[data-ms="ambprueba"]'));
    const se=q('[data-msf="efecto"]');se.value='tormenta';se.dispatchEvent(new Event('change',{bubbles:true}));await wait(100);
    ok('se elige el efecto',am.efecto==='tormenta'&&msEscena(false).capas.find(c=>c.tipo==='ambiente').efecto==='tormenta');
    await typeIn('[data-msf="intensidad"]','99');
    ok('la intensidad se acota',am.intensidad===10);
    const cs=q('[data-msf="sonido"]');cs.checked=true;cs.dispatchEvent(new Event('change',{bubbles:true}));await wait(100);
    ok('el sonido es opcional: al activarlo salen volumen y prueba',am.sonido===true&&!!q('[data-msf="volumen"]')&&!!q('[data-ms="ambprueba"]'));
    ok('y llega a la escena que se envía',(c=>c.sonido===true&&c.volumen===40)(msEscena(false).capas.find(c=>c.tipo==='ambiente')));
    await click('[data-ms="ambprueba"]');
    ok('se puede probar el sonido en la vista previa',MS.ambOn===true&&/Parar/.test(q('[data-ms="ambprueba"]').textContent));
    await click('[data-ms="sel"][data-id="'+ic.id+'"]');
    ok('al salir de la capa la prueba se para sola',MS.ambOn===false);
    // una escena guardada de antes (sin estos campos) se sigue cargando
    Store.set('mesa-estudio-v1',JSON.stringify({fondo:'#102030',capas:[{tipo:'iniciativa',x:1,y:1,w:20,h:80}]}));msLoad();
    ok('las escenas antiguas se cargan con valores por defecto',MS.aspecto==='16:9'&&MS.capas[0].orient==='v'&&MS.capas[0].tokens===true);
    Store.set('mesa-estudio-v1',JSON.stringify({capas:[{tipo:'mapa',celda:'x',pantalla:-4,tokens:[null,{x:'a',tam:99,n:{a:1}},{id:'t',cid:'<b>'}]}]}));msLoad();
    const mm=MS.capas[0];
    ok('un mapa corrupto se sanea',mm.celda===2.5&&mm.pantalla===15&&mm.tokens.length===2&&mm.tokens[0].tam===8&&typeof mm.tokens[0].n==='string'&&mm.tokens[1].cid==='');
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+String(e.stack).slice(0,300));}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__mapaui.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('estudio de la mesa: mapa de combate, fichas y criaturas ocultas',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-mapaui-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__mapaui.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=40,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
