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
