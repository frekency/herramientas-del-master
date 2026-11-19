// Eventos de encuentro (index.html, bloque ev-core): disparadores por ronda y tiempo, reloj con pausa, posponer y descartar.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PAGE} from './lib.mjs';

const window={};new Function('window',PAGE.match(/<script id="ev-core">([\s\S]*?)<\/script>/)[1])(window);
const E=window.Eventos;
const ev=(id,cuando,extra={})=>({id,n:'Evento '+id,cuando,...extra});
const SEG=1000;

test('norm: sanea tipos, límites y refuerzos',()=>{
  assert.equal(E.norm(null),null);
  const e=E.norm({id:'../mal',n:'x'.repeat(500),cuando:{tipo:'hack',ronda:999,cada:-4,seg:0},aviso:{texto:'t'.repeat(900),mesa:1},cuentaMesa:true,imagen:'<img>',
    refuerzos:[{name:'Orco',cant:999,hp:-3,ac:'x',fcolor:'rojo'},null,'x']});
  assert.match(e.id,/^e[a-z0-9]+$/);assert.equal(e.n.length,80);assert.equal(e.cuando.tipo,'manual');assert.equal(e.cuando.ronda,99);assert.equal(e.cuando.cada,0);
  assert.equal(e.aviso.texto.length,400);assert.equal(e.aviso.mesa,true);assert.equal(e.cuentaMesa,false);assert.equal(e.imagen,'');
  assert.equal(e.refuerzos.length,1);assert.deepEqual([e.refuerzos[0].cant,e.refuerzos[0].hp,e.refuerzos[0].ac,e.refuerzos[0].fcolor],[40,1,0,'#d0453c']);
  assert.equal(E.normLista(Array(50).fill({n:'a'})).length,20);
});

test('por ronda: se ofrece una vez al llegar a la ronda y no se repite',()=>{
  const s0=E.crear([ev('a',{tipo:'ronda',ronda:3})]);
  let r=E.revisar(s0,{ronda:2,activo:true,ahora:0});assert.deepEqual(r.nuevos,[]);
  r=E.revisar(r.s,{ronda:3,activo:true,ahora:0});assert.deepEqual(r.nuevos,['a']);assert.deepEqual(r.s.pend,['a']);
  r=E.revisar(r.s,{ronda:3,activo:true,ahora:0});assert.deepEqual(r.nuevos,[]);assert.deepEqual(r.s.pend,['a']);   // no se duplica en la cola
  const d=E.disparar(r.s,'a',{ronda:3,ahora:0});assert.ok(d.ok);assert.deepEqual(d.s.pend,[]);
  assert.deepEqual(E.revisar(d.s,{ronda:4,activo:true,ahora:0}).nuevos,[]);                                           // ya ocurrió
});

test('por ronda: si el combate salta rondas, se ofrece igualmente; sin combate activo no se ofrece',()=>{
  const s=E.crear([ev('a',{tipo:'ronda',ronda:2})]);
  assert.deepEqual(E.revisar(s,{ronda:5,activo:true,ahora:0}).nuevos,['a']);
  assert.deepEqual(E.revisar(s,{ronda:5,activo:false,ahora:0}).nuevos,[]);
});

test('repetido «cada N rondas desde la X»',()=>{
  let s=E.crear([ev('a',{tipo:'ronda',ronda:2,cada:2})]);const vistos=[];
  for(let r=1;r<=8;r++){const x=E.revisar(s,{ronda:r,activo:true,ahora:0});s=x.s;if(x.nuevos.length){vistos.push(r);s=E.disparar(s,'a',{ronda:r,ahora:0}).s;}}
  assert.deepEqual(vistos,[2,4,6,8]);
});

test('posponer: vuelve a la ronda siguiente; descartar: no vuelve',()=>{
  let s=E.revisar(E.crear([ev('a',{tipo:'ronda',ronda:2})]),{ronda:2,activo:true,ahora:0}).s;
  s=E.posponer(s,'a',{ronda:2,ahora:0}).s;assert.deepEqual(s.pend,[]);
  assert.deepEqual(E.revisar(s,{ronda:2,activo:true,ahora:0}).nuevos,[]);
  const r=E.revisar(s,{ronda:3,activo:true,ahora:0});assert.deepEqual(r.nuevos,['a']);
  const d=E.descartar(r.s,'a').s;assert.deepEqual(d.pend,[]);
  for(const n of [4,5,9])assert.deepEqual(E.revisar(d,{ronda:n,activo:true,ahora:0}).nuevos,[]);
  assert.equal(E.descartar(d,'zzz').error,'no_existe');assert.equal(E.posponer(d,'zzz',{}).error,'no_existe');assert.equal(E.disparar(d,'zzz',{}).error,'no_existe');
});

