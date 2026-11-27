// Rasgos y elecciones de especie (linaje gigante, legado infernal, ancestro dracónico…): salen de los datos del compendio
// (x.rs y x.el, generados por tools/especies-elecciones.mjs) y la ficha los aplica sin saber nada de cada especie.
import {testM as test,MANUAL} from './manual.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PAGE} from './lib.mjs';

const window={};new Function('window',PAGE.match(/<script id="ficha-core">([\s\S]*?)<\/script>/)[1])(window);
const F=window.Ficha;
const leer=f=>JSON.parse(readFileSync(new URL(f,import.meta.url),'utf8'));
const D=MANUAL,CONJ=MANUAL.conjuros;
const esp=n=>D.especies.find(e=>e.n===n);
const ficha=(e,n=1,extra={})=>F.norm({id:'a',nombre:'T',especie:e,car:{fue:10,des:10,con:14,int:10,sab:10,car:10},niveles:Array.from({length:n},()=>({c:'guerrero',hp:10})),...extra});
const rec=(f,n)=>f.recursos.find(r=>r.n===n);
// la elección se hace en el creador: queda en f.lin.v y la hoja la aplica con sincEspecie (una vez por nivel y elección)
const elige=(f,e,id,v)=>{const el=esp(e).el.find(x=>x.id===id);assert.ok(el,e+': no existe '+id);assert.ok(!el.req||f.lin.v[el.req],e+' '+id+': pide antes '+el.req);
  assert.ok(!Array.isArray(el.ops)||el.ops.some(o=>o.v===v),e+' '+id+': opción '+v+' inexistente');const g=JSON.parse(JSON.stringify(f));g.lin.v[id]=v;return F.sincEspecie(F.norm(g),esp(e));};
const sync=(f,e)=>F.sincEspecie(f,esp(e));

test('datos: todas las especies traen sus rasgos y las opciones son coherentes',()=>{
  const tipos=new Set(['Ácido','Contundente','Cortante','Frío','Fuego','Necrótico','Perforante','Psíquico','Radiante','Relámpago','Trueno','Veneno','Fuerza']);
  const nombres=new Set(CONJ.map(c=>c.n));
  for(const e of D.especies){
    assert.ok(Array.isArray(e.rs)&&e.rs.length,e.n+': sin rasgos');
    for(const r of e.rs){assert.ok(r.n&&r.d&&r.d.length>15,e.n+': rasgo sin texto '+r.n);assert.ok(!/<[^>]+>/.test(r.d),'sin HTML en '+r.n);}
    const ids=new Set();
    for(const el of e.el||[]){
      assert.ok(!ids.has(el.id),e.n+': elección repetida '+el.id);ids.add(el.id);
      if(el.req)assert.ok((e.el||[]).some(x=>x.id===el.req),e.n+': '+el.id+' depende de algo que no existe');
      if(Array.isArray(el.ops)){assert.equal(new Set(el.ops.map(o=>o.v)).size,el.ops.length,e.n+': opciones repetidas en '+el.id);assert.ok(el.ops.length>=2);}
      else assert.equal(el.ops,'dotes-origen');
      for(const o of Array.isArray(el.ops)?el.ops:[]){
        for(const t of o.res||[])assert.ok(tipos.has(t),e.n+': tipo de daño desconocido '+t);
        for(const [c] of o.cj||[])assert.ok(nombres.has(c),e.n+': el conjuro «'+c+'» no existe en el compendio');
        for(const q of o.rec||[])assert.ok(q.max==='pb'||Number.isInteger(q.max),e.n+': usos raros en '+o.n);
      }
    }
    for(const r of e.rs){for(const t of r.res||[])assert.ok(tipos.has(t));for(const [c] of r.cj||[])assert.ok(nombres.has(c),e.n+': el conjuro «'+c+'» no existe');}
  }
  assert.equal(esp('Goliat').el[0].ops.length,6);assert.equal(esp('Dracónido').el[0].ops.length,10);assert.equal(esp('Tiefling').el.find(x=>x.id==='linaje').ops.length,3);
  assert.match(esp('Goliat').el[0].ops.at(-1).n,/Trueno de la tormenta/,'el nombre partido por el escaneado vuelve a estar entero');
});

test('goliat: el linaje gigante da un recurso con usos = competencia',()=>{
  const G='Goliat';let f=sync(ficha(G),G);
  assert.deepEqual(f.rasgos.map(r=>r.n),['Constitución poderosa'],'Forma grande llega en el nivel 5');assert.equal(f.recursos.length,0);
  f=elige(f,G,'linaje','abrasion_del_fuego');
  assert.equal(rec(f,'Abrasión del fuego').max,2);assert.equal(rec(f,'Abrasión del fuego').rec,'largo');
  assert.ok(f.rasgos.some(x=>x.n==='Linaje gigante: Abrasión del fuego'&&x.r===rec(f,'Abrasión del fuego').id),'el rasgo enlaza su recurso');
  const f5=sync({...f,niveles:Array.from({length:5},()=>({c:'guerrero',hp:10}))},G);
  assert.equal(rec(f5,'Abrasión del fuego').max,3,'con la competencia de nivel 5');assert.equal(rec(f5,'Forma grande').max,1);assert.ok(f5.rasgos.some(x=>x.n==='Forma grande'&&x.r));
  f5.recursos.find(r=>r.n==='Abrasión del fuego').uso=2;
  assert.equal(rec(sync(f5,G),'Abrasión del fuego').uso,2,'sincronizar no gasta ni devuelve usos');
  assert.equal(rec(F.descansoLargo(f5).f,'Abrasión del fuego').uso,0);
  assert.equal(F.linajeElegir,undefined,'la elección solo se hace en el creador: la hoja no la ofrece');assert.equal(F.linajeDeshacer,undefined);
});

