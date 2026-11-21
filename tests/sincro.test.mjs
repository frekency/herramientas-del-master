// Motor de sincronización por elemento (index.html, bloque sync-core): subidas, bajadas, conflictos, borrados y convergencia.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PAGE} from './lib.mjs';

const window={};new Function('window',PAGE.match(/<script id="sync-core">([\s\S]*?)<\/script>/)[1])(window);
const S=window.Sincro;

/* servidor simulado con la misma semántica que Supabase: versión que sube el servidor y escritura condicional a la versión base */
function servidor(){
  const filas={};let reloj=1000;
  return {filas,
    leer:()=>Object.fromEntries(Object.entries(filas).map(([k,f])=>[k,{...f}])),
    escribir({clave,valor,borrado,base}){
      const f=filas[clave];
      if(!f){if(base!==0)return {ok:false};}else if(f.version!==base)return {ok:false};
      filas[clave]={valor:borrado?null:valor,version:(f?f.version:0)+1,actualizado:++reloj,borrado:!!borrado};
      return {ok:true,version:filas[clave].version};
    }};
}
/* un dispositivo: estado local + sincronizar() hasta que no quede nada por subir */
function dispositivo(srv,nombre){
  const d={nombre,l:S.vacio(),relojLocal:0,
    editar(k,v,t){const r=S.editar(d.l,k,v,t);assert.ok(r.ok,r.error);d.l=r.l;},
    borrar(k,t){d.l=S.borrar(d.l,k,t).l;},
    sync(t){
      let ultimo;
      for(let i=0;i<6;i++){
        const r=S.fusionar(d.l,srv.leer(),t);d.l=r.l;ultimo=r;
        if(!r.subir.length)return ultimo;
        let rechazo=false;
        for(const u of r.subir){const w=srv.escribir(u);if(w.ok)d.l=S.confirmar(d.l,{clave:u.clave,version:w.version});else rechazo=true;}
        if(!rechazo)return ultimo;
      }
      return ultimo;
    },
    datos:()=>S.vivos(d.l)};
  return d;
}

test('una edición sin conexión se encola y se sube al reconectar',()=>{
  const srv=servidor(),a=dispositivo(srv,'a');
  a.editar('nota:1',{t:'hola'},10);a.editar('nota:2',{t:'dos'},11);
  assert.equal(S.pendientes(a.l),2);
  a.sync(20);
  assert.equal(S.pendientes(a.l),0);assert.equal(srv.filas['nota:1'].version,1);assert.deepEqual(a.datos(),{'nota:1':{t:'hola'},'nota:2':{t:'dos'}});
});

test('lo que no se ha tocado en local sigue al servidor',()=>{
  const srv=servidor(),a=dispositivo(srv,'a'),b=dispositivo(srv,'b');
  a.editar('x',{v:1},10);a.sync(11);b.sync(12);
  assert.deepEqual(b.datos(),{x:{v:1}});
  a.editar('x',{v:2},20);a.sync(21);b.sync(22);
  assert.deepEqual(b.datos(),{x:{v:2}});assert.equal(S.pendientes(b.l),0);
});

test('editar elementos distintos en dos dispositivos NO pisa nada (el motivo de ir por elemento)',()=>{
  const srv=servidor(),a=dispositivo(srv,'a'),b=dispositivo(srv,'b');
  a.editar('n1',{t:'a'},1);a.editar('n2',{t:'b'},1);a.sync(2);b.sync(3);
  a.editar('n1',{t:'a editada en el PC'},10);b.editar('n2',{t:'b editada en el móvil'},11);   // los dos sin conexión
  a.sync(20);b.sync(21);a.sync(22);
  assert.deepEqual(a.datos(),b.datos());
  assert.deepEqual(a.datos(),{n1:{t:'a editada en el PC'},n2:{t:'b editada en el móvil'}});
  assert.equal(a.l.conflictos.length+b.l.conflictos.length,0);
});

