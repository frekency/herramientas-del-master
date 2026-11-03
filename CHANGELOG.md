# Changelog

Todas las versiones de «Herramientas del Máster». El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [versionado semántico](https://semver.org/lang/es/).

Artifact publicado: https://claude.ai/artifact/N4KWLLNZUVYXCYNriSYwtP

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
