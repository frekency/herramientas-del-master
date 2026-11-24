// PWA: manifiesto, iconos, service worker y registro solo en la web.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {read,json,ROOT,PAGE} from './lib.mjs';

test('el manifiesto es válido y sus iconos existen',()=>{
  const m=json('manifest.webmanifest');
  assert.ok(m.name&&m.short_name&&m.start_url&&m.display==='standalone','campos básicos');
  assert.ok(m.icons.some(i=>i.sizes==='512x512'&&i.type==='image/png'),'icono PNG de 512');
  for(const i of m.icons)assert.ok(existsSync(path.join(ROOT,i.src)),'falta '+i.src);
  assert.match(PAGE,/<link rel="manifest" href="manifest\.webmanifest">/,'la página enlaza el manifiesto');
  assert.match(PAGE,/rel="apple-touch-icon"/,'icono para iPhone');
});

test('el service worker lleva la versión de la app y solo guarda el propio sitio',()=>{
  const sw=read('sw.js'),V=read('VERSION').trim();
  assert.equal(sw.match(/const VERSION='([^']+)'/)?.[1],V,'sw.js no lleva la versión actual');
  assert.match(sw,/u\.origin!==self\.location\.origin/,'debe ignorar otros dominios');
  assert.match(sw,/r\.method!=='GET'/,'solo GET');
  assert.ok(!/supabase/i.test(sw),'sin nada de Supabase');
});

test('el registro se salta en la app de escritorio y sin http(s)',()=>{
  assert.match(PAGE,/register\('sw\.js'\)/);
  assert.match(PAGE,/!window\.__AppShell/);
  assert.match(PAGE,/\^https\?:\$/);
});
