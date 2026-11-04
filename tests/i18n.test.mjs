// Traducciones de la interfaz y número de versión: todos los idiomas iguales y la versión coherente en todos los sitios.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {json,read,exists,PAGE,UI_LANGS} from './lib.mjs';

const DICT=Object.fromEntries(UI_LANGS.map(l=>[l,json(`i18n/${l}.json`)]));

test('los cinco diccionarios tienen las mismas claves y ningún valor vacío',()=>{
  const keys=new Set(Object.keys(DICT.en));
  for(const l of UI_LANGS){
    const k=new Set(Object.keys(DICT[l]));
    const missing=[...keys].filter(x=>!k.has(x)),extra=[...k].filter(x=>!keys.has(x));
    assert.deepEqual(missing,[],`${l}: faltan claves`);
    assert.deepEqual(extra,[],`${l}: claves que no están en en.json`);
    for(const [a,b] of Object.entries(DICT[l]))assert.ok(typeof b==='string'&&b.trim(),`${l}: «${a}» vacío`);
  }
});

test('los textos que la página pasa a T(\'…\') están traducidos',()=>{
  // Como T(): los números se buscan como «#» y las secuencias \n del código son saltos de línea
  const lits=[...new Set([...PAGE.matchAll(/\bT\('((?:[^'\\]|\\.)+)'\)/g)].map(m=>m[1].replace(/\\'/g,"'").replace(/\\n/g,'\n')))];
  const miss=lits.filter(s=>/[a-zñáéíóú]/i.test(s)&&!(s.trim() in DICT.en)&&!(s.trim().replace(/\d+/g,'#') in DICT.en));
  assert.deepEqual(miss,[],'textos sin traducir en en.json');
});

const V=read('VERSION').trim(),[MA,MI]=V.split('.'),SHORT=`v${MA}.${MI}`;
test(`versión ${V} igual en VERSION, CHANGELOG.md, menú y changelogs`,()=>{
  assert.match(V,/^\d+\.\d+\.\d+$/);
  assert.equal(read('CHANGELOG.md').match(/^## \[(\d+\.\d+\.\d+)\]/m)?.[1],V,'CHANGELOG.md no empieza por esta versión');
  assert.match(PAGE,new RegExp(`class="navver"[^>]*>${SHORT.replace('.','\\.')}<`),'versión del menú');
  assert.equal(PAGE.match(/<li><h3>(v\d+\.\d+(?:\.\d+)?) </)?.[1],SHORT,'primera entrada del changelog de la página');
  for(const l of UI_LANGS){
    const f=`i18n/changelog.${l}.html`;assert.ok(exists(f),`falta ${f}`);
    assert.ok(read(f).includes(SHORT),`${f} no tiene ${SHORT}`);
  }
});
