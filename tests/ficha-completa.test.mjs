// Ficha completa: habilidades, salvaciones, ataques, rasgos con usos, magia, defensas, idiomas y personalidad (index.html, bloque ficha-core).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PAGE} from './lib.mjs';

const window={};new Function('window',PAGE.match(/<script id="ficha-core">([\s\S]*?)<\/script>/)[1])(window);
const F=window.Ficha;
const JUG={rol:'jugador',quien:'Ana',ahora:1000},DM={rol:'dm',quien:'Máster',ahora:2000};
const mago=(o={})=>F.norm({id:'c1',nombre:'Lyra',car:{fue:8,des:14,con:14,int:16,sab:12,car:10},niveles:[{c:'mago',hp:6},{c:'mago',hp:4},{c:'mago',hp:4},{c:'mago',hp:4},{c:'mago',hp:4}],...o});   // nivel 5: competencia +3
const camp=(o={})=>mago({origen:'campana',campana:'x',...o});
const juega=(f,op,pol,via)=>F.cambiar(f,op(F.vista(f)).f,JUG,pol,via);

test('una ficha sin nada de lo nuevo sigue siendo válida y vacía',()=>{
  const f=F.norm({nombre:'Pepe'});
  assert.deepEqual(f.habil,{});assert.deepEqual(f.ataques,[]);assert.deepEqual(f.rasgos,[]);assert.equal(f.magia.hab,'');
  assert.deepEqual(f.defensas.res,[]);assert.deepEqual(f.otras.idiomas,[]);assert.equal(f.pers.historia,'');
  assert.equal(F.magia(f),null);
});

test('habilidades: bonificador con competencia y pericia, y percepción pasiva',()=>{
  let f=mago();
  assert.equal(F.habBonus(f,'arcanos'),3);assert.equal(F.pasiva(f,'percepcion'),11);
  f=F.habilidadSet(f,'arcanos',1).f;assert.equal(F.habBonus(f,'arcanos'),6);
  f=F.habilidadSet(f,'arcanos',2).f;assert.equal(F.habBonus(f,'arcanos'),9);
  f=F.habilidadSet(f,'percepcion',1).f;assert.equal(F.pasiva(f,'percepcion'),11+3+1-1+0);   // 10 + sab +1 + 3
  f=F.habilidadSet(f,'arcanos',0).f;assert.equal(f.habil.arcanos,undefined);
  assert.equal(F.habilidadSet(f,'volar',1).ok,false);
  assert.equal(F.norm({habil:{atletismo:9,sigilo:-2,x:1}}).habil.atletismo,2);
  assert.deepEqual(Object.keys(F.norm({habil:{sigilo:-2,x:1}}).habil),[]);
});

test('salvaciones: las de la clase y las que se añaden a mano',()=>{
  let f=mago();   // mago: INT y SAB; competencia +3
  assert.equal(F.salvBonus(f,'int'),6);assert.equal(F.salvBonus(f,'con'),2);
  f=F.salvacionSet(f,'con',true).f;assert.equal(F.salvBonus(f,'con'),5);
  f=F.salvacionSet(f,'con',false).f;assert.equal(F.salvBonus(f,'con'),2);
});

test('ataques: se añaden, se normalizan y se quitan',()=>{
  let f=mago();
  f=F.ataqueAnadir(f,{n:'Daga',b:'7',dano:'1d4+2',tipo:'perforante'}).f;
  assert.equal(f.ataques.length,1);assert.equal(f.ataques[0].b,7);
  assert.equal(F.ataqueAnadir(f,{n:'  '}).ok,false);
  f=F.ataqueQuitar(f,f.ataques[0].id).f;assert.equal(f.ataques.length,0);
});

