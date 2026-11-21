// Lógica de campañas de Store (index.html): se ejecuta el bloque real contra un almacenamiento simulado.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PAGE} from './lib.mjs';

const BLOQUE=PAGE.match(/window\.Store=\(\(\)=>\{[\s\S]*?\}\)\(\);/)[0];

function nuevo(inicial={},backend){
  const datos=new Map(Object.entries(inicial));
  const localStorage={getItem:k=>datos.has(k)?datos.get(k):null,setItem:(k,v)=>datos.set(k,String(v)),removeItem:k=>datos.delete(k),
    get length(){return datos.size;},key:i=>[...datos.keys()][i]??null};
  const window={};if(backend)window.__StoreBackend=backend;
  new Function('window','localStorage',BLOQUE)(window,localStorage);
  return {Store:window.Store,datos};
}
const T='combat-tracker-v1',P='combat-party-v1',E='combat-presets-v1',B='combat-bestiary-v1';

test('sin campañas creadas, todo funciona como antes (clave «local» = claves de siempre)',()=>{
  const {Store,datos}=nuevo({[T]:'{"a":1}'});
  assert.equal(Store.campaigns.active(),'local');
  assert.equal(Store.get(T),'{"a":1}');
  Store.set(P,'[1]');assert.equal(datos.get(P),'[1]');
  assert.deepEqual(Store.campaigns.list().map(c=>c.id),['local']);
});

test('cada campaña tiene sus propios datos de mesa; el resto es común',()=>{
  const {Store,datos}=nuevo({[T]:'local',[B]:'bestiario'});
  const id=Store.campaigns.create('La Mina Perdida');Store.campaigns.select(id);
  assert.equal(Store.get(T),null,'la campaña nueva no hereda el combate de otra');
  Store.set(T,'mina');Store.set(P,'[2]');Store.set(E,'[3]');
  assert.equal(datos.get(`camp:${id}:${T}`),'mina');
  assert.equal(datos.get(T),'local','no pisa la campaña local');
  assert.equal(Store.get(B),'bestiario','el bestiario es común a todas');
  Store.set(B,'nuevo');Store.campaigns.select('local');assert.equal(Store.get(B),'nuevo');
  assert.equal(Store.get(T),'local');
});

test('Store.root ignora la campaña activa (la sincronización de cuenta trabaja sobre «local»)',()=>{
  const {Store}=nuevo({[T]:'local'});
  Store.campaigns.select(Store.campaigns.create('Otra'));
  assert.equal(Store.get(T),null);assert.equal(Store.root.get(T),'local');
  Store.root.set(T,'cambiado');Store.campaigns.select('local');assert.equal(Store.get(T),'cambiado');
});

test('la selección persiste al recargar la página',()=>{
  const a=nuevo();const id=a.Store.campaigns.create('Persistente');a.Store.campaigns.select(id);a.Store.set(T,'x');
  const b=nuevo(Object.fromEntries(a.datos));
  assert.equal(b.Store.campaigns.active(),id);assert.equal(b.Store.get(T),'x');
  assert.equal(b.Store.campaigns.activeName(),'Persistente');
});

test('borrar una campaña borra sus datos, no los de las demás; «local» no se puede borrar',()=>{
  const {Store,datos}=nuevo({[T]:'local'});
  const a=Store.campaigns.create('A'),b=Store.campaigns.create('B');
  Store.campaigns.select(a);Store.set(T,'a');Store.campaigns.select(b);Store.set(T,'b');
  assert.equal(Store.campaigns.remove(a),true);
  assert.ok(![...datos.keys()].some(k=>k.startsWith(`camp:${a}:`)),'quedan datos de A');
  assert.equal(datos.get(`camp:${b}:${T}`),'b');
  assert.equal(Store.campaigns.remove('local'),false);assert.equal(datos.get(T),'local');
  assert.equal(Store.campaigns.remove(b),true);       // era la activa
  assert.equal(Store.campaigns.active(),'local');assert.equal(Store.get(T),'local');
  assert.equal(Store.campaigns.remove('noexiste'),false);
});

