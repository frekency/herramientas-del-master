// Número de versión coherente en todos los sitios.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {read,PAGE} from './lib.mjs';

const V=read('VERSION').trim(),[MA,MI]=V.split('.'),SHORT=`v${MA}.${MI}`;
test(`versión ${V} igual en VERSION, CHANGELOG.md, menú y changelog de la página`,()=>{
  assert.match(V,/^\d+\.\d+\.\d+$/);
  assert.equal(read('CHANGELOG.md').match(/^## \[(\d+\.\d+\.\d+)\]/m)?.[1],V,'CHANGELOG.md no empieza por esta versión');
  assert.match(PAGE,new RegExp(`class="navver"[^>]*>${SHORT.replace('.','\.')}<`),'versión del menú');
  assert.equal(PAGE.match(/<li><h3>(v\d+\.\d+(?:\.\d+)?) </)?.[1],SHORT,'primera entrada del changelog de la página');
});
