// Solo el DM crea campañas: la regla vive en la base de datos y la web solo esconde lo que no se podría usar.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {read,PAGE} from './lib.mjs';

const SQL=read('supabase/dm.sql');
test('dm.sql: la política de crear campañas exige ser DM y la marca no se escribe desde la web',()=>{
  assert.match(SQL,/create policy "crear las mias" on public\.campanas[\s\S]*?with check \(master_id = \(select auth\.uid\(\)\) and public\.es_dm\(\)\)/);
  assert.doesNotMatch(SQL,/grant\s+[^;]*(insert|update|delete)[^;]*on public\.dms/i);
  assert.match(SQL,/insert into public\.dms \(user_id\) select distinct master_id from public\.campanas/);   // los máster de ahora no pierden nada
  assert.match(SQL,/if not public\.es_dm\(\) then raise exception/);                                         // solo un DM da la marca
  assert.doesNotMatch(SQL,/@/,'ningún correo en un repositorio público');
});
test('la web comprueba la marca y esconde «Crear campaña» solo si sabe que no es DM',()=>{
  assert.match(PAGE,/from\('dms'\)\.select\('user_id'\)/);
  assert.match(PAGE,/cf\.hidden=SB_DM===false/);
  assert.match(PAGE,/if\(SB_DM===false\)\{toast\(T\('Solo un DM puede crear campañas/);
});
