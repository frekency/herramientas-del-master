// Sesiones de campaña: activar la que toca, finalizarla y dejar un resumen opcional en el diario (index.html, bloque notas-core).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PAGE} from './lib.mjs';

const window={};new Function('window',PAGE.match(/<script id="notas-core">([\s\S]*?)<\/script>/)[1])(window);
const N=window.Notas;
const T0=Date.UTC(2026,10,20,20,0,0);
const ses=(nombre,estado='planeada',extra={})=>N.norm({tipo:'sesion',nombre,campos:{estado,fecha:'2026-11-20',...extra}});

test('una sesión nueva está planeada y sin hora',()=>{
  const s=ses('Sesión 1');assert.equal(s.campos.estado,'planeada');assert.equal(s.campos.inicio,'');assert.equal(N.activa([s]),null);
});
test('iniciar la sesión que toca la deja en curso con su hora',()=>{
  const a=ses('Sesión 1'),r=N.iniciarSesion([a],a.id,T0);
  assert.ok(r.ok);assert.equal(r.sesion.campos.estado,'en curso');assert.equal(r.sesion.campos.inicio,String(T0));
  assert.equal(N.activa(r.items).id,a.id);assert.equal(a.campos.estado,'planeada');   // el original no se toca
  assert.equal(N.minutosDe(r.sesion,T0+75*60000),75);
});
test('solo puede haber una sesión en curso',()=>{
  const a=ses('A'),b=ses('B'),r=N.iniciarSesion([a,b],a.id,T0);
  const x=N.iniciarSesion(r.items,b.id,T0+1);assert.equal(x.ok,false);assert.equal(x.error,'otra_en_curso');
  assert.equal(N.iniciarSesion(r.items,a.id).error,'ya_en_curso');
  assert.equal(N.nuevaSesion(r.items,'C').error,'otra_en_curso');
});
test('solo se inicia una sesión planeada',()=>{
  const j=ses('Vieja','jugada'),c=ses('Cancelada','cancelada'),n=N.nuevo('npc','Ana');
  for(const it of [j,c])assert.equal(N.iniciarSesion([it],it.id).error,'no_planeada');
  assert.equal(N.iniciarSesion([n],n.id).error,'no_existe');assert.equal(N.iniciarSesion([],'x').error,'no_existe');
});
test('nueva sesión: se crea con nombre automático y arranca',()=>{
  const a=ses('Una','jugada'),r=N.nuevaSesion([a],'',T0);
  assert.ok(r.ok);assert.equal(r.sesion.nombre,'Sesión 2');assert.equal(r.sesion.campos.estado,'en curso');assert.equal(r.sesion.campos.fecha.length,10);
  assert.equal(N.nuevaSesion([],'  La mina  ',T0).sesion.nombre,'La mina');
});
test('finalizar con resumen: la sesión pasa a jugada y el diario recibe su entrada',()=>{
  const a=ses('La mina'),r=N.iniciarSesion([a],a.id,T0),f=N.finalizarSesion(r.items,a.id,{resumen:'  Bajaron a la mina.  ',compartir:true,ahora:T0+90*60000});
  assert.ok(f.ok);assert.equal(f.minutos,90);assert.equal(f.sesion.campos.estado,'jugada');assert.equal(f.sesion.campos.fin,String(T0+90*60000));
  assert.equal(N.activa(f.items),null);
  assert.equal(f.diario.tipo,'diario');assert.equal(f.diario.texto,'Bajaron a la mina.');assert.equal(f.diario.visibilidad,'jugadores');assert.equal(f.diario.campos.sesion,'La mina');
  assert.equal(f.items.length,2);
});
test('finalizar sin resumen no crea entrada y el diario es privado por defecto',()=>{
  const a=ses('A'),r=N.iniciarSesion([a],a.id,T0),f=N.finalizarSesion(r.items,a.id,{resumen:'   ',ahora:T0});
  assert.ok(f.ok);assert.equal(f.diario,null);assert.equal(f.items.length,1);
  const g=N.finalizarSesion(r.items,a.id,{resumen:'x',ahora:T0});assert.equal(g.diario.visibilidad,'dm');
});
test('no se finaliza lo que no está en curso',()=>{
  const a=ses('A');assert.equal(N.finalizarSesion([a],a.id).error,'no_en_curso');assert.equal(N.finalizarSesion([],'z').error,'no_existe');
});
test('si hubiera varias en curso, manda la más reciente; el estado «en curso» sobrevive a guardar y cargar',()=>{
  const a=ses('A','en curso',{inicio:'100'}),b=ses('B','en curso',{inicio:'200'});
  assert.equal(N.activa([a,b]).nombre,'B');
  const l=N.cargar(N.guardar([a]));assert.equal(l[0].campos.estado,'en curso');assert.equal(l[0].campos.inicio,'100');
});

