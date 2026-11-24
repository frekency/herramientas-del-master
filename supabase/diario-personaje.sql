-- Diario del personaje: una fila «dia:<id de la ficha>» en datos_campana.
-- Lo ven y lo editan el máster y el jugador al que está vinculado el personaje; ningún otro jugador.
-- El dueño NO se guarda en el diario: se deduce del vínculo del personaje con la cuenta:
--   ficha  fch:<id>  → campo «jugador» = id del jugador (fila  pj:<id>)  → su «nick» = usuario de la cuenta (perfiles.usuario).
-- Pendiente de aplicar: se aplica con  supabase db query --remote=<ref> -f supabase/diario-personaje.sql

-- ¿Soy yo el jugador vinculado al personaje de este diario?  (security definer: lee fch/pj aunque yo no pueda verlas todas)
create or replace function public.es_dueno_diario(cid uuid, k text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.datos_campana f
    join public.datos_campana p
      on p.campana_id = f.campana_id and p.clave = 'pj:' || (f.valor->>'jugador')
    join public.perfiles pf on lower(pf.usuario) = lower(coalesce(p.valor->>'usuario', p.valor->>'nick'))
    where f.campana_id = cid
      and k like 'dia:%'
      and f.clave = 'fch:' || substr(k, 5)
      and nullif(f.valor->>'jugador', '') is not null
      and not f.borrado
      and pf.user_id = (select auth.uid())
  );
$$;
revoke all on function public.es_dueno_diario(uuid, text) from public;
grant execute on function public.es_dueno_diario(uuid, text) to authenticated;

-- Lectura: se mantiene la regla actual y se añade «mi diario». (Se recrea con el mismo texto de la regla desplegada.)
drop policy if exists "leer los de mi campaña" on public.datos_campana;
create policy "leer los de mi campaña" on public.datos_campana
  for select to authenticated
  using (
    public.rol_en(campana_id) = 'master'
    or (public.rol_en(campana_id) = 'jugador' and (
         borrado
         or clave like 'fch:%' or clave like 'pj:%' or clave like 'pub:%'
         or clave = 'cfg:permisos' or clave = 'cfg:reloj'
         or (clave like 'nota:%' and coalesce(valor->>'visibilidad', 'dm') = any (array['jugadores','enlace']))
         or (clave like 'grp:%' and coalesce(valor->>'tipo', '') = 'jugadores')
         or public.es_dueno_diario(campana_id, clave)
    ))
  );

-- Crear y editar su propio diario (el máster ya puede todo).
drop policy if exists "el jugador crea su diario" on public.datos_campana;
create policy "el jugador crea su diario" on public.datos_campana
  for insert to authenticated
  with check (public.rol_en(campana_id) = 'jugador' and public.es_dueno_diario(campana_id, clave));

drop policy if exists "el jugador edita su diario" on public.datos_campana;
create policy "el jugador edita su diario" on public.datos_campana
  for update to authenticated
  using (public.rol_en(campana_id) = 'jugador' and public.es_dueno_diario(campana_id, clave))
  with check (public.rol_en(campana_id) = 'jugador' and public.es_dueno_diario(campana_id, clave));
-- Borrar sigue siendo solo del máster (política «el master borra»).
