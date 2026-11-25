/* Service worker de la web (PWA). Primero la red y, si no hay conexión, la última copia guardada:
   así las actualizaciones llegan siempre y la app abre sin conexión con lo que ya se haya visitado.
   Solo guarda peticiones GET del propio sitio; nada de otros dominios (cuentas, nube). */
const VERSION='1.121.0';
const CACHE='hdm-'+VERSION;

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','index.html','manifest.webmanifest','icons/icon-512.png'])).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('hdm-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==self.location.origin)return;
  e.respondWith((async()=>{
    try{
      const res=await fetch(r);
      if(res&&res.status===200&&res.type==='basic'){const c=await caches.open(CACHE);c.put(r,res.clone());}
      return res;
    }catch(err){
      const hit=await caches.match(r,{ignoreSearch:true});
      if(hit)return hit;
      if(r.mode==='navigate'){const idx=await caches.match('index.html');if(idx)return idx;}
      throw err;
    }
  })());
});
