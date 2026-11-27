// Estructura armas y armaduras del compendio (x.arma / x.arm) a partir de su texto, para que la hoja calcule CA y ataques.
// Uso:  node tools/equipo.mjs [ruta.json]   (por defecto datos/privado/libros/manual-del-jugador-2024.json; reescribe el archivo)
//   x.arma = {cat:'sencilla'|'marcial', dist:bool, dano:'1d8', tipo:'cortante', props:[…], versatil:'1d10', alc:[6,18], mae:'Debilitar'}
//   x.arm  = {tipo:'ligera'|'media'|'pesada', ca:16, des:bool, desMax:2|null, fue:13, sig:bool} · escudo: {tipo:'escudo', bono:2}
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const ent = s => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const campo = (d, k) => { const m = new RegExp(String.raw`<b>${k}:</b>\s*([\s\S]*?)</p>`).exec(d); return m ? ent(m[1].replace(/<[^>]*>/g, '')).trim() : ''; };
const PROP = { ligero: 'ligera', ligera: 'ligera', sutil: 'sutil', pesado: 'pesada', pesada: 'pesada', 'a dos manos': 'dos_manos', 'gran alcance': 'gran_alcance', arrojadizo: 'arrojadiza', arrojadiza: 'arrojadiza', municion: 'municion', recarga: 'recarga', versatil: 'versatil' };

export function armaDe(x) {
  const d = x.d || '', da = campo(d, 'Daño'); if (!da) return null;
  const m = /^(\d+(?:d\d+)?)\s*(\w+)?/.exec(da); if (!m) return null;
  const a = { cat: /marcial/i.test(x.t) ? 'marcial' : 'sencilla', dist: /distancia/i.test(x.t), dano: m[1], tipo: m[2] || '', props: [] };
  const pr = campo(d, 'Propiedades').replace(/\(([^)]*)\)/g, (_, g) => { (g.match(/(\d+(?:,\d+)?)\/(\d+(?:,\d+)?)/) || []).slice(1).forEach(() => {}); return '(' + g + ')'; });
  for (const p of pr.split(/,(?![^()]*\))/).map(s => s.trim()).filter(s => s && s !== '—')) {
    const nom = fold(p.replace(/\(.*$/, '').trim()), k = PROP[nom]; if (!k) throw new Error(`${x.n}: propiedad desconocida «${p}»`);
    if (!a.props.includes(k)) a.props.push(k);
    const par = /\((.*)\)/.exec(p);
    if (k === 'versatil' && par) a.versatil = par[1].trim();
    const al = par && /(\d+(?:,\d+)?)\/(\d+(?:,\d+)?)/.exec(par[1]); if (al) a.alc = [al[1], al[2]].map(v => +v.replace(',', '.'));
  }
  const mae = campo(d, 'Maestría'); if (mae) a.mae = mae;
  return a;
}
export function armDe(x) {
  const d = x.d || '', ca = campo(d, String.raw`Clase de armadura \(CA\)`); if (!ca) return null;
  if (/escudo/i.test(x.t)) return { tipo: 'escudo', bono: +/\+(\d+)/.exec(ca)[1] };
  const m = /^(\d+)(?: \+ modificador por Des(?: \(máx\. (\d)\))?)?$/.exec(ca); if (!m) throw new Error(`${x.n}: CA no reconocida «${ca}»`);
  const tipo = /ligera/i.test(x.t) ? 'ligera' : /media/i.test(x.t) ? 'media' : 'pesada';
  const fue = /Fue (\d+)/.exec(campo(d, 'Fuerza'));
  return { tipo, ca: +m[1], des: /Des/.test(ca), desMax: m[2] ? +m[2] : null, fue: fue ? +fue[1] : 0, sig: /desventaja/i.test(campo(d, 'Sigilo')) };
}
export function conEquipo(datos) {
  for (const x of datos.objetos || []) {
    delete x.arma; delete x.arm;
    if (x.k === 'arma') { const a = armaDe(x); if (a) x.arma = a; }
    else if (x.k === 'armadura') { const a = armDe(x); if (a) x.arm = a; }
  }
  return datos;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ruta = process.argv[2] || fileURLToPath(new URL('../datos/privado/libros/manual-del-jugador-2024.json', import.meta.url));
  const d = conEquipo(JSON.parse(readFileSync(ruta, 'utf8')));
  writeFileSync(ruta, JSON.stringify(d));
  console.log(`${d.objetos.filter(x => x.arma).length} armas, ${d.objetos.filter(x => x.arm).length} armaduras/escudos`);
}