test('conflicto en el mismo elemento: gana el más reciente y la perdedora queda guardada',()=>{
  const srv=servidor(),a=dispositivo(srv,'a'),b=dispositivo(srv,'b');
  a.editar('n',{t:'base'},1);a.sync(2);b.sync(3);
  a.editar('n',{t:'del PC'},10);b.editar('n',{t:'del móvil'},50);
  a.sync(60);                                                         // el PC sube primero (actualizado del servidor > 50, pero…)
  b.sync(70);a.sync(80);
  assert.deepEqual(a.datos(),b.datos());
  const todos=[...a.l.conflictos,...b.l.conflictos].map(c=>c.valor.t);
  assert.ok(todos.length>=1);
  const ganador=a.datos().n.t;assert.ok(['del PC','del móvil'].includes(ganador));
  assert.ok(todos.includes(ganador==='del PC'?'del móvil':'del PC'),'la versión perdedora debe quedar recuperable');
});

test('conflicto: el servidor decide la ganadora por «actualizado» frente al mod local',()=>{
  const a=S.editar(S.vacio(),'n',{t:'local'},100).l;
  const sync=S.fusionar({items:{n:{...a.items.n,bv:1}},conflictos:[]},{n:{valor:{t:'remoto'},version:2,actualizado:50,borrado:false}},200);
  assert.equal(sync.subir[0].valor.t,'local');assert.equal(sync.subir[0].base,2);assert.equal(sync.l.conflictos[0].valor.t,'remoto');
  const sync2=S.fusionar({items:{n:{...a.items.n,bv:1}},conflictos:[]},{n:{valor:{t:'remoto'},version:2,actualizado:500,borrado:false}},200);
  assert.equal(sync2.subir.length,0);assert.equal(sync2.l.items.n.valor.t,'remoto');assert.equal(sync2.l.conflictos[0].valor.t,'local');
});

test('un borrado se propaga y no resucita',()=>{
  const srv=servidor(),a=dispositivo(srv,'a'),b=dispositivo(srv,'b');
  a.editar('n',{t:'x'},1);a.sync(2);b.sync(3);
  a.borrar('n',10);a.sync(11);
  assert.equal(srv.filas.n.borrado,true);
  b.sync(12);assert.deepEqual(b.datos(),{});
  a.sync(13);b.sync(14);assert.deepEqual(a.datos(),{});assert.deepEqual(b.datos(),{});
  assert.equal(Object.keys(a.l.items).length,0);
});

test('borrar algo que nunca se subió no deja rastro; borrar sin conexión se encola',()=>{
  const srv=servidor(),a=dispositivo(srv,'a');
  a.editar('n',{t:'x'},1);a.borrar('n',2);assert.equal(S.pendientes(a.l),0);a.sync(3);assert.equal(Object.keys(srv.filas).length,0);
  a.editar('m',{t:'y'},4);a.sync(5);a.borrar('m',6);assert.equal(S.pendientes(a.l),1);a.sync(7);assert.equal(srv.filas.m.borrado,true);
});

test('editar vs. borrado remoto: gana el más reciente y la edición perdida se conserva',()=>{
  const srv=servidor(),a=dispositivo(srv,'a'),b=dispositivo(srv,'b');
  a.editar('n',{t:'v1'},1);a.sync(2);b.sync(3);
  a.borrar('n',10);a.sync(11);               // el servidor registra el borrado con su reloj
  b.editar('n',{t:'editada tarde'},99999);    // b edita después, sin saber del borrado
  b.sync(100000);a.sync(100001);
  assert.deepEqual(a.datos(),b.datos());
  assert.deepEqual(b.datos(),{n:{t:'editada tarde'}});
  const c=dispositivo(srv,'c');c.editar('n',{t:'otra'},1);   // ahora al revés: edición antigua frente a un borrado más reciente
  const d=dispositivo(srv,'d');d.sync(5);d.editar('n',{t:'antigua'},6);
  c.sync(7);c.borrar('n',2000);c.sync(2001);d.sync(2002);
  assert.deepEqual(d.datos(),c.datos());
  assert.ok([...d.l.conflictos,...c.l.conflictos].some(x=>x.valor&&x.valor.t==='antigua')||d.datos().n!==undefined);
});

test('una escritura rechazada por versión se reintenta tras volver a leer',()=>{
  const srv=servidor(),a=dispositivo(srv,'a'),b=dispositivo(srv,'b');
  a.editar('n',{t:'1'},1);a.sync(2);b.sync(3);
  b.editar('n',{t:'b'},10);
  a.editar('n',{t:'a'},11);a.sync(12);       // a se adelanta: ahora el servidor está en la versión 2
  b.sync(13);                                  // b intenta subir con base 1 → rechazada → relee → resuelve
  a.sync(14);
  assert.deepEqual(a.datos(),b.datos());
});

