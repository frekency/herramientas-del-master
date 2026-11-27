// Rasgos y elecciones de especie como DATOS del compendio (igual que las clases: la hoja no sabe nada de cada especie).
// Lee el texto de cada especie (x.d, el del manual) y le añade:
//   x.rs = rasgos fijos      [{n, d, nv?, act?, rec?, res?, cj?, pgn?, insp?}]
//   x.el = elecciones        [{id, n, d, req?, ef?, ops:[{v, n, s?, d, act?, lim?, rec?, res?, vel?, cj?}]}]
// Los TEXTOS salen del propio manual (no se redactan aquí); aquí solo está la mecánica: qué recurso da cada opción,
// cuántos usos, cuándo se recupera, qué resistencia o conjuro añade. rec = [{n, max:'pb'|número, rec:'largo'|'corto', nv?}].
// Uso: node tools/especies-elecciones.mjs   (idempotente; actúa sobre datos/privado/libros/manual-del-jugador-2024.json y los módulos privados que existan)
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIVOS = [
  ['datos/privado/libros/manual-del-jugador-2024.json', j => j.especies],
];
const HABS = [['acrobacias', 'Acrobacias'], ['animales', 'Trato con animales'], ['arcanos', 'Arcanos'], ['atletismo', 'Atletismo'], ['engano', 'Engaño'], ['historia', 'Historia'], ['interpretacion', 'Interpretación'], ['intimidacion', 'Intimidación'], ['investigacion', 'Investigación'], ['juego', 'Juego de manos'], ['medicina', 'Medicina'], ['naturaleza', 'Naturaleza'], ['percepcion', 'Percepción'], ['perspicacia', 'Perspicacia'], ['persuasion', 'Persuasión'], ['religion', 'Religión'], ['sigilo', 'Sigilo'], ['supervivencia', 'Supervivencia']];
const PB = {max: 'pb', rec: 'largo'};
const UNO = {max: 1, rec: 'largo'};
const TAM = {id: 'tam', n: 'Tamaño', d: 'Mediano o Pequeño, elegido al seleccionar la especie.', ef: 'tam', ops: ['Mediano', 'Pequeño'].map(v => ({v, n: v}))};
const APT = {id: 'apt', n: 'Aptitud mágica', req: 'linaje', ef: 'apt', d: 'La Inteligencia, la Sabiduría o el Carisma es tu aptitud mágica para los conjuros que lances con este atributo.', ops: [['int', 'Inteligencia'], ['sab', 'Sabiduría'], ['car', 'Carisma']].map(([v, n]) => ({v, n}))};

