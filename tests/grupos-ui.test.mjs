// Grupos, jugadores y personajes en el navegador: crear un grupo rival, añadirle una criatura, llevarlo al combate,
// asignar y dar por caído el personaje de un jugador y ver el árbol global de Personajes.
// Necesita Edge o Chrome (variable BROWSER para indicar otro); si no hay ninguno, el test se salta.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFileSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
import {execFile} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {ROOT,PAGE} from './lib.mjs';

const BROWSERS=[process.env.BROWSER,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome','/usr/bin/chromium','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const BROWSER=BROWSERS.find(b=>existsSync(b));

const car={fue:8,des:14,con:14,int:16,sab:10,car:10};
const ficha=o=>({v:1,nombre:'Lyra',car,niveles:[{c:'mago',hp:6}],...o});
const STORE={
  'combat-party-v1':[{id:'p1',n:'Ana',hp:20,cur:20,ac:15},{id:'p2',n:'Bea',hp:18,cur:18,ac:14}],
  'combat-bestiary-v1':[{id:'k1',n:'Orco de prueba',ty:'Humanoide',cr:'1/2',xp:100,ac:13,hp:15,hd:'2d8+6',in:1,ab:[16,12,16,7,11,10],sv:[0,0,0,0,0,0]}],
  'fichas-v1':[ficha({id:'b1',nombre:'Lyra'})],
  'camp-fichas-v1':[ficha({id:'c1',nombre:'Lyra (campaña)',origen:'campana',campana:'local',base:'b1'}),ficha({id:'c2',nombre:'Brun',origen:'campana',campana:'local'}),
    ficha({id:'c3',nombre:'Mira',origen:'campana',campana:'local',ca:15,niveles:Array(5).fill({c:'mago',hp:4}),conjuros:['Bola de fuego']})],
};
const head=`<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));addEventListener('unhandledrejection',e=>__err.push(String(e.reason)));
localStorage.clear();for(const[k,v]of Object.entries(${JSON.stringify(STORE)}))localStorage.setItem(k,JSON.stringify(v));</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  const $$=s=>[...document.querySelectorAll(s)];
  try{
    await wait(1200);
    location.hash='#jugadores';await wait(500);
    ok('un grupo de jugadores con dos tarjetas',$$('#grp-body .grp').length===1&&$$('#grp-body .pcard').length===2);
    // grupo nuevo (rivales)
    document.querySelector('[data-act="grpnew"]').click();document.getElementById('grp-new-n').value='Orcos';document.getElementById('grp-new-t').value='rivales';
    document.getElementById('grp-new').requestSubmit();await wait(200);
    ok('grupo rival creado',$$('#grp-body .grp').length===2&&GRP.some(g=>g.n==='Orcos'&&g.tipo==='rivales'));
    // añadirle una criatura
    const g=GRP.find(x=>x.n==='Orcos');
    grpAct('grpaddopen',{dataset:{id:g.id}});await wait(100);
    const f=document.querySelector('form[data-grpadd]');f.querySelector('[data-grpcr]').value='Orco de prueba';f.querySelector('[data-grpn]').value='3';f.requestSubmit();await wait(200);
    ok('criatura añadida al grupo',GRP.find(x=>x.id===g.id).miembros.some(m=>m.k==='criatura'&&m.cant===3)&&$$('#grp-body .grprow').length===1);
    // al combate
    grpAct('grpcombat',{dataset:{id:g.id}});await wait(200);
    ok('tres orcos en el combate y su bando',state.creatures.filter(c=>c.name.startsWith('Orco de prueba')).length===3&&state.factions.some(x=>x.name==='Orcos'&&!x.pc));
    grpAct('grpcombat',{dataset:{id:GRP[0].id}});await wait(200);
    ok('los jugadores entran con su bando de PJ',state.creatures.some(c=>c.pcId==='p1')&&state.factions.some(x=>x.pc));
    // personaje del jugador
    const m1=GRP[0].miembros.find(m=>m.ref==='p1');
    const sel=document.querySelector('[data-grppj="'+m1.id+'"]');sel.value='c1';sel.dispatchEvent(new Event('change',{bubbles:true}));await wait(200);
    ok('Ana lleva a Lyra de campaña',GRP[0].miembros.find(m=>m.ref==='p1').pj==='c1'&&PJC.find(x=>x.id==='c1').jugador===m1.id);
    // el combate usa la ficha: Bea lleva a Mira y entra con sus datos
    const m2=GRP[0].miembros.find(m=>m.ref==='p2'),sb=document.querySelector('[data-grppj="'+m2.id+'"]');sb.value='c3';sb.dispatchEvent(new Event('change',{bubbles:true}));await wait(200);
    commit(()=>{state.creatures=state.creatures.filter(c=>c.pcId!=='p2');});commit(()=>addPC(PARTY.find(x=>x.id==='p2')));
    const cm=state.creatures.find(c=>c.pcId==='p2'),fm=PJC.find(x=>x.id==='c3');
    ok('Bea entra con la ficha de Mira (PG, CA, iniciativa)',cm&&cm.fid==='c3'&&cm.tpl==='pj:c3'&&cm.maxHp===Ficha.hpMax(fm)&&cm.ac===15&&cm.initBonus===Ficha.mod(fm.car.des)&&cm.name==='Mira');
    commit(()=>{cm.hp=cm.hp-5;});
    ok('el daño del combate llega a la ficha',PJC.find(x=>x.id==='c3').hp===Ficha.hpMax(fm)-5);
    const host=document.createElement('div');host.id='t-sb';document.body.append(host);
    host.innerHTML=sbHTML(tpl(cm.tpl),cm);
    ok('el panel enseña los conjuros y espacios de la ficha',!!host.querySelector('[data-act="cast"][data-sp="Bola de fuego"]')&&host.querySelectorAll('[data-act="slot"]').length>=9);
    host.querySelector('[data-act="cast"][data-sp="Bola de fuego"]').click();await wait(200);
    ok('lanzar gasta un espacio de nivel 3 de la ficha',PJC.find(x=>x.id==='c3').slotsUsados[2]===1);
    host.remove();
    pjProy('c3');grpAct('grpmuere',{dataset:{id:m2.id}});await wait(100);
    ok('si cae, la criatura sigue pero el jugador queda libre',state.creatures.some(c=>c.pcId==='p2')&&GRP[0].miembros.find(m=>m.ref==='p2').pj==='');
    commit(()=>{state.creatures=state.creatures.filter(c=>c.pcId!=='p2');});
    // cambia a Brun: Lyra queda retirada
    const sel2=document.querySelector('[data-grppj="'+m1.id+'"]');sel2.value='c2';sel2.dispatchEvent(new Event('change',{bubbles:true}));await wait(200);
    ok('al cambiar de personaje el anterior queda retirado',PJC.find(x=>x.id==='c1').estado==='retirado'&&PJC.find(x=>x.id==='c2').estado==='activo'&&GRP[0].miembros.find(m=>m.ref==='p1').pj==='c2');
    // muere Brun
    grpAct('grpmuere',{dataset:{id:m1.id}});await wait(200);
    ok('Brun cae y Ana queda sin personaje',PJC.find(x=>x.id==='c2').estado==='caido'&&GRP[0].miembros.find(m=>m.ref==='p1').pj==='');
    // los grupos no son bandos de jugadores si no lo son
    ok('el grupo de rivales no pasa a jugadores',Grupos.agregar(GRP,g.id,{k:'jugador',ref:'p2'}).ok===false);
    // vista global
    location.hash='#personajes';await wait(500);
    const body=document.getElementById('pj-body').innerHTML;
    ok('Personajes: caídos y retirados',body.includes('pjbaja')&&body.includes('Lyra (campaña)'));
    ok('Personajes: la base enseña su versión de campaña',body.includes('pjcopias')&&body.includes('Mi campaña'));
    location.hash='#personajes/c2';await wait(400);
    ok('hoja de campaña: base, estado y reactivar',document.getElementById('pj-body').innerHTML.includes('pjrel')&&document.querySelector('[data-act="pjestado"][data-e="activo"]'));
    location.hash='#personajes/b1';await wait(400);
    ok('hoja base: versiones en campañas',document.getElementById('pj-body').innerHTML.includes('pjchip'));
    // borrar un grupo con jugadores no se puede; con criaturas sí
    ok('no se borra el último grupo de jugadores',Grupos.borrar(GRP,GRP[0].id).ok===false);
    grpAct('grpdel',{dataset:{id:g.id}});location.hash='#jugadores';await wait(300);
    ok('grupo rival borrado',GRP.length===1);
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+(e.stack||'').split('\\n')[1]);}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__grupos.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

test('grupos, jugadores y personajes: flujo completo en el navegador',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-grp-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__grupos.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=20,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
