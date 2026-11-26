// Efectos de los rasgos de clase: la hoja los reúne con su origen desde x.ef del compendio; los estados (furia…) se activan y gastan su recurso.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PAGE} from './lib.mjs';

const window={};new Function('window',PAGE.match(/<script id="ficha-core">([\s\S]*?)<\/script>/)[1])(window);
const F=window.Ficha;
const D=JSON.parse(readFileSync(new URL('../datos/es/compendio.json',import.meta.url),'utf8'));
const EF=JSON.parse(readFileSync(new URL('../tools/efectos-clase.json',import.meta.url),'utf8'));
const fold=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const datos=Object.fromEntries(D.clases.map(x=>[fold(x.n),x]));
const barbaro=(n,car={})=>F.sincRecursos(F.norm({id:'a',nombre:'B',car:{fue:16,des:14,con:14,int:8,sab:10,car:10,...car},niveles:Array.from({length:n},()=>({c:'barbaro',hp:7}))}),datos);

test('x.ef del compendio coincide con tools/efectos-clase.json (si no, ejecuta node tools/prog-clases.mjs)',()=>{
  for(const x of D.clases){const e=EF[x.n];if(e)assert.deepEqual(x.ef,e,x.n);else assert.equal(x.ef,undefined,x.n);}
});

test('Bárbaro nivel 1: CA sin armadura con Des y Con; aún sin ataque adicional ni ventajas del 2',()=>{
  const d=F.derivados(barbaro(1),datos);
  assert.deepEqual(d.ca.map(x=>x.v),[14]);assert.equal(d.ca[0].o,'Bárbaro · Defensa sin armadura');
  assert.equal(d.ataques,0);assert.equal(d.ventaja.length,0);
  assert.deepEqual(d.estados.map(e=>e.id),['furia']);
});

test('Bárbaro nivel 7: sentir el peligro, ataque adicional, movimiento rápido e instinto salvaje, con su origen',()=>{
  const d=F.derivados(barbaro(7),datos);
  assert.equal(d.ataques,2);assert.deepEqual(d.vel.map(x=>x.v),[3]);
  assert.deepEqual(d.ventaja.map(x=>x.en).sort(),['iniciativa','salv:des']);
  assert.ok(d.ventaja.every(x=>x.o.startsWith('Bárbaro · ')));
  assert.deepEqual(d.estados.map(e=>e.id),['furia','temerario']);
});

test('furia: gasta un uso, da resistencia, daño de la tabla y ventaja en Fuerza solo mientras dura; un descanso la termina',()=>{
  let f=barbaro(1);
  let d=F.derivados(f,datos);assert.equal(d.resiste.length,0);assert.equal(d.dano.length,0);
  const r=F.activar(f,'furia',datos);assert.ok(r.ok);f=r.f;
  assert.equal(f.recursos.find(q=>q.a==='barbaro:furia').uso,1);
  d=F.derivados(f,datos);
  assert.deepEqual(d.resiste[0].tipos,['contundente','cortante','perforante']);
  assert.deepEqual(d.dano.map(x=>x.v),['+2']);assert.deepEqual(d.ventaja.map(x=>x.en).sort(),['prueba:fue','salv:fue']);
  assert.ok(d.avisos.some(a=>/concentración/.test(a.txt)));
  assert.equal(F.activar(f,'furia',datos).error,'ya_activo');
  assert.equal(F.derivados(f,datos).estados[0].activo,true);
  assert.equal(F.desactivar(f,'furia').ok,true);
  assert.deepEqual(F.derivados(F.descansoCorto(f,[]).f,datos).resiste,[]);
  assert.deepEqual(F.descansoLargo(f).f.activos,{});
});

test('daño por furia sube con el nivel (+2, +3, +4) y se agotan los usos',()=>{
  const dano=n=>{const f=F.activar(barbaro(n),'furia',datos).f;return F.derivados(f,datos).dano[0].v;};
  assert.deepEqual([1,8,9,15,16,20].map(dano),['+2','+2','+3','+3','+4','+4']);
  let f=barbaro(1);f=F.activar(f,'furia',datos).f;f=F.desactivar(f,'furia').f;f=F.activar(f,'furia',datos).f;f=F.desactivar(f,'furia').f;
  assert.equal(F.activar(f,'furia',datos).error,'agotado');
});

