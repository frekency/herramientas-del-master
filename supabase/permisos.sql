-- Herramientas del Máster · permisos de las tablas (Supabase)
-- Ejecútalo UNA vez (y otra si añades tablas): Supabase → SQL Editor → New query → pégalo entero → Run. Se puede repetir sin romper nada.
--
-- Por qué hace falta: las políticas (RLS) de schema.sql y campanas.sql dicen QUÉ FILAS puede ver o tocar cada persona, pero antes
-- hay que dar permiso sobre la tabla. Los proyectos de Supabase nuevos ya no lo dan solos a las tablas creadas con el editor SQL,
-- y entonces la app falla con «permission denied for table …». Esto solo abre la puerta; la RLS sigue decidiendo fila por fila.
-- Nunca se da permiso a quien no ha iniciado sesión (anon) salvo lectura de lo público.

grant usage on schema public to anon, authenticated;

-- schema.sql
grant select, insert, update, delete on public.datos_usuario    to authenticated;
grant select                         on public.modulos_publicos to anon;
grant select, insert, update, delete on public.modulos_publicos to authenticated;
grant insert                         on public.denuncias        to authenticated;
grant select                         on public.perfiles         to anon;
grant select, insert                 on public.perfiles         to authenticated;

-- campanas.sql
grant select, insert, update, delete on public.campanas             to authenticated;
grant select, update, delete         on public.miembros_campana     to authenticated;   -- se entra por invitación (unirse_campana), no insertando
grant select, insert, update, delete on public.invitaciones_campana to authenticated;
grant select, insert, update, delete on public.datos_campana        to authenticated;
grant select, insert, update, delete on public.enlaces_publicos     to authenticated;
