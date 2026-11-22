// Cruza lo leído por OCR del Manual de Monstruos (salida de mm_extraer.py) con los datos numéricos de 5e.tools.
// Uso: node tools/mm_cruzar.mjs <ocr.json> <bestiary-xmm.json> <salida.json>
// - Empareja cada criatura por «firma» numérica (CA, PG, 6 características, VD) → pone el nombre en inglés (en).
// - Si un número leído no coincide con 5e.tools, usa el de 5e.tools y lo anota en «dudas» (sigue «pend»).
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
const sgn = n => (n >= 0 ? '+' : '') + n;

function puntos(c, m) {
  let p = 0;
  if (c.ac === acOf(m)) p++;
  if (c.hp === hpOf(m)) p += 2;
  if (c.cr != null && String(c.cr) === crOf(m)) p++;
  (c.ab || []).forEach((v, i) => { if (v === m[AB[i]]) p++; });
  return p;
}

const usados = new Set();
const sinPar = [];
let corregidas = 0;
const criaturas = ocr.criaturas.map(c => {
  const cand = best.map(m => ({ m, p: puntos(c, m) })).sort((a, b) => b.p - a.p);
  const [a, b] = cand;
  // mínimo 5 coincidencias de 10 posibles y que gane con claridad
  if (!a || a.p < 5 || (b && b.p === a.p)) { sinPar.push(c.n); return { ...c, dudas: [...(c.dudas || []), 'Sin pareja en 5e.tools: revisar todo con el manual'], pend: true }; }
  const m = a.m; usados.add(m.name);
  const o = { ...c, en: m.name };
  const dudas = [...(c.dudas || [])];
  const fix = (campo, ocrV, v, etiqueta) => {
    if (v == null) return;
    if (JSON.stringify(ocrV) !== JSON.stringify(v)) { dudas.push(`${etiqueta}: el OCR leyó ${ocrV ?? '–'}, 5e.tools dice ${v} (se ha usado 5e.tools)`); o[campo] = v; corregidas++; }
    else o[campo] = v;
  };
  // se quitan las dudas de cálculo antiguas: los números ya son los de 5e.tools
  const dudasPrev = dudas.filter(d => !/no cuadra|menor que el modificador|falta VD|ilegibles|sin dados legibles/.test(d));
  dudas.length = 0; dudas.push(...dudasPrev);
  fix('cr', c.cr, crOf(m), 'VD');
  fix('ac', c.ac, acOf(m), 'CA');
  fix('hp', c.hp, hpOf(m), 'PG');
  if (m.hp && m.hp.formula) o.hd = m.hp.formula.replace(/\s/g, '');
  const ab = AB.map(k => m[k]);
  if (ab.every(x => typeof x === 'number')) {
    (c.ab || []).forEach((v, i) => { if (v !== ab[i]) dudas.push(`${ABN[i]}: el OCR leyó ${v ?? '–'}, 5e.tools dice ${ab[i]} (se ha usado 5e.tools)`); });
    if (JSON.stringify(c.ab) !== JSON.stringify(ab)) corregidas++;
    o.ab = ab;
    o.sv = AB.map((k, i) => (m.save && m.save[k] != null ? parseInt(m.save[k], 10) : mod(ab[i])));
  }
  if (m.passive != null) o.pp = m.passive;
  if (m.size && SZ[m.size[0]]) o.sz = SZ[m.size[0]];
  if (m.page) o.pg = o.pg ?? m.page;
  if (dudas.length) o.dudas = dudas; else delete o.dudas;
  o.pend = true;
  return o;
});

const out = { ...ocr, criaturas };
fs.writeFileSync(outF, JSON.stringify(out, null, 1));
const conDudas = criaturas.filter(c => c.dudas && c.dudas.length).length;
console.log(`${criaturas.length} criaturas · ${criaturas.length - sinPar.length} emparejadas con 5e.tools · ${sinPar.length} sin pareja · ${corregidas} valores corregidos · ${conDudas} con dudas -> ${outF}`);
if (sinPar.length) console.log('sin pareja:', sinPar.join(', '));