test('rasgos con usos: crean un recurso enlazado que los descansos recuperan',()=>{
  let f=mago();
  f=F.rasgoAnadir(f,{n:'Recuperación arcana',txt:'Recupera espacios',max:1,rec:'largo'}).f;
  const r=f.rasgos[0];assert.ok(r.r);assert.equal(f.recursos.length,1);assert.equal(f.recursos[0].id,r.r);
  f=F.usarRecurso(f,r.r).f;assert.equal(f.recursos[0].uso,1);
  f=F.descansoLargo(f).f;assert.equal(f.recursos[0].uso,0);
  f=F.rasgoAnadir(f,{n:'Lengua común',txt:'Texto'}).f;assert.equal(f.rasgos[1].r,'');   // sin usos: solo texto
  f=F.rasgoQuitar(f,r.id).f;assert.equal(f.rasgos.length,1);assert.equal(f.recursos.length,0);
  // un enlace a un recurso que no existe se limpia
  assert.equal(F.norm({rasgos:[{n:'X',r:'zz'}]}).rasgos[0].r,'');
});

test('magia: característica, CD y ataque; nivel y preparados por conjuro',()=>{
  let f=mago();
  let m=F.magia(f);assert.deepEqual([m.hab,m.cd,m.atq],['int',14,6]);
  f=F.editar(f,'magia.hab','sab').f;m=F.magia(f);assert.deepEqual([m.hab,m.cd],['sab',12]);
  f=F.conjuroAnadir(f,'Bola de fuego',3).f;f=F.conjuroAnadir(f,'Escudo').f;
  assert.equal(f.magia.niv['Bola de fuego'],3);assert.equal(f.magia.niv['Escudo'],undefined);
  f=F.conjuroNivel(f,'Escudo',1).f;f=F.conjuroPreparar(f,'Escudo',true).f;assert.deepEqual(f.magia.prep,['Escudo']);
  f=F.conjuroPreparar(f,'Escudo',false).f;assert.deepEqual(f.magia.prep,[]);
  assert.equal(F.conjuroPreparar(f,'Nada',true).ok,false);
  f=F.conjuroPreparar(f,'Escudo',true).f;f=F.conjuroQuitar(f,'Escudo').f;   // al quitar el conjuro se limpia todo lo suyo
  assert.deepEqual(f.magia.prep,[]);assert.equal(f.magia.niv.Escudo,undefined);
  {let h=F.norm({nombre:'Bardo',niveles:[{c:'bardo',hp:8}],conjuros:['Hablar con los animales','Escudo'],magia:{niv:{'Hablar con los animales':1,Escudo:1},prep:[],sp:['Hablar con los animales','Inventado']}});
    assert.deepEqual(h.magia.sp,['Hablar con los animales']);assert.deepEqual(h.magia.prep,['Hablar con los animales']);   // un siempre preparado va preparado y solo vale si el conjuro está
    h=F.conjuroPreparar(h,'Hablar con los animales',false).f;assert.deepEqual(h.magia.prep,['Hablar con los animales']);   // no se puede desmarcar
    assert.equal(F.conjuroSustituir(h,'Hablar con los animales','Luz',0).error,'siempre_preparado');
    h=F.conjuroQuitar(h,'Hablar con los animales').f;assert.deepEqual(h.magia.sp,[]);}
  const g=F.norm({nombre:'Brujo',niveles:[{c:'brujo',hp:8}]});assert.equal(F.magia(g).hab,'car');
});

test('defensas, idiomas y competencias: listas libres sin repetidos',()=>{
  let f=mago();
  f=F.listaAnadir(f,'defensas','res','Fuego').f;f=F.listaAnadir(f,'defensas','res','fuego').f;f=F.listaAnadir(f,'defensas','estados','Concentrado').f;
  assert.deepEqual(f.defensas.res,['Fuego']);assert.deepEqual(f.defensas.estados,['Concentrado']);
  f=F.listaAnadir(f,'otras','idiomas','Común').f;f=F.listaAnadir(f,'otras','armas','Dagas').f;
  assert.deepEqual(f.otras.idiomas,['Común']);assert.equal(F.listaAnadir(f,'otras','magia','x').ok,false);
  f=F.listaQuitar(f,'defensas','res','Fuego').f;assert.deepEqual(f.defensas.res,[]);
});

