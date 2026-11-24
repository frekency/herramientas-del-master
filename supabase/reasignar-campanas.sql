-- Deja a UNA cuenta DM como dueña de TODAS las campañas (también oneshots).
-- Se ejecuta a mano en Supabase: SQL Editor. No lo ejecuta la app. Pásalo por partes.
-- El editor corre como «postgres», así que el trigger proteger_campana (que impide cambiar el dueño a los usuarios normales) no lo bloquea.

-- 1) Quién es cada cuenta y qué campañas tiene (solo mira; cambia 'frekency' por el usuario si hace falta).
select u.id, u.email, u.raw_user_meta_data->>'usuario' as usuario,
       (select count(*) from public.campanas c where c.master_id = u.id) as campanas
from auth.users u
order by campanas desc;

select c.id, c.nombre, c.master_id, u.email as dueno_actual
from public.campanas c left join auth.users u on u.id = c.master_id
order by c.nombre;

-- 2) Pon aquí el id de la cuenta frekency (columna id del primer resultado) y ejecuta TODO lo que sigue de una vez.
do $$
declare
  nuevo uuid := '00000000-0000-0000-0000-000000000000';   -- <-- sustituir por el id de frekency
begin
  if not exists (select 1 from auth.users where id = nuevo) then
    raise exception 'Ese id no existe en auth.users: sustituye el id de arriba';
  end if;
  -- es DM
  insert into public.dms (user_id) values (nuevo) on conflict do nothing;
  -- el dueño de cada campaña pasa a ser esa cuenta
  update public.campanas set master_id = nuevo where master_id <> nuevo;
  -- y entra como máster en cada una (el dueño anterior se queda como miembro, no se le borra nada)
  insert into public.miembros_campana (campana_id, user_id, rol)
    select c.id, nuevo, 'master' from public.campanas c
    on conflict (campana_id, user_id) do update set rol = 'master';
end $$;

-- 3) Comprobación: debe salir una sola fila con todas las campañas.
select master_id, count(*) from public.campanas group by master_id;
