// Copia la web (index.html) a desktop/app para empaquetarla.
// No se empaqueta ningún dato: los módulos (también datos/privado/, con copyright y de uso personal) los importa cada usuario.
// Los libros del usuario se importan desde la app y viven en su perfil, no en el instalador. Tampoco tests/ ni tools/.
import { cpSync, rmSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const out = join(here, 'app');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const EXCLUIR = new Set(['package.json']);
const incluir = f =>
  !EXCLUIR.has(f) && f === 'index.html';

for (const f of readdirSync(root, { withFileTypes: true })) {
  if (f.isFile() && incluir(f.name)) cpSync(join(root, f.name), join(out, f.name));
}
cpSync(join(here, 'mesa.html'), join(out, 'mesa.html'));
// Dados 3D de la mesa (dice-box, MIT): librería y su tema, sin descargar nada al ejecutar
cpSync(join(root, 'vendor'), join(out, 'vendor'), { recursive: true });

// Sincroniza la versión con el fichero VERSION de la web
const v = readFileSync(join(root, 'VERSION'), 'utf8').trim();
const pkgPath = join(here, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
if (pkg.version !== v) { pkg.version = v; writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n'); }

console.log('App preparada en', out, '· versión', v);
