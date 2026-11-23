#!/usr/bin/env python
"""Arregla a mano los títulos de las tablas de la Guía del Máster 2024 que el OCR no leyó bien (tools/libro_titulos_tablas.py).
Solo uso personal. Uso: python tools/libro_titulos_arreglos_gdm.py <modulo.json>
Cada arreglo se identifica por la página impresa y el nombre que dejó el OCR (o el provisional); los deducidos del contenido llevan una duda."""
import sys, json

# (pg, nombre actual que empieza por) -> nombre nuevo, deducido
ARREGLOS = [
    ('38', 'Id4', 'Clima: viento y precipitaciones'), ('89', 'Nombres monos', 'Nombres monosílabos'),
    ('197', 'Desesperaci', 'Desesperación del páramo sombrío'), ('199', 'Efectos del viento', 'Efectos del viento psíquico'),
    ('214', 'Para crear', 'Piedras preciosas de 10 po'), ('214', 'Edras preciosas de 100', 'Piedras preciosas de 100 po'),
    ('214', 'Edras preciosas de 500', 'Piedras preciosas de 500 po'), ('214', 'Edras preciosas de 1000', 'Piedras preciosas de 1000 po'),
    ('214', 'Edras preciosas de 5000', 'Piedras preciosas de 5000 po'), ('223', 'Tabla d8', 'Historia del objeto mágico'),
    ('229', 'Idloo', 'Alfombra voladora: tamaño y capacidad'), ('265', 'Tabla d100', 'Cuerno del Valhalla'),
    ('270', 'Le ocurrir', 'Esfera de aniquilación: control disputado'), ('278', 'Tabla d100', 'Botella de humo: contenido'),
    ('291', 'Tabla d20', 'Manual de gólems'), ('296', 'La munici', 'Tabla de tipos de criatura (p. 296)'),
    ('340', 'Tabla d6', 'Tirada de salvación aleatoria (p. 340)'), ('346', 'Tabla d100', 'Ganancias de la casa'),
    ('351', 'Detalles', 'Huéspedes de la fortaleza'), ('352', 'Tabla d100', 'Tesoro de la fortaleza'),
    ('123', 'Tabla d6', 'Encuentros aleatorios (p. 123)'), ('124', 'Tabla d20', 'Encuentros aleatorios (p. 124)'),
]


def main():
    f = sys.argv[1]
    m = json.load(open(f, encoding='utf-8'))
    n = 0
    usados = set()
    for t in m['tablas']:
        for i, (pg, ini, nuevo) in enumerate(ARREGLOS):
            if i not in usados and t['pg'] == pg and t['n'].startswith(ini):
                t['n'] = nuevo
                t['dudas'] = [d for d in t['dudas'] if 'título' not in d] + ['el título se ha deducido del contenido: compruébalo con el libro']
                usados.add(i)
                n += 1
                break
    json.dump(m, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(n, 'títulos arreglados de', len(ARREGLOS))


if __name__ == '__main__':
    main()
