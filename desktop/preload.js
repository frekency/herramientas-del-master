// Puente seguro entre la página y el almacén SQLite del proceso principal.
// Define window.__StoreBackend ANTES de que cargue la página: index.html lo usa en lugar de localStorage.
const { contextBridge, ipcRenderer } = require('electron');

const get = k => ipcRenderer.sendSync('store:get', k);
const set = (k, v) => { const r = ipcRenderer.sendSync('store:set', k, v); if (r !== true) throw new Error(r || 'no se pudo guardar'); };
const remove = k => { ipcRenderer.sendSync('store:remove', k); };
const keys = () => ipcRenderer.sendSync('store:keys');

// Migración única: los datos que ya hubiera en localStorage (de pruebas anteriores) pasan a SQLite.
// El token de sesión de Supabase (sb-…) lo gestiona la propia librería y se queda donde está.
try {
  if (get('__migrado_localstorage') === null) {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && !k.startsWith('sb-') && get(k) === null) set(k, localStorage.getItem(k));
    }
    set('__migrado_localstorage', String(Date.now()));
  }
} catch (e) { /* si falla, la página arranca igualmente con lo que haya */ }

contextBridge.exposeInMainWorld('__StoreBackend', { get, set, remove, keys });

// Marca a la página como app de escritorio (activa el modo app) y le deja pintar los botones de la ventana
contextBridge.exposeInMainWorld('__AppShell', {
  platform: process.platform,
  titlebar: (bg, fg) => ipcRenderer.send('shell:titlebar', String(bg), String(fg)),
  // Copias de seguridad automáticas en la carpeta que elija la persona
  copias: {
    carpeta: () => ipcRenderer.invoke('copias:carpeta'),
    elegir: () => ipcRenderer.invoke('copias:elegir'),
    guardar: texto => ipcRenderer.invoke('copias:guardar', String(texto)),
  },
  // Carpeta de imágenes de criaturas (tokens y ambientaciones)
  imagenes: {
    carpeta: () => ipcRenderer.invoke('imagenes:carpeta'),
    elegir: () => ipcRenderer.invoke('imagenes:elegir'),
  },
  // Actualizaciones de la app (GitHub Releases)
  actualizar: {
    estado: () => ipcRenderer.invoke('update:estado'),
    buscar: () => ipcRenderer.send('update:buscar'),
    instalar: () => ipcRenderer.send('update:instalar'),
    abrir: () => ipcRenderer.send('update:abrir'),
    onEstado: cb => ipcRenderer.on('update:estado', (_e, x) => cb(x)),
  },
  // Inicio de sesión en el navegador del sistema (Discord): abre la dirección y recibe el retorno por enlace propio
  auth: {
    abrir: url => ipcRenderer.invoke('auth:abrir', String(url)),
    pendiente: () => ipcRenderer.invoke('auth:pendiente'),
    onRetorno: cb => ipcRenderer.on('auth:retorno', (_e, r) => cb(r)),
  },
  // Ventana de la mesa (la que ven los jugadores)
  mesa: {
    abrir: () => ipcRenderer.send('mesa:abrir'),
    cerrar: () => ipcRenderer.send('mesa:cerrar'),
    enviar: x => ipcRenderer.send('mesa:enviar', x),
    onEstado: cb => ipcRenderer.on('mesa:estado', (_e, v) => cb(!!v)),
  },
});
