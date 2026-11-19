// Genera build/icon.png (1024) desde icono/b-pantalla.svg usando Electron:  npx electron icono/render.cjs
const {app,BrowserWindow}=require('electron');const fs=require('fs'),path=require('path');
app.whenReady().then(async()=>{
  const w=new BrowserWindow({width:1024,height:1024,show:false,transparent:true,frame:false,webPreferences:{offscreen:true}});
  const svg=fs.readFileSync(path.join(__dirname,'b-pantalla.svg'),'utf8');
  await w.loadURL('data:text/html,'+encodeURIComponent('<style>html,body{margin:0;background:transparent}svg{display:block;width:1024px;height:1024px}</style>'+svg));
  await new Promise(r=>setTimeout(r,500));
  const img=await w.webContents.capturePage({x:0,y:0,width:1024,height:1024});
  fs.writeFileSync(path.join(__dirname,'..','build','icon.png'),img.toPNG());
  app.quit();
});
