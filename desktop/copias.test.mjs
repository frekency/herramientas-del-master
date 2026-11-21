import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const { escribir, nombre, leerConfig, guardarConfig, PATRON } = createRequire(import.meta.url)('./copias.js');

const COPIA = JSON.stringify({ formato: 'herramientas-del-master/copia', v: 1, datos: {} });
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'hdm-copias-'));

test('el nombre de la copia lleva fecha y hora y cumple el patrón', () => {
  const n = nombre(new Date(2026, 10, 20, 9, 5, 3).getTime());
  assert.match(n, PATRON);
  assert.equal(n, 'hdm-copia-2026-11-20_090503.json');
});

test('escribe la copia en la carpeta elegida y no deja archivos temporales', () => {
  const d = tmp();
  const r = escribir(d, COPIA, Date.UTC(2026, 10, 20, 12));
  assert.equal(r.ok, true);
  assert.equal(fs.readFileSync(r.ruta, 'utf8'), COPIA);
  assert.deepEqual(fs.readdirSync(d), [r.archivo]);
});

test('rechaza lo que no es una copia, lo vacío y las carpetas que no existen', () => {
  const d = tmp();
  assert.equal(escribir(d, 'hola', 1).error, 'formato');
  assert.equal(escribir(d, '', 1).error, 'texto');
  assert.equal(escribir(d, 5, 1).error, 'texto');
  assert.equal(escribir(path.join(d, 'no-existe'), COPIA, 1).error, 'sin_carpeta');
  assert.equal(escribir('', COPIA, 1).error, 'sin_carpeta');
  assert.deepEqual(fs.readdirSync(d), []);
});

test('conserva las últimas copias y no toca archivos que no son suyos', () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, 'mis-apuntes.json'), 'importante');
  fs.writeFileSync(path.join(d, 'hdm-copia-notas.json'), 'importante también');
  for (let i = 0; i < 5; i++) escribir(d, COPIA, new Date(2026, 10, 20, 12, 0, i).getTime(), 3);
  const propias = fs.readdirSync(d).filter(f => PATRON.test(f)).sort();
  assert.equal(propias.length, 3);
  assert.equal(propias[0], nombre(new Date(2026, 10, 20, 12, 0, 2).getTime()));   // se quedan las 3 más nuevas
  assert.equal(fs.readFileSync(path.join(d, 'mis-apuntes.json'), 'utf8'), 'importante');
  assert.equal(fs.readFileSync(path.join(d, 'hdm-copia-notas.json'), 'utf8'), 'importante también');
});

test('la carpeta elegida se recuerda y un archivo roto no da error', () => {
  const d = tmp(), f = path.join(d, 'sub', 'copias.json');
  assert.deepEqual(leerConfig(f), {});
  guardarConfig(f, { carpeta: '/x/y' });
  assert.deepEqual(leerConfig(f), { carpeta: '/x/y' });
  fs.writeFileSync(f, '{roto');
  assert.deepEqual(leerConfig(f), {});
});
