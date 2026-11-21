// Copias de seguridad automáticas: la página entrega el texto de la copia y aquí se escribe en la carpeta que la persona eligió.
// Solo se escribe con nombres propios (hdm-copia-AAAA-MM-DD_HHMMSS.json) y solo se borran, para conservar las últimas, archivos con ese mismo nombre.
const fs = require('node:fs');
const path = require('node:path');

const MAX_COPIAS = 30;
const MAX_BYTES = 100 * 1024 * 1024;
const PATRON = /^hdm-copia-\d{4}-\d{2}-\d{2}_\d{6}\.json$/;

function nombre(ahora) {
  const d = new Date(ahora), p = n => String(n).padStart(2, '0');
  return `hdm-copia-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.json`;
}

function leerConfig(archivo) {
  try { const o = JSON.parse(fs.readFileSync(archivo, 'utf8')); return o && typeof o === 'object' && typeof o.carpeta === 'string' ? { carpeta: o.carpeta } : {}; } catch { return {}; }
}
function guardarConfig(archivo, cfg) {
  fs.mkdirSync(path.dirname(archivo), { recursive: true });
  fs.writeFileSync(archivo, JSON.stringify({ carpeta: String(cfg.carpeta || '') }));
}

// Devuelve {ok:true, archivo, ruta} o {ok:false, error}
function escribir(dir, texto, ahora, max = MAX_COPIAS) {
  if (typeof texto !== 'string' || !texto || Buffer.byteLength(texto) > MAX_BYTES) return { ok: false, error: 'texto' };
  if (!texto.slice(0, 300).includes('herramientas-del-master/copia')) return { ok: false, error: 'formato' };
  try { if (!dir || !fs.statSync(dir).isDirectory()) return { ok: false, error: 'sin_carpeta' }; } catch { return { ok: false, error: 'sin_carpeta' }; }
  const archivo = nombre(ahora), ruta = path.join(dir, archivo), tmp = ruta + '.tmp';
  try {
    fs.writeFileSync(tmp, texto);
    fs.renameSync(tmp, ruta);
  } catch (e) { try { fs.rmSync(tmp, { force: true }); } catch { /* nada */ } return { ok: false, error: 'escritura' }; }
  try {
    const propias = fs.readdirSync(dir).filter(f => PATRON.test(f)).sort();
    for (const f of propias.slice(0, Math.max(0, propias.length - max))) fs.rmSync(path.join(dir, f), { force: true });
  } catch { /* la copia ya está escrita; limpiar es secundario */ }
  return { ok: true, archivo, ruta };
}

module.exports = { nombre, leerConfig, guardarConfig, escribir, PATRON, MAX_COPIAS };
