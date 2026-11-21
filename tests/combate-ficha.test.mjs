// La ficha en el combate: proyección a tarjeta de combate, PG, espacios y conjuros que vuelven a la ficha.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PAGE} from './lib.mjs';

const window={};new Function('window',PAGE.match(/<script id="ficha-core">([\s\S]*?)<\/script>/)[1])(window);
const F=window.Ficha;
const mago=(o={})=>F.norm({id:'m1',nombre:'Lyra',ca:12,car:{fue:8,des:14,con:14,int:16,sab:12,car:10},niveles:Array(5).fill({c:'mago',hp:4}),...o});
const brujo=(o={})=>F.norm({id:'b1',nombre:'Zed',car:{fue:8,des:12,con:14,int:10,sab:10,car:16},niveles:Array(3).fill({c:'brujo',hp:5}),...o});

test('comoCombatiente: PG, CA, iniciativa, salvaciones y conjuros de la ficha',()=>{
  const f=mago({temp:3,conjuros:['Bola de fuego','bola de fuego','Mano de mago']}),c=F.comoCombatiente(f);
  assert.equal(c.n,'Lyra');assert.equal(c.hp,F.hpMax(f));assert.equal(c.cur,f.hp);assert.equal(c.temp,3);assert.equal(c.ac,12);assert.equal(c.in,2);
  assert.deepEqual(c.sv,[-1,2,2,6,4,0]);                      // mago: salvaciones de Int y Sab con competencia +3
  assert.equal(c.pp,11);
  assert.equal(c.spc.ab,'Inteligencia');assert.equal(c.spc.dc,8+3+3);assert.equal(c.spc.atk,6);
  assert.deepEqual(c.spc.slots.slice(0,3),[4,3,2]);assert.deepEqual(c.spc.list,['Bola de fuego','Mano de mago']);   // sin repetidos
});

test('comoCombatiente: sin magia no hay bloque de conjuros; el pacto cuenta como espacios de su nivel',()=>{
  assert.equal(F.comoCombatiente(F.norm({niveles:[{c:'guerrero',hp:10}]})).spc,undefined);
  const c=F.comoCombatiente(brujo());assert.equal(c.spc.slots[1],2);assert.equal(c.spc.ab,'Carisma');
});

test('fijarPG: lo que pasa en combate vuelve a la ficha, acotado y sin anotación',()=>{
  const f=mago(),r=F.fijarPG(f,5,4).f;assert.equal(r.hp,5);assert.equal(r.temp,4);assert.equal(r.registro.length,f.registro.length);
  assert.equal(F.fijarPG(f,999,0).f.hp,F.hpMax(f));assert.equal(F.fijarPG(f,-5,0).f.hp,0);
});

test('fijarEspacios: las casillas del panel marcan cuántos hay gastados',()=>{
  let f=mago();f=F.fijarEspacios(f,1,3).f;assert.equal(f.slotsUsados[0],3);
  f=F.fijarEspacios(f,1,99).f;assert.equal(f.slotsUsados[0],4);f=F.fijarEspacios(f,1,0).f;assert.equal(f.slotsUsados[0],0);
  const b=F.fijarEspacios(brujo(),2,2).f;assert.equal(b.pactUsados,2);
});

test('lanzar: gasta del nivel del conjuro o del siguiente que tenga y avisa si no queda',()=>{
  let f=F.fijarEspacios(mago(),1,4).f;                          // sin espacios de nivel 1
  const r=F.lanzar(f,1);assert.ok(r.ok);assert.equal(r.nivel,2);assert.equal(r.f.slotsUsados[1],1);
  assert.equal(F.lanzar(f,3).nivel,3);assert.equal(F.lanzar(mago({niveles:[{c:'mago',hp:4}]}),3).error,'sin_espacio');
  const b=F.lanzar(brujo(),1);assert.equal(b.nivel,2);assert.equal(b.f.pactUsados,1);
});

test('conjuros: se añaden sin repetir y se quitan; el descanso largo devuelve los espacios',()=>{
  let f=F.conjuroAnadir(mago(),'  Escudo ').f;f=F.conjuroAnadir(f,'escudo').f;assert.deepEqual(f.conjuros,['Escudo']);
  assert.equal(F.conjuroAnadir(f,'  ').error,'vacio');assert.deepEqual(F.conjuroQuitar(f,'Escudo').f.conjuros,[]);
  const g=F.lanzar(f,1).f;assert.equal(F.descansoLargo(g).f.slotsUsados[0],0);
  assert.deepEqual(F.norm({conjuros:'no',niveles:[]}).conjuros,[]);
});
