import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const { buscar, normalizar, licenciaTexto, guardarClave, tieneClave, leerClaves, urlOk } = createRequire(import.meta.url)('./sonidos-web.js');

const resp = (datos, status = 200) => ({ ok: status < 400, status, json: async () => datos });

test('sonidos: textos de licencia legibles', () => {
  assert.equal(licenciaTexto('http://creativecommons.org/publicdomain/zero/1.0/'), 'CC0');
  assert.equal(licenciaTexto('https://creativecommons.org/licenses/by-nc/4.0/'), 'CC BY-NC 4.0');
  assert.equal(licenciaTexto('http://creativecommons.org/licenses/by/3.0/'), 'CC BY 3.0');
  assert.equal(licenciaTexto(''), '');
});

test('sonidos: solo se aceptan enlaces https de los dominios de cada servicio', () => {
  assert.ok(urlOk('https://cdn.freesound.org/previews/1/1_1-hq.mp3', 'freesound'));
  assert.equal(urlOk('http://cdn.freesound.org/a.mp3', 'freesound'), '');
  assert.equal(urlOk('https://evil.com/a.mp3', 'freesound'), '');
  assert.equal(urlOk('https://freesound.org.evil.com/a.mp3', 'freesound'), '');
  assert.equal(urlOk('https://cdn.freesound.org/a.mp3', 'jamendo'), '');
  assert.ok(urlOk('https://prod-1.storage.jamendo.com/?trackid=1&format=mp32', 'jamendo'));
});

test('freesound: pide con la clave en la cabecera, solo CC0 por defecto, y normaliza lo que vuelve', async () => {
  let pedido;
  const f = async (u, o) => { pedido = { u, o }; return resp({ results: [
    { id: 7, name: 'Lluvia fuerte', username: 'ana', license: 'http://creativecommons.org/publicdomain/zero/1.0/', duration: 61.4, url: 'https://freesound.org/s/7/', previews: { 'preview-hq-mp3': 'https://cdn.freesound.org/previews/7/7_1-hq.mp3' }, otro: 'x' },
    { id: 8, name: 'Con enlace malo', previews: { 'preview-hq-mp3': 'https://evil.com/a.mp3' } },
    null, { id: 9, name: 'Sin previa' }] }); };
  const r = await buscar('freesound', 'lluvia', 'ABCDEF123456', {}, f);
  assert.equal(r.ok, true);
  assert.equal(r.res.length, 1);
  assert.deepEqual(r.res[0], { id: '7', n: 'Lluvia fuerte', autor: 'ana', licencia: 'CC0', dur: 61, url: 'https://cdn.freesound.org/previews/7/7_1-hq.mp3', pagina: 'https://freesound.org/s/7/' });
  assert.match(pedido.u, /^https:\/\/freesound\.org\/apiv2\/search\/text\/\?/);
  assert.equal(pedido.o.headers.authorization, 'Token ABCDEF123456');
  assert.ok(!pedido.u.includes('ABCDEF123456'), 'la clave no va en la dirección');
  assert.match(new URL(pedido.u).searchParams.get('filter'), /license:"Creative Commons 0"/);
  await buscar('freesound', 'lluvia', 'ABCDEF123456', { soloCC0: false }, f);
  assert.ok(!new URL(pedido.u).searchParams.get('filter').includes('Creative Commons 0'));
});

test('jamendo: pide con su client_id y normaliza pistas con su licencia', async () => {
  let u0;
  const f = async u => { u0 = u; return resp({ headers: { status: 'success' }, results: [
    { id: '5', name: 'Bosque', artist_name: 'Lia', duration: 180, audio: 'https://prod-1.storage.jamendo.com/?trackid=5&format=mp32', license_ccurl: 'https://creativecommons.org/licenses/by-nc-sa/3.0/', shareurl: 'https://www.jamendo.com/track/5' },
    { id: '6', name: 'Malo', audio: 'http://x.com/a.mp3' }] }); };
  const r = await buscar('jamendo', 'bosque', 'abc12345', {}, f);
  assert.equal(r.res.length, 1);
  assert.deepEqual([r.res[0].autor, r.res[0].licencia, r.res[0].dur], ['Lia', 'CC BY-NC-SA 3.0', 180]);
  assert.match(u0, /client_id=abc12345/);
});

test('sonidos: errores claros sin lanzar nunca', async () => {
  const ok = async () => resp({ results: [] });
  assert.equal((await buscar('raro', 'lluvia', 'ABCDEF123456', {}, ok)).error, 'servicio');
  assert.equal((await buscar('freesound', 'a', 'ABCDEF123456', {}, ok)).error, 'consulta');
  assert.equal((await buscar('freesound', 'lluvia', '', {}, ok)).error, 'clave');
  assert.equal((await buscar('freesound', 'lluvia', 'mala clave!', {}, ok)).error, 'clave');
  assert.equal((await buscar('freesound', 'lluvia', 'ABCDEF123456', {}, async () => resp({}, 401))).error, 'clave');
  assert.equal((await buscar('freesound', 'lluvia', 'ABCDEF123456', {}, async () => resp({}, 429))).error, 'limite');
  assert.equal((await buscar('freesound', 'lluvia', 'ABCDEF123456', {}, async () => resp({}, 500))).error, 'servicio');
  assert.equal((await buscar('freesound', 'lluvia', 'ABCDEF123456', {}, async () => { throw new Error('sin red'); })).error, 'red');
  assert.equal((await buscar('jamendo', 'bosque', 'abc12345', {}, async () => resp({ headers: { status: 'failed', error_message: 'Invalid client_id' } }))).error, 'clave');
  assert.deepEqual(normalizar('freesound', { results: 'x' }), []);
  assert.equal(normalizar('freesound', { results: Array.from({ length: 50 }, (_, i) => ({ id: i, name: 'n', previews: { 'preview-hq-mp3': 'https://cdn.freesound.org/a.mp3' } })) }).length, 20);
});

test('sonidos: las claves se guardan validadas y se pueden borrar', () => {
  const d = mkdtempSync(path.join(os.tmpdir(), 'hdm-clv-')), f = path.join(d, 'claves.json');
  try {
    assert.equal(tieneClave(f, 'freesound'), false);
    guardarClave(f, 'freesound', '  AbCdEf123456  ');
    assert.equal(tieneClave(f, 'freesound'), true);
    assert.equal(tieneClave(f, 'jamendo'), false);
    assert.throws(() => guardarClave(f, 'freesound', 'con espacios o <b>'), /clave/);
    assert.throws(() => guardarClave(f, 'otro', 'ABCDEF123456'), /servicio/);
    assert.equal(leerClaves(f).freesound, 'AbCdEf123456');
    guardarClave(f, 'freesound', '');
    assert.equal(tieneClave(f, 'freesound'), false);
    assert.ok(!readFileSync(f, 'utf8').includes('AbCdEf'));
  } finally { rmSync(d, { recursive: true, force: true }); }
});
