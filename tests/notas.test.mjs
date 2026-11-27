// Notas de campaña (index.html, bloque notas-core): modelo, saneado, Markdown seguro y enlaces [[…]].
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PAGE} from './lib.mjs';

const BLOQUE=PAGE.match(/<script id="notas-core">([\s\S]*?)<\/script>/)[1];
const window={};new Function('window',BLOQUE)(window);
const N=window.Notas;
const item=(tipo,nombre,extra={})=>N.norm({id:'i'+nombre.replace(/\W/g,''),tipo,nombre,...extra});

test('norm: rechaza tipos desconocidos y limpia campos que no son del tipo',()=>{
  assert.equal(N.norm({tipo:'hack',nombre:'x'}),null);
  assert.equal(N.norm(null),null);
  const n=N.norm({tipo:'npc',nombre:'Elda',campos:{rol:'Posadera',estado:'activa',__proto__:{x:1},criatura:'my:Commoner'}});
  assert.deepEqual(Object.keys(n.campos).sort(),['acompana','actitud','aspecto','criatura','equipo','eventos','inventario','lugar','publico','quiere','ref','rol','secreto','stats']);
  assert.equal(n.campos.rol,'Posadera');
});

test('norm: estadísticas, inventario y acompañar de un PNJ se limpian',()=>{
  const n=N.norm({tipo:'npc',nombre:'Brisa',campos:{acompana:1,inventario:[{n:'Daga',p:'2 po',c:'1'},{n:''}],stats:{ca:'15',pg:-4,bi:99,vel:'9 m',ab:[10,'x',40,null],ataques:'Estoque',notas:'n',extra:'no'}}});
  assert.equal(n.campos.acompana,true);
  assert.equal(n.campos.inventario.length,1);
  const s=n.campos.stats;
  assert.deepEqual([s.ca,s.pg,s.bi],[15,1,30]);
  assert.deepEqual(s.ab,[10,null,30,null,null,null]);
  assert.equal(s.extra,undefined);
  const v=N.norm({tipo:'npc',nombre:'x'});
  assert.equal(v.campos.acompana,false);assert.equal(v.campos.stats.ca,null);assert.equal(v.campos.stats.ab.length,6);
  assert.equal(N.norm({tipo:'npc',nombre:'x',campos:{stats:'basura'}}).campos.stats.ataques,'');
});

test('norm: estados válidos por tipo y listas saneadas',()=>{
  assert.equal(N.norm({tipo:'mision',nombre:'m',campos:{estado:'hackeada'}}).campos.estado,'pendiente');
  assert.equal(N.norm({tipo:'mision',nombre:'m',campos:{estado:'activa'}}).campos.estado,'activa');
  const m=N.norm({tipo:'mision',nombre:'m',campos:{objetivos:[{t:'A',ok:1},{t:'',ok:false},'x',null]}});
  assert.deepEqual(m.campos.objetivos,[{t:'A',ok:true}]);
  const t=N.norm({tipo:'tienda',nombre:'t',campos:{inventario:[{n:'Poción',p:'50 po',c:'3'},{n:'',p:'1'}]}});
  assert.deepEqual(t.campos.inventario,[{n:'Poción',p:'50 po',c:'3'}]);
});

test('norm: solo imágenes data: png/jpeg/webp y con tope de tamaño',()=>{
  assert.equal(N.norm({tipo:'npc',nombre:'a',img:'data:image/png;base64,AAAA'}).img,'data:image/png;base64,AAAA');
  assert.equal(N.norm({tipo:'npc',nombre:'a',img:'data:image/svg+xml;base64,AAAA'}).img,null,'SVG puede llevar script');
  assert.equal(N.norm({tipo:'npc',nombre:'a',img:'javascript:alert(1)'}).img,null);
  assert.equal(N.norm({tipo:'npc',nombre:'a',img:'https://x.test/a.png'}).img,null);
  assert.equal(N.norm({tipo:'npc',nombre:'a',img:'data:image/png;base64,'+'A'.repeat(500000)}).img,null);
});

test('cargar/guardar: ida y vuelta, ids únicos y JSON roto no rompe',()=>{
  const a=item('lugar','Faro'),b=item('npc','Marta');
  const back=N.cargar(N.guardar([a,b,{...a}]));
  assert.equal(back.length,2);
  assert.deepEqual(N.cargar('{no es json'),[]);
  assert.deepEqual(N.cargar(null),[]);
  assert.deepEqual(N.cargar('{"items":"x"}'),[]);
  assert.match(N.norm({tipo:'nota',nombre:'x',id:'../../etc'}).id,/^n[a-z0-9]+$/,'un id raro se sustituye');
});

