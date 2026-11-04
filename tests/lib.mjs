// Utilidades comunes de los tests: rutas, lectura de archivos y scripts de la página.
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const read=f=>readFileSync(path.join(ROOT,f),'utf8');
export const json=f=>JSON.parse(read(f));
export const exists=f=>existsSync(path.join(ROOT,f));
export const PAGE=read('index.html');
// Scripts en línea de la página (sin los que cargan un src)
export const SCRIPTS=[...PAGE.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);

// Idiomas de la interfaz (además del español, que es el texto original) y de los datos del SRD
export const UI_LANGS=['en','fr','pt','it','de'];
export const DATA_LANGS={es:'',en:'_en',fr:'_fr',de:'_de',it:'_it'};   // sufijo de conjuros_srd y compendio_srd
export const BEST={es:'srd2024_es.json',en:'srd2024.json',fr:'srd2024_fr.json',de:'srd2024_de.json',it:'srd2024_it.json'};
