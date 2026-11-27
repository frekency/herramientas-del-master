// Importar personajes exportados de Roliando (dnd-sheet v1) con el JSON real de un druida de nivel 3.
import {testM as test,MANUAL} from './manual.mjs';
import assert from 'node:assert/strict';
import {PAGE,read,json} from './lib.mjs';

const window={};new Function('window',PAGE.match(/<script id="ficha-core">([\s\S]*?)<\/script>/)[1])(window);
const F=window.Ficha;
const SP=Object.fromEntries(MANUAL.conjuros.map(s=>[s.en.toLowerCase(),{n:s.n,lv:s.lv}]));
const res=n=>SP[n.toLowerCase()]||null;
const TXT=read('tests/fixtures/roliando-rhiavel.json');

test('Rhiavel de Roliando se importa con sus datos',()=>{
  const r=F.desdeRoliando(TXT,res);assert.ok(r.ok);const f=r.f;
  assert.equal(f.nombre,'Rhiavel');assert.equal(f.origen,'libre');
  assert.deepEqual(f.niveles.map(n=>n.c),['druida','druida','druida']);
  assert.equal(f.subclase,'Círculo de la Luna');assert.equal(f.especie,'Elfo del Bosque');assert.equal(f.trasfondo,'Guía');
  assert.deepEqual(f.car,{fue:8,des:12,con:16,int:13,sab:16,car:10});
  assert.equal(F.hpMax?F.hpMax(f):0,F.hpMax?27:0);
  assert.equal(f.hp,24);assert.equal(f.xp,300);assert.equal(f.ca,13);assert.equal(f.vel,'10,5 m');
  assert.deepEqual(f.salvac.sort(),['int','sab']);
  assert.equal(f.habil.animales,1);assert.equal(f.habil.naturaleza,1);assert.equal(f.habil.percepcion,1);
  assert.equal(f.slotsUsados[0],1);
  assert.equal(f.pers.alineamiento,'Neutral');
  assert.equal(f.mon.po,140);assert.equal(f.mon.pp,62);
  assert.ok(f.inventario.some(i=>i.n==='Escudo'));
  assert.ok(f.conjuros.includes('Cuchillo de hielo')&&f.conjuros.includes('Curar heridas')&&f.conjuros.includes('Guía'));
  assert.ok(f.magia.prep.includes('Fuego feérico')&&!f.magia.prep.includes('Guía'));
  assert.equal(f.magia.hab,'sab');
  assert.ok(f.dotes.length===1);
  assert.ok(r.avisos.some(a=>/formas salvajes/.test(a))&&r.avisos.some(a=>/monturas/.test(a)));
});

test('un archivo que no es de Roliando o está roto se rechaza',()=>{
  for(const t of ['no json','{}','{"kind":"dnd-sheet"}','{"kind":"dnd-sheet","sheet":{"name":"X","classes":[]}}','null'])assert.equal(F.desdeRoliando(t,res).ok,false,t);
  assert.equal(F.desdeRoliando({kind:'dnd-sheet',sheet:{name:'X',classes:[{class:'00_Fighter_XPHB',level:2}]}},res).ok,true);
});
