const { app, BrowserWindow, protocol, net, shell, Menu, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { Readable } = require('node:stream');
const { pathToFileURL } = require('node:url');
const { abrir } = require('./store');
const { validar } = require('./mesa');
const copias = require('./copias');
const auth = require('./auth');
const actualizador = require('./updater');

const APP_DIR = path.join(__dirname, 'app');
const imagenes = require('./imagenes');
const audios = require('./audios');
const sonidosWeb = require('./sonidos-web');
let almacen = null;

// Protocolo propio: permite fetch() de los JSON y un origen estable
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

// Solo un proceso a la vez: dos ventanas sobre la misma base de datos se pisarían
if (!app.requestSingleInstanceLock()) app.quit();

function crearVentana() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'Herramientas del Máster',
    icon: path.join(__dirname, 'build', 'icon.png'),
    backgroundColor: '#141414',
    // Barra de título propia: la página dibuja la suya y Electron pone solo los botones de la ventana
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#1d1915', symbolColor: '#ece3d2', height: 36 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  master = win;
  win.loadURL('app://local/index.html');

  // Enlaces externos al navegador del sistema
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('app://')) { e.preventDefault(); if (/^https?:/i.test(url)) shell.openExternal(url); }
  });
}

// Color de los botones de la ventana (Windows/Linux): lo manda la página según el tema
ipcMain.on('shell:titlebar', (e, bg, fg) => {
  const ok = c => typeof c === 'string' && /^#[0-9a-f]{3,8}$/i.test(c);
  const w = BrowserWindow.fromWebContents(e.sender);
  if (w && e.senderFrame && e.senderFrame.url.startsWith('app://local/') && ok(bg) && ok(fg) && w.setTitleBarOverlay) {
    try { w.setTitleBarOverlay({ color: bg, symbolColor: fg, height: 36 }); } catch { /* macOS no lo admite */ }
  }
});

