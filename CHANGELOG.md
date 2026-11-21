# Changelog

Todas las versiones de «Herramientas del Máster». El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [versionado semántico](https://semver.org/lang/es/).

Artifact publicado: https://claude.ai/artifact/N4KWLLNZUVYXCYNriSYwtP

## [1.45.0] - 2026-11-21
### Añadido
- **Actualizaciones automáticas** de la app de escritorio desde las versiones de GitHub: en Windows se descargan solas y se instalan al cerrar; en Mac y en la versión portable solo avisan y abren la página de la versión. Se comprueban al arrancar, cada 6 horas y con «Buscar actualizaciones» en Preferencias.
- **Copias de conflicto** en la campaña: cuando dos dispositivos cambian lo mismo, la versión perdida se puede ver, recuperar o descartar.
### Cambiado
- Los instaladores ya no incluyen nunca `datos/privado/`: solo llevan datos libres (SRD). Los libros se importan desde la app y viven en el perfil del usuario.
- Las versiones se compilan y publican en GitHub al subir una etiqueta `v*`.

## [1.44.0] - 2026-11-20
### Añadido
- **Hoja de personaje en PDF de 2 páginas**, al estilo de la hoja oficial: datos, combate, características con salvaciones y habilidades, armas, recursos, rasgos y magia con tabla de conjuros. También en blanco.
- **Importar desde Roliando**: «Importar» en Personajes acepta el JSON de Roliando y avisa de lo que no entra (formas salvajes, monturas, compañeros).
- **Sincronización de campañas**: ahora también viajan las fichas de personaje, los grupos y los permisos de los jugadores; la biblioteca de la cuenta incluye los personajes libres (ejecutar `supabase/schema.sql`).
- **Discord en la app de escritorio**: se entra en el navegador del sistema y se vuelve a la app (`herramientasdelmaster://auth`).
- Ficha: encabezado y bloque de vida más ordenados en escritorio.
- **Grupos** en cada campaña (antes «Jugadores»): el de los jugadores (lo normal, uno solo), aliados, rivales o neutrales. Sus miembros pueden ser criaturas del bestiario, PNJ o personajes, y cada grupo se lleva al combate como bando propio.
- **Cada jugador lleva un personaje** de la campaña y se ve en su tarjeta. «Ha caído» deja al personaje en la campaña como caído, con su historial, y el jugador elige otro; si cambia de personaje sin más, el anterior queda retirado.
- **Personajes**: meter un personaje en una campaña crea una copia con progreso propio, enlazada a su versión base. La vista global enseña cada personaje base con sus versiones en todas las campañas y permite abrirlas; los caídos y retirados van aparte, y una copia cuyo original se borró sigue funcionando.
- **El combate usa la ficha del personaje**: si el jugador lleva uno, entra con sus PG, CA, iniciativa, espacios de conjuro y conjuros; lo que pasa en el combate (daño, conjuros lanzados, descanso largo) vuelve a la ficha y lo que cambias en la ficha se refleja en el combate. La ficha tiene ahora su lista de conjuros. Sin personaje, el jugador sigue usando su tarjeta.
- **Permisos y cambios propuestos** en los personajes de campaña: el máster decide por grupo de campos si el jugador los cambia **libre**, **con aprobación** o **bloqueado** (por defecto: PG, espacios, notas y nombre libres; inventario, monedas, conjuros, CA y velocidad con aprobación; nivel, características, dotes y experiencia bloqueados, salvo la subida guiada, que se propone). El jugador ve sus cambios pendientes y puede retirarlos; el máster tiene una bandeja con el antes y el después para aceptar o rechazar, uno a uno o todo. Los personajes fuera de campaña los toca todo el jugador. Selector «Ver como» máster o jugador, a la espera de las cuentas.
- La ficha tiene **monedas e inventario**.
- **Ficha completa**, todo opcional y de entrada libre: habilidades con competencia y pericia (y percepción pasiva), salvaciones competentes, ataques con tirada de ataque y de daño, rasgos con usos que los descansos recuperan, magia con característica de lanzamiento, CD, nivel y preparados por conjuro, estados, resistencias e inmunidades, idiomas y competencias, y personalidad e historia. Cada apartado tiene su grupo de permisos y el combate recibe lo que le hace falta.
- **Bloqueo de pantalla** en la app de escritorio, para dejar la mesa un momento: botón de candado en la barra o Ctrl+Mayús+L. Tapa toda la aplicación, como un salvapantallas, con un mensaje que eliges, y solo se abre con el PIN. El PIN se pone o se cambia en Preferencias sin más (si lo olvidas, entras y pones otro), se guarda solo como huella con sal y, si cierras la aplicación bloqueada, sigue bloqueada al abrirla. Autobloqueo opcional tras 1 a 60 minutos sin usarla, y espera creciente tras fallar el PIN.
- **Sesiones de campaña**: una barra bajo el menú muestra la sesión activa (con su hora y duración) o permite iniciar la que toca, o crear una nueva. Con la sesión en curso, la barra da acceso a su plan, y «Finalizar sesión» marca la sesión como jugada y ofrece escribir un resumen opcional de lo ocurrido, que se guarda como entrada del diario (privada o compartida con los jugadores). Solo puede haber una sesión en curso. **Calendario de sesiones** en la pestaña Sesiones: marca las planeadas, en curso y jugadas, y al pulsar un día se abre su sesión o se planea una nueva. Si hoy toca una sesión, la barra ofrece iniciarla directamente, como un cronómetro: se guardan la hora de inicio y de fin, y la pestaña muestra estadísticas (jugadas, tiempo total, duración media y la más larga). Al finalizar se puede indicar la fecha de la próxima sesión y queda planeada en el calendario. En una campaña con sesiones, **el combate pide una sesión activa**; la mesa suelta (sin campaña ni sesiones) se usa libremente.
- **Imprimir la sesión**: un botón en cada sesión genera el cuaderno del máster para trabajar sobre papel (en el navegador y en la app, a papel o a PDF). Cada apartado empieza en una página nueva para poder separarlos: plan y escenas con casillas, encuentros con la ficha de cada criatura y su tabla de iniciativa y PG, hoja de iniciativa en blanco, y los PNJ, lugares, tiendas y misiones que la sesión menciona. También **hoja de personaje** para imprimir, rellenada con la ficha o en blanco (una o varias copias).
- **Copia de seguridad completa** en un solo archivo: campañas con sus sesiones y diario, personajes, grupos, encuentros, tablas, módulos y preferencias (sin tu sesión de cuenta ni el PIN del bloqueo). Se descarga, y se restaura en este u otro dispositivo: antes de restaurar se descarga una copia de lo actual, y se recrean las campañas que falten. En la app de escritorio, **copia automática** a la carpeta que elijas cada vez que finalizas una sesión, conservando las últimas 30; en el navegador se ve, pero bloqueada.
- **Enlaces de audio** (botón ♪ de la barra): guarda con la campaña los enlaces de tu música y ambientes (YouTube, Spotify…) y ábrelos con un clic en tu navegador externo. La herramienta no reproduce nada, así que no hay anuncios ni dependencias. Viajan en la copia de seguridad.
- **Corregida la tabla de presupuesto de XP por nivel** (dificultad de encuentros): los valores moderado y alto de varios niveles estaban escritos de memoria y no coincidían con la Guía del DM 2024 (p. ej. nivel 10 moderado 2300, nivel 20 alto 22000). Revisada contra fuentes secundarias.
- Si el máster rechaza o el jugador retira un rasgo propuesto con usos, ya no queda un recurso suelto. Si el máster cambió algo después de que se propusiera, al aceptar se avisa de que se sustituye ese cambio. La exportación a Markdown incluye ahora habilidades, salvaciones, ataques, rasgos, conjuros, defensas, idiomas, inventario y personalidad.
- **Al iniciar sesión, las campañas de tu cuenta que faltan en ese dispositivo se añaden solas** (antes había que pulsar «Traer»). Su contenido baja al abrirlas. Las que quites a propósito de un dispositivo no vuelven solas. Nuevo `supabase/permisos.sql` con los permisos de las tablas, que faltaban y daban «permission denied».
- **Entrar con correo y contraseña** (además de Discord): crear cuenta con nombre de usuario, confirmar el correo, entrar, y recuperar la contraseña con un enlace. Funciona en la web y en la app de escritorio (el enlace del correo se abre en el navegador; después se entra en la app con la contraseña).
- **Datos ordenados:** los JSON del SRD ya no están sueltos en la raíz. Ahora viven en `datos/<idioma>/` (`bestiario.json`, `conjuros.json` y `compendio.json` para es, en, fr, de e it), y lo personal (tus conjuros y libros) en `datos/privado/`, que no se sube a git. Las herramientas de generación, los tests y el empaquetado de escritorio usan las rutas nuevas.
### Cambiado
- «Nuevo personaje» de la pestaña de jugadores pasa a llamarse «Nuevo jugador», para distinguirlo de las fichas de Personajes.
- La copia de seguridad incluye los grupos.

## [1.43.0] - 2026-11-20
### Añadido
- **Personajes**: nueva sección con fichas de personaje. Separa «En esta campaña» y «Mis personajes» (libres, para probar). Hoja con características, vida, CA, velocidad, dados de golpe, descansos corto y largo, espacios de conjuro, recursos, experiencia o hitos (se elige por campaña) y dotes.
- **Subida de nivel guiada** con PG, mejora de característica o dote, y bloqueos en los personajes de campaña.
- **Sección solo para el máster** en cada personaje de campaña: eventos, secretos y notas que no se exportan ni se comparten.
- **Exportar** a Markdown o JSON en seis idiomas, e importar siempre como personaje libre.

## [1.42.0] - 2026-11-19
### Añadido
- **Sincronización de campañas con tu cuenta**, por elemento (notas, encuentros y jugadores), con copia local y versiones: sin conexión todo sigue funcionando y se sube al volver; si dos dispositivos tocan lo mismo gana la versión más reciente y la otra queda guardada. Un elemento borrado no reaparece. Se activa por campaña desde «Gestionar campañas» y las campañas de tu cuenta se pueden traer a otro dispositivo.

## [1.41.0] - 2026-11-19
### Añadido
- **Cuentas atrás** sueltas para la ventana de mesa (una trampa, un puzle, «decidid en 5 minutos»): se crean desde el panel de la mesa, con iniciar, pausar, reiniciar y mostrar u ocultar en la mesa. Se superponen a lo que haya en pantalla, o van centradas y grandes si la mesa está vacía. Al llegar a cero avisan.

## [1.40.0] - 2026-11-19
### Añadido
- **Eventos de encuentro**: algo puede ocurrir por ronda (una vez o repetido), por tiempo real o a mano: más enemigos, un derrumbe… Cada evento puede llevar aviso (opcional), refuerzos, imagen para la mesa y una nota privada. En el combate sale una tarjeta con opciones y el máster decide: disparar, posponer o descartar; nada ocurre solo.
- Reloj de tiempo real con pausa manual; al cerrar la aplicación queda en pausa.
- La ventana de mesa puede mostrar la cuenta atrás de un evento y los avisos.
- Sincronización por elemento: motor de fusión con versiones, conflictos y borrados (aún sin conectar) y migración SQL.

## [1.39.0] - 2026-11-19
### Añadido
- **Encuentros** dentro de la Campaña: calculadora de dificultad con el presupuesto de XP de D&D 2024 para el grupo (los jugadores de la campaña o un grupo manual), generador aleatorio por dificultad, tipo, máximo y variedad (con criaturas fijables) y edición de última hora antes de lanzar, sin tocar el encuentro guardado. El combate solo los usa.
- Ventana de mesa: panel de control (qué se envía, limpiar, congelar, abrir y cerrar) y envío automático del orden al empezar el combate.
- Motor de ficha de personaje (núcleo, sin interfaz todavía).

## [1.38.0] - 2026-11-19
### Añadido
- **Ventana de mesa** (app de escritorio): una segunda ventana, para otro monitor o proyector, que muestra imágenes de la campaña («Mostrar en la mesa») y el **orden de iniciativa simplificado** (solo nombres, turno y ronda; nunca PG, CA ni notas), que se actualiza sola. F11 o doble clic para pantalla completa.
- Sesiones: **encuentros guardados enlazados** al plan, con botón para cargarlos en el combate.
- Visibilidad por elemento: solo el máster (por defecto), jugadores de la campaña o cualquiera con el enlace. De momento solo se guarda; se aplicará al publicar la campaña.
- El grupo de **Jugadores** pasa a ser una pestaña de Campaña.
### Cambiado
- Los controles de Campaña usan el aspecto de cada estilo, como el resto de la aplicación.

## [1.37.0] - 2026-11-19
### Añadido
- Sección **Campaña**: sesiones (planificación con escenas), diario (resúmenes), PNJ, lugares, tiendas con inventario, misiones con objetivos y notas. Texto en Markdown, enlaces `[[Nombre]]` con autocompletado al escribir «[[» y detección automática de menciones por nombre (clicables), «Mencionado en», búsqueda en toda la campaña, imagen opcional y marca «visible para los jugadores». Un PNJ puede vincular una criatura del bestiario (SRD o propia) con su ficha y añadirse al combate. Cada campaña tiene sus propias notas y entran en la copia de seguridad.
- App de escritorio: estilo propio «Escritorio», barra lateral plegable, atajo Ctrl+K / Ctrl+F para buscar y panel del turno también para criaturas sin ficha.

## [1.36.0] - 2026-11-19
### Añadido
- Campañas: combate, grupo y encuentros son por campaña; selector en la barra y ventana para crear, abrir, renombrar y borrar. La campaña «local» conserva los datos de siempre.
- App de escritorio para Windows y Mac (Electron, carpeta `desktop/`) con almacén SQLite local y copias de seguridad automáticas.
- Esquema de Supabase para campañas con permisos por rol (`supabase/campanas.sql`).
- Supabase configurable con `window.APP_CONFIG`; la web apunta a una cuenta nueva.
### Corregido
- Etiqueta viewport: el diseño móvil no se activaba al servir la página sola.

## [1.35.0] - 2026-11-04
### Añadido
- SRD 5.2.1 en alemán e italiano: `srd2024_de/it.json`, `conjuros_srd_de/it.json` y `compendio_srd_de/it.json`, con sus generadores en `tools/`; `DATA_LANG` admite `de` e `it`. Las tiradas reconocen los formatos alemán e italiano.
- Tests automáticos (`npm test`, `node --test tests/`): datos de cada idioma, traducciones, versión, seguridad estática y ataque real en Edge sin ventana. El hook `.githooks/pre-push` los pasa antes de cada subida.
- `_headers` con cabeceras de seguridad.
### Corregido
- Seguridad: los módulos del catálogo ya no pueden colar HTML ni código en objetos, dotes, clases, especies, trasfondos y reglas; los datos guardados, los módulos y las copias de seguridad se sanean al cargarlos (antes un dato mal formado dejaba la página rota) y la copia no puede tocar el prototipo de los interruptores de módulos.
- supabase-js se carga con integridad (SRI).
- Supabase: solo las claves que sincroniza la página y 5 MB por fila en `datos_usuario`, 30 módulos por autor y una descarga por cuenta y módulo.
- Datos: descripción de Greater Invisibility, ficha de Kalte Hand, Evoca creature boschive, guiones blandos en las criaturas alemanas y rareza de dos objetos italianos.

## [1.34.0] - 2026-11-04
### Añadido
- SRD 5.2.1 en francés: `srd2024_fr.json`, `conjuros_srd_fr.json` y `compendio_srd_fr.json`, extraídos del PDF oficial con `tools/build_fr.py`, `tools/build_spells_fr.py` y `tools/build_compendio_fr.py`; `DATA_LANG` admite `fr`.
- Las tiradas reconocen el formato francés («Corps à corps : +9», «dégâts de feu», «DD 14»).
### Corregido
- Iconos de la referencia rápida para los nombres de reglas en inglés y francés.
- El tipo de entrada («Clase», «Objeto»…) del subtítulo de las fichas del compendio salía sin traducir; también el título «Tirar ataque».

## [1.33.0] - 2026-11-04
### Cambiado
- Referencia rápida: iconos SVG del sprite (49 símbolos nuevos) en lugar de emojis en `QR_SECS` y `QR_ICON`; el desplegable de categorías va sin iconos.
- Tarjetas de la referencia sin franja lateral de color; el color de la categoría lo lleva el icono. Cuaderno y Libro de reglas las muestran como entradas sin caja.

## [1.32.0] - 2026-11-04
### Añadido
- Estilo «Cuaderno» (claro y oscuro), ahora el de serie: letra a mano, fluorescente en el turno, renglones como separadores y PG anteriores tachados (se guardan los tres últimos en `hph`; se borran al empezar un encuentro nuevo).
- Estilo «Libro de reglas» (claro y oscuro): EB Garamond, versalitas y rúbricas, iniciativa en el margen, sin tarjetas.
- Estilo «Pantalla del máster» (oscuro): hojas con bisagra y raíl de fichas de iniciativa (`#rail`), con la del turno levantada; pulsar una ficha lleva a su criatura.
- Ajuste «Tema» en ⚙ Preferencias (automático, claro u oscuro), guardado en `combat-theme`.
- Juego de iconos SVG propio (sprite `#i-*`, helper `ic()`) en lugar de emojis en menú, portada, barra, cuenta, buscador y compendio.
### Cambiado
- Quien no tenía estilo guardado pasa a ver «Cuaderno»; quien eligió otro (Clásico incluido) lo conserva.

## [1.31.0] - 2026-11-04
### Cambiado
- Nuevo diseño: el estilo Clásico pasa a «Tinta y cuero» (papel crema en modo claro, cuero oscuro en modo oscuro, rúbricas rojas, filetes y sello de iniciativa). Esos recursos de manual se aplican también a Arcano y Taberna.
- Móvil y tablet: barra de turno inferior, menú ☰ plegable, lista de iniciativa que gira con el turno, franja «Después» y ficha del turno plegable dentro de la lista; objetivos táctiles de 44 px.
- Las confirmaciones se hacen en una ventanita junto al botón en lugar de cambiar su texto.
- − y + de vida con el campo vacío restan/suman 1 (o usan la última tirada para el daño).
### Añadido
- Aviso con «Deshacer» tras quitar una criatura, terminar, empezar un nuevo encuentro o vaciar el combate; «Deshecho» indica qué se ha deshecho.
- Resumen al terminar el combate (rondas, turnos, caídos, quién sigue en pie, PG del grupo) con descanso largo y nuevo encuentro.
- Estado «Maltrecho» escrito junto a los PG, anuncio del turno para lectores de pantalla, Vista y Estilo también en ⚙ Preferencias.
### Eliminado
- Estilo «Pergamino» (quien lo tuviera guardado pasa a Clásico).

## [1.30.0] - 2026-11-04
### Cambiado
- El SRD 5.2.1 va siempre cargado, para todos; en Módulos aparece como «Incluido siempre» y ya no se puede desactivar.
- Los datos de ejemplo ya no dependen de activar el SRD.
### Añadido
- Aviso en Combate, Jugadores y Tablas cuando no hay sesión: lo tuyo se guarda solo en este navegador.
- La ventana de la cuenta muestra el SRD activo, su versión y el idioma de sus datos.

## [1.29.1] - 2026-11-04
### Añadido
- Botón «Eliminar datos de ejemplo» en la ventana de la cuenta: quita solo lo marcado como ejemplo (`ex: true` en personajes, encuentros, tablas y criaturas del combate) y deja intacto lo demás.

## [1.29.0] - 2026-11-04
### Cambiado
- La web empieza vacía: sin combate, grupo, encuentros ni tablas de ejemplo.
### Añadido
- Botón «Insertar datos de ejemplo» en la ventana de la cuenta: dos personajes (con su ficha enlazada en el combate), un combate, un encuentro guardado y tres tablas, creados en el idioma de la interfaz. Solo con el SRD 5.2.1 activado.
- Más textos traducidos en la tarjeta y la ficha de los personajes.

## [1.28.0] - 2026-11-04
### Añadido
- Idiomas francés (`fr`), portugués (`pt`), italiano (`it`) y alemán (`de`) en ⚙ Preferencias, con la terminología oficial de cada edición de D&D.
- Historial de cambios por idioma: `i18n/changelog.<idioma>.html` (en, fr, pt, it, de); el español sigue dentro de la página.
### Cambiado
- El código ya no tiene casos especiales para el inglés: todo texto generado pasa por `T()` y el diccionario se carga de forma síncrona antes que el resto. `DATA_LANG` elige los datos del SRD (por ahora `es` o `en`; fr, pt, it y de usan los ingleses).
- Pantalla de carga en los seis idiomas.

## [1.27.0] - 2026-11-03
### Cambiado
- El diccionario de la interfaz sale de la página a `i18n/<idioma>.json` (una entrada por línea, clave en español); solo se descarga si el idioma no es el español.
### Añadido
- Pantalla de carga breve mientras la página (y, en otro idioma, su diccionario) está lista.

## [1.26.0] - 2026-11-03
### Añadido
- Idioma de la web: español (por defecto) o inglés, en ⚙ Preferencias (`lang` dentro de `preferencias`, sincronizado con la cuenta). En inglés, un observador traduce la interfaz con un diccionario (textos, `placeholder`, `title` y `aria-label`; `#` = cualquier número).
- Datos del SRD 5.2.1 en inglés: `srd2024.json` (331 criaturas), `conjuros_srd_en.json` (339 conjuros) y `compendio_srd_en.json`. Herramienta `tools/build_spells_en.py`.
- Las unidades por defecto dependen del idioma (pies y libras en inglés).
### Limitaciones
- Lo que ya hayas guardado (personajes, encuentros, nombres de objetos o conjuros añadidos) se queda en el idioma en que lo escribiste. El historial de cambios sigue en español.

## [1.25.0] - 2026-11-03
### Añadido
- «Clonar y editar» y «+ Nuevo» en conjuros, objetos, dotes, clases, especies, trasfondos y reglas. Se guardan en el módulo «Mi contenido» (`mine: true`), que tiene prioridad sobre los demás si un nombre coincide.
- Las descripciones admiten tablas en formato `| a | b |`; al clonar del SRD se conservan.
- Los módulos pueden traer `reglas`.

## [1.24.0] - 2026-11-03
### Añadido
- Referencia rápida (`#referencia`, en Herramientas): las reglas de 2024 en tarjetas por categoría, con resumen y la regla completa al pulsar.
- Apartado «Reglas» del compendio: 173 entradas (glosario del SRD 5.2.1 y secciones clave de «Cómo jugar») con categoría, filtro y página propia; las referencias «Consulta también» enlazan entre reglas.
- El buscador incluye las reglas y filtra por categoría en reglas, dotes y objetos.

## [1.23.0] - 2026-11-03
### Cambiado
- Menú en dos partes: Herramientas (combate, jugadores, tablas) y Consulta (compendio, módulos). Criaturas y conjuros son apartados del Compendio (`#compendio/criaturas`, `#compendio/conjuros`; `#criaturas` y `#conjuros` siguen funcionando).
### Añadido
- Página propia para cada elemento del compendio: `#compendio/<apartado>/<nombre>`, con enlace ↗ desde los listados y el buscador.
- Preferencias (⚙): distancias en metros, pies o casillas (5 pies = 1,5 m = 1 casilla) y peso en kilos o libras (1 lb = 0,5 kg). Las medidas se reconocen en cualquier texto y se convierten al mostrarse; se sincronizan con la cuenta (`preferencias`).
### Corregido
- El alcance de las armas arrojadizas y de munición del SRD lleva su unidad (metros).

## [1.22.0] - 2026-11-03
### Añadido
- El botón «Bestiario» pasa a ser «🔎 Buscar» (tecla B): busca a la vez en criaturas, conjuros, objetos, dotes, clases, especies y trasfondos, o en un solo tipo.
- Herramientas del compendio: dar objetos, dotes y conjuros a un personaje; aplicarle una especie o un trasfondo (rasgos, velocidad y dote); crear un personaje de nivel 1 a partir de una clase.
- La ficha del personaje muestra sus objetos y la sintonización (máximo 3). El formulario guarda especie, trasfondo y objetos.

## [1.21.0] - 2026-11-03
### Añadido
- Página **Compendio** (`#compendio`) con pestañas de objetos, dotes, clases, especies y trasfondos, filtros, búsqueda y detalle desplegable con dados clicables.
- `compendio_srd.json`: 258 objetos mágicos, 38 armas, 13 armaduras, 25 herramientas, 81 piezas de equipo, 17 dotes, 12 clases, 9 especies y 4 trasfondos del SRD 5.2.1, extraídos con `tools/stream.py` y `tools/build_compendio.py`.
- Los módulos homebrew pueden aportar `objetos`, `dotes`, `clases`, `especies` y `trasfondos`; una entrada con el mismo nombre sustituye a la del SRD.

## [1.20.0] - 2026-11-03
### Añadido
- `terminos.html` (condiciones del servicio) y `privacidad.html` (política de privacidad), enlazadas en el pie y en la ventana de cuenta.

## [1.19.2] - 2026-11-03
### Cambiado
- Las cuentas son solo con Discord: se quitan el registro por correo, las contraseñas, los códigos por email y sus plantillas.

## [1.19.1] - 2026-11-03
### Añadido
- «Entrar con Discord» (OAuth con PKCE). La primera vez se pide el nombre de usuario.
- Política `crear mi perfil` en `supabase/schema.sql`.

## [1.19.0] - 2026-11-03
### Añadido
- Cuentas con Supabase (solo en la versión web): registro con usuario y correo, código de 6 dígitos por email, elección de contraseña y recuperación con código.
- Sincronización de combate, bestiario, grupo, encuentros, tablas y módulos con la cuenta (tabla `datos_usuario`, cada uno solo ve lo suyo).
- Catálogo de la comunidad en Módulos: publicar homebrew con licencia, añadir y actualizar módulos de otros, retirar los propios y denunciar.
- `supabase/schema.sql` y plantillas de correo en español en `supabase/emails/`.

## [1.18.0] - 2026-11-03
### Añadido
- Página «Módulos»: el contenido llega por módulos que activa cada usuario. Nada viene activado de serie (quien ya usaba la herramienta conserva el SRD activado).
- Oficiales libres (SRD 5.2.1; SRD 5.1 próximamente), oficiales «trae tu copia» (MdJ, GdM, MdM, GXT, CTT) y homebrew.
- Un módulo trae criaturas, conjuros y tablas; objetos, clases, especies, dotes y trasfondos se guardan para el futuro Compendio.
- «Crear un módulo con tu contenido»: exporta tus criaturas y tablas como JSON con autor, versión y licencia.
### Cambiado
- Los libros de conjuros registrados se convierten en módulos. Se elimina el `conjuros.json` alojado junto a la página.
### Corregido
- Abrir la página directamente en `#conjuros` con libros cargados detenía la carga.

## [1.17.0] - 2026-11-03
### Cambiado
- La portada muestra solo las tres últimas versiones; el historial completo tiene su propia página `#cambios`, enlazada desde «Ver historial completo» y desde el número de versión del menú.

## [1.16.0] - 2026-11-03
### Añadido
- Sección «🎲 Tablas aleatorias» (`#tablas`). El número de filas es el dado (80 filas = d80) y se pueden añadir tantas columnas como se quiera.
- Tirada por columna (independiente) o una sola para toda la fila; el resultado se combina con un formato de salida como `{Nombre} {Apellido}`.
- Fórmulas en celdas y formato: `{1d4} po` se tira al salir y `{@Otra tabla}` tira en otra tabla (hasta 4 niveles).
- Rellenar una columna pegando una lista (ajustando filas), Intro para bajar de fila, duplicar y borrar tablas, tiradas ×5 y ×10, historial con copiar y tablas de ejemplo.
- Las tablas entran en la copia de seguridad; reducir filas conserva el contenido de las que sobran.

## [1.15.0] - 2026-11-03
### Añadido
- Registro de libros: cada libro importado queda guardado con su nombre y abreviatura; el panel 📚 los lista con su número de conjuros y se pueden quitar uno a uno. Se pueden tener varios a la vez.
- El JSON admite `libro` y `abrev` (`{"libro": "Manual del Jugador 2024", "abrev": "MdJ", "conjuros": [...]}`) o un campo `libro` en cada conjuro.
- El filtro de fuente permite elegir cada libro registrado.
### Cambiado
- La columna Fuente muestra «MdJ p. 249» y la ficha el nombre completo del libro. `pg` pasa a ser solo el número de página.
- Lo cargado con versiones anteriores se migra solo al registro.

## [1.14.0] - 2026-11-03
### Añadido
- 📚 Libros opcionales explica el formato del JSON: tabla de campos y ejemplo con botón para copiarlo.
### Cambiado
- El importador JSON acepta la escuela escrita normal («Evocación»), el nivel «Truco», las clases como texto y sí/no en concentración y ritual. También admite un objeto con la lista en `conjuros`.

## [1.13.0] - 2026-11-03
### Añadido
- Los 339 conjuros del SRD 5.2.1 en español vienen incluidos de serie (`conjuros_srd.json`), con su nombre en inglés.
- Libros opcionales: importación de conjuros de los manuales desde archivo (CSV o JSON) o enlace, guardada solo en el navegador. Un conjuro de libro sustituye al del SRD equivalente, también los de nombre genérico («Cofre oculto» → «Cofre oculto de Leomund»).
- Columna y filtro «Fuente» en la tabla de conjuros.
- Atribución CC-BY-4.0 del SRD 5.2.1 al pie de todas las páginas.
- Versión pública con solo contenido del SRD.
### Cambiado
- `conjuros.json` ya no sustituye a todo: se suma al SRD como un libro más.

## [1.12.0] - 2026-11-03
### Cambiado
- El listado de criaturas pasa a ser una tabla con columnas separadas: nombre, tipo, tamaño, VD, CA, PG (con sus dados) y manual. Al pulsar una fila se despliega la ficha con el botón de añadir al combate, y los encabezados ordenan la tabla.
- Nuevos órdenes por CA, PG y tipo.
### Añadido
- Campo «Manual» en el editor de criaturas. Las del SRD 5.2.1 aparecen como «Manual de Monstruos 2024».

## [1.11.0] - 2026-11-03
### Cambiado
- El listado de conjuros pasa a ser una tabla con nombre, nivel, escuela, ritual, concentración y componentes (V, S, M; la M en dorado indica material con coste). Al pulsar una fila se despliega la descripción, y los encabezados ordenan la tabla.
- Nuevo orden por escuela.
- Los conjuros vuelven a publicarse con el tracker (artifact privado).

## [1.10.0] - 2026-11-03
### Cambiado
- La gestión de jugadores pasa de ventana emergente a página propia (`#jugadores`). El botón «🛡 Grupo» del combate lleva a ella.

## [1.9.0] - 2026-11-03
### Añadido
- Los conjuros vienen incluidos en el tracker (`conjuros.json`); ya no hace falta importar el CSV en cada navegador.
### Cambiado
- La cabecera solo muestra «Iniciativa» y los controles de turno en el tracker de combate; en el resto de páginas muestra «Herramientas del Máster» y enlaza al inicio.

## [1.8.0] - 2026-11-03
### Añadido
- Página principal «Herramientas útiles para el Máster» con acceso a combate, jugadores, criaturas y conjuros, y el historial de cambios.
- Enlace directo a la gestión de jugadores (`#jugadores`).
- El título de la página pasa a ser «Herramientas del Máster».

## [1.7.0] - 2026-11-03
### Añadido
- Grupo de jugadores: fichas con características, salvaciones, habilidades, ataques, acciones adicionales, reacciones y rasgos.
- Conjuros por personaje con espacios por nivel; «Lanzar» gasta el espacio más bajo disponible y aplica la concentración.
- Los PG actuales de cada personaje se conservan entre combates; «Descanso largo» los restablece junto con los espacios.
- Carga de conjuros desde CSV propio (se guarda solo en el navegador).
- Encuentros guardados: guardar y cargar configuraciones de combate.
- Páginas `#criaturas` y `#conjuros` con búsqueda y filtros.
- Los dados sueltos del texto (`1d8 + 4`, `8d6 de daño de fuego`) son botones de tirada.
- La copia de seguridad incluye bestiario, grupo y encuentros.

## [1.6.0] - 2026-11-03
### Añadido
- Vista minimalista; «⚙ Ajustes» muestra bandos y opciones.

## [1.5.0] - 2026-11-03
### Añadido
- Selector de estilo: Clásico, Arcano, Pergamino y Taberna.

## [1.4.0] - 2026-11-03
### Añadido
- Tiradas de habilidades, PG (dados de golpe) e iniciativa desde la ficha; PG e iniciativa tirados se aplican solo a esa criatura.

## [1.3.0] - 2026-11-03
### Cambiado
- Bestiario en español a partir del SRD 5.2.1 oficial; búsqueda también por nombre en inglés.

## [1.2.0] - 2026-11-03
### Añadido
- Bestiario del SRD 2024 con fichas y tiradas (ataque, daño, crítico, ventaja), recargas, usos al día y acciones/resistencias legendarias.
- Editor de criaturas propias: crear, clonar y editar.

## [1.0.0] - 2026-11-03
### Añadido
- Tracker de iniciativa con bandos, PG, PG temporales, estados con duración, salvaciones contra muerte, rondas, deshacer y registro.
