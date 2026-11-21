# Herramientas del Máster

Herramientas para dirigir partidas de D&D 2024: tracker de combate, gestión de jugadores, bestiario y conjuros. Es una sola página HTML, sin dependencias ni compilación.

- **Versión pública (solo SRD):** https://claude.ai/artifact/K7X9AHasDjENmmQ8457oZW
- **Versión personal:** https://claude.ai/artifact/N4KWLLNZUVYXCYNriSYwtP
- **Versión:** ver `VERSION` y `CHANGELOG.md`.

## Archivos
| Archivo | Qué es |
|---|---|
| `index.html` | La aplicación completa (HTML + CSS + JS). |
| `datos/<idioma>/` | Datos del SRD 5.2.1 (CC-BY-4.0, Wizards of the Coast) en `es`, `en`, `fr`, `de` e `it`. Cada carpeta tiene `bestiario.json` (criaturas), `conjuros.json` (los 339 conjuros, con su nombre en inglés) y `compendio.json` (objetos, dotes, trasfondos, especies y clases). Es lo único que se publica en abierto. |
| `datos/privado/conjuros.json` | Conjuros generados a partir del CSV personal (manuales). **Uso personal**: no se publica en abierto ni se sube al repositorio (la carpeta `datos/privado/` está en `.gitignore`). |
| `tools/build_srd.py` | Descarga y compacta el SRD 2024 en inglés desde Open5e. |
| `tools/build_es.py` | Extrae los textos del PDF oficial en español y los empareja con los datos en inglés. |
| `datos/privado/libros/` | Tus libros en JSON listos para importar (p. ej. `manual-del-jugador-2024.json`). **Uso personal**: ignorado por git. |
| `tools/build_spells.py` | Convierte el CSV de conjuros a `datos/privado/conjuros.json`. |
| `tools/build_srd_spells.py` | Extrae los conjuros del PDF oficial en español (`pdftotext`) y les pone el nombre en inglés de Open5e. |
| `tools/build_fr.py`, `tools/build_spells_fr.py`, `tools/build_compendio_fr.py` | Extraen el SRD 5.2.1 en francés del PDF oficial (`pdftotext -enc UTF-8` para criaturas y conjuros, `stream.py` para el compendio) y lo emparejan con los datos en inglés. |
| `tools/build_de.py`, `tools/build_spells_de.py`, `tools/build_compendio_de.py` | Extraen el SRD 5.2.1 en alemán. Las criaturas combinan dos lecturas de `pdftotext` (normal y `-raw`, guardada como `r_raw.txt`); conjuros y compendio salen de `stream.py`. |
| `tools/build_it.py`, `tools/build_spells_it.py`, `tools/build_compendio_it.py` | Extraen el SRD 5.2.1 en italiano con el mismo método que la versión alemana. |

## Contenido libre y libros opcionales
- De serie solo va contenido del **SRD 5.2.1** (CC-BY-4.0): bestiario y conjuros. Es lo único que se publica en abierto.
- Los manuales (Manual del Jugador, etc.) se añaden por usuario desde ✨ Conjuros → 📚 Libros opcionales, con un archivo CSV/JSON propio o un enlace. Se guardan solo en ese navegador y sustituyen al conjuro del SRD equivalente.
- Versión pública: la misma página con el título «Herramientas del Máster SRD» y solo `datos/es/bestiario.json` + `datos/es/conjuros.json`.

## Probarlo en local
```
python -m http.server 8000
```
y abre http://localhost:8000. Los datos (combate, grupo, encuentros, criaturas propias) se guardan en el navegador.

## Tests
Sin dependencias: usan el ejecutor de tests de Node (`node --test`). Se lanzan con `npm test` o `node --test tests/`.

| Archivo | Qué comprueba |
|---|---|
| `tests/datos.test.mjs` | Criaturas, conjuros y compendio de cada idioma: mismo contenido que el inglés, campos obligatorios, sin caracteres basura del PDF. |
| `tests/i18n.test.mjs` | Los cinco diccionarios con las mismas claves, los textos de `T('…')` traducidos y la versión igual en `VERSION`, `CHANGELOG.md`, el menú y los changelogs. |
| `tests/seguridad.test.mjs` | Sin secretos en git, clave publicable de Supabase, manuales fuera del repositorio, scripts externos con versión e integridad (SRI), RLS y límites en `supabase/schema.sql`. |
| `tests/navegador.test.mjs` | Abre la página en Edge o Chrome sin ventana con módulos, grupo, bestiario y copia de seguridad maliciosos (código en todos los campos) y con datos de tipos absurdos; recorre todas las vistas y comprueba que nada se ejecuta ni rompe la página. También prueba las tiradas y las rarezas en todos los idiomas. Se salta si no hay navegador (`BROWSER=ruta` para indicar otro). |

El hook `.githooks/pre-push` pasa los tests antes de cada `git push` y no deja subir si alguno falla. Se activa una vez por clon con `git config core.hooksPath .githooks`.

## Versionado
Versionado semántico. Cada cambio actualiza `VERSION`, `CHANGELOG.md`, el historial de la página principal y crea una etiqueta git `vX.Y.Z`.

## Licencias
El contenido del SRD 5.2.1 se usa bajo CC-BY-4.0: «This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License.»

## Cuentas y catálogo (Supabase)

Las cuentas son solo con Discord (no se envían correos).

1. En Supabase → **SQL Editor**, ejecuta `supabase/schema.sql` (se puede repetir sin problema).
2. En el portal de desarrolladores de Discord, crea una aplicación y añade en **OAuth2 → Redirects** `https://mjzolxysvxoauvaxuqcq.supabase.co/auth/v1/callback`.
3. En Supabase → **Authentication → Sign In / Providers → Discord**, actívalo con el Client ID y el Client Secret de Discord.
4. En **Authentication → URL Configuration**, pon la dirección de Cloudflare (`https://herramientas-del-master.sotoaeduardo.workers.dev`) como Site URL y añádela (con `/**`) a Redirect URLs.
5. La URL y la clave publicable del proyecto están en `index.html` (`SB_URL`, `SB_KEY`). Nunca pongas ahí la clave `service_role`/secret.

Para ocultar un módulo del catálogo, pon `oculto = true` en la tabla `modulos_publicos`; las denuncias llegan a la tabla `denuncias`.
