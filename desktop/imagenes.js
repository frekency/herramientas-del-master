'use strict';
// Carpeta de imágenes de criaturas (uso personal): app://local/__imagenes/tok/<slug>.webp, .../img/<slug>.webp y .../index.json
const path = require('path');
const fs = require('fs');

const PREFIJO = '/__imagenes/';
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:webp|png|jpg|jpeg)$/;

// Devuelve la ruta real del fichero pedido o null si no es una petición válida (solo tok/, img/ e index.json, sin salirse de la carpeta)
function rutaImagen(carpeta, pathname) {
  if (!carpeta || typeof pathname !== 'string' || !pathname.startsWith(PREFIJO)) return null;
  let rel;
  try { rel = decodeURIComponent(pathname.slice(PREFIJO.length)); } catch { return null; }
  const partes = rel.split('/');
  const ok = (partes.length === 1 && partes[0] === 'index.json') || (partes.length === 2 && (partes[0] === 'tok' || partes[0] === 'img') && SLUG.test(partes[1]));
  if (!ok) return null;
  const base = path.resolve(carpeta), f = path.resolve(base, ...partes);
  return f.startsWith(base + path.sep) ? f : null;
}

function leerConfig(f) { try { const c = JSON.parse(fs.readFileSync(f, 'utf8')); return c && typeof c === 'object' ? c : {}; } catch { return {}; } }
function guardarConfig(f, c) { fs.writeFileSync(f, JSON.stringify(c)); }

module.exports = { rutaImagen, leerConfig, guardarConfig, PREFIJO };
