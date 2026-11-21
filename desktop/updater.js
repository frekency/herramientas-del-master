// Actualizaciones de la app de escritorio desde GitHub Releases (electron-updater).
//  - Windows (instalador): se descarga sola y se instala al cerrar la app.
//  - Portable y macOS sin firmar: solo se avisa y se abre la página de la versión (no pueden reemplazarse a sí mismos).
const PENDIENTE = 'PENDIENTE';

// Repositorio de las versiones, leído de build.publish del package.json. Sin repositorio real no se busca nada.
function config(pkg) {
  // electron-builder quita «build» del package.json empaquetado: el repositorio también va en «actualizaciones», que sí se conserva
  const p = pkg && (pkg.actualizaciones || (pkg.build && pkg.build.publish));
  const g = Array.isArray(p) ? p[0] : p;
  if (!g || (g.provider || 'github') !== 'github') return null;
  const ok = s => typeof s === 'string' && /^[A-Za-z0-9._-]{1,100}$/.test(s) && s !== PENDIENTE;
  return ok(g.owner) && ok(g.repo) ? { owner: g.owner, repo: g.repo } : null;
}

// auto: descarga e instala sola; aviso: solo informa y enlaza; ninguno: no se busca
function modo({ platform, portable, empaquetada }) {
  if (!empaquetada) return 'ninguno';
  if (portable || platform === 'darwin') return 'aviso';
  return 'auto';
}

const urlVersion = (cfg, version) => `https://github.com/${cfg.owner}/${cfg.repo}/releases/${/^[0-9][0-9A-Za-z.+-]{0,40}$/.test(String(version)) ? 'tag/v' + version : 'latest'}`;

// Estado que ve la página (sin detalles internos)
const estado = (e, extra = {}) => ({ estado: e, ...extra });

function registrar({ app, ipcMain, ventana, shell, pkg, autoUpdater, env = process.env, platform = process.platform }) {
  const cfg = config(pkg);
  const m = modo({ platform, portable: !!env.PORTABLE_EXECUTABLE_FILE, empaquetada: app.isPackaged });
  let ultimo = estado(cfg && m !== 'ninguno' ? 'inactivo' : 'sin-configurar');
  const enviar = x => { ultimo = x; const w = ventana(); if (w && !w.isDestroyed()) w.webContents.send('update:estado', x); };

  if (cfg && m !== 'ninguno') {
    autoUpdater.autoDownload = m === 'auto';
    autoUpdater.autoInstallOnAppQuit = m === 'auto';
    autoUpdater.allowPrerelease = false;
    autoUpdater.setFeedURL({ provider: 'github', owner: cfg.owner, repo: cfg.repo });
    autoUpdater.on('checking-for-update', () => enviar(estado('buscando')));
    autoUpdater.on('update-not-available', () => enviar(estado('al-dia')));
    autoUpdater.on('update-available', i => enviar(estado(m === 'auto' ? 'descargando' : 'aviso', { version: String(i && i.version || '') })));
    autoUpdater.on('update-downloaded', i => enviar(estado('lista', { version: String(i && i.version || '') })));
    autoUpdater.on('error', () => enviar(estado('error')));
  }
  const buscar = () => { if (cfg && m !== 'ninguno') autoUpdater.checkForUpdates().catch(() => enviar(estado('error'))); else enviar(ultimo); };

  ipcMain.handle('update:estado', () => ultimo);
  ipcMain.on('update:buscar', buscar);
  ipcMain.on('update:instalar', () => { if (ultimo.estado === 'lista') autoUpdater.quitAndInstall(); });
  ipcMain.on('update:abrir', () => { if (cfg) shell.openExternal(urlVersion(cfg, ultimo.version)); });
  // Al arrancar (con la ventana ya cargada) y cada 6 horas
  if (cfg && m !== 'ninguno') { setTimeout(buscar, 15000); setInterval(buscar, 6 * 3600 * 1000).unref(); }
}

module.exports = { PENDIENTE, config, modo, urlVersion, registrar };
