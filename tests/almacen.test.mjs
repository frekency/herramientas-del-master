// El almacenamiento de datos pasa siempre por Store (ver index.html), para poder cambiar de backend
// (localStorage en la web, SQLite en escritorio, Supabase, vault de Obsidian...).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PAGE} from './lib.mjs';

test('los datos persistentes solo se leen y escriben a través de Store',()=>{
  // Se quita el bloque que define Store: es el único sitio autorizado a tocar localStorage
  const sinStore=PAGE.replace(/window\.Store=\(\(\)=>\{[\s\S]*?\}\)\(\);/,'');
  // Sin comentarios: solo importa el código (el // de una URL va precedido de «:», no de espacio)
  const codigo=sinStore.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[\s;{}])\/\/[^\n]*/g,'$1');
  const reales=[...codigo.matchAll(/^.*\blocalStorage\b.*$/gm)].map(m=>m[0].trim().slice(0,100));
  assert.deepEqual(reales,[],'usa Store.get/set/remove (o Store.native para claves de librerías) en lugar de localStorage');
});

test('Store existe, es síncrono y admite otro backend',()=>{
  assert.match(PAGE,/window\.Store=\(\(\)=>\{/);
  assert.match(PAGE,/window\.__StoreBackend/);
  assert.ok(PAGE.indexOf('window.Store=')<PAGE.indexOf("Store.get('combat-prefs-v1')"),'Store debe definirse antes de su primer uso');
});