// Ventanas de la mesa: las que ven los jugadores (hasta 8, cada una con su escena y su telón). Las abre el máster.
const MAX_VENTANAS = 8;
const mesas = new Map();   // id → { win, lista, ultimoMesa, ultimoTelon }
let ultimaIni = null, ultimoCuentas = { tipo: 'cuentas', lista: [] }, master = null;
const TELON_OFF = { tipo: 'telon', activo: false, texto: '' };
const idVentana = n => (Number.isInteger(n) && n >= 1 && n <= MAX_VENTANAS ? n : 1);
const viva = m => !!(m && m.win && !m.win.isDestroyed());
const abiertas = () => [...mesas.entries()].filter(([, m]) => viva(m)).map(([i]) => i).sort((a, b) => a - b);
const avisarMesa = () => {
  if (master && !master.isDestroyed()) master.webContents.send('mesa:estado', abiertas());
};
const delMaster = e => e.senderFrame && e.senderFrame.url.startsWith('app://local/index.html');
const mandar = (m, v) => { if (viva(m) && m.lista) m.win.webContents.send('mesa:mostrar', v); };
const dePagina = sender => [...mesas.entries()].find(([, m]) => viva(m) && m.win.webContents === sender) || null;
function abrirMesa(id) {
  let m = mesas.get(id);
  if (viva(m)) { if (m.win.isMinimized()) m.win.restore(); m.win.show(); m.win.focus(); return; }
  m = { win: null, lista: false, ultimoMesa: { tipo: 'limpiar' }, ultimoTelon: TELON_OFF };
  mesas.set(id, m);
  const desp = (id - 1) * 32;
  m.win = new BrowserWindow({
    width: 1280, height: 720, title: 'Mesa ' + id, backgroundColor: '#0b0a09', autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'mesa-preload.js'), contextIsolation: true, sandbox: true, nodeIntegration: false, autoplayPolicy: 'no-user-gesture-required' },   // el sonido de ambiente arranca solo con la escena
  });
  if (desp) { const [x, y] = m.win.getPosition(); m.win.setPosition(x + desp, y + desp); }
  m.win.setMenu(null);
  m.win.loadURL('app://local/mesa.html');
  m.win.on('closed', () => { m.win = null; m.lista = false; m.ultimoTelon = TELON_OFF; avisarMesa(); });
  avisarMesa();
}
function registrarMesa() {
  ipcMain.on('mesa:abrir', (e, n) => { if (delMaster(e)) abrirMesa(idVentana(n)); });
  ipcMain.on('mesa:cerrar', (e, n) => {
    if (!delMaster(e)) return;
    const ids = n === 'todas' ? abiertas() : [idVentana(n)];
    for (const i of ids) { const m = mesas.get(i); if (viva(m)) m.win.close(); }
  });
  ipcMain.on('mesa:enviar', (e, p) => {
    if (!delMaster(e)) return;
    const v = validar(p);
    if (!v) return;
    const todas = p && p.ventana === 'todas';
    const id = idVentana(p && p.ventana);
    const destinos = todas ? abiertas() : [id];
    if (v.tipo === 'dados') {
      // una tirada es un hecho puntual: no sustituye lo que se está viendo ni se recuerda al reabrir la ventana
      mandar(mesas.get(id), v);
      return;
    }
    if (v.tipo === 'telon') {
      // el telón tapa la mesa mientras el máster cambia cosas por debajo; se recuerda al reabrir la ventana
      for (const i of destinos) { const m = mesas.get(i); if (m) { m.ultimoTelon = v; mandar(m, v); } }
      return;
    }
    if (v.tipo === 'cuentas') {
      // las cuentas atrás van aparte: se superponen a lo que haya y no lo sustituyen (a todas las ventanas)
      ultimoCuentas = v;
      for (const i of abiertas()) mandar(mesas.get(i), v);
      return;
    }
    if (v.tipo === 'iniciativa') {
      ultimaIni = v;
      if (v.abrir) {
        // el orden de iniciativa solo abre la ventana la primera vez que el máster lo pide; después se limita a actualizarla
        if (!viva(mesas.get(id))) abrirMesa(id);
        const m = mesas.get(id);
        m.ultimoMesa = v;
        mandar(m, v);
        return;
      }
      // dentro de una escena la iniciativa es una capa que solo necesita sus datos
      for (const i of abiertas()) {
        const m = mesas.get(i);
        if (!(m.ultimoMesa && m.ultimoMesa.tipo === 'escena')) m.ultimoMesa = v;
        mandar(m, v);
      }
      return;
    }
    // lo que se está viendo en una ventana: escena, imagen, aviso o nada
    for (const i of destinos) {
      if (todas && !viva(mesas.get(i))) continue;
      if (!viva(mesas.get(i)) && (v.tipo === 'imagen' || v.tipo === 'escena')) abrirMesa(i);
      const m = mesas.get(i);
      if (!m) continue;
      m.ultimoMesa = v;
      mandar(m, v);
    }
  });
  // el resultado de la tirada vuelve al máster: solo cifras y una etiqueta corta
  ipcMain.on('mesa:resultado', (e, r) => {
    const d = dePagina(e.sender);
    if (!d || !master || master.isDestroyed()) return;
    if (!r || typeof r !== 'object' || !Number.isFinite(r.total) || !Array.isArray(r.dados)) return;
    master.webContents.send('mesa:resultado', { ventana: d[0], notacion: String(r.notacion || '').slice(0, 60), total: Math.trunc(r.total), dados: r.dados.slice(0, 20).map(Number).filter(Number.isFinite), mod: Number.isFinite(r.mod) ? Math.trunc(r.mod) : 0 });
  });
  ipcMain.on('mesa:listo', e => {
    const d = dePagina(e.sender);
    if (!d) return;
    const m = d[1];
    m.lista = true;
    mandar(m, m.ultimoMesa);
    if (ultimaIni && m.ultimoMesa.tipo === 'escena') mandar(m, ultimaIni);
    mandar(m, ultimoCuentas);
    if (m.ultimoTelon.activo) mandar(m, m.ultimoTelon);
  });
  ipcMain.on('mesa:pantalla', e => {
    const d = dePagina(e.sender);
    if (d) d[1].win.setFullScreen(!d[1].win.isFullScreen());
  });
}

// IPC síncrono del almacén: solo acepta peticiones de nuestra propia página
function registrarAlmacen() {
  const propio = e => e.senderFrame && e.senderFrame.url.startsWith('app://local/');
  ipcMain.on('store:get', (e, k) => {
    try { e.returnValue = propio(e) ? almacen.get(k) : null; } catch { e.returnValue = null; }
  });
  ipcMain.on('store:set', (e, k, v) => {
    try { if (!propio(e)) throw new Error('origen no permitido'); almacen.set(k, v); e.returnValue = true; }
    catch (err) { e.returnValue = String(err.message || err); }
  });
  ipcMain.on('store:keys', e => {
    try { e.returnValue = propio(e) ? almacen.keys() : []; } catch { e.returnValue = []; }
  });
  ipcMain.on('store:remove', (e, k) => {
    try { if (propio(e)) almacen.remove(k); } catch { /* clave no válida */ }
    e.returnValue = true;
  });
}

