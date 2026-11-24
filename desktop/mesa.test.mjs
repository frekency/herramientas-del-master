import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { validar } = createRequire(import.meta.url)('./mesa.js');

test('imagen: solo data: png/jpeg/webp', () => {
  assert.deepEqual(validar({ tipo: 'imagen', src: 'data:image/png;base64,AAAA', titulo: 'Mapa' }), { tipo: 'imagen', src: 'data:image/png;base64,AAAA', titulo: 'Mapa' });
  for (const src of ['data:image/svg+xml;base64,AAAA', 'javascript:alert(1)', 'https://x.test/a.png', 'file:///c:/a.png', 'data:text/html;base64,AAAA', 5, null])
    assert.equal(validar({ tipo: 'imagen', src }), null, String(src));
  assert.equal(validar({ tipo: 'imagen', src: 'data:image/png;base64,' + 'A'.repeat(6_000_001) }), null);
});

test('imagen: el título se recorta y debe ser texto', () => {
  assert.equal(validar({ tipo: 'imagen', src: 'data:image/png;base64,AAAA', titulo: 'x'.repeat(500) }).titulo.length, 200);
  assert.equal(validar({ tipo: 'imagen', src: 'data:image/png;base64,AAAA', titulo: { a: 1 } }).titulo, '');
});

test('iniciativa: solo nombre, turno, caído y color; nada más pasa', () => {
  const v = validar({ tipo: 'iniciativa', abrir: 1, activo: true, ronda: 3.7, lista: [
    { n: 'Lyra', actual: true, color: '#3d7bd9', hp: 12, ac: 15, notas: 'secreto' },
    { n: 'Goblin', caido: 1, color: 'red' }, { n: '' }, null, 'x'] });
  assert.deepEqual(v, { tipo: 'iniciativa', abrir: true, activo: true, ronda: 3, cuenta: null, lista: [
    { n: 'Lyra', actual: true, caido: false, color: '#3d7bd9', tok: '', oculto: false },
    { n: 'Goblin', actual: false, caido: true, color: '#888888', tok: '', oculto: false }] });
  assert.ok(!JSON.stringify(v).includes('secreto'));
});

const PNG = 'data:image/png;base64,iVBORw0KGgo=';
test('iniciativa: una criatura oculta sale como «Enemigo oculto», sin nombre, token ni estado', () => {
  const v = validar({ tipo: 'iniciativa', lista: [
    { n: 'Dragón rojo antiguo', oculto: true, caido: true, color: '#d0453c', tok: PNG, hp: 546, ac: 22, debilidades: ['frío'] },
    { n: 'Lyra', tok: PNG, color: '#3d7bd9' }] });
  assert.deepEqual(v.lista[0], { n: 'Enemigo oculto', actual: false, caido: false, color: '#888888', tok: '', oculto: true });
  assert.equal(v.lista[1].tok, PNG);
  const s = JSON.stringify(v);
  for (const x of ['Dragón', '546', 'debilidades', 'frío']) assert.ok(!s.includes(x), x);
  assert.equal(validar({ tipo: 'iniciativa', lista: [{ n: 'A', tok: 'data:text/html;base64,AAAA' }] }).lista[0].tok, '', 'solo imágenes data:');
});

test('ambiente: sin vídeo ni sonido por defecto; el volumen se acota y un sonido sin audio no llega activo', () => {
  const c = validar({ tipo: 'escena', capas: [{ tipo: 'ambiente', volumen: -5 }, { tipo: 'ambiente', sonido: 'si', efecto: 'lluvia' }, { tipo: 'ambiente', sonido: true, volumen: 700 }] }).capas;
  assert.deepEqual([c[0].visual, c[0].vsrc, c[0].sonido, c[0].volumen, c[0].audio], ['', '', false, 0, '']);
  assert.equal(c[1].sonido, false);
  assert.equal(c[2].sonido, false, 'pedir sonido sin tener audio no deja nada sonando');
  assert.equal(c[2].volumen, 100);
  for (const k of ['efecto', 'intensidad']) assert.ok(!(k in c[1]), 'los efectos de código ya no existen: ' + k);
  assert.notEqual(c[1].fuente, 'generado');
});