test('idempotencia: sincronizar dos veces seguidas no cambia nada',()=>{
  const srv=servidor(),a=dispositivo(srv,'a');a.editar('n',{t:'x'},1);a.sync(2);
  const antes=JSON.stringify([a.l,srv.filas]);a.sync(3);a.sync(4);assert.equal(JSON.stringify([a.l,srv.filas]),antes);
});

test('convergencia: operaciones al azar en tres dispositivos acaban iguales y sin perder elementos',()=>{
  let s=12345;const azar=()=>(s=(s*16807)%2147483647)/2147483647;
  for(let ronda=0;ronda<60;ronda++){
    const srv=servidor(),ds=[dispositivo(srv,'a'),dispositivo(srv,'b'),dispositivo(srv,'c')];let t=1;
    for(let paso=0;paso<25;paso++){
      const d=ds[Math.floor(azar()*3)],k='n'+Math.floor(azar()*5),q=azar();t+=1+Math.floor(azar()*5);
      if(q<0.5)d.editar(k,{t:'v'+paso+d.nombre},t);else if(q<0.65)d.borrar(k,t);else d.sync(t);
    }
    for(let i=0;i<3;i++)for(const d of ds)d.sync(t+=10);
    assert.deepEqual(ds[0].datos(),ds[1].datos());assert.deepEqual(ds[1].datos(),ds[2].datos());
    for(const d of ds)assert.equal(S.pendientes(d.l),0);
    const vivosSrv=Object.entries(srv.filas).filter(([,f])=>!f.borrado).map(([k])=>k).sort();
    assert.deepEqual(Object.keys(ds[0].datos()).sort(),vivosSrv);
  }
});

test('validación: claves inválidas, valores enormes y estado local corrupto',()=>{
  assert.equal(S.editar(S.vacio(),'Mala Clave',{}, 1).error,'clave_invalida');
  assert.equal(S.editar(S.vacio(),'../x',{}, 1).error,'clave_invalida');
  assert.equal(S.editar(S.vacio(),'ok',{t:'x'.repeat(2000000)},1).error,'demasiado_grande');
  const n=S.norm({items:{'MAL':{valor:1},'bien':{valor:2,bv:'7',dirty:1},'__proto__':{valor:9}},conflictos:[{clave:'x'},{clave:'BAD'},5]});
  assert.deepEqual(Object.keys(n.items),['bien']);assert.equal(n.items.bien.bv,7);assert.equal(n.conflictos.length,1);
  assert.deepEqual(S.norm(null),S.vacio());assert.deepEqual(S.norm('x'),S.vacio());
  const r=S.fusionar(S.vacio(),{'MAL CLAVE':{valor:1,version:1,actualizado:1}},5);assert.equal(r.bajados.length,0);
  const grande={items:{g:{valor:{t:'x'.repeat(2000000)},bv:0,mod:1,dirty:true,del:false}},conflictos:[]};
  const rg=S.fusionar(grande,{},5);assert.equal(rg.subir.length,0);assert.equal(rg.rechazadas[0].motivo,'demasiado_grande');
});

test('no muta el estado que recibe',()=>{
  const l=S.editar(S.vacio(),'n',{t:'x'},1).l,antes=JSON.stringify(l);
  S.fusionar(l,{n:{valor:{t:'r'},version:3,actualizado:9}},5);S.borrar(l,'n',3);S.confirmar(l,{clave:'n',version:2});S.editar(l,'m',{},2);
  assert.equal(JSON.stringify(l),antes);
});

test('el conjunto de conflictos tiene tope',()=>{
  let l=S.vacio();
  for(let i=0;i<80;i++){const e=S.editar({items:{n:{valor:{t:'l'+i},bv:1,mod:1000+i,dirty:true,del:false}},conflictos:l.conflictos},'n',{t:'l'+i},1000+i).l;
    l=S.fusionar({items:{n:{...e.items.n,bv:1}},conflictos:l.conflictos},{n:{valor:{t:'r'+i},version:2+i,actualizado:1,borrado:false}},i).l;}
  assert.ok(l.conflictos.length<=50);
});

