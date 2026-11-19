// Puente mínimo de la ventana de la mesa: solo recibe lo que el proceso principal ya validó.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('__Mesa', {
  onMostrar: cb => ipcRenderer.on('mesa:mostrar', (_e, p) => cb(p)),
  listo: () => ipcRenderer.send('mesa:listo'),
  pantallaCompleta: () => ipcRenderer.send('mesa:pantalla'),
});
