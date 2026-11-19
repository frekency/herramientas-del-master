-- Herramientas del Máster · campañas (esquema adicional de Supabase)
-- Se ejecuta DESPUÉS de schema.sql: Supabase → SQL Editor → New query → pégalo entero → Run. Se puede repetir sin romper nada.
--
-- Modelo:
--   · Una campaña tiene un máster y jugadores (miembros_campana).
--   · Todo lo de la campaña es del máster y los jugadores solo lo leen.
--   · El máster marca (editable_jugador) los datos concretos que sus jugadores sí pueden editar, p. ej. su ficha.
--   · Los resúmenes se comparten con un enlace de solo lectura, sin cuenta (enlaces_publicos + ver_enlace).

-- ---------- funciones auxiliares ----------
-- Las políticas no pueden consultar miembros_campana directamente (se llamarían a sí mismas sin fin):
-- lo hacen a través de estas funciones, que se saltan la RLS de esa tabla y solo miran al usuario que llama.
-- (plpgsql y no sql: así Postgres no exige que miembros_campana exista ya al crear la función.)
create or replace function public.rol_en(cid uuid) returns text
language plpgsql stable security definer set search_path = '' as $$
begin
  return (select rol from public.miembros_campana where campana_id = cid and user_id = auth.uid());
end $$;
revoke all on function public.rol_en(uuid) from public;
grant execute on function public.rol_en(uuid) to authenticated;