test('md: escapa todo el HTML',()=>{
  const h=N.md('<script>alert(1)</script> <img src=x onerror=alert(1)> **ok**');
  assert.ok(!/<script|<img/i.test(h));
  assert.match(h,/&lt;script&gt;/);
  assert.match(h,/<b>ok<\/b>/);
});

test('md: estructura (títulos, listas, citas) y saltos',()=>{
  const h=N.md('# Título\n\nUna línea\notra\n\n- uno\n- dos\n\n1. a\n2. b\n\n> cita\n\n---');
  assert.match(h,/<h3>Título<\/h3>/);
  assert.match(h,/<p>Una línea<br>otra<\/p>/);
  assert.match(h,/<ul><li>uno<\/li><li>dos<\/li><\/ul>/);
  assert.match(h,/<ol><li>a<\/li><li>b<\/li><\/ol>/);
  assert.match(h,/<blockquote>cita<\/blockquote>/);
  assert.match(h,/<hr>/);
});

test('md: [[enlaces]] resueltos, con alias y pendientes de crear',()=>{
  const marta=item('npc','Marta');
  const h=N.md('Habla con [[marta]] o con [[Marta|la posadera]]. Visita [[Faro Viejo]].',[marta]);
  assert.match(h,new RegExp(`<a class="wl" href="#campana/npc/${marta.id}">marta</a>`));
  assert.match(h,/>la posadera<\/a>/);
  assert.match(h,/class="wl nuevo"[^>]*data-nuevo="Faro Viejo"/);
});

test('md: un nombre malicioso en un enlace no abre atributos ni etiquetas',()=>{
  const h=N.md('[[x" onmouseover="alert(1)]] [[<b>]]');
  const tags=h.match(/<[^>]+>/g)||[];
  for(const g of tags)assert.match(g,/^<\/?(p|a|b|i|br|code)( [a-z-]+="[^"]*")*>$/,'etiqueta inesperada: '+g);
  assert.ok(!/<b>\]/.test(h));
});

test('retroenlaces: quién menciona a este elemento (texto y campos)',()=>{
  const marta=item('npc','Marta'),faro=item('lugar','Faro',{texto:'Vive [[Marta]]'});
  const tienda=item('tienda','Mercado',{campos:{dueno:'marta'}}),otra=item('nota','Otra',{texto:'nada'});
  const r=N.retroenlaces([marta,faro,tienda,otra],marta).map(x=>x.nombre).sort();
  assert.deepEqual(r,['Faro','Mercado']);
  assert.deepEqual(N.retroenlaces([marta],marta),[]);
});

test('buscar: por nombre y por contenido, sin distinguir mayúsculas',()=>{
  const a=item('npc','Marta',{texto:'Tiene una llave'}),b=item('lugar','Faro');
  assert.deepEqual(N.buscar([a,b],'LLAVE').map(x=>x.nombre),['Marta']);
  assert.deepEqual(N.buscar([a,b],'far').map(x=>x.nombre),['Faro']);
  assert.equal(N.buscar([a,b],'').length,2);
});

test('md auto: las menciones por nombre se convierten en enlaces',()=>{
  const marta=item('npc','Marta'),faro=item('lugar','Faro Viejo'),faro2=item('lugar','Faro');
  const h=N.md('Marta vive en el faro viejo, junto al Faro.',[marta,faro,faro2],{auto:true});
  assert.match(h,new RegExp('<a class="wl auto" href="#campana/npc/'+marta.id+'">Marta</a>'));
  assert.match(h,/>faro viejo<\/a>/,'gana el nombre más largo');
  assert.match(h,/>Faro<\/a>\./);
});

