// Rasgos de clase y subclase por nivel: Ficha.rasgosNivel los copia a f.rasgos con su texto, sin duplicar y enlazando el recurso de clase.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PAGE} from './lib.mjs';

const window={};new Function('window',PAGE.match(/<script id="ficha-core">([\s\S]*?)<\/script>/)[1])(window);
const F=window.Ficha;
const D=JSON.parse(readFileSync(new URL('../datos/es/compendio.json',import.meta.url),'utf8'));
const fold=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
const rasgosDeClases=new Function('fold',PAGE.match(/function rasgosDeClases[\s\S]*?\r?\n}\r?\n/)[0]+';return rasgosDeClases;')(fold);
const textos=rasgosDeClases(D.clases);
const datos=Object.fromEntries(D.clases.map(x=>[fold(x.n),x]));
const ficha=(c,n,extra={})=>F.norm({id:'a',nombre:'X',car:{fue:10,des:10,con:12,int:10,sab:10,car:16},niveles:Array.from({length:n},()=>({c,hp:6})),...extra});
const nombres=f=>f.rasgos.map(r=>r.n);

test('Bardo 3 del Colegio del conocimiento: rasgos de clase hasta el 3 y de subclase hasta el 3, con texto',()=>{
  const f=F.rasgosNivel(ficha('bardo',3,{subclase:'Colegio del conocimiento'}),datos,textos),n=nombres(f).map(fold);
  for(const x of ['inspiracion bardica','lanzamiento de conjuros','aprendiz de mucho','pericia','subclase de bardo'])assert.ok(n.includes(x),x+' en '+n);
  assert.ok(f.rasgos.find(r=>fold(r.n)==='pericia').txt.length>20);
  assert.ok(f.rasgos.every(r=>r.txt.length<=2000&&!/</.test(r.txt)));
  const sub=textos.filter(x=>x.tipo==='Rasgo de subclase'&&fold(x.sub)==='colegio del conocimiento'&&x.nv<=3).map(x=>fold(x.base));
  assert.ok(sub.length>0);for(const s of sub)assert.ok(n.includes(s),s);
  assert.ok(!n.includes('inspiracion superior'),'no trae rasgos de niveles futuros');
});
test('enlaza el recurso que ya creó el motor de clase',()=>{
  const f=F.rasgosNivel(ficha('bardo',3),datos,textos),r=f.rasgos.find(x=>fold(x.n)==='inspiracion bardica');
  assert.ok(r&&r.r);assert.equal(f.recursos.find(q=>q.id===r.r).a,'bardo:inspiracion');
  assert.equal(f.rasgos.find(x=>fold(x.n)==='pericia').r,'');
});
test('sin subclase no hay rasgos de subclase; no duplica ni toca los que ya hay',()=>{
  const base=ficha('barbaro',2,{rasgos:[{n:'Furia',txt:'mía',r:''}]});
  const a=F.rasgosNivel(base,datos,textos);
  assert.equal(a.rasgos.filter(r=>fold(r.n)==='furia').length,1);assert.equal(a.rasgos[0].txt,'mía');
  const b=F.rasgosNivel(a,datos,textos);assert.deepEqual(nombres(b),nombres(a));
});
test('subir de nivel añade solo los nuevos',()=>{
  const f2=F.rasgosNivel(ficha('guerrero',1),datos,textos),r=F.subir(f2,{c:'guerrero',hp:5},null,{rol:'dm'});
  assert.ok(r.ok);const f3=F.rasgosNivel(r.f,datos,textos);
  assert.ok(f3.rasgos.length>f2.rasgos.length);assert.ok(f2.rasgos.every(x=>f3.rasgos.some(y=>y.n===x.n&&y.id===x.id)));
});
test('sin datos de clase devuelve la ficha igual; el tope sube a 120',()=>{
  assert.deepEqual(nombres(F.rasgosNivel(ficha('bardo',3),{},textos)),[]);
  const f=F.norm({rasgos:Array.from({length:130},(_,i)=>({n:'r'+i}))});assert.equal(f.rasgos.length,120);
});
test('nivel 20 de cada clase cabe en el tope',()=>{
  for(const c of Object.keys(F.CLASES)){const f=F.rasgosNivel(ficha(c,20),datos,textos);assert.ok(f.rasgos.length>5&&f.rasgos.length<=120,c+' '+f.rasgos.length);}
});
test('casi todos los rasgos de la tabla de clase traen su texto',()=>{
  let vacios=[],tot=0;
  for(const c of Object.keys(F.CLASES)){const f=F.rasgosNivel(ficha(c,20),datos,textos);tot+=f.rasgos.length;vacios.push(...f.rasgos.filter(r=>!r.txt).map(r=>c+':'+r.n));}
  console.log('sin texto',vacios.length,'de',tot,vacios.slice(0,15).join(' | '));
  assert.ok(vacios.length<tot*0.15);
});
