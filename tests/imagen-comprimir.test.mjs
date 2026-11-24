// Compresión de imágenes subidas: WebP, calidad alta, sin pasarse del límite y conservando la transparencia.
// Necesita Edge o Chrome; si no hay, se salta.
import {assert,http,readFileSync,existsSync,mkdtempSync,rmSync,execFile,os,path,ROOT,PAGE,testNav} from './creador-lib.mjs';

const BROWSER=[process.env.BROWSER,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe','/usr/bin/google-chrome','/usr/bin/chromium'].filter(Boolean).find(b=>existsSync(b));
const head=`<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));localStorage.clear();</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},ok=(n,v)=>R.c.push([n,!!v]);
  try{
    await new Promise(r=>setTimeout(r,1200));
    const crea=(w,h,ruido)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#c33');g.addColorStop(1,'#36c');x.fillStyle=g;x.fillRect(0,0,w,h);
      if(ruido){const id=x.getImageData(0,0,w,h),d=id.data;for(let i=0;i<d.length;i+=4){const n=(Math.random()*40-20)|0;d[i]+=n;d[i+1]+=n;d[i+2]+=n;}x.putImageData(id,0,0);}return c;};
    const carga=c=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=c.toDataURL('image/png');});
    const dim=d=>new Promise(r=>{const i=new Image();i.onload=()=>r([i.naturalWidth,i.naturalHeight]);i.src=d;});
    const grande=await carga(crea(4000,3000,true));
    const d=imgComprimir(grande,2048,880000);
    ok('una imagen de 4000x3000 con ruido cabe en el límite',!!d&&d.length<=880000);
    ok('sale en WebP',d.startsWith('data:image/webp'));
    const [w,h]=await dim(d);
    ok('no pasa de 2048 de lado y conserva la proporción',Math.max(w,h)<=2048&&Math.abs(w/h-4/3)<0.02);
    const suave=await carga(crea(1200,800,false));
    const s=imgComprimir(suave,2048,880000);
    ok('una imagen limpia mantiene su tamaño original',(await dim(s)).join()==='1200,800'&&s.length<300000);
    ok('un límite imposible devuelve vacío sin colgarse',imgComprimir(grande,2048,500)==='');
    const tr=document.createElement('canvas');tr.width=200;tr.height=200;const t=tr.getContext('2d');t.fillStyle='#f00';t.fillRect(50,50,100,100);
    const dt=imgComprimir(await carga(tr),480,390000),im=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=dt;});
    const cc=document.createElement('canvas');cc.width=200;cc.height=200;const cx=cc.getContext('2d');cx.drawImage(im,0,0);
    ok('conserva la transparencia',cx.getImageData(5,5,1,1).data[3]===0&&cx.getImageData(100,100,1,1).data[3]===255);
    ok('el resultado pasa la validación de datos de la app',/^data:image\\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(d));
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+(e.stack||'').split('\\n')[1]);}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;
function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__img.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}
testNav('las imágenes subidas se comprimen a WebP sin perder mucha calidad',{skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-img-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',`--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__img.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=7,'se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
