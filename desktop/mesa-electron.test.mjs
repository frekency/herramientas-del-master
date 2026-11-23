// Prueba de extremo a extremo con la app REAL de Electron (main.js, app://, preloads, IPC y ventanas de verdad):
// «Enviar a la mesa» abre la ventana con el telón bajado, mapa calibrado, orden con criatura oculta, dados 3D, varias ventanas y «Cerrar mesa».
// Usa datos temporales y no toca los del usuario. Se salta en CI (sin pantalla fiable), sin Electron instalado o con HDM_SIN_E2E=1.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
let ELECTRON = null;
try { ELECTRON = createRequire(import.meta.url)('electron'); } catch { /* no instalado */ }
const saltar = process.env.CI || process.env.HDM_SIN_E2E ? 'sin pantalla fiable (CI) o desactivada' : !ELECTRON || !existsSync(ELECTRON) ? 'Electron no está instalado' : false;

test('app real de Electron: la mesa de extremo a extremo', { skip: saltar, timeout: 240000 }, async () => {
  execFileSync(process.execPath, [path.join(here, 'prepare.mjs')], { cwd: here, stdio: 'ignore' });
  const dir = mkdtempSync(path.join(os.tmpdir(), 'hdm-e2e-res-'));
  const salida = path.join(dir, 'res.json');
  try {
    const codigo = await new Promise((ok, ko) => {
      const env = { ...process.env, HDM_E2E_OUT: salida };
      delete env.ELECTRON_RUN_AS_NODE;
      const p = spawn(ELECTRON, [path.join(here, 'e2e-mesa.cjs')], { cwd: here, env, stdio: 'ignore' });
      const t = setTimeout(() => { try { p.kill(); } catch { /* ya terminó */ } ko(new Error('Electron no terminó a tiempo')); }, 200000);
      p.on('exit', c => { clearTimeout(t); ok(c); });
      p.on('error', ko);
    });
    assert.ok(existsSync(salida), 'la app no dejó resultado (código ' + codigo + ')');
    const R = JSON.parse(readFileSync(salida, 'utf8'));
    assert.deepEqual(R.err, [], 'errores en la app');
    assert.deepEqual(R.c.filter(c => !c[1]).map(c => c[0]), [], 'comprobaciones que fallan');
    assert.ok(R.c.length >= 20, 'el flujo se quedó a medias (' + R.c.length + ')');
  } finally { try { rmSync(dir, { recursive: true, force: true }); } catch { /* temporales */ } }
});
