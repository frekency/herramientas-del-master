'use strict';
// Carpeta de sonidos del usuario (uso personal): app://local/__audios/<archivo>. Solo se sirven archivos de audio de esa carpeta, sin subcarpetas.
const path = require('path');
const fs = require('fs');

const PREFIJO = '/__audios/';
const NOMBRE = /^[^\\/:*?"<>|\u0000-\u001f]{1,120}\.(?:mp3|ogg|oga|opus|wav|m4a|aac|flac)$/i;

// Ruta real del archivo pedido o null si no es una petición válida (un solo nivel, nombre y extensión de audio, sin salirse de la carpeta)
function rutaAudio(carpeta, pathname) {
  if (!carpeta || typeof pathname !== 'string' || !pathname.startsWith(PREFIJO)) return null;
  let rel;
  try { rel = decodeURIComponent(pathname.slice(PREFIJO.length)); } catch { return null; }
  if (!NOMBRE.test(rel) || rel.startsWith('.') || rel.includes('..')) return null;
  const base = path.resolve(carpeta), f = path.resolve(base, rel);
  return f.startsWith(base + path.sep) ? f : null;
}

// Nombres de los archivos de audio de la carpeta (hasta 500, ordenados)
function listar(carpeta) {
  if (!carpeta) return [];
  try {
    return fs.readdirSync(carpeta, { withFileTypes: true }).filter(e => e.isFile() && NOMBRE.test(e.name) && !e.name.startsWith('.')).map(e => e.name)
      .sort((a, b) => a.localeCompare(b, 'es')).slice(0, 500);
  } catch { return []; }
}

function leerConfig(f) { try { const c = JSON.parse(fs.readFileSync(f, 'utf8')); return c && typeof c === 'object' ? c : {}; } catch { return {}; } }
function guardarConfig(f, c) { fs.writeFileSync(f, JSON.stringify(c)); }

module.exports = { rutaAudio, listar, leerConfig, guardarConfig, PREFIJO, NOMBRE };
