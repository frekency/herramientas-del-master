// Reloj de campaña y calendario de Harptos (index.html, bloque reloj-core).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PAGE} from './lib.mjs';

const window={};new Function('window',PAGE.match(/<script id="reloj-core">([\s\S]*?)<\/script>/)[1])(window);
const H=window.Harptos;

test('el año tiene 365 días, 366 con Escudo-encuentro cada 4 años',()=>{
  assert.equal(H.diasAnio(1492),366);assert.equal(H.diasAnio(1491),365);
  assert.equal(H.aDia({anio:1493,mes:1,dia:1})-H.aDia({anio:1492,mes:1,dia:1}),366);
  assert.equal(H.aDia({anio:1492,mes:1,dia:1})-H.aDia({anio:1491,mes:1,dia:1}),365);
});
test('ida y vuelta fecha ↔ día para todo el año, bisiesto o no',()=>{
  for(const a of [1491,1492]){const ini=H.aDia({anio:a,mes:1,dia:1});
    for(let i=0;i<H.diasAnio(a);i++){const f=H.fecha(ini+i);assert.equal(f.anio,a);assert.equal(H.aDia(f),ini+i);}}
});
test('fiestas entre meses y fecha en texto',()=>{
  const f=H.fecha(H.aDia({anio:1491,mes:1,dia:30})+1);assert.equal(f.fiesta,'midwinter');assert.equal(H.texto(f),'Pleno Invierno, 1491 DR');
  const g=H.fecha(H.aDia({anio:1491,mes:1,dia:30})+2);assert.equal(g.mes,2);assert.equal(g.dia,1);
  assert.equal(H.texto(H.fecha(H.aDia({anio:1491,mes:3,dia:21}))),'21 de Ches, 1491 DR');
  assert.equal(H.fecha(H.aDia({anio:1492,mes:7,dia:30})+2).fiesta,'shieldmeet');
  assert.notEqual(H.fecha(H.aDia({anio:1491,mes:7,dia:30})+2).fiesta,'shieldmeet');
});
test('estaciones y decenas',()=>{
  assert.equal(H.fecha(H.aDia({anio:1491,mes:1,dia:1})).estacion,'invierno');
  assert.equal(H.fecha(H.aDia({anio:1491,mes:3,dia:15})).estacion,'primavera');
  assert.equal(H.fecha(H.aDia({anio:1491,mes:7,dia:15})).estacion,'verano');
  assert.equal(H.fecha(H.aDia({anio:1491,mes:10,dia:15})).estacion,'otoño');
  assert.equal(H.fecha(H.aDia({anio:1491,mes:5,dia:11})).decena,2);
  assert.equal(H.fecha(H.aDia({anio:1491,mes:3,dia:1})-1).fiesta,'greengrass');
});
test('descansos suman horas y el largo se puede repetir 24 h después',()=>{
  let r=H.nuevo(1491,3,1,8);const t0=r.min;
  r=H.corto(r);assert.equal(r.min,t0+60);
  assert.equal(H.puedeLargo(r),true);
  r=H.largo(r);assert.equal(r.min,t0+60+480);assert.equal(H.puedeLargo(r),false);
  assert.equal(H.proximoLargo(r),t0+60+1440);
  r=H.sumar(r,16*60,'Viaje');assert.equal(H.puedeLargo(r),true);
  assert.equal(r.log.length,3);
});
test('hora, duración y clima por estación',()=>{
  assert.equal(H.hora(8*60+5),'08:05');assert.equal(H.desc(1500),'1 d 1 h');
  assert.equal(H.clima('invierno',1),'Ventisca');assert.equal(H.clima('verano',20),'Ola de calor');
  for(const e of ['invierno','primavera','verano','otoño'])assert.equal(H.CLIMA[e].length,20);
});
