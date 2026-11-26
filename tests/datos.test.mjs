// Datos del SRD (solo español): con los campos que usa la página.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {json,read,DATA_LANGS,BEST} from './lib.mjs';

const SCHOOLS=new Set(['abjuracion','adivinacion','conjuracion','encantamiento','evocacion','ilusionismo','nigromancia','transmutacion']);

for(const l of DATA_LANGS){
  test(`criaturas ${l}: con los campos básicos`,()=>{
    const b=json(BEST[l]);
    assert.ok(b.length>300,'faltan criaturas');
    for(const m of b){
      assert.ok(m.n&&typeof m.n==='string',`sin nombre: ${JSON.stringify(m).slice(0,80)}`);
      assert.ok(Number.isFinite(+m.ac)&&Number.isFinite(+m.hp),`${m.n}: CA/PG`);
      assert.equal(m.ab?.length,6,`${m.n}: características`);
      for(const k of 'tabrl')for(const e of m[k]||[])assert.ok(Array.isArray(e)&&typeof e[1]==='string',`${m.n}: sección ${k}`);
    }
  });
  test(`conjuros ${l}: 339, todos con nombre inglés único`,()=>{
    const s=json(`datos/${l}/conjuros.json`);
    assert.equal(s.length,339);
    const seen=new Set();
    for(const x of s){
      assert.ok(x.en&&typeof x.en==='string',`${x.n}: sin nombre inglés`);
      assert.ok(!seen.has(x.en),`${x.en} repetido`);seen.add(x.en);
      assert.ok(Number.isInteger(x.lv)&&x.lv>=0&&x.lv<=9,`${x.n}: nivel`);
      assert.ok(SCHOOLS.has(x.sch),`${x.n}: escuela «${x.sch}»`);
      for(const k of ['ct','rg','dur','comp'])assert.ok(x[k],`${x.n}: falta ${k}`);
      assert.ok(x.d&&x.d.length>20,`${x.n}: sin descripción`);
    }
  });
  test(`compendio ${l}: secciones con nombre en cada entrada`,()=>{
    const c=json(`datos/${l}/compendio.json`);
    for(const k of ['objetos'])assert.ok(Array.isArray(c[k])&&c[k].length>0,`falta ${k}`);
    for(const [k,v] of Object.entries(c))if(Array.isArray(v))for(const x of v)assert.ok(x.n&&typeof x.n==='string',`${k}: entrada sin nombre`);
    for(const o of c.objetos.filter(o=>o.k==='magico'))
      assert.ok(String(o.r).length<90,`${o.n}: la rareza lleva texto pegado («${o.r.slice(0,60)}…»)`);
  });
}

test('sin caracteres basura de la extracción del PDF (guion blando, carácter de sustitución)',()=>{
  const files=DATA_LANGS.flatMap(l=>[`datos/${l}/bestiario.json`,`datos/${l}/conjuros.json`,`datos/${l}/compendio.json`]);
  for(const f of files){const t=read(f);
    assert.ok(!t.includes('­'),`${f}: guion blando`);
    assert.ok(!t.includes('�'),`${f}: carácter de sustitución`);}
});

test('compendio: peso numérico ≥ 0 y presente en armas, armaduras, herramientas y equipo con peso (tools/build_pesos.py)',()=>{
  const o=json('datos/es/compendio.json').objetos;
  for(const x of o)if('peso' in x)assert.ok(typeof x.peso==='number'&&Number.isFinite(x.peso)&&x.peso>=0&&x.peso<=9999,`${x.n}: peso ${x.peso}`);
  for(const x of o.filter(x=>x.k==='arma'||x.k==='armadura'))assert.ok('peso' in x,`${x.n}: sin peso`);
  const por=n=>o.find(x=>x.n===n);
  assert.equal(por('Bastón').peso,2);assert.equal(por('Mochila').peso,2.5);assert.equal(por('Poción de curación').peso,0.25);assert.equal(por('Antorcha').peso,0.5);
  assert.ok(o.filter(x=>x.k==='equipo'&&'peso' in x).length>=75,'equipo con peso');
  assert.ok(o.filter(x=>'peso' in x).length>=150);
});