// Copias de seguridad automáticas: la carpeta solo se elige con el diálogo del sistema y la página únicamente entrega el texto de la copia
function registrarCopias() {
  const propio = e => e.senderFrame && e.senderFrame.url.startsWith('app://local/');
  const cfg = () => path.join(app.getPath('userData'), 'copias.json');
  ipcMain.handle('copias:carpeta', e => (propio(e) ? copias.leerConfig(cfg()).carpeta || '' : ''));
  ipcMain.handle('copias:elegir', async e => {
    if (!propio(e)) return '';
    const r = await dialog.showOpenDialog(BrowserWindow.fromWebContents(e.sender), { properties: ['openDirectory', 'createDirectory'] });
    if (r.canceled || !r.filePaths[0]) return '';
    copias.guardarConfig(cfg(), { carpeta: r.filePaths[0] });
    return r.filePaths[0];
  });
  ipcMain.handle('copias:guardar', (e, texto) => (propio(e) ? copias.escribir(copias.leerConfig(cfg()).carpeta, texto, Date.now()) : { ok: false, error: 'origen' }));
}

// Carpeta de imágenes de criaturas: solo se elige con el diálogo del sistema; la página recibe únicamente tok/, img/ e index.json
function registrarImagenes() {
  const propio = e => e.senderFrame && e.senderFrame.url.startsWith('app://local/');
  ipcMain.handle('imagenes:carpeta', e => (propio(e) ? imagenes.leerConfig(cfgImagenes()).carpeta || '' : ''));
  ipcMain.handle('imagenes:elegir', async e => {
    if (!propio(e)) return '';
    const r = await dialog.showOpenDialog(BrowserWindow.fromWebContents(e.sender), { properties: ['openDirectory'] });
    if (r.canceled || !r.filePaths[0]) return '';
    imagenes.guardarConfig(cfgImagenes(), { carpeta: r.filePaths[0] });
    return r.filePaths[0];
  });
}
const cfgImagenes = () => path.join(app.getPath('userData'), 'imagenes.json');

