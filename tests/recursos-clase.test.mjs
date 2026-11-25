// Recursos de clase parametrizados: salen de x.prog y x.recursos del compendio, sin código por clase.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PAGE} from './lib.mjs';

const window={};new Function('window',PAGE.match(/<script id="ficha-core">([\s\S]*?)<\/script>/)[1])(window);
const F=window.Ficha;
const D=JSON.parse(readFileSync(new URL('../datos/es/compendio.json',import.meta.url),'utf8'));
const fold=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const datos=Object.fromEntries(D.clases.map(x=>[fold(x.n),x]));
const ficha=(c,n,car={})=>F.norm({id:'a',nombre:'T',car:{fue:10,des:10,con:10,int:10,sab:10,car:10,...car},niveles:Array.from({length:n},()=>({c,hp:6}))});
const rec=(f,k)=>f.recursos.find(r=>r.a===k);

test('Bárbaro: la furia sale de la tabla y se recupera 1 en corto y todas en largo',()=>{
  let f=F.sincRecursos(ficha('barbaro',1),datos);
  assert.deepEqual([rec(f,'barbaro:furia').max,rec(f,'barbaro:furia').rec,rec(f,'barbaro:furia').cor],[2,'largo',1]);
  f=F.sincRecursos(ficha('barbaro',17),datos);assert.equal(rec(f,'barbaro:furia').max,6);
  f.recursos[0].uso=4;
  const c=F.descansoCorto(f,[]);assert.equal(rec(c.f,'barbaro:furia').uso,3);
  const l=F.descansoLargo(f);assert.equal(rec(l.f,'barbaro:furia').uso,0);
});

test('Druida: Forma salvaje desde el nivel 2; Bardo: inspiración = mod. de Carisma y recarga corta desde el 5',()=>{
  assert.equal(rec(F.sincRecursos(ficha('druida',1),datos),'druida:forma_salvaje'),undefined);
  assert.equal(rec(F.sincRecursos(ficha('druida',2),datos),'druida:forma_salvaje').max,2);
  assert.equal(rec(F.sincRecursos(ficha('druida',6),datos),'druida:forma_salvaje').max,3);
  const b4=rec(F.sincRecursos(ficha('bardo',4,{car:16}),datos),'bardo:inspiracion'),b5=rec(F.sincRecursos(ficha('bardo',5,{car:16}),datos),'bardo:inspiracion');
  assert.deepEqual([b4.max,b4.rec],[3,'largo']);assert.deepEqual([b5.max,b5.rec],[3,'corto']);
  assert.equal(rec(F.sincRecursos(ficha('bardo',1,{car:8}),datos),'bardo:inspiracion').max,1);
});

test('Guerrero y Paladín: escalones por nivel y reservas por nivel',()=>{
  const g=n=>F.sincRecursos(ficha('guerrero',n),datos);
  assert.equal(rec(g(1),'guerrero:accion_subita'),undefined);
  assert.equal(rec(g(2),'guerrero:accion_subita').max,1);assert.equal(rec(g(17),'guerrero:accion_subita').max,2);
  assert.equal(rec(g(13),'guerrero:indomito').max,2);assert.equal(rec(g(9),'guerrero:tomar_aliento').max,3);assert.equal(rec(g(10),'guerrero:tomar_aliento').max,4);
  const p=F.sincRecursos(ficha('paladin',6),datos);
  assert.equal(rec(p,'paladin:imponer_manos').max,30);assert.equal(rec(p,'paladin:canalizar').max,2);
});

test('subir de nivel ajusta el máximo y conserva lo gastado; un recurso manual igual se adopta; quitar la clase los retira',()=>{
  let f=ficha('barbaro',2);f=F.nuevoRecurso(f,{n:'Furia',max:1,rec:'largo'}).f;
  f=F.sincRecursos(f,datos);assert.equal(f.recursos.length,1);assert.equal(f.recursos[0].a,'barbaro:furia');
  f.recursos[0].uso=1;f.niveles.push({c:'barbaro',hp:7});
  const g=F.sincRecursos(f,datos);assert.deepEqual([rec(g,'barbaro:furia').max,rec(g,'barbaro:furia').uso],[3,1]);
  const manual=F.nuevoRecurso(g,{n:'Ki del abuelo',max:2,rec:''}).f;
  const sin=F.sincRecursos({...manual,niveles:[{c:'mago',hp:6}]},datos);
  assert.deepEqual(sin.recursos.map(r=>r.n),['Ki del abuelo','Recuperación arcana']);
});

test('sin datos de la clase no toca nada; es idempotente',()=>{
  const f=ficha('barbaro',3);assert.deepEqual(F.sincRecursos(f,{}).recursos,[]);
  const a=F.sincRecursos(f,datos),b=F.sincRecursos(a,datos);assert.deepEqual(a.recursos,b.recursos);
});

test('cada recurso declarado apunta a una columna que existe y da usos válidos en los 20 niveles',()=>{
  for(const [k,x] of Object.entries(datos))for(let n=1;n<=20;n++){
    const f=ficha(k,n,{car:14});
    for(const r of F.recursosClase(f,datos)){assert.ok(r.max>=1&&r.max<=99,`${k} nv ${n} ${r.n} max ${r.max}`);assert.ok(['corto','largo'].includes(r.rec));}
  }
});
