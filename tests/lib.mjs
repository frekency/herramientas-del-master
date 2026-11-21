// Utilidades comunes de los tests: rutas, lectura de archivos y scripts de la página.
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {test} from 'node:test';

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const read=f=>readFileSync(path.join(ROOT,f),'utf8');
export const json=f=>JSON.parse(read(f));
export const exists=f=>existsSync(path.join(ROOT,f));
export const PAGE=read('index.html');
// Scripts en línea de la página (sin los que cargan un src)
export const SCRIPTS=[...PAGE.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);

// Idiomas de la interfaz (además del español, que es el texto original) y de los datos del SRD
export const UI_LANGS=['en','fr','pt','it','de'];
export const DATA_LANGS=['es','en','fr','de','it'];   // carpetas datos/<idioma>/
export const BEST=Object.fromEntries(DATA_LANGS.map(l=>[l,`datos/${l}/bestiario.json`]));

/* Test de navegador: la página se carga en Edge/Chrome sin cabeza y el flujo se sondea en tiempo virtual, así que con la máquina cargada
   (varios navegadores a la vez) una espera puede quedarse corta. Se reintenta hasta 3 veces; un fallo real falla las 3, y si pasa
   tras reintentar se avisa en la salida para que se vea cuánto se está tapando. */
export function testNav(name,opts,fn){
  return test(name,opts,async t=>{
    let ultimo,primero;
    for(let n=1;n<=3;n++){
      try{
        await fn(t);
        if(n>1){const m=String(primero&&primero.message).split(String.fromCharCode(10)).slice(0,6).join(' | ').slice(0,300);console.warn('⚠ INTERMITENTE: «'+name+'» pasó en el intento '+n+'. Fallo anterior: '+m);}
        return;
      }catch(e){ultimo=e;primero=primero||e;}
    }
    throw ultimo;
  });
}
