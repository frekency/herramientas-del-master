import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { urlDeArgv, leerRetorno, esUrlDeAutorizacion } = createRequire(import.meta.url)('./auth.js');

test('el enlace de retorno se encuentra entre los argumentos de arranque', () => {
  assert.equal(urlDeArgv(['app.exe', '--flag', 'herramientasdelmaster://auth?code=abcdefgh1234']), 'herramientasdelmaster://auth?code=abcdefgh1234');
  assert.equal(urlDeArgv(['app.exe', 'HerramientasDelMaster://auth?code=abcdefgh1234']), 'HerramientasDelMaster://auth?code=abcdefgh1234');
  assert.equal(urlDeArgv(['app.exe', 'https://x.test']), '');
  assert.equal(urlDeArgv(null), '');
});

test('solo se acepta el retorno de auth con un código con forma de código o un error', () => {
  assert.deepEqual(leerRetorno('herramientasdelmaster://auth?code=abcdefgh-1234_ZZ'), { code: 'abcdefgh-1234_ZZ', error: '' });
  assert.deepEqual(leerRetorno('herramientasdelmaster://auth?error=access_denied&error_description=El+usuario+canceló'), { code: '', error: 'El usuario canceló' });
  for (const u of ['herramientasdelmaster://otra?code=abcdefgh1234', 'herramientasdelmaster://auth', 'herramientasdelmaster://auth?code=corto',
    'herramientasdelmaster://auth?code=<script>alert(1)</script>', 'https://auth?code=abcdefgh1234', 'javascript:alert(1)', '', null, 5])
    assert.equal(leerRetorno(u), null, String(u));
  assert.equal(leerRetorno('herramientasdelmaster://auth?code=' + 'a'.repeat(400)), null);
});

test('solo se abre fuera la dirección de autorización de Supabase', () => {
  assert.equal(esUrlDeAutorizacion('https://mjzolxysvxoauvaxuqcq.supabase.co/auth/v1/authorize?provider=discord'), true);
  for (const u of ['http://mjzolxysvxoauvaxuqcq.supabase.co/auth/v1/authorize', 'https://evil.test/auth/v1/authorize', 'https://mjzolxysvxoauvaxuqcq.supabase.co.evil.test/auth/v1/x',
    'https://mjzolxysvxoauvaxuqcq.supabase.co/rest/v1/x', 'file:///c:/windows/system32/calc.exe', 'javascript:alert(1)', '', null])
    assert.equal(esUrlDeAutorizacion(u), false, String(u));
});
