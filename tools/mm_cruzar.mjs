// Cruza lo leído por OCR del Manual de Monstruos (salida de mm_extraer.py) con los datos de 5e.tools.
// Uso: node tools/mm_cruzar.mjs <ocr.json> <bestiary-xmm.json> <salida.json>
// - Empareja cada criatura leída con la de 5e.tools por «firma» numérica (CA, PG, 6 características, VD) → pone el nombre en inglés (en).
// - Si un número leído no coincide con 5e.tools, usa el de 5e.tools y lo anota en «dudas» (sigue «pend»).
// - Las criaturas de 5e.tools que no se pudieron leer del manual se añaden igualmente (con su página), marcadas para revisar.
// - Uso personal: los ficheros de 5e.tools y la salida van en datos/privado/ (fuera del repositorio).
import fs from 'node:fs';

const [,, ocrF, bestF, outF] = process.argv;
if (!ocrF || !bestF || !outF) { console.error('uso: node tools/mm_cruzar.mjs <ocr.json> <bestiary-xmm.json> <salida.json>'); process.exit(1); }
const ocr = JSON.parse(fs.readFileSync(ocrF, 'utf8'));
const best = JSON.parse(fs.readFileSync(bestF, 'utf8')).monster;

const SZ = { T: 'Tiny', S: 'Small', M: 'Medium', L: 'Large', H: 'Huge', G: 'Gargantuan' };
const AB = ['str', 'dex', 'con', 'int', 'wis', 'cha'], ABN = ['FUE', 'DES', 'CON', 'INT', 'SAB', 'CAR'];
const mod = s => Math.floor((s - 10) / 2);
const crOf = m => String(typeof m.cr === 'object' ? m.cr.cr : m.cr);
const acOf = m => { const a = m.ac && m.ac[0]; return typeof a === 'object' ? a.ac : a; };
const hpOf = m => m.hp && m.hp.average;

function puntos(c, m) {
  let p = 0;
  if (c.ac === acOf(m)) p++;
  if (c.hp === hpOf(m)) p += 2;
  if (c.cr != null && String(c.cr) === crOf(m)) p++;
  (c.ab || []).forEach((v, i) => { if (v === m[AB[i]]) p++; });
  return p;
}

// ---- asignación: de mejor a peor pareja, cada ficha de 5e.tools solo una vez
const par = new Map(); // índice OCR -> monstruo
const usados = new Set();
for (const minimo of [5, 3]) {
  const cand = [];
  ocr.criaturas.forEach((c, i) => { if (par.has(i)) return; best.forEach(m => { if (usados.has(m)) return; const p = puntos(c, m); if (p >= minimo) cand.push({ i, m, p }); }); });
  cand.sort((x, y) => y.p - x.p);
  for (const x of cand) { if (par.has(x.i) || usados.has(x.m)) continue; par.set(x.i, { m: x.m, p: x.p }); usados.add(x.m); }
}

