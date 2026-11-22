// Cuentas de jugador creadas por el DM: función segura en Supabase, entrada con usuario y cambio obligatorio de contraseña.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {read,PAGE} from './lib.mjs';

const FN=read('supabase/functions/crear-jugador/index.ts');
test('la función exige sesión y marca DM antes de crear nada, y la campaña tiene que ser del DM',()=>{
  const iDm=FN.indexOf("rpc('es_dm')"),iCrea=FN.indexOf('createUser');
  assert.ok(iDm>0&&iCrea>iDm,'comprueba es_dm antes de crear el usuario');
  assert.match(FN,/if \(esDm !== true\) return json\(\{ error: '[^']+' \}, 403\)/);
  assert.match(FN,/\.eq\('master_id', u\.user\.id\)/);
  assert.match(FN,/cambiar_pass: true/);
  assert.match(FN,/\^\[A-Za-z0-9_\.-\]\{3,24\}\$/);
  assert.doesNotMatch(FN,/SERVICE_ROLE_KEY['"]?\)?\s*[,;]?\s*\n?.*Authorization/,'la clave de servicio no se usa como cabecera del llamante');
});
test('la web deja entrar con usuario y obliga a cambiar la contraseña provisional',()=>{
  const dom=FN.match(/DOMINIO = '([^']+)'/)[1];
  assert.ok(PAGE.includes(`JUG_DOMINIO='${dom}'`),'mismo dominio inventado en la web y en la función');
  assert.match(PAGE,/signInWithPassword\(\{email:acCorreo\(/);
  assert.match(PAGE,/const acBloqueado=\(\)=>acDebeCambiar\(\)\|\|/);
  assert.match(PAGE,/\{password:pw,data:\{cambiar_pass:false\}\}/);
  assert.match(PAGE,/SB\.functions\.invoke\('crear-jugador'/);
});
