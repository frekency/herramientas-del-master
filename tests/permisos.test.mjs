// Permisos por campo y cambios propuestos en los personajes de campaña (index.html, bloque ficha-core).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PAGE} from './lib.mjs';

const window={};new Function('window',PAGE.match(/<script id="ficha-core">([\s\S]*?)<\/script>/)[1])(window);
const F=window.Ficha;
const JUG={rol:'jugador',quien:'Ana',ahora:1000},DM={rol:'dm',quien:'Máster',ahora:2000};
const base=(o={})=>F.norm({id:'c1',nombre:'Lyra',origen:'campana',campana:'x',car:{fue:8,des:14,con:14,int:16,sab:10,car:10},niveles:[{c:'mago',hp:6}],...o});
// Lo que hace la hoja: la operación se calcula sobre la vista del jugador y el resultado pasa por los permisos.
const juega=(f,op,pol,via)=>F.cambiar(f,op(F.vista(f)).f,JUG,pol,via);

test('fuera de campaña y para el máster no hay permisos que valgan',()=>{
  const libre=F.norm({nombre:'Libre',niveles:[{c:'mago',hp:6}]});
  const r=F.cambiar(libre,F.invAnadir(libre,{n:'Cuerda'}).f,JUG,{inventario:'bloqueado'});assert.ok(r.ok);assert.equal(r.f.inventario.length,1);
  const c=base(),r2=F.cambiar(c,F.invAnadir(c,{n:'Cuerda'}).f,DM,{inventario:'bloqueado'});assert.equal(r2.f.inventario.length,1);assert.equal(r2.f.pendientes.length,0);
});

test('tabla por defecto: PG libre, inventario y oro por aprobación, nivel y características bloqueados',()=>{
  const P=F.POLITICAS_DEFECTO;
  assert.deepEqual([P.pg,P.gasto,P.texto,P.identidad],['libre','libre','libre','libre']);
  assert.deepEqual([P.inventario,P.monedas,P.conjuros,P.datos],['propuesta','propuesta','propuesta','propuesta']);
  assert.equal(P.progreso,'bloqueado');
});

test('libre: el jugador cambia sus PG y gasta espacios y queda en el registro',()=>{
  const f=base();
  const r=juega(f,g=>F.dano(g,3));assert.ok(r.ok);assert.deepEqual(r.aplicados,['hp']);assert.equal(r.f.hp,F.hpMax(f)-3);assert.equal(r.f.pendientes.length,0);
  const s=juega(r.f,g=>F.usarSlot(g,1));assert.equal(s.f.slotsUsados[0],1);
});

test('propuesta: el inventario y el oro quedan pendientes, la ficha aprobada no cambia y el jugador ve su cambio',()=>{
  const f=base(),r=juega(f,g=>F.invAnadir(g,{n:'Espada',q:1}));
  assert.ok(r.ok);assert.deepEqual(r.propuestos,['inventario']);assert.equal(r.f.inventario.length,0);assert.equal(r.f.pendientes.length,1);
  assert.equal(F.vista(r.f).inventario.length,1);                                   // lo que ve el jugador
  const o=juega(r.f,g=>F.editar(g,'mon.po',50,JUG));assert.deepEqual(o.propuestos,['mon']);assert.equal(F.vista(o.f).mon.po,50);assert.equal(o.f.mon.po,0);
  assert.equal(o.f.pendientes.length,2);
});

test('segunda propuesta sobre el mismo campo: sustituye a la anterior y el «antes» sigue siendo lo aprobado',()=>{
  let f=base();f=juega(f,g=>F.editar(g,'mon.po',50,JUG)).f;f=juega(f,g=>F.editar(g,'mon.po',80,JUG)).f;
  assert.equal(f.pendientes.length,1);const x=f.pendientes[0].partes[0];assert.equal(x.c,'mon');assert.equal(x.antes.po,0);assert.equal(x.despues.po,80);
});

test('bloqueado: el jugador no puede, y lo que ya estaba pendiente no se pierde',()=>{
  const f=base(),pol={inventario:'bloqueado'};
  const r=juega(f,g=>F.invAnadir(g,{n:'Espada'}),pol);assert.equal(r.ok,false);assert.equal(r.error,'bloqueado');assert.equal(r.campo,'inventario');
  assert.equal(F.conceder(F.vista(f),1,JUG).ok,false);                                // conceder subidas es del máster (la propia operación lo rechaza)
  const con=juega(f,g=>F.editar(g,'mon.po',5,JUG)).f,antes=JSON.stringify(con);juega(con,g=>F.invAnadir(g,{n:'Espada'}),pol);assert.equal(JSON.stringify(con),antes);   // un intento bloqueado no toca nada
  assert.equal(F.editar(f,'car.fue',18,JUG).error,'bloqueado');                      // las características de campaña solo cambian al subir
});

