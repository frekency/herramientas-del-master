-- Herramientas del Máster · marca «DM» (solo el DM crea campañas)
-- Ejecútalo UNA vez: Supabase → SQL Editor → New query → pégalo entero → Run. Se puede repetir sin romper nada.
-- Requiere haber ejecutado antes schema.sql, campanas.sql y permisos.sql.
--
-- Hasta ahora quien creaba una campaña era su máster. Desde ahora solo crean campañas las cuentas con la marca DM;
-- el resto son jugadores. La regla está en la base de datos (RLS), no solo en la web: tocar la página no la salta.

create table if not exists public.dms (
  user_id uuid primary key references auth.users on delete cascade,
  desde   timestamptz not null default now()
);
alter table public.dms enable row level security;
-- Cada cuenta puede ver si ella misma es DM. Nadie escribe aquí desde la web: se da la marca con dar_dm() o desde este editor.
drop policy if exists "ver si soy dm" on public.dms;
create policy "ver si soy dm" on public.dms for select to authenticated using (user_id = (select auth.uid()));
grant select on public.dms to authenticated;

create or replace function public.es_dm() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.dms where user_id = (select auth.uid()));
$$;
revoke all on function public.es_dm() from public;
grant execute on function public.es_dm() to authenticated;

-- Quienes ya son máster de alguna campaña conservan su marca (así nadie pierde lo que ya tiene).
insert into public.dms (user_id) select distinct master_id from public.campanas on conflict do nothing;

-- Un DM puede dar la marca a otra persona por su nombre de usuario: select public.dar_dm('nombre');
create or replace function public.dar_dm(u text) returns text
language plpgsql security definer set search_path = '' as $$
declare uid uuid;
begin
  if not public.es_dm() then raise exception 'solo un DM puede dar la marca'; end if;
  select user_id into uid from public.perfiles where lower(usuario) = lower(trim(u));
  if uid is null then raise exception 'no existe el usuario %', u; end if;
  insert into public.dms (user_id) values (uid) on conflict do nothing;
  return 'ok';
end $$;
revoke all on function public.dar_dm(text) from public;
grant execute on function public.dar_dm(text) to authenticated;

-- Crear una campaña exige ser DM
drop policy if exists "crear las mias" on public.campanas;
create policy "crear las mias" on public.campanas
  for insert to authenticated
  with check (master_id = (select auth.uid()) and public.es_dm());
