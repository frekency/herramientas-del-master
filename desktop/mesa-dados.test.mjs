// Bandeja de dados de la mesa: física real (dice-box) dentro del recuadro de su capa y resultado visible.
// Necesita Edge o Chrome con WebGL por software (variable BROWSER para indicar otro); si no hay ninguno, el test se salta.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, '..');
const { validar, notacionValida } = createRequire(import.meta.url)('./mesa.js');

test('mesa: la tirada de dados solo admite notación segura', () => {
  for (const n of ['1d20', '2d6+3', '1d20+1d4-1', '4d6', '1d100', '1d8+1d6+2', '1d2', '3d2+1d20'])
    assert.ok(notacionValida(n), n);
  for (const n of ['', '1d7', '25d6', 'd20', '1d20; alert(1)', '1d20+', '1d20++2', '99d4+99d6', 5, null, '1d20+1d4+1d6+1d8+1d10+1d12+20d20'])
    assert.ok(!notacionValida(n), String(n));
  assert.deepEqual(validar({ tipo: 'dados', notacion: '2d6+3', etiqueta: 'Daño' }), { tipo: 'dados', notacion: '2d6+3', etiqueta: 'Daño' });
  assert.equal(validar({ tipo: 'dados', notacion: 'x' }), null);
});

test('mesa: la capa «dados» se valida y recorta sus valores', () => {
  const e = validar({ tipo: 'escena', capas: [{ tipo: 'dados', x: 10, y: 20, w: 30, h: 40, fondo: 'rojo', color: '#123456', escala: 99 }] });
  assert.equal(e.capas.length, 1);
  assert.deepEqual([e.capas[0].tipo, e.capas[0].fondo, e.capas[0].color, e.capas[0].escala], ['dados', '#1d3a2b', '#123456', 12]);
});