test('personalidad e historia: texto libre con saltos de línea',()=>{
  let f=mago();
  f=F.editar(f,'pers.historia','Nació en\nun faro.').f;assert.equal(f.pers.historia,'Nació en\nun faro.');
  f=F.editar(f,'pers.alineamiento','Neutral bueno').f;assert.equal(f.pers.alineamiento,'Neutral bueno');
  assert.equal(F.editar(f,'pers.secreto','x').ok,false);
});

test('el combate recibe habilidades, defensas, idiomas, ataques y la CD de la magia',()=>{
  let f=mago();
  f=F.habilidadSet(f,'arcanos',1).f;f=F.salvacionSet(f,'con',true).f;f=F.listaAnadir(f,'defensas','res','Fuego').f;f=F.listaAnadir(f,'otras','idiomas','Élfico').f;
  f=F.ataqueAnadir(f,{n:'Daga',b:7,dano:'1d4+2',tipo:'perforante'}).f;f=F.editar(f,'magia.hab','sab').f;
  const c=F.comoCombatiente(f);
  assert.equal(c.sk,'Arcanos +6');assert.equal(c.re,'Fuego');assert.equal(c.la,'Élfico');assert.equal(c.sv[2],5);assert.equal(c.pp,11);
  assert.match(c.a[0][1],/\+7.*1d4\+2 de daño perforante/);assert.equal(c.spc.dc,12);
});

test('permisos: habilidades bloqueadas, ataques con aprobación, estados y personalidad libres',()=>{
  const f=camp(),P=F.POLITICAS_DEFECTO;
  assert.equal(juega(f,g=>F.habilidadSet(g,'arcanos',1)).ok,false);
  const a=juega(f,g=>F.ataqueAnadir(g,{n:'Daga',b:5}));assert.deepEqual(a.propuestos,['ataques']);assert.equal(a.f.ataques.length,0);assert.equal(a.f.pendientes.length,1);
  const e=juega(f,g=>F.listaAnadir(g,'defensas','estados','Envenenado'));assert.deepEqual(e.aplicados,['defensas']);assert.deepEqual(e.f.defensas.estados,['Envenenado']);
  const h=juega(f,g=>F.editar(g,'pers.historia','Algo'));assert.deepEqual(h.aplicados,['pers']);
  const m=juega(f,g=>F.conjuroNivel(F.conjuroAnadir(g,'Escudo').f,'Escudo',1));assert.deepEqual(m.propuestos,['conjuros','magia']);
  const r=juega(f,g=>F.rasgoAnadir(g,{n:'Rasgo',max:1,rec:'largo'}));assert.deepEqual(r.propuestos,['rasgos']);assert.deepEqual(r.aplicados,['recursos']);   // el rasgo se propone; sus usos son gasto, libres
  assert.ok(Object.keys(F.GRUPO_DE).every(k=>P[F.GRUPO_DE[k]]));
});

test('exportar e importar conserva la ficha completa',()=>{
  let f=mago();f=F.habilidadSet(f,'arcanos',2).f;f=F.ataqueAnadir(f,{n:'Daga',b:5}).f;f=F.editar(f,'pers.historia','Hola').f;f=F.listaAnadir(f,'otras','idiomas','Común').f;
  const g=F.importar(F.exportar(f)).f;
  assert.deepEqual([g.habil,g.ataques.map(a=>a.n),g.pers.historia,g.otras.idiomas],[f.habil,['Daga'],'Hola',['Común']]);
});

