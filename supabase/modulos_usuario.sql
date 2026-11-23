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
