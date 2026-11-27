// Reglas homebrew: sección propia, etiqueta Homebrew y paso opcional a la referencia rápida.
// Necesita Edge o Chrome (variable BROWSER para indicar otro); si no hay ninguno, el test se salta.
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFileSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
import {execFile} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {ROOT,PAGE} from './lib.mjs';
import {MANUAL_JS} from './lib.mjs';
import {testNav} from './lib.mjs';

const BROWSERS=[process.env.BROWSER,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome','/usr/bin/chromium','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const BROWSER=BROWSERS.find(b=>existsSync(b));

const head=`<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));addEventListener('unhandledrejection',e=>__err.push(String(e.reason)));localStorage.clear();</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  const go=async h=>{location.hash=h;await wait(500);};
  try{
    await wait(1200);
    await go('#homebrew');
    ${MANUAL_JS}
    renderHB();
    ok('la sección existe y está vacía al principio',!document.getElementById('view-homebrew').hidden&&/Aún no hay/.test(document.getElementById('hb-body').textContent));
    ok('hay enlace en el menú',!!document.querySelector('.pagenav a[href="#homebrew"]'));
    document.querySelector('#view-homebrew [data-act="itnew"]').click();await wait(200);
    ok('el editor abre con la categoría Homebrew y la casilla de referencia',document.getElementById('it-f-cat').value==='Homebrew'&&!!document.getElementById('it-f-ref'));
    document.getElementById('it-n').value='Crítico con mala pata';
    document.getElementById('it-d').value='Con un 1 natural en un ataque, el atacante tira en la tabla de pifias.';
    document.getElementById('it-f-ref').checked=true;
    document.getElementById('itform').requestSubmit();await wait(400);
    ok('la regla aparece en la sección con la etiqueta Homebrew',/Crítico con mala pata/.test(document.getElementById('hb-body').textContent)&&!!document.querySelector('#hb-body .hbtag'));
    await go('#referencia');
    const card=[...document.querySelectorAll('#qr-body .qrcard')].find(c=>/Crítico con mala pata/.test(c.textContent));
    ok('sale en la referencia rápida con su etiqueta Homebrew',!!card&&!!card.querySelector('.hbtag'));
    await go('#homebrew');
    document.querySelector('#hb-body [data-act="hbref"]').click();await wait(300);
    await go('#referencia');
    ok('al quitarla de la referencia deja de salir ahí',![...document.querySelectorAll('#qr-body .qrcard')].some(c=>/Crítico con mala pata/.test(c.textContent)));
    await go('#compendio/reglas');
    ok('en el compendio sigue con la etiqueta',[...document.querySelectorAll('#cm-list tr.sprow')].some(r=>/Crítico con mala pata/.test(r.textContent)&&r.querySelector('.hbtag')));
    // por campaña: desactivada no sale en referencia ni compendio, pero sigue en su sección
    await go('#homebrew');
    ok('por defecto está activa en la campaña',hbOn('Crítico con mala pata')&&!!document.querySelector('#hb-body [data-act="hbcamp"]'));
    document.querySelector('#hb-body [data-act="hbref"]').click();await wait(200);
    document.querySelector('#hb-body [data-act="hbcamp"]').click();await wait(300);
    ok('al desactivarla sigue en la sección, marcada como desactivada',!hbOn('Crítico con mala pata')&&/Desactivada en esta campaña/.test(document.getElementById('hb-body').textContent));
    ok('desactivada no sale en el compendio ni en la lista de reglas',!compList('reglas').some(x=>x._mine)&&compList('reglas',true).some(x=>x._mine));
    await go('#referencia');
    ok('ni en la referencia rápida',![...document.querySelectorAll('#qr-body .qrcard')].some(c=>/Crítico con mala pata/.test(c.textContent)));
    await go('#homebrew');
    document.querySelector('#hb-body [data-act="hbcamp"]').click();await wait(300);
    ok('al activarla vuelve',hbOn('Crítico con mala pata')&&compList('reglas').some(x=>x._mine));
    ok('el ajuste es de la campaña y se guarda en su configuración',Array.isArray(JSON.parse(Store.get(PJCFG)).hbOn));
    document.querySelector('#view-homebrew [data-act="itnew"]').click();await wait(200);
    document.getElementById('it-n').value='Segunda regla';document.getElementById('it-d').value='Texto.';
    document.getElementById('itform').requestSubmit();await wait(400);
    ok('una regla nueva queda activa donde ya había ajuste',hbOn('Segunda regla'));
    document.querySelectorAll('#hb-body [data-act="hbcamp"]').forEach(b=>{if(/Segunda/.test(b.closest('details').textContent))b.click();});await wait(200);
    ok('se puede desactivar una y dejar la otra',!hbOn('Segunda regla')&&hbOn('Crítico con mala pata'));
    // el máster publica las activas; el jugador las recibe y las ve en la referencia
    scLoad();const sn=scSnapshot();
    ok('el máster publica las reglas activas en la campaña y no las desactivadas',!!sn['hb:critico-con-mala-pata']&&!sn['hb:segunda-regla']&&sn['hb:critico-con-mala-pata'].d.length>10);
    const val={...sn['hb:critico-con-mala-pata'],ref:true};
    Store.campaigns.setRol(Store.campaigns.active(),'jugador');
    SC.l=Sincro.editar(Sincro.vacio(),'hb:critico-con-mala-pata',val,1).l;
    scApply({bajados:['hb:critico-con-mala-pata'],borrados:[]});
    ok('el jugador guarda la copia de solo lectura',hbcLoad().length===1&&compList('reglas').some(x=>x._camp&&x.n==='Crítico con mala pata'));
    ok('el jugador no ve sus propias reglas, solo las de la campaña',!compList('reglas').some(x=>x._mine));
    ok('el jugador no vuelve a subirlas (las conserva)',!!scSnapshot()['hb:critico-con-mala-pata']);
    await go('#referencia');
    const cj=[...document.querySelectorAll('#qr-body .qrcard')].find(c=>/Crítico con mala pata/.test(c.textContent));
    ok('al entrar en la referencia le salen, con su etiqueta Homebrew, junto a las de los manuales',!!cj&&!!cj.querySelector('.hbtag')&&document.querySelectorAll('#qr-body .qrcard').length>100);
    scApply({bajados:[],borrados:['hb:critico-con-mala-pata']});
    ok('si el máster la desactiva, desaparece',hbcLoad().length===0&&!compList('reglas').some(x=>x._camp));
    Store.campaigns.setRol(Store.campaigns.active(),'master');
    await go('#homebrew');
    ok('los manuales no llevan etiqueta',compList('reglas').filter(x=>!x._mine).length>100&&compList('reglas',true).filter(x=>x._mine).length===2);
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+String(e.stack).slice(0,200));}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__homebrew.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('reglas homebrew y referencia rápida',{manual:true,skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-hb-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__homebrew.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=22,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