test('lectura incremental: lo que no llega no ha cambiado; lo pendiente se sube con su versión base', () => {
  const base = { items: {
    quieta: { valor: 1, bv: 3, mod: 1, dirty: false, del: false },
    editada: { valor: 2, bv: 4, mod: 9, dirty: true, del: false },
    borrada: { valor: 3, bv: 5, mod: 9, dirty: true, del: true },
    nueva: { valor: 4, bv: 0, mod: 9, dirty: true, del: false } }, conflictos: [] };
  const inc = S.fusionar(base, {}, 100, { incremental: true });
  assert.ok(inc.l.items.quieta);                                                         // sigue ahí
  const u = Object.fromEntries(inc.subir.map(x => [x.clave, x]));
  assert.equal(u.editada.base, 4);assert.equal(u.borrada.base, 5);assert.equal(u.borrada.borrado, true);assert.equal(u.nueva.base, 0);
  const completa = S.fusionar(base, {}, 100);                                           // lectura completa: lo que no está, ya no existe
  assert.equal(completa.l.items.quieta, undefined);
  assert.equal(completa.subir.find(x => x.clave === 'editada').base, 0);
  assert.equal(completa.l.items.borrada, undefined);
});

test('convergencia con lecturas incrementales y varios dispositivos', () => {
  let s = 777;const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let ronda = 0; ronda < 40; ronda++) {
    const srv = servidor();
    const mk = n => { const d = dispositivo(srv, n);d.since = 0;
      d.sync = t => {
        let completa = false;
        for (let i = 0; i < 6; i++) {
          const delta = Object.fromEntries(Object.entries(srv.leer()).filter(([, f]) => completa || f.actualizado > d.since));
          const r = S.fusionar(d.l, delta, t, { incremental: d.since > 0 && !completa });d.l = r.l;completa = false;
          for (const f of Object.values(delta)) d.since = Math.max(d.since, f.actualizado);
          if (!r.subir.length) return r;
          let rechazo = false;
          for (const u of r.subir) { const w = srv.escribir(u);if (w.ok) d.l = S.confirmar(d.l, { clave: u.clave, version: w.version });else rechazo = true; }
          if (!rechazo) return r;
          completa = true;
        }
      };
      return d; };
    const ds = [mk('a'), mk('b'), mk('c')];let t = 1;
    for (let paso = 0; paso < 25; paso++) {
      const d = ds[Math.floor(azar() * 3)], k = 'n' + Math.floor(azar() * 5), q = azar();t += 1 + Math.floor(azar() * 5);
      if (q < 0.5) d.editar(k, { t: 'v' + paso + d.nombre }, t);else if (q < 0.65) d.borrar(k, t);else d.sync(t);
    }
    for (let i = 0; i < 3; i++) for (const d of ds) d.sync(t += 10);
    assert.deepEqual(ds[0].datos(), ds[1].datos());assert.deepEqual(ds[1].datos(), ds[2].datos());
    const vivos = Object.entries(srv.filas).filter(([, f]) => !f.borrado).map(([k]) => k).sort();
    assert.deepEqual(Object.keys(ds[0].datos()).sort(), vivos);
    for (const d of ds) assert.equal(S.pendientes(d.l), 0);
  }
});