test('ataque temerario es un estado sin coste',()=>{
  let f=barbaro(2);const r=F.activar(f,'temerario',datos);assert.ok(r.ok);
  assert.equal(r.f.recursos.find(q=>q.a==='barbaro:furia').uso,0);
  const d=F.derivados(r.f,datos);assert.deepEqual(d.ventaja.filter(x=>x.estado==='temerario').map(x=>x.en),['ataque:fue']);
  assert.ok(d.avisos.some(a=>/ventaja/.test(a.txt)&&a.estado==='temerario'));
});

test('activos se sanean y sin datos de la clase no pasa nada',()=>{
  const f=F.norm({id:'a',nombre:'x',niveles:[{c:'barbaro',hp:7}],activos:{furia:true,'MAL!':true,otro:false,x:1}});
  assert.deepEqual(f.activos,{furia:true});
  assert.deepEqual(F.derivados(f,{}).estados,[]);assert.equal(F.activar(f,'furia',{}).error,'no_existe');
});

test('Druida: forma salvaje es un estado que gasta su recurso desde el nivel 2; Bardo: dar inspiración gasta inspiración',()=>{
  const dr=n=>F.sincRecursos(F.norm({id:'d',nombre:'D',niveles:Array.from({length:n},()=>({c:'druida',hp:6}))}),datos);
  assert.deepEqual(F.derivados(dr(1),datos).estados,[]);
  const r=F.activar(dr(2),'forma_salvaje',datos);assert.ok(r.ok);
  assert.equal(r.f.recursos.find(q=>q.a==='druida:forma_salvaje').uso,1);
  assert.ok(F.derivados(r.f,datos).avisos.some(a=>a.estado==='forma_salvaje'));
  const b=F.sincRecursos(F.norm({id:'b',nombre:'B',car:{car:16},niveles:Array.from({length:7},()=>({c:'bardo',hp:5}))}),datos);
  const e=F.derivados(b,datos);assert.deepEqual(e.estados.map(x=>x.id),['inspirar']);
  assert.ok(e.avisos.length>=2);
  const a=F.activar(b,'inspirar',datos);assert.equal(a.f.recursos.find(q=>q.a==='bardo:inspiracion').uso,1);
});

test('subclases: solo cuentan si la hoja tiene esa subclase y el nivel; los efectos «si furia» exigen el estado',()=>{
  const bb=(n,sub)=>F.sincRecursos(F.norm({id:'a',nombre:'B',subclase:sub,car:{fue:16,des:12,con:14,int:8,sab:10,car:10},niveles:Array.from({length:n},()=>({c:'barbaro',hp:7}))}),datos);
  assert.equal(F.derivados(bb(14,''),datos).cd.length,0);
  const f=bb(14,'Senda del Berserker');
  const d0=F.derivados(f,datos);
  assert.deepEqual(d0.cd.map(x=>x.v),[8+3+5]);assert.equal(d0.inmune.length,0);
  assert.ok(d0.estados.some(e=>e.id==='presencia'&&e.inst));
  const f2=F.activar(f,'furia',datos).f;assert.deepEqual(F.derivados(f2,datos).inmune[0].estados,['asustado','hechizado']);
  assert.equal(F.derivados(bb(5,'Senda del Berserker'),datos).avisos.some(a=>/dados d6/.test(a.txt)),false);
});

test('usos instantáneos: gastan el recurso sin quedar activos (Druida: Ayuda de la tierra, Bardo: Palabras cortantes)',()=>{
  const dr=F.sincRecursos(F.norm({id:'d',nombre:'D',subclase:'Círculo de la tierra',niveles:Array.from({length:10},()=>({c:'druida',hp:6}))}),datos);
  const r=F.activar(dr,'ayuda_tierra',datos);assert.ok(r.ok);assert.deepEqual(r.f.activos,{});
  assert.equal(r.f.recursos.find(q=>q.a==='druida:forma_salvaje').uso,1);
  assert.ok(F.derivados(r.f,datos).inmune.some(x=>x.estados.includes('envenenado')));
  const b=F.sincRecursos(F.norm({id:'b',nombre:'B',subclase:'Colegio del conocimiento',car:{car:14},niveles:Array.from({length:3},()=>({c:'bardo',hp:5}))}),datos);
  assert.ok(F.derivados(b,datos).estados.some(e=>e.id==='cortantes'));
  assert.equal(F.activar(b,'cortantes',datos).f.recursos.find(q=>q.a==='bardo:inspiracion').uso,1);
});

