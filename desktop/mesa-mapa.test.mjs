// Ventana de mesa: proporción de la pantalla, mapa de combate calibrado en centímetros, fichas en casillas y orden de iniciativa
// (vertical y horizontal, con tokens y con criaturas ocultas). Necesita Edge o Chrome; si no hay ninguno, el test se salta.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const BROWSERS = [process.env.BROWSER, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const BROWSER = BROWSERS.find(b => existsSync(b));

const PAGINA = readFileSync(path.join(here, 'mesa.html'), 'utf8').replace('<script>', `<script>
window.__Mesa={onMostrar:cb=>{window.__cb=cb;},listo(){},pantallaCompleta(){},resultado(){}};
</script>
<script>`);

const PRUEBA = `<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  const until=async(f,ms=5000)=>{for(let t=0;t<ms&&!f();t+=100)await wait(100);return !!f();};
  const q=s=>document.querySelector(s),near=(a,b,e=1.5)=>Math.abs(a-b)<=e;
  const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const base={tipo:'escena',nombre:'',fondo:'#000000',fundido:0};
  try{
    await until(()=>window.__cb);
    // proporción de la pantalla
    window.__cb({...base,aspecto:'auto',capas:[]});await until(()=>q('#lienzo'));
    let r=q('#lienzo').getBoundingClientRect();
    ok('«toda la ventana» llena la pantalla entera',near(r.width,innerWidth)&&near(r.height,innerHeight));
    window.__cb({...base,aspecto:'21:9',capas:[]});await wait(200);
    r=q('#lienzo').getBoundingClientRect();
    ok('21:9 respeta esa proporción',near(r.width/r.height,21/9,0.03));
    window.__cb({...base,capas:[]});await wait(200);
    r=q('#lienzo').getBoundingClientRect();
    ok('sin proporción elegida sigue siendo 16:9',near(r.width/r.height,16/9,0.03));

    // mapa de combate: casilla de 2,5 cm en una pantalla de 100 cm = 2,5 % del ancho
    window.__cb({...base,aspecto:'auto',capas:[{tipo:'mapa',id:'m',x:0,y:0,w:100,h:100,visible:true,op:1,fondo:'#2b2f26',src:'',ajuste:'cubrir',cuad:true,cuadColor:'#ffffff',cuadOp:0.3,celda:2.5,pantalla:100,offx:0,offy:0,
      tokens:[{id:'t1',x:2,y:3,tam:1,n:'Orco',color:'#d0453c',src:PNG},{id:'t2',x:10,y:5,tam:2,n:'Ogro',color:'#d0453c',src:''}]}]});
    await until(()=>q('.capa.mapa .mtok'));
    const L=q('#lienzo').getBoundingClientRect(),cel=L.width*0.025,cap=q('.capa.mapa').getBoundingClientRect();
    ok('el mapa ocupa toda la ventana',near(cap.width,L.width)&&near(cap.height,L.height));
    const g=q('.capa.mapa .mg');
    ok('hay cuadrícula con casillas del tamaño elegido',!!g&&near(parseFloat(getComputedStyle(g).backgroundSize),cel,0.6));
    const t1=q('.mtok[data-id="t1"]').getBoundingClientRect(),t2=q('.mtok[data-id="t2"]').getBoundingClientRect();
    ok('una ficha de una casilla mide una casilla',near(t1.width,cel,0.6)&&near(t1.height,cel,0.6));
    ok('una ficha grande mide dos casillas',near(t2.width,cel*2,1)&&near(t2.height,cel*2,1));
    ok('las fichas se colocan en su casilla',near(t1.left-cap.left,2*cel,0.8)&&near(t1.top-cap.top,3*cel,0.8)&&near(t2.left-cap.left,10*cel,0.8));
    ok('la ficha lleva su imagen o, si no, sus iniciales',/url\\(/.test(q('.mtok[data-id="t1"]').style.backgroundImage)&&q('.mtok[data-id="t2"]').firstChild.textContent==='OG');
    // otra pantalla (más pequeña): la misma casilla ocupa más
    window.__cb({...base,aspecto:'auto',capas:[{tipo:'mapa',id:'m',x:0,y:0,w:100,h:100,visible:true,op:1,fondo:'#2b2f26',src:'',ajuste:'cubrir',cuad:true,cuadColor:'#ffffff',cuadOp:0.3,celda:2.5,pantalla:50,offx:0,offy:0,tokens:[{id:'t1',x:0,y:0,tam:1,n:'',color:'#888888',src:''}]}]});
    await wait(300);
    ok('con la mitad de pantalla la casilla es el doble de ancha',near(q('.mtok').getBoundingClientRect().width,q('#lienzo').getBoundingClientRect().width*0.05,0.8));
    window.__cb({...base,aspecto:'auto',capas:[{tipo:'mapa',id:'m',x:0,y:0,w:100,h:100,visible:true,op:1,fondo:'#2b2f26',src:'',ajuste:'cubrir',cuad:false,cuadColor:'#ffffff',cuadOp:0.3,celda:2.5,pantalla:100,offx:0,offy:0,tokens:[]}]});
    await wait(300);
    ok('la cuadrícula se puede quitar',!q('.capa.mapa .mg'));

    // orden de iniciativa: sin capa no se enseña; con capa, vertical u horizontal
    window.__cb({tipo:'limpiar'});await wait(200);
    const lista=[{n:'Lyra',actual:true,caido:false,color:'#3b82f6',tok:PNG,oculto:false},{n:'Enemigo oculto',actual:false,caido:false,color:'#888888',tok:'',oculto:true},{n:'Goblin',actual:false,caido:true,color:'#d0453c',tok:'',oculto:false}];
    window.__cb({tipo:'iniciativa',abrir:false,activo:true,ronda:2,lista,cuenta:null});await wait(200);
    ok('sin capa de iniciativa no se enseña nada',!q('#lienzo')&&getComputedStyle(q('#ini')).display==='none');
    window.__cb({...base,capas:[{tipo:'iniciativa',id:'i',x:0,y:0,w:30,h:100,visible:true,op:1,orient:'v',tokens:true}]});
    await until(()=>q('.capa.iniciativa .fl'));
    ok('vertical: una fila por combatiente',document.querySelectorAll('.capa.iniciativa .fl').length===3);
    ok('vertical: token con su imagen y la criatura oculta con «?»',/url\\(/.test(q('.capa.iniciativa .fl .tk').style.backgroundImage)&&document.querySelectorAll('.capa.iniciativa .fl .tk')[1].textContent==='?');
    ok('la criatura oculta no revela nada',/Enemigo oculto/.test(q('.capa.iniciativa').textContent)&&!/PG|CA|HP/.test(q('.capa.iniciativa').textContent));
    window.__cb({...base,capas:[{tipo:'iniciativa',id:'i',x:0,y:60,w:100,h:40,visible:true,op:1,orient:'h',tokens:true}]});
    await until(()=>q('.capa.iniciativa .hc'));
    const hs=[...document.querySelectorAll('.capa.iniciativa .hc')];
    ok('horizontal: una tarjeta por combatiente en fila',hs.length===3&&near(hs[1].getBoundingClientRect().top,hs[2].getBoundingClientRect().top,1)&&hs[2].getBoundingClientRect().left>hs[0].getBoundingClientRect().left);
    ok('horizontal: marca al que tiene el turno y la criatura caída',hs[0].classList.contains('actual')&&hs[2].classList.contains('caido'));
    ok('horizontal: la oculta es una tarjeta con «?» y sin nombre real',hs[1].classList.contains('oculto')&&hs[1].querySelector('.tk').textContent==='?'&&hs[1].querySelector('.nm').textContent==='Enemigo oculto');
    ok('las tarjetas caben dentro de la capa',hs.every(h=>{const a=h.getBoundingClientRect(),b=q('.capa.iniciativa').getBoundingClientRect();return a.top>=b.top-1&&a.bottom<=b.bottom+1;}));
    window.__cb({...base,capas:[{tipo:'iniciativa',id:'i',x:0,y:0,w:30,h:100,visible:true,op:1,orient:'v',tokens:false}]});
    await wait(300);
    ok('sin tokens la lista es la de siempre',!q('.capa.iniciativa .fl .tk'));
    // ambiente: efectos visuales y sonido opcional
    const amb=(ef,i,s)=>({...base,capas:[{tipo:'ambiente',id:'a',x:0,y:0,w:100,h:100,visible:true,op:1,efecto:ef,intensidad:i,sonido:!!s,volumen:40}]});
    window.__cb(amb('lluvia',5));await until(()=>q('.capa.ambiente'));
    ok('la lluvia pinta sus gotas',document.querySelectorAll('.capa.ambiente.lluvia .p').length===25+5*18);
    ok('sin pedir sonido no hay audio',!AMB.cur&&!AMB.ctx);
    ok('el efecto no recibe clics',getComputedStyle(q('.capa.ambiente')).pointerEvents==='none');
    window.__cb(amb('tormenta',10));await wait(300);
    ok('la tormenta añade rayo y más lluvia',!!q('.capa.ambiente .rayo')&&document.querySelectorAll('.capa.ambiente .p').length===25+10*18);
    window.__cb(amb('niebla',3));await wait(300);ok('la niebla son bancos que se mueven',document.querySelectorAll('.capa.ambiente .b').length===5);
    window.__cb(amb('nieve',4));await wait(300);ok('la nieve pinta copos',document.querySelectorAll('.capa.ambiente.nieve .p').length===15+4*10);
    window.__cb(amb('brasas',4));await wait(300);ok('las brasas pintan chispas',document.querySelectorAll('.capa.ambiente.brasas .p').length===10+4*6);
    window.__cb(amb('noche',8));await wait(300);ok('la noche oscurece la escena',getComputedStyle(q('.capa.ambiente.noche')).backgroundImage.includes('rgb'));
    window.__cb(amb('lluvia',5,true));await wait(400);
    ok('con sonido pedido arranca el ambiente de la lluvia',AMB.key==='lluvia|5'&&!!AMB.cur&&!!AMB.ctx);
    window.__cb(amb('tormenta',5,true));await wait(300);ok('cambiar de efecto cambia el sonido',AMB.key==='tormenta|5'&&AMB.cur.fin.length>=2);
    window.__cb({tipo:'telon',activo:true,texto:'x'});await wait(300);ok('con el telón bajado el sonido sigue preparado (en silencio)',AMB.key==='tormenta|5');
    window.__cb({tipo:'telon',activo:false,texto:''});
    for(const ef of ['niebla','nieve','noche','brasas']){window.__cb(amb(ef,5,true));await wait(200);if(AMB.key!==ef+'|5')ok('suena '+ef,false);}
    ok('todos los efectos tienen su sonido',AMB.key==='brasas|5');
    window.__cb({...base,capas:[]});await wait(300);
    ok('al quitar la capa el sonido se para',!AMB.cur&&AMB.key==='');
    // «mostrar el orden» desde el combate abre una escena con su capa
    window.__cb({tipo:'limpiar'});await wait(200);
    window.__cb({tipo:'iniciativa',abrir:true,activo:true,ronda:1,lista,cuenta:null});
    await until(()=>q('.capa.iniciativa .fl'));
    ok('pedir el orden crea una escena con su capa de iniciativa',document.querySelectorAll('#lienzo').length===1&&document.querySelectorAll('.capa.iniciativa .fl').length===3);
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+String(e.stack).slice(0,200));}
  R.err=window.__err||[];
  fetch('/res',{method:'POST',body:JSON.stringify(R)});
})();
</script>`;

