// Validación de lo que la página del máster manda a la ventana de la mesa (la que ven los jugadores).
// Solo pasan imágenes data: y datos mínimos del orden de iniciativa: nunca PG, CA ni notas.
const IMG = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const COLOR = /^#[0-9a-f]{3,8}$/i;
const MAX_IMG = 6_000_000;

// ---- escenas: capas con posición y tamaño relativos (en %) sobre un lienzo 16:9 ----
const CAPAS = ['imagen', 'texto', 'iniciativa', 'cuentas', 'dados'];
// Tirada: «2d6+3», «1d20», «1d20+1d4+2». Solo d4, d6, d8, d10, d12, d20 y d100, hasta 20 dados.
const DADO = '(?:\\d{1,2}d(?:4|6|8|10|12|20|100))';
const NOTACION = new RegExp('^' + DADO + '(?:[+-](?:' + DADO + '|\\d{1,3}))*$');
function notacionValida(n) {
  if (typeof n !== 'string' || n.length > 60 || !NOTACION.test(n)) return false;
  return (n.match(/\d{1,2}d/g) || []).reduce((t, x) => t + parseInt(x, 10), 0) <= 20;
}
const FUENTES = ['sans', 'serif', 'manuscrita'];
const AJUSTES = ['contener', 'cubrir'];
const ALIN = ['izq', 'centro', 'der'];
const MAX_CAPAS = 40;
const MAX_ESCENA_IMG = 24_000_000;
const num = (v, min, max, def) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def; };
const txt = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');

function validarCapa(c, i) {
  if (!c || typeof c !== 'object' || !CAPAS.includes(c.tipo)) return null;
  const o = {
    tipo: c.tipo,
    id: typeof c.id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(c.id) ? c.id : 'c' + i,
    x: num(c.x, -50, 150, 0), y: num(c.y, -50, 150, 0),
    w: num(c.w, 1, 200, 50), h: num(c.h, 1, 200, 50),
    visible: c.visible !== false,
    op: num(c.op, 0, 1, 1),
  };
  if (c.tipo === 'dados') {
    o.fondo = c.fondo === '' ? '' : typeof c.fondo === 'string' && COLOR.test(c.fondo) ? c.fondo : '#1d3a2b';   // '' = tablero transparente
    o.limpia = num(c.limpia, 0, 120, 10);   // segundos hasta que los dados se retiran solos (0 = nunca)
    o.color = typeof c.color === 'string' && COLOR.test(c.color) ? c.color : '#b3262d';
    o.escala = num(c.escala, 2, 12, 8);
    return o;
  }
  if (c.tipo === 'cuentas') {
    o.cid = typeof c.cid === 'string' && /^[a-z0-9]{1,24}$/i.test(c.cid) ? c.cid : '';
    o.fin = c.fin === 'quitar' ? 'quitar' : 'mantener';
  }
  if (c.tipo === 'imagen') {
    if (typeof c.src !== 'string' || c.src.length > MAX_IMG || !IMG.test(c.src)) return null;
    o.src = c.src;
    o.ajuste = AJUSTES.includes(c.ajuste) ? c.ajuste : 'contener';
    o.titulo = txt(c.titulo, 200);
    o.marco = !!c.marco;
  } else if (c.tipo === 'texto') {
    o.t = txt(c.t, 2000);
    o.tam = num(c.tam, 1, 60, 6);
    o.color = typeof c.color === 'string' && COLOR.test(c.color) ? c.color : '#f1ece0';
    o.fondo = typeof c.fondo === 'string' && COLOR.test(c.fondo) ? c.fondo : '';
    o.alin = ALIN.includes(c.alin) ? c.alin : 'centro';
    o.fuente = FUENTES.includes(c.fuente) ? c.fuente : 'sans';
    o.negrita = !!c.negrita;
  }
  return o;
}