test('Guerrero y Pícaro: recursos como botones, ataques por nivel, críticos del Campeón, furtivo de la tabla',()=>{
  const mk=(c,n,sub='',car={})=>F.sincRecursos(F.norm({id:'g',nombre:'G',subclase:sub,car,niveles:Array.from({length:n},()=>({c,hp:8}))}),datos);
  const g=n=>F.derivados(mk('guerrero',n,'Campeón'),datos);
  assert.deepEqual([1,5,11,20].map(n=>g(n).ataques),[0,2,3,4]);
  assert.deepEqual([2,3,15].map(n=>g(n).critico),[20,19,18]);
  assert.ok(g(18).ventaja.some(x=>x.en==='salv:muerte'));
  assert.deepEqual(g(9).estados.map(e=>e.id),['tomar_aliento','accion_subita','indomito']);
  const f=F.activar(mk('guerrero',9),'indomito',datos);assert.equal(f.f.recursos.find(q=>q.a==='guerrero:indomito').uso,1);
  assert.equal(g(1).critico,20);
  const p=n=>F.derivados(mk('picaro',n,'Ladrón'),datos);
  assert.deepEqual([1,3,5,9,10].map(n=>p(n).dano[0].v),['1d6','2d6','3d6','5d6','5d6']);
  assert.ok(p(3).estados.some(e=>e.id==='punteria'&&!e.inst));
  assert.equal(p(19).estados.some(e=>e.id==='golpe_suerte'),false);
  const p20=mk('picaro',20,'Ladrón');assert.ok(F.activar(p20,'golpe_suerte',datos).ok);
  assert.ok(p(17).avisos.some(a=>/dos turnos/.test(a.txt)));
});

// ── statblock derivado: equipo + clase ──
const OBJ=Object.fromEntries(D.objetos.map(x=>[fold(x.n),x]));
const eq=n=>OBJ[fold(n)]||null;
const inv=(...n)=>n.map((x,i)=>({id:'i'+i,n:x,q:1,eq:true}));
const pj=(c,n,car,inventario,sub='',extra={})=>F.sincRecursos(F.norm({id:'s',nombre:'S',subclase:sub,car:{fue:10,des:10,con:10,int:10,sab:10,car:10,...car},niveles:Array.from({length:n},()=>({c,hp:8})),inventario,...extra}),datos);

test('x.arma / x.arm del compendio coinciden con las tablas (si no, node tools/equipo.mjs)',async()=>{
  const {conEquipo}=await import('../tools/equipo.mjs');
  const r=conEquipo(JSON.parse(JSON.stringify(D)));
  assert.deepEqual(r.objetos.map(x=>[x.arma,x.arm]),D.objetos.map(x=>[x.arma,x.arm]));
  assert.equal(D.objetos.filter(x=>x.k==='arma').every(x=>x.arma),true);
  assert.equal(D.objetos.filter(x=>x.k==='armadura').every(x=>x.arm),true);
  assert.deepEqual(OBJ['espada larga'].arma,{cat:'marcial',dist:false,dano:'1d8',tipo:'cortante',props:['versatil'],versatil:'1d10',mae:'Debilitar'});
  assert.deepEqual(OBJ['armadura de pieles'].arm,{tipo:'media',ca:12,des:true,desMax:2,fue:0,sig:false});
});

test('statblock: Guerrero con cota de malla, escudo y espada larga',()=>{
  const f0=pj('guerrero',5,{fue:16,des:12,con:14},inv('Cota de malla','Escudo','Espada larga'),'Campeón');
  assert.doesNotMatch(F.statblock(f0,datos,eq).acciones.find(a=>a.n==='Espada larga').t,/Maestría/);   // sin elegir esa arma no hay maestría
  const f=F.maestriaSet(f0,'Espada larga',true,F.maestriaCupo(f0,datos)).f;
  const s=F.statblock(f,datos,eq);
  assert.equal(s.ca.v,16+2);assert.match(s.ca.o,/Cota de malla, escudo/);
  assert.equal(s.vel,'9 m');assert.equal(s.ini.v,1);
  const e=s.acciones.find(a=>a.n==='Espada larga');
  assert.match(e.t,/Tirada de ataque cuerpo a cuerpo: \+6, alcance 1,5 m\. Acierto: 7 \(1d8 \+ 3\) de daño cortante/);assert.match(e.t,/A dos manos: 1d10/);assert.match(e.t,/Crítico 19–20/);assert.match(e.t,/Maestría: Debilitar/);
  assert.equal(s.acciones[0].n,'Multiataque');
  assert.ok(s.adicionales.some(a=>/Tomar aliento/.test(a.n)));
  assert.ok(s.avisos.some(a=>/Sigilo/.test(a)));
  assert.equal(s.car.find(c=>c.a==='fue').s,3+3);assert.equal(s.car.find(c=>c.a==='des').s,1);
});

