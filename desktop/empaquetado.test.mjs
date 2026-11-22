// Todo módulo local que main.js carga con require('./x') debe ir en el paquete (si no, la app instalada no arranca).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir=new URL('.',import.meta.url);
test('los módulos que carga main.js están en build.files',()=>{
  const main=fs.readFileSync(new URL('main.js',dir),'utf8'),pkg=JSON.parse(fs.readFileSync(new URL('package.json',dir),'utf8'));
  const usados=[...main.matchAll(/require\('\.\/([\w-]+)(?:\.js)?'\)/g)].map(m=>m[1]+'.js').filter(f=>f!=='package.js');
  for(const f of usados)assert.ok(pkg.build.files.includes(f),f+' falta en build.files');
});
