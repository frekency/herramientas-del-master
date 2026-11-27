// Modelo jugadores / personajes / grupos (index.html: bloques grupos-core y ficha-core).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PAGE} from './lib.mjs';

const window={};
new Function('window',PAGE.match(/<script id="ficha-core">([\s\S]*?)<\/script>/)[1])(window);
new Function('window',PAGE.match(/<script id="grupos-core">([\s\S]*?)<\/script>/)[1])(window);
const F=window.Ficha,G=window.Grupos;
const lyra=(o={})=>F.norm({id:'base1',nombre:'Lyra',car:{fue:8,des:14,con:14,int:16,sab:10,car:10},niveles:[{c:'mago',hp:6}],...o});

test('copia de campaña: entidad nueva enlazada a la base, con progreso propio',()=>{
  const b=lyra(),c=F.aCampana(b,{campana:'c1',jugador:'m1',nombreCampana:'Strahd'});
  assert.notEqual(c.id,b.id);assert.equal(c.origen,'campana');assert.equal(c.base,'base1');assert.equal(c.campana,'c1');assert.equal(c.jugador,'m1');assert.equal(c.estado,'activo');
  const c2=F.dano(c,3).f;assert.equal(c2.hp,F.hpMax(c)-3);assert.equal(b.hp,F.hpMax(b));            // lo que le pasa a la copia no toca la base
  assert.equal(F.editar(b,'nombre','Lyra la Sabia').f.nombre,'Lyra la Sabia');assert.equal(c.nombre,'Lyra');  // ni al revés
});

test('una copia de una copia apunta a la base original',()=>{
  const c=F.aCampana(lyra(),{campana:'c1'}),d=F.aCampana(c,{campana:'c2'});
  assert.equal(d.base,'base1');assert.equal(d.campana,'c2');
});

test('estado: caído y retirado solo existen en campaña',()=>{
  const b=lyra(),c=F.aCampana(b,{campana:'c1'});
  assert.equal(F.cambiarEstado(b,'caido').error,'solo_campana');
  assert.equal(F.cambiarEstado(c,'muerto').error,'estado_invalido');
  const k=F.cambiarEstado(c,'caido').f;assert.equal(k.estado,'caido');assert.ok(k.registro.some(r=>r.a==='estado'));
  assert.equal(F.norm({...b,estado:'caido'}).estado,'activo');                                          // en un libre se ignora
});

test('sustituir: el viejo queda caído con su historial y el nuevo toma al jugador',()=>{
  const viejo=F.aCampana(lyra(),{campana:'c1',jugador:'m1'}),nuevo=F.aCampana(lyra({id:'base2',nombre:'Brun'}),{campana:'c1'});
  const r=F.sustituir([viejo,nuevo],viejo.id,nuevo.id,'caido');
  assert.ok(r.ok);const [v,n]=r.lista;
  assert.equal(v.estado,'caido');assert.equal(v.nombre,'Lyra');assert.equal(n.estado,'activo');assert.equal(n.jugador,'m1');
  assert.equal(F.sustituir([viejo],viejo.id,'zz','caido').error,'no_existe');
});

test('importar y exportar no se llevan lo de la campaña',()=>{
  const c=F.cambiarEstado(F.aCampana(lyra(),{campana:'c1',jugador:'m1'}),'caido').f;
  const r=F.importar(F.exportar(c));assert.ok(r.ok);
  assert.equal(r.f.origen,'libre');assert.equal(r.f.base,'');assert.equal(r.f.jugador,'');assert.equal(r.f.estado,'activo');
});

test('árbol global: cada base con sus copias; las copias sin original quedan huérfanas',()=>{
  const b1=lyra(),b2=lyra({id:'base2',nombre:'Brun'});
  const a=F.aCampana(b1,{campana:'c1'}),b=F.aCampana(b1,{campana:'c2'}),h=F.aCampana(lyra({id:'borrada'}),{campana:'c1'});
  const t=F.arbol([b1,b2],[{campana:'c1',nombre:'A',fichas:[a,h]},{campana:'c2',nombre:'B',fichas:[b]}]);
  assert.equal(t.nodos.find(n=>n.base.id==='base1').copias.length,2);assert.equal(t.nodos.find(n=>n.base.id==='base2').copias.length,0);
  assert.equal(t.huerfanas.length,1);assert.equal(t.huerfanas[0].f.id,h.id);
});

test('grupos: sincronizar migra el grupo único y siempre hay uno de jugadores',()=>{
  const l=G.sincronizar([],['p1','p2'],{p1:'Ana',p2:'Bea'});
  assert.equal(l.length,1);assert.equal(l[0].tipo,'jugadores');assert.deepEqual(l[0].miembros.map(m=>m.ref),['p1','p2']);assert.equal(l[0].miembros[0].n,'Ana');
  const m=G.sincronizar(l,['p2','p3'],{p3:'Cai'});                                                      // p1 se borró, p3 es nueva
  assert.deepEqual(m[0].miembros.map(x=>x.ref),['p2','p3']);
  assert.equal(G.sincronizar([{tipo:'rivales',n:'Orcos'}],[],{}).filter(g=>g.tipo==='jugadores').length,1);
});

