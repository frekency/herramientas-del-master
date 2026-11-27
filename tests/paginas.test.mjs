// Cada entrada del compendio tiene su propia página (#compendio/<pestaña>/<slug>): sin nombres vacíos ni repetidos (uno taparía al otro).
import assert from 'node:assert/strict';
import {MANUAL as M,testM} from './manual.mjs';

const fold=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const slug=n=>fold(n).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

function unico(nombre,lista){
  const vistos=new Map();
  for(const x of lista){
    const s=slug(x.n);
    assert.ok(s,nombre+': nombre sin letras ('+x.n+')');
    assert.ok(!vistos.has(s),nombre+': «'+x.n+'» y «'+vistos.get(s)+'» tendrían la misma página');
    vistos.set(s,x.n);
  }
}

testM('páginas: el compendio no repite nombres dentro de cada pestaña',()=>{
  for(const k of ['objetos','dotes','clases','especies','trasfondos','reglas','rasgos'])unico(k,M[k]);
});

testM('páginas: criaturas y conjuros tampoco',()=>{
  unico('criaturas',M.criaturas);
  unico('conjuros',M.conjuros);
});
