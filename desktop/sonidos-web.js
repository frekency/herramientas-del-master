'use strict';
// Búsqueda de sonidos en Freesound y Jamendo con la clave del propio usuario (la guarda esta carpeta de datos; la página nunca la ve).
// Solo devuelve datos mínimos y enlaces https de los dominios de cada servicio; el audio se reproduce desde su servidor, no se copia.
const fs = require('fs');

const PROV = {
  freesound: { nombre: 'Freesound', host: /(^|\.)freesound\.org$/i, pedir: 'https://freesound.org/apiv2/apply/' },
  jamendo: { nombre: 'Jamendo', host: /(^|\.)jamendo\.com$/i, pedir: 'https://devportal.jamendo.com/' },
};
const CLAVE = /^[A-Za-z0-9_-]{6,80}$/;
const MAX = 20;

function leerClaves(f) { try { const c = JSON.parse(fs.readFileSync(f, 'utf8')); return c && typeof c === 'object' ? c : {}; } catch { return {}; } }
function guardarClave(f, prov, valor) {
  if (!PROV[prov]) throw new Error('servicio no válido');
  const c = leerClaves(f);
  const v = String(valor || '').trim();
  if (v === '') delete c[prov];
  else if (CLAVE.test(v)) c[prov] = v;
  else throw new Error('clave no válida');
  fs.writeFileSync(f, JSON.stringify(c), { mode: 0o600 });
}
const tieneClave = (f, prov) => !!(PROV[prov] && CLAVE.test(String(leerClaves(f)[prov] || '')));

function urlOk(u, prov) {
  try { const x = new URL(u); return x.protocol === 'https:' && PROV[prov].host.test(x.hostname) && u.length <= 480 ? x.href : ''; } catch { return ''; }
}
// «http://creativecommons.org/licenses/by-nc/4.0/» → «CC BY-NC 4.0»; el dominio público (zero) → «CC0»
function licenciaTexto(u) {
  const s = String(u || '');
  if (/publicdomain\/zero|\/zero\//i.test(s)) return 'CC0';
  const m = /creativecommons\.org\/licenses\/([a-z-]+)\/([\d.]+)/i.exec(s);
  if (m) return 'CC ' + m[1].toUpperCase() + ' ' + m[2];
  if (/sampling/i.test(s)) return 'Sampling+';
  return s ? 'licencia propia' : '';
}
const txt = (v, n) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n) : '');
const seg = v => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 0 && n < 86400 ? n : 0; };

function normalizar(prov, datos) {
  const L = Array.isArray(datos && datos.results) ? datos.results : [];
  const out = [];
  for (const r of L) {
    if (!r || typeof r !== 'object') continue;
    let url, lic, pagina, autor;
    if (prov === 'freesound') {
      const p = r.previews && typeof r.previews === 'object' ? r.previews : {};
      url = urlOk(p['preview-hq-mp3'] || p['preview-lq-mp3'], prov);
      lic = licenciaTexto(r.license); autor = txt(r.username, 60); pagina = urlOk(r.url, prov);
    } else {
      url = urlOk(r.audio, prov); lic = licenciaTexto(r.license_ccurl); autor = txt(r.artist_name, 60); pagina = urlOk(r.shareurl, prov);
    }
    if (!url) continue;
    out.push({ id: txt(String(r.id), 20), n: txt(r.name, 80) || 'Sin nombre', autor, licencia: lic, dur: seg(r.duration), url, pagina });
    if (out.length >= MAX) break;
  }
  return out;
}

// fetchFn se inyecta en las pruebas; en la app es el fetch de Electron. Nunca lanza: devuelve { ok, res } o { ok:false, error }
async function buscar(prov, consulta, clave, opciones, fetchFn) {
  if (!PROV[prov]) return { ok: false, error: 'servicio' };
  const q = txt(consulta, 60);
  if (q.length < 2) return { ok: false, error: 'consulta' };
  if (!CLAVE.test(String(clave || ''))) return { ok: false, error: 'clave' };
  let url, cab = { accept: 'application/json' };
  if (prov === 'freesound') {
    const p = new URLSearchParams({ query: q, page_size: String(MAX), fields: 'id,name,username,license,duration,previews,url', sort: 'score' });
    p.set('filter', 'duration:[2 TO 900]' + (opciones && opciones.soloCC0 === false ? '' : ' license:"Creative Commons 0"'));
    url = 'https://freesound.org/apiv2/search/text/?' + p; cab.authorization = 'Token ' + clave;
  } else {
    const p = new URLSearchParams({ client_id: clave, format: 'json', limit: String(MAX), search: q, audioformat: 'mp32', include: 'licenses', order: 'relevance' });
    url = 'https://api.jamendo.com/v3.0/tracks/?' + p;
  }
  try {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 12000);
    let r;
    try { r = await fetchFn(url, { headers: cab, signal: ctl.signal }); } finally { clearTimeout(t); }
    if (r.status === 401 || r.status === 403) return { ok: false, error: 'clave' };
    if (r.status === 429) return { ok: false, error: 'limite' };
    if (!r.ok) return { ok: false, error: 'servicio' };
    const d = await r.json();
    // Jamendo responde 200 con un código de error dentro de «headers»
    if (prov === 'jamendo' && d && d.headers && d.headers.status === 'failed') return { ok: false, error: /key|client/i.test(String(d.headers.error_message)) ? 'clave' : 'servicio' };
    return { ok: true, res: normalizar(prov, d) };
  } catch { return { ok: false, error: 'red' }; }
}

module.exports = { PROV, buscar, normalizar, licenciaTexto, leerClaves, guardarClave, tieneClave, urlOk, CLAVE };
