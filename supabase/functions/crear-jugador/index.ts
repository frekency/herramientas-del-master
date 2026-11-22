// Herramientas del Máster · función «crear-jugador» (Supabase Edge Function)
// Un DM crea la cuenta de un jugador que no tiene: usuario + contraseña provisional (la app le obliga a cambiarla al entrar).
// Despliegue: ver supabase/README-funciones.md. Solo acepta a quien tenga la marca DM (supabase/dm.sql).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

// Mismo dominio inventado que usa la app para entrar con «usuario» en vez de correo. Nunca se envía correo a esa dirección.
const DOMINIO = 'jugadores.herramientas.local';
const provisional = () => {
  const abc = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const b = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(b, (x) => abc[x % abc.length]).join('');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'método no permitido' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const auth = req.headers.get('Authorization') ?? '';

  // 1) quién llama: con su propio token, no con el de servicio
  const yo = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const { data: u } = await yo.auth.getUser();
  if (!u?.user) return json({ error: 'sin sesión' }, 401);
  const { data: esDm } = await yo.rpc('es_dm');
  if (esDm !== true) return json({ error: 'solo un DM puede crear cuentas de jugador' }, 403);

  // 2) datos
  let b: { usuario?: string; campana_id?: string };
  try { b = await req.json(); } catch { return json({ error: 'petición no válida' }, 400); }
  const usuario = String(b.usuario ?? '').trim();
  if (!/^[A-Za-z0-9_.-]{3,24}$/.test(usuario)) return json({ error: 'usuario no válido (3 a 24: letras, números, punto, guion, guion bajo)' }, 400);

  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data: libre } = await admin.rpc('usuario_libre', { u: usuario });
  if (libre === false) return json({ error: 'ese usuario ya existe' }, 409);

  // 3) si es para una campaña, tiene que ser suya
  const cid = b.campana_id && /^[0-9a-f-]{36}$/.test(b.campana_id) ? b.campana_id : null;
  if (cid) {
    const { data: c } = await admin.from('campanas').select('id').eq('id', cid).eq('master_id', u.user.id).maybeSingle();
    if (!c) return json({ error: 'esa campaña no es tuya' }, 403);
  }

  // 4) la cuenta
  const pass = provisional();
  const { data: nuevo, error } = await admin.auth.admin.createUser({
    email: `${usuario.toLowerCase()}@${DOMINIO}`,
    password: pass,
    email_confirm: true,
    user_metadata: { usuario, cambiar_pass: true, creado_por: u.user.id },
  });
  if (error || !nuevo?.user) return json({ error: error?.message ?? 'no se pudo crear' }, 400);
  if (cid) await admin.from('miembros_campana').insert({ campana_id: cid, user_id: nuevo.user.id, rol: 'jugador' });

  return json({ ok: true, usuario, password: pass, user_id: nuevo.user.id });
});
