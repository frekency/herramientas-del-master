# Funciones de Supabase (Edge Functions)

## crear-jugador
Un DM crea la cuenta de un jugador (usuario + contraseña provisional que debe cambiar al entrar).

Despliegue, una vez (necesita la CLI de Supabase: `npm i -g supabase`, y `supabase login`):

    supabase functions deploy crear-jugador --project-ref TU_REF

`TU_REF` es el identificador del proyecto (Supabase → Project Settings → General → Reference ID).
No hay que configurar claves: la función usa las que Supabase ya le da. Antes hay que haber ejecutado `dm.sql`.