const sinPar = [];
let corregidas = 0;
const criaturas = ocr.criaturas.map((c, i) => {
  const a = par.get(i);
  if (!a) { sinPar.push(c.n); return { ...c, dudas: [...(c.dudas || []), 'Sin pareja en 5e.tools: revisar todo con el manual'], pend: true }; }
  const m = a.m;
  const o = { ...c, en: m.name };
  const dudas = (c.dudas || []).filter(d => !/no cuadra|menor que el modificador|falta VD|ilegibles|sin dados legibles/.test(d));
  const fix = (campo, ocrV, v, etiqueta) => {
    if (v == null) return;
    if (JSON.stringify(ocrV) !== JSON.stringify(v)) { dudas.push(`${etiqueta}: el OCR leyó ${ocrV ?? '–'}, 5e.tools dice ${v} (se ha usado 5e.tools)`); corregidas++; }
    o[campo] = v;
  };
  if (a.p < 5) dudas.push('Pareja dudosa con 5e.tools (pocas coincidencias): comprobar nombre y números');
  fix('cr', c.cr, crOf(m), 'VD');
  fix('ac', c.ac, acOf(m), 'CA');
  fix('hp', c.hp, hpOf(m), 'PG');
  if (m.hp && m.hp.formula) o.hd = m.hp.formula.replace(/\s/g, '');
  const ab = AB.map(k => m[k]);
  if (ab.every(x => typeof x === 'number')) {
    (c.ab || []).forEach((v, k) => { if (v !== ab[k]) dudas.push(`${ABN[k]}: el OCR leyó ${v ?? '–'}, 5e.tools dice ${ab[k]} (se ha usado 5e.tools)`); });
    if (JSON.stringify(c.ab) !== JSON.stringify(ab)) corregidas++;
    o.ab = ab;
    o.sv = AB.map((k, j) => (m.save && m.save[k] != null ? parseInt(m.save[k], 10) : mod(ab[j])));
  }
  if (m.passive != null) o.pp = m.passive;
  if (m.size && SZ[m.size[0]]) o.sz = SZ[m.size[0]];
  if (m.page) o.pg = o.pg ?? m.page;
  if (dudas.length) o.dudas = dudas; else delete o.dudas;
  o.pend = true;
  return o;
});