test('ambiente: el sonido solo admite enlaces https o archivos de audio de la carpeta del usuario', () => {
  const f = o => validar({ tipo: 'escena', capas: [{ tipo: 'ambiente', sonido: true, ...o }] }).capas[0];
  assert.deepEqual([f({}).fuente, f({}).audio], ['', '']);
  const r = f({ fuente: 'url', url: 'https://ice1.somafm.com/dronezone-128-mp3' });
  assert.deepEqual([r.fuente, r.audio, r.sonido], ['url', 'https://ice1.somafm.com/dronezone-128-mp3', true]);
  for (const u of ['http://x.com/a.mp3', 'javascript:alert(1)', 'file:///c:/secreto.mp3', 'https://a b.com/x', 'https://x', 'data:audio/mp3;base64,AAAA', 'https://x.com/"onerror=1', 'https://' + 'a'.repeat(500) + '.com'])
    assert.deepEqual([f({ fuente: 'url', url: u }).fuente, f({ fuente: 'url', url: u }).audio], ['', ''], u);
  const a = f({ fuente: 'archivo', archivo: 'Lluvia fuerte (1).mp3' });
  assert.deepEqual([a.fuente, a.audio], ['archivo', 'app://local/__audios/Lluvia%20fuerte%20(1).mp3']);
  for (const n of ['../a.mp3', 'sub/a.mp3', 'a\\b.mp3', '.oculto.mp3', 'a.exe', 'a.mp3.exe', 'a.mp4', '', 5, null])
    assert.equal(f({ fuente: 'archivo', archivo: n }).fuente, '', String(n));
  assert.equal(f({ fuente: 'raro', url: 'https://x.com/a.mp3' }).audio, '');
});

test('ambiente: el vídeo o la imagen animada solo admiten enlaces https o archivos de vídeo e imagen de la carpeta', () => {
  const f = o => validar({ tipo: 'escena', capas: [{ tipo: 'ambiente', ...o }] }).capas[0];
  const v = f({ visual: 'url', vurl: 'https://cdn.ejemplo.com/lluvia.mp4?x=1' });
  assert.deepEqual([v.visual, v.vsrc, v.vtipo], ['url', 'https://cdn.ejemplo.com/lluvia.mp4?x=1', 'video']);
  assert.equal(f({ visual: 'url', vurl: 'https://cdn.ejemplo.com/nieve.gif' }).vtipo, 'imagen');
  assert.equal(f({ visual: 'url', vurl: 'https://cdn.ejemplo.com/niebla.webp?v=2' }).vtipo, 'imagen');
  for (const u of ['http://x.com/a.mp4', 'javascript:alert(1)', 'file:///c:/a.mp4', 'data:video/mp4;base64,AAAA', 'https://x', 'https://a b.com/x.mp4'])
    assert.deepEqual([f({ visual: 'url', vurl: u }).visual, f({ visual: 'url', vurl: u }).vsrc], ['', ''], u);
  const a = f({ visual: 'archivo', varchivo: 'Niebla densa.webm' });
  assert.deepEqual([a.visual, a.vsrc, a.vtipo], ['archivo', 'app://local/__audios/Niebla%20densa.webm', 'video']);
  assert.equal(f({ visual: 'archivo', varchivo: 'brasas.gif' }).vtipo, 'imagen');
  for (const n of ['../a.mp4', 'sub/a.mp4', 'a\\b.mp4', '.oculto.mp4', 'a.exe', 'a.mp4.exe', 'a.mp3', '', 5, null])
    assert.equal(f({ visual: 'archivo', varchivo: n }).visual, '', String(n));
});

test('mapa de combate: cuadrícula acotada, fichas validadas y las ocultas no llegan nunca', () => {
  const e = validar({ tipo: 'escena', aspecto: 'auto', capas: [{ tipo: 'mapa', id: 'm', x: 0, y: 0, w: 100, h: 100, celda: 99, pantalla: 5, cuadOp: 9, fondo: 'verde',
    tokens: [{ id: 'a', x: 3, y: 4, tam: 2, n: 'Orco', color: '#d0453c', src: PNG, hp: 50 },
      { id: 'b', x: 1, y: 1, n: 'Asesino oculto', oculto: true, src: PNG }, null, { id: 'c', x: 9999, tam: 99, src: 'http://x/y.png' }] }] });
  const m = e.capas[0];
  assert.equal(e.aspecto, 'auto');
  assert.deepEqual([m.celda, m.pantalla, m.cuadOp, m.fondo], [20, 15, 1, '#2b2f26']);
  assert.deepEqual(m.tokens.map(t => t.id), ['a', 'c'], 'la ficha oculta se descarta');
  assert.deepEqual([m.tokens[1].x, m.tokens[1].tam, m.tokens[1].src], [400, 8, '']);
  assert.ok(!JSON.stringify(e).includes('Asesino') && !JSON.stringify(e).includes('hp'));
  assert.equal(validar({ tipo: 'escena', aspecto: 'raro', capas: [] }).aspecto, '16:9');
  const i = validar({ tipo: 'escena', capas: [{ tipo: 'iniciativa', orient: 'h', tokens: false }, { tipo: 'iniciativa', orient: 'x' }] }).capas;
  assert.deepEqual([i[0].orient, i[0].tokens, i[1].orient, i[1].tokens], ['h', false, 'v', true]);
});

