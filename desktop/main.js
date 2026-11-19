const { app, BrowserWindow, protocol, net, shell, Menu, ipcMain } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { abrir } = require('./store');

const APP_DIR = path.join(__dirname, 'app');
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

app.whenReady().then(() => {
  almacen = abrir(path.join(app.getPath('userData'), 'campanas.db'));
  try { almacen.copiaDeSeguridad(path.join(app.getPath('userData'), 'copias')); } catch (e) { console.error('copia de seguridad:', e.message); }
  registrarAlmacen();

  protocol.handle('app', req => {
    const { pathname } = new URL(req.url);
    const rel = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
    const file = path.normalize(path.join(APP_DIR, rel));
    if (!file.startsWith(APP_DIR + path.sep)) return new Response('Prohibido', { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });

  if (process.platform !== 'darwin') Menu.setApplicationMenu(null);
  crearVentana();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) crearVentana(); });
});

app.on('second-instance', () => {
  const w = BrowserWindow.getAllWindows()[0];
  if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
});

app.on('before-quit', () => { try { almacen && almacen.cerrar(); } catch { /* ya cerrado */ } almacen = null; });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
