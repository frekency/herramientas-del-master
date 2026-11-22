// Cada entrada del compendio tiene su propia página (#compendio/<pestaña>/<slug>): sin nombres vacíos ni repetidos (uno taparía al otro).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PAGE} from './lib.mjs';

const fold=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const slug=n=>fold(n).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const leer=f=>JSON.parse(readFileSync(new URL('../datos/es/'+f,import.meta.url),'utf8'));
const rasgosDeClases=new Function('fold',PAGE.match(/function rasgosDeClases\(cl\)\{[\s\S]*?\n\}\n/)[0]+'return rasgosDeClases;')(fold);

function unico(nombre,lista){
  const vistos=new Map();
  for(const x of lista){
    const s=slug(x.n);
    assert.ok(s,nombre+': nombre sin letras ('+x.n+')');
    assert.ok(!vistos.has(s),nombre+': «'+x.n+'» y «'+vistos.get(s)+'» tendrían la misma página');
    vistos.set(s,x.n);
  }
}

test('páginas: el compendio del SRD no repite nombres dentro de cada pestaña',()=>{
  const c=leer('compendio.json');
  for(const k of Object.keys(c))unico(k,c[k]);
  unico('rasgos',rasgosDeClases(c.clases));
});

test('páginas: criaturas y conjuros del SRD tampoco',()=>{
  unico('criaturas',leer('bestiario.json'));
  unico('conjuros',leer('conjuros.json'));
});
