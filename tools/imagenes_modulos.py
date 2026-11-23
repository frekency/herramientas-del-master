#!/usr/bin/env python
"""Pone en un módulo las ilustraciones de 5e.tools (reducidas) en el campo «img» de sus entradas.

Solo uso personal: entrada y salida van en datos/privado/.
Uso: python tools/imagenes_modulos.py <modulo.json> <FUENTE> <carpeta_imagenes> [lado_px=256] [calidad=70]
  FUENTE = XPHB, TCE, XGE o XDMG (la subcarpeta de cada categoría en <carpeta_imagenes>).
Qué empareja (por nombre en inglés, que 5e.tools usa como nombre de archivo):
  conjuros  -> por su campo «en»; especies, trasfondos, dotes y clases -> con las tablas de este archivo;
  subclases del Manual del Jugador 2024 -> por su nombre en español (CANON).
Los objetos se emparejan aparte (necesitan revisión). Necesita Pillow (pip install --target <dir> pillow y PYTHONPATH).
"""
import sys, os, re, json, io, base64, unicodedata
from PIL import Image


def fold(s):
    return ''.join(c for c in unicodedata.normalize('NFD', str(s)) if unicodedata.category(c) != 'Mn').lower().strip()


ESPECIES = {'aasimar': 'Aasimar', 'draconido': 'Dragonborn', 'elfo': 'Elf', 'enano': 'Dwarf', 'gnomo': 'Gnome', 'goliat': 'Goliath', 'humano': 'Human',
            'mediano': 'Halfling', 'orco': 'Orc', 'tiefling': 'Tiefling'}
TRASFONDOS = {'acolito': 'Acolyte', 'artesano': 'Artisan', 'charlatan': 'Charlatan', 'criminal': 'Criminal', 'animador': 'Entertainer', 'campesino': 'Farmer',
              'guardia': 'Guard', 'guia': 'Guide', 'ermitano': 'Hermit', 'comerciante': 'Merchant', 'noble': 'Noble', 'erudito': 'Sage', 'marinero': 'Sailor',
              'escriba': 'Scribe', 'soldado': 'Soldier', 'vagabundo': 'Wayfarer'}
DOTES = {'don del destino': 'Boon of Fate', 'don de pericia': 'Boon of Skill', 'tocado por los feericos': 'Fey-Touched', 'sanador': 'Healer', 'envenenador': 'Poisoner',
         'lanzador de rituales': 'Ritual Caster', 'combate con dos armas': 'Two-Weapon Fighting', 'maestro de armas': 'Weapon Master',
         'adepto sobrenatural': 'Eldritch Adept', 'telepatico': 'Telepathic', 'telepata': 'Telepathic', 'combatiente con dos armas': 'Two-Weapon Fighting', 'lanzador ritual': 'Ritual Caster',
         'influencia feerica': 'Fey-Touched', 'don de la habilidad': 'Boon of Skill'}
CLASES = {'barbaro': 'Barbarian', 'bardo': 'Bard', 'brujo': 'Warlock', 'clerigo': 'Cleric', 'druida': 'Druid', 'explorador': 'Ranger', 'guerrero': 'Fighter',
          'hechicero': 'Sorcerer', 'mago': 'Wizard', 'monje': 'Monk', 'paladin': 'Paladin', 'picaro': 'Rogue', 'artifice': 'Artificer'}
SUBCLASES_PHB = {  # nombre en español (como en el módulo) -> archivo en 5e.tools
    'Senda del árbol del mundo': 'World Tree Barbarian', 'Senda del berserker': 'Berserker Barbarian', 'Senda del corazón salvaje': 'Wild Heart Barbarian',
    'Senda del fanático': 'Zealot Barbarian', 'Colegio de la danza': 'Dance Bard', 'Colegio del conocimiento': 'Lore Bard', 'Colegio del glamour': 'Glamour Bard',
    'Colegio del valor': 'Valor Bard', 'Patrón celestial': 'Celestial Warlock', 'Patrón feérico': 'Archfey Warlock', 'Patrón infernal': 'Fiend Warlock',
    'Patrón primigenio': 'Great Old One Warlock', 'Dominio de la guerra': 'War Cleric', 'Dominio de la luz': 'Light Cleric', 'Dominio de la vida': 'Life Cleric',
    'Dominio del engaño': 'Trickery Cleric', 'Círculo de la luna': 'Moon Druid', 'Círculo de la tierra': 'Land Druid', 'Círculo de las estrellas': 'Stars Druid',
    'Círculo del mar': 'Sea Druid', 'Acechador en la penumbra': 'Gloom Stalker Ranger', 'Cazador': 'Hunter Ranger', 'Errante feérico': 'Fey Wanderer Ranger',
    'Señor de las bestias': 'Beast Master Ranger', 'Caballero arcano': 'Eldritch Knight Fighter', 'Campeón': 'Champion Fighter', 'Guerrero psiónico': 'Psi Warrior Fighter',
    'Maestro del combate': 'Battle Master Fighter', 'Hechicería aberrante': 'Aberrant Sorcerer', 'Hechicería de magia salvaje': 'Wild Magic Sorcerer',
    'Hechicería dracónica': 'Draconic Sorcerer', 'Hechicería mecánica': 'Clockwork Sorcerer', 'Abjurador': 'Abjurer Wizard', 'Adivino': 'Diviner Wizard',
    'Evocador': 'Evoker Wizard', 'Ilusionista': 'Illusionist Wizard', 'Guerrero de la mano abierta': 'Open Hand Monk', 'Guerrero de la misericordia': 'Mercy Monk',
    'Guerrero de la sombra': 'Shadow Monk', 'Guerrero de los elementos': 'Elements Monk', 'Juramento de entrega': 'Devotion Paladin', 'Juramento de gloria': 'Glory Paladin',
    'Juramento de los antiguos': 'Ancients Paladin', 'Juramento de venganza': 'Vengeance Paladin', 'Asesino': 'Assassin Rogue', 'Embaucador arcano': 'Arcane Trickster Rogue',
    'Ladrón': 'Thief Rogue', 'Rebanaalmas': 'Soulknife Rogue'}
