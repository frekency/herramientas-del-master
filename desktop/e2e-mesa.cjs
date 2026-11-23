// Arnés de la prueba de extremo a extremo de la mesa: arranca la app real de Electron (main.js, protocolo app://, preloads, IPC y ventanas de verdad)
// con datos temporales y lo maneja desde dentro. Lo lanza desktop/mesa-electron.test.mjs; escribe el resultado en HDM_E2E_OUT.
// No toca los datos del usuario (carpeta temporal) ni el registro de Windows (el protocolo herramientasdelmaster:// se deja como está).
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const SALIDA = process.env.HDM_E2E_OUT;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hdm-e2e-'));
app.setPath('userData', tmp);
app.setAsDefaultProtocolClient = () => true;
app.commandLine.appendSwitch('use-angle', 'swiftshader');
app.commandLine.appendSwitch('enable-unsafe-swiftshader');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
// fuera de pantalla Chromium deja de pintar fotogramas (las transiciones no terminan): se desactiva esa optimización
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
// las ventanas se sacan de la pantalla para no molestar mientras se prueba (HDM_E2E_VER=1 las deja a la vista)
if (!process.env.HDM_E2E_VER) {
  app.on('browser-window-created', (_e, w) => {
    const b = w.getBounds();
    w.setBounds({ x: -6000, y: -6000, width: b.width, height: b.height });
    w.on('show', () => w.setBounds({ x: -6000, y: -6000, width: b.width, height: b.height }));
  });
}

const R = { c: [], err: [] };
const ok = (n, v) => R.c.push([n, !!v]);
const wait = ms => new Promise(r => setTimeout(r, ms));
const until = async (f, ms = 25000) => { const t = Date.now(); while (Date.now() - t < ms) { try { if (await f()) return true; } catch { /* aún no */ } await wait(150); } return false; };
const ev = (w, code) => w.webContents.executeJavaScript(code, true);
const ventanas = () => BrowserWindow.getAllWindows().filter(w => !w.isDestroyed() && w.webContents.getURL().endsWith('/mesa.html'));
const fin = code => { try { fs.writeFileSync(SALIDA, JSON.stringify(R)); } catch { /* sin salida */ } try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* temporales */ } app.exit(code); };

setTimeout(() => { R.err.push('tiempo agotado'); fin(1); }, 170000);
process.on('uncaughtException', e => { R.err.push(String(e && e.stack || e).slice(0, 400)); fin(1); });

require('./main.js');

