// Datos del Manual del Jugador (módulo privado, solo español): con los campos que usa la página.
import assert from 'node:assert/strict';
import {MANUAL as M,rawManual,testM} from './manual.mjs';

const fold=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const SCHOOLS=new Set(['abjuracion','adivinacion','conjuracion','encantamiento','evocacion','ilusionismo','nigromancia','transmutacion']);

testM('criaturas: con los campos básicos',()=>{
  assert.ok(M.criaturas.length>300,'faltan criaturas');
  for(const m of M.criaturas){
    assert.ok(m.n&&typeof m.n==='string',`sin nombre: ${JSON.stringify(m).slice(0,80)}`);
    assert.ok(Number.isFinite(+m.ac)&&Number.isFinite(+m.hp),`${m.n}: CA/PG`);
    assert.equal(m.ab?.length,6,`${m.n}: características`);
    for(const k of 'tabrl')for(const e of m[k]||[])assert.ok(Array.isArray(e)&&typeof e[1]==='string',`${m.n}: sección ${k}`);
  }
});

testM('conjuros: 391, con nombre inglés y sin repetir',()=>{
  assert.equal(M.conjuros.length,391);
  const seen=new Set();
  for(const x of M.conjuros){
    assert.ok(x.en&&typeof x.en==='string',`${x.n}: sin nombre inglés`);
    assert.ok(!seen.has(x.en),`${x.en} repetido`);seen.add(x.en);
    assert.ok(Number.isInteger(x.lv)&&x.lv>=0&&x.lv<=9,`${x.n}: nivel`);
    assert.ok(SCHOOLS.has(fold(x.sch)),`${x.n}: escuela «${x.sch}»`);
    for(const k of ['ct','rg','dur','comp'])assert.ok(x[k],`${x.n}: falta ${k}`);
    assert.ok(x.d&&x.d.length>20,`${x.n}: sin descripción`);
  }
});

testM('compendio: secciones con nombre en cada entrada',()=>{
  for(const k of ['objetos','dotes','clases','especies','trasfondos','reglas','rasgos'])assert.ok(Array.isArray(M[k])&&M[k].length>0,`falta ${k}`);
  for(const [k,v] of Object.entries(M))if(Array.isArray(v))for(const x of v)assert.ok(x.n&&typeof x.n==='string',`${k}: entrada sin nombre`);
  for(const o of M.objetos.filter(o=>o.k==='magico'))
    assert.ok(String(o.r).length<90,`${o.n}: la rareza lleva texto pegado («${o.r.slice(0,60)}…»)`);
});

testM('sin caracteres basura de la extracción (guion blando, carácter de sustitución)',()=>{
  const t=rawManual();
  assert.ok(!t.includes('­'),'guion blando');
  assert.ok(!t.includes('�'),'carácter de sustitución');
});

testM('objetos: peso numérico ≥ 0 y presente en armas, armaduras y equipo con peso',()=>{
  const o=M.objetos;
  for(const x of o)if('peso' in x)assert.ok(typeof x.peso==='number'&&Number.isFinite(x.peso)&&x.peso>=0&&x.peso<=9999,`${x.n}: peso ${x.peso}`);
  for(const x of o.filter(x=>x.k==='arma'||x.k==='armadura'))assert.ok('peso' in x,`${x.n}: sin peso`);
  const por=n=>o.find(x=>x.n===n);
  assert.equal(por('Bastón').peso,2);assert.equal(por('Mochila').peso,2.5);assert.equal(por('Poción de curación').peso,0.25);assert.equal(por('Antorcha').peso,0.5);
  assert.equal(por('Flecha').peso,0.025);assert.equal(por('Virote').peso,0.0375);
  assert.ok(o.filter(x=>x.k==='equipo'&&'peso' in x).length>=75,'equipo con peso');
  assert.ok(o.filter(x=>'peso' in x).length>=150);
});
