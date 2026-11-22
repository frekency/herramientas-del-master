import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
const { rutaImagen } = createRequire(import.meta.url)('./imagenes.js');
const C = path.resolve('/tmp/imgs');

test('imágenes: solo se sirven tok/, img/ e index.json de la carpeta elegida', () => {
  assert.equal(rutaImagen(C, '/__imagenes/tok/aboleth.webp'), path.join(C, 'tok', 'aboleth.webp'));
  assert.equal(rutaImagen(C, '/__imagenes/img/adult-gold-dragon.webp'), path.join(C, 'img', 'adult-gold-dragon.webp'));
  assert.equal(rutaImagen(C, '/__imagenes/index.json'), path.join(C, 'index.json'));
});
test('imágenes: rechaza lo que se sale o no es imagen', () => {
  for (const p of ['/__imagenes/tok/../../secreto.webp', '/__imagenes/tok/%2e%2e%2fsecreto.webp', '/__imagenes/otro/a.webp', '/__imagenes/tok/a.exe', '/__imagenes/tok/A B.webp', '/index.html', '/__imagenes/tok/', '/__imagenes/tok/a/b.webp'])
    assert.equal(rutaImagen(C, p), null, p);
  assert.equal(rutaImagen('', '/__imagenes/index.json'), null);
});
