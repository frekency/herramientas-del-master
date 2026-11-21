-- Herramientas del Máster · esquema de Supabase
-- Pégalo entero en Supabase → SQL Editor → New query → Run. Se puede volver a ejecutar sin romper nada.

-- ---------- datos de cada usuario (sincronización) ----------
-- Una fila por cada dato guardado en el navegador: combate, bestiario, grupo, encuentros, tablas y módulos.
-- Solo su dueño puede leerla o escribirla; ahí van también sus copias privadas de los manuales.
create table if not exists public.datos_usuario (
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  clave       text not null,
  valor       jsonb not null,
  actualizado timestamptz not null default now(),
  primary key (user_id, clave)
);
alter table public.datos_usuario enable row level security;
drop policy if exists "cada uno lo suyo" on public.datos_usuario;
create policy "cada uno lo suyo" on public.datos_usuario
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
-- Solo las claves que sincroniza la página y como mucho 5 MB por fila: así nadie puede llenar la base de datos.
alter table public.datos_usuario drop constraint if exists datos_usuario_clave;
alter table public.datos_usuario add constraint datos_usuario_clave
  check (clave in ('tracker','bestiario','grupo','encuentros','tablas','modulos','preferencias','fichas')) not valid;
do $$ begin
  alter table public.datos_usuario add constraint datos_usuario_tamano check (octet_length(valor::text) < 5000000) not valid;
exception when duplicate_object then null; end $$;

-- ---------- catálogo de módulos de la comunidad ----------
-- Solo homebrew o contenido con licencia abierta. Los manuales oficiales nunca se publican aquí.
create table if not exists public.modulos_publicos (
  id          uuid primary key default gen_random_uuid(),
  autor_id    uuid not null default auth.uid() references auth.users on delete cascade,
  slug        text not null,
  nombre      text not null check (char_length(nombre) between 2 and 80),
  abrev       text not null default '' check (char_length(abrev) <= 6),
  autor       text not null default '',
  version     text not null default '1.0',
  licencia    text not null check (licencia in ('CC-BY-4.0','CC-BY-SA-4.0','CC0','Todos los derechos reservados')),
  descripcion text not null default '' check (char_length(descripcion) <= 500),
  resumen     jsonb not null default '{}'::jsonb,       -- {"criaturas":3,"tablas":2,...}
  contenido   jsonb not null,
  descargas   integer not null default 0,
  oculto      boolean not null default false,           -- el administrador lo pone a true desde el Table Editor
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now(),
  unique (autor_id, slug),
  check (octet_length(contenido::text) < 2000000),
  check (lower(nombre) !~ '(manual del jugador|gu[ií]a del m[aá]ster|manual de monstruos|xanathar|tasha|player.?s handbook|dungeon master|monster manual)')
);
alter table public.modulos_publicos enable row level security;
drop policy if exists "leer visibles" on public.modulos_publicos;
create policy "leer visibles" on public.modulos_publicos
  for select to anon, authenticated
  using (not oculto or autor_id = (select auth.uid()));
drop policy if exists "publicar los mios" on public.modulos_publicos;
create policy "publicar los mios" on public.modulos_publicos
  for insert to authenticated
  with check (autor_id = (select auth.uid()) and not oculto);
drop policy if exists "editar los mios" on public.modulos_publicos;
create policy "editar los mios" on public.modulos_publicos
  for update to authenticated
  using (autor_id = (select auth.uid()))
  with check (autor_id = (select auth.uid()));
drop policy if exists "retirar los mios" on public.modulos_publicos;
create policy "retirar los mios" on public.modulos_publicos
  for delete to authenticated
  using (autor_id = (select auth.uid()));

