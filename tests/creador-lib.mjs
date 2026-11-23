// Importaciones comunes del test del creador de personajes
export {default as assert} from 'node:assert/strict';
export {default as http} from 'node:http';
export {readFileSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
export {execFile} from 'node:child_process';
export {default as os} from 'node:os';
export {default as path} from 'node:path';
export {ROOT,PAGE,testNav} from './lib.mjs';
