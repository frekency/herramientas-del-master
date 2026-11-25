# Changelog

Todas las versiones de «Herramientas del Máster». El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [versionado semántico](https://semver.org/lang/es/).

Artifact publicado: https://claude.ai/artifact/N4KWLLNZUVYXCYNriSYwtP

## [1.121.5] - 2026-11-25
### Corregido
- **Campos de formulario:** al enfocar (fondo amarillo), el texto de ayuda y el cursor pasan a tinta en vez de quedarse en gris, en claro y en oscuro.

## [1.121.4] - 2026-11-25
### Cambiado
- **Menú «Más» más corto:** se quitan Audio y Preferencias. Las preferencias se abren desde el botón del usuario (la cuenta) y la tarjeta de Utilidades; la tarjeta de Audio desaparece.

## [1.121.3] - 2026-11-25
### Corregido
- **Móvil:** la cabecera vuelve a quedar fija arriba al desplazarte.
- **Modo oscuro en la PWA:** los colores de la barra del sistema y del arranque de la app usan la paleta actual (antes eran los marrones del tema antiguo), y el fondo y el esquema de color se declaran desde el primer fotograma, para que no salga claro al abrir.

## [1.121.2] - 2026-11-25
### Corregido
- **iPhone:** la cabecera (título y buscador) ya no queda tapada por la franja de la barra de estado.

## [1.121.1] - 2026-11-25
### Corregido
- **Móvil:** la cabecera ya no se queda fija tapando las pestañas de arriba (en combate sí, porque lleva el turno) y la pestaña de la sección actual se lee: amarillo con tinta oscura, también en modo oscuro.

## [1.121.0] - 2026-11-25
### Cambiado
- **Móvil sin sobresaltos:** ninguna pantalla se sale del ancho; las tablas del compendio pasan a ser fichas (nombre grande y datos con su etiqueta), los filtros se reparten bien y los botones, pestañas, selectores y enlaces miden al menos 44 px.
- **Costura con la portada:** la cabecera lleva una tira de cuero, y los títulos de cada pantalla van a mano con subrayado amarillo.
- **Movimiento suave:** las notas de la portada caen sobre el cuero y se levantan al pasar el ratón (respeta «reducir movimiento»).
- **Estados vacíos con carácter:** un hueco discontinuo con letra a mano en combate y campaña.
- **Primeros pasos:** una campaña vacía ya no abre sola una ventana; la portada propone ponerle nombre, crear un personaje o probar con datos de ejemplo.
- **Accesibilidad y ligereza:** selectores con nombre accesible y solo dos familias tipográficas cargadas (Inter y Kalam).
- **Limpieza:** paleta de reserva igual a la del diseño actual y animaciones sin uso eliminadas.

## [1.120.0] - 2026-11-25
### Cambiado
- **Portada «pantalla del máster»:** la trasera de la pantalla del máster en cuero con costura y pliegues, con cuatro notas distintas clavadas (post-it con chincheta, nota con pliegue, hoja de cuaderno con cinta y ficha con la marca de un café), escritas a mano. Se ve igual en claro y oscuro.
- **El resto de la app, más sencillo:** títulos en tinta (el rojo queda para avisos), botones con borde fino y esquinas redondeadas, y el aviso de la app de escritorio como una línea discreta.
- **Campos de formulario:** línea inferior, como rellenar un impreso; al escribir se resaltan en amarillo.
- **Resaltado amarillo nuevo:** `#f0dc7c` en claro y `#e9cf55` en oscuro, con el texto en tinta oscura; el aviso de abajo usa el mismo amarillo.
- Se documenta el sistema de diseño en `DESIGN.md`.

## [1.119.0] - 2026-11-25
### Cambiado
- **Un solo estilo visual: «Limpio»** (colores y adornos de Cuaderno con una sola tipografía sans, escala corta y títulos rectos). Se quitan Cuaderno, Libro de reglas, Pantalla del máster, Clásico, Arcano, Taberna y Escritorio, y el selector de estilo.
- **Sincronización: manda siempre la cuenta (Supabase).** Si algo cambió en la cuenta y en este dispositivo, se queda lo de la cuenta. Sin conexión (app de escritorio) todo se guarda en local y se sube en cuanto vuelve internet.

### Eliminado
- Los conflictos de datos: el modo manual con elegir «la de este dispositivo / la de la cuenta», las copias de conflicto recuperables, sus avisos y pantallas, y la unión automática de módulos entre dispositivos.

## [1.118.0] - 2026-11-25
### Añadido
- **Reloj de campaña con el calendario de Harptos** (Reinos Olvidados): fecha de inicio de la campaña, hora del día, estación, descanso corto (+1 h), descanso largo (+8 h), horas o días de viaje y de exploración, y aviso de cuándo se puede hacer el siguiente descanso largo (24 h). Al finalizar una sesión se indican los días que han pasado en el juego. Sortea el clima del día según la estación. Los jugadores ven el reloj; solo el máster lo mueve.
- **Diario del personaje**: capítulos propios de cada personaje de campaña, que solo ven su jugador y el máster. Nace con el trasfondo y el lugar de origen. Pendiente de aplicar `supabase/diario-personaje.sql` para que el jugador lo sincronice.
- Los descansos de la ficha de un personaje de campaña preguntan al máster si suman su hora al reloj. En Campaña, el jugador ve la tarjeta «Mi diario» con acceso a su diario.
- **Lugar de origen** en el creador de personajes y en la hoja.
- **Inventario desde el compendio**: añade objetos del compendio a la ficha, con marca de sintonizable, usos (cargas) que se gastan y se recargan, y munición que se gasta de uno en uno.

## [1.117.2] - 2026-11-24
### Corregido
- Un jugador que entraba en un dispositivo donde ya estaba el máster veía la campaña como máster (criaturas, módulos, combate) y vacía. El rol (máster o jugador) ahora lo manda la cuenta en cada campaña, y si cambia, la app se recarga una vez.
- La sincronización de un jugador ya no quita en su copia local lo que no le llega: un jugador solo lee una parte de los datos y eso no significa que esté borrado.
- Crear la cuenta de un jugador: la función de Supabase no tenía permisos sobre las tablas y veía la campaña como inexistente; corregido en Supabase (permisos del rol de servicio).

## [1.117.1] - 2026-11-24
### Corregido
- Crear la cuenta de un jugador fallaba con «esa campaña no es tuya» cuando el enlace de la campaña guardado en el dispositivo apuntaba a un id que no existe en la cuenta. Ahora se comprueba antes: se enlaza a tu campaña de la nube con el mismo nombre (o se crea una) y, si la campaña es de otra cuenta, el mensaje lo explica.

## [1.117.0] - 2026-11-24
### Cambiado
- Sincronización: la cuenta manda. Ya no hay conflictos que resolver a mano: si algo cambia en dos sitios gana lo más reciente y la otra versión queda como copia recuperable. Sin conexión se sigue trabajando en local y, al volver la red, todo sube solo. Se sincroniza cada 10 s con la app abierta.
### Corregido
- El aviso de «conflictos por resolver» que reaparecía tras resolverlo: lo que se descarga de la cuenta ya no se confunde con una edición propia.
- Compendio: «Referencia rápida» vuelve a verse con ese nombre en la portada y en la propia vista.

## [1.116.2] - 2026-11-24
### Corregido
- Portada: en la app de escritorio las cuatro columnas se desbordaban y cortaban los títulos. Ahora son cuatro tarjetas grandes en cuadrícula 2×2, con «¿Qué hacemos hoy?» y la campaña activa arriba, y accesos rápidos compactos al pie de cada tarjeta.

## [1.116.1] - 2026-11-24
### Corregido
- En el móvil y en la app instalada no había forma de abrir Campañas (cambiar de campaña y resolver conflictos de sincronización): ahora hay un botón con la campaña activa en la portada y una tarjeta «Campañas» en Utilidades, con aviso «⚠ N conflictos por resolver».
- iOS ya no hace zoom al escribir (por ejemplo, al iniciar sesión) y no se queda ampliado: los campos de texto miden 16 px en pantallas táctiles.
- Barras del móvil más compactas: «Más» y la cuenta pasan a icono y la franja «Sin sesión activa» solo se ve en Campaña (o con una sesión en curso).

## [1.116.0] - 2026-11-24
### Añadido
- La web se puede instalar como aplicación (PWA): icono propio, pantalla completa sin la barra del navegador y apertura sin conexión con lo ya visitado. En el iPhone: Compartir > Añadir a pantalla de inicio. Primero la red, así las versiones nuevas llegan siempre.

## [1.115.1] - 2026-11-24
### Corregido
- Portada en móvil: las tarjetas van en una columna, sin estirarse ni dejar huecos, con los accesos en dos columnas, y caben los cuatro bloques en poco más de una pantalla.
- Las cuatro pestañas de la barra se reparten el ancho en el móvil y «Más» con la cuenta bajan juntos a la fila siguiente.
- La franja «Sin sesión activa» ya no ocupa una fila en la portada (sí se ve con una sesión en curso).

## [1.115.0] - 2026-11-24
### Cambiado
- Navegación en cuatro bloques: Campaña, Personajes, Compendio y Utilidades, en la barra y en la portada (cuatro tarjetas a pantalla completa). Combate y Ventana de mesa quedan dentro de Campaña; Referencia y Homebrew, en Compendio; Tablas, Módulos y Revisión, en Utilidades.
- Nueva página Utilidades con preferencias, audio y cuenta. Las rutas no cambian.
- Cada tarjeta de la portada lleva accesos de un toque (Combate, Ventana de mesa, Criaturas, Tablas…, y los primeros personajes).
- Con un combate en curso, una pastilla «Combate · R3 · turno» en la barra vuelve a él desde cualquier pantalla. Atajos: C para el combate y 1 a 4 para los bloques.
- Accesibilidad: la barra marca la página actual con `aria-current`, y los enlaces secundarios y las pestañas de Campaña miden 44 px en móvil.
- Cabecera del combate en una sola fila (sin el botón Grupo; las etiquetas de los botones se ven desde 1000 px de ancho y Terminar queda separado).
- Las pestañas de Campaña pasan a tres segmentos (Jugar, Preparar y Grupo) que muestran solo sus pestañas; el Diario va en Jugar.
- Utilidades usa un solo patrón de tarjetas (herramientas y ajustes), con una línea de descripción cada una.

## [1.114.0] - 2026-11-24
### Añadido
- Lugares: casilla «Apto como mapa de combate»; los marcados se ofrecen en el estudio de la mesa con su mapa. El mapa de un lugar usa la nueva compresión WebP (hasta 2048 px).

## [1.113.0] - 2026-11-24
### Cambiado
- Subida de imágenes: compresión a WebP (calidad alta, hasta 2048 px, conserva la transparencia) con reducción de calidad y después de tamaño solo si no cabe en el límite; mismo almacenamiento para web y escritorio.

## [1.112.0] - 2026-11-24
### Añadido
- Estudio de la mesa: botón «Quitar ventana» para las ventanas 2 a 8 (con confirmación; cierra la real y borra su escena).

## [1.111.1] - 2026-11-24
### Cambiado
- Nueva publicación de la 1.111 (el instalador de Windows no se generó). Sin cambios de funcionamiento.

## [1.111.0] - 2026-11-24
### Añadido
- Capa de ambiente: selector de mezcla (normal o pantalla) validado en la ventana de mesa; prueba opcional con webm transparente en la app real (`WEBM_ALFA`).

## [1.110.0] - 2026-11-24
### Añadido
- Creador de personajes: motor de rasgos con elecciones pendientes (clase y especie), con Druida (Orden primigenia) y Elfo (linaje, aptitud mágica, Sentidos agudos) como primeros casos; sus efectos y rasgos pasan a la hoja.

## [1.109.0] - 2026-11-24
### Añadido
- Creador de personajes: idiomas del Manual del Jugador (común, dos estándar a elegir, druídico del druida, jerga de ladrones y un idioma extra del pícaro), guardados en la hoja (`otras.idiomas`) y en el resumen.

## [1.108.0] - 2026-11-24
### Cambiado
- Creador de personajes: 5 pasos (Clase, Origen, Características, Detalles, Resumen). Detalles reúne nombre, alineamiento, personalidad, ideales, vínculos, defectos e historia; el Resumen va en bloques y el desglose del origen queda plegado.

## [1.107.0] - 2026-11-24
### Añadido
- Creador de personajes: cuarto método de características, la tabla «Conjunto estándar por clase» del Manual del Jugador, con opción de ajustarla a mano.
### Cambiado
- Creador de personajes: los puntos del trasfondo se reparten con botones +2/+1 por característica (o +1 a las tres) y se bloquean al completarse.

## [1.106.0] - 2026-11-24
### Cambiado
- Ambiente: se retiran los efectos hechos con código (niebla, lluvia, nieve, tormenta, noche, brasas) y los sonidos generados. La capa muestra un vídeo o imagen animada en bucle (enlace https o carpeta de ambientes del usuario) y un sonido aparte (enlace, archivo o búsqueda). La carpeta ahora admite también vídeos e imágenes.
### Añadido
- Biblioteca de ambientes guardados (clave `mesa-ambientes-v1`): nombre, imagen o vídeo, sonido y volumen, reutilizables en cualquier escena.

## [1.105.0] - 2026-11-24
### Añadido
- Cuenta: pestaña «Claves de APIs» (Freesound y Jamendo), guardadas solo en el equipo; el buscador de la capa de ambiente remite a ella.
- Iniciativa horizontal con el aspecto del raíl de fichas de la Pantalla del máster; al elegirla, la capa se coloca como franja arriba o abajo.
### Corregido
- Mesa: mover una ficha del mapa ya no hace parpadear la escena (sin fundido entre versiones de la misma escena; imágenes de fichas decodificadas antes de mostrarlas).

## [1.104.1] - 2026-11-24
### Cambiado
- Creador de personajes: los pasos siguen los 5 del Manual del Jugador (Clase, Origen con especie y trasfondo juntos, Características, Alineamiento, Detalles) más el Resumen.

## [1.104.0] - 2026-11-24
### Añadido
- Creador de personajes por pasos (Clase, Especie, Trasfondo, Características, Detalles, Resumen) con Siguiente/Atrás: habilidades de clase, puntos del trasfondo, conjunto estándar, 4d6 o compra de puntos, y desglose del origen de cada valor en el registro de la ficha. Sustituye al formulario único.

## [1.103.0] - 2026-11-24
### Añadido
- Ambiente: buscador de sonidos de Freesound y Jamendo con la clave del usuario (guardada en la carpeta de datos, no en la página ni en las escenas), con autor, licencia, duración, escucha previa y crédito en la capa.

## [1.102.0] - 2026-11-24
### Añadido
- Ambiente: el sonido puede venir de un enlace https (mp3 o radio en directo; atajos a SomaFM) o de una carpeta de sonidos del usuario servida por app://local/__audios/ (con rangos y bucle). Solo audios, un nivel, sin salirse de la carpeta.

## [1.101.1] - 2026-11-23
### Añadido
- Capa de ambiente: enlace a Tabletop Audio (no se incrusta: su web no lo permite).

## [1.101.0] - 2026-11-23
### Añadido
- Mesa: capa «Ambiente» (niebla, lluvia, nieve, tormenta, noche, brasas) con intensidad y sonido de ambiente opcional generado con Web Audio, silenciado con el telón bajado.

## [1.100.0] - 2026-11-23
### Añadido
- Mesa: capa «Mapa de combate» (color o imagen, cuadrícula calibrada en cm reales de la pantalla, fichas en casillas que se arrastran; fichas del combate y de la galería).
- Mesa: orden de iniciativa en horizontal con tokens; solo se enseña si la escena lleva la capa.
- Combate: «Ocultar a los jugadores»; la mesa muestra «Enemigo oculto» y nunca recibe PG, CA ni debilidades.
- Mesa: proporción de la pantalla por escena (16:9, 21:9, 16:10, 4:3, toda la ventana).
- Prueba de extremo a extremo con la app real de Electron (desktop/e2e-mesa.cjs).

## [1.99.2] - 2026-11-23
### Corregido
- Publicación: la v1.99.1 no llegó a subir los archivos de Windows y la app no podía comprobar actualizaciones. Mismo código, publicada de nuevo.

## [1.99.1] - 2026-11-23
### Cambiado
- Estudio de la mesa: enviar abre la ventana con el telón bajado (texto en la barra); quitado el panel flotante y «Abrir la ventana»; botón «Cerrar mesa». Galería: títulos editables, título al subir, búsqueda por título y texto, arte de criaturas.

## [1.99.0] - 2026-11-23
### Añadido
- Mesa: hasta 8 ventanas, cada una con su escena (pestañas en el estudio) y su telón; telón en la ventana elegida o en todas.

## [1.98.3] - 2026-11-23
### Añadido
- Bandeja de dados: d2 (cae un d6; 1-3 vale 1 y 4-6 vale 2).
### Añadido
- Mesa: telón (pausa con animación y texto personalizado).
### Quitado
- Panel de la mesa: «Mostrar el orden» y «Mostrar el orden automáticamente» (lo toma la capa de iniciativa y el combate activo).

## [1.98.2] - 2026-11-23
### Corregido
- «Tirar iniciativa PNJ» no tiraba las criaturas puestas en la banda de los jugadores; ahora tira a todas las que no son personajes y pregunta quién lleva la sorpresa (desventaja), ordenando al final.

## [1.98.1] - 2026-11-23
### Cambiado
- Bandeja de dados: tablero transparente, ocupar toda la ventana, retirada automática de los dados y de la tirada escrita; rediseño de «Añadir a la escena».

## [1.98.0] - 2026-11-23
### Añadido
- Mesa: redimensión proporcional de las capas; cuenta atrás configurable dentro de su capa (con opción de retirarla al llegar a 0); fondo de escena con degradado e imagen; «Probar» dados y cuentas en la vista previa.

## [1.97.0] - 2026-11-23
### Añadido
- Mesa: capa «Bandeja de dados». Los dados (d4 a d100) se tiran en 3D con física real dentro del recuadro de la capa y se muestra el resultado; el máster tira desde el estudio (`2d6+3`, `1d20+1d4`…) y el resultado vuelve a su panel. Usa dice-box 1.1.4 (MIT), incluido en `vendor/dice-box/`. Solo escritorio.

## [1.96.0] - 2026-11-23
### Añadido
- Compendio: pestaña «Subclases» (con los rasgos de cada una por nivel) y pestaña «Tablas aleatorias» en la barra, que existía pero no se enseñaba.
- Tablas de dados del SRD dentro de un objeto: botón de tirada que da la fila del rango.
### Corregido
- Al pulsar el dado de la cabecera de una tabla del SRD se cerraba la ficha.
- Las filas con el mismo resultado seguidas se juntan en rangos también en tablas de varias columnas.

## [1.95.5] - 2026-11-23
### Cambiado
- Compendio: «Abrir su página», «Dar a…» y «Clonar y editar» son botones pequeños arriba a la derecha de la ficha, sin ocupar líneas.

## [1.95.4] - 2026-11-23
### Cambiado
- Compendio: la ficha desplegada usa todo el ancho y «Abrir su página» pasa a ser un botón dentro de la ficha, arriba a la derecha.

## [1.95.3] - 2026-11-23
### Cambiado
- Módulos de la cuenta: trozos más pequeños (2 MB) y SQL con límite de filas y hora de cambio.

## [1.95.2] - 2026-11-23
### Corregido
- Compendio: las descripciones de módulos en HTML se enseñaban con las etiquetas visibles; ahora salen como texto con negritas y párrafos.

## [1.95.1] - 2026-11-23
### Añadido
- Nuevo jugador: selector de grupo cuando hay varios grupos de jugadores.

## [1.95.0] - 2026-11-23
### Cambiado
- Web: los módulos se guardan en la cuenta (tabla `modulos_usuario`, ver `supabase/modulos_usuario.sql`) y no en el navegador; en el escritorio siguen en el disco.

## [1.94.0] - 2026-11-23
### Corregido
- Web: los módulos grandes se guardan en IndexedDB y ya no sale «el navegador se ha quedado sin espacio» al importar los manuales completos.

## [1.93.0] - 2026-11-23
### Añadido
- Los módulos activos en la cuenta y en la campaña del máster se comparten con los jugadores de la campaña (compendio, conjuros y creador de fichas), sin criaturas, tablas ni objetos mágicos. Al desactivarlos, dejan de verse.

## [1.92.1] - 2026-11-23
### Cambiado
- Las tablas que pertenecen a un objeto o rasgo ya no salen en la lista de tablas aleatorias ni en la herramienta Tablas: solo en su ficha.

## [1.92.0] - 2026-11-23
### Añadido
- Las tablas de un módulo pueden pertenecer a un objeto o rasgo (`rel`) y salen incrustadas, con tirada, en su ficha del compendio.

## [1.91.0] - 2026-11-23
### Añadido
- Compendio: pestaña «Tablas aleatorias» con las tablas de los módulos (tirada y filas por rangos) y tus tablas propias como Homebrew.
- Las tablas de un módulo entran en la Revisión; «Corregir» crea una copia propia en Tablas.

## [1.90.0] - 2026-11-23
### Añadido
- Los módulos pueden traer ilustraciones (campo `img`) en conjuros, especies, trasfondos, dotes, clases, subclases y objetos; se guardan aparte (IndexedDB) y se ven en la ficha del compendio.
- Criaturas de otros manuales (espíritus, bestias invocadas, objetos animados…) con su token.

## [1.89.1] - 2026-11-23
### Cambiado
- Las etiquetas de los manuales oficiales siguen las de 5etools: XPHB, XDMG, XMM, XGE y TCE (las antiguas se migran solas).
- En el compendio, el filtro de fuente pasa a ser de módulo y muestra la sigla con el nombre del libro.
- Las tarjetas de módulo cuentan las subclases y las opciones de clase aparte, y la ficha de cada clase lista las subclases de los manuales.

### Corregido
- Un manual oficial solo entra en su sitio: si el archivo es de otro libro (por ejemplo la Guía del DM en el Manual del Jugador) se rechaza con un aviso.

## [1.89.0] - 2026-11-22
### Añadido
- Los módulos pueden traer rasgos de clase y de subclase (clase, subclase, nivel); se ven en el compendio y en la Revisión.
- Herramientas de extracción de libros propios (conjuros, dotes, trasfondos, especies y subclases) que generan módulos privados con todo pendiente de revisar.

### Corregido
- Un módulo añadido en la web con la app de escritorio abierta ya no se pierde: si dos dispositivos cambian los módulos a la vez, se unen solos en lugar de pedir que elijas una versión.
- Lo que ya está en el SRD (dotes, trasfondos, subclases…) puede venir también en un módulo: el SRD manda y el módulo solo añade su etiqueta; lo ya revisado sí gana.
- Los conjuros importados en un módulo conservan la marca «pendiente de revisar» y sus dudas.

## [1.88.0] - 2026-11-22
### Cambiado
- «Nuevo jugador» pide nombre, nick y correo (opcional) en lugar de la ficha de combate, y puede crear la cuenta al guardar. La función crear-jugador acepta un correo real.

## [1.87.2] - 2026-11-22
### Corregido
- Módulos que desaparecían tras importarlos: las imágenes pasan a IndexedDB, reimportar fusiona (gana lo revisado), la sincronización no pisa un módulo local más completo y el aviso de falta de espacio es un diálogo.

## [1.87.1] - 2026-11-22
### Añadido
- Revisión: la página del manual aparece en cada elemento pendiente (aunque no esté verificada) y es editable.

## [1.87.0] - 2026-11-22
### Añadido
- «Ver como jugador» para el DM (recarga la app con la vista de un jugador, sin sincronizar).
- Revisión: categoría y orden elegibles, hasta 50 elementos y descarga del manual corregido.

## [1.86.0] - 2026-11-22
### Cambiado
- Un jugador solo ve del compendio lo que viene en el Manual del Jugador o el SRD; los módulos de otros manuales (Guía del Máster…) y los propios del DM quedan ocultos.

## [1.85.0] - 2026-11-22
### Añadido
- Avisos del DM sobre cambios de los jugadores (insignia, Inicio y lista en Personajes).
### Cambiado
- Quien es jugador en una campaña no ve Combate, Ventana de mesa, Tablas, Módulos ni Revisión, y en el compendio no ve criaturas ni objetos mágicos.

## [1.84.0] - 2026-11-22
### Cambiado
- Jugadores: sin botones de combate; cada jugador enseña su cuenta y el DM puede crearla (usuario + contraseña provisional). «Añadir el grupo» y «Descanso largo» pasan a Combate.

## [1.83.0] - 2026-11-22
### Añadido
- Función de Supabase «crear-jugador» (supabase/functions): solo un DM crea cuentas de jugador con contraseña provisional.
- Se puede entrar con usuario o con correo; una cuenta con contraseña provisional debe cambiarla antes de seguir.

## [1.82.0] - 2026-11-22
### Añadido
- Marca «DM» en las cuentas (supabase/dm.sql): solo el DM crea campañas; la regla está en la base de datos. Un DM puede dar la marca con dar_dm('usuario').
- La web esconde «Crear campaña» a quien no es DM.

## [1.81.2] - 2026-11-22
### Corregido
- La app de escritorio no arrancaba («Cannot find module ./imagenes»): faltaba ese archivo en el paquete.

## [1.81.1] - 2026-11-22
### Corregido
- El grupo «Jugadores» se multiplicaba al sincronizar entre dispositivos: cada uno creaba el suyo con un id distinto. Ahora tiene id fijo y los duplicados se funden en uno.

## [1.81.0] - 2026-11-22
### Cambiado
- Menú reorganizado: grupos Preparar / Jugar / Biblioteca, Revisión en el menú (solo si hay pendientes) y un menú «Más» con Audio, Modo seguro, Bloquear, Preferencias y versión. Vista y Estilo salen de la barra superior (siguen en Preferencias).

## [1.80.0] - 2026-11-22
### Añadido
- Campo «Texto para los jugadores» (lo que el DM les cuenta) en la sesión (introducción) y en cada escena, visible en «En juego» y nunca publicado.

## [1.79.1] - 2026-11-22
### Cambiado
- Los jugadores solo reciben el resumen de una sesión cuando está «jugada» (terminada). Antes lo recibían también mientras estaba planeada o en curso.

## [1.79.0] - 2026-11-22
### Añadido
- **Sesión en juego**: pestaña «En juego» con introducción → escenas (Siguiente/Atrás), modo libre y altas rápidas (PNJ, misión, encuentro, lugar, nota) guardadas como notas enlazadas a la sesión. Campos nuevos de la sesión: paso y extras.

## [1.78.0] - 2026-11-22
### Añadido
- Carpeta de imágenes de criaturas en la app de escritorio (Preferencias): tokens y ambientaciones a tamaño completo por nombre en inglés. Solo se sirven tok/, img/ e index.json de la carpeta elegida.

## [1.77.0] - 2026-11-22
### Añadido
- La criatura del SRD que se conserva toma el token y la imagen del manual si no los tenía. Herramientas privadas para descargar y reducir los tokens de 5e.tools (tools/mm_imagenes.py, tools/mm_tokens.py).

## [1.76.0] - 2026-11-22
### Cambiado
- La misma criatura en varios manuales: manda la ya revisada (si no, la primera); las demás solo dan su etiqueta.

## [1.75.0] - 2026-11-22
### Cambiado
- Una criatura de un manual que ya está en el SRD conserva la ficha del SRD y solo gana la etiqueta del manual (antes la del módulo la pisaba).
- Abreviatura del Manual de Monstruos: MM2024.

## [1.74.0] - 2026-11-22
### Cambiado
- Una criatura de un manual que ya está en el SRD se da por revisada (sin «Pendiente de revisar»).
- La etiqueta de manual del bestiario usa la abreviatura del módulo (MM2024).

## [1.73.0] - 2026-11-22
### Añadido
- **Modo seguro**: oculta PG, CA, estadísticas y acciones de las criaturas (ficha, bestiario, combate). Botón para el DM; siempre activo para jugadores.

## [1.72.0] - 2026-11-22
### Añadido
- **Ficha editable por criatura en el encuentro** («Editar ficha» / «Volver al original»): copia propia `sb` por criatura; el compendio sigue de solo lectura (se clona).
- Calculadora en el editor de criaturas: bonificador de competencia por VD, PG por dados y CON, iniciativa, salvaciones y percepción pasiva.
- Variables en los textos de acciones: `{atq:FUE}`, `{dmg:2d8+FUE}`, `{cd:CAR}`, `{pb}`.

## [1.71.0] - 2026-11-22
### Añadido
- Opciones del combate: **vida de las criaturas** (media, tirada, tirada con mínimo la media, máxima) e **iniciativa de las criaturas** (d20 por cada una, por tipo o fija). Sustituye a la casilla de tirar dados de golpe; los combates guardados se migran solos.

## [1.70.0] - 2026-11-22
### Añadido
- **Revisión de lo importado**: vista `#revision` con una muestra aleatoria (3/5/10/20, filtrable por tipo) de elementos de módulos con `pend:true`, para comprobarlos con el manual y marcarlos como revisados; el aviso con su botón aparece también en la ficha de criatura (encuentros, bestiario) y en el compendio y los conjuros. Solo para el DM.
- **Badges de fuente** en el bestiario y criaturas del manual que ya están en el SRD sin duplicar (una ficha, dos badges).
- **Token e imagen de ambientación** en NPC (`tok`) y criaturas propias (`tok`, `img`).
- `tools/mm_extraer.py`: extractor local (OCR de Windows) del Manual de Monstruos; su salida va a `datos/privado/` (fuera de git).

## [1.69.0] - 2026-11-22
### Añadido
- **Manuales por campaña**: la configuración de la campaña guarda qué manuales se le aplican (panel «Manuales de esta campaña» en Módulos). Sin ajuste valen todos los activados en la cuenta, como hasta ahora. Quitar un manual lo oculta de esa campaña (criaturas, conjuros, compendio, referencia, buscador y tablas del módulo) sin desactivarlo en la cuenta. Solo el DM cambia la selección; los jugadores la reciben con la campaña. Los manuales y módulos se siguen activando o desactivando en la cuenta como siempre.

## [1.68.0] - 2026-11-22
### Añadido
- **Las reglas homebrew llegan a los jugadores**: el DM publica con la campaña las reglas que tiene activas (clave `hb:`), y los jugadores las reciben como copia de solo lectura. Les salen en la Referencia rápida (respetando «Añadir a la referencia rápida»), en el Compendio y en el buscador de esa campaña, con la etiqueta Homebrew. Un jugador no ve en esa campaña sus propias reglas, solo las del DM.
### Cambiado
- En el SRD en español y en los textos de la app, «GM», «Game Master» y «director de juego» pasan a **DM** / Dungeon Master.

## [1.67.0] - 2026-11-22
### Añadido
- **Reglas homebrew por campaña**: botón «Activar/Desactivar en esta campaña» en cada regla. Sin ajuste, todas están activas (como hasta ahora); con ajuste, solo las marcadas. Una regla desactivada desaparece de la Referencia rápida, el Compendio y el buscador de esa campaña, y sigue en la sección Homebrew. El ajuste se guarda en la configuración de la campaña y se sincroniza con ella; las reglas nuevas quedan activas donde ya había ajuste.

## [1.66.0] - 2026-11-22
### Añadido
- **Sección «Reglas homebrew»** (menú Herramientas y portada): lista, filtra, crea, edita y borra tus reglas de la casa. Todas llevan la etiqueta **Homebrew**, con la categoría que quieras o la nueva categoría «Homebrew».
- **Añadir a la Referencia rápida**: casilla en el editor y botón en la sección. Las reglas propias que no quieras ver ahí se pueden quitar; las que ya tenías siguen saliendo hasta que lo cambies.
- La etiqueta Homebrew también sale en el Compendio › Reglas, en las tarjetas de la referencia y en su ventana.

## [1.65.1] - 2026-11-22
### Corregido
- El **pergamino de conjuro** (objeto mágico) quedaba oculto por el del equipo de aventurero, que tenía el mismo nombre. El de equipo pasa a «Pergamino de conjuro (truco o nivel 1)».
### Añadido
- Test que impide nombres repetidos en cualquier pestaña del compendio, el bestiario o los conjuros, para que cada entrada tenga su página.

## [1.65.0] - 2026-11-22
### Añadido
- **Pestaña «Rasgos de clase» en el Compendio**: los 270 rasgos de las 12 clases del SRD, de sus subclases y las opciones de clase (invocaciones sobrenaturales, metamagia…), cada uno con su clase y nivel. Filtro por clase y por tipo, y aparecen en el buscador global.

## [1.64.0] - 2026-11-22
### Añadido
- **PNJ con bloque de estadísticas propio**: CA, PG, bonificador de iniciativa, velocidad, seis características, ataques y notas de combate. Una criatura vinculada sirve de punto de partida («Copiar sus estadísticas al bloque del PNJ»). Los PNJ añadidos desde un grupo ya no necesitan criatura vinculada.
- **Inventario del PNJ** (objeto, valor, cantidad).
- **«Acompaña ahora al grupo»** en el PNJ: al empezar un combate se pregunta si los PNJ que acompañan entran también, como aliados y con sus datos. Nada de esto lo ven los jugadores.

## [1.63.1] - 2026-11-21
### Cambiado
- La intro del acceso se ve **siempre entera**: ya no se salta con un clic o una tecla y sale cada vez que aparece la pantalla de acceso. Con «reducir movimiento» se enseña el logo ya dibujado, sin animar.

## [1.63.0] - 2026-11-21
### Añadido
- **Intro en la pantalla de acceso**: antes del formulario, el d20 se dibuja con trazo, se rellena, aparece el nombre «Herramientas del Máster» y todo se desvanece dejando paso al login (unos 3,6 s). Sale una vez por sesión; cualquier clic, toque o tecla la salta; con «reducir movimiento» activado no se muestra.

### Corregido
- Un diálogo que se cerraba y se volvía a abrir enseguida podía cerrarse solo por un evento de cierre tardío del navegador. Ya no.

## [1.62.0] - 2026-11-21
### Cambiado
- **Ventanas nativas**: los 14 cuadros de diálogo (cuenta, bestiario, copias, sesiones, preferencias…), el bloqueo de pantalla, el visor de documentos y la vista previa de impresión usan el elemento `<dialog>` del navegador: la página de detrás queda inerte, el foco no se escapa, Esc cierra, y el aviso («toast») y la confirmación flotante quedan siempre por encima. Se eliminan los parches de foco hechos a mano.
- Las confirmaciones y preguntas (`confirm`/`prompt` del navegador) son ahora ventanas propias con el mismo aspecto que la app, con la opción segura seleccionada por defecto.
- Las alturas de pantalla completa usan `dvh`, para que la barra del navegador del móvil no tape la parte baja; el desplazamiento no se «escapa» a la página de detrás.

## [1.61.1] - 2026-11-21
### Cambiado
- **Fichas de la campaña más claras** (PNJ, lugares, tiendas, misiones, puzzles…): los datos cortos van en una fila de rejilla con etiquetas breves (las aclaraciones pasan a ser el texto de ayuda dentro del campo) y los textos largos, debajo y a ancho completo. Lo que es solo del máster (secreto, solución) se distingue con un recuadro suave y un candado.

## [1.61.0] - 2026-11-21
### Añadido
- **Puzzles y juegos**: nueva sección en la campaña para diseñar eventos: un juego de taberna, un puzzle, una combinación para pasar una prueba. Lleva estado, reglas, solución (solo máster), qué pasa si fallan, recompensa y pistas. Los jugadores ven la descripción y solo las pistas que marques como dadas.
- **Probar una respuesta desde el móvil**: si lo activas, el jugador escribe su respuesta o combinación en su dispositivo y la app le dice si es correcta (sin distinguir mayúsculas, acentos ni signos). La respuesta no viaja: solo una huella.
### Corregido
- Las pestañas de la sesión (1.60) se mezclaban con el estilo de la barra de la campaña y de las tablas; ahora tienen estilo propio.

## [1.60.2] - 2026-11-21
### Corregido
- Los instaladores de escritorio (Windows y Mac) no se compilaban desde que se retiraron los idiomas: el empaquetado buscaba la carpeta `i18n`, que ya no existe. Corregido; esta versión vuelve a generar instalador.

## [1.60.1] - 2026-11-21
### Cambiado
- Al finalizar una sesión, el resumen ya no crea una entrada en el Diario: se guarda en la propia sesión (pestaña «Resumen del máster» y, si se marca compartir, también «Para los jugadores»). Si ya había texto, se añade debajo.

## [1.60.0] - 2026-11-21
### Añadido
- **Sesiones con tres pestañas**: Planificación (lo de siempre), Resumen del máster (qué ocurrió de verdad, solo para ti) y Para los jugadores (lo único de la sesión que ven ellos, además de las escenas marcadas como visibles). Los dos resúmenes admiten textos largos.
### Cambiado
- Una sesión es siempre del máster: ya no se elige «Quién puede verlo». Los jugadores solo reciben su pestaña.

## [1.59.0] - 2026-11-21
### Añadido
- **Control de versiones de los datos personales** (bestiario propio, tablas, módulos, preferencias, grupo, encuentros, fichas libres y combate): mismo modelo que la campaña. Cada bloque lleva una versión del servidor; si cambia aquí y en la cuenta a la vez no se pisa nada y se abre un conflicto en «Tu cuenta» (o en Campañas) para elegir cuál es la correcta, con copia recuperable de la otra. Se anota desde qué dispositivo (escritorio o web) se escribió cada versión.
- Si dos dispositivos llegan al mismo contenido no se considera conflicto.
- Necesita ejecutar `supabase/versiones.sql` en Supabase; sin él, sigue el sistema anterior.

## [1.58.2] - 2026-11-21
### Cambiado
- Conflictos: los botones y el aviso dejan claro que la versión elegida pasa a ser la correcta para todos los dispositivos («La de este dispositivo es la correcta» / «La de la cuenta es la correcta»).

## [1.58.1] - 2026-11-21
### Cambiado
- **Web con el mismo control de versiones**: ya no resuelve los conflictos sola. Una nota sin tocar en la web se actualiza a la versión más nueva del escritorio; si la web tiene un cambio sin subir y el escritorio avanzó por otro lado, hay conflicto y se elige qué conservar. En la web solo aparece el aviso cuando hay un conflicto.

## [1.58.0] - 2026-11-21
### Añadido
- **Control de versiones de la campaña** (escritorio): si un elemento cambia aquí y en la cuenta a la vez, ya no se decide solo «lo más reciente»: no se pisa nada y el conflicto queda abierto en Campañas, con la hora de cada versión, para elegir «Quedarme con lo mío» o «Quedarme con lo de la cuenta» (la otra versión queda como copia recuperable).
- **Control de cambios**: cuántos cambios hay sin subir y botones **Subir todo lo de este dispositivo** y **Descargar todo lo de la cuenta**, que antes de actuar enseñan cuántos elementos son nuevos, distintos o se perderían, y guardan copias recuperables de lo que se sustituye.

## [1.57.8] - 2026-11-21
### Cambiado
- Inicio (web): el cuadro de descarga de la app de escritorio pasa al final de la página.

## [1.57.7] - 2026-11-21
### Cambiado
- **Pantalla de acceso**: una caja sencilla y centrada con solo correo y contraseña (más «Olvidé mi contraseña»), sobre un fondo suave en movimiento que respeta «reducir movimiento».

## [1.57.6] - 2026-11-21
### Cambiado
- **Borrar campañas**: se puede borrar cualquiera, también la principal del escritorio (queda vacía). Para confirmar hay que escribir el nombre de la campaña y se explica qué se pierde; si la campaña es suya y está en la cuenta, se borra también de Supabase y de todos los dispositivos.
- **Sin campañas**: al entrar en Campaña por primera vez, si no hay ninguna, se abre directamente la creación de la primera. En la web, la campaña nueva nace ya en la cuenta.

## [1.57.5] - 2026-11-21
### Cambiado
- Preferencias: el bloque «Bloqueo de pantalla», solo de la app de escritorio, pasa al final.

## [1.57.4] - 2026-11-21
### Cambiado
- Web: el gestor de campañas ya no muestra las etiquetas «activa» y «Sincronizada» ni el botón «Sincronizar».

## [1.57.3] - 2026-11-21
### Corregido
- Web: el gestor de campañas ya no enseña la campaña local vacía, y al entrar manda siempre la cuenta (ya no pregunta «navegador o cuenta»). Sin avisos de actualización de la app en la web.

## [1.57.2] - 2026-11-21
### Cambiado
- **Web sin datos en el navegador**: los datos viven en la cuenta y solo se guardan, de forma temporal, mientras la pestaña está abierta. Al iniciar sesión se abre sola la primera campaña de la cuenta, ya no aparece la campaña local vacía y al cerrar la pestaña con cambios sin subir el navegador avisa.

## [1.57.1] - 2026-11-21
### Corregido
- Contraseña olvidada: el enlace del correo ahora abre siempre la pantalla de «contraseña nueva», y ya se puede cambiar la contraseña desde «Tu cuenta» (botón «Cambiar contraseña»).

## [1.57.0] - 2026-11-21
### Añadido
- **Acceso solo con cuenta** (web y escritorio): la primera vez en cada equipo se pide correo y contraseña, sin crear cuentas ni Discord; entra quien tenga invitación. Sin conexión, la copia local solo se ofrece en un equipo donde ya se haya entrado.
- **Distancias en tres unidades a la vez** (metros · pies · casillas), con una opción nueva «Todas a la vez» en Preferencias, que es la predeterminada.
### Eliminado
- Idiomas distintos del español (interfaz y datos), el acceso con Discord y las páginas de condiciones y privacidad.

## [1.56.0] - 2026-11-21
### Añadido
- **Tiendas**: oro disponible para comprar objetos, descuento y, opcionalmente, una misión que lo activa (los jugadores solo ven el descuento cuando la misión está completada).
- **PNJ**: actitud hacia los jugadores y lista de eventos con ellos (con casilla de resuelto); Rol, Aspecto, Qué quiere y Secreto pasan a cajas de varias líneas.
### Corregido
- Ventana de mesa: con pocos combatientes, el orden de iniciativa ya no se ve enorme.

## [1.55.0] - 2026-11-21
### Añadido
- **Subir imágenes desde el estudio de la mesa**: con el botón «Subir una imagen» o arrastrando un archivo sobre el lienzo. La imagen se reduce como en la Galería y queda guardada allí como documento, además de ponerse en la zona elegida.
- Ctrl+Intro envía la escena a la mesa.

## [1.54.0] - 2026-11-21
### Añadido
- **Estudio de la ventana de mesa** (app de escritorio): una página nueva, «Ventana de mesa», para preparar la escena antes de enseñarla, como en una mesa de mezclas. Vista previa 16:9 fiel a lo que verán los jugadores; capas de imagen, texto, orden de iniciativa y cuentas atrás que se arrastran, se redimensionan (con imán a los bordes y al centro; Alt lo desactiva) y se mueven con las flechas; zonas de imágenes que se rellenan con un clic desde la galería; orden, visibilidad, opacidad, marco de fotografía y tipografías para el texto. «Enviar a la mesa» manda la escena con una transición (corte, fundido); con «En vivo» los cambios llegan solos. Plantillas de escena por campaña (y cuatro ejemplos). En el navegador la página explica que es de escritorio.
- La ventana de los jugadores pinta las escenas con el orden de iniciativa y las cuentas atrás en vivo dentro de sus capas; lo que entra se valida con una lista blanca (solo imágenes png/jpeg/webp, colores y fuentes conocidos, tope de capas y de peso), así que nunca llegan PG, CA ni notas.

### Cambiado
- El Inicio ya no repite las novedades: se ven al pulsar la versión.
- El acceso «Ventana de mesa» de la barra lateral abre el estudio; el panel de cuentas atrás y del orden sigue disponible desde él.

## [1.53.0] - 2026-11-21
### Añadido
- **Galería de documentos** en Campaña: handouts, cartas, carteles e ilustraciones (imagen de hasta 1600 px). Visor a pantalla completa, «Mostrar en la mesa» en la app de escritorio y compartir con los jugadores cuando quieras (nacen ocultos). Un documento solo de texto se muestra como carta sobre pergamino.

## [1.52.0] - 2026-11-21
### Cambiado
- **Encuentros de la campaña con aire de cuaderno**: el constructor es un folio con secciones separadas por filetes y la lista, un índice. Las nueve pestañas de Campaña caben en una fila.

## [1.51.0] - 2026-11-21
### Añadido
- **PNJ, lugares, tiendas y misiones: el máster decide qué ven los jugadores.** Una descripción pública y, según el caso, el mapa con sus chinchetas, el inventario con precios o el estado y los objetivos. El resto de la ficha sigue siendo solo del máster.
- PNJ con aspecto y voz, qué quiere y secreto (el secreto no sale nunca).
### Cambiado
- La lista de la campaña marca lo que el jugador ve (completo o en parte) y el progreso de las misiones.

## [1.50.0] - 2026-11-21
### Añadido
- **Las escenas son capítulos**: cada una tiene plan (solo máster), resumen para los jugadores y encuentros propios. A los jugadores solo llega el resumen de las escenas marcadas.
- **Mapas en los lugares**: un lugar puede llevar un mapa con chinchetas que enlazan a los lugares que contiene (región, pueblo, taberna…), con ruta de migas y lista de lugares dentro. El mapa sale en la hoja impresa.
- **Vista previa de impresión** de la sesión (se actualiza al marcar apartados) y de las hojas de personaje.
### Cambiado
- En Jugadores, quien no tiene personaje se muestra como jugador, con su tarjeta de combate aparte, y no como un personaje.

## [1.49.0] - 2026-11-21
### Cambiado
- **Campaña con aire de cuaderno**: pestañas como separadores, lista de notas en forma de índice y retratos como fotos pegadas.

## [1.48.0] - 2026-11-21
### Añadido
- **Escenas con ficha** en el plan de la sesión: tipo, lugar, PNJ y descripción; se pueden reordenar.
- **Lo que ven los jugadores**: un resumen y las escenas marcadas como visibles. El resto del plan sigue siendo solo del máster.
### Seguridad
- Un jugador solo puede leer lo compartido de la campaña (notas visibles, fichas, grupo de jugadores). Requiere ejecutar `supabase/jugadores.sql`.
### Cambiado
- El detalle de las sesiones y notas se presenta como un folio, con títulos de sección manuscritos.

## [1.47.0] - 2026-11-21
### Cambiado
- **Aspecto de papel y tinta por defecto**, también en la app de escritorio (antes era oscuro con ámbar). El oscuro sigue en Preferencias → Estilo.
- **Portada**: sin tarjetas. Un índice como el de un manual, con puntos conductores y el estado de cada herramienta, y arriba, si lo hay, el combate o la sesión en curso o la de hoy.
- **App de escritorio**: la cabecera solo aparece en el combate; en las demás pantallas manda su propio título. «Buscar» (Ctrl K) pasa a la barra lateral, que ahora nombra sus botones de abajo (Audio, Bloquear, Preferencias). Campaña, vista y estilo se cambian desde Preferencias.
- Estados vacíos más sobrios y con la acción principal a la vista; el mes del calendario se escribe «Noviembre de 2026»; la rareza de los objetos lleva su color; los enlaces con forma de botón ya no salen violetas.

## [1.46.0] - 2026-11-21
### Añadido
- **Invitaciones a la campaña**: el máster crea un código en «Campañas» (caduca a los 7 días, sirve para 10 personas) y el jugador lo escribe en «Unirme con un código». La campaña aparece en su dispositivo con el rol de jugador. Las campañas de tu cuenta donde eres jugador también se traen solas al iniciar sesión.
- Botón de descarga de la app de escritorio en Inicio (solo en la web).
- **Al lanzar un encuentro al combate se elige qué jugadores entran** (no siempre van todos); los demás se pueden añadir después desde Jugadores o desde el combate.
### Cambiado
- **El combate se puede usar siempre**, también en una campaña con sesiones y sin ninguna activa. Ya no pide iniciar una sesión.

## [1.45.5] - 2026-11-21
### Añadido
- En la web, botón de descarga de la app de escritorio en Inicio: detecta Mac o Windows y enlaza el instalador de la última versión.
### Corregido
- Mac: la app se llama `HerramientasDelMaster` (sin tilde) para evitar un cierre al arrancar.

## [1.45.4] - 2026-11-21
### Corregido
- El instalador de Mac es ahora universal (Intel y Apple Silicon): el anterior solo abría en Macs con chip Apple.

## [1.45.3] - 2026-11-21
### Cambiado
- Versión de prueba de la actualización automática: sin cambios para el usuario.

## [1.45.2] - 2026-11-21
### Corregido
- El actualizador decía «aún no configuradas» en la app instalada: electron-builder quita la sección `build` del `package.json` empaquetado. Ahora el repositorio va en un campo propio que se conserva.

## [1.45.1] - 2026-11-21
### Cambiado
- Versión de prueba del actualizador automático: sin cambios para el usuario.

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