/* ---------- modo manual: control de versiones (los conflictos no se resuelven solos) ---------- */
function conConflicto(){
  // el servidor tiene la versión 2 de «nota:a» (otro dispositivo); aquí se editó sobre la 1 y aún no se ha subido
  let l=S.vacio();l={...l,items:{'nota:a':{valor:{t:'mía'},bv:1,mod:5000,dirty:true,del:false}}};
  const remoto={'nota:a':{valor:{t:'nube'},version:2,actualizado:4000,borrado:false}};
  return {l,remoto};
}
test('manual: si cambian los dos lados no se pisa nada, el conflicto queda abierto',()=>{
  const {l,remoto}=conConflicto(),r=S.fusionar(l,remoto,9000,{manual:true});
  assert.deepEqual(r.subir,[]);assert.deepEqual(r.bajados,[]);assert.deepEqual(r.conflictos,[]);assert.deepEqual(r.abiertos,['nota:a']);
  assert.deepEqual(r.l.items['nota:a'].valor,{t:'mía'});          // lo local intacto, aunque sea más reciente o más antiguo
  assert.equal(r.l.abiertos.length,1);assert.equal(r.l.abiertos[0].remoto.version,2);
  assert.equal(r.l.conflictos.length,0);                            // aún no hay copia perdida: nadie ha elegido
});
test('manual: lo más antiguo tampoco se pisa (antes ganaba el más reciente)',()=>{
  const {l,remoto}=conConflicto();remoto['nota:a'].actualizado=99999;
  const r=S.fusionar(l,remoto,9000,{manual:true});
  assert.deepEqual(r.l.items['nota:a'].valor,{t:'mía'});assert.equal(r.l.abiertos.length,1);
});
test('manual: en una lectura incremental el conflicto abierto se mantiene y no se intenta subir',()=>{
  const {l,remoto}=conConflicto(),a=S.fusionar(l,remoto,9000,{manual:true}),b=S.fusionar(a.l,{},9500,{manual:true,incremental:true});
  assert.deepEqual(b.subir,[]);assert.equal(b.l.abiertos.length,1);
});
test('manual: elegir «lo mío» sube sobre la versión actual del servidor y converge',()=>{
  const {l,remoto}=conConflicto(),a=S.fusionar(l,remoto,9000,{manual:true});
  const rs=S.resolver(a.l,'nota:a','mio',9100);assert.ok(rs.ok);assert.equal(rs.l.abiertos.length,0);
  const r=S.fusionar(rs.l,remoto,9200,{manual:true});
  assert.deepEqual(r.subir.map(u=>[u.clave,u.base,u.borrado]),[['nota:a',2,false]]);   // base = versión del servidor, así que el servidor lo acepta
  assert.deepEqual(r.subir[0].valor,{t:'mía'});
});
test('manual: elegir «la nube» trae lo del servidor y guarda lo local como copia recuperable',()=>{
  const {l,remoto}=conConflicto(),a=S.fusionar(l,remoto,9000,{manual:true});
  const rs=S.resolver(a.l,'nota:a','nube',9100);assert.ok(rs.ok);
  assert.deepEqual(rs.l.items['nota:a'].valor,{t:'nube'});assert.equal(rs.l.items['nota:a'].dirty,false);assert.equal(rs.l.items['nota:a'].bv,2);
  assert.deepEqual(rs.aplicar,{bajados:['nota:a'],borrados:[]});
  assert.equal(rs.l.conflictos.length,1);assert.equal(rs.l.conflictos[0].motivo,'descartada_local');assert.deepEqual(rs.l.conflictos[0].valor,{t:'mía'});
});
test('manual: borrado en la nube frente a edición local es conflicto; «la nube» borra aquí, «lo mío» lo resucita',()=>{
  const {l}=conConflicto(),remoto={'nota:a':{valor:null,version:2,actualizado:4000,borrado:true}};
  const a=S.fusionar(l,remoto,9000,{manual:true});assert.equal(a.l.abiertos.length,1);assert.deepEqual(a.subir,[]);
  const n=S.resolver(a.l,'nota:a','nube',9100);assert.ok(!n.l.items['nota:a']);assert.deepEqual(n.aplicar.borrados,['nota:a']);
  const m=S.resolver(a.l,'nota:a','mio',9100),r=S.fusionar(m.l,remoto,9200,{manual:true});
  assert.deepEqual(r.subir.map(u=>[u.clave,u.base]),[['nota:a',2]]);
});
test('manual: si ya no hay conflicto (el servidor volvió a coincidir) se cierra solo',()=>{
  const {l,remoto}=conConflicto(),a=S.fusionar(l,remoto,9000,{manual:true});
  const iguales={'nota:a':{valor:{t:'mía'},version:3,actualizado:6000,borrado:false}};
  const r=S.fusionar({...a.l,items:{'nota:a':{...a.l.items['nota:a'],dirty:false,bv:3}}},iguales,9100,{manual:true});
  assert.equal(r.l.abiertos.length,0);
});
test('resolver: sin conflicto o con elección inválida no hace nada',()=>{
  assert.equal(S.resolver(S.vacio(),'nota:a','mio',1).ok,false);
  const {l,remoto}=conConflicto(),a=S.fusionar(l,remoto,9000,{manual:true});
  assert.equal(S.resolver(a.l,'nota:a','otra',1).ok,false);
});
test('el modo por defecto (sin «manual») sigue resolviendo solo: gana el más reciente y guarda la otra',()=>{
  const {l,remoto}=conConflicto(),r=S.fusionar(l,remoto,9000);
  assert.deepEqual(r.conflictos,['nota:a']);assert.equal(r.l.abiertos.length,0);
});
