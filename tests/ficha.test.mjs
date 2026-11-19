// Motor de ficha (index.html, bloque ficha-core): derivados, descansos, subida de nivel, bloqueos de campaña y exportación.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PAGE} from './lib.mjs';

const window={};new Function('window',PAGE.match(/<script id="ficha-core">([\s\S]*?)<\/script>/)[1])(window);
const F=window.Ficha;
const base=(o={})=>F.norm({id:'a',nombre:'Lyra',car:{fue:8,des:14,con:14,int:16,sab:10,car:10},niveles:[{c:'mago',hp:6}],...o});
const MEJ=[4,8,12,16,19];
const sube=(f,n,c='mago',camp=null)=>{for(let i=0;i<n;i++){const nc=F.nivelClase(f,c)+1;const r=F.subir(f,{c,mejora:MEJ.includes(nc)?{int:2}:undefined},camp);assert.ok(r.ok,r.error);f=r.f;}return f;};

test('derivados: modificador, competencia y PG máximos con Con retroactiva',()=>{
  let f=base();
  assert.equal(F.mod(14),2);assert.equal(F.mod(7),-2);
  assert.equal(F.prof(f),2);assert.equal(F.hpMax(f),8);
  f=sube(f,4);assert.equal(F.nivel(f),5);assert.equal(F.prof(f),3);
  const antes=F.hpMax(f);f=F.editar(f,'car.con',16).f;assert.equal(F.hpMax(f),antes+5);
});

test('norm: sanea y no confía en nada',()=>{
  assert.equal(F.norm(null),null);
  const f=F.norm({nombre:'x'.repeat(500),car:{fue:999,des:'a'},niveles:[{c:'hack',hp:5},{c:'mago',hp:99},{c:'mago',hp:99},null],hp:99999,temp:-4,origen:'otro'});
  assert.equal(f.nombre.length,80);assert.equal(f.car.fue,30);assert.equal(f.car.des,10);
  assert.deepEqual(f.niveles,[{c:'mago',hp:6},{c:'mago',hp:6}]);
  assert.equal(f.hp,F.hpMax(f));assert.equal(f.temp,0);assert.equal(f.origen,'libre');
});

test('espacios de conjuro: lanzador completo, medio y pacto',()=>{
  assert.deepEqual(F.espacios(sube(base(),4)).slots,[4,3,2,0,0,0,0,0,0]);
  const pal=F.norm({niveles:Array(5).fill({c:'paladin',hp:5})});assert.deepEqual(F.espacios(pal).slots,[4,2,0,0,0,0,0,0,0]);
  const bru=F.norm({niveles:Array(5).fill({c:'brujo',hp:5})});assert.deepEqual(F.espacios(bru).pact,{n:2,nivel:3});assert.equal(F.espacios(bru).nivelCaster,0);
  assert.equal(F.espacios(F.norm({niveles:Array(4).fill({c:'guerrero',hp:5})})).nivelCaster,0);
});

test('daño y curación: los temporales absorben primero, nunca pasa del máximo',()=>{
  let f=F.temporales(base(),5).f;f=F.dano(f,7).f;
  assert.equal(f.temp,0);assert.equal(f.hp,6);
  f=F.curar(f,100).f;assert.equal(f.hp,8);
  assert.equal(F.dano(f,999).f.hp,0);
});

test('espacios y recursos: se gastan y se acaban',()=>{
  let f=sube(base(),1);
  f=F.usarSlot(f,1).f;f=F.usarSlot(f,1).f;f=F.usarSlot(f,1).f;
  assert.equal(F.usarSlot(f,1).error,'sin_espacio');
  assert.equal(F.usarSlot(f,5).error,'sin_espacio');
  f=F.norm({...f,recursos:[{id:'r',n:'Recuperación arcana',max:1,rec:'largo'}]});
  f=F.usarRecurso(f,'r').f;assert.equal(F.usarRecurso(f,'r').error,'agotado');assert.equal(F.usarRecurso(f,'x').error,'no_existe');
});

test('descanso corto: gasta dados de golpe y recupera lo suyo',()=>{
  let f=sube(base(),2);f=F.dano(f,10).f;const hp=f.hp;
  const r=F.descansoCorto(f,[{c:'mago',v:4}]);assert.ok(r.ok);assert.equal(r.f.hp,hp+6);assert.equal(r.f.dgUsados.mago,1);
  assert.equal(F.descansoCorto(f,[{c:'mago',v:99}]).error,'dado_invalido');
  assert.equal(F.descansoCorto(f,[{c:'mago',v:1},{c:'mago',v:1},{c:'mago',v:1},{c:'mago',v:1}]).error,'sin_dados');
  assert.equal(F.descansoCorto(f,[{c:'barbaro',v:1}]).error,'sin_dados');
});

test('descanso largo: PG, mitad de dados, espacios, recursos y un nivel de agotamiento',()=>{
  let f=sube(base({recursos:[{id:'r',n:'R',max:2,uso:2,rec:'largo'}],agot:2}),3);
  f=F.usarSlot(f,1).f;f=F.dano(f,6).f;
  f=F.descansoCorto(f,[{c:'mago',v:3},{c:'mago',v:3},{c:'mago',v:3}]).f;
  assert.equal(f.dgUsados.mago,3);
  f=F.descansoLargo(f).f;
  assert.equal(f.hp,F.hpMax(f));assert.equal(f.dgUsados.mago,1);   // nivel 4: recupera 2 de 3
  assert.equal(f.slotsUsados[0],0);assert.equal(f.recursos[0].uso,0);assert.equal(f.agot,1);
});