test('un rasgo propuesto con usos no deja su recurso suelto si se rechaza o se retira',()=>{
  const f=camp();
  const r=juega(f,g=>F.rasgoAnadir(g,{n:'Furia',max:2,rec:'largo'}));
  assert.deepEqual(r.propuestos,['rasgos']);assert.equal(r.f.recursos.length,1);
  const id=r.f.pendientes[0].id;
  const rech=F.resolver(r.f,id,false,DM).f;assert.equal(rech.rasgos.length,0);assert.equal(rech.recursos.length,0);
  const ret=F.retirar(r.f,id,JUG).f;assert.equal(ret.recursos.length,0);
  const ace=F.resolver(r.f,id,true,DM).f;assert.equal(ace.rasgos.length,1);assert.equal(ace.recursos.length,1);assert.equal(ace.rasgos[0].r,ace.recursos[0].id);
});
test('quitar un rasgo con usos se propone y, si se rechaza, el rasgo vuelve sin enlace roto',()=>{
  const f=F.rasgoAnadir(camp(),{n:'Furia',max:2}).f;
  const r=juega(f,g=>F.rasgoQuitar(g,g.rasgos[0].id));
  const rech=F.resolver(r.f,r.f.pendientes[0].id,false,DM).f;
  assert.equal(rech.rasgos.length,1);assert.ok(!rech.rasgos[0].r||rech.recursos.some(q=>q.id===rech.rasgos[0].r));
});

test('la exportación a Markdown incluye los apartados de la ficha completa',()=>{
  let f=mago();
  f=F.habilidadSet(f,'arcanos',2).f;f=F.salvacionSet(f,'des',true).f;
  f=F.ataqueAnadir(f,{n:'Bastón',b:5,dano:'1d6+2',tipo:'contundente'}).f;
  f=F.rasgoAnadir(f,{n:'Recuperación arcana',txt:'Recupera espacios\nal descansar',max:1,rec:'largo'}).f;
  f=F.conjuroAnadir?F.conjuroAnadir(f,'Bola de fuego').f:{...f,conjuros:['Bola de fuego']};
  f=F.norm({...f,conjuros:['Bola de fuego'],magia:{hab:'int',niv:{'Bola de fuego':3},prep:['Bola de fuego']},defensas:{res:['fuego']},otras:{idiomas:['Común','Élfico']},pers:{aspecto:'Alta y seria',historia:'Huyó\ndel gremio'},inventario:[{n:'Cuerda',q:2}],mon:{po:15}});
  const md=F.exportar(f,{formato:'md',idioma:'es'});
  for(const t of ['**Salvaciones:**','**Habilidades:** Arcanos','★','**Ataques:**','- Bastón +5 · 1d6+2 contundente','- Recuperación arcana (1/1): Recupera espacios al descansar','**Conjuros:** Característica de lanzamiento INT','- 3º Bola de fuego ✓','**Resistencias:** fuego','**Idiomas:** Común, Élfico','**Inventario:**','- Cuerda ×2','15 po','**Aspecto:** Alta y seria','**Historia:** Huyó del gremio'])assert.ok(md.includes(t),t);
  assert.ok(F.exportar(f,{formato:'md',idioma:'en'}).includes('**Saving throws:**'));
  const vacia=F.exportar(mago({}),{formato:'md'});assert.ok(!vacia.includes('Ataques')&&!vacia.includes('Inventario')&&!vacia.includes('Habilidades'));
});

test('conflictos: avisa si lo aprobado cambió después de proponer',()=>{
  const f=camp({inventario:[{id:'i1',n:'Cuerda',q:1}]});
  const r=juega(f,g=>F.invAnadir(g,{n:'Antorcha',q:1}));const p=r.f.pendientes[0];
  assert.deepEqual(F.conflictos(r.f,p),[]);
  const g=F.invAnadir(r.f,{n:'Daga',q:1}).f;   // el máster toca el inventario aprobado
  assert.deepEqual(F.conflictos(g,p),['inventario']);
});

