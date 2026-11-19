-- Sincronización por elemento (aplicar DESPUÉS de campanas.sql; es idempotente).
-- Cada nota, ficha o encuentro de una campaña es una fila de datos_campana, con su versión y su marca de borrado.

-- 1. Marca de borrado: un elemento borrado queda como fila vacía para que los demás dispositivos se enteren y no lo resuciten.
alter table public.datos_campana add column if not exists borrado boolean not null default false;
alter table public.datos_campana alter column valor drop not null;
alter table public.datos_campana drop constraint if exists datos_campana_valor_check;
alter table public.datos_campana drop constraint if exists datos_campana_check;
alter table public.datos_campana add constraint datos_campana_valor_check
  check ((borrado and valor is null) or (not borrado and valor is not null and octet_length(valor::text) < 2000000));

-- 2. Lectura incremental: «dame lo que cambió desde la última vez».
create index if not exists datos_campana_cambios on public.datos_campana (campana_id, actualizado);

-- 3. Las filas se escriben siempre con la versión base: el cliente actualiza «donde version = la que yo conocía».
--    Si otro dispositivo se adelantó no se actualiza ninguna fila y el cliente vuelve a leer y resuelve.
--    El disparador sigue subiendo la versión; el tope pasa de 300 a 3000 elementos por campaña.
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
    if (select count(*) from public.datos_campana where campana_id = new.campana_id) >= 3000 then
      raise exception 'Has llegado al límite de 3000 elementos por campaña';
    end if;
  end if;
  new.actualizado_por := auth.uid();
  new.actualizado := now();
  return new;
end $$;
