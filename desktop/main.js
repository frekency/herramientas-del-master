const { app, BrowserWindow, protocol, net, shell, Menu, ipcMain, dialog } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { abrir } = require('./store');
const { validar } = require('./mesa');
const copias = require('./copias');
const auth = require('./auth');
const actualizador = require('./updater');

const APP_DIR = path.join(__dirname, 'app');
const imagenes = require('./imagenes');
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

// Ventana de la mesa: la que ven los jugadores (imágenes y orden de iniciativa). La abre el máster.
let mesa = null, mesaLista = false, ultimoMesa = { tipo: 'limpiar' }, ultimaIni = null, ultimoCuentas = { tipo: 'cuentas', lista: [] }, master = null;
const avisarMesa = () => {
  if (master && !master.isDestroyed()) master.webContents.send('mesa:estado', !!(mesa && !mesa.isDestroyed()));
};
const delMaster = e => e.senderFrame && e.senderFrame.url.startsWith('app://local/index.html');
function abrirMesa() {
  if (mesa && !mesa.isDestroyed()) { if (mesa.isMinimized()) mesa.restore(); mesa.show(); mesa.focus(); return; }
  mesaLista = false;
  mesa = new BrowserWindow({
    width: 1280, height: 720, title: 'Mesa', backgroundColor: '#0b0a09', autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'mesa-preload.js'), contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  mesa.setMenu(null);
  mesa.loadURL('app://local/mesa.html');
  mesa.on('closed', () => { mesa = null; mesaLista = false; avisarMesa(); });
  avisarMesa();
}
function registrarMesa() {
  ipcMain.on('mesa:abrir', e => { if (delMaster(e)) abrirMesa(); });
  ipcMain.on('mesa:cerrar', e => { if (delMaster(e) && mesa && !mesa.isDestroyed()) mesa.close(); });
  ipcMain.on('mesa:enviar', (e, p) => {
    if (!delMaster(e)) return;
    const v = validar(p);
    if (!v) return;
    if (v.tipo === 'dados') {
      // una tirada es un hecho puntual: no sustituye lo que se está viendo ni se recuerda al reabrir la ventana
      if (mesa && !mesa.isDestroyed() && mesaLista) mesa.webContents.send('mesa:mostrar', v);
      return;
    }
    if (v.tipo === 'cuentas') {
      // las cuentas atrás van aparte: se superponen a lo que haya y no lo sustituyen
      ultimoCuentas = v;
      if (mesa && !mesa.isDestroyed() && mesaLista) mesa.webContents.send('mesa:mostrar', v);
      return;
    }
    // lo que se está viendo (escena, imagen, aviso, iniciativa o nada) y, aparte, los últimos datos de iniciativa:
    // dentro de una escena la iniciativa es una capa que solo necesita sus datos
    if (v.tipo === 'iniciativa') ultimaIni = v;
    if (v.tipo !== 'iniciativa' || v.abrir || !(ultimoMesa && ultimoMesa.tipo === 'escena')) ultimoMesa = v;
    const abierta = mesa && !mesa.isDestroyed();
    // el orden de iniciativa solo abre la ventana la primera vez que el máster lo pide; después se limita a actualizarla
    if (!abierta && (v.tipo === 'imagen' || v.tipo === 'escena' || (v.tipo === 'iniciativa' && v.abrir))) abrirMesa();
    if (mesa && !mesa.isDestroyed() && mesaLista) mesa.webContents.send('mesa:mostrar', v);
  });
  // el resultado de la tirada vuelve al máster: solo cifras y una etiqueta corta
  ipcMain.on('mesa:resultado', (e, r) => {
    if (!mesa || mesa.isDestroyed() || e.sender !== mesa.webContents || !master || master.isDestroyed()) return;
    if (!r || typeof r !== 'object' || !Number.isFinite(r.total) || !Array.isArray(r.dados)) return;
    master.webContents.send('mesa:resultado', { notacion: String(r.notacion || '').slice(0, 60), total: Math.trunc(r.total), dados: r.dados.slice(0, 20).map(Number).filter(Number.isFinite), mod: Number.isFinite(r.mod) ? Math.trunc(r.mod) : 0 });
  });
  ipcMain.on('mesa:listo', e => {
    if (!mesa || mesa.isDestroyed() || e.sender !== mesa.webContents) return;
    mesaLista = true;
    mesa.webContents.send('mesa:mostrar', ultimoMesa);
    if (ultimaIni && ultimoMesa.tipo === 'escena') mesa.webContents.send('mesa:mostrar', ultimaIni);
    mesa.webContents.send('mesa:mostrar', ultimoCuentas);
  });
  ipcMain.on('mesa:pantalla', e => {
    if (mesa && !mesa.isDestroyed() && e.sender === mesa.webContents) mesa.setFullScreen(!mesa.isFullScreen());
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

app.whenReady().then(() => {
  almacen = abrir(path.join(app.getPath('userData'), 'campanas.db'));
  try { almacen.copiaDeSeguridad(path.join(app.getPath('userData'), 'copias')); } catch (e) { console.error('copia de seguridad:', e.message); }
  registrarAlmacen();
  registrarMesa();
  registrarCopias();
  registrarImagenes();

  protocol.handle('app', async req => {
    const { pathname } = new URL(req.url);
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