test('tiempo real: el reloj cuenta solo mientras corre y respeta la pausa',()=>{
  let s=E.crear([ev('t',{tipo:'tiempo',seg:600})]);
  s=E.iniciar(s,0);assert.equal(E.transcurrido(s,300*SEG),300);
  assert.deepEqual(E.revisar(s,{ronda:1,activo:true,ahora:599*SEG}).nuevos,[]);
  s=E.pausar(s,300*SEG);assert.equal(E.transcurrido(s,9999*SEG),300);                 // en pausa no avanza
  assert.deepEqual(E.revisar(s,{ronda:1,activo:true,ahora:9999*SEG}).nuevos,[]);
  s=E.iniciar(s,1000*SEG);assert.equal(E.transcurrido(s,1250*SEG),550);
  assert.deepEqual(E.revisar(s,{ronda:1,activo:true,ahora:1300*SEG}).nuevos,['t']);   // 300+300 = 600
});

test('al cargar (cerrar y abrir la app) el reloj queda en pausa y conserva lo acumulado',()=>{
  let s=E.iniciar(E.crear([ev('t',{tipo:'tiempo',seg:600})]),0);
  const guardado=JSON.parse(JSON.stringify(E.pausar(s,120*SEG)));guardado.reloj.corre=true;   // como si se hubiera cerrado corriendo
  const c=E.normEstado(guardado);assert.equal(c.reloj.corre,false);assert.equal(c.reloj.acum,120);
  assert.equal(E.normEstado(JSON.parse(JSON.stringify(E.iniciar(s,5*SEG)))).reloj.corre,false);
});

test('manual: nunca se ofrece solo, pero se puede disparar siempre y devuelve su efecto',()=>{
  const s=E.crear([ev('m',{tipo:'manual'},{aviso:{texto:'Se derrumba la cueva',mesa:true},refuerzos:[{name:'Orco',cant:2,hp:15}],nota:'CD 13 Des'})]);
  assert.deepEqual(E.revisar(s,{ronda:50,activo:true,ahora:1e9}).nuevos,[]);
  const d=E.disparar(s,'m',{ronda:4,ahora:0});assert.ok(d.ok);
  assert.equal(d.efecto.aviso.texto,'Se derrumba la cueva');assert.equal(d.efecto.refuerzos[0].cant,2);assert.equal(d.efecto.nota,'CD 13 Des');assert.equal(d.s.hecho.m.n,1);
  assert.equal(E.disparar(d.s,'m',{ronda:5,ahora:0}).s.hecho.m.n,2);                  // se puede repetir
});

test('cuenta atrás para la mesa: el evento de tiempo visible más cercano',()=>{
  let s=E.crear([ev('a',{tipo:'tiempo',seg:600},{cuentaMesa:true}),ev('b',{tipo:'tiempo',seg:300},{cuentaMesa:true}),ev('c',{tipo:'tiempo',seg:60},{cuentaMesa:false}),ev('r',{tipo:'ronda',ronda:2},{cuentaMesa:true})]);
  assert.equal(E.cuentaAtras(s,0).n,'Evento b');assert.equal(E.cuentaAtras(s,0).seg,300);assert.equal(E.cuentaAtras(s,0).pausa,true);
  s=E.iniciar(s,0);assert.equal(E.cuentaAtras(s,100*SEG).seg,200);assert.equal(E.cuentaAtras(s,100*SEG).pausa,false);
  assert.equal(E.cuentaAtras(s,9999*SEG).seg,0);
  const t=E.revisar(s,{ronda:1,activo:true,ahora:301*SEG});s=E.disparar(t.s,'b',{ronda:1,ahora:301*SEG}).s;
  assert.equal(E.cuentaAtras(s,301*SEG).n,'Evento a');                                // el ya ocurrido no cuenta
  s=E.descartar(s,'a').s;assert.equal(E.cuentaAtras(s,301*SEG),null);
});

