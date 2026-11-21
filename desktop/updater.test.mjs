import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { config, modo, urlVersion } = createRequire(import.meta.url)('./updater.js');

test('sin repositorio real no se busca nada', () => {
  assert.equal(config({}), null);
  assert.equal(config({ build: { publish: [{ provider: 'github', owner: 'PENDIENTE', repo: 'PENDIENTE' }] } }), null);
  assert.equal(config({ build: { publish: [{ provider: 's3', owner: 'a', repo: 'b' }] } }), null);
  assert.equal(config({ build: { publish: [{ provider: 'github', owner: 'a/../b', repo: 'r' }] } }), null);
  assert.deepEqual(config({ build: { publish: [{ provider: 'github', owner: 'ana', repo: 'hdm' }] } }), { owner: 'ana', repo: 'hdm' });
});

test('modo: instalador de Windows actualiza solo; portable y Mac solo avisan; en desarrollo nada', () => {
  assert.equal(modo({ platform: 'win32', portable: false, empaquetada: true }), 'auto');
  assert.equal(modo({ platform: 'win32', portable: true, empaquetada: true }), 'aviso');
  assert.equal(modo({ platform: 'darwin', portable: false, empaquetada: true }), 'aviso');
  assert.equal(modo({ platform: 'win32', portable: false, empaquetada: false }), 'ninguno');
});

test('el enlace de la versión solo lleva versiones con forma de versión', () => {
  const c = { owner: 'ana', repo: 'hdm' };
  assert.equal(urlVersion(c, '1.45.0'), 'https://github.com/ana/hdm/releases/tag/v1.45.0');
  assert.equal(urlVersion(c, '../../x'), 'https://github.com/ana/hdm/releases/latest');
  assert.equal(urlVersion(c, undefined), 'https://github.com/ana/hdm/releases/latest');
});