test('tiefling, elfo y gnomo: resistencia, conjuros por nivel con su uso gratuito, velocidad y aptitud mágica',()=>{
  const T='Tiefling';let f=elige(sync(ficha(T),T),T,'linaje','infernal');
  assert.deepEqual(f.defensas.res,['Fuego']);assert.ok(f.conjuros.includes('Descarga de fuego')&&f.conjuros.includes('Taumaturgia'));
  assert.ok(!f.conjuros.includes('Reprensión infernal'));assert.equal(f.recursos.length,0);
  assert.throws(()=>elige(sync(ficha(T),T),T,'apt','car'),/pide antes/,'la aptitud mágica pide antes el linaje');
  f=elige(f,T,'apt','car');assert.match(f.rasgos.find(r=>r.n==='Legado infernal: Infernal').txt,/Aptitud mágica:\*\* Carisma/);
  const t5=sync({...f,niveles:Array.from({length:5},()=>({c:'guerrero',hp:10}))},T);
  assert.ok(t5.conjuros.includes('Reprensión infernal')&&t5.conjuros.includes('Oscuridad'));assert.equal(t5.recursos.length,2);
  const E='Elfo';let e=elige(sync(ficha(E),E),E,'linaje','bosques');assert.equal(e.vel,'10,5 m');
  e=elige(e,E,'sentidos','percepcion');assert.equal(e.habil.percepcion,1);
  const quitada=sync({...t5,defensas:{...t5.defensas,res:[]},niveles:t5.niveles},T);assert.deepEqual(quitada.defensas.res,[],'lo que se quita a mano no vuelve solo al sincronizar');
  const G='Gnomo';const g=elige(elige(sync(ficha(G),G),G,'linaje','gnomo_de_los_bosques'),G,'apt','sab');
  assert.equal(rec(g,'Hablar con los animales').max,2);assert.ok(g.conjuros.includes('Ilusión menor'));
});

test('dracónido: el aliento usa la competencia y la resistencia sigue al dragón; el rasgo del aliento enlaza el recurso',()=>{
  const D1='Dracónido',f=elige(sync(ficha(D1),D1),D1,'linaje','verde');
  assert.equal(rec(f,'Ataque de aliento').max,2);assert.deepEqual(f.defensas.res,['Veneno']);
  assert.equal(f.rasgos.find(x=>x.n==='Ataque de aliento').r,rec(f,'Ataque de aliento').id);
  assert.equal(f.rasgos.find(x=>x.n==='Linaje dracónico: Dragón verde').r,'','el rasgo de la opción no repite los usos del aliento');
  assert.equal(rec(sync({...f,niveles:Array.from({length:5},()=>({c:'guerrero',hp:10}))},D1),'Vuelo dracónico').max,1);
});

test('especies sin elección: enano, orco, mediano y humano (tamaño, Diestro y Versátil)',()=>{
  const N=sync(ficha('Enano',3),'Enano');
  assert.equal(N.pgn,1);assert.equal(F.hpMax(N),F.hpMax(ficha('Mediano',3))+3,'Aguante enano: +1 PG por nivel');assert.deepEqual(N.defensas.res,['Veneno']);assert.equal(rec(N,'Afinidad con la piedra').max,2);
  const O=sync(ficha('Orco',5),'Orco');assert.deepEqual([rec(O,'Descarga de adrenalina').max,rec(O,'Descarga de adrenalina').rec],[3,'corto']);
  assert.equal(sync(ficha('Mediano'),'Mediano').rasgos.length,4);
  let H=sync(ficha('Humano'),'Humano');H=elige(elige(elige(H,'Humano','diestro','sigilo'),'Humano','versatil','Alerta'),'Humano','tam','Pequeño');
  assert.equal(H.habil.sigilo,1);assert.deepEqual(H.dotes,['Alerta']);assert.equal(H.tamano,'Pequeño');
  assert.equal(F.descansoLargo(H).f.insp,true,'Ingenioso: inspiración heroica tras el descanso largo');
  assert.equal(F.descansoLargo(ficha('Orco')).f.insp,false);
});

test('sincronizar es idempotente, no duplica y las fichas del primer asistente conservan su linaje élfico',()=>{
  const O='Orco',a=sync(ficha(O,5),O),b=sync(a,O);
  assert.deepEqual(b.rasgos.map(r=>r.n),a.rasgos.map(r=>r.n));assert.equal(b.recursos.length,a.recursos.length);
  const vieja=ficha('Elfo',1,{rasgos:[{n:'Linaje élfico: Elfo de los bosques',txt:'x'},{n:'Sentidos agudos: Percepción',txt:'x'}],vel:'10,5 m',habil:{percepcion:1}});
  const m=sync(vieja,'Elfo');assert.equal(m.lin.v.linaje,'bosques');assert.equal(m.lin.v.sentidos,'percepcion');
  assert.equal(m.rasgos.filter(r=>r.n==='Linaje élfico: Elfo de los bosques').length,1);
  const x=ficha('Raza inventada');assert.equal(F.sincEspecie(x,undefined),x);assert.equal(F.sincEspecie(x,{n:'Raza inventada'}),x,'sin datos de especie no hace nada');
});

test('norm acota lin',()=>{
  assert.deepEqual(F.norm({lin:'x'}).lin,{v:{},insp:false});
  const l=F.norm({lin:{v:{'a b':'x',ok:'y'.repeat(200),otro:5},insp:1}}).lin;
  assert.deepEqual(Object.keys(l.v),['ok']);assert.equal(l.v.ok.length,60);assert.equal(l.insp,true);
});
