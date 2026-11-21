# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Másteres de D&D 2024 en general, sobre todo hispanohablantes pero también en inglés, francés, portugués, italiano y alemán. Lo usan en dos momentos:

- **En la mesa, durante la sesión**: en un portátil junto a la pantalla del máster, o con una tablet o un móvil en la mano. Llevan el combate (iniciativa, PG, estados, tiradas), consultan reglas y criaturas y tiran en tablas, todo sin perder el ritmo de la partida.
- **En casa, preparando**: crean encuentros, criaturas y tablas, dan de alta a los personajes de los jugadores y consultan el compendio.

La versión pública es el producto principal. La personal es la misma página con contenido privado añadido.

## Product Purpose

Reúne en una sola página web las herramientas que un máster necesita para dirigir: tracker de combate, jugadores, tablas aleatorias, referencia rápida de reglas y compendio del SRD 5.2.1 (criaturas, conjuros, objetos, dotes, clases, especies y trasfondos). Funciona en cuanto se abre, sin instalar nada ni registrarse. Tiene éxito cuando el máster puede llevar un combate entero, y encontrar cualquier regla o criatura, sin salir de la página ni frenar la mesa.

## Positioning

- **Todo en una página**: combate, jugadores, tablas, referencia y compendio juntos, sin instalar nada.
- **Español primero**: reglas 2024 y el SRD 5.2.1 oficial en español. La interfaz está en 6 idiomas.
- **Gratis y sin cuenta**: todo funciona sin registrarse. La cuenta solo sirve para guardar lo tuyo (personajes, encuentros, tablas, criaturas y módulos) en la nube.
- **Tus propios contenidos**: módulos homebrew, criaturas y tablas propias, y la copia personal de los manuales del usuario.

## Operating Context

- Se usa en directo, con los jugadores delante. Las acciones frecuentes (siguiente turno, daño o curación, aplicar estados, tirar dados) tienen que ser rápidas e inequívocas.
- Mismo uso en portátil, tablet y móvil.
- Sin cuenta, los datos viven en localStorage. Con cuenta (Supabase: Discord o correo), se sincronizan.
- Se publica en GitHub Pages (`index.html`) y como artifacts de claude.ai. En los artifacts no hay cuentas.

## Capabilities and Constraints

- Un solo archivo HTML (HTML + CSS + JS vanilla), sin dependencias ni compilación. Los datos van en JSON aparte (`datos/<idioma>/*.json`, `i18n/*.json`).
- Rutas por hash (`#combate`, `#jugadores`, `#tablas`, `#referencia`, `#modulos`, páginas de elemento del compendio).
- i18n: el español está en la página; el resto de idiomas se traduce con diccionarios `i18n/<lang>.json` (clave en español) y un MutationObserver. Todo texto nuevo de la interfaz necesita entrada en los 5 diccionarios, y cada versión su entrada de changelog en los 6 idiomas.
- Datos del SRD en español e inglés. Francés, portugués, italiano y alemán usan por ahora los datos en inglés.
- El SRD 5.2.1 va siempre cargado, para todos.
- Unidades configurables: m/kg o pies/libras.
- Temas claro y oscuro.
- Versionado semántico, con `VERSION`, `CHANGELOG.md`, el historial dentro de la página y una etiqueta git por versión.
- Notación de dados `d` en todos los idiomas (forma parte de la entrada de datos).

## Brand Commitments

- Nombre: «Herramientas del Máster». La versión pública se titula «Herramientas del Máster SRD».
- Voz: español cercano, de tú, frases cortas y claras. La terminología es la oficial de D&D 2024 en español.
- Licencia: el contenido del SRD 5.2.1 se usa bajo CC-BY-4.0, con su atribución obligatoria.
- No se publica contenido oficial que no sea del SRD (manuales) ni se copia texto de otras webs de referencia.

## Evidence on Hand

- Contenido real del SRD 5.2.1 en español e inglés: 331 criaturas, 339 conjuros y el compendio.
- Datos de ejemplo integrados: dos PJ (Lyra y Thorin), un combate, un encuentro y tres tablas.
- No hay testimonios, cifras de usuarios ni prensa: no inventarlos.

## Product Principles

1. **La mesa manda**: nada debe frenar la partida. Lo frecuente va a un toque y lo destructivo se confirma.
2. **Abre y funciona**: sin instalación, sin cuenta y sin esperas. La cuenta es un extra para guardar.
3. **Las reglas a mano**: cualquier regla, criatura o conjuro, a dos toques desde donde estés.
4. **Lo tuyo es tuyo**: el contenido propio convive con el oficial sin mezclarse y se puede sacar o eliminar.
5. **Multilingüe de verdad**: cada texto existe en todos los idiomas. El español nunca es una traducción.

## Accessibility & Inclusion

- Uso en mesas con poca luz y a distancia de lectura de portátil: buen contraste en los dos temas.
- Objetivos táctiles cómodos en tablet y móvil.