test('calendario: semanas completas desde el lunes con las sesiones de cada día',()=>{
  // noviembre de 2026 empieza en domingo: la primera semana arranca el lunes 26 de octubre
  const a=ses('A'),b=ses('B','jugada',{fecha:'2026-11-20'}),c=ses('C','planeada',{fecha:'2026-11-27'});
  const cel=N.calendario([a,b,c],2026,11);
  assert.equal(cel.length%7,0);assert.equal(cel[0].fecha,'2026-10-26');assert.ok(cel[0].fuera);
  const d20=cel.find(x=>x.fecha==='2026-11-20');assert.equal(d20.sesiones.length,2);assert.ok(!d20.fuera);
  assert.equal(cel.find(x=>x.fecha==='2026-11-27').sesiones[0].estado,'planeada');
  assert.equal(cel.filter(x=>!x.fuera).length,30);
  assert.equal(N.calendario([],2024,2).filter(x=>!x.fuera).length,29);   // bisiesto
});
test('la sesión de hoy es la planeada con la fecha de hoy',()=>{
  const a=ses('Ayer','planeada',{fecha:'2026-11-19'}),b=ses('Hoy','planeada',{fecha:'2026-11-20'}),c=ses('Jugada','jugada',{fecha:'2026-11-20'});
  assert.equal(N.sesionDeHoy([a,b,c],'2026-11-20').nombre,'Hoy');assert.equal(N.sesionDeHoy([a,c],'2026-11-20'),null);
});
test('estadísticas: solo cuentan la duración las sesiones iniciadas y finalizadas con los botones',()=>{
  const j1=ses('1','jugada',{inicio:String(T0),fin:String(T0+120*60000)}),j2=ses('2','jugada',{inicio:String(T0),fin:String(T0+60*60000)}),j3=ses('3','jugada'),p=ses('4');
  const e=N.estadisticas([j1,j2,j3,p]);
  assert.deepEqual([e.jugadas,e.planeadas,e.conTiempo,e.minutos,e.media,e.maxima],[3,1,2,180,90,120]);
  assert.deepEqual(N.estadisticas([]),{jugadas:0,planeadas:0,conTiempo:0,minutos:0,media:0,maxima:0});
});
test('al finalizar se puede dejar planeada la próxima sesión',()=>{
  const a=ses('A'),r=N.iniciarSesion([a],a.id,T0),f=N.finalizarSesion(r.items,a.id,{proxima:'2026-12-04',ahora:T0});
  assert.equal(f.proxima.campos.estado,'planeada');assert.equal(f.proxima.campos.fecha,'2026-12-04');assert.equal(f.proxima.nombre,'Sesión 2');assert.equal(f.items.length,2);
  const g=N.finalizarSesion(f.items.map(i=>i.id===a.id?{...i,campos:{...i.campos,estado:'en curso'}}:i),a.id,{proxima:'2026-12-04',ahora:T0});
  assert.equal(g.proxima,null);   // ya hay una planeada ese día
  assert.equal(N.finalizarSesion(r.items,a.id,{proxima:'mañana',ahora:T0}).proxima,null);
  assert.equal(N.finalizarSesion(r.items,a.id,{ahora:T0}).proxima,null);
});

test('lo que una sesión menciona: enlaces, nombres en el plan y escenas, y un nivel más',()=>{
  const ana=N.norm({tipo:'npc',nombre:'Ana la herrera',campos:{lugar:'Faro Viejo'}}),faro=N.norm({tipo:'lugar',nombre:'Faro Viejo'}),tienda=N.norm({tipo:'tienda',nombre:'Fragua',campos:{dueno:'Ana la herrera'}});
  const otro=N.norm({tipo:'npc',nombre:'Nadie importante'}),nota=N.norm({tipo:'nota',nombre:'Faro Viejo notas'});
  const s=N.norm({tipo:'sesion',nombre:'S1',texto:'Visitan la [[Fragua]] del pueblo.',campos:{estado:'planeada',escenas:[{t:'Hablar con Ana la herrera',ok:false}]}});
  const r=N.referenciados([s,ana,faro,tienda,otro,nota],s).map(x=>x.nombre).sort();
  assert.deepEqual(r,['Ana la herrera','Faro Viejo','Fragua']);   // el lugar entra por el campo del PNJ; las notas y lo no mencionado, no
});