// Mecánica por especie. Las claves de rs/el.ops son los NOMBRES de los atributos tal y como salen en el texto del manual.
const MEC = {
  Aasimar: {
    el: [TAM],
    rs: {'Manos curativas': {act: 'Acción de magia', rec: [{...UNO}]}, 'Portador de luz': {cj: [['Luz', 1]]}, 'Resistencia celestial': {res: ['Necrótico', 'Radiante']}, 'Visión en la oscuridad': {},
      'Revelación celestial': {nv: 3, act: 'Acción adicional', rec: [{...UNO}], junta: ['Alas celestiales', 'Fulgor interior', 'Mortaja necrótica']}},
  },
  Dracónido: {
    rs: {'Ataque de aliento': {act: 'Sustituye un ataque'}, 'Resistencia al daño': {}, 'Visión en la oscuridad': {}, 'Vuelo dracónico': {nv: 5, act: 'Acción adicional', rec: [{...UNO}]}},
    tabla: {'Linaje dracónico': {id: 'linaje', n: 'Linaje dracónico', dragones: true}},
  },
  Elfo: {
    rs: {'Linaje feérico': {}, 'Trance': {}, 'Visión en la oscuridad': {}},
    tabla: {'Linaje élfico': {id: 'linaje', n: 'Linaje élfico', fila: {
      'Alto elfo': {v: 'alto', cj: [['Prestidigitación', 1], ['Detectar magia', 3], ['Paso brumoso', 5]], conj: ['Detectar magia', 'Paso brumoso']},
      'Drow': {v: 'drow', cj: [['Luces danzantes', 1], ['Fuego feérico', 3], ['Oscuridad', 5]], conj: ['Fuego feérico', 'Oscuridad']},
      'Elfo de los bosques': {v: 'bosques', vel: '10,5 m', cj: [['Saber druídico', 1], ['Zancada prodigiosa', 3], ['Pasar sin rastro', 5]], conj: ['Zancada prodigiosa', 'Pasar sin rastro']}}}},
    el: [APT, {id: 'sentidos', n: 'Sentidos agudos', ef: 'hab', d: 'Tienes competencia en la habilidad de Percepción, Perspicacia o Supervivencia.', ops: HABS.filter(h => ['percepcion', 'perspicacia', 'supervivencia'].includes(h[0])).map(([v, n]) => ({v, n}))}],
  },
  Enano: {rs: {'Afinidad con la piedra': {act: 'Acción adicional', rec: [{...PB}]}, 'Aguante enano': {pgn: 1}, 'Resistencia enana': {res: ['Veneno']}, 'Visión en la oscuridad': {}}},
  Gnomo: {
    rs: {'Astucia gnoma': {}, 'Visión en la oscuridad': {}},
    opciones: {'Linaje gnomo': {id: 'linaje', n: 'Linaje gnomo', ops: {
      'Gnomo de las rocas': {cj: [['Prestidigitación', 1], ['Reparar', 1]]},
      'Gnomo de los bosques': {cj: [['Ilusión menor', 1], ['Hablar con los animales', 1]], rec: [{n: 'Hablar con los animales', ...PB}]}}}},
    el: [APT],
  },
  Goliat: {
    rs: {'Constitución poderosa': {}, 'Forma grande': {nv: 5, act: 'Acción adicional', rec: [{...UNO}]}},
    opciones: {'Linaje gigante': {id: 'linaje', n: 'Linaje gigante', ops: {
      'Abrasión del fuego': {act: 'Al acertar un ataque'},
      'Caída de las colinas': {act: 'Al acertar un ataque', lim: 'Solo contra criaturas Grandes o más pequeñas.'},
      'Excursión de las nubes': {act: 'Acción adicional', lim: 'Hasta 9 m, a un espacio libre que puedas ver.'},
      'Frío de la escarcha': {act: 'Al acertar un ataque'},
      'Resistencia de la piedra': {act: 'Reacción', lim: 'Solo cuando recibes daño.'},
      'Trueno de la tormenta': {act: 'Reacción', lim: 'La criatura debe estar a 18 m o menos.'}}, recTodas: PB}},
  },
  Humano: {
    rs: {'Ingenioso': {insp: 1}},
    el: [TAM, {id: 'diestro', n: 'Diestro', ef: 'hab', ops: HABS.map(([v, n]) => ({v, n}))}, {id: 'versatil', n: 'Versátil', ef: 'dote', ops: 'dotes-origen'}],
  },
  Mediano: {rs: {'Agilidad de mediano': {}, 'Fortuna': {}, 'Sigiloso por naturaleza': {}, 'Valiente': {}}},
  Orco: {rs: {'Aguante incansable': {act: 'Al llegar a 0 PG', rec: [{...UNO}]}, 'Descarga de adrenalina': {act: 'Acción adicional', rec: [{max: 'pb', rec: 'corto'}]}, 'Visión en la oscuridad': {}}},
  Tiefling: {
    el: [TAM, APT],
    rs: {'Presencia sobrenatural': {cj: [['Taumaturgia', 1]]}, 'Visión en la oscuridad': {}},
    tabla: {'Legado infernal': {id: 'linaje', n: 'Legado infernal', fila: {
      'Abisal': {res: ['Veneno'], cj: [['Rociada venenosa', 1], ['Rayo nauseabundo', 3], ['Inmovilizar persona', 5]], conj: ['Rayo nauseabundo', 'Inmovilizar persona']},
      'Ctónico': {res: ['Necrótico'], cj: [['Toque helado', 1], ['Falsa vida', 3], ['Rayo debilitador', 5]], conj: ['Falsa vida', 'Rayo debilitador']},
      'Infernal': {res: ['Fuego'], cj: [['Descarga de fuego', 1], ['Reprensión infernal', 3], ['Oscuridad', 5]], conj: ['Reprensión infernal', 'Oscuridad']}}}},
  },
};
// El id de la elección principal (linaje, legado, ancestro) es 'linaje' en todas las especies; el tamaño es 'tam' y la aptitud mágica 'apt'.

