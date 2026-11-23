import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const { rutaAudio, listar } = createRequire(import.meta.url)('./audios.js');
const C = path.resolve('/tmp/sonidos');

test('audios: solo se sirven archivos de audio de la carpeta elegida', () => {
  assert.equal(rutaAudio(C, '/__audios/lluvia.mp3'), path.join(C, 'lluvia.mp3'));
  assert.equal(rutaAudio(C, '/__audios/Taberna%20de%20noche%20(1).OGG'), path.join(C, 'Taberna de noche (1).OGG'));
  assert.equal(rutaAudio(C, '/__audios/ñandú.flac'), path.join(C, 'ñandú.flac'));
});
test('audios: rechaza lo que se sale, no es audio o está oculto', () => {
  for (const p of ['/__audios/../secreto.mp3', '/__audios/%2e%2e%2fsecreto.mp3', '/__audios/sub/a.mp3', '/__audios/a.exe', '/__audios/a.mp3.exe', '/__audios/.oculto.mp3',
    '/__audios/a%5Cb.mp3', '/__audios/', '/otro/a.mp3', '/__audios/a.mp3%00.png', '/__audios/%E0%A4%A.mp3'])
    assert.equal(rutaAudio(C, p), null, p);
  assert.equal(rutaAudio('', '/__audios/a.mp3'), null);
  assert.equal(rutaAudio(C, 5), null);
});
test('audios: la lista solo trae archivos de audio, ordenados', () => {
  const d = mkdtempSync(path.join(os.tmpdir(), 'hdm-aud-'));
  try {
    for (const n of ['b.mp3', 'a.ogg', 'nota.txt', '.oculto.mp3', 'c.WAV']) writeFileSync(path.join(d, n), 'x');
    mkdirSync(path.join(d, 'carpeta.mp3'));
    assert.deepEqual(listar(d), ['a.ogg', 'b.mp3', 'c.WAV']);
    assert.deepEqual(listar(path.join(d, 'no-existe')), []);
    assert.deepEqual(listar(''), []);
  } finally { rmSync(d, { recursive: true, force: true }); }
});
