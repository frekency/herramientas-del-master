# Herramientas del Máster

Herramientas para dirigir partidas de D&D 2024: tracker de combate, gestión de jugadores, bestiario y conjuros. Es una sola página HTML, sin dependencias ni compilación.

- **Versión personal:** https://claude.ai/artifact/N4KWLLNZUVYXCYNriSYwtP
- **Versión:** ver `VERSION` y `CHANGELOG.md`.

## Archivos
| Archivo | Qué es |
|---|---|
| `index.html` | La aplicación completa (HTML + CSS + JS). |
| `datos/privado/libros/` | Tus libros en JSON listos para importar (p. ej. `manual-del-jugador-2024.json`, que reúne todo el Manual del Jugador 2024: clases, especies, trasfondos, dotes, objetos, conjuros y reglas). **Uso personal**: ignorado por git; no se publica ni se empaqueta. |
| `datos/privado/conjuros.json` | Conjuros generados a partir del CSV personal (manuales). **Uso personal**: no se publica en abierto ni se sube al repositorio (la carpeta `datos/privado/` está en `.gitignore`). |
| `tools/build_spells.py` | Convierte el CSV de conjuros a `datos/privado/conjuros.json`. |

## Contenido y libros
- La página no trae reglas ni criaturas de serie: todo el contenido son módulos que se activan en 📚 Módulos.
- Los manuales (Manual del Jugador, etc.) se añaden por usuario desde 📚 Módulos, con un archivo JSON/CSV propio o un enlace. Se guardan solo en ese navegador, y un conjuro de un manual sustituye al de otro con el mismo nombre.

## Probarlo en local
```
python -m http.server 8000
```
y abre http://localhost:8000. Los datos (combate, grupo, encuentros, criaturas propias) se guardan en el navegador.

## Tests
Sin dependencias: usan el ejecutor de tests de Node (`node --test`). Se lanzan con `npm test` o `node --test tests/`.

| Archivo | Qué comprueba |
|---|---|
| `tests/datos.test.mjs` | Criaturas, conjuros y compendio en español: campos obligatorios, sin caracteres basura del PDF. |
| `tests/seguridad.test.mjs` | Sin secretos en git, clave publicable de Supabase, manuales fuera del repositorio, scripts externos con versión e integridad (SRI), RLS y límites en `supabase/schema.sql`. |
| `tests/navegador.test.mjs` | Abre la página en Edge o Chrome sin ventana con módulos, grupo, bestiario y copia de seguridad maliciosos (código en todos los campos) y con datos de tipos absurdos; recorre todas las vistas y comprueba que nada se ejecuta ni rompe la página. También prueba las tiradas y las rarezas en todos los idiomas. Se salta si no hay navegador (`BROWSER=ruta` para indicar otro). |

El hook `.githooks/pre-push` pasa los tests antes de cada `git push` y no deja subir si alguno falla. Se activa una vez por clon con `git config core.hooksPath .githooks`.

## Versionado
Versionado semántico. Cada cambio actualiza `VERSION`, `CHANGELOG.md`, el historial de la página principal y crea una etiqueta git `vX.Y.Z`.

## Licencias
Los manuales son contenido con copyright de Wizards of the Coast: se usan solo de forma personal y nunca se suben al repositorio ni se empaquetan en el instalador. Herramienta no oficial, sin relación con Wizards of the Coast.

## Cuentas y catálogo (Supabase)

El acceso es **solo por invitación**, con correo y contraseña (sin Discord). La app (web y escritorio) pide la cuenta la primera vez en cada equipo; sin conexión, la copia local solo se ofrece en un equipo donde ya se haya entrado.

1. En Supabase → **SQL Editor**, ejecuta `supabase/schema.sql` (se puede repetir sin problema).
2. En **Authentication → Sign In / Providers**, deja activo Email y **desactiva «Allow new users to sign up»**. Invita a cada persona desde **Authentication → Users → Invite user**.
3. En Cloudflare, quita la protección de Access de la web (el acceso lo controla la propia app con Supabase).
4. En **Authentication → URL Configuration**, pon la dirección de Cloudflare (`https://herramientas-del-master.sotoaeduardo.workers.dev`) como Site URL y añádela (con `/**`) a Redirect URLs.
5. La URL y la clave publicable del proyecto están en `index.html` (`SB_URL`, `SB_KEY`). Nunca pongas ahí la clave `service_role`/secret.

Para ocultar un módulo del catálogo, pon `oculto = true` en la tabla `modulos_publicos`; las denuncias llegan a la tabla `denuncias`.