test('statblock: armadura que exige más Fuerza baja la velocidad; sin competencia se avisa; sin armadura sirve la Defensa del Bárbaro',()=>{
  const f=pj('mago',1,{fue:10,des:14},inv('Armadura de placas'));
  const s=F.statblock(f,datos,eq);
  assert.equal(s.ca.v,18);assert.equal(s.vel,'6 m');
  assert.ok(s.avisos.some(a=>/Fuerza insuficiente/.test(a)));assert.ok(s.avisos.some(a=>/Sin competencia con la armadura/.test(a)));
  const b=F.statblock(pj('barbaro',3,{fue:16,des:14,con:16},inv('Escudo','Hacha de mano')),datos,eq);
  assert.equal(b.ca.v,10+2+3+2);assert.match(b.ca.o,/Defensa sin armadura, escudo/);
  const c=F.statblock(pj('barbaro',3,{fue:16,des:14,con:16},inv('Cota de malla')),datos,eq);assert.equal(c.ca.v,16);
});

test('statblock: sutil usa Destreza, a distancia usa Destreza, competencia marcial condicionada del Pícaro, furia suma daño',()=>{
  const p=F.statblock(pj('picaro',3,{des:16,fue:10},inv('Estoque','Espada larga','Arco corto'),'Ladrón'),datos,eq);
  const a=n=>p.acciones.find(x=>x.n===n).t;
  assert.match(a('Estoque'),/: \+5, alcance.*\(1d8 \+ 3\)/);
  assert.match(a('Espada larga'),/sin competencia/);assert.match(a('Arco corto'),/Tirada de ataque a distancia: .*alcance 24\/96 m/);
  assert.ok(p.rasgos.some(r=>r.n==='Ataque furtivo'&&/2d6/.test(r.t)));
  const b=pj('barbaro',1,{fue:16,con:14},inv('Hacha a dos manos'));
  assert.match(F.statblock(b,datos,eq).acciones.find(x=>x.n==='Hacha a dos manos').t,/\(1d12 \+ 3\)/);
  const r=F.statblock(F.activar(b,'furia',datos).f,datos,eq);
  assert.match(r.acciones.find(x=>x.n==='Hacha a dos manos').t,/\(1d12 \+ 5\)/);
  assert.ok(r.acciones.some(x=>x.n==='Ataque sin armas'));
});

test('statblock: acciones, adicionales y reacciones se reparten por tipo; el consumo de usos se ve',()=>{
  const g=F.statblock(pj('guerrero',9,{fue:16},inv('Espada larga')),datos,eq);
  assert.ok(g.acciones.some(a=>/Acción súbita/.test(a.n)));assert.ok(g.libres.some(a=>/Indómito/.test(a.n)));
  const p=F.statblock(pj('picaro',5,{des:16},[]),datos,eq);
  assert.ok(p.adicionales.some(a=>a.n==='Acción astuta'));assert.ok(p.reacciones.some(a=>a.n==='Esquiva asombrosa'));
  assert.equal(p.reacciones.length,1);
  const bd=F.statblock(pj('bardo',7,{car:16},[]),datos,eq);
  assert.ok(bd.reacciones.some(a=>a.n==='Contraencantamiento'));assert.ok(bd.adicionales.some(a=>/Inspiración/.test(a.n)||/Dar inspiración/.test(a.n)));
});

test('statblock: los conjuros salen como lista «puede lanzar»: trucos a voluntad y por nivel con espacios',()=>{
  const SP={'rayo de escarcha':{lv:0},'luces danzantes':{lv:0},'curar heridas':{lv:1},'hablar con los animales':{lv:1},'relámpago':{lv:3}};
  const f=pj('druida',5,{sab:16},[],'',{conjuros:['Rayo de escarcha','Luces danzantes','Curar heridas','Hablar con los animales','Relámpago','Conjuro raro']});
  const t=F.statblock(f,datos,eq,n=>SP[n.toLowerCase()]||null).rasgos.find(r=>r.n==='Lanzamiento de conjuros').t;
  assert.match(t,/aptitud mágica es Sabiduría \(CD 14, \+6 al ataque\)/);
  assert.match(t,/Trucos \(a voluntad\): Luces danzantes, Rayo de escarcha/);
  assert.match(t,/Nivel 1 \(4 espacios\): Curar heridas, Hablar con los animales/);
  assert.match(t,/Nivel 3 \(2 espacios\): Relámpago/);assert.match(t,/Otros: Conjuro raro/);
  assert.equal(F.statblock(pj('guerrero',3,{},[]),datos,eq).rasgos.some(r=>r.n==='Lanzamiento de conjuros'),false);
});

