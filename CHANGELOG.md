# Changelog

Todas las versiones de «Herramientas del Máster». El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [versionado semántico](https://semver.org/lang/es/).

Artifact publicado: https://claude.ai/artifact/N4KWLLNZUVYXCYNriSYwtP

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
