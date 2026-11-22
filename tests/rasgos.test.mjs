// Rasgos de clase del compendio: cada rasgo, rasgo de subclase y opción sale como entrada propia, sacado del texto de las clases.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PAGE} from './lib.mjs';

const src=PAGE.match(/function rasgosDeClases\(cl\)\{[\s\S]*?\n\}\n/)[0];
const fold=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const rasgosDeClases=new Function('fold',src+'return rasgosDeClases;')(fold);
const COMP=JSON.parse(readFileSync(new URL('../datos/es/compendio.json',import.meta.url),'utf8'));

test('rasgos: cada fila de la tabla de rasgos de cada clase tiene su entrada',()=>{
  const r=rasgosDeClases(COMP.clases);
  assert.ok(r.length>=260,'salen '+r.length);
  for(const c of COMP.clases){
    const mios=r.filter(x=>x.cls===c.n&&!x.sub&&x.tipo==='Rasgo de clase');
    assert.ok(mios.length>=9,c.n+': '+mios.length);
    assert.ok(mios.every(x=>x.nv>=1&&x.nv<=20&&x.d.length>20),c.n);
    assert.ok(r.some(x=>x.cls===c.n&&x.tipo==='Rasgo de subclase'),c.n+' sin subclase');
  }
});

test('rasgos: nombres únicos, opciones y subclases',()=>{
  const r=rasgosDeClases(COMP.clases);
  assert.equal(new Set(r.map(x=>x.n)).size,r.length,'nombres repetidos');
  const f=r.find(x=>x.base==='Ataque furtivo'&&x.cls==='Pícaro');
  assert.ok(f&&f.nv===1&&/dados|daño/i.test(f.d));
  assert.ok(r.some(x=>x.cls==='Brujo'&&x.tipo==='Opción de clase'&&x.nv===null));
  assert.ok(r.some(x=>x.cls==='Pícaro'&&x.sub==='Ladrón'&&x.base==='Manos rápidas'&&x.nv===3));
});

test('rasgos: datos raros no rompen',()=>{
  assert.deepEqual(rasgosDeClases(null),[]);
  assert.deepEqual(rasgosDeClases([{n:'X',d:5},{n:'Y'}]),[]);
});
