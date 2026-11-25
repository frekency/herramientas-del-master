---
name: Herramientas del Máster
description: Maletín del máster en papel limpio; la portada es la trasera de la pantalla del máster, el resto es sencillo y práctico.
colors:
  paper: "#fbf8ef"
  paper-surface: "#fffdf7"
  paper-sunk: "#f1ece0"
  ink: "#1c2740"
  ink-muted: "#566079"
  line: "#cfd4df"
  accent-blue: "#2e4a8a"
  crit-red: "#b8342a"
  ok-green: "#2f7d4a"
  warn-amber: "#a0680a"
  highlight: "#f0dc7c"
  highlight-dark: "#e9cf55"
  leather: "#4a3a30"
  leather-deep: "#3a2d25"
  note-yellow: "#f7ebaa"
  note-pink: "#f5d5cd"
  note-blue: "#d3e3ef"
  note-green: "#d8e8cd"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "34px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: 1.25
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  handwriting:
    fontFamily: "Kalam, Segoe Print, Bradley Hand, cursive"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.05
rounded:
  note: "2px"
  panel: "6px"
  control: "10px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "28px"
---

# Design System: Herramientas del Máster

## Overview

**Creative North Star: "La pantalla del máster"**

La app es el maletín de un máster en mesa. Tiene dos niveles. La **portada** es la trasera de la pantalla del máster: un tablero de cuero con costura y pliegues donde cuelgan cuatro notas, cada una un papel distinto. El **resto de la app** es práctico y sencillo: papel limpio, tinta azul oscuro, una sola sans, cero adorno. El carácter se concentra en un único sitio para que el resto no estorbe al jugar.

Estilo único «Limpio» (los demás temas se han eliminado), minimalista, con modo claro y oscuro.

**Key Characteristics:**
- Una sola sans (Inter) con escala corta; la letra a mano solo vive en las notas de la portada.
- El color de aviso (rojo, ámbar, verde) significa estado; los títulos van en tinta, no en rojo.
- Materiales reales y no efectos: cuero, papel, cinta, chincheta.
- Cada nota de la portada es distinta (forma de sujeción, altura, giro, desgaste); no se repite una plantilla cambiando el color.

## Colors

Papel cálido, tinta azul marino y un cuero marrón oscuro; los pasteles de las notas solo aparecen sobre el cuero.

### Primary
- **Azul tinta** (#2e4a8a): enlaces, botón principal y foco.

### Neutral
- **Papel** (#fbf8ef): fondo de página. **Papel superficie** (#fffdf7): tarjetas. **Papel hundido** (#f1ece0): zonas secundarias.
- **Tinta** (#1c2740): texto y títulos. **Tinta apagada** (#566079): texto secundario (≥4.5:1 sobre el papel).
- **Línea** (#cfd4df): bordes finos.

### Tertiary
- **Cuero** (#4a3a30 → #3a2d25): solo el tablero de la portada. En oscuro baja a #2a211c.
- **Notas** (amarillo #f7ebaa, rosa #f5d5cd, azul #d3e3ef, verde #d8e8cd): solo las cuatro notas de la portada; texto de nota siempre en tinta. Las notas no cambian de color en modo oscuro: son papel claro sobre cuero oscuro.

- **Resaltado amarillo** (#f0dc7c en claro, #e9cf55 en oscuro): pestaña activa, avisos y turno actual; el texto encima va siempre en tinta oscura. Confirmado por el Sr. Soto; no usar amarillos más cálidos (parecen mostaza) ni más pálidos.

### Named Rules
**The Cuero Only Rule.** El cuero, los pasteles y la letra a mano no salen de la portada.
**The Status Color Rule.** Rojo, ámbar y verde indican estado (peligro, aviso, correcto); nunca decoran títulos.

## Typography

**Font:** Inter con system-ui de reserva, para todo. **Handwriting:** Kalam, solo en las notas de la portada.

**Character:** una sans neutra y legible a distancia de portátil; la mano aporta el único gesto personal.

### Hierarchy
- **Display** (500, 34px, 1.1, -0.02em): título de portada y de página.
- **Title** (500, 20px): títulos de sección y de tarjeta.
- **Body** (400, 15px, 1.55): texto corrido, medida máxima 65–75ch.
- **Label** (400, 13px): etiquetas y texto de botón, 1 px menos que el texto de alrededor.
- **Handwriting** (Kalam 700, hasta 30px): títulos de las notas; el cuerpo de la nota va en Kalam 400.

Escala fija: 12 · 13 · 14 · 15 · 17 · 20 · 34. Más grande, menos interlínea y menos espaciado.

## Layout

Contenedor fluido con 24px de margen en escritorio y 16px en móvil. La portada es un tablero de cuatro columnas (≥1100px), dos en tablet y una en móvil. Aire amplio entre secciones; objetivos táctiles de 44px. En móvil las notas se apilan y pierden las alturas mínimas.

## Elevation & Depth

Sombras suaves con desplazamiento y desenfoque; las notas proyectan sombra sobre el cuero. Fuera de la portada, las superficies son planas con borde fino.

## Shapes

Esquinas casi rectas en las notas (2px) y en el tablero (6px); controles de 10px. Las notas llevan giros de ±1.3° como máximo, esquina doblada o pliegue. El tablero lleva costura discontinua a 7px del borde.

## Components

### Notas de la portada
Cuatro papeles distintos sobre cuero. **Campaña:** post-it amarillo con chincheta roja y esquina doblada. **Personajes:** nota rosa con pliegue, chincheta azul descentrada. **Compendio:** hoja de cuaderno con renglones, margen rojo, agujeros de espiral y cinta. **Utilidades:** ficha verde con cinta en diagonal y marca de taza. Los accesos son renglones de nota con línea discontinua, no botones.

### Botones y controles (resto de la app)
Sencillos: borde fino, 10px de radio, texto 13–14px. El principal en azul tinta; ninguno imita papel fuera de la portada.

## Do's and Don'ts

### Do:
- **Do** mantener el cuero, las chinchetas, la cinta y la letra a mano dentro de la portada.
- **Do** dar a cada nota nueva una forma de sujeción y un desgaste propios.
- **Do** usar texto en tinta sobre las notas y comprobar contraste ≥4.5:1.

### Don't:
- **Don't** repetir la misma nota cambiando solo el color.
- **Don't** usar rojo para títulos ni decoración.
- **Don't** llevar adornos de papel (post-its, cinta, giros) a las pantallas de trabajo.
- **Don't** añadir etiquetas decorativas, insignias ni botones redundantes.
