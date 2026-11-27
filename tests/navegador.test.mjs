// Ataque en navegador: carga en la página un módulo y un grupo con código en todos los campos, recorre todas las vistas
// y comprueba que nada llega a ejecutarse ni a pintarse como HTML. También prueba las funciones de tiradas y rarezas.
// Necesita Edge o Chrome (variable BROWSER para indicar otro); si no hay ninguno, el test se salta.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFileSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
import {execFile} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {ROOT,PAGE} from './lib.mjs';
import {testNav} from './lib.mjs';

const BROWSERS=[process.env.BROWSER,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome','/usr/bin/chromium','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const BROWSER=BROWSERS.find(b=>existsSync(b));

// Carga útil: si se ejecuta, apunta qué campo la dejó pasar
const P=f=>`XSS ${f} <img src=x onerror="(window.__x=window.__x||[]).push('${f}')">`;
const creature=f=>({n:P(f+'.n'),sz:P(f+'.sz'),ty:P(f+'.ty'),al:P(f+'.al'),cr:'1',xp:200,ac:12,hp:11,hd:'2d8+2',sp:P(f+'.sp'),in:1,ab:[10,10,10,10,10,10],
  sv:[0,0,0,0,0,0],sk:P(f+'.sk'),se:P(f+'.se'),pp:10,la:P(f+'.la'),im:P(f+'.im'),re:P(f+'.re'),vu:P(f+'.vu'),tyl:P(f+'.tyl'),
  t:[[P(f+'.t0'),P(f+'.t1')]],a:[[P(f+'.a0'),P(f+'.a1')+' Attack Roll: +4, reach 5 ft. Hit: 5 (1d6 + 2) Slashing damage.']],b:[[P(f+'.b0'),P(f+'.b1')]],
  r:[[P(f+'.r0'),P(f+'.r1')]],l:[[P(f+'.l0'),P(f+'.l1')]]});
const MOD={id:'hb-xss',n:P('mod.n'),ab:P('mod.ab'),autor:P('mod.autor'),desc:P('mod.desc'),version:P('mod.version'),lic:P('mod.lic'),on:true,
  criaturas:[creature('cr')],
  conjuros:[{n:P('sp.n'),en:P('sp.en'),lv:1,d:P('sp.d'),dur:P('sp.dur'),rg:P('sp.rg'),ct:P('sp.ct'),comp:P('sp.comp'),cls:[P('sp.cls')],sch:P('sp.sch'),pg:P('sp.pg'),_html:true}],
  tablas:[{n:P('tb.n'),columnas:{[P('tb.col')]:[P('tb.c0'),P('tb.c1')]},formato:P('tb.fmt')}],
  objetos:[{n:P('ob.n'),t:P('ob.t'),r:P('ob.r'),s:P('ob.s'),d:P('ob.d'),k:'magico',precio:P('ob.precio'),pg:P('ob.pg'),_html:true}],
  dotes:[{n:P('do.n'),cat:P('do.cat'),req:P('do.req'),d:P('do.d'),_html:true}],
  clases:[{n:P('cl.n'),info:{[P('cl.k')]:P('cl.v'),'Dado de puntos de golpe':P('cl.dado')},sub:[P('cl.sub')],d:P('cl.d'),_html:true}],
  especies:[{n:P('es.n'),tipo:P('es.tipo'),tam:P('es.tam'),vel:P('es.vel'),d:P('es.d'),_html:true}],
  trasfondos:[{n:P('tf.n'),car:P('tf.car'),dote:P('tf.dote'),hab:P('tf.hab'),herr:P('tf.herr'),equipo:P('tf.equipo'),d:P('tf.d'),_html:true}],
  reglas:[{n:P('rg.n'),cat:P('rg.cat'),tag:P('rg.tag'),d:P('rg.d'),_html:true}]};
const STORE={'combat-modules-v1':{on:{mdj:true},list:[MOD]},
  'combat-party-v1':[{id:'p1',n:P('pc.n'),cls:P('pc.cls'),esp:P('pc.esp'),tf:P('pc.tf'),jug:P('pc.jug'),notas:P('pc.notas'),ac:15,hp:20,max:20}],
  'combat-bestiary-v1':[creature('my')]};

// Datos con tipos absurdos: un módulo así no debe dejar la página rota (se queda guardado en el navegador)
const BASURA={'combat-modules-v1':{on:{mdj:true},list:[{id:'hb-basura',n:'Basura',on:true,
    criaturas:[{n:'Basura 1',ab:'x',t:'no',a:[null,[1],'x'],b:{},ac:'?',hp:null,sp:{},cr:[]},{n:5},{n:'Basura 3',ab:[null,'a'],l:[[null,null]]}],
    conjuros:[{n:'Conjuro basura',lv:'x',cls:'Mago',d:null,sch:5},{n:7,d:{}}],
    tablas:[{n:'Tabla basura',columnas:{a:'no lista',b:null}},{n:'T2',cols:'x',cells:5}],
    objetos:[{n:'Objeto basura',d:{},k:5,r:[],t:null}],dotes:[{n:'Dote basura',d:null,cat:7,req:{}}],
    clases:[{n:'Clase basura',info:'x',sub:'y',d:5}],especies:[{n:'Especie basura',tam:{},vel:[],d:null}],
    trasfondos:[{n:'Trasfondo basura',d:5,car:[]}],reglas:[{n:'Regla basura',d:[],cat:{}}]}]},
  'combat-party-v1':[{n:null},{},'texto',{n:'PJ',hp:'x',ac:{},cls:5}],
  'combat-bestiary-v1':[null,5,{n:'x',ab:'y'}],
  'combat-tables-v1':{x:1},'combat-tracker-v1':{c:5,list:'x'},'combat-prefs-v1':'"no es objeto"'};

// Se ejecuta antes que la página: deja los datos en localStorage y apunta los errores de JavaScript
const head=store=>`<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));addEventListener('unhandledrejection',e=>__err.push(String(e.reason)));
localStorage.clear();for(const[k,v]of Object.entries(${JSON.stringify(store)}))localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));</script>`;
// Se ejecuta al final: comprobaciones de las funciones y recorrido por todas las vistas
const TAIL=`<script>
(async()=>{
  const R={checks:[],views:[]},wait=ms=>new Promise(r=>setTimeout(r,ms));
  const ok=(name,v)=>R.checks.push([name,!!v]);
  const has=(h,s)=>String(h).includes(s);
  try{
    ok('esc',esc('<a "\\'>&')==='&lt;a &quot;&#39;&gt;&amp;');
    for(const[r,k] of [['Very Rare','muy raro'],['molto rara','muy raro'],['non comune','infrecuente'],['rara','raro'],['leggendaria','legendario'],
      ['sehr selten','muy raro'],['peu courant','infrecuente'],['Muy rara','muy raro'],['manufatto','artefacto']])ok('rarKey '+r,rarKey(r)===k);
    ok('ataque en',has(diceify('Melee Attack Roll: +9'),'data-mod="9"'));
    ok('ataque it',has(diceify('Tiro per colpire in mischia: +9'),'data-mod="9"'));
    ok('ataque de',has(diceify('Nahkampfangriffswurf: +5'),'data-mod="5"'));
    ok('ataque fr',has(diceify('Corps à corps : +4'),'data-mod="4"'));
    ok('daño it',has(diceify('12 (2d6 + 5) danni contundenti'),'data-ex="2d6+5" data-ty="contundenti"'));
    ok('daño de W',has(diceify('9 (2W6 + 2) Wuchtschaden'),'data-ex="2d6+2"'));
    ok('daño es',has(diceify('8d6 de daño de fuego'),'data-ty="fuego"'));
    ok('CD',has(diceify('DC 15'),'>CD 15<')&&has(diceify('SG 14'),'>SG 14<')&&has(diceify('DD 13'),'>DD 13<'));
    ok('rich escapa',!has(rich('<b onclick=x>**a**'),'<b onclick'));
  }catch(e){R.error=String(e);}
  try{
  await wait(1500);
  // Restaurar una copia de seguridad maliciosa: módulo con HTML y «__proto__» en los interruptores
  const bk=JSON.stringify({bestiario:[${JSON.stringify(creature("bk"))}],modulos:{list:[${JSON.stringify({...MOD,id:"hb-bk",n:P("bk.mod"),objetos:[{n:P("bk.ob"),d:P("bk.d"),k:"magico",_html:true}]})}]}})
    .replace('"modulos":{','"modulos":{"on":{"__proto__":{"mdj":false,"hb-xss":false},"constructor":true},');
  const io=document.getElementById('io-text'),ib=document.querySelector('[data-act="ioimport"]');
  if(io&&ib){io.value=bk;ib.click();await wait(300);}
  ok('copia: sin contaminar el prototipo',Object.getPrototypeOf(mods().on)===Object.prototype&&!('constructor' in mods().on&&mods().on.constructor===true));
  ok('copia: módulo importado',mods().list.some(m=>m.id==='hb-bk'));
  ok('copia: control de importación encontrado',!!(io&&ib));
  R.state=[typeof mods==='function'&&mods().list.length,typeof compList==='function'&&compList('objetos').length,location.href,document.title];
  const scan=v=>{const im=[...document.querySelectorAll('img[src="x"]')];
    R.views.push([v,im.length,im.slice(0,3).map(e=>(e.parentElement?.outerHTML||'').slice(0,160)),(document.body.textContent.match(/XSS [a-z]+\.[a-z0-9]+/g)||[]).length]);};
  const go=async h=>{location.hash=h;await wait(500);scan(h);
    for(const tr of [...document.querySelectorAll('tr[data-i]')].slice(0,6)){tr.click();await wait(150);}scan(h+' (abierto)');};
  for(const h of ['#inicio','#combate','#jugadores','#tablas','#referencia','#modulos','#cambios'])await go(h);
  const N={criaturas:${JSON.stringify(P('cr.n'))},conjuros:${JSON.stringify(P('sp.n'))},objetos:${JSON.stringify(P('ob.n'))},dotes:${JSON.stringify(P('do.n'))},
    clases:${JSON.stringify(P('cl.n'))},especies:${JSON.stringify(P('es.n'))},trasfondos:${JSON.stringify(P('tf.n'))},reglas:${JSON.stringify(P('rg.n'))}};
  for(const[t,n] of Object.entries(N)){await go('#compendio/'+t);await go(fichaHref(t,n));}
  await go(fichaHref('objetos',${JSON.stringify(P('bk.ob'))}));
  await go(fichaHref('criaturas',${JSON.stringify(P('my.n'))}));
  await go('#compendio/criaturas/'+encodeURIComponent(${JSON.stringify(P('hash1'))}));
  await go('#'+encodeURIComponent(${JSON.stringify(P('hash2'))}));
  }catch(e){(window.__err=window.__err||[]).push('recorrido: '+e);}
  R.x=window.__x||[];R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const types={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__ataque.html'||u==='/__basura.html'){r.writeHead(200,{'content-type':types['.html']});
      return r.end(head(u==='/__ataque.html'?STORE:BASURA)+PAGE+TAIL);}   // la página no lleva <head> ni cierra <body>: los scripts van al principio y al final
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{const b=readFileSync(f);r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});r.end(b);}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

async function run(page){
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-test-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=90000','--dump-dom',`http://127.0.0.1:${port}/${page}`],
      {maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el recorrido ('+dom.length+' caracteres): '+dom.slice(-300));
    return JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
}

testNav('ataque XSS con datos maliciosos y funciones de tiradas, en el navegador',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const R=await run('__ataque.html');
  {
    if(process.env.DEBUG_NAV)console.log(JSON.stringify(R.state),JSON.stringify(R.views.map(v=>[v[0].slice(0,60),v[1],v[3]])));
    // Control: el módulo malicioso se cargó y su texto (escapado) se ve en las fichas; si no, el ataque no prueba nada
    assert.ok(R.state?.[0]>=1&&R.state?.[1]>=1,'el módulo de ataque no llegó a cargarse');
    for(const t of ['criaturas','conjuros','objetos','dotes','clases','especies','trasfondos','reglas'])
      assert.ok(R.views.some(v=>v[0].startsWith(`#compendio/${t}/xss-`)&&v[3]>0),`la ficha de ${t} no mostró el módulo de ataque`);
    assert.equal(R.error,undefined,'error al probar las funciones: '+R.error);
    assert.deepEqual(R.checks.filter(c=>!c[1]).map(c=>c[0]),[],'funciones que fallan');
    assert.deepEqual([...new Set(R.x)],[],'campos que ejecutan código');
    assert.deepEqual(R.views.filter(v=>v[1]).map(v=>v[0]+': '+v[2].join(' | ')),[],'vistas con HTML inyectado');
    assert.ok(R.views.length>30,'el recorrido se quedó a medias');
    assert.deepEqual(R.err,[],'errores de JavaScript');
  }
});

testNav('datos con tipos absurdos no rompen la página',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const R=await run('__basura.html');
  assert.deepEqual([...new Set(R.err)],[],'errores de JavaScript');
  assert.ok(R.views.length>30,'el recorrido se quedó a medias');
});