const BROWSERS = [process.env.BROWSER, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const BROWSER = BROWSERS.find(b => existsSync(b));

const PAGINA = readFileSync(path.join(here, 'mesa.html'), 'utf8').replace('<script>', `<script>
window.__Mesa={onMostrar:cb=>{window.__cb=cb;},listo(){},pantallaCompleta(){},resultado:r=>{(window.__res=window.__res||[]).push(r);}};
</script>
<script>`);

const PRUEBA = `<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  const esperar=async(f,ms=30000)=>{for(let t=0;t<ms&&!f();t+=200)await wait(200);};
  try{
    await esperar(()=>window.__cb,5000);
    window.__cb({tipo:'escena',nombre:'',fondo:'#000000',fundido:0,capas:[{tipo:'dados',id:'d1',x:10,y:10,w:50,h:60,visible:true,op:1,fondo:'#1d3a2b',color:'#b3262d',escala:6}]});
    await wait(400);
    const capa=document.querySelector('.capa.dados'),host=document.getElementById('dhost');
    ok('la capa de dados está en la escena',!!capa);
    const rc=capa.getBoundingClientRect(),rh=host.getBoundingClientRect();
    ok('el tablero de física cubre exactamente el recuadro de la capa',Math.abs(rc.left-rh.left)<1&&Math.abs(rc.top-rh.top)<1&&Math.abs(rc.width-rh.width)<1&&Math.abs(rc.height-rh.height)<1);
    window.__cb({tipo:'dados',notacion:'2d6+3',etiqueta:'Daño'});
    await esperar(()=>window.__res&&window.__res.length>=1);
    const a=(window.__res||[])[0];
    ok('la tirada devuelve el resultado',!!a&&a.dados.length===2&&a.dados.every(v=>v>=1&&v<=6));
    ok('el total es la suma de los dados más el modificador',!!a&&a.total===a.dados.reduce((x,y)=>x+y,0)+3&&a.mod===3);
    ok('el resultado se ve en el recuadro',/Daño/.test(document.getElementById('dres').textContent)&&document.querySelector('#dres .tot').textContent===String(a&&a.total));
    ok('hay un lienzo de dados dentro del recuadro',!!host.querySelector('canvas')&&host.querySelector('canvas').clientWidth>0);
    window.__cb({tipo:'dados',notacion:'1d20+1d4-1'});
    await esperar(()=>window.__res&&window.__res.length>=2);
    const b=(window.__res||[])[1];
    ok('varias clases de dados y un modificador negativo',!!b&&b.dados.length===2&&b.dados[0]>=1&&b.dados[0]<=20&&b.dados[1]>=1&&b.dados[1]<=4&&b.total===b.dados[0]+b.dados[1]-1);
    window.__cb({tipo:'dados',notacion:'3d2+1'});
    await esperar(()=>window.__res&&window.__res.length>=3);
    const c3=(window.__res||[])[2];
    ok('el d2 da 1 o 2 (cae un d6 y cuenta la mitad alta o baja)',!!c3&&c3.dados.length===3&&c3.dados.every(v=>v===1||v===2)&&c3.total===c3.dados.reduce((x,y)=>x+y,0)+1);
    window.__cb({tipo:'telon',activo:true,texto:'Ahora volvemos'});await wait(900);
    ok('el telón tapa la mesa con su texto',document.getElementById('telon').classList.contains('on')&&document.getElementById('telont').textContent==='Ahora volvemos'&&getComputedStyle(document.getElementById('telon')).visibility==='visible');
    window.__cb({tipo:'telon',activo:false,texto:''});await wait(900);
    ok('y se sube',getComputedStyle(document.getElementById('telon')).visibility==='hidden');
    window.__cb({tipo:'limpiar'});await wait(300);
    ok('sin escena el tablero se oculta',getComputedStyle(host).display==='none');
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+String(e.stack).slice(0,200));}
  R.err=window.__err||[];
  fetch('/res',{method:'POST',body:JSON.stringify(R)});
})();
</script>`;

test('mesa: la bandeja tira dados 3D con física real y enseña el resultado', { skip: !BROWSER && 'no hay Edge ni Chrome', timeout: 150000 }, async () => {
  const prof = mkdtempSync(path.join(os.tmpdir(), 'hdm-dados-'));
  let proc;
  const srv = http.createServer((q, r) => {
    const u = decodeURIComponent(new URL(q.url, 'http://x').pathname);
    if (u === '/mesa.html') { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return r.end(PAGINA.replace('</body>', PRUEBA + '</body>')); }
    if (u === '/res' && q.method === 'POST') { let b = ''; q.on('data', d => b += d); q.on('end', () => { r.end('ok'); srv.emit('res', b); }); return; }
    const f = path.join(ROOT, path.normalize(u).replace(/^([/\\])+/, ''));
    if (!f.startsWith(ROOT) || !u.startsWith('/vendor/') || !existsSync(f)) { r.writeHead(404); return r.end(); }
    const t = { '.js': 'text/javascript', '.wasm': 'application/wasm', '.css': 'text/css', '.json': 'application/json' }[path.extname(f)] || 'application/octet-stream';
    r.writeHead(200, { 'content-type': t }); r.end(readFileSync(f));
  });
  await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
  try {
    const res = await new Promise((ok, ko) => {
      const timer = setTimeout(() => ko(new Error('la página no terminó la prueba')), 120000);
      srv.once('res', b => { clearTimeout(timer); ok(b); });
      proc = spawn(BROWSER, ['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-first-run',
        '--no-default-browser-check', `--user-data-dir=${prof}`, '--window-size=1200,800', `http://127.0.0.1:${srv.address().port}/mesa.html`], { stdio: 'ignore' });
    });
    const R = JSON.parse(res);
    assert.deepEqual(R.err, [], 'errores de JavaScript');
    assert.deepEqual(R.c.filter(c => !c[1]).map(c => c[0]), [], 'comprobaciones que fallan');
    assert.ok(R.c.length >= 10, 'el flujo se quedó a medias (' + R.c.length + ')');
  } finally {
    try { proc && proc.kill(); } catch { /* ya cerrado */ }
    srv.close();
    setTimeout(() => { try { rmSync(prof, { recursive: true, force: true }); } catch { /* se queda en temporales */ } }, 1500);
  }
});
