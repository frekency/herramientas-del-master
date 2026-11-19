// Almacén local de la app de escritorio: SQLite (node:sqlite, sin módulos nativos).
// Una tabla clave/valor con las mismas claves que usa la web en localStorage.
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const MAX_CLAVE = 200;
const MAX_VALOR = 20 * 1024 * 1024; // 20 MB por clave

function abrir(archivo) {
  fs.mkdirSync(path.dirname(archivo), { recursive: true });
  const db = new DatabaseSync(archivo);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA synchronous = NORMAL');
  db.exec(`CREATE TABLE IF NOT EXISTS kv (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL,
    actualizado INTEGER NOT NULL
  ) WITHOUT ROWID`);
  const sGet = db.prepare('SELECT valor FROM kv WHERE clave = ?');
  const sSet = db.prepare(`INSERT INTO kv (clave, valor, actualizado) VALUES (?, ?, ?)
    ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, actualizado = excluded.actualizado`);
  const sDel = db.prepare('DELETE FROM kv WHERE clave = ?');
  const sKeys = db.prepare('SELECT clave FROM kv ORDER BY clave');

  const clave = k => {
    if (typeof k !== 'string' || !k || k.length > MAX_CLAVE) throw new TypeError('clave no válida');
    return k;
  };

  return {
    get(k) { const r = sGet.get(clave(k)); return r ? r.valor : null; },
    set(k, v) {
      if (typeof v !== 'string' || v.length > MAX_VALOR) throw new TypeError('valor no válido');
      sSet.run(clave(k), v, Date.now());
    },
    remove(k) { sDel.run(clave(k)); },
    keys() { return sKeys.all().map(r => r.clave); },
    // Copia consistente de la base de datos (VACUUM INTO) y limpieza de las más antiguas
    copiaDeSeguridad(dir, conservar = 7) {
      fs.mkdirSync(dir, { recursive: true });
      const sello = new Date().toISOString().replace(/[:.]/g, '-');
      const destino = path.join(dir, `campanas-${sello}.db`);
      db.prepare('VACUUM INTO ?').run(destino);
      const viejas = fs.readdirSync(dir).filter(f => /^campanas-.*\.db$/.test(f)).sort().slice(0, -conservar);
      for (const f of viejas) fs.rmSync(path.join(dir, f), { force: true });
      return destino;
    },
    cerrar() { db.close(); },
  };
}

module.exports = { abrir };
