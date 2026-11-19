// Validación de lo que la página del máster manda a la ventana de la mesa (la que ven los jugadores).
// Solo pasan imágenes data: y datos mínimos del orden de iniciativa: nunca PG, CA ni notas.
const IMG = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const COLOR = /^#[0-9a-f]{3,8}$/i;
const MAX_IMG = 6_000_000;

function validar(p) {
  if (!p || typeof p !== 'object') return null;
  if (p.tipo === 'limpiar') return { tipo: 'limpiar' };
  if (p.tipo === 'imagen') {
    if (typeof p.src !== 'string' || p.src.length > MAX_IMG || !IMG.test(p.src)) return null;
    return { tipo: 'imagen', src: p.src, titulo: typeof p.titulo === 'string' ? p.titulo.slice(0, 200) : '' };
  }
  if (p.tipo === 'iniciativa') {
    const lista = (Array.isArray(p.lista) ? p.lista : []).slice(0, 80).map(e => ({
      n: String((e && e.n) || '').slice(0, 80),
      actual: !!(e && e.actual),
      caido: !!(e && e.caido),
      color: e && typeof e.color === 'string' && COLOR.test(e.color) ? e.color : '#888888',
    })).filter(e => e.n);
    const r = Math.trunc(Number(p.ronda));
    return { tipo: 'iniciativa', abrir: !!p.abrir, activo: !!p.activo, ronda: Number.isFinite(r) ? Math.max(0, Math.min(9999, r)) : 0, lista };
  }
  return null;
}

module.exports = { validar };