test('campos de la hoja oficial: subclase, tamaño, inspiración, salvaciones contra muerte, equipado y sintonizado',()=>{
  let f=mago({subclase:'Círculo de la Luna',tamano:'Mediano',insp:1,muerte:{ex:2,fa:9},pers:{altura:'1,70 m',ojos:'Verdes'}});
  assert.equal(f.subclase,'Círculo de la Luna');assert.equal(f.insp,true);assert.deepEqual(f.muerte,{ex:2,fa:3});assert.equal(f.pers.altura,'1,70 m');
  f=F.editar(f,'muerte.ex',0).f;f=F.editar(f,'insp',false).f;assert.equal(f.muerte.ex,0);assert.equal(f.insp,false);
  f=F.invAnadir(f,{n:'Armadura'}).f;f=F.invAnadir(f,{n:'Anillo'}).f;f=F.invAnadir(f,{n:'Capa'}).f;f=F.invAnadir(f,{n:'Amuleto'}).f;
  const id=n=>f.inventario.find(i=>i.n===n).id;
  f=F.invMarcar(f,id('Armadura'),'eq',true).f;assert.equal(f.inventario[0].eq,true);
  for(const n of ['Anillo','Capa','Amuleto'].slice(0,3))f=(F.invMarcar(f,id(n),'sin',true).f)||f;
  assert.equal(f.inventario.filter(i=>i.sin).length,3);
  f=F.invAnadir(f,{n:'Bota'}).f;assert.equal(F.invMarcar(f,id('Bota'),'sin',true).ok,false);   // máximo 3 sintonizados
  assert.equal(F.invMarcar(f,id('Anillo'),'sin',false).ok,true);
  // en campaña: la inspiración y las salvaciones son del grupo PG (libres); lo equipado es inventario (propuesta)
  const c=camp();
  assert.deepEqual(juega(c,g=>F.editar(g,'insp',true)).aplicados,['insp']);
  assert.deepEqual(juega(F.invAnadir(c,{n:'Escudo'}).f,g=>F.invMarcar(g,g.inventario[0].id,'eq',true)).propuestos,['inventario']);
  assert.ok(F.exportar(F.norm({...mago(),pers:{altura:'1,70 m'}}),{formato:'md'}).includes('**Altura:** 1,70 m'));
});

test('salvaciones contra muerte: 0 PG no mata, el daño sobrante igual a los PG máximos sí, y 3 fallos o 3 éxitos cierran la cuenta',()=>{
  const f=mago(),mx=F.hpMax(f),d=(g,n,o)=>F.dano(g,n,null,o).f,a0=d(f,mx);
  assert.deepEqual([a0.hp,a0.muerte.ex,a0.muerte.fa],[0,0,0],'a 0 PG no se muere: empiezan las salvaciones');
  assert.equal(d(f,mx+mx-1).muerte.fa,0,'sobra menos que los PG máximos: no es instantánea');
  assert.equal(d(f,mx+mx).muerte.fa,3,'sobra igual a los PG máximos: muerte instantánea');
  assert.equal(d(a0,2).muerte.fa,1,'daño con 0 PG: un fallo');
  assert.equal(d(a0,2,{critico:true}).muerte.fa,2,'crítico con 0 PG: dos fallos');
  assert.equal(d(a0,mx).muerte.fa,3,'daño con 0 PG igual a los PG máximos: muere');
  assert.equal(F.salvMuerte(a0,1).f.muerte.fa,2,'1 natural: dos fallos');
  assert.deepEqual([F.salvMuerte(a0,20).f.hp,F.salvMuerte(a0,20).f.muerte.fa],[1,0],'20 natural: recupera 1 PG');
  let e=a0;for(const x of [10,14,19])e=F.salvMuerte(e,x).f;assert.equal(e.muerte.ex,3);assert.equal(F.salvMuerte(e,15).error,'estable','estable: no tira más');
  assert.equal(d(e,1).muerte.ex,0,'el daño quita el estado estable');
  let m=a0;for(const x of [9,5,2])m=F.salvMuerte(m,x).f;assert.equal(m.muerte.fa,3);
  assert.equal(F.curar(m,5).error,'muerto');assert.equal(F.dano(m,1).error,'muerto');
  const c=F.curar(d(a0,2),4).f;assert.deepEqual([c.hp,c.muerte.ex,c.muerte.fa],[4,0,0],'curar con 0 PG limpia las marcas');
});

