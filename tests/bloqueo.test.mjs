// Bloqueo de pantalla: PIN con huella y sal, validación, autobloqueo y esperas (index.html, bloque bloqueo-core).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PAGE} from './lib.mjs';

const window={};new Function('window',PAGE.match(/<script id="bloqueo-core">([\s\S]*?)<\/script>/)[1])(window);
const B=window.Bloqueo;

test('el PIN se valida: de 4 a 16 caracteres sin espacios',()=>{
  assert.ok(B.validar('1234'));assert.ok(B.validar('abcd-efgh-12345'));
  assert.ok(!B.validar('123'));assert.ok(!B.validar('12 34'));assert.ok(!B.validar('1'.repeat(17)));assert.ok(!B.validar(1234));assert.ok(!B.validar(null));
});
test('se guarda una huella con sal, no el PIN, y solo el PIN correcto la abre',async()=>{
  const r=await B.crear('4821');
  assert.ok(r.hash&&r.sal);assert.ok(!JSON.stringify(r).includes('4821'));
  assert.ok(await B.verificar('4821',r));assert.ok(!(await B.verificar('4822',r)));assert.ok(!(await B.verificar('',r)));
  const r2=await B.crear('4821');assert.notEqual(r.hash,r2.hash);   // la sal cambia la huella
  assert.equal(await B.crear('12'),null);
});
test('un registro roto o hostil nunca desbloquea',async()=>{
  for(const reg of [null,{},{sal:'zz',hash:'x'},{sal:'00',hash:'00',it:1e12},{sal:5,hash:6}])assert.equal(await B.verificar('1234',reg),false);
  assert.equal(await B.verificar('x'.repeat(100),await B.crear('1234')),false);
});
test('autobloqueo: solo con un tiempo válido y cuando ha pasado',()=>{
  const t0=1e6;
  assert.ok(!B.tocaBloquear(t0+999999,t0,0));assert.ok(!B.tocaBloquear(t0+999999,t0,7));
  assert.ok(!B.tocaBloquear(t0+59999,t0,1));assert.ok(B.tocaBloquear(t0+60000,t0,1));assert.ok(B.tocaBloquear(t0+3600000,t0,60));
});
test('tras varios fallos hay que esperar, y la espera crece con un tope',()=>{
  assert.deepEqual([1,2,3,4,5].map(B.espera),[0,0,5,10,20]);assert.equal(B.espera(50),300);
});
