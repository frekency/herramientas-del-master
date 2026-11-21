-- Lo que puede LEER un jugador de la campaña (aplicar DESPUÉS de campanas.sql y sincro.sql; es idempotente).
--
-- Antes, cualquier miembro leía todas las filas de datos_campana: notas «solo máster», encuentros preparados, grupos rivales…
-- Ahora el máster lee todo y el jugador solo lo que le toca:
--   · fch:   las fichas de los personajes de la campaña
--   · pj:    las tarjetas de jugador
--   · cfg:   los permisos (qué puede cambiar cada jugador)
--   · pub:   lo que el máster ha decidido enseñar (resumen de sesión y escenas reveladas)
--   · nota:  solo las notas con visibilidad «jugadores» o «enlace»
--   · grp:   solo el grupo de los jugadores
--   · las filas borradas (sin contenido), para que su dispositivo se entere de lo que desapareció
-- enc: (encuentros preparados) y todo lo demás quedan solo para el máster.

drop policy if exists "leer los de mi campaña" on public.datos_campana;
create policy "leer los de mi campaña" on public.datos_campana
  for select to authenticated
  using (
    public.rol_en(campana_id) = 'master'
    or (
      public.rol_en(campana_id) = 'jugador'
      and (
        borrado
        or clave like 'fch:%'
        or clave like 'pj:%'
        or clave like 'pub:%'
        or clave = 'cfg:permisos'
        or (clave like 'nota:%' and coalesce(valor->>'visibilidad', 'dm') in ('jugadores', 'enlace'))
        or (clave like 'grp:%' and coalesce(valor->>'tipo', '') = 'jugadores')
      )
    )
  );
