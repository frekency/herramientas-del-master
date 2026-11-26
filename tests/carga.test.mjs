// Carga e inventario con peso: capacidad, ubicación, sintonía y oro total (index.html, bloque ficha-core).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PAGE} from './lib.mjs';

const window={};new Function('window',PAGE.match(/<script id="ficha-core">([\s\S]*?)<\/script>/)[1])(window);
const F=window.Ficha;
const pj=(o={})=>F.norm({id:'c1',nombre:'Lyra',car:{fue:10,des:10,con:10,int:10,sab:10,car:10},...o});

test('norm: peso 0..9999 con 3 decimales y ub derivada de eq',()=>{
  const f=pj({inventario:[{n:'A',peso:1.23456},{n:'B',peso:-4,eq:true},{n:'C',peso:'x'},{n:'D',peso:99999},{n:'E',ub:'mochila',eq:true},{n:'F',ub:'equipado'}]});
  const [a,b,c,d,e,g]=f.inventario;
  assert.equal(a.peso,1.235);assert.equal(a.ub,'mochila');assert.equal(a.eq,false);
  assert.equal(b.peso,0);assert.equal(b.ub,'equipado');assert.equal(b.eq,true);
  assert.equal(c.peso,0);assert.equal(d.peso,9999);
  assert.equal(e.ub,'mochila');assert.equal(e.eq,false);assert.equal(g.eq,true);
});
test('invAnadir conserva el peso y al fusionar suma cantidad',()=>{
  let f=F.invAnadir(pj(),{n:'Cuerda',q:1,peso:2.5}).f;
  assert.equal(f.inventario[0].peso,2.5);
  f=F.invAnadir(f,{n:'cuerda',q:2}).f;
  assert.equal(f.inventario.length,1);assert.equal(f.inventario[0].q,3);assert.equal(f.inventario[0].peso,2.5);
  f=F.invAnadir(f,{n:'Daga',peso:0.5,ub:'equipado'}).f;
  assert.equal(f.inventario[1].ub,'equipado');assert.equal(f.inventario[1].eq,true);
});
test('invMarcar eq y invUbicar mantienen eq y ub a la par',()=>{
  let f=F.invAnadir(pj(),{n:'Escudo',peso:3}).f;const id=f.inventario[0].id;
  f=F.invMarcar(f,id,'eq',true).f;assert.equal(f.inventario[0].ub,'equipado');
  f=F.invUbicar(f,id,'mochila').f;assert.equal(f.inventario[0].eq,false);
  assert.equal(F.invUbicar(f,id,'raro').ok,false);
  assert.equal(F.invPeso(f,id,7).f.inventario[0].peso,7);
  assert.equal(F.norm(F.invUbicar(f,id,'equipado').f).inventario[0].ub,'equipado');
});
test('carga: capacidad FUE×7,5, equipado/mochila, monedas y niveles',()=>{
  const f=pj({car:{fue:10,des:10,con:10,int:10,sab:10,car:10},inventario:[{n:'Armadura',peso:20,eq:true},{n:'Raciones',q:5,peso:1},{n:'Gema'}],mon:{po:100,pc:50}});
  const c=F.carga(f);
  assert.equal(c.capacidad,75);assert.equal(c.equipado,20);assert.equal(c.mochila,5);assert.equal(c.monedas,1.5);
  assert.equal(c.total,26.5);assert.equal(c.pct,35);assert.equal(c.nivel,'normal');
  assert.equal(F.carga(f,{monedas:false}).total,25);
  assert.equal(F.carga(pj({inventario:[{n:'Roca',peso:100}]})).nivel,'cargado');
  assert.equal(F.carga(pj({inventario:[{n:'Roca',peso:200}]})).nivel,'maximo');
  assert.equal(F.carga(pj()).pct,0);
});
test('sintonia y oroTotal',()=>{
  const f=pj({inventario:[{n:'A',sin:true},{n:'B',sin:true},{n:'C'}],mon:{ppt:1,po:2,pe:2,pp:10,pc:100}});
  assert.deepEqual(F.sintonia(f),{usadas:2,max:3});
  assert.equal(F.oroTotal(f),15);
  assert.equal(F.oroTotal(pj()),0);
});
