-- Herramientas del Máster · control de versiones de los datos personales
-- Pégalo en Supabase → SQL Editor → New query → Run. Se puede volver a ejecutar sin romper nada.
-- Aplicar DESPUÉS de schema.sql. Las filas que ya existen pasan a tener la versión 1.
--
-- Cada bloque de datos personales (bestiario propio, tablas, módulos, preferencias, grupo, encuentros, fichas libres y combate)
-- lleva una versión que pone el servidor. La app escribe «donde la versión sea la que yo conocía»: si otro dispositivo se adelantó,
-- no se pisa nada y se abre un conflicto para elegir qué versión es la correcta.

alter table public.datos_usuario add column if not exists version     integer not null default 1;
alter table public.datos_usuario add column if not exists dispositivo text;   -- desde dónde se escribió por última vez: «escritorio» o «web»

create or replace function public.proteger_dato_usuario() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user not in ('authenticated','anon') then return new; end if;
  if tg_op = 'UPDATE' then
    new.user_id := old.user_id; new.clave := old.clave;
    new.version := old.version + 1;
  else
    new.version := 1;
  end if;
  new.dispositivo := left(coalesce(new.dispositivo, ''), 20);
  new.actualizado := now();
  return new;
end $$;
drop trigger if exists proteger_dato_usuario on public.datos_usuario;
create trigger proteger_dato_usuario before insert or update on public.datos_usuario
  for each row execute function public.proteger_dato_usuario();