create or replace function public.es_miembro(cid uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
begin
  return exists (select 1 from public.miembros_campana where campana_id = cid and user_id = auth.uid());
end $$;
revoke all on function public.es_miembro(uuid) from public;
grant execute on function public.es_miembro(uuid) to authenticated;

-- ---------- campañas ----------
create table if not exists public.campanas (
  id          uuid primary key default gen_random_uuid(),
  master_id   uuid not null default auth.uid() references auth.users on delete cascade,
  nombre      text not null check (char_length(nombre) between 2 and 80),
  descripcion text not null default '' check (char_length(descripcion) <= 500),
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now()
);
alter table public.campanas enable row level security;
drop policy if exists "ver las mias o donde juego" on public.campanas;
create policy "ver las mias o donde juego" on public.campanas
  for select to authenticated
  using (master_id = (select auth.uid()) or public.es_miembro(id));
drop policy if exists "crear las mias" on public.campanas;
create policy "crear las mias" on public.campanas
  for insert to authenticated
  with check (master_id = (select auth.uid()));
drop policy if exists "editar las mias" on public.campanas;
create policy "editar las mias" on public.campanas
  for update to authenticated
  using (master_id = (select auth.uid()))
  with check (master_id = (select auth.uid()));
drop policy if exists "borrar las mias" on public.campanas;
create policy "borrar las mias" on public.campanas
  for delete to authenticated
  using (master_id = (select auth.uid()));

-- ---------- miembros ----------
create table if not exists public.miembros_campana (
  campana_id uuid not null references public.campanas on delete cascade,
  user_id    uuid not null references auth.users on delete cascade,
  rol        text not null check (rol in ('master','jugador')),
  alias      text not null default '' check (char_length(alias) <= 40),
  unido      timestamptz not null default now(),
  primary key (campana_id, user_id)
);
create index if not exists miembros_campana_user on public.miembros_campana (user_id);
alter table public.miembros_campana enable row level security;
drop policy if exists "ver a los de mi campaña" on public.miembros_campana;
create policy "ver a los de mi campaña" on public.miembros_campana
  for select to authenticated
  using (public.es_miembro(campana_id));
-- Cada uno puede cambiar solo su alias (el trigger impide tocar rol o campaña).
drop policy if exists "cambiar mi alias" on public.miembros_campana;
create policy "cambiar mi alias" on public.miembros_campana
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
-- El máster expulsa a jugadores y cada jugador puede salirse. El máster no se puede quitar: borra la campaña.
drop policy if exists "expulsar o salir" on public.miembros_campana;
create policy "expulsar o salir" on public.miembros_campana
  for delete to authenticated
  using (rol = 'jugador' and (user_id = (select auth.uid()) or public.rol_en(campana_id) = 'master'));
-- Sin política de insert: los miembros entran solo por unirse_campana() o al crear la campaña.

create or replace function public.proteger_miembro() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user not in ('authenticated','anon') then return new; end if;
  new.rol := old.rol; new.campana_id := old.campana_id; new.user_id := old.user_id; new.unido := old.unido;
  return new;
end $$;
drop trigger if exists proteger_miembro on public.miembros_campana;
create trigger proteger_miembro before update on public.miembros_campana
  for each row execute function public.proteger_miembro();

-- Al crear una campaña, su creador entra como máster. Máximo 20 campañas por máster.
create or replace function public.alta_campana() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.miembros_campana (campana_id, user_id, rol) values (new.id, new.master_id, 'master');
  return new;
end $$;
revoke all on function public.alta_campana() from public;
drop trigger if exists alta_campana on public.campanas;
create trigger alta_campana after insert on public.campanas
  for each row execute function public.alta_campana();

create or replace function public.proteger_campana() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user not in ('authenticated','anon') then return new; end if;
  if tg_op = 'UPDATE' then
    new.master_id := old.master_id; new.creado := old.creado;
  elsif (select count(*) from public.campanas where master_id = new.master_id) >= 20 then
    raise exception 'Has llegado al límite de 20 campañas';
  end if;
  new.actualizado := now();
  return new;
end $$;
drop trigger if exists proteger_campana on public.campanas;
create trigger proteger_campana before insert or update on public.campanas
  for each row execute function public.proteger_campana();

-- ---------- invitaciones ----------
-- El máster crea un código; el jugador lo canjea con unirse_campana(). Caduca y tiene un máximo de usos.
create table if not exists public.invitaciones_campana (
  codigo     text primary key default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  campana_id uuid not null references public.campanas on delete cascade,
  creado     timestamptz not null default now(),
  caduca     timestamptz not null default now() + interval '7 days',
  usos_max   integer not null default 10 check (usos_max between 1 and 50),
  usos       integer not null default 0
);
alter table public.invitaciones_campana enable row level security;
drop policy if exists "el master gestiona sus invitaciones" on public.invitaciones_campana;
create policy "el master gestiona sus invitaciones" on public.invitaciones_campana
  for all to authenticated
  using (public.rol_en(campana_id) = 'master')
  with check (public.rol_en(campana_id) = 'master');

create or replace function public.proteger_invitacion() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user not in ('authenticated','anon') then return new; end if;
  new.usos := 0;
  if (select count(*) from public.invitaciones_campana where campana_id = new.campana_id and caduca > now()) >= 10 then
    raise exception 'Demasiadas invitaciones activas: borra alguna';
  end if;
  return new;
end $$;
drop trigger if exists proteger_invitacion on public.invitaciones_campana;
create trigger proteger_invitacion before insert on public.invitaciones_campana
  for each row execute function public.proteger_invitacion();

drop function if exists public.unirse_campana(text);
create or replace function public.unirse_campana(c text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare inv public.invitaciones_campana;
begin
  if auth.uid() is null then raise exception 'Inicia sesión para unirte'; end if;
  select * into inv from public.invitaciones_campana where codigo = upper(trim(c)) for update;
  if not found or inv.caduca < now() or inv.usos >= inv.usos_max then
    raise exception 'Invitación no válida o caducada';
  end if;
  if exists (select 1 from public.miembros_campana where campana_id = inv.campana_id and user_id = auth.uid()) then
    return inv.campana_id;   -- ya estaba dentro: no gasta un uso
  end if;
  if (select count(*) from public.miembros_campana where campana_id = inv.campana_id) >= 30 then
    raise exception 'La campaña está completa';
  end if;
  insert into public.miembros_campana (campana_id, user_id, rol) values (inv.campana_id, auth.uid(), 'jugador');
  update public.invitaciones_campana set usos = usos + 1 where codigo = inv.codigo;
  return inv.campana_id;
end $$;
revoke all on function public.unirse_campana(text) from public;
grant execute on function public.unirse_campana(text) to authenticated;

-- ---------- datos de la campaña ----------
-- Una fila por dato (combate, notas, ficha de un jugador...). Los jugadores leen todo y solo editan lo que el máster abre.
create table if not exists public.datos_campana (
  campana_id       uuid not null references public.campanas on delete cascade,
  clave            text not null check (clave ~ '^[a-z0-9][a-z0-9._:-]{0,79}$'),
  valor            jsonb not null,
  editable_jugador boolean not null default false,
  version          integer not null default 1,
  actualizado_por  uuid references auth.users on delete set null,
  actualizado      timestamptz not null default now(),
  primary key (campana_id, clave),
  check (octet_length(valor::text) < 2000000)
);
alter table public.datos_campana enable row level security;
drop policy if exists "leer los de mi campaña" on public.datos_campana;
create policy "leer los de mi campaña" on public.datos_campana
  for select to authenticated
  using (public.es_miembro(campana_id));
drop policy if exists "el master crea" on public.datos_campana;
create policy "el master crea" on public.datos_campana
  for insert to authenticated
  with check (public.rol_en(campana_id) = 'master');
drop policy if exists "el master edita todo, el jugador lo que se le abre" on public.datos_campana;
create policy "el master edita todo, el jugador lo que se le abre" on public.datos_campana
  for update to authenticated
  using (public.rol_en(campana_id) = 'master' or (public.rol_en(campana_id) = 'jugador' and editable_jugador))
  with check (public.rol_en(campana_id) = 'master' or (public.rol_en(campana_id) = 'jugador' and editable_jugador));
drop policy if exists "el master borra" on public.datos_campana;
create policy "el master borra" on public.datos_campana
  for delete to authenticated
  using (public.rol_en(campana_id) = 'master');

-- Un jugador no puede abrirse permisos a sí mismo; cada cambio sube la versión y deja constancia de quién lo hizo.
-- Como mucho 300 datos por campaña, para que nadie llene la base de datos.
create or replace function public.proteger_dato_campana() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user not in ('authenticated','anon') then return new; end if;
  if tg_op = 'UPDATE' then
    new.campana_id := old.campana_id; new.clave := old.clave;
    if public.rol_en(old.campana_id) <> 'master' then new.editable_jugador := old.editable_jugador; end if;
    new.version := old.version + 1;
  else
    new.version := 1;
    if (select count(*) from public.datos_campana where campana_id = new.campana_id) >= 300 then
      raise exception 'Has llegado al límite de 300 datos por campaña';
    end if;
  end if;
  new.actualizado_por := auth.uid();
  new.actualizado := now();
  return new;
end $$;
drop trigger if exists proteger_dato_campana on public.datos_campana;
create trigger proteger_dato_campana before insert or update on public.datos_campana
  for each row execute function public.proteger_dato_campana();

-- ---------- enlaces públicos de solo lectura ----------
-- El máster publica una instantánea (p. ej. el resumen de la última sesión) y comparte el enlace.
-- Nadie sin cuenta puede leer la tabla: solo ver_enlace(token), que devuelve esa instantánea y nada más.
create table if not exists public.enlaces_publicos (
  token       text primary key default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  campana_id  uuid not null references public.campanas on delete cascade,
  titulo      text not null check (char_length(titulo) between 1 and 80),
  contenido   jsonb not null,
  caduca      timestamptz,
  revocado    boolean not null default false,
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now(),
  check (octet_length(contenido::text) < 500000)
);
create index if not exists enlaces_publicos_campana on public.enlaces_publicos (campana_id);
alter table public.enlaces_publicos enable row level security;
drop policy if exists "el master gestiona sus enlaces" on public.enlaces_publicos;
create policy "el master gestiona sus enlaces" on public.enlaces_publicos
  for all to authenticated
  using (public.rol_en(campana_id) = 'master')
  with check (public.rol_en(campana_id) = 'master');

create or replace function public.proteger_enlace() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user not in ('authenticated','anon') then return new; end if;
  if tg_op = 'UPDATE' then
    new.token := old.token; new.campana_id := old.campana_id; new.creado := old.creado;
  elsif (select count(*) from public.enlaces_publicos where campana_id = new.campana_id) >= 50 then
    raise exception 'Has llegado al límite de 50 enlaces por campaña';
  end if;
  new.actualizado := now();
  return new;
end $$;
drop trigger if exists proteger_enlace on public.enlaces_publicos;
create trigger proteger_enlace before insert or update on public.enlaces_publicos
  for each row execute function public.proteger_enlace();

drop function if exists public.ver_enlace(text);
create or replace function public.ver_enlace(t text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('titulo', e.titulo, 'contenido', e.contenido, 'actualizado', e.actualizado)
  from public.enlaces_publicos e
  where e.token = t and not e.revocado and (e.caduca is null or e.caduca > now())
$$;
revoke all on function public.ver_enlace(text) from public;
grant execute on function public.ver_enlace(text) to anon, authenticated;
