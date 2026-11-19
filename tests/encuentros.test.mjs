// Planificación de encuentros (index.html, bloque enc-core): presupuesto de XP, veredicto y generador aleatorio.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PAGE} from './lib.mjs';

const window={};new Function('window',PAGE.match(/<script id="enc-core">([\s\S]*?)<\/script>/)[1])(window);
const E=window.Encuentros;
const POOL=[{n:'Goblin',xp:50,ty:'Humanoide'},{n:'Lobo',xp:50,ty:'Bestia'},{n:'Esqueleto',xp:50,ty:'No muerto'},{n:'Ogro',xp:450,ty:'Gigante'},{n:'Zombi',xp:100,ty:'No muerto'},
  {n:'Trol',xp:1800,ty:'Gigante'},{n:'Dragón joven',xp:5900,ty:'Dragón'},{n:'Rata',xp:10,ty:'Bestia'}];
const seq=(...v)=>{let i=0;return()=>v[i++%v.length];};
const azar=()=>{let s=7;return()=>(s=(s*16807)%2147483647)/2147483647;};

test('presupuesto: suma por personaje y nivel; el nivel se acota a 1–20',()=>{
  assert.deepEqual(E.presupuesto([1,1,1,1]),{bajo:200,moderado:300,alto:400});
  assert.deepEqual(E.presupuesto([5]),{bajo:500,moderado:750,alto:1100});
  assert.deepEqual(E.presupuesto([0,99,'x']),{bajo:50+6400+50,moderado:75+9000+75,alto:100+17000+100});
  assert.deepEqual(E.presupuesto([]),{bajo:0,moderado:0,alto:0});
  assert.deepEqual(E.presupuesto(null),{bajo:0,moderado:0,alto:0});
  assert.equal(E.PRES.length,20);
  for(const f of E.PRES)assert.ok(f[0]<f[1]&&f[1]<f[2]);
});

test('veredicto: los límites pertenecen a la dificultad inferior',()=>{
  const p=E.presupuesto([5,5,5,5]);                                 // 2000 / 3000 / 4400
  assert.equal(E.veredicto(0,p),'vacio');assert.equal(E.veredicto(1999,p),'trivial');
  assert.equal(E.veredicto(2000,p),'bajo');assert.equal(E.veredicto(3000,p),'moderado');
  assert.equal(E.veredicto(4400,p),'alto');assert.equal(E.veredicto(4401,p),'mortal');
  assert.equal(E.veredicto(100,E.presupuesto([])),'sin_grupo');
});

test('evaluar: total de XP con cantidades, a prueba de basura',()=>{
  assert.equal(E.total([{n:'a',xp:50,cant:4},{n:'b',xp:450,cant:1}]),650);
  assert.equal(E.total([{xp:'x',cant:2},{xp:10,cant:-3},null].filter(Boolean)),0);
  assert.equal(E.total(null),0);
  const r=E.evaluar([3,3,3,3],[{n:'Ogro',xp:450,cant:2}]);           // 900 de 600/900/1600
  assert.equal(r.veredicto,'moderado');assert.equal(r.pct,100);
});

test('generador: nunca supera el presupuesto y respeta el máximo',()=>{
  const rng=azar();
  for(const dificultad of ['bajo','moderado','alto'])for(const grupo of [[1],[3,3,4,4],[8,8,8,8,8],[15,15,15]])for(let i=0;i<40;i++){
    const r=E.generar(POOL,{grupo,dificultad,max:6,rng});
    const meta=E.presupuesto(grupo)[dificultad];
    assert.ok(r.xp<=meta,`${dificultad} ${grupo}: ${r.xp} > ${meta}`);
    assert.equal(r.xp,E.total(r.criaturas));
    assert.ok(r.criaturas.reduce((s,c)=>s+c.cant,0)<=6);
  }
});

test('generador: llena el presupuesto de forma razonable y es reproducible',()=>{
  const a=E.generar(POOL,{grupo:[5,5,5,5],dificultad:'moderado',rng:azar()}),b=E.generar(POOL,{grupo:[5,5,5,5],dificultad:'moderado',rng:azar()});
  assert.deepEqual(a,b);
  assert.ok(a.llena>=0.7,String(a.llena));assert.equal(a.meta,3000);
});

test('generador: filtra por tipo y respeta la variedad',()=>{
  for(let i=0;i<30;i++){
    const r=E.generar(POOL,{grupo:[4,4,4,4],dificultad:'alto',tipos:['no muerto'],rng:azar()});
    assert.ok(r.criaturas.length>0&&r.criaturas.every(c=>c.ty==='No muerto'));
  }
  for(let i=0;i<30;i++)assert.ok(E.generar(POOL,{grupo:[8,8,8,8],dificultad:'alto',variedad:2,max:20,rng:azar()}).criaturas.length<=2);
});

test('generador: conserva las criaturas bloqueadas y rellena el resto',()=>{
  const r=E.generar(POOL,{grupo:[5,5,5,5],dificultad:'moderado',bloqueadas:[{n:'Ogro',xp:450,ty:'Gigante',cant:2}],rng:azar()});
  assert.equal(r.criaturas.find(c=>c.n==='Ogro').cant>=2,true);assert.ok(r.xp<=3000);
  const demasiado=E.generar(POOL,{grupo:[1],dificultad:'bajo',bloqueadas:[{n:'Trol',xp:1800,cant:1}],rng:azar()});
  assert.equal(demasiado.criaturas.find(c=>c.n==='Trol'),undefined);   // lo que no cabe en el presupuesto no se fuerza
});

test('generador: casos límite sin explotar',()=>{
  assert.deepEqual(E.generar([],{grupo:[3]}).criaturas,[]);
  assert.deepEqual(E.generar(POOL,{grupo:[]}).criaturas,[]);
  assert.deepEqual(E.generar(null,null).criaturas,[]);
  assert.equal(E.generar(POOL,{grupo:[1],dificultad:'bajo',tipos:['dragón']}).criaturas.length,0);   // el dragón no cabe en un nivel 1
  assert.ok(E.generar(POOL,{grupo:[20,20,20,20],dificultad:'alto',max:9999,rng:seq(0.1,0.9,0.5)}).criaturas.reduce((s,c)=>s+c.cant,0)<=40);
  assert.ok(E.generar([{n:'Malo',xp:-5},{n:'',xp:5},{n:'Nada',xp:0}],{grupo:[5]}).criaturas.length===0);
});

test('xpDeVD y nivelDeTexto',()=>{
  assert.equal(E.xpDeVD('1/4'),50);assert.equal(E.xpDeVD(0.5),100);assert.equal(E.xpDeVD('10'),5900);assert.equal(E.xpDeVD('30'),155000);
  assert.equal(E.xpDeVD('x'),0);assert.equal(E.xpDeVD(null),0);assert.equal(E.xpDeVD('__proto__'),0);
  assert.equal(E.nivelDeTexto('Maga 5'),5);assert.equal(E.nivelDeTexto('Guerrero 12 '),12);
  assert.equal(E.nivelDeTexto('Maga'),0);assert.equal(E.nivelDeTexto('Maga 99'),0);assert.equal(E.nivelDeTexto(null),0);
});
