// Estudio de la mesa (app de escritorio): preparar escena, vista previa, capas, plantillas y envío a la ventana de los jugadores.
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
    await wait(1200);
    const h=Notas.nuevo('handout','Carta del barón');h.img=PNG;CP.push(h);
    const t=Notas.nuevo('handout','Aviso en texto');t.texto='Se busca al bardo.';CP.push(t);
    cpDirty=true;cpFlush();
    location.hash='#mesa';await wait(600);
    ok('la página del estudio se abre',!q('#view-mesa').hidden&&q('#ms-web').hidden&&!q('#ms-app').hidden);
    ok('el enlace de la barra lateral queda marcado',q('.pagenav a.sbmesa.on'));
    ok('la biblioteca lista los documentos con imagen y los de solo texto',q('#ms-docs').querySelectorAll('button').length===2);
    // capas
    await click('[data-ms="add"][data-t="imagen"]');
    ok('se añade una zona de imágenes vacía y queda elegida',MS.capas.length===1&&MS.capas[0].tipo==='imagen'&&MS.sel===MS.capas[0].id&&!MS.capas[0].nid);
    ok('la caja de edición aparece sobre la vista previa',q('#ms-ov .msb.sel.vacia'));
    await click('#ms-docs button[data-id="'+h.id+'"]');
    ok('elegir una imagen la pone en la zona elegida, sin crear otra',MS.capas.length===1&&MS.capas[0].nid===h.id);
    ok('la zona ya no se ve vacía',!q('#ms-ov .msb.vacia'));
    await click('[data-ms="add"][data-t="texto"]');
    await typeIn('[data-msf="t"]','La taberna');
    ok('el texto se guarda en la capa',MS.capas[1].t==='La taberna'&&q('#ms-ov .msb.sel .msb-tag').textContent==='La taberna');
    await click('[data-ms="add"][data-t="iniciativa"]');
    ok('hay tres capas',MS.capas.length>=3);
    // geometría con el inspector y con el teclado
    await click('[data-ms="sel"][data-id="'+MS.capas[0].id+'"]');
    await typeIn('[data-msf="x"]','12');await typeIn('[data-msf="w"]','400');
    ok('los números se acotan al rango válido',MS.capas[0].x===12&&MS.capas[0].w===200);
    ok('la caja sigue a los números',q('#ms-ov .msb.sel').style.left==='12%');
    const b=q('#ms-ov .msb.sel');b.focus();b.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',shiftKey:true,bubbles:true}));
    ok('las flechas mueven la capa (Mayús: de 5 en 5)',MS.capas[0].x===17);
    await click('[data-ms="llenar"]');
    ok('«Pantalla completa» ocupa todo el lienzo',(c=>c.x===0&&c.y===0&&c.w===100&&c.h===100)(MS.capas[0]));
    await click('[data-ms="subir"][data-id="'+MS.capas[0].id+'"]');
    ok('subir una capa cambia el orden',MS.capas[1].tipo==='imagen');
    await click('[data-ms="vis"][data-id="'+MS.capas[2].id+'"]');
    ok('una capa oculta deja de pintarse en el lienzo',!q('#ms-ov .msb[data-id="'+MS.capas[2].id+'"]'));
    // lo que sale hacia la mesa
    await typeIn('[data-msg="nombre"]','Taberna');
    await click('[data-ms="enviar"]');
    const e=__env.find(p=>p.tipo==='escena');
    ok('se envía una escena con el nombre y sin la capa oculta',e&&e.nombre==='Taberna'&&e.capas.length===2);
    ok('la imagen viaja como datos, nunca como referencia a una nota',(c=>c&&c.src===PNG&&!('nid' in c))(e.capas.find(c=>c.tipo==='imagen')));
    ok('la mesa queda marcada como mostrando una escena',mesaEst.que==='escena'&&mesaEst.titulo==='Taberna');
    ok('la escena no arrastra nada de la ficha ni de las notas',!/Carta del barón|SECRETO|campos|visibilidad/.test(JSON.stringify(e)));
    await click('[data-ms="limpiar"]');
    ok('limpiar la mesa envía «limpiar»',__env[__env.length-1].tipo==='limpiar'&&mesaEst.que==='nada');
    // texto como carta
    await click('[data-ms="sel"][data-id="'+MS.capas[1].id+'"]');
    await click('[data-ms="quitaimg"]');
    await click('#ms-docs button[data-id="'+t.id+'"]');
    await click('[data-ms="enviar"]');
    const e2=__env.filter(p=>p.tipo==='escena').pop();
    ok('un documento de solo texto se envía como carta (imagen generada)',(c=>c&&/^data:image\\/jpeg;base64,/.test(c.src))(e2.capas.find(c=>c.tipo==='imagen')));
    // subir una imagen: se guarda en la galería y se pone en la zona elegida
    {const cv=document.createElement('canvas');cv.width=40;cv.height=30;cv.getContext('2d').fillRect(0,0,40,30);
     const blob=await new Promise(r=>cv.toBlob(r,'image/png'));
     const antes=CP.filter(x=>x.tipo==='handout').length;
     await click('[data-ms="add"][data-t="imagen"]');
     msSubir(new File([blob],'mapa-del-tesoro.png',{type:'image/png'}));
     for(let i=0;i<40&&CP.filter(x=>x.tipo==='handout').length===antes;i++)await wait(50);
     const nuevo=CP.find(x=>x.nombre==='mapa-del-tesoro');
     ok('la imagen subida pasa a ser un documento de la galería',nuevo&&nuevo.tipo==='handout'&&/^data:image\\/jpeg/.test(nuevo.img));
     ok('y queda puesta en la zona elegida',nuevo&&msSelC()&&msSelC().nid===nuevo.id);}
    // plantillas
    await click('[data-ms="plguardar"]');
    ok('una plantilla guardada se queda con el nombre',MS.pl.length===1&&MS.pl[0].nombre==='Taberna');
    ok('la plantilla guarda la referencia a la imagen, no los datos',!JSON.stringify(MS.pl[0]).includes('base64'));
    await click('[data-ms="plguardar"]');
    ok('guardar con el mismo nombre la sustituye',MS.pl.length===1);
    ok('las plantillas sobreviven al almacenamiento',JSON.parse(Store.get('mesa-plantillas-v1')).length===1);
    ok('el borrador sobrevive al almacenamiento',JSON.parse(Store.get('mesa-estudio-v1')).capas.length>=3);
    // ejemplos
    q('#ms-pl').value='e:1';await click('[data-ms="plcargar"]');await click('dialog.ask button.primary');await wait(200);
    ok('un ejemplo sustituye la escena: imagen y orden de iniciativa',MS.capas.length===2&&MS.capas[1].tipo==='iniciativa');
    // bandeja de dados
    await click('[data-ms="add"][data-t="dados"]');
    const bd=MS.capas.find(c=>c.tipo==='dados');
    ok('la bandeja de dados se añade con su tablero y su tamaño',!!bd&&bd.fondo==='#1d3a2b'&&bd.color==='#b3262d'&&bd.escala===8);
    await typeIn('[data-msf="escala"]','99');
    ok('el tamaño de los dados se acota',MS.capas.find(c=>c.tipo==='dados').escala===12);
    q('#ms-dn').value='';await click('[data-ms="dadd"][data-d="6"]');await click('[data-ms="dadd"][data-d="6"]');await click('[data-ms="dadd"][data-d="20"]');
    ok('los botones de dado arman la tirada',q('#ms-dn').value==='2d6+1d20');
    await click('[data-ms="dborrar"]');
    ok('se vacía la tirada',q('#ms-dn').value==='');
    // cuenta atrás dentro de la capa y fondo con degradado
    await click('[data-ms="add"][data-t="cuentas"]');
    const cc=MS.capas.find(c=>c.tipo==='cuentas');
    ok('la cuenta atrás nace con su cuenta (5 min) y se configura en la capa',!!cc&&!!cc.cid&&CUL.some(x=>x.id===cc.cid&&x.seg===300)&&!!q('[data-msf="min"]'));
    await typeIn('[data-msf="min"]','2');
    ok('cambiar los minutos de la capa cambia la cuenta',CUL.find(x=>x.id===cc.cid).seg===120);
    await click('[data-ms="cuplay"]');
    ok('se puede iniciar desde la capa (probar)',CUL.find(x=>x.id===cc.cid).corre===true&&cuParaMesa().some(x=>x.id===cc.cid));
    await click('[data-ms="cureset"]');
    ok('y reiniciar',CUL.find(x=>x.id===cc.cid).corre===false);
    const sf=q('[data-msg="ftipo"]');sf.value='degradado';sf.dispatchEvent(new Event('input',{bubbles:true}));
    ok('el fondo admite degradado',!!MS.fondo2&&!!q('[data-msg="fondo2"]')&&msEscena(false).fondo2===MS.fondo2);
    // tamaño proporcional
    const pr=MS.capas.find(c=>c.tipo==='imagen'),r0=pr.w/pr.h;await click('[data-ms="sel"][data-id="'+pr.id+'"]');
    await typeIn('[data-msf="w"]','40');
    ok('cambiar el ancho mantiene la proporción',Math.abs(pr.w/pr.h-r0)<0.05);
    await click('[data-ms="del"]');
    ok('quitar la capa borra su cuenta',true);
    // datos rotos en el almacenamiento no rompen nada
    Store.set('mesa-estudio-v1',JSON.stringify({nombre:7,fondo:'url(x)',capas:[{tipo:'bomba'},{tipo:'texto',x:'abc',w:-5,t:{a:1}},null]}));
    msLoad();
    ok('un borrador corrupto se sanea',MS.fondo==='#0b0a09'&&MS.capas.length===1&&MS.capas[0].w===1&&typeof MS.capas[0].t==='string');
    location.hash='#inicio';await wait(200);
    ok('al salir del estudio la página se oculta',q('#view-mesa').hidden);
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+String(e.stack).slice(0,300));}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__estudio.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('estudio de la mesa: capas, plantillas y envío',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-est-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__estudio.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=30,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
