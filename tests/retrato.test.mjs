// Retrato de la ficha: token y retrato grande, con uno distinto por estado activo (furia, forma salvaje…).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PAGE} from './lib.mjs';

const window={};new Function('window',PAGE.match(/<script id="ficha-core">([\s\S]*?)<\/script>/)[1])(window);
const F=window.Ficha;
const base=(o={})=>F.norm({id:'a',nombre:'Surtr',car:{fue:16,des:12,con:14,int:8,sab:10,car:8},niveles:[{c:'barbaro',hp:12}],...o});
const IMG=t=>'data:image/webp;base64,'+t;

test('retrato: base, estado y vuelta al base',()=>{
  let f=base();
  assert.deepEqual(F.retratoActual(f),{tok:'',img:'',estado:''});
  f=F.retratoSet(f,'','tok',IMG('AAAA')).f;f=F.retratoSet(f,'','img',IMG('BBBB')).f;
  f=F.retratoSet(f,'furia','img',IMG('CCCC')).f;
  assert.equal(F.retratoActual(f).img,IMG('BBBB'));
  f=F.norm({...f,activos:{furia:true}});
  const a=F.retratoActual(f);
  assert.equal(a.img,IMG('CCCC'));assert.equal(a.tok,IMG('AAAA'));assert.equal(a.estado,'furia');   // el token cae al base
  f=F.retratoSet(f,'furia','img','').f;
  assert.equal(f.ret.est,undefined);assert.equal(F.retratoActual(f).img,IMG('BBBB'));
});
test('retrato: rechaza lo que no es imagen o es demasiado grande',()=>{
  const f=base();
  assert.equal(F.retratoSet(f,'','tok','javascript:alert(1)').ok,false);
  assert.equal(F.retratoSet(f,'','tok',IMG('A'.repeat(70000))).ok,false);
  assert.equal(F.retratoSet(f,'Furia!','tok',IMG('AAAA')).ok,false);
  assert.equal(F.retratoSet(f,'','otro',IMG('AAAA')).ok,false);
  assert.equal(base({ret:{tok:'<script>'}}).ret,undefined);
});