function validarEscena(p) {
  if (!Array.isArray(p.capas)) return null;
  const capas = [];
  let bytes = 0;
  for (const c of p.capas.slice(0, MAX_CAPAS)) {
    const v = validarCapa(c, capas.length);
    if (!v) continue;
    if (v.src) { bytes += v.src.length; if (bytes > MAX_ESCENA_IMG) return null; }
    if (capas.some(x => x.id === v.id)) v.id = v.id + '_' + capas.length;
    capas.push(v);
  }
  // fondo: color liso, degradado (segundo color y ángulo) y/o una imagen debajo
  let fsrc = '';
  if (typeof p.fsrc === 'string' && p.fsrc.length <= MAX_IMG && IMG.test(p.fsrc)) { fsrc = p.fsrc; bytes += fsrc.length; if (bytes > MAX_ESCENA_IMG) fsrc = ''; }
  return {
    tipo: 'escena',
    nombre: txt(p.nombre, 80),
    fondo2: typeof p.fondo2 === 'string' && COLOR.test(p.fondo2) ? p.fondo2 : '',
    ang: num(p.ang, 0, 360, 180),
    fsrc,
    fajuste: p.fajuste === 'contener' ? 'contener' : 'cubrir',
    fondo: typeof p.fondo === 'string' && COLOR.test(p.fondo) ? p.fondo : '#0b0a09',
    fundido: num(p.fundido, 0, 3000, 300),
    capas,
  };
}

function validar(p) {
  if (!p || typeof p !== 'object') return null;
  if (p.tipo === 'limpiar') return { tipo: 'limpiar' };
  if (p.tipo === 'escena') return validarEscena(p);
  if (p.tipo === 'imagen') {
    if (typeof p.src !== 'string' || p.src.length > MAX_IMG || !IMG.test(p.src)) return null;
    return { tipo: 'imagen', src: p.src, titulo: typeof p.titulo === 'string' ? p.titulo.slice(0, 200) : '' };
  }
  if (p.tipo === 'dados') {
    if (!notacionValida(p.notacion)) return null;
    return { tipo: 'dados', notacion: p.notacion, etiqueta: typeof p.etiqueta === 'string' ? p.etiqueta.slice(0, 60) : '' };
  }
  if (p.tipo === 'cuentas') {
    const lista = (Array.isArray(p.lista) ? p.lista : []).slice(0, 8).map(c => {
      const s = Math.trunc(Number(c && c.seg));
      return { id: typeof (c && c.id) === 'string' && /^[a-z0-9]{1,24}$/i.test(c.id) ? c.id : '', n: String((c && c.n) || '').slice(0, 60), seg: Number.isFinite(s) ? Math.max(0, Math.min(86400, s)) : 0, pausa: !!(c && c.pausa), fin: !!(c && c.fin) };
    });
    return { tipo: 'cuentas', lista };
  }
  if (p.tipo === 'aviso') {
    const texto = typeof p.texto === 'string' ? p.texto.trim().slice(0, 400) : '';
    const titulo = typeof p.titulo === 'string' ? p.titulo.trim().slice(0, 80) : '';
    return texto || titulo ? { tipo: 'aviso', titulo, texto } : null;
  }
  if (p.tipo === 'iniciativa') {
    const lista = (Array.isArray(p.lista) ? p.lista : []).slice(0, 80).map(e => ({
      n: String((e && e.n) || '').slice(0, 80),
      actual: !!(e && e.actual),
      caido: !!(e && e.caido),
      color: e && typeof e.color === 'string' && COLOR.test(e.color) ? e.color : '#888888',
    })).filter(e => e.n);
    const r = Math.trunc(Number(p.ronda));
    // cuenta atrás opcional (la que el máster decide enseñar): solo etiqueta, segundos y si está en pausa
    let cuenta = null;
    if (p.cuenta && typeof p.cuenta === 'object') {
      const s = Math.trunc(Number(p.cuenta.seg));
      if (Number.isFinite(s)) cuenta = { n: String(p.cuenta.n || '').slice(0, 80), seg: Math.max(0, Math.min(86400, s)), pausa: !!p.cuenta.pausa };
    }
    return { tipo: 'iniciativa', abrir: !!p.abrir, activo: !!p.activo, ronda: Number.isFinite(r) ? Math.max(0, Math.min(9999, r)) : 0, lista, cuenta };
  }
  return null;
}

module.exports = { validar, notacionValida };