test('personaje muerto (3 fallos o cansancio 6): la ficha se bloquea y solo se desbloquea al revivir',()=>{
  const f=mago(),a0=F.dano(f,F.hpMax(f)).f,m=F.norm({...a0,muerte:{ex:0,fa:3}}),c=F.norm({...f,agot:6});
  assert.deepEqual([F.muerto(f),F.muerto(m),F.muerto(c)],[false,true,true]);
  for(const x of [m,c]){
    assert.equal(F.curar(x,3).error,'muerto');assert.equal(F.dano(x,3).error,'muerto');assert.equal(F.temporales(x,3).error,'muerto');
    assert.equal(F.descansoLargo(x).error,'muerto','el descanso largo no le quita cansancio a un muerto');assert.equal(F.descansoCorto(x,[]).error,'muerto');
  }
  assert.equal(F.salvMuerte(m,15).error,'muerto');assert.equal(F.revivir(f,{pg:1}).error,'no_muerto','solo se revive a un muerto');
  const r=F.revivir(m,{pg:1,via:'Revivir'}).f;assert.deepEqual([r.hp,r.muerte.ex,r.muerte.fa,F.muerto(r)],[1,0,0,false]);
  assert.equal(F.revivir(m,{pg:'max'}).f.hp,F.hpMax(m),'Resurrección: todos los PG');
  const rc=F.revivir(c,{pg:4}).f;assert.deepEqual([rc.hp,rc.agot,F.muerto(rc)],[4,5,false],'si murió de cansancio queda en el nivel 5');
  assert.equal(F.curar(rc,2).ok,true,'tras revivir vuelve a admitir curación');
});

test('la causa de cada muerte queda anotada para siempre, también después de revivir',()=>{
  const f=mago(),mx=F.hpMax(f),ult=g=>g.muertes[g.muertes.length-1];
  const a=F.dano(f,mx+mx,JUG).f;assert.match(ult(a).causa,/Muerte instantánea: un solo golpe de \d+ de daño/);assert.equal(a.muertes.length,1);
  const b0=F.dano(f,mx).f,b=F.dano(F.dano(F.dano(b0,1).f,1).f,1).f;assert.match(ult(b).causa,/Tercer fallo: recibió 1 de daño estando a 0 PG/);
  let c=b0;for(const d of [2,3,4])c=F.salvMuerte(c,d).f;assert.match(ult(c).causa,/Tres fallos en las salvaciones contra muerte/);
  assert.match(ult(F.salvMuerte(F.salvMuerte(b0,3).f,1).f).causa,/pifia/);
  assert.match(ult(F.editar(f,'agot',6,JUG).f).causa,/Cansancio de nivel 6/);
  assert.match(ult(F.editar(f,'muerte.fa',3,JUG).f).causa,/marcados a mano/);
  assert.equal(F.curar(b0,1).f.muertes.length,0,'sin morir no se anota nada');
  const n=F.notaMuerte(a,'Aliento del dragón rojo',DM).f;assert.equal(ult(n).nota,'Aliento del dragón rojo');assert.equal(F.notaMuerte(f,'x',DM).error,'no_muerto');
  const r=F.revivir(n,{pg:1,via:'Revivir'},DM).f;assert.equal(r.muertes.length,1,'revivir no borra el historial');assert.ok(ult(r).vuelta>0);assert.equal(ult(r).via,'Revivir');
  const otra=F.dano(F.norm({...r,hp:r.hp}),mx+mx,JUG).f;assert.equal(otra.muertes.length,2,'una segunda muerte se suma a la anterior');
  assert.equal(F.norm(JSON.parse(JSON.stringify(otra))).muertes.length,2,'sobrevive a guardar y cargar');
});
