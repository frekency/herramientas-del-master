// Comprobaciones estáticas de seguridad sobre el código y lo que se publica en el repositorio.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {read,PAGE,SCRIPTS,ROOT} from './lib.mjs';

const tracked=execFileSync('git',['ls-files'],{cwd:ROOT,encoding:'utf8'}).split('\n').filter(Boolean);
const TEXT=tracked.filter(f=>/\.(html|js|mjs|json|sql|md|py|toml|txt)$/.test(f)&&!/^datos\//.test(f));

test('ningún secreto en el repositorio (service_role, claves secretas, tokens)',()=>{
  const bad=[
    [/sb_secret_[A-Za-z0-9_-]{10,}/,'clave secreta de Supabase'],
    [/service_role['"]?\s*[:=]|"role"\s*:\s*"service_role"/i,'clave service_role'],
    [/eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,'JWT'],
    [/-----BEGIN [A-Z ]*PRIVATE KEY-----/,'clave privada'],
    [/\b(?:ghp|gho|github_pat)_[A-Za-z0-9_]{20,}/,'token de GitHub'],
    [/client_secret\s*[:=]\s*['"][^'"]{8,}/i,'client secret de OAuth'],
  ];
  for(const f of TEXT){const t=read(f);
    for(const [rx,what] of bad)assert.ok(!rx.test(t)||(f==='tests/seguridad.test.mjs'),`${f}: parece contener ${what}`);}
});

test('la clave de Supabase de la página es la publicable',()=>{
  // Valor por defecto de la página (se sustituye con window.APP_CONFIG.supabaseKey al cambiar de proyecto)
  const k=PAGE.match(/SB_KEY=[^;\n]*?\|\|'([^']+)'/)?.[1];
  assert.ok(k,'no se encuentra SB_KEY');
  assert.match(k,/^sb_publishable_/);
});

test('los manuales oficiales no se suben al repositorio',()=>{
  for(const f of ['datos/privado/conjuros.json'])assert.ok(!tracked.includes(f),`${f} está en git`);
  assert.ok(!tracked.some(f=>f.startsWith('datos/privado/')||f.endsWith('.csv')),'datos/privado/ o CSV en git');
});

test('los scripts externos llevan versión exacta',()=>{
  const urls=[...PAGE.matchAll(/https:\/\/(?:cdn\.jsdelivr\.net\/npm|unpkg\.com|cdnjs\.cloudflare\.com\/ajax\/libs)\/[^'"\s)]+/g)].map(m=>m[0]);
  for(const u of urls)assert.match(u,/@\d+\.\d+\.\d+\/|\/\d+\.\d+\.\d+\//,`${u} sin versión exacta`);
});

test('los scripts que se cargan desde un CDN llevan integridad (SRI)',()=>{
  for(const m of PAGE.matchAll(/\.src='(https:\/\/[^']+\.js)';([^\n]{0,200})/g))
    assert.match(m[2],/integrity='sha384-[A-Za-z0-9+/=]{64}'/,`${m[1]} sin integrity`);
  for(const m of PAGE.matchAll(/<script src="https:[^"]+"[^>]*>/g))assert.match(m[0],/integrity="sha(256|384|512)-/,`${m[0]} sin integrity`);
});

test('el código no usa eval, new Function ni document.write',()=>{
  for(const s of SCRIPTS)assert.ok(!/\beval\(|new Function\(|document\.write\(/.test(s));
});

test('Supabase: todas las tablas con RLS y las funciones security definer con search_path fijo',()=>{
  const sql=read('supabase/schema.sql');
  const tables=[...sql.matchAll(/create table if not exists public\.(\w+)/g)].map(m=>m[1]);
  assert.ok(tables.length);
  for(const t of tables)assert.match(sql,new RegExp(`alter table public\\.${t} enable row level security`),`${t} sin RLS`);
  for(const m of sql.matchAll(/create or replace function public\.(\w+)[\s\S]*?\$\$;?/g))
    if(/security definer/.test(m[0]))assert.match(m[0],/set search_path = ''/,`${m[1]} sin search_path`);
  assert.match(sql,/datos_usuario_tamano check \(octet_length\(valor::text\)/,'datos_usuario sin límite de tamaño');
  assert.match(sql,/datos_usuario_clave\s+check \(clave in/,'datos_usuario admite cualquier clave');
  assert.match(sql,/check \(octet_length\(contenido::text\)/,'modulos_publicos sin límite de tamaño');
  assert.match(sql,/límite de 30 módulos/,'sin límite de módulos por autor');
  assert.match(sql,/sumar_descarga[\s\S]*?auth\.uid\(\) is null[\s\S]*?descargas_usuario/,'las descargas se pueden inflar');
  // Las claves que acepta la base de datos son las que sincroniza la página
  const keys=PAGE.match(/const SYNC_KEYS=\{([^}]*)\}/)[1].match(/\w+(?=:)/g).sort();
  assert.deepEqual(sql.match(/clave in \(([^)]*)\)/)[1].match(/\w+/g).sort(),keys,'SYNC_KEYS y la restricción de clave no coinciden');
});

test('los datos de terceros (módulos) no pueden marcarse como HTML de confianza',()=>{
  // Solo el SRD propio se pinta como HTML; un módulo con «_html:true» colaría código en la página.
  const m=PAGE.match(/const mod=activeMods\(\)[^\n]*/)?.[0]||'';
  assert.match(m,/_html:false/,'compList no anula _html en los módulos');
});

test('El hosting sirve la página con cabeceras de seguridad',()=>{
  const h=read('_headers');
  for(const x of ['X-Content-Type-Options: nosniff','X-Frame-Options: SAMEORIGIN','Referrer-Policy:'])assert.ok(h.includes(x),`_headers sin ${x}`);
});

test('un jugador no lee lo privado del máster: solo fichas, lo compartido y lo que se le enseña',()=>{
  const sql=read('supabase/jugadores.sql');
  assert.match(sql,/drop policy if exists "leer los de mi campaña"/);
  assert.match(sql,/rol_en\(campana_id\) = 'master'/,'el máster lee todo');
  assert.match(sql,/clave like 'nota:%' and coalesce\(valor->>'visibilidad', 'dm'\) in \('jugadores', 'enlace'\)/,'las notas solo si son compartidas');
  assert.doesNotMatch(sql,/clave like 'enc:%'/,'los encuentros preparados no se enseñan');
  assert.doesNotMatch(sql,/es_miembro\(campana_id\)\s*\)?\s*;/,'nada de «cualquier miembro lee todo»');
  // el cliente solo sube a «pub:» lo que el máster decide enseñar (las claves siguen el mismo patrón)
  assert.ok(PAGE.includes("'nota:'+i.id"),'la sincronización sigue subiendo las notas con su clave');
});
