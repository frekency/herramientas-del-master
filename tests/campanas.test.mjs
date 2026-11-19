// Comprobaciones estáticas del esquema de campañas (supabase/campanas.sql), mismas reglas que schema.sql.
// El comportamiento real de los permisos se prueba aparte, ejecutando el SQL en PostgreSQL con roles de Supabase.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {read} from './lib.mjs';

const sql=read('supabase/campanas.sql');
const tables=[...sql.matchAll(/create table if not exists public\.(\w+)/g)].map(m=>m[1]);

test('campañas: todas las tablas tienen RLS',()=>{
  assert.deepEqual(tables.sort(),['campanas','datos_campana','enlaces_publicos','invitaciones_campana','miembros_campana']);
  for(const t of tables)assert.match(sql,new RegExp(`alter table public\\.${t} enable row level security`),`${t} sin RLS`);
});

test('campañas: las funciones security definer fijan search_path y no se abren a todo el mundo',()=>{
  const fns=[...sql.matchAll(/create or replace function public\.(\w+)\(([^)]*)\)[\s\S]*?\$\$;?/g)];
  assert.ok(fns.length>=8);
  for(const m of fns){
    if(/security definer/.test(m[0]))assert.match(m[0],/set search_path = ''/,`${m[1]} sin search_path`);
    // Las funciones llamables desde fuera quitan el permiso por defecto y lo dan solo a quien toca
    if(/security definer/.test(m[0]))assert.match(sql,new RegExp(`revoke all on function public\\.${m[1]}\\(`),`${m[1]} sin revoke`);
  }
});

test('campañas: las políticas no consultan miembros_campana directamente (recursión infinita)',()=>{
  const pol=[...sql.matchAll(/create policy[\s\S]*?;\n/g)].map(m=>m[0]);
  assert.ok(pol.length>=10);
  for(const p of pol)assert.ok(!/from public\.miembros_campana/.test(p),'una política consulta miembros_campana: usa es_miembro() o rol_en()');
});

test('campañas: ninguna tabla se abre a anon; el único acceso público es ver_enlace()',()=>{
  for(const m of sql.matchAll(/create policy[\s\S]*?;\n/g))assert.ok(!/to[^;]*\banon\b/.test(m[0]),'política abierta a anon');
  assert.match(sql,/grant execute on function public\.ver_enlace\(text\) to anon, authenticated/);
  const publicas=[...sql.matchAll(/grant execute on function public\.(\w+)\([^)]*\) to[^;]*\banon\b/g)].map(m=>m[1]);
  assert.deepEqual(publicas,['ver_enlace']);
});

test('campañas: límites de tamaño y de cantidad para que nadie llene la base de datos',()=>{
  assert.match(sql,/check \(octet_length\(valor::text\)/,'datos_campana sin límite de tamaño');
  assert.match(sql,/check \(octet_length\(contenido::text\)/,'enlaces_publicos sin límite de tamaño');
  for(const x of ['20 campañas','300 datos','50 enlaces'])assert.ok(sql.includes(x),`sin límite de ${x}`);
  assert.match(sql,/clave ~ '\^\[a-z0-9\]/,'datos_campana admite cualquier clave');
});

test('campañas: un jugador no puede cambiar rol ni abrirse permisos',()=>{
  assert.match(sql,/proteger_miembro[\s\S]*?new\.rol := old\.rol/);
  assert.match(sql,/proteger_dato_campana[\s\S]*?new\.editable_jugador := old\.editable_jugador/);
});
