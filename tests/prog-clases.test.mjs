// Tablas de progresión de las clases del compendio: la tabla HTML y su versión estructurada (x.prog) deben cuadrar con las reglas.
import { testM as test, MANUAL } from './manual.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { progDe } from '../tools/prog-clases.mjs';

const D = MANUAL;
const FULL = [[2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1]];
const HALF = [[2], [2], [3], [3], [4, 2], [4, 2], [4, 3], [4, 3], [4, 3, 2], [4, 3, 2], [4, 3, 3], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2]];
const PACT = [[1, 1], [2, 1], [2, 2], [2, 2], [2, 3], [2, 3], [2, 4], [2, 4], [2, 5], [2, 5], [3, 5], [3, 5], [3, 5], [3, 5], [3, 5], [3, 5], [4, 5], [4, 5], [4, 5], [4, 5]];
const TIPO = { Bardo: FULL, Clérigo: FULL, Druida: FULL, Hechicero: FULL, Mago: FULL, Explorador: HALF, Paladín: HALF };

test('las 12 clases tienen su progresión estructurada y cuadra con la tabla', () => {
  assert.equal(D.clases.length, 12);
  for (const c of D.clases) {
    assert.ok(c.prog, c.n + ': falta prog (ejecuta node tools/prog-clases.mjs)');
    assert.deepEqual(c.prog, progDe(c.d), c.n + ': prog no coincide con su tabla (ejecuta node tools/prog-clases.mjs)');
  }
});

test('progresión: 20 niveles, bonificador por competencia y columnas que no decrecen', () => {
  for (const c of D.clases) {
    const f = c.prog.filas;
    assert.equal(f.length, 20, c.n);
    f.forEach((r, i) => {
      assert.equal(r.nv, i + 1, c.n + ' nivel');
      assert.equal(r.pb, 2 + Math.floor(i / 4), `${c.n} nv ${i + 1} competencia`);
      assert.ok(Array.isArray(r.rasgos), `${c.n} nv ${i + 1} rasgos`);
    });
    for (const col of c.prog.cols) {
      const n = f.map(r => r.v[col.id]);
      if (n.every(v => v === null || typeof v === 'number'))
        n.forEach((v, i) => i && assert.ok((v ?? 0) >= (n[i - 1] ?? 0), `${c.n} «${col.n}» baja en el nivel ${i + 1}`));
    }
  }
});

test('espacios de conjuro y de pacto iguales a las reglas', () => {
  for (const c of D.clases) {
    const ref = TIPO[c.n];
    if (ref) c.prog.filas.forEach((r, i) => assert.deepEqual(r.esp, ref[i], `${c.n} nv ${i + 1} espacios`));
    else assert.ok(c.prog.filas.every(r => !r.esp), c.n + ' no debería tener espacios');
  }
  const b = D.clases.find(c => c.n === 'Brujo');
  b.prog.filas.forEach((r, i) => assert.deepEqual([r.pacto.n, r.pacto.nv], PACT[i], `Brujo nv ${i + 1} pacto`));
});

test('recursos conocidos: furias, forma salvaje, canalizar y tomar aliento', () => {
  const v = (n, id) => D.clases.find(c => c.n === n).prog.filas.map(r => r.v[id]);
  assert.deepEqual(v('Bárbaro', 'furias'), [2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6]);
  assert.deepEqual(v('Druida', 'forma_salvaje'), [null, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4]);
  assert.deepEqual(v('Clérigo', 'canalizar'), [null, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4]);
  assert.deepEqual(v('Guerrero', 'tomar_aliento'), [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
  assert.deepEqual(v('Pícaro', 'furtivo').filter((_, i) => i % 2 === 0), ['1d6', '2d6', '3d6', '4d6', '5d6', '6d6', '7d6', '8d6', '9d6', '10d6']);
});

test('tablas de las clases: sin cabecera partida en celdas ni filas de otro ancho', () => {
  for (const c of D.clases) {
    for (const t of c.d.match(/<table[\s\S]*?<\/table>/g) || []) {
      const cap = (t.match(/<caption>([\s\S]*?)<\/caption>/) || [, ''])[1];
      assert.ok(!/<tbody><tr><td>[^<]+<\/td><td><\/td><\/tr>/.test(t), `${c.n} «${cap}»: cabecera partida en dos filas`);
      const w = [...t.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].filter(m => !/colspan/.test(m[1])).map(m => (m[1].match(/<t[dh][ >]/g) || []).length);
      assert.equal(new Set(w).size, 1, `${c.n} «${cap}»: filas con distinto número de celdas`);
      for (const m of t.matchAll(/<td[^>]*>([^<]{260,})<\/td>/g)) assert.fail(`${c.n} «${cap}»: celda de ${m[1].length} caracteres (texto colado)`);
    }
  }
});
