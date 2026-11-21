// Copia de seguridad completa: formato, claves que viajan, validación al restaurar y volcado/restauración del almacén (index.html).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PAGE} from './lib.mjs';

const bloque=id=>PAGE.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)<\\/script>'))[1];
const nuevoCopia=()=>{const w={};new Function('window',bloque('copia-core'))(w);return w.Copia;};
// El almacén es el primer <script> sin id de la página: se prueba con un respaldo en memoria
function nuevoStore(inicial={}){
  const m=new Map(Object.entries(inicial)),w={__StoreBackend:{get:k=>m.has(k)?m.get(k):null,set:(k,v)=>m.set(k,v),remove:k=>m.delete(k),keys:()=>[...m.keys()]}};
  const src=PAGE.match(/<script>\s*\/\* Almacenamiento de datos de la app([\s\S]*?)<\/script>/)[0].replace(/^<script>/,'').replace(/<\/script>$/,'');
  new Function('window','localStorage',src)(w,{getItem:()=>null});
  return {Store:w.Store,m};
}
const Copia=nuevoCopia();

test('qué claves viajan en la copia y cuáles no',()=>{
  for(const k of ['fichas-v1','combat-party-v1','camp:c1abc:camp-notes-v1','combat-prefs-v1','camp-notes-v1'])assert.ok(Copia.claveOk(k),k);
  for(const k of ['sb-xyz-auth-token','bloqueo-v1','camp-sync-v1','camp:c1abc:camp-sync-v1','combat-campaigns-v1','__migrado_localstorage','__proto__','a b','','x'.repeat(200),5])assert.ok(!Copia.claveOk(k),String(k));
});
test('empaquetar y leer devuelven lo mismo y dejan fuera lo que no debe viajar',()=>{
  const t=Copia.empaquetar({'fichas-v1':'[1]','bloqueo-v1':'{"pin":1}','sb-a-auth-token':'secreto','camp-sync-v1':'{}','x':5},[{id:'local',nombre:'Mi campaña'},{id:'c1',nombre:'Faro'}],Date.UTC(2026,10,20),'v1.44');
  assert.ok(!t.includes('secreto')&&!t.includes('pin'));
  const r=Copia.leer(t);
  assert.ok(r.ok);assert.deepEqual(r.datos,{'fichas-v1':'[1]'});assert.equal(r.claves,1);assert.deepEqual(r.campanas.map(c=>c.id),['local','c1']);assert.equal(r.creada,Date.UTC(2026,10,20));
});
test('leer rechaza lo que no es una copia y filtra claves malas de una copia manipulada',()=>{
  for(const t of ['no json','{}','{"formato":"otra","v":1,"datos":{}}','{"formato":"herramientas-del-master/copia","v":2,"datos":{}}','{"formato":"herramientas-del-master/copia","v":1,"datos":[]}','null','5'])assert.equal(Copia.leer(t).ok,false,t);
  const r=Copia.leer(JSON.stringify({formato:'herramientas-del-master/copia',v:1,datos:{'fichas-v1':'ok','sb-token':'x','bloqueo-v1':'x','__proto__':'x',malo:5,'a/b':'x'},campanas:[{id:'../x'},{id:'c1',nombre:'A'}]}));
  assert.ok(r.ok);assert.deepEqual(Object.keys(r.datos),['fichas-v1']);assert.deepEqual(r.campanas.map(c=>c.id),['c1']);
});
test('el nombre del archivo lleva fecha, hora y etiqueta',()=>{
  const d=new Date(2026,10,20,9,5,3).getTime();
  assert.equal(Copia.nombre(d),'hdm-copia-2026-11-20_090503.json');assert.equal(Copia.nombre(d,'antes-de-restaurar'),'hdm-copia-2026-11-20_090503-antes-de-restaurar.json');
});
test('el almacén vuelca solo lo propio y de sus campañas',()=>{
  const {Store}=nuevoStore({'fichas-v1':'[1]','camp:ghost:camp-notes-v1':'x'});
  const id=Store.campaigns.create('Faro');Store.campaigns.select(id);Store.set('camp-notes-v1','{"v":1}');
  const d=Store.dump();
  assert.equal(d.datos['fichas-v1'],'[1]');assert.equal(d.datos['camp:'+id+':camp-notes-v1'],'{"v":1}');
  assert.ok(!('camp:ghost:camp-notes-v1' in d.datos));   // datos de una campaña que ya no existe
  assert.deepEqual(d.campanas.map(c=>c.nombre),['Mi campaña','Faro']);
});
test('restaurar en un dispositivo limpio recrea las campañas y sus datos',()=>{
  const origen=nuevoStore();const id=origen.Store.campaigns.create('Faro');origen.Store.campaigns.select(id);origen.Store.set('camp-notes-v1','{"v":1,"items":[]}');origen.Store.root.set('fichas-v1','[{"id":"a"}]');
  const t=Copia.empaquetar(origen.Store.dump().datos,origen.Store.dump().campanas,1,'v');
  const dest=nuevoStore();const r=Copia.leer(t);const n=dest.Store.restore(r.datos,r.campanas);
  assert.ok(n>=2);assert.deepEqual(dest.Store.campaigns.list().map(c=>c.nombre),['Mi campaña','Faro']);
  assert.equal(dest.Store.campaigns.active(),'local');   // no cambia la campaña activa
  assert.equal(dest.Store.root.get('fichas-v1'),'[{"id":"a"}]');
  dest.Store.campaigns.select(id);assert.equal(dest.Store.get('camp-notes-v1'),'{"v":1,"items":[]}');
});
test('restaurar no escribe en campañas que la copia no declara ni toca la sesión de cuenta',()=>{
  const {Store,m}=nuevoStore({'sb-a-auth-token':'mia'});
  Store.restore({'camp:zzz:camp-notes-v1':'x','sb-a-auth-token':'ajena','combat-campaigns-v1':'{}','fichas-v1':'[]',5:'x'},[]);assert.equal(m.get('sb-a-auth-token'),'mia');assert.ok(!m.has('combat-campaigns-v1')||m.get('combat-campaigns-v1')!=='{}');
  assert.ok(!m.has('camp:zzz:camp-notes-v1'));assert.equal(m.get('fichas-v1'),'[]');
  // lo que filtra Copia.leer protege el token; el almacén solo se fía de lo que ya pasó por ahí
  const r=Copia.leer(JSON.stringify({formato:'herramientas-del-master/copia',v:1,datos:{'sb-a-auth-token':'ajena','fichas-v1':'[]'}}));
  Store.restore(r.datos,r.campanas);assert.equal(m.get('sb-a-auth-token'),'mia');
});
