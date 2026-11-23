-- Módulos de cada usuario en la web (sus copias de los manuales y su homebrew).
-- Pégalo en Supabase → SQL Editor → New query → Run. Se puede volver a ejecutar sin romper nada.
-- Una fila por módulo y tipo de contenido (troceado a menos de 4 MB), más la fila «cfg» con lo activado. Solo su dueño las lee o escribe.
create table if not exists public.modulos_usuario (
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  clave       text not null check (clave ~ '^[a-z0-9][a-z0-9._-]{0,99}$' or clave = 'cfg'),
  valor       jsonb not null,
  actualizado timestamptz not null default now(),
  primary key (user_id, clave),
  check (octet_length(valor::text) < 4000000)
);
alter table public.modulos_usuario enable row level security;
drop policy if exists "cada uno lo suyo" on public.modulos_usuario;
create policy "cada uno lo suyo" on public.modulos_usuario
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Que la API reconozca la tabla nueva al momento.
notify pgrst, 'reload schema';

-- Cada cambio deja la hora, y como mucho 400 filas por persona (los cuatro manuales con todo ocupan unas 60) para que nadie llene la base de datos.
create or replace function public.proteger_modulo_usuario() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user not in ('authenticated','anon') then return new; end if;
  if tg_op = 'INSERT' and (select count(*) from public.modulos_usuario where user_id = new.user_id) >= 400 then
    raise exception 'Has llegado al límite de 400 trozos de módulos';
  end if;
  new.actualizado := now();
  return new;
end $$;
drop trigger if exists proteger_modulo_usuario on public.modulos_usuario;
create trigger proteger_modulo_usuario before insert or update on public.modulos_usuario
  for each row execute function public.proteger_modulo_usuario();
notify pgrst, 'reload schema';
