-- El rol de servicio (service_role) solo lo usan las funciones de servidor (p. ej. crear-jugador), nunca el navegador.
-- En este proyecto no tenía permisos sobre las tablas de public, y la función veía las campañas como inexistentes
-- («esa campaña no es tuya»). Se ejecutó el 2026-11-24 con: supabase db query --remote=<ref> -f supabase/permisos-service-role.sql
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