// Carpeta de sonidos del usuario: se elige con el diálogo del sistema; la página solo recibe la lista de nombres y los archivos se sirven por app://local/__audios/
const cfgAudios = () => path.join(app.getPath('userData'), 'audios.json');
function registrarAudios() {
  const propio = e => e.senderFrame && e.senderFrame.url.startsWith('app://local/');
  ipcMain.handle('audios:carpeta', e => (propio(e) ? audios.leerConfig(cfgAudios()).carpeta || '' : ''));
  ipcMain.handle('audios:lista', e => (propio(e) ? audios.listar(audios.leerConfig(cfgAudios()).carpeta) : []));
  ipcMain.handle('audios:elegir', async e => {
    if (!propio(e)) return '';
    const r = await dialog.showOpenDialog(BrowserWindow.fromWebContents(e.sender), { properties: ['openDirectory'] });
    if (r.canceled || !r.filePaths[0]) return '';
    audios.guardarConfig(cfgAudios(), { carpeta: r.filePaths[0] });
    return r.filePaths[0];
  });
}
// Búsqueda de sonidos en Freesound y Jamendo con la clave del propio usuario: la clave queda aquí (nunca en las escenas ni en la página)
const cfgClaves = () => path.join(app.getPath('userData'), 'claves-sonido.json');
function registrarSonidosWeb() {
  const propio = e => e.senderFrame && e.senderFrame.url.startsWith('app://local/');
  ipcMain.handle('sonidos:estado', e => (propio(e) ? { freesound: sonidosWeb.tieneClave(cfgClaves(), 'freesound'), jamendo: sonidosWeb.tieneClave(cfgClaves(), 'jamendo') } : {}));
  ipcMain.handle('sonidos:clave', (e, prov, valor) => {
    if (!propio(e)) return false;
    try { sonidosWeb.guardarClave(cfgClaves(), String(prov), valor); return true; } catch { return false; }
  });
  ipcMain.handle('sonidos:buscar', (e, prov, consulta, op) => {
    if (!propio(e)) return { ok: false, error: 'origen' };
    return sonidosWeb.buscar(String(prov), consulta, sonidosWeb.leerClaves(cfgClaves())[prov], { soloCC0: !op || op.soloCC0 !== false }, (u, o) => net.fetch(u, o));
  });
}
const TIPOS_AUDIO = { '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.oga': 'audio/ogg', '.opus': 'audio/ogg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.flac': 'audio/flac',
  '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.webm': 'video/webm', '.ogv': 'video/ogg', '.gif': 'image/gif', '.webp': 'image/webp', '.png': 'image/png', '.apng': 'image/apng', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.avif': 'image/avif' };
// Sirve un audio con soporte de rangos (el reproductor salta al principio para repetir en bucle)
function servirAudio(req, f) {
  let st;
  try { st = fs.statSync(f); } catch { return new Response('No encontrado', { status: 404 }); }
  if (!st.isFile()) return new Response('No encontrado', { status: 404 });
  let ini = 0, fin = st.size - 1, estado = 200;
  const r = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') || '');
  if (r && (r[1] !== '' || r[2] !== '')) {
    if (r[1] === '') { ini = Math.max(0, st.size - Number(r[2])); }
    else { ini = Number(r[1]); if (r[2] !== '') fin = Math.min(fin, Number(r[2])); }
    if (ini > fin || ini >= st.size) return new Response(null, { status: 416, headers: { 'content-range': 'bytes */' + st.size } });
    estado = 206;
  }
  const h = { 'content-type': TIPOS_AUDIO[path.extname(f).toLowerCase()] || 'application/octet-stream', 'accept-ranges': 'bytes', 'content-length': String(fin - ini + 1) };
  if (estado === 206) h['content-range'] = `bytes ${ini}-${fin}/${st.size}`;
  if (st.size === 0) return new Response(null, { status: 200, headers: { 'content-type': h['content-type'] } });
  return new Response(Readable.toWeb(fs.createReadStream(f, { start: ini, end: fin })), { status: estado, headers: h });
}

app.whenReady().then(() => {
  almacen = abrir(path.join(app.getPath('userData'), 'campanas.db'));
  try { almacen.copiaDeSeguridad(path.join(app.getPath('userData'), 'copias')); } catch (e) { console.error('copia de seguridad:', e.message); }
  registrarAlmacen();
  registrarMesa();
  registrarCopias();
  registrarImagenes();
  registrarAudios();
  registrarSonidosWeb();

  protocol.handle('app', async req => {
    const { pathname } = new URL(req.url);
    if (pathname.startsWith(audios.PREFIJO)) {
      const f = audios.rutaAudio(audios.leerConfig(cfgAudios()).carpeta, pathname);
      return f ? servirAudio(req, f) : new Response('No encontrado', { status: 404 });
    }
    if (pathname.startsWith(imagenes.PREFIJO)) {
      const f = imagenes.rutaImagen(imagenes.leerConfig(cfgImagenes()).carpeta, pathname);
      return f ? net.fetch(pathToFileURL(f).toString()) : new Response('No encontrado', { status: 404 });
    }
    const rel = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
    const file = path.normalize(path.join(APP_DIR, rel));
    if (!file.startsWith(APP_DIR + path.sep)) return new Response('Prohibido', { status: 403 });
    const resp = await net.fetch(pathToFileURL(file).toString());
    // los módulos de JavaScript y el WebAssembly (dados 3D de la mesa) exigen su tipo: así no dependen del sistema
    const tipo = { '.js': 'text/javascript', '.wasm': 'application/wasm', '.css': 'text/css', '.json': 'application/json' }[path.extname(file).toLowerCase()];
    return tipo ? new Response(resp.body, { status: resp.status, headers: { 'content-type': tipo } }) : resp;
  });

  if (process.platform !== 'darwin') Menu.setApplicationMenu(null);
  crearVentana();
  try {
    actualizador.registrar({ app, ipcMain, shell, ventana: () => master, pkg: require('./package.json'), autoUpdater: require('electron-updater').autoUpdater });
  } catch (e) { console.error('actualizaciones:', e.message); }
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) crearVentana(); });
});

// Retorno del inicio de sesión (Discord…): llega como enlace herramientasdelmaster://auth?code=…
let retornoPendiente = null;
function procesarRetorno(url) {
  const r = auth.leerRetorno(url);
  if (!r) return;
  const w = BrowserWindow.getAllWindows().find(x => x !== mesa) || BrowserWindow.getAllWindows()[0];
  if (w && !w.isDestroyed() && !w.webContents.isLoading()) { w.webContents.send('auth:retorno', r); retornoPendiente = null; } else retornoPendiente = r;
  if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
}
if (process.defaultApp) { if (process.argv.length >= 2) app.setAsDefaultProtocolClient(auth.PROTOCOLO, process.execPath, [path.resolve(process.argv[1])]); }
else app.setAsDefaultProtocolClient(auth.PROTOCOLO);
app.on('open-url', (e, url) => { e.preventDefault(); procesarRetorno(url); });   // macOS
ipcMain.handle('auth:abrir', (e, url) => {
  if (!delMaster(e) || !auth.esUrlDeAutorizacion(url)) return false;
  shell.openExternal(url); return true;
});
ipcMain.handle('auth:pendiente', e => { if (!delMaster(e)) return null; const r = retornoPendiente; retornoPendiente = null; return r; });

app.on('second-instance', (_e, argv) => {
  const u = auth.urlDeArgv(argv);
  if (u) { procesarRetorno(u); return; }
  const w = BrowserWindow.getAllWindows()[0];
  if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
});

app.on('before-quit', () => { try { almacen && almacen.cerrar(); } catch { /* ya cerrado */ } almacen = null; });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
