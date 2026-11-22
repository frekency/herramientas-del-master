// Ficha editable por criatura en el encuentro + variables en los textos de acciones.
// Necesita Edge o Chrome (variable BROWSER para indicar otro); si no hay ninguno, el test se salta.
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

const head=`<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));addEventListener('unhandledrejection',e=>__err.push(String(e.reason)));localStorage.clear();</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  try{
    await wait(1200);
    MY.push({id:"ogro",n:"Ogro de prueba",sz:"Large",ty:"Giant",cr:"2",ac:11,hp:59,hd:"7d10+21",ab:[19,8,16,5,7,7],sv:[4,-1,3,-3,-2,-2],in:-1,a:[["Garrote","Ataque: {atq:FUE}. Daño {dmg:2d8+FUE}. CD {cd:CON}."]]});
    saveBest();
    const m=tpl("my:ogro");
    const h=sbHTML(m,null);
    ok("variables: ataque +6 (FUE +4, comp. +2)",h.includes("+6"));
    ok("variables: daño 13 (2d8 + 4)",h.includes("13 (")&&h.includes("2d8 + 4"));
    ok("variables: CD 13 (8+2+3)",h.includes("CD 13"));
    commit(()=>addCreature({id:uid(),name:"Ogro 1",tpl:"my:ogro",factionId:state.factions[0].id,ac:11,maxHp:59,hp:59,temp:0,conds:[],used:{},uses:{},init:10,initBonus:-1,notes:"",la:0,lr:0}));
    const c=state.creatures.find(x=>x.name==="Ogro 1");
    ok("sin copia propia al principio",!c.sb&&cTpl(c)===m);
    openEditor(structuredClone(cTpl(c)),{inst:c.id});
    document.querySelector("#ed-ab2").value="20";document.querySelector("#ed-ab2").dispatchEvent(new Event("input",{bubbles:true}));
    document.querySelector("[data-edcalc=hp]").click();
    ok("PG por dados y CON: 7d10 + 35 = 73",document.querySelector("#ed-hp").value==="73"&&document.querySelector("#ed-hd").value==="7d10+35");
    document.querySelector("#ed-ac").value="15";
    document.querySelector("#editform").requestSubmit();await wait(300);
    ok("la criatura del encuentro guarda su copia",!!c.sb&&c.sb.ab[2]===20&&c.ac===15&&c.maxHp===73);
    ok("el original del bestiario no cambia",tpl("my:ogro").ab[2]===16&&tpl("my:ogro").hp===59&&MY.length===1);
    ok("la ficha del encuentro usa los nuevos valores (CD 15)",sbHTML(cTpl(c),c).includes("CD 15"));
    document.querySelector("[data-id='"+c.id+"'] [data-act=toggle]").click();await wait(300);
    ok("aparece Volver al original",!!document.querySelector("[data-act=resetinst]"));
    document.querySelector("[data-act=resetinst]").click();await wait(200);document.querySelector("[data-cp=yes]").click();await wait(300);
    ok("volver al original restaura CA y quita la copia",!c.sb&&c.ac===11);
  }catch(e){(window.__err=window.__err||[]).push("flujo: "+e+" "+String(e.stack).slice(0,200));}
  R.err=window.__err||[];
  const pre=document.createElement("pre");pre.id="__res";pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__inst.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('ficha editable por criatura en el encuentro',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-inst-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__inst.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=10,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