test('nombres: se limpian, no pueden quedar vacíos y se pueden cambiar (también el de «local»)',()=>{
  const {Store}=nuevo();
  assert.throws(()=>Store.campaigns.create('   '));
  const id=Store.campaigns.create('  Muchos    espacios  ');
  assert.equal(Store.campaigns.list().find(c=>c.id===id).nombre,'Muchos espacios');
  assert.equal(Store.campaigns.create('x'.repeat(200)).length>0,true);
  assert.equal(Store.campaigns.list().at(-1).nombre.length,60);
  assert.equal(Store.campaigns.rename(id,''),false);assert.equal(Store.campaigns.rename(id,'Nuevo'),true);
  assert.equal(Store.campaigns.rename('local','Mi mesa'),true);
  assert.equal(Store.campaigns.list()[0].nombre,'Mi mesa');
  assert.equal(Store.campaigns.select('noexiste'),false);
});

test('límite de campañas',()=>{
  const {Store}=nuevo();
  for(let i=0;i<49;i++)Store.campaigns.create('c'+i);   // 49 + «local» = 50
  assert.throws(()=>Store.campaigns.create('una más'),/demasiadas/);
});

test('un índice de campañas dañado no rompe la página ni pierde los datos de «local»',()=>{
  for(const roto of ['{no es json','null','{"list":"x"}','{"active":"zzz","list":[{"id":"zzz","nombre":"Sin local"}]}']){
    const {Store}=nuevo({'combat-campaigns-v1':roto,[T]:'datos'});
    assert.equal(Store.campaigns.active(),'local',roto);assert.equal(Store.get(T),'datos',roto);
    assert.ok(Store.campaigns.list().some(c=>c.id==='local'));
  }
});

test('funciona con un backend distinto (el de escritorio con SQLite)',()=>{
  const m=new Map();
  const be={get:k=>m.has(k)?m.get(k):null,set:(k,v)=>void m.set(k,v),remove:k=>void m.delete(k),keys:()=>[...m.keys()]};
  const {Store}=nuevo({},be);
  const id=Store.campaigns.create('Escritorio');Store.campaigns.select(id);Store.set(T,'sqlite');
  assert.equal(m.get(`camp:${id}:${T}`),'sqlite');
  Store.campaigns.remove(id);assert.ok(![...m.keys()].some(k=>k.startsWith('camp:')));
});

test('Store.native usa el localStorage del navegador aunque haya otro backend',()=>{
  const be={get:()=>null,set(){},remove(){},keys:()=>[]};
  const {Store,datos}=nuevo({'sb-abc-auth-token':'jwt'},be);
  assert.equal(Store.native.get('sb-abc-auth-token'),'jwt');assert.equal(Store.get('sb-abc-auth-token'),null);
});

test('las claves por campaña son las de la mesa y las claves de Supabase son válidas',()=>{
  const scoped=BLOQUE.match(/SCOPED=new Set\(\[([^\]]*)\]\)/)[1].match(/combat-[\w-]+/g).sort();
  assert.deepEqual(scoped,[E,P,T].sort());
  // El formato camp:<id>:<clave> cabe en datos_campana (clave ~ ^[a-z0-9][a-z0-9._:-]{0,79}$)
  const {Store,datos}=nuevo();const id=Store.campaigns.create('x');Store.campaigns.select(id);Store.set(T,'1');
  const k=[...datos.keys()].find(x=>x.startsWith('camp:'));assert.match(k,/^camp:[a-z0-9]+:combat-[a-z-]+-v1$/);
});

test('el rol es de cada campaña: quien la crea es máster y puede ser jugador en otra',()=>{
  const {Store}=nuevo();
  const mia=Store.campaigns.create('La mía'),ajena=Store.campaigns.create('La de otro');
  assert.equal(Store.campaigns.rol('local'),'master');assert.equal(Store.campaigns.rol(mia),'master');   // por defecto, máster
  assert.equal(Store.campaigns.setRol(ajena,'jugador'),true);
  Store.campaigns.select(ajena);assert.equal(Store.campaigns.rol(),'jugador');
  Store.campaigns.select(mia);assert.equal(Store.campaigns.rol(),'master');                              // la misma persona, otro rol
  assert.equal(Store.campaigns.setRol(ajena,'admin'),false);assert.equal(Store.campaigns.setRol('nada','jugador'),false);
  assert.equal(Store.campaigns.setRol(ajena,'master'),true);assert.equal(Store.campaigns.rol(ajena),'master');
  assert.equal(Store.campaigns.rol('no-existe'),'master');
});