app.whenReady().then(async () => {
  try {
    const master = await (async () => { let w; await until(() => (w = BrowserWindow.getAllWindows().find(x => x.webContents.getURL().startsWith('app://local/index.html')))); return w; })();
    ok('la app arranca y carga la página del máster por app://', !!master);
    master.webContents.on('console-message', (e, level, msg) => { const lv = e.level !== undefined ? e.level : level, m = e.message !== undefined ? e.message : msg; if (lv === 'error' || lv === 3) R.err.push('master: ' + String(m).slice(0, 200)); });
    ok('el máster tiene el puente con la ventana de la mesa', await until(() => ev(master, 'typeof msEnviar==="function"&&!!window.__AppShell&&!!window.__AppShell.mesa&&document.readyState==="complete"')));
    await wait(1500);

    // claves de Freesound y Jamendo: se guardan validadas en la carpeta de datos y con una clave falsa el servicio real la rechaza
    const est0 = await ev(master, 'window.__AppShell.sonidosWeb.estado()');
    ok('sin claves al principio', est0.freesound === false && est0.jamendo === false);
    ok('una clave con caracteres raros se rechaza', (await ev(master, 'window.__AppShell.sonidosWeb.guardarClave("freesound","<b>mala clave</b>")')) === false);
    ok('una clave válida se guarda', (await ev(master, 'window.__AppShell.sonidosWeb.guardarClave("freesound","CLAVEfalsa123456")')) === true && (await ev(master, 'window.__AppShell.sonidosWeb.estado()')).freesound === true);
    ok('la clave queda en la carpeta de datos y no en la página', fs.readFileSync(path.join(tmp, 'claves-sonido.json'), 'utf8').includes('CLAVEfalsa123456') && !(await ev(master, 'JSON.stringify(Object.keys(window.__AppShell.sonidosWeb))+document.documentElement.outerHTML.includes("CLAVEfalsa123456")')).includes('true'));
    const bus = await ev(master, 'window.__AppShell.sonidosWeb.buscar("freesound","lluvia",{soloCC0:true})');
    ok('con una clave falsa, Freesound la rechaza (o no hay red): nunca da resultados', bus.ok === false && ['clave', 'red'].includes(bus.error));
    await ev(master, 'window.__AppShell.sonidosWeb.guardarClave("freesound","")');
    ok('se puede borrar la clave', (await ev(master, 'window.__AppShell.sonidosWeb.estado()')).freesound === false);
    // escena con mapa calibrado, fichas, iniciativa horizontal y bandeja de dados
    await ev(master, `(async()=>{
      location.hash='#mesa';await new Promise(r=>setTimeout(r,900));
      const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const pj=state.factions.find(f=>f.pc),en=state.factions.find(f=>!f.pc);
      const mk=(n,f,sb)=>({id:uid(),name:n,factionId:f.id,init:null,initBonus:2,hp:10,maxHp:10,temp:0,ac:12,conds:[],notes:'',ds:0,df:0,tpl:null,used:{},uses:{},la:0,lr:0,ex:false,sb});
      state.creatures=[mk('Goblin',en,{n:'Goblin',tok:PNG,sz:'Small'}),mk('Ogro',en,{n:'Ogro',sz:'Large'}),mk('Lyra',pj)];
      sortInto(state);state.active=true;state.round=1;state.turnIdx=0;render();
      MS.capas=[];
      const m=msAnade('mapa');m.pantalla=100;m.celda=2.5;msTokNuevos(m,state.creatures.map(c=>({cid:c.id,n:c.name,color:fac(c.factionId).color,tam:c.name==='Ogro'?2:1})));
      msAnade('iniciativa',{x:2,y:76,w:96,h:22,orient:'h'});
      msAnade('dados',{x:60,y:8,w:38,h:50,fondo:''});
      MS.aspecto='auto';MS.fundido=0;
      msEnviar(false);return true;})()`);
    ok('«Enviar a la mesa» abre una ventana de verdad', await until(() => ventanas().length === 1));
    const w1 = ventanas()[0];
    ok('la mesa se abre con el telón bajado', await until(() => ev(w1, 'document.getElementById("telon").classList.contains("on")')));
    ok('la escena llega a la ventana y trae el mapa', await until(() => ev(w1, '!!document.querySelector(".capa.mapa .mtok")')));
    const geom = await ev(w1, `(()=>{const L=document.getElementById('lienzo').getBoundingClientRect(),t=[...document.querySelectorAll('.mtok')].map(k=>k.getBoundingClientRect().width),g=document.querySelector('.capa.mapa .mg');
      return {lw:L.width,lh:L.height,iw:innerWidth,ih:innerHeight,t,gs:g?parseFloat(getComputedStyle(g).backgroundSize):0,n:document.querySelectorAll('.mtok').length};})()`);
    const cel = geom.lw * 0.025;
    ok('«toda la ventana» llena la ventana real', Math.abs(geom.lw - geom.iw) < 2 && Math.abs(geom.lh - geom.ih) < 2);
    ok('las casillas miden 2,5 cm de una pantalla de 100 cm', Math.abs(geom.gs - cel) < 1);
    ok('tres fichas, una de dos casillas', geom.n === 3 && geom.t.some(w => Math.abs(w - 2 * cel) < 1.5) && geom.t.filter(w => Math.abs(w - cel) < 1.5).length === 2);

    // telón: subirlo
    await ev(master, 'mesaTelon(1)');
    ok('subir el telón lo quita', await until(() => ev(w1, 'getComputedStyle(document.getElementById("telon")).visibility==="hidden"')));
    ok('el orden en horizontal lleva a los tres combatientes', await until(() => ev(w1, 'document.querySelectorAll(".capa.iniciativa .hc").length===3')));

    // datos que no deben llegar: criatura oculta con PG, CA y debilidades inventados
    await ev(master, `window.__AppShell.mesa.enviar({tipo:'iniciativa',abrir:false,activo:true,ronda:2,lista:[
      {n:'Dragón secreto',oculto:true,actual:false,hp:999,ac:30,debilidades:['fuego'],tok:'data:image/png;base64,AAAA',color:'#ff0000'},
      {n:'Lyra',actual:true,hp:7,ac:18,color:'#3b82f6'}],cuenta:null,ventana:1})`);
    ok('la criatura oculta llega como «Enemigo oculto»', await until(() => ev(w1, '/Enemigo oculto/.test(document.querySelector(".capa.iniciativa").textContent)')));
    const txt = await ev(w1, 'document.body.innerText+document.body.innerHTML.length');
    ok('ni su nombre, ni sus PG, CA o debilidades están en la ventana', !/Dragón|999|fuego|debilidad/.test(String(txt)) && !(await ev(w1, '/Dragón|999|fuego/.test(document.documentElement.outerHTML)')));

    // dados 3D reales (dice-box con su wasm y sus workers por app://)
    await ev(master, 'window.__AppShell.mesa.enviar({tipo:"dados",notacion:"2d6+3",etiqueta:"Daño",ventana:1})');
    ok('los dados 3D se tiran y dan resultado en la ventana', await until(() => ev(w1, '/^\\d+$/.test((document.querySelector("#dres .tot")||{}).textContent||"")'), 45000));
    const tot = +(await ev(w1, 'document.querySelector("#dres .tot").textContent'));
    ok('el total es posible (2d6+3 = de 5 a 15)', tot >= 5 && tot <= 15);
    ok('el resultado vuelve al estudio del máster', await until(() => ev(master, '/2d6\\+3 = \\d+/.test((document.getElementById("ms-dres")||{}).textContent||"")'), 10000));
    ok('hay un lienzo WebGL de dados dentro del recuadro', await ev(w1, '!!document.querySelector("#dhost canvas")&&document.getElementById("dhost").getBoundingClientRect().width>0'));

    // sonido de ambiente de verdad: la ventana lo arranca sola (sin clic), y el telón lo silencia
    await ev(master, `(async()=>{msVentana(1);msAnade('ambiente',{efecto:'lluvia',intensidad:5,sonido:true,volumen:60});msEnviar(true);return true;})()`);
    ok('el ambiente con sonido arranca solo en la ventana real', await until(() => ev(w1, 'AMB.key==="lluvia|5"&&!!AMB.ctx&&AMB.ctx.state==="running"')));
    ok('suena (volumen del ambiente)', await until(() => ev(w1, 'AMB.gain.gain.value>0.1'), 8000));
    await ev(master, 'mesaTelon(1)');
    ok('con el telón bajado se silencia', await until(() => ev(w1, 'AMB.gain.gain.value<0.02'), 8000));
    await ev(master, 'mesaTelon(1)');
    ok('y al subirlo vuelve a sonar', await until(() => ev(w1, 'AMB.gain.gain.value>0.1'), 8000));
    ok('la lluvia se ve en la ventana', await ev(w1, 'document.querySelectorAll(".capa.ambiente.lluvia .p").length>50'));
    // sonido desde la carpeta de sonidos del usuario, servido por app://local/__audios/ (con rangos y en bucle)
    const wav = Buffer.alloc(44 + 4000, 128); wav.write('RIFF', 0); wav.writeUInt32LE(36 + 4000, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(8000, 28); wav.writeUInt16LE(1, 32); wav.writeUInt16LE(8, 34); wav.write('data', 36); wav.writeUInt32LE(4000, 40);   // medio segundo de silencio
    const sonidos = path.join(tmp, 'sonidos'); fs.mkdirSync(sonidos); fs.writeFileSync(path.join(sonidos, 'tono.wav'), wav); fs.writeFileSync(path.join(sonidos, 'notas.txt'), 'no es audio');
    fs.writeFileSync(path.join(tmp, 'audios.json'), JSON.stringify({ carpeta: sonidos }));
    ok('el máster ve la lista de su carpeta de sonidos (solo audios)', JSON.stringify(await ev(master, 'window.__AppShell.audios.lista()')) === '["tono.wav"]');
    await ev(master, `(async()=>{const c=MS.capas.find(c=>c.tipo==='ambiente');c.fuente='archivo';c.archivo='tono.wav';msEnviar(true);return true;})()`);
    ok('la ventana reproduce el archivo de la carpeta', await until(() => ev(w1, 'AMB.key==="audio|app://local/__audios/tono.wav"&&AMB.cur.el.readyState>=3&&!AMB.cur.el.paused')));
    ok('el archivo se repite en bucle', await until(() => ev(w1, `(()=>{const e=AMB.cur.el;window.__t=window.__t||[];window.__t.push(e.currentTime);return window.__t.some((v,i)=>i&&v<window.__t[i-1]);})()`), 12000));
    const rg = await ev(w1, `fetch('app://local/__audios/tono.wav',{headers:{Range:'bytes=0-9'}}).then(async r=>[r.status,(await r.arrayBuffer()).byteLength,r.headers.get('content-range')])`);
    ok('el servidor de sonidos admite rangos', rg[0] === 206 && rg[1] === 10 && rg[2] === 'bytes 0-9/4044');
    const rr = await ev(w1, `Promise.all(['app://local/__audios/notas.txt','app://local/__audios/..%2Fmain.js','app://local/__audios/no-existe.mp3'].map(u=>fetch(u).then(r=>r.status).catch(()=>-1)))`);
    ok('no sirve lo que no es audio, lo que se sale ni lo que no existe', rr.every(s => s === 404));
    ok('el volumen del archivo es el de la capa', Math.abs(await ev(w1, 'AMB.cur.el.volume') - 0.6) < 0.01);
    await ev(master, 'mesaTelon(1)');
    ok('el telón silencia el archivo', await until(() => ev(w1, 'AMB.cur.el.volume===0')));
    await ev(master, 'mesaTelon(1)');
    ok('y al subirlo vuelve', await until(() => ev(w1, 'AMB.cur.el.volume>0.5')));
    // segunda ventana con su propia escena
    await ev(master, `(async()=>{msVentana(2);MS.capas=[];msAnade('texto',{t:'Solo para la ventana 2'});MS.aspecto='16:9';MS.fundido=0;msEnviar(false);return true;})()`);
    ok('se abre una segunda ventana', await until(() => ventanas().length === 2));
    const w2 = ventanas().find(w => w !== w1);
    ok('cada ventana tiene su escena', await until(() => ev(w2, '/Solo para la ventana 2/.test(document.body.innerText)')) && !(await ev(w1, '/Solo para la ventana 2/.test(document.body.innerText)')));
    ok('la segunda ventana también se abre con el telón bajado', await until(() => ev(w2, 'document.getElementById("telon").classList.contains("on")')));
    await ev(master, 'mesaTelon("todas")');
    ok('«telón en todas» baja el de la ventana 1 y mantiene el de la 2', await until(() => ev(w1, 'document.getElementById("telon").classList.contains("on")')) && await ev(w2, 'document.getElementById("telon").classList.contains("on")'));
    await ev(master, 'mesaTelon("todas")');
    ok('y los sube todos', await until(() => ev(w1, 'getComputedStyle(document.getElementById("telon")).visibility==="hidden"')) && await until(() => ev(w2, 'getComputedStyle(document.getElementById("telon")).visibility==="hidden"')));

    // cerrar una ventana desde el máster
    await ev(master, 'window.__AppShell.mesa.cerrar(2)');
    ok('«Cerrar mesa» cierra solo esa ventana', await until(() => ventanas().length === 1 && ventanas()[0] === w1));
    await ev(master, 'window.__AppShell.mesa.cerrar(1)');
    ok('y la otra', await until(() => ventanas().length === 0));
  } catch (e) { R.err.push('flujo: ' + String(e && e.stack || e).slice(0, 500)); }
  fin(0);
});
