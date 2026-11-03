# Changelog

Todas las versiones de «Herramientas del Máster». El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [versionado semántico](https://semver.org/lang/es/).

Artifact publicado: https://claude.ai/artifact/N4KWLLNZUVYXCYNriSYwtP

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