SUBCLASES_TCE = {
    'Senda de la bestia': 'Beast Barbarian', 'Senda de magia salvaje': 'Wild Magic Barbarian', 'Colegio de la creación': 'Creation Bard', 'Colegio de la elocuencia': 'Eloquence Bard',
    'Genio': 'Genie Warlock', 'Insondable': 'Fathomless Warlock', 'Dominio de la paz': 'Peace Cleric', 'Dominio del crepúsculo': 'Twilight Cleric', 'Dominio del orden': 'Order Cleric',
    'Círculo de esporas': 'Spores Druid', 'Círculo de las estrellas': 'Stars Druid', 'Círculo del fuego salvaje': 'Wildfire Druid', 'Guardián del enjambre': 'Swarmkeeper Ranger',
    'Vagabundo feérico': 'Fey Wanderer Ranger', 'Caballero rúnico': 'Rune Knight Fighter', 'Guerrero psiónico': 'Psi Warrior Fighter', 'Alma mecánica': 'Clockwork Soul Sorcerer',
    'Mente aberrante': 'Aberrant Mind Sorcerer', 'Canto de la hoja': 'Bladesinging Wizard', 'Orden de los escribas': 'Scribes Wizard', 'Camino de la misericordia': 'Mercy Monk',
    'Camino del yo astral': 'Astral Self Monk', 'Juramento de gloria': 'Glory Paladin', 'Juramento de los vigilantes': 'Watchers Paladin', 'Fantasma': 'Phantom Rogue',
    'Cuchillo del alma': 'Soulknife Rogue', 'Alquimista': 'Alchemist Artificer', 'Armero': 'Armorer Artificer', 'Artillero': 'Artillerist Artificer', 'Herrero de batalla': 'Battle Smith Artificer'}
SUBCLASES_XGE = {
    'Senda del heraldo de la tormenta': 'Storm Herald Barbarian', 'Colegio de espadas': 'Swords Bard', 'Colegio de los susurros': 'Whispers Bard', 'El celestial': 'Celestial Warlock',
    'El hexblade': 'Hexblade Warlock', 'Dominio de la forja': 'Forge Cleric', 'Dominio de la tumba': 'Grave Cleric', 'Círculo de sueños': 'Dreams Druid', 'Círculo del pastor': 'Shepherd Druid',
    'Magia de guerra': 'War Wizard', 'Juramento de conquista': 'Conquest Paladin', 'Juramento de redención': 'Redemption Paladin'}
SUBCLASES = {'XPHB': SUBCLASES_PHB, 'TCE': SUBCLASES_TCE, 'XGE': SUBCLASES_XGE}


def reduce_img(path, lado, calidad):
    im = Image.open(path).convert('RGBA')
    im.thumbnail((lado, lado), Image.LANCZOS)
    q = calidad
    while True:
        b = io.BytesIO()
        im.save(b, 'WEBP', quality=q, method=6)
        d = 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
        if len(d) <= 70000 or q <= 20:
            return d if len(d) <= 85000 else None
        q -= 10


def main():
    modulo, fuente, carp = sys.argv[1], sys.argv[2].upper(), sys.argv[3]
    lado = int(sys.argv[4]) if len(sys.argv) > 4 else 256
    cal = int(sys.argv[5]) if len(sys.argv) > 5 else 70
    m = json.load(open(modulo, encoding='utf-8'))
    cache = {}

    def img(cat, nombre):
        f = os.path.join(carp, cat, fuente, nombre + '.webp')
        if not os.path.exists(f):
            return None
        if f not in cache:
            cache[f] = reduce_img(f, lado, cal)
        return cache[f]
    n = {}

    def poner(tipo, x, cat, nombre):
        if not nombre:
            return
        d = img(cat, nombre)
        if d:
            x['img'] = d
            n[tipo] = n.get(tipo, 0) + 1
    for x in m.get('conjuros', []):
        poner('conjuros', x, 'spells', x.get('en'))
    for x in m.get('especies', []):
        poner('especies', x, 'races', ESPECIES.get(fold(x['n'])))
    for x in m.get('trasfondos', []):
        poner('trasfondos', x, 'backgrounds', TRASFONDOS.get(fold(x['n'])))
    for x in m.get('dotes', []):
        poner('dotes', x, 'feats', DOTES.get(fold(x['n'])))
    for x in m.get('clases', []):
        poner('clases', x, 'classes', CLASES.get(fold(x['n'])))
    for x in m.get('rasgos', []):
        if x.get('tipo') == 'Subclase':
            poner('subclases', x, 'classes', SUBCLASES.get(fuente, {}).get(x.get('sub')))
    json.dump(m, open(modulo, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    kb = sum(len(x.get('img', '')) for t in ('conjuros', 'especies', 'trasfondos', 'dotes', 'clases', 'rasgos') for x in m.get(t, [])) // 1024
    print(fuente, n, '| %d KB de imágenes' % kb)


if __name__ == '__main__':
    main()
