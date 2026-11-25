// Estructura la tabla de progresión de cada clase del compendio (datos/es/compendio.json) en datos: x.prog.
// Uso:  node tools/prog-clases.mjs [ruta.json]   (por defecto datos/es/compendio.json; reescribe el archivo)
// También copia a x.recursos lo declarado en tools/recursos-clase.json (qué recursos da cada clase y cómo se recuperan).
// Y a x.ef lo de tools/efectos-clase.json (efectos de los rasgos, con su vocabulario).
// La tabla HTML sigue siendo la fuente que se enseña; prog es lo que leen la hoja de personaje y los recursos.
// Formato de x.prog:
//   cols:  [{id, n}]            columnas propias de la clase (furias, trucos, canalizar…); id estable en minúsculas
//   filas: [{nv, pb, rasgos:[], v:{id:valor}, esp:[n1..n9], pacto:{n,nv}}]   v: número, texto ('1d6', '+3 m') o null si «—»
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ID0 = {
  'n.º de furias': 'furias', 'daño por furia': 'dano_furia', 'maestría con armas': 'maestrias', 'dado bárdico': 'inspiracion',
  'trucos': 'trucos', 'conjuros preparados': 'preparados', 'invocaciones sobrenaturales': 'invocaciones', 'canalizar divinidad': 'canalizar',
  'forma salvaje': 'forma_salvaje', 'enemigo predilecto': 'enemigo_predilecto', 'tomar aliento': 'tomar_aliento',
  'puntos de hechicería': 'hechiceria', 'artes marciales': 'artes_marciales', 'puntos de concentración': 'concentracion',
  'movimiento sin armadura': 'mov_sin_armadura', 'ataque furtivo': 'furtivo',
};
const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const ID = Object.fromEntries(Object.entries(ID0).map(([k, v]) => [fold(k), v]));
const slug = s => fold(s).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const ent = s => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const txt = s => ent(s.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();

export function progDe(html) {
  for (const t of html.match(/<table[\s\S]*?<\/table>/g) || []) {
    const th = [...t.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map(m => txt(m[1]));
    if (th[0] !== 'Nivel' || !/^Bonificador/.test(th[1] || '') || !/^Rasgos de clase/.test(th[2] || '')) continue;
    const filas = [...t.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(m => [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(c => txt(c[1]))).filter(r => r.length);
    const slots = th.map((h, i) => (/^[1-9]$/.test(h) ? i : -1)).filter(i => i >= 0);
    const iEsp = th.indexOf('Espacios de conjuro'), iNv = th.indexOf('Nivel de los espacios');
    const cols = [];
    th.forEach((h, i) => { if (i < 3 || slots.includes(i) || i === iEsp || i === iNv) return; cols.push({ i, id: ID[fold(h)] || slug(h), n: h }); });
    const num = v => (/^\d+$/.test(v) ? +v : v === '—' || v === '' ? null : v);
    return {
      cols: cols.map(({ id, n }) => ({ id, n })),
      filas: filas.map(r => {
        const f = { nv: +r[0], pb: +String(r[1]).replace('+', ''), rasgos: r[2] === '—' ? [] : r[2].split(/,\s*(?![^()]*\))/).map(s => s.trim()).filter(Boolean), v: {} };
        for (const c of cols) f.v[c.id] = num(r[c.i]);
        if (slots.length) { const e = slots.map(i => +r[i] || 0); while (e.length && !e[e.length - 1]) e.pop(); f.esp = e; }
        if (iEsp >= 0) f.pacto = { n: +r[iEsp], nv: +r[iNv] };
        return f;
      }),
    };
  }
  return null;
}

const RECURSOS = JSON.parse(readFileSync(new URL('./recursos-clase.json', import.meta.url), 'utf8'));
const EFECTOS = JSON.parse(readFileSync(new URL('./efectos-clase.json', import.meta.url), 'utf8'));

export function conProg(datos) {
  for (const x of datos.clases || []) {
    const p = progDe(x.d || ''); if (p) x.prog = p; else delete x.prog;
    const r = RECURSOS[x.n];
    if (r) {
      for (const d of r) if (d.max && d.max.col && !(p && p.cols.some(c => c.id === d.max.col))) throw new Error(`${x.n}: el recurso ${d.id} usa la columna ${d.max.col}, que no existe en su tabla`);
      x.recursos = r;
    } else delete x.recursos;
    const subs = {};
    for (const [k, v] of Object.entries(EFECTOS)) {
      const [c, sn] = k.split(' > '); if (!sn || c !== x.n) continue;
      const cab = [...(x.d || '').matchAll(/<h[2-5][^>]*>Nivel (\d+): ([^<]*)<\/h[2-5]>/g)].map(m => m[1] + ':' + m[2].trim());
      if (!(x.sub || []).includes(sn)) throw new Error(`${x.n}: subclase «${sn}» desconocida`);
      subs[sn] = Object.entries(v).map(([n, r]) => {
        if (!cab.includes(r.nv + ':' + n)) throw new Error(`${x.n} > ${sn}: «Nivel ${r.nv}: ${n}» no está en el texto`);
        return { nv: r.nv, n, ef: r.ef };
      });
    }
    if (Object.keys(subs).length) x.subef = subs; else delete x.subef;
    const e = EFECTOS[x.n];
    if (e) {
      const nombres = new Set((p ? p.filas : []).flatMap(f => f.rasgos));
      for (const [n, lista] of Object.entries(e)) {
        if (!nombres.has(n)) throw new Error(`${x.n}: el rasgo «${n}» de efectos-clase.json no está en su tabla`);
        for (const ef of lista) for (const g of ef.t === 'estado' ? [ef, ...(ef.ef || [])] : [ef]) if (g.v && g.v.col && !(p && p.cols.some(c => c.id === g.v.col))) throw new Error(`${x.n} · ${n}: columna ${g.v.col} inexistente`);
      }
      x.ef = e;
    } else delete x.ef;
  }
  return datos;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ruta = process.argv[2] || fileURLToPath(new URL('../datos/es/compendio.json', import.meta.url));
  const d = conProg(JSON.parse(readFileSync(ruta, 'utf8')));
  writeFileSync(ruta, JSON.stringify(d));
  console.log(d.clases.map(c => `${c.n}: ${c.prog ? c.prog.filas.length + ' niveles, ' + c.prog.cols.length + ' columnas' : 'SIN TABLA'}`).join('\n'));
}
