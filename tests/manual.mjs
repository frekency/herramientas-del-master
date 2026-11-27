// Contenido del Manual del Jugador (módulo privado): es el único contenido de la herramienta y no va en git (contenido con copyright).
// Los tests que comprueban la calidad de esos datos se saltan si el archivo no está (un clon limpio, otro equipo).
import {test} from 'node:test';
import {readFileSync,existsSync} from 'node:fs';
const RUTA=new URL('../datos/privado/libros/manual-del-jugador-2024.json',import.meta.url);
export const hayManual=existsSync(RUTA);
const VACIO={conjuros:[],dotes:[],trasfondos:[],especies:[],rasgos:[],objetos:[],clases:[],criaturas:[],reglas:[],tablas:[]};
export const MANUAL=hayManual?JSON.parse(readFileSync(RUTA,'utf8')):VACIO;
export const rawManual=()=>readFileSync(RUTA,'utf8');
export const SIN_MANUAL='falta datos/privado/libros/manual-del-jugador-2024.json (no va en git)';
/* test() que se salta si no está el manual */
export const testM=(nombre,fn)=>test(nombre,{skip:hayManual?false:SIN_MANUAL},fn);