test('iniciativa: tope de filas y ronda acotada', () => {
  const v = validar({ tipo: 'iniciativa', ronda: 1e9, lista: Array.from({ length: 500 }, (_, i) => ({ n: 'c' + i })) });
  assert.equal(v.lista.length, 80);
  assert.equal(v.ronda, 9999);
});

test('tipos desconocidos o basura se rechazan; limpiar pasa', () => {
  assert.equal(validar({ tipo: 'script' }), null);
  assert.equal(validar(null), null);
  assert.equal(validar('x'), null);
  assert.deepEqual(validar({ tipo: 'limpiar' }), { tipo: 'limpiar' });
});

test('aviso: texto y título acotados; vacío se rechaza', () => {
  assert.deepEqual(validar({ tipo: 'aviso', titulo: 'Derrumbe', texto: 'El techo cruje' }), { tipo: 'aviso', titulo: 'Derrumbe', texto: 'El techo cruje' });
  assert.equal(validar({ tipo: 'aviso', texto: 'x'.repeat(900) }).texto.length, 400);
  assert.equal(validar({ tipo: 'aviso', titulo: 'y'.repeat(300) }).titulo.length, 80);
  assert.equal(validar({ tipo: 'aviso', texto: '  ', titulo: '' }), null);
  assert.equal(validar({ tipo: 'aviso', texto: { a: 1 } }), null);
});

test('iniciativa: la cuenta atrás es opcional y solo lleva etiqueta, segundos y pausa', () => {
  const v = validar({ tipo: 'iniciativa', lista: [], cuenta: { n: 'La cueva aguanta', seg: 125.9, pausa: 1, secreto: 'x' } });
  assert.deepEqual(v.cuenta, { n: 'La cueva aguanta', seg: 125, pausa: true });
  assert.equal(validar({ tipo: 'iniciativa', lista: [] }).cuenta, null);
  assert.equal(validar({ tipo: 'iniciativa', lista: [], cuenta: { seg: 'x' } }).cuenta, null);
  assert.equal(validar({ tipo: 'iniciativa', lista: [], cuenta: { seg: -50 } }).cuenta.seg, 0);
  assert.equal(validar({ tipo: 'iniciativa', lista: [], cuenta: { seg: 1e9 } }).cuenta.seg, 86400);
  assert.equal(validar({ tipo: 'iniciativa', lista: [], cuenta: 'x' }).cuenta, null);
});

test('cuentas: máximo ocho, solo etiqueta, segundos, pausa y fin', () => {
  const v = validar({ tipo: 'cuentas', lista: [{ n: 'Trampa', seg: 90.7, pausa: 1, fin: 0, x: 'secreto' }, { n: 'a'.repeat(200), seg: -5 }, null, { seg: 'x' }, { n: 'e' }, ...Array(6).fill({ n: 'z' })] });
  assert.equal(v.lista.length, 8);
  assert.deepEqual(v.lista[0], { id: '', n: 'Trampa', seg: 90, pausa: true, fin: false });
  assert.equal(validar({ tipo: 'cuentas', lista: [{ id: 'ab12', n: 'x', seg: 5 }, { id: '<x>', n: 'y', seg: 5 }] }).lista.map(c => c.id).join('|'), 'ab12|');
  assert.equal(v.lista[1].n.length, 60);assert.equal(v.lista[1].seg, 0);
  assert.equal(validar({ tipo: 'cuentas', lista: [{ n: 'x', seg: 1e9 }] }).lista[0].seg, 86400);
  assert.deepEqual(validar({ tipo: 'cuentas' }), { tipo: 'cuentas', lista: [] });
  assert.ok(!JSON.stringify(v).includes('secreto'));
});

