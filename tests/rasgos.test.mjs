// Rasgos de clase del Manual del Jugador: cada rasgo, rasgo de subclase y opción es una entrada propia.
import {testM as test,MANUAL} from './manual.mjs';
import assert from 'node:assert/strict';

const COMP=MANUAL;

test('rasgos: cada clase tiene sus rasgos de clase y de subclase',()=>{
  const r=COMP.rasgos;
  assert.ok(r.length>=260,'salen '+r.length);
  for(const c of COMP.clases){
    const mios=r.filter(x=>x.cls===c.n&&!x.sub&&x.tipo==='Rasgo de clase');
    assert.ok(mios.length>=9,c.n+': '+mios.length);
    assert.ok(mios.every(x=>x.nv>=1&&x.nv<=20&&x.d.length>20),c.n);
    assert.ok(r.some(x=>x.cls===c.n&&x.tipo==='Rasgo de subclase'),c.n+' sin subclase');
  }
});

test('rasgos: nombres únicos, opciones y subclases',()=>{
  const r=COMP.rasgos;
  assert.equal(new Set(r.map(x=>x.n)).size,r.length,'nombres repetidos');
  const f=r.find(x=>x.base==='Ataque furtivo'&&x.cls==='Pícaro');
  assert.ok(f&&f.nv===1&&/dados|daño/i.test(f.d));
  assert.ok(r.some(x=>x.cls==='Brujo'&&x.tipo==='Opción de clase'&&x.nv===null));
  assert.ok(r.some(x=>x.cls==='Pícaro'&&x.sub==='Ladrón'&&x.base==='Manos rápidas'&&x.nv===3));
});
