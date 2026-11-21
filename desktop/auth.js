// Inicio de sesión desde el navegador del sistema (Discord, enlaces del correo): la web de Supabase vuelve a la app con un
// enlace propio (herramientasdelmaster://auth?code=…). Aquí solo se reconoce y se limpia ese enlace; la app hace el resto.
const PROTOCOLO = 'herramientasdelmaster';

// En Windows y Linux el enlace llega como un argumento más al abrir (o reabrir) la app
function urlDeArgv(argv) {
  return (Array.isArray(argv) ? argv : []).find(a => typeof a === 'string' && a.toLowerCase().startsWith(PROTOCOLO + '://')) || '';
}

// Devuelve solo lo que hace falta: el código para canjear la sesión, o el error que mandó el servidor
function leerRetorno(url) {
  let u;
  try { u = new URL(String(url)); } catch { return null; }
  if (u.protocol !== PROTOCOLO + ':' || u.hostname !== 'auth') return null;
  const code = u.searchParams.get('code') || '';
  const error = u.searchParams.get('error_description') || u.searchParams.get('error') || '';
  if (!/^[A-Za-z0-9._~-]{8,300}$/.test(code) && !error) return null;
  return { code: /^[A-Za-z0-9._~-]{8,300}$/.test(code) ? code : '', error: error.slice(0, 300) };
}

// Solo se abre fuera de la app la dirección de autorización de nuestro proyecto de Supabase (https y *.supabase.co)
function esUrlDeAutorizacion(url) {
  let u;
  try { u = new URL(String(url)); } catch { return false; }
  return u.protocol === 'https:' && /^[a-z0-9]{10,40}\.supabase\.co$/.test(u.hostname) && u.pathname.startsWith('/auth/v1/');
}

module.exports = { PROTOCOLO, urlDeArgv, leerRetorno, esUrlDeAutorizacion };