test('subir de nivel: media, tirada, multiclase y mejoras obligatorias',()=>{
  let f=base();
  f=F.subir(f,{c:'mago'}).f;assert.equal(f.niveles[1].hp,4);
  f=F.subir(f,{c:'guerrero',hp:10}).f;assert.deepEqual(F.clases(f),{mago:2,guerrero:1});
  assert.equal(F.subir(f,{c:'guerrero',hp:11}).error,'hp_invalido');
  assert.equal(F.subir(f,{c:'nada'}).error,'clase_invalida');
  const g=sube(base(),2);
  assert.equal(F.subir(g,{c:'mago'}).error,'falta_mejora');
  assert.equal(F.subir(g,{c:'mago',mejora:{int:1}}).error,'mejora_invalida');
  assert.equal(F.subir(g,{c:'mago',mejora:{int:2,fue:1}}).error,'mejora_invalida');
  assert.equal(F.subir(g,{c:'mago',mejora:{hack:2}}).error,'mejora_invalida');
  assert.equal(F.subir(g,{c:'mago',mejora:{int:2}}).f.car.int,18);
  assert.deepEqual(F.subir(g,{c:'mago',mejora:{dote:'Alerta'}}).f.dotes,['Alerta']);
  assert.equal(F.subir(base(),{c:'mago',mejora:{int:2}}).error,'mejora_no_toca');
  const t=sube(F.norm({niveles:[{c:'mago',hp:6}],car:{int:19}}),2);
  assert.equal(F.subir(t,{c:'mago',mejora:{int:2}}).error,'tope_20');
  const gu=F.norm({niveles:Array(5).fill({c:'guerrero',hp:5})});
  assert.equal(F.subir(gu,{c:'guerrero'}).error,'falta_mejora');
});

test('campaña: el criterio de la campaña manda (hito o experiencia)',()=>{
  const c=base({origen:'campana',campana:'c1'});
  assert.equal(F.puedeSubir(c,{criterio:'hito'}).error,'sin_hito');
  assert.equal(F.conceder(c,1,{rol:'jugador'}).error,'solo_dm');
  const h=F.conceder(c,1,{rol:'dm'}).f;
  const s=F.subir(h,{c:'mago'},{criterio:'hito'});assert.ok(s.ok);assert.equal(s.f.concedidas,0);
  assert.equal(F.subir(s.f,{c:'mago'},{criterio:'hito'}).error,'sin_hito');
  assert.equal(F.puedeSubir(c,{criterio:'xp'}).error,'faltan_xp');
  const x=F.editar(c,'xp',300,{rol:'dm'}).f;assert.ok(F.subir(x,{c:'mago'},{criterio:'xp'}).ok);
  assert.equal(F.subir(F.norm({niveles:Array(20).fill({c:'mago',hp:6})}),{c:'mago'}).error,'nivel_maximo');
});

test('campaña: lo bloqueado no se toca a mano; en una ficha libre sí',()=>{
  const c=base({origen:'campana',campana:'c1'}),l=base();
  assert.equal(F.editar(c,'car.fue',20).error,'bloqueado');
  assert.equal(F.editar(c,'xp',999,{rol:'jugador'}).error,'solo_dm');
  assert.equal(F.editar(c,'niveles',[]).error,'bloqueado');
  assert.equal(F.editar(c,'hp',1).error,'bloqueado');
  assert.equal(F.bajar(c).error,'bloqueado');
  assert.equal(F.editar(c,'nombre','Otra').f.nombre,'Otra');
  assert.equal(F.editar(l,'car.fue',20).f.car.fue,20);
  assert.equal(F.bajar(sube(l,1)).f.niveles.length,1);
  assert.equal(F.editar(l,'__proto__',1).error,'bloqueado');
});

test('registro: cada cambio queda anotado, con tope',()=>{
  let f=base();for(let i=0;i<250;i++)f=F.curar(F.dano(f,1,{quien:'Ana',ahora:i}).f,1,{quien:'Ana',ahora:i}).f;
  assert.equal(f.registro.length,200);assert.equal(f.registro.at(-1).por,'Ana');
  assert.equal(base().registro.length,0);
});

test('no muta la ficha original',()=>{
  const f=base(),antes=JSON.stringify(f);F.dano(f,3);F.subir(f,{c:'mago'});F.descansoLargo(f);
  assert.equal(JSON.stringify(f),antes);
});

test('exportar: Markdown localizado y JSON que se puede importar',()=>{
  const f=sube(base({especie:'Elfo'}),2);
  const es=F.exportar(f,{formato:'md',idioma:'es'}),en=F.exportar(f,{formato:'md',idioma:'en'}),fr=F.exportar(f,{formato:'md',idioma:'fr'});
  assert.match(es,/\*\*Nivel:\*\* 3 · \*\*Clases:\*\* Mago 3/);assert.match(es,/FUE \| DES/);
  assert.match(en,/\*\*Level:\*\* 3 · \*\*Classes:\*\* Wizard 3/);assert.match(en,/STR \| DEX/);assert.match(fr,/Magicien 3/);
  assert.match(F.exportar(f,{formato:'md',idioma:'xx'}),/Nivel/);
  const j=F.exportar(f,{formato:'json',idioma:'de'});assert.equal(JSON.parse(j).idioma,'de');
  assert.equal(JSON.parse(j).ficha.registro.length,0);
  const r=F.importar(j);assert.ok(r.ok);assert.equal(r.f.nombre,'Lyra');assert.equal(F.nivel(r.f),3);
  assert.equal(F.importar('{').error,'json');assert.equal(F.importar('{"v":1}').error,'formato');
});

test('importar: lo importado nunca entra como ficha de campaña',()=>{
  const j=F.exportar(base({origen:'campana',campana:'c9'}),{formato:'json'});
  const r=F.importar(j).f;assert.equal(r.origen,'libre');assert.equal(r.campana,'');assert.notEqual(r.id,'a');
});