test('posponer un evento de tiempo lo retrasa un minuto',()=>{
  let s=E.iniciar(E.crear([ev('t',{tipo:'tiempo',seg:60})]),0);
  s=E.revisar(s,{ronda:1,activo:true,ahora:61*SEG}).s;assert.deepEqual(s.pend,['t']);
  s=E.posponer(s,'t',{ronda:1,ahora:61*SEG}).s;
  assert.deepEqual(E.revisar(s,{ronda:1,activo:true,ahora:100*SEG}).nuevos,[]);
  assert.deepEqual(E.revisar(s,{ronda:1,activo:true,ahora:122*SEG}).nuevos,['t']);
});

test('normEstado: descarta lo que no encaja y no muta lo recibido',()=>{
  const s=E.crear([ev('a',{tipo:'ronda',ronda:2})]),antes=JSON.stringify(s);
  E.revisar(s,{ronda:3,activo:true,ahora:0});E.disparar(s,'a',{});E.posponer(s,'a',{ronda:1});E.descartar(s,'a');E.iniciar(s,5);E.pausar(s,9);
  assert.equal(JSON.stringify(s),antes);
  const n=E.normEstado({lista:[ev('a',{tipo:'ronda',ronda:2})],hecho:{zzz:{n:1},a:{n:'x',r:-4}},descartado:{q:true},pend:['a','a','nada'],reloj:{acum:-5,corre:true}});
  assert.deepEqual(Object.keys(n.hecho),['a']);assert.deepEqual(n.descartado,{});assert.deepEqual(n.pend,['a']);assert.equal(n.reloj.acum,0);assert.equal(n.reloj.corre,false);
  assert.deepEqual(E.normEstado(null).lista,[]);assert.deepEqual(E.normEstado('x').pend,[]);
});

test('cuentas atrás sueltas: cuentan, se pausan, terminan solas y se pueden enseñar en la mesa', () => {
  const C = window.Cuentas;
  let c = C.nueva('Trampa de agujas', 120);
  assert.equal(C.restante(c, 0), 120);assert.equal(c.mesa, false);
  c = C.iniciar(c, 0);assert.equal(C.restante(c, 30 * SEG), 90);
  c = C.pausar(c, 30 * SEG);assert.equal(C.restante(c, 9999 * SEG), 90);                  // en pausa no avanza
  c = C.iniciar(c, 100 * SEG);assert.equal(C.restante(c, 160 * SEG), 30);
  const r = C.actualizar([c], 300 * SEG);
  assert.deepEqual(r.terminadas, [c.id]);assert.equal(r.lista[0].corre, false);assert.equal(C.restante(r.lista[0], 999 * SEG), 0);
  assert.equal(C.iniciar(r.lista[0], 400 * SEG).corre, false);                           // una terminada no arranca sin reiniciar
  assert.equal(C.restante(C.reiniciar(r.lista[0]), 0), 120);
  assert.deepEqual(C.actualizar(r.lista, 400 * SEG).terminadas, []);                     // no avisa dos veces
});

test('cuentas atrás: solo van a la mesa las elegidas, con tope; cargar las deja en pausa', () => {
  const C = window.Cuentas;
  const l = [1, 2, 3, 4, 5, 6].map(i => ({ ...C.nueva('c' + i, 60 * i), mesa: i !== 2 }));
  const m = C.paraMesa(l, 0);
  assert.equal(m.length, 4);assert.ok(!m.some(x => x.n === 'c2'));
  assert.deepEqual(m[0], { n: 'c1', seg: 60, pausa: true, fin: false });
  const guardada = JSON.parse(JSON.stringify([{ ...C.iniciar(C.nueva('p', 600), 0), acum: 120 }]));
  const n = C.normLista(guardada);assert.equal(n[0].corre, false);assert.equal(n[0].acum, 120);
  assert.equal(C.normLista(Array(30).fill({ n: 'x', seg: 5 })).length, 8);
  assert.equal(C.nueva('x'.repeat(200), 99999999).seg, 86400);assert.equal(C.nueva('', 0).seg, 1);assert.equal(C.nueva('', 5).n, 'Cuenta atrás');
  assert.deepEqual(C.normLista('x'), []);
});
