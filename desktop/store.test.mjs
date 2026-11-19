import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const { abrir } = createRequire(import.meta.url)('./store.js');

const dir = mkdtempSync(join(tmpdir(), 'almacen-'));
test.after(() => rmSync(dir, { recursive: true, force: true }));

test('guarda, lee, sobrescribe y borra', () => {
  const s = abrir(join(dir, 'a.db'));
  assert.equal(s.get('x'), null);
  s.set('x', '1'); assert.equal(s.get('x'), '1');
  s.set('x', '2'); assert.equal(s.get('x'), '2');
  s.remove('x'); assert.equal(s.get('x'), null);
  s.cerrar();
});

test('los datos persisten al reabrir (Unicode incluido)', () => {
  const f = join(dir, 'b.db');
  let s = abrir(f);
  s.set('combat-tracker-v1', JSON.stringify({ nombre: 'Ñandú ⚔️', n: 3 }));
  s.cerrar();
  s = abrir(f);
  assert.deepEqual(JSON.parse(s.get('combat-tracker-v1')), { nombre: 'Ñandú ⚔️', n: 3 });
  assert.deepEqual(s.keys(), ['combat-tracker-v1']);
  s.cerrar();
});

test('rechaza claves y valores no válidos', () => {
  const s = abrir(join(dir, 'c.db'));
  for (const k of ['', 5, null, 'k'.repeat(201)]) assert.throws(() => s.set(k, 'v'), TypeError);
  assert.throws(() => s.set('k', 5), TypeError);
  assert.throws(() => s.get({}), TypeError);
  s.cerrar();
});

test('la copia de seguridad es una base válida y se limitan a las últimas N', async () => {
  const s = abrir(join(dir, 'd.db'));
  s.set('dato', 'importante');
  const copias = join(dir, 'copias');
  for (let i = 0; i < 4; i++) { s.copiaDeSeguridad(copias, 2); await new Promise(r => setTimeout(r, 5)); }
  assert.equal(readdirSync(copias).length, 2);
  const c = abrir(join(copias, readdirSync(copias).sort().pop()));
  assert.equal(c.get('dato'), 'importante');
  c.cerrar(); s.cerrar();
});