-- El autor no puede cambiar el contador de descargas ni desocultar un módulo que el administrador ocultó.
create or replace function public.proteger_modulo() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user not in ('authenticated','anon') then return new; end if;   -- sumar_descarga y el administrador pasan
  if tg_op = 'UPDATE' then
    new.descargas := old.descargas;
    new.oculto := old.oculto;
    new.creado := old.creado;
  else
    new.descargas := 0;
    new.oculto := false;
    -- como mucho 30 módulos por autor (cada uno puede pesar hasta 2 MB)
    if (select count(*) from public.modulos_publicos where autor_id = new.autor_id) >= 30 then
      raise exception 'Has llegado al límite de 30 módulos publicados';
    end if;
  end if;
  new.actualizado := now();
  return new;
end $$;
drop trigger if exists proteger_modulo on public.modulos_publicos;
create trigger proteger_modulo before insert or update on public.modulos_publicos
  for each row execute function public.proteger_modulo();

-- Contador de descargas: una por cuenta y módulo, así nadie puede inflarlo llamando a la función en bucle.
create table if not exists public.descargas_usuario (
  modulo_id uuid not null references public.modulos_publicos on delete cascade,
  user_id   uuid not null references auth.users on delete cascade,
  primary key (modulo_id, user_id)
);
alter table public.descargas_usuario enable row level security;   -- sin políticas: solo la usa sumar_descarga
drop function if exists public.sumar_descarga(uuid);
create or replace function public.sumar_descarga(mid uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return; end if;
  insert into public.descargas_usuario (modulo_id, user_id) values (mid, auth.uid()) on conflict do nothing;
  if found then
    update public.modulos_publicos set descargas = descargas + 1 where id = mid and not oculto;
  end if;
end $$;
revoke all on function public.sumar_descarga(uuid) from public;
grant execute on function public.sumar_descarga(uuid) to anon, authenticated;

-- ---------- denuncias ----------
-- Cualquiera con cuenta puede denunciar; solo el administrador las ve (Table Editor).
create table if not exists public.denuncias (
  id        bigint generated always as identity primary key,
  modulo_id uuid not null references public.modulos_publicos on delete cascade,
  user_id   uuid not null default auth.uid() references auth.users on delete cascade,
  motivo    text not null check (char_length(motivo) between 3 and 500),
  creado    timestamptz not null default now(),
  unique (modulo_id, user_id)
);
alter table public.denuncias enable row level security;
drop policy if exists "denunciar" on public.denuncias;
create policy "denunciar" on public.denuncias
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- ---------- perfiles (nombre de usuario) ----------
-- El usuario se elige al registrarse; es el nombre público que firma los módulos del catálogo.
create table if not exists public.perfiles (
  user_id uuid primary key references auth.users on delete cascade,
  usuario text not null unique check (usuario ~ '^[A-Za-z0-9_.-]{3,24}$'),
  creado  timestamptz not null default now()
);
alter table public.perfiles enable row level security;
drop policy if exists "perfiles visibles" on public.perfiles;
create policy "perfiles visibles" on public.perfiles for select to anon, authenticated using (true);

create or replace function public.crear_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
declare u text := nullif(trim(new.raw_user_meta_data->>'usuario'), '');
begin
  if u is not null then
    insert into public.perfiles (user_id, usuario) values (new.id, u) on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists crear_perfil on auth.users;
create trigger crear_perfil after insert on auth.users for each row execute function public.crear_perfil();

-- ¿Está libre ese nombre de usuario? (sin distinguir mayúsculas)
create or replace function public.usuario_libre(u text) returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists (select 1 from public.perfiles where lower(usuario) = lower(trim(u)));
$$;
grant execute on function public.usuario_libre(text) to anon, authenticated;
create unique index if not exists perfiles_usuario_ci on public.perfiles (lower(usuario));

-- Quien entra con Discord elige su nombre de usuario la primera vez (no tiene «usuario» en el registro)
drop policy if exists "crear mi perfil" on public.perfiles;
create policy "crear mi perfil" on public.perfiles for insert to authenticated with check (user_id = (select auth.uid()));