test('grupos: una tarjeta de jugador no puede estar en dos grupos ni en uno que no es de jugadores',()=>{
  let l=G.sincronizar([],['p1'],{});const orcos=G.crear(l,{n:'Orcos',tipo:'rivales'});l=orcos.lista;
  assert.equal(G.agregar(l,orcos.g.id,{k:'jugador',ref:'p9'}).error,'jugador_en_grupo_no_jugador');
  assert.equal(G.agregar(l,l[0].id,{k:'jugador',ref:'p1'}).error,'ya_esta');
  assert.equal(G.mover(l,l[0].miembros[0].id,orcos.g.id).error,'jugador_en_grupo_no_jugador');
  const r=G.agregar(l,orcos.g.id,{k:'criatura',ref:'my:Orc',n:'Orco',cant:3});assert.ok(r.ok);assert.equal(r.m.cant,3);
  assert.equal(G.agregar(l,orcos.g.id,{k:'criatura',ref:''}).error,'miembro_invalido');
});

test('grupos: borrar protege al último de jugadores y a los grupos con jugadores',()=>{
  let l=G.sincronizar([],['p1'],{});
  assert.equal(G.borrar(l,l[0].id).error,'ultimo_jugadores');
  const o=G.crear(l,{n:'Aliados',tipo:'aliados'});l=o.lista;
  assert.ok(G.borrar(l,o.g.id).ok);
});

test('grupos: el jugador lleva un personaje y se sabe quién lleva cada uno',()=>{
  let l=G.sincronizar([],['p1'],{});const mid=l[0].miembros[0].id;
  l=G.asignarPj(l,mid,'ficha1').lista;
  assert.equal(G.dueno(l,'ficha1').m.id,mid);assert.equal(G.dueno(l,'otra'),null);
  assert.equal(G.asignarPj(l,'nada','x').error,'no_existe');
  assert.equal(G.asignarPj(l,mid,'').lista[0].miembros[0].pj,'');
});

test('grupos: sanea todo',()=>{
  const l=G.normLista([{id:'a b',n:'x'.repeat(200),tipo:'raro',color:'rojo',miembros:[null,{k:'dragon',ref:'x'},{k:'criatura',ref:'my:Orc',cant:999}]},{id:'g2'},'x']);
  assert.equal(l.length,2);assert.equal(l[0].n.length,40);assert.equal(l[0].tipo,'neutral');assert.equal(l[0].color,G.COLOR.neutral);
  assert.equal(l[0].miembros.length,1);assert.equal(l[0].miembros[0].cant,40);
  assert.match(l[0].id,/^g[a-z0-9]+$/);
});

test('grupos: aFilas pasa un grupo rival a filas de encuentro y avisa de lo que no se resuelve',()=>{
  let l=G.crear([],{n:'Bandidos',tipo:'rivales'});const gid=l.g.id;l=l.lista;
  for(const m of [{k:'criatura',ref:'my:Bandido',n:'Bandido',cant:4},{k:'pnj',ref:'n1',n:'Jefe'},{k:'pj',ref:'f9',n:'Renegado'}])l=G.agregar(l,gid,m).lista;
  const r=G.aFilas(l[0],m=>m.ref==='n1'?null:{tpl:m.k==='criatura'?m.ref:null,name:m.n,maxHp:11,ac:12});
  assert.equal(r.filas.length,2);assert.equal(r.filas[0].cant,4);assert.equal(r.filas[0].fname,'Bandidos');assert.equal(r.filas[1].pj,true);
  assert.equal(r.fallan.length,1);assert.equal(r.fallan[0].k,'pnj');
});

test('«Jugadores» no se acumula: id fijo al crearse y los repetidos se funden en uno',()=>{
  const a=G.sincronizar([],[],{}),b=G.sincronizar([],[],{});
  assert.equal(a[0].id,b[0].id);                                   // dos dispositivos vacíos crean el mismo grupo
  const dup=[{id:'x1',n:'Jugadores',tipo:'jugadores',miembros:[{k:'jugador',ref:'p1',n:'Ana'}]},{id:'x2',n:'Jugadores',tipo:'jugadores',miembros:[{k:'jugador',ref:'p2',n:'Luis'}]},{id:'x3',n:'Jugadores',tipo:'jugadores',miembros:[]},{id:'r1',n:'Rivales',tipo:'rivales',miembros:[]}];
  const l=G.sincronizar(dup,['p1','p2'],{p1:'Ana',p2:'Luis'});
  assert.equal(l.filter(g=>g.tipo==='jugadores').length,1);
  assert.equal(l.find(g=>g.tipo==='jugadores').miembros.length,2);  // nadie se pierde
  assert.ok(l.some(g=>g.id==='r1'));                               // los demás grupos no se tocan
  assert.deepEqual(G.sincronizar(l,['p1','p2'],{}).map(g=>g.id),l.map(g=>g.id));   // estable: sincronizar otra vez no cambia nada
});