test('todas las clases: cada estado gasta un recurso que la clase declara, con acción válida; todos los niveles derivan sin fallar',()=>{
  for(const x of D.clases){
    const ids=new Set((x.recursos||[]).map(r=>r.id)),k=fold(x.n);
    const todos=[...Object.values(x.ef||{}).flat(),...Object.values(x.subef||{}).flat().flatMap(r=>r.ef)];
    for(const e of todos.filter(e=>e.t==='estado')){
      if(e.gasta)assert.ok(ids.has(e.gasta),`${x.n}: ${e.id} gasta ${e.gasta}`);
      assert.ok(['accion','adicional','reaccion','libre'].includes(e.acc),`${x.n}: ${e.id} sin acc`);
    }
    for(let n=1;n<=20;n++){
      const f=pj(k,n,{fue:14,des:14,con:14,int:14,sab:14,car:14},inv('Espada larga','Escudo'),(x.sub||[])[0]||'');
      const s=F.statblock(f,datos,eq);assert.ok(s.ca.v>=10&&s.acciones.length>=1,`${x.n} ${n}`);
    }
  }
});

test('Monje: Defensa sin armadura y movimiento solo sin armadura ni escudo; artes marciales dan el dado y Destreza',()=>{
  const m=(n,i=[])=>F.statblock(pj('monje',n,{des:16,sab:18,fue:10},i,'Guerrero de la mano abierta'),datos,eq);
  assert.equal(m(1).ca.v,10+3+4);assert.equal(m(1,inv('Escudo')).ca.v,10+3+2);
  assert.equal(m(2).vel,'12 m');assert.equal(m(2,inv('Escudo')).vel,'9 m');
  assert.equal(m(6).vel,'13,5 m');
  const u=m(5).acciones.find(a=>a.n==='Ataque sin armas').t;assert.match(u,/: \+6, alcance 1,5 m\. Acierto: 7 \(1d8 \+ 3\)/);
  assert.equal(m(5).acciones[0].n,'Multiataque');
  const g=F.activar(pj('monje',20,{},[]),'defensa_superior',datos);assert.equal(g.f.recursos.find(q=>q.a==='monje:concentracion').uso,3);
});

test('Paladín, Hechicero, Brujo, Clérigo, Explorador y Mago: efectos y estados principales',()=>{
  const sb=(c,n,car,sub='',inventario=[])=>F.statblock(pj(c,n,car,inventario,sub),datos,eq);
  const pal=sb('paladin',11,{car:16,fue:16},'Juramento de entrega',inv('Cota de malla','Espada larga'));
  assert.ok(pal.rasgos.some(r=>r.n==='Aura de protección (salvaciones)'&&r.t==='+3'));
  assert.ok(pal.rasgos.some(r=>/Inmune a asustado/.test(r.t))&&pal.rasgos.some(r=>/Inmune a hechizado/.test(r.t))&&pal.rasgos.some(r=>/1d8/.test(r.t)));
  assert.ok(pal.adicionales.some(a=>/Castigo divino/.test(a.n)));
  const hech=sb('hechicero',6,{car:16,des:14},'Hechicería dracónica');
  assert.equal(hech.ca.v,10+2+3);
  assert.ok(hech.adicionales.some(a=>/Hechicería innata/.test(a.n)));
  const br=sb('brujo',11,{car:16},'Patrón infernal');
  assert.ok(br.libres.some(a=>/Arcanum místico \(nivel 6\)/.test(a.n)));
  const cl=sb('clerigo',10,{sab:16},'Dominio de la vida');
  assert.ok(cl.acciones.some(a=>/Canalizar divinidad/.test(a.n)));assert.ok(cl.acciones.some(a=>/Intercesión divina/.test(a.n)));assert.ok(cl.acciones.some(a=>/Preservar vida/.test(a.n)));
  const ex=sb('explorador',14,{sab:16},'Cazador');
  assert.ok(ex.adicionales.some(a=>/Marca del cazador/.test(a.n)));assert.ok(ex.adicionales.some(a=>/Velo de la naturaleza/.test(a.n)));assert.equal(ex.vel,'12 m');
  const mg=sb('mago',6,{int:16},'Evocador');assert.ok(mg.libres.some(a=>/Recuperación arcana/.test(a.n)));
});