// ---- escenas ----
test('escena: capas válidas con posición y tamaño acotados', () => {
  const v = validar({ tipo: 'escena', nombre: 'Taberna', fondo: '#112233', capas: [
    { id: 'a', tipo: 'imagen', src: PNG, x: 10, y: 20, w: 50, h: 60, ajuste: 'cubrir', titulo: 'Mapa' },
    { id: 'b', tipo: 'texto', t: 'Hola', tam: 8, color: '#fff', alin: 'der', fuente: 'serif', negrita: true, x: 0, y: 0, w: 100, h: 10 },
    { id: 'c', tipo: 'iniciativa', x: 70, y: 0, w: 30, h: 100 },
    { id: 'd', tipo: 'cuentas', x: 70, y: 80, w: 30, h: 20 },
  ] });
  assert.equal(v.tipo, 'escena');
  assert.equal(v.fondo, '#112233');
  assert.equal(v.capas.length, 4);
  assert.equal(v.capas[0].ajuste, 'cubrir');
  assert.equal(v.capas[1].alin, 'der');
  assert.equal(v.capas[1].fuente, 'serif');
});
test('escena: números fuera de rango se acotan y lo que no es número vuelve al valor por defecto', () => {
  const v = validar({ tipo: 'escena', capas: [{ tipo: 'texto', t: 'x', x: 9999, y: -9999, w: 0, h: 'abc', tam: 1000, op: 7 }] });
  const c = v.capas[0];
  assert.equal(c.x, 150); assert.equal(c.y, -50); assert.equal(c.w, 1); assert.equal(c.h, 50); assert.equal(c.tam, 60); assert.equal(c.op, 1);
});
test('escena: solo pasan imágenes data: y tipos de capa conocidos; el resto se descarta', () => {
  const v = validar({ tipo: 'escena', capas: [
    { tipo: 'imagen', src: 'https://evil.example/x.png' },
    { tipo: 'imagen', src: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' },
    { tipo: 'script', src: PNG },
    { tipo: 'imagen', src: PNG },
    null, 7,
  ] });
  assert.equal(v.capas.length, 1);
  assert.equal(v.capas[0].tipo, 'imagen');
});
test('escena: textos y colores se limpian; nada de HTML ni estilos inventados', () => {
  const v = validar({ tipo: 'escena', fondo: 'url(javascript:alert(1))', capas: [{ tipo: 'texto', t: '<img src=x onerror=1>'.repeat(300), color: 'red;position:fixed', fondo: 'expression(1)', fuente: 'Comic Sans; x', alin: 'abajo' }] });
  assert.equal(v.fondo, '#0b0a09');
  const c = v.capas[0];
  assert.ok(c.t.length <= 2000);
  assert.equal(c.color, '#f1ece0'); assert.equal(c.fondo, ''); assert.equal(c.fuente, 'sans'); assert.equal(c.alin, 'centro');
});
test('escena: tope de capas, ids únicos y campos ajenos descartados', () => {
  const capas = Array.from({ length: 80 }, () => ({ tipo: 'iniciativa', id: 'igual', extra: 'x', datos: { pg: 5 } }));
  const v = validar({ tipo: 'escena', capas });
  assert.equal(v.capas.length, 40);
  assert.equal(new Set(v.capas.map(c => c.id)).size, 40);
  assert.ok(!('extra' in v.capas[0]) && !('datos' in v.capas[0]));
});
test('escena: el peso total de imágenes tiene tope y una escena sin capas es válida', () => {
  const grande = 'data:image/png;base64,' + 'A'.repeat(5_900_000);
  assert.equal(validar({ tipo: 'escena', capas: Array.from({ length: 5 }, () => ({ tipo: 'imagen', src: grande })) }), null);
  assert.deepEqual(validar({ tipo: 'escena', capas: [] }).capas, []);
  assert.equal(validar({ tipo: 'escena', capas: 'no' }), null);
});

test('escena: fondo con degradado e imagen, y cuenta atrás propia de la capa', () => {
  const e = validar({ tipo: 'escena', fondo: '#112233', fondo2: '#445566', ang: 999, fsrc: PNG, fajuste: 'contener', capas: [{ tipo: 'cuentas', x: 1, y: 1, w: 20, h: 20, cid: 'ab12', fin: 'quitar' }, { tipo: 'cuentas', cid: '<x>', fin: 'raro' }] });
  assert.deepEqual([e.fondo, e.fondo2, e.ang, e.fsrc, e.fajuste], ['#112233', '#445566', 360, PNG, 'contener']);
  assert.deepEqual([e.capas[0].cid, e.capas[0].fin, e.capas[1].cid, e.capas[1].fin], ['ab12', 'quitar', '', 'mantener']);
  const n = validar({ tipo: 'escena', fondo2: 'rojo', fsrc: 'http://x/y.png', capas: [] });
  assert.deepEqual([n.fondo2, n.fsrc, n.ang, n.fajuste], ['', '', 180, 'cubrir']);
});

test('telón: se baja con un texto corto y se sube', () => {
  assert.deepEqual(validar({ tipo: 'telon', activo: true, texto: ' Ahora volvemos' }), { tipo: 'telon', activo: true, texto: 'Ahora volvemos' });
  assert.deepEqual(validar({ tipo: 'telon', activo: 'si', texto: 'x'.repeat(300) }).texto.length, 80);
  assert.equal(validar({ tipo: 'telon', activo: 'si' }).activo, false);
});