const fold = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const plano = h => String(h || '').replace(/<[^>]+>/g, '').replace(/[​ ]/g, ' ').replace(/\s+/g, ' ').trim();

/* Arreglos del texto que traía el escaneado (idempotentes). */
function arregla(d) {
  return String(d)
    .replace(/<p><b>([^<]*[^.<\s])<\/b><\/p><p><b>([^<]*)<\/b>/g, '<p><b>$1$2</b>')   // «tormen» + «tas).» partido en dos párrafos
    .replace(/(<p>[^<]*Siempre tienes ese conjuro)<\/p>(<table[\s\S]*?<\/table>)<p>(preparado\.[\s\S]*?)<\/p>/, '$1 $3</p>$2')   // Tiefling: el párrafo se cortaba por la tabla
    .replace(/sustituirese/g, 'sustituir ese')
    .replace(/[​]/g, '');
}

function bloques(d) {
  const L = [];
  for (const m of String(d).matchAll(/<p>([\s\S]*?)<\/p>|<table[\s\S]*?<\/table>/g)) {
    if (m[0].startsWith('<table')) {
      const filas = [...m[0].matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(r => [...r[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(c => plano(c[1])));
      L.push({k: 'tabla', cap: plano((/<caption>([\s\S]*?)<\/caption>/.exec(m[0]) || [])[1]), filas});
      continue;
    }
    const h = m[1], cab = /^<b>(<i>)?([\s\S]*?)(<\/i>)?<\/b>/.exec(h);
    if (!cab) { L.push({k: 'plano', t: plano(h)}); continue; }
    L.push({k: cab[1] ? 'rasgo' : 'opc', n: plano(cab[2]).replace(/\.$/, '').trim(), t: plano(h.slice(cab[0].length))});
  }
  return L;
}

/* texto de un rasgo: su primer párrafo y los párrafos sueltos que le siguen (una línea por párrafo; **negrita** para sub-apartados) */
function textoRasgo(B, i, junta) {
  const p = [B[i].t];
  for (let j = i + 1; j < B.length && B[j].k === 'plano'; j++) p.push(B[j].t);
  for (const nom of junta || []) { const x = B.find(b => b.k === 'rasgo' && fold(b.n) === fold(nom)); if (x) p.push('**' + x.n + '.** ' + x.t); }
  return p.filter(Boolean).join('\n');
}
const slug = s => fold(s).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

function construye(esp, M) {
  const B = bloques(esp.d), rs = [], el = [], av = [];
  const rasgoIdx = n => B.findIndex(b => b.k === 'rasgo' && fold(b.n) === fold(n));
  for (const [n, o] of Object.entries(M.rs || {})) {
    const i = rasgoIdx(n); if (i < 0) { av.push('sin texto el rasgo «' + n + '»'); continue; }
    const {junta, ...ef} = o;
    rs.push({n: B[i].n, d: textoRasgo(B, i, junta), ...ef});
  }
  /* elecciones con las opciones como párrafos en negrita (goliat, gnomo) */
  for (const [n, c] of Object.entries(M.opciones || {})) {
    const i = rasgoIdx(n); if (i < 0) { av.push('sin elección «' + n + '»'); continue; }
    const ops = [];
    for (let j = i + 1; j < B.length && B[j].k === 'opc'; j++) {
      const mm = /^(.*?)\s*\((.*)\)$/.exec(B[j].n), nom = mm ? mm[1] : B[j].n, f = (c.ops[nom]) || null;
      if (!f) { av.push('opción sin mecánica «' + nom + '»'); continue; }
      const {rec, ...rest} = f;
      ops.push({v: slug(nom), n: nom, ...(mm ? {s: mm[2]} : {}), d: B[j].t, ...rest, ...(rec ? {rec} : c.recTodas ? {rec: [{n: nom, ...c.recTodas}]} : {})});
    }
    if (ops.length !== Object.keys(c.ops).length) av.push('«' + n + '»: ' + ops.length + ' opciones de ' + Object.keys(c.ops).length);
    el.push({id: c.id, n: B[i].n, d: B[i].t, ops});
  }
  /* elecciones con las opciones en una tabla (elfo, tiefling, dracónido) */
  for (const [n, c] of Object.entries(M.tabla || {})) {
    const i = rasgoIdx(n), t = B.find(b => b.k === 'tabla'); if (i < 0 || !t) { av.push('sin tabla «' + n + '»'); continue; }
    const cuerpo = t.filas.slice(1), ops = [];
    if (c.dragones) {
      for (const f of cuerpo) for (const [a, b] of [[f[0], f[1]], [f[2], f[3]]]) if (a) ops.push({v: slug(a), n: (['bronce', 'cobre', 'oro', 'oropel', 'plata'].includes(a.toLowerCase()) ? 'Dragón de ' : 'Dragón ') + a.toLowerCase(), s: b, d: 'Tipo de daño: ' + b + '. Es el de tu ataque de aliento y el de tu resistencia.', res: [b], rec: [{n: 'Ataque de aliento', ...PB}]});
    } else {
      for (const f of cuerpo) {
        const mec = c.fila[f[0]]; if (!mec) { av.push('fila sin mecánica «' + f[0] + '»'); continue; }
        const {conj, v, ...rest} = mec;
        const rec = (conj || []).map((cn, k) => ({n: cn + ' (sin gastar espacio)', ...UNO, nv: k ? 5 : 3}));
        ops.push({v: v || slug(f[0]), n: f[0], d: 'Nivel 1: ' + f[1] + (/[.]$/.test(f[1]) ? '' : '.') + ' Nivel 3: ' + f[2] + '. Nivel 5: ' + f[3] + '.', ...rest, rec});
      }
    }
    el.push({id: c.id, n: B[i].n, d: textoRasgo(B, i), ops});
  }
  /* elecciones sin tabla (tamaño, aptitud, habilidad, dote): el texto sale del rasgo del mismo nombre si lo hay */
  for (const e of M.el || []) {
    const i = rasgoIdx(e.n), d = i >= 0 ? textoRasgo(B, i) : e.d || '';
    el.push({...e, d: i >= 0 ? d : e.d || ''});
  }
  /* orden: tamaño, linaje, aptitud mágica y el resto */
  const rango = e => ({tam: 0, linaje: 1, apt: 2})[e.id] ?? 3;
  el.sort((a, b) => rango(a) - rango(b));
  return {rs, el, av};
}

let total = 0;
for (const [rel, sel] of ARCHIVOS) {
  const f = path.join(RAIZ, rel);
  if (!fs.existsSync(f)) { console.log('(no existe) ' + rel); continue; }
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const esp of sel(j) || []) {
    esp.d = arregla(esp.d);
    const M = MEC[esp.n]; if (!M) { console.log('  sin mecánica: ' + esp.n); continue; }
    const {rs, el, av} = construye(esp, M);
    esp.rs = rs; if (el.length) esp.el = el; else delete esp.el;
    total++;
    console.log(rel.split('/').pop() + ' · ' + esp.n + ': ' + rs.length + ' rasgos, ' + el.map(e => e.id + '(' + e.ops.length + ')').join(' ') + (av.length ? '  ⚠ ' + av.join('; ') : ''));
  }
  fs.writeFileSync(f, JSON.stringify(j));
}
console.log(total + ' especies actualizadas');
