// Copia la web (index.html + datos SRD) a desktop/app para empaquetarla.
// App PERSONAL para la campaña: incluye conjuros.json (uso personal, no publicar los instaladores).
// No incluye libros/, tests/ ni tools/.
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
  !EXCLUIR.has(f) && (f === 'index.html' || f === 'privacidad.html' || f === 'terminos.html' || f.endsWith('.json'));

for (const f of readdirSync(root, { withFileTypes: true })) {
  if (f.isFile() && incluir(f.name)) cpSync(join(root, f.name), join(out, f.name));
}
cpSync(join(root, 'i18n'), join(out, 'i18n'), { recursive: true });
cpSync(join(here, 'mesa.html'), join(out, 'mesa.html'));

// Sincroniza la versión con el fichero VERSION de la web
const v = readFileSync(join(root, 'VERSION'), 'utf8').trim();
const pkgPath = join(here, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
if (pkg.version !== v) { pkg.version = v; writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n'); }

console.log('App preparada en', out, '· versión', v);