test('md auto: no enlaza dentro de palabras, de código ni de enlaces ya hechos; ni a sí mismo',()=>{
  const ana=item('npc','Ana'),mar=item('lugar','Mar');
  const h=N.md('Banana y Anabel, `Mar` y [[Mar|el mar]], pero Mar a secas sí.',[ana,mar],{auto:true});
  assert.ok(!/>Ana<\/a>/.test(h),'Ana dentro de Banana/Anabel no cuenta');
  assert.equal((h.match(/class="wl auto"/g)||[]).length,1,'solo el «Mar» suelto');
  assert.match(h,/<code>Mar<\/code>/);
  const h2=N.md('Ana saluda a Ana.',[ana],{auto:true,self:ana.id});
  assert.ok(!/class="wl/.test(h2),'un elemento no se enlaza a sí mismo');
});

test('md auto: nombres cortos o con símbolos no rompen el HTML',()=>{
  const x=item('nota','amp'),y=item('nota','Tom & Jerry'),z=item('nota','ab');
  const h=N.md('Tom & Jerry & amp; &amp; ab',[x,y,z],{auto:true});
  assert.ok(!/&<a|&[a-z#0-9]*<a/.test(h),'no se parte una entidad HTML');
  assert.equal(h.replace(/<[^>]+>/g,''),'Tom &amp; Jerry &amp; amp; &amp;amp; ab','el texto visible no cambia');
  assert.match(h,/>Tom &amp; Jerry<\/a>/);
  assert.ok(!/>ab<\/a>/.test(h),'menos de 3 letras: no se enlaza');
});

test('retroenlaces: también cuenta la mención por nombre sin corchetes',()=>{
  const marta=item('npc','Marta'),faro=item('lugar','Faro',{texto:'Aquí trabaja marta cada día'}),otro=item('nota','Smartphone',{texto:'smartphone'});
  assert.deepEqual(N.retroenlaces([marta,faro,otro],marta).map(x=>x.nombre),['Faro']);
});

test('visibilidad: por defecto solo el máster; valores válidos; el antiguo «publico» pasa a jugadores',()=>{
  assert.equal(N.norm({tipo:'nota',nombre:'a'}).visibilidad,'dm');
  assert.equal(N.norm({tipo:'nota',nombre:'a',visibilidad:'enlace'}).visibilidad,'enlace');
  assert.equal(N.norm({tipo:'nota',nombre:'a',visibilidad:'todos'}).visibilidad,'dm','valor desconocido: se cierra');
  assert.equal(N.norm({tipo:'nota',nombre:'a',publico:true}).visibilidad,'jugadores');
  assert.ok(!('publico' in N.norm({tipo:'nota',nombre:'a',publico:true})));
});

test('sesiones: encuentros enlazados por id, sin repetidos ni ids raros',()=>{
  const s=N.norm({tipo:'sesion',nombre:'s',campos:{encuentros:['abc','abc','../x','def',5,null]}});
  assert.deepEqual(s.campos.encuentros,['abc','def']);
  assert.deepEqual(N.norm({tipo:'sesion',nombre:'s'}).campos.encuentros,[]);
  assert.ok(!('encuentros' in N.norm({tipo:'npc',nombre:'n',campos:{encuentros:['abc']}}).campos));
});

test('sesión: resumen del máster y resumen para jugadores; siempre es del máster',()=>{
  const s=N.norm({tipo:'sesion',nombre:'s',visibilidad:'jugadores',campos:{resumen:'R'.repeat(20000),publico:'P'.repeat(20000)}});
  assert.equal(s.visibilidad,'dm');assert.equal(s.campos.resumen.length,20000);assert.equal(s.campos.publico.length,20000);
  assert.equal(N.norm({tipo:'sesion',nombre:'s'}).campos.resumen,'');
});

test('puzzle: campos saneados y siempre del máster',()=>{
  const p=N.norm({tipo:'puzzle',nombre:'Cofre',visibilidad:'jugadores',campos:{estado:'raro',solucion:'1-2-3',pistas:[{t:'Mira el reloj',ok:true},{t:'x',ok:false}],jugable:1,respuesta:'123'}});
  assert.equal(p.visibilidad,'dm');assert.equal(p.campos.estado,'pendiente');assert.equal(p.campos.pistas.length,2);assert.equal(p.campos.jugable,true);
  assert.ok(N.TIPOS.some(t=>t[0]==='puzzle'));
});

test('NPC: token propio, solo imagen válida y pequeña; otros tipos no lo guardan',()=>{
  const ok='data:image/webp;base64,AAAA';
  assert.equal(N.norm({tipo:'npc',nombre:'Brisa',tok:ok}).tok,ok);
  assert.equal(N.norm({tipo:'npc',nombre:'Brisa',tok:'javascript:alert(1)'}).tok,undefined);
  assert.equal(N.norm({tipo:'npc',nombre:'Brisa',tok:'data:image/webp;base64,'+'A'.repeat(70000)}).tok,undefined);
  assert.equal(N.norm({tipo:'lugar',nombre:'Torre',tok:ok}).tok,undefined);
});

test('PNJ: la clase de referencia se limpia y acota',()=>{
  const n=item('npc','Varo',{campos:{ref:{c:'Guerrero<x>',n:99,sub:'Campeón',car:[16,'x',40,0,null,10],hab:'Atletismo',eq:'Escudo'}}});
  assert.deepEqual(n.campos.ref,{c:'',n:20,sub:'Campeón',car:[16,null,30,1,null,10],hab:'Atletismo',eq:'Escudo'});
  assert.equal(item('npc','V2',{campos:{ref:{c:'guerrero',n:0}}}).campos.ref.n,1);
  assert.equal(item('npc','V3').campos.ref.c,'');
  assert.equal(item('lugar','L',{campos:{ref:{c:'guerrero'}}}).campos.ref,undefined);
});