test('el máster puede abrir o cerrar cada grupo por campaña',()=>{
  const f=base();
  assert.equal(juega(f,g=>F.invAnadir(g,{n:'A'}),{inventario:'libre'}).f.inventario.length,1);
  assert.equal(juega(f,g=>F.dano(g,2),{pg:'propuesta'}).propuestos[0],'hp');
  assert.equal(juega(f,g=>F.dano(g,2),{pg:'bloqueado'}).ok,false);
  assert.deepEqual(F.normPoliticas({pg:'raro',inventario:'libre',x:'libre'}),{...F.POLITICAS_DEFECTO,inventario:'libre'});
});

test('subida de nivel: el jugador la propone aunque el nivel esté bloqueado, todo junto',()=>{
  const f=base({concedidas:1});
  const r=juega(f,g=>F.subir(g,{c:'mago',hp:4},{criterio:'hito'}),null,'subida');
  assert.ok(r.ok,r.error);assert.equal(F.nivel(r.f),1);assert.equal(F.nivel(F.vista(r.f)),2);
  assert.equal(r.f.pendientes.length,1);assert.ok(r.f.pendientes[0].partes.some(x=>x.c==='niveles'));
  const ok=F.resolver(r.f,r.f.pendientes[0].id,true,DM);assert.equal(F.nivel(ok.f),2);assert.equal(ok.f.pendientes.length,0);
  assert.equal(juega(f,g=>F.subir(g,{c:'mago',hp:4},{criterio:'hito'}),null,undefined).ok,false);   // sin «subida», el nivel está bloqueado
  assert.equal(juega(f,g=>F.subir(g,{c:'mago',hp:4},{criterio:'hito'}),{progreso:'libre'},'subida').f.niveles.length,2);
});

test('el máster acepta o rechaza; el jugador no puede ni puede retirar la de otro',()=>{
  let f=juega(base(),g=>F.invAnadir(g,{n:'Espada'})).f;const id=f.pendientes[0].id;
  assert.equal(F.resolver(f,id,true,JUG).error,'solo_dm');assert.equal(F.resolver(f,'nada',true,DM).error,'no_existe');
  const ac=F.resolver(f,id,true,DM).f;assert.equal(ac.inventario.length,1);assert.equal(ac.pendientes.length,0);assert.ok(ac.registro.some(r=>r.a==='aprobado'));
  const re=F.resolver(f,id,false,DM).f;assert.equal(re.inventario.length,0);assert.equal(re.pendientes.length,0);assert.ok(re.registro.some(r=>r.a==='rechazado'));
  const ret=F.retirar(f,id,JUG).f;assert.equal(ret.pendientes.length,0);
  f=juega(f,g=>F.editar(g,'mon.po',9,JUG)).f;const t=F.resolverTodos(f,true,DM).f;assert.equal(t.inventario.length,1);assert.equal(t.mon.po,9);assert.equal(t.pendientes.length,0);
});

test('inventario y monedas: cantidades, repetidos y límites',()=>{
  let f=F.invAnadir(base(),{n:' Poción ',q:2}).f;f=F.invAnadir(f,{n:'poción',q:3}).f;assert.equal(f.inventario.length,1);assert.equal(f.inventario[0].q,5);
  const id=f.inventario[0].id;assert.equal(F.invCantidad(f,id,1).f.inventario[0].q,1);assert.equal(F.invCantidad(f,id,0).f.inventario.length,0);
  assert.equal(F.invAnadir(f,{n:'  '}).error,'vacio');assert.equal(F.invQuitar(f,'zz').error,'no_existe');
  assert.equal(F.editar(base(),'mon.po',-5,DM).f.mon.po,0);assert.equal(F.editar(base(),'mon.xx',5,DM).ok,false);
});

test('las propuestas se sanean, no salen al exportar y una ficha libre no las tiene',()=>{
  const f=F.norm({...base(),pendientes:[{id:'a',partes:[{c:'inventario',antes:[],despues:[{n:'X',q:1}]},{c:'hackeo',antes:1,despues:2}]},{partes:[]},'x']});
  assert.equal(f.pendientes.length,1);assert.equal(f.pendientes[0].partes.length,1);
  const e=JSON.parse(F.exportar(f));assert.deepEqual(e.ficha.pendientes,[]);
  assert.deepEqual(F.norm({origen:'libre',pendientes:f.pendientes}).pendientes,[]);
  assert.deepEqual(F.aCampana(F.norm({nombre:'L'}),{campana:'c'}).pendientes,[]);
});