test('mesa: mapa de combate calibrado, proporciones y orden de iniciativa con tokens', { skip: !BROWSER && 'no hay Edge ni Chrome', timeout: 90000 }, async () => {
  const prof = mkdtempSync(path.join(os.tmpdir(), 'hdm-mapa-'));
  let proc;
  const srv = http.createServer((q, r) => {
    const u = new URL(q.url, 'http://x').pathname;
    if (u === '/mesa.html') { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return r.end(PAGINA.replace('</body>', PRUEBA + '</body>')); }
    if (u === '/res' && q.method === 'POST') { let b = ''; q.on('data', d => b += d); q.on('end', () => { r.end('ok'); srv.emit('res', b); }); return; }
    r.writeHead(404); r.end();
  });
  await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
  try {
    const res = await new Promise((ok, ko) => {
      const timer = setTimeout(() => ko(new Error('la página no terminó la prueba')), 70000);
      srv.once('res', b => { clearTimeout(timer); ok(b); });
      proc = spawn(BROWSER, ['--headless=new', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${prof}`, '--window-size=1200,800',
        `http://127.0.0.1:${srv.address().port}/mesa.html`], { stdio: 'ignore' });
    });
    const R = JSON.parse(res);
    assert.deepEqual(R.err, [], 'errores de JavaScript');
    assert.deepEqual(R.c.filter(c => !c[1]).map(c => c[0]), [], 'comprobaciones que fallan');
    assert.ok(R.c.length >= 33, 'el flujo se quedó a medias (' + R.c.length + ')');
  } finally {
    try { proc && proc.kill(); } catch { /* ya cerrado */ }
    srv.close();
    setTimeout(() => { try { rmSync(prof, { recursive: true, force: true }); } catch { /* se queda en temporales */ } }, 1500);
  }
});