// ---- las que están en 5e.tools y no salieron del manual: se añaden tal cual
const CR_XP = { '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900, '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000, '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000, '21': 33000, '22': 41000, '23': 50000, '24': 62000, '25': 75000, '26': 90000, '27': 105000, '28': 120000, '29': 135000, '30': 155000 };
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const AB_EN = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };
const ft = n => (Math.round(n * 0.3 * 2) / 2).toString().replace('.', ',') + ' m';
const ftTxt = s => String(s).replace(/(\d+)\s*(?:ft\.?|feet|foot)/gi, (_, n) => ft(+n));
function tags(s) {
  return String(s).replace(/\{@(\w+)\s*([^}]*)\}/g, (_, t, a) => {
    const p = a.split('|');
    switch (t) {
      case 'atk': case 'atkr': return ({ m: 'Melee Attack Roll:', r: 'Ranged Attack Roll:', 'm,r': 'Melee or Ranged Attack Roll:', 'r,m': 'Melee or Ranged Attack Roll:', mw: 'Melee Weapon Attack:', rw: 'Ranged Weapon Attack:' })[p[0].trim()] || 'Attack Roll:';
      case 'hit': return (+p[0] >= 0 ? '+' : '') + p[0];
      case 'h': return 'Hit: ';
      case 'dc': return 'DC ' + p[0];
      case 'actSave': return (AB_EN[p[0].trim()] || p[0]) + ' Saving Throw:';
      case 'actSaveFail': return 'Failure:';
      case 'actSaveSuccess': return 'Success:';
      case 'actSaveSuccessOrFail': return 'Failure or Success:';
      case 'actTrigger': return 'Trigger:';
      case 'actResponse': return 'Response:';
      case 'recharge': return '';
      case 'damage': case 'dice': case 'scaledamage': case 'scaledice': return p[0];
      default: return (p[2] || p[0]).replace(/\s*\[[^\]]*\]\s*$/, '');
    }
  });
}
function flat(e) {
  if (e == null) return '';
  if (typeof e === 'string') return tags(e);
  if (Array.isArray(e)) return e.map(flat).filter(Boolean).join('\n');
  if (e.type === 'list') return (e.items || []).map(i => '- ' + flat(i)).join('\n');
  if (e.type === 'item') return (e.name ? e.name + '. ' : '') + flat(e.entry ?? e.entries);
  if (e.type === 'entries') return (e.name ? e.name + '. ' : '') + flat(e.entries);
  if (e.type === 'table') return (e.caption ? e.caption + '\n' : '') + (e.rows || []).map(r => '| ' + r.map(flat).join(' | ') + ' |').join('\n');
  return flat(e.entries ?? e.entry ?? '');
}
function entrada(x) {
  let name = String(x.name || ''), tag;
  const rc = name.match(/\{@recharge\s*(\d)?\}/);
  if (rc) tag = 'Recarga ' + (rc[1] ? rc[1] + '–6' : '6');
  name = tags(name).replace(/\s*\(Recharge[^)]*\)/i, '').trim();
  const d = name.match(/\s*\((\d+)\/Day(?: Each)?\)\s*$/i);
  if (d) { tag = d[1] + '/día'; name = name.slice(0, d.index).trim(); }
  const out = [name, flat(x.entries)];
  if (tag) out.push(tag);
  return out;
}
function conjuros(sc) {
  const L = [flat(sc.headerEntries)];
  const lst = a => a.map(tags).join(', ');
  if (sc.will) L.push('At Will: ' + lst(sc.will));
  if (sc.daily) for (const [k, v] of Object.entries(sc.daily)) L.push(`${parseInt(k, 10)}/Day${/e/.test(k) ? ' Each' : ''}: ${lst(v)}`);
  if (sc.spells) for (const [k, v] of Object.entries(sc.spells)) L.push((k === '0' ? 'Cantrips (at will)' : `Level ${k}${v.slots ? ` (${v.slots} slots)` : ''}`) + ': ' + lst(v.spells || []));
  if (sc.footerEntries) L.push(flat(sc.footerEntries));
  return [tags(sc.name || 'Spellcasting'), L.filter(Boolean).join('\n')];
}
const SPD = { walk: '', burrow: 'excavar ', climb: 'trepar ', fly: 'volar ', swim: 'nadar ' };
const SK = { acrobatics: 'Acrobacias', 'animal handling': 'Trato con animales', arcana: 'Arcanos', athletics: 'Atletismo', deception: 'Engaño', history: 'Historia', insight: 'Perspicacia', intimidation: 'Intimidación', investigation: 'Investigación', medicine: 'Medicina', nature: 'Naturaleza', perception: 'Percepción', performance: 'Interpretación', persuasion: 'Persuasión', religion: 'Religión', 'sleight of hand': 'Juego de manos', stealth: 'Sigilo', survival: 'Supervivencia' };
const SN = { blindsight: 'vista ciega', darkvision: 'visión en la oscuridad', tremorsense: 'sentido de la vibración', truesight: 'visión verdadera' };
const AL = { L: 'lawful', N: 'neutral', C: 'chaotic', G: 'good', E: 'evil', U: 'unaligned', A: 'any alignment' };
const dmgList = a => (a || []).map(x => typeof x === 'string' ? x : (x.special || flat(x.immune || x.resist || x.vulnerable))).join(', ');
const tipoDe = t => { while (t && typeof t === 'object') t = t.type ?? (t.choose && t.choose[0]); return String(t || 'monstrosity'); };
function desde5e(m) {
  const ab = AB.map(k => m[k]);
  const cv = crOf(m).includes('/') ? 0 : +crOf(m), pbv = 2 + Math.floor((Math.max(cv, 1) - 1) / 4);
  const o = { n: m.name, en: m.name, sz: SZ[m.size[0]] || 'Medium', ty: cap(tipoDe(m.type)) };
  if (m.alignment) o.al = (m.alignment.length === 1 && m.alignment[0] === 'N' ? 'neutral' : m.alignment.map(x => AL[x] || x).join(' ')).trim();
  o.cr = crOf(m); o.xp = CR_XP[o.cr]; o.ac = acOf(m); o.hp = hpOf(m);
  if (m.hp && m.hp.formula) o.hd = m.hp.formula.replace(/\s/g, '');
  o.sp = Object.entries(m.speed || {}).filter(([k]) => k !== 'canHover').map(([k, v]) => (SPD[k] ?? k + ' ') + ft(typeof v === 'object' ? v.number : v)).join(', ');
  o.ab = ab;
  o.in = mod(ab[1]) + (m.initiative && m.initiative.proficiency ? pbv * m.initiative.proficiency : 0);
  o.sv = AB.map((k, i) => (m.save && m.save[k] != null ? parseInt(m.save[k], 10) : mod(ab[i])));
  if (m.skill) o.sk = Object.entries(m.skill).map(([k, v]) => `${SK[k] || cap(k)} ${v}`).join(', ');
  if (m.senses) o.se = m.senses.map(s => ftTxt(s).replace(/^(\w+)/, w => SN[w.toLowerCase()] || w)).join(', ');
  if (m.passive != null) o.pp = m.passive;
  if (m.languages) o.la = m.languages.join(', ');
  if (m.vulnerable) o.vu = dmgList(m.vulnerable);
  if (m.resist) o.re = dmgList(m.resist);
  const im = [m.immune ? dmgList(m.immune) : '', m.conditionImmune ? dmgList(m.conditionImmune) : ''].filter(Boolean).join('; ');
  if (im) o.im = im;
  const t = (m.trait || []).map(entrada), a = (m.action || []).map(entrada), b = (m.bonus || []).map(entrada), r = (m.reaction || []).map(entrada), l = (m.legendary || []).map(entrada);
  for (const s of m.spellcasting || []) (s.displayAs === 'action' ? a : s.displayAs === 'bonus' ? b : t).push(conjuros(s));
  if (t.length) o.t = t;
  if (a.length) o.a = a;
  if (b.length) o.b = b;
  if (r.length) o.r = r;
  if (l.length) { o.l = l; o.lu = m.legendaryActions || 3; }
  if (m.page) o.pg = m.page;
  o.dudas = ['No se leyó del manual: datos de 5e.tools (textos en inglés, pendientes de traducir). Compáralo con tu libro.'];
  o.pend = true;
  return o;
}
// ---- secciones que el OCR dejó incompletas: se usan las de 5e.tools (en inglés)
const SEC = { t: 'Atributos', a: 'Acciones', b: 'Acciones adicionales', r: 'Reacciones', l: 'Acciones legendarias' };
let seccionesFix = 0;
ocr.criaturas.forEach((c, i) => {
  const a = par.get(i); if (!a) return;
  const o = criaturas[i], d = desde5e(a.m);
  for (const k of Object.keys(SEC)) {
    const n5 = (d[k] || []).length, n = (o[k] || []).length;
    if (n5 > n) { o[k] = d[k]; if (k === 'l') o.lu = d.lu; o.dudas = [...(o.dudas || []), SEC[k] + ': el OCR leyó ' + n + ' entradas y 5e.tools tiene ' + n5 + '; se usan las de 5e.tools (en inglés)']; seccionesFix++; }
  }
});
const extra = best.filter(m => !usados.has(m) && m.ac && m.hp && m.str != null).map(desde5e);
const nombres = new Set(criaturas.map(c => (c.n || '').toLowerCase()));
const extraOk = extra.filter(c => !nombres.has(c.n.toLowerCase()));
criaturas.push(...extraOk);
criaturas.sort((x, y) => (x.pg ?? 9999) - (y.pg ?? 9999));

const out = { ...ocr, criaturas };
fs.writeFileSync(outF, JSON.stringify(out, null, 1));
const conDudas = criaturas.filter(c => c.dudas && c.dudas.length).length;
console.log(`${criaturas.length} criaturas: ${ocr.criaturas.length} leídas del manual (${ocr.criaturas.length - sinPar.length} emparejadas con 5e.tools, ${sinPar.length} sin pareja) + ${extraOk.length} solo de 5e.tools · ${seccionesFix} secciones completadas · ${corregidas} valores corregidos · ${conDudas} con dudas -> ${outF}`);
if (sinPar.length) console.log('sin pareja:', sinPar.join(', '));
