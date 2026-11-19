import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { validar } = createRequire(import.meta.url)('./mesa.js');

test('imagen: solo data: png/jpeg/webp', () => {
  assert.deepEqual(validar({ tipo: 'imagen', src: 'data:image/png;base64,AAAA', titulo: 'Mapa' }), { tipo: 'imagen', src: 'data:image/png;base64,AAAA', titulo: 'Mapa' });
  for (const src of ['data:image/svg+xml;base64,AAAA', 'javascript:alert(1)', 'https://x.test/a.png', 'file:///c:/a.png', 'data:text/html;base64,AAAA', 5, null])
    assert.equal(validar({ tipo: 'imagen', src }), null, String(src));
  assert.equal(validar({ tipo: 'imagen', src: 'data:image/png;base64,' + 'A'.repeat(6_000_001) }), null);
});

test('imagen: el título se recorta y debe ser texto', () => {
  assert.equal(validar({ tipo: 'imagen', src: 'data:image/png;base64,AAAA', titulo: 'x'.repeat(500) }).titulo.length, 200);
  assert.equal(validar({ tipo: 'imagen', src: 'data:image/png;base64,AAAA', titulo: { a: 1 } }).titulo, '');
});

test('iniciativa: solo nombre, turno, caído y color; nada más pasa', () => {
  const v = validar({ tipo: 'iniciativa', abrir: 1, activo: true, ronda: 3.7, lista: [
    { n: 'Lyra', actual: true, color: '#3d7bd9', hp: 12, ac: 15, notas: 'secreto' },
    { n: 'Goblin', caido: 1, color: 'red' }, { n: '' }, null, 'x'] });
  assert.deepEqual(v, { tipo: 'iniciativa', abrir: true, activo: true, ronda: 3, cuenta: null, lista: [
    { n: 'Lyra', actual: true, caido: false, color: '#3d7bd9' },
    { n: 'Goblin', actual: false, caido: true, color: '#888888' }] });
  assert.ok(!JSON.stringify(v).includes('secreto'));
});

test('iniciativa: tope de filas y ronda acotada', () => {
  const v = validar({ tipo: 'iniciativa', ronda: 1e9, lista: Array.from({ length: 500 }, (_, i) => ({ n: 'c' + i })) });
  assert.equal(v.lista.length, 80);
  assert.equal(v.ronda, 9999);
});

test('tipos desconocidos o basura se rechazan; limpiar pasa', () => {
  assert.equal(validar({ tipo: 'script' }), null);
  assert.equal(validar(null), null);
  assert.equal(validar('x'), null);
  assert.deepEqual(validar({ tipo: 'limpiar' }), { tipo: 'limpiar' });
});

test('aviso: texto y título acotados; vacío se rechaza', () => {
  assert.deepEqual(validar({ tipo: 'aviso', titulo: 'Derrumbe', texto: 'El techo cruje' }), { tipo: 'aviso', titulo: 'Derrumbe', texto: 'El techo cruje' });
  assert.equal(validar({ tipo: 'aviso', texto: 'x'.repeat(900) }).texto.length, 400);
  assert.equal(validar({ tipo: 'aviso', titulo: 'y'.repeat(300) }).titulo.length, 80);
  assert.equal(validar({ tipo: 'aviso', texto: '  ', titulo: '' }), null);
  assert.equal(validar({ tipo: 'aviso', texto: { a: 1 } }), null);
});

test('iniciativa: la cuenta atrás es opcional y solo lleva etiqueta, segundos y pausa', () => {
  const v = validar({ tipo: 'iniciativa', lista: [], cuenta: { n: 'La cueva aguanta', seg: 125.9, pausa: 1, secreto: 'x' } });
  assert.deepEqual(v.cuenta, { n: 'La cueva aguanta', seg: 125, pausa: true });
  assert.equal(validar({ tipo: 'iniciativa', lista: [] }).cuenta, null);
  assert.equal(validar({ tipo: 'iniciativa', lista: [], cuenta: { seg: 'x' } }).cuenta, null);
  assert.equal(validar({ tipo: 'iniciativa', lista: [], cuenta: { seg: -50 } }).cuenta.seg, 0);
  assert.equal(validar({ tipo: 'iniciativa', lista: [], cuenta: { seg: 1e9 } }).cuenta.seg, 86400);
  assert.equal(validar({ tipo: 'iniciativa', lista: [], cuenta: 'x' }).cuenta, null);
});
