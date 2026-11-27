// Asistente de creación de personaje (pasos del Manual del Jugador) en el navegador.
// Necesita Edge o Chrome (variable BROWSER para indicar otro); si no hay ninguno, el test se salta.
import {assert,http,MANUAL_JS,readFileSync,existsSync,mkdtempSync,rmSync,execFile,os,path,ROOT,PAGE,testNav} from './creador-lib.mjs';

const BROWSERS=[process.env.BROWSER,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome','/usr/bin/chromium','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const BROWSER=BROWSERS.find(b=>existsSync(b));

const head=`<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));addEventListener('unhandledrejection',e=>__err.push(String(e.reason)));localStorage.clear();</script>`;
const TAIL=`<script>
(async()=>{
  const R={c:[]},wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(n,v)=>R.c.push([n,!!v]);
  const q=s=>document.querySelector(s),body=()=>document.getElementById('pj-body');
  const click=async s=>{const b=q(s);if(!b)throw new Error('no hay '+s);b.click();await wait(120);};
  const sel=async(s,v)=>{const e=q(s);if(!e)throw new Error('no hay '+s);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));await wait(120);};
  const chk=async(s,v)=>{const e=q(s);if(!e)throw new Error('no hay '+s);e.checked=v;e.dispatchEvent(new Event('change',{bubbles:true}));await wait(120);};
  const marca=async(k,n)=>{for(let i=0;i<n;i++){const e=document.querySelectorAll('[data-pjw="'+k+'"]')[i];if(!e)throw new Error('no hay '+k+' '+i);e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}));await wait(120);}};
  const sig=()=>q('[data-w="sig"]'),op=(w,v)=>'[data-act="pjw"][data-w="'+w+'"][data-v="'+v+'"]';
  try{
    await wait(1500);
    ${MANUAL_JS}
    location.hash='#personajes';await wait(400);
    await click('[data-act="pjnew"]');
    ok('se abre el asistente en el paso 1 con 5 pasos',!!q('.pjw')&&q('.pjw-pasos').children.length===5&&q('[aria-current="step"]').textContent.includes('Clase')&&body().textContent.includes('Origen'));
    ok('no deja avanzar sin clase',sig().disabled);
    await click(op('cls','druida'));
    await chk('[data-pjw="sk"][value="arcanos"]',true);await chk('[data-pjw="sk"][value="medicina"]',true);
    ok('el druida con sus habilidades sigue bloqueado: le falta la Orden primigenia, marcada como pendiente',sig().disabled&&q('.pjw-rg.pend')&&q('.pjw-est').textContent.includes('pendiente')&&document.querySelectorAll('[data-pjw="el"]').length===2);
    await click('[data-pjw="el"][value="naturalista"]');
    ok('al elegirla se resuelve en el propio rasgo, pero el druida aún no puede seguir: le faltan los conjuros de nivel 1',!q('.pjw-rg.pend')&&q('.pjw-est').textContent.includes('Naturalista')&&sig().disabled);
    ok('el druida elige 3 trucos (2 y el del Naturalista) y 4 conjuros de nivel 1',q('.pjw-cj').textContent.includes('Trucos: elige 3 (0/3)')&&q('.pjw-cj').textContent.includes('Conjuros preparados de nivel 1: elige 4 (0/4)'));
    ok('solo se ofrecen trucos y conjuros de nivel 1 de la lista del druida, nunca de un nivel que aún no se tiene',(l=>l.length>20&&l.every(i=>{const s=SPELLS[i.value.toLowerCase()];return s&&s.lv<=1&&s.cls.some(c=>fold(c)==='druida');}))([...document.querySelectorAll('[data-pjw="tr"],[data-pjw="cp"]')])&&[...document.querySelectorAll('[data-pjw="tr"]')].every(i=>SPELLS[i.value.toLowerCase()].lv===0)&&[...document.querySelectorAll('[data-pjw="cp"]')].every(i=>SPELLS[i.value.toLowerCase()].lv===1));
    await marca('tr',3);await marca('cp',3);
    ok('con 3 trucos y solo 3 de los 4 conjuros sigue bloqueado',sig().disabled&&PJW.tr.length===3&&PJW.cp.length===3);
    await marca('cp',4);
    ok('con todos elegidos el resto se bloquea y se puede seguir',!sig().disabled&&[...document.querySelectorAll('[data-pjw="tr"]:not(:checked),[data-pjw="cp"]:not(:checked)')].every(e=>e.disabled));
    await click('[data-pjw="el"][value="guardian"]');
    ok('si cambia a Guardián pierde el truco extra del Naturalista, se queda con 2 trucos y puede seguir',PJW.tr.length===2&&!sig().disabled&&q('.pjw-cj').textContent.includes('Trucos: elige 2 (2/2)'));
    await click(op('cls','mago'));
    ok('al cambiar de clase se borran los conjuros del druida',PJW.tr.length===0&&PJW.cp.length===0);
    await marca('sk',2);await marca('tr',3);await marca('cp',6);
    ok('el mago anota 6 conjuros en su libro y aún no puede seguir: falta preparar 4',sig().disabled&&q('.pjw-cj').textContent.includes('Libro de conjuros (nivel 1): elige 6 (6/6)')&&document.querySelectorAll('[data-pjw="pp"]').length===6);
    await marca('pp',4);
    ok('prepara 4 de su libro, el resto se bloquea y puede seguir',!sig().disabled&&[...document.querySelectorAll('[data-pjw="pp"]:not(:checked)')].every(e=>e.disabled)&&PJW.pp.every(n=>PJW.cp.includes(n)));
    ok('el resumen del mago separa trucos, libro y preparados',(b=>b.some(x=>x[0]==='Trucos'&&x[1].split(', ').length===3)&&b.some(x=>x[0]==='Libro de conjuros')&&b.some(x=>x[0]==='Conjuros preparados'&&x[1].split(', ').length===4))(pjwResumen(PJW).bloques));
    await click(op('cls','guerrero'));
    ok('al cambiar de clase se borran las elecciones de la anterior y el guerrero no tiene rasgos con elección ni conjuros',!q('.pjw-ras')&&!q('.pjw-cj')&&Object.keys(PJW.el).length===0&&PJW.tr.length===0&&PJW.cp.length===0&&PJW.pp.length===0);
    await click(op('cls','guerrero'));
    ok('el guerrero pide 2 habilidades y sigue bloqueado',!!q('.pjw-chips input[value="atletismo"]')&&sig().disabled);
    await chk('[data-pjw="sk"][value="atletismo"]',true);await chk('[data-pjw="sk"][value="percepcion"]',true);
    ok('con las 2 elegidas las demás se bloquean y se puede seguir',q('[data-pjw="sk"][value="historia"]').disabled&&!sig().disabled);
    await click('[data-w="sig"]');
    ok('paso 2 Origen: las 10 especies y los 16 trasfondos en la misma pantalla',document.querySelectorAll('[data-w="esp"]').length===10&&document.querySelectorAll('[data-w="tf"]').length===16);
    await click(op('esp','Elfo'));
    ok('el elfo tiene linaje y sentidos agudos pendientes; la aptitud mágica aparece al elegir linaje',document.querySelectorAll('.pjw-rg.pend').length===2&&!q('[name="el-e:apt"]'));
    await click('[data-pjw="el"][data-k="e:linaje"][value="bosques"]');
    ok('con el linaje elegido sale la aptitud mágica (INT, SAB o CAR)',document.querySelectorAll('[data-k="e:apt"]').length===3&&document.querySelectorAll('.pjw-rg.pend').length===2);
    await click('[data-pjw="el"][data-k="e:apt"][value="sab"]');await click('[data-pjw="el"][data-k="e:sentidos"][value="percepcion"]');
    ok('con todo elegido ya no queda nada pendiente',document.querySelectorAll('.pjw-rg.pend').length===0&&pjwPend(PJW,'e').length===0);
    ok('el resumen da la competencia y la velocidad del elfo de los bosques',(r=>r.hab.percepcion===1&&r.vel==='10,5 m'&&r.rasgos.length===0&&r.origen.some(l=>l.includes('Linaje élfico: Elfo de los bosques')))(pjwResumen(Object.assign({},PJW,{cls:'guerrero',sk:['atletismo','historia']}))));   // los rasgos de especie los pone la ficha al crearse (Ficha.sincEspecie)
    ok('el elfo de los bosques recibe «Saber druídico» sin elegirlo y se avisa en el paso de Origen',pjwCjEsp(PJW).some(x=>x.n==='Saber druídico')&&body().textContent.includes('Tu especie te da sin elegirlos')&&body().textContent.includes('Saber druídico'));
    ok('ese truco no se ofrece otra vez entre los de la clase (un druida elfo de los bosques no puede elegirlo)',!pjwCjLista(Object.assign({},PJW,{cls:'druida'}),'Druida',0,'c').some(s=>s.n==='Saber druídico')&&pjwCjLista(Object.assign({},PJW,{cls:'druida',esp:'Mediano'}),'Druida',0,'c').some(s=>s.n==='Saber druídico'));
    await click(op('esp','Humano'));
    ok('el humano pide tamaño, habilidad (Diestro) y dote de origen (Versátil) y no deja seguir hasta elegirlos',document.querySelectorAll('.pjw-rg.pend').length===3&&pjwPend(PJW,'e').length===3&&sig().disabled);
    await click('[data-pjw="el"][data-k="e:tam"][value="Mediano"]');await click('[data-pjw="el"][data-k="e:diestro"][value="historia"]');await click('[data-pjw="el"][data-k="e:versatil"][value="Alerta"]');
    ok('con las tres elegidas no queda nada pendiente',pjwPend(PJW,'e').length===0);
    await click(op('tf','Acólito'));
    ok('el Acólito trae Iniciado en la magia (clérigo): lista fija, aptitud, 2 trucos y 1 conjuro de nivel 1 por elegir, y no deja seguir sin ellos',!pjwMiOk(PJW)&&q('.pjw-cj').textContent.includes('Iniciado en la magia')&&!q('[data-pjw="mil"]')&&!!q('[data-pjw="mia"]')&&q('.pjw-cj').textContent.includes('Trucos: elige 2 (0/2)')&&q('.pjw-cj').textContent.includes('Conjuro de nivel 1: elige 1 (0/1)')&&sig().disabled);
    ok('solo se ofrecen trucos y conjuros de nivel 1 de la lista de clérigo',(l=>l.length>8&&l.every(i=>{const s=SPELLS[i.value.toLowerCase()];return s&&s.lv<=1&&s.cls.some(c=>fold(c)==='clerigo');}))([...document.querySelectorAll('[data-pjw="mitr"],[data-pjw="mic"]')])&&[...document.querySelectorAll('[data-pjw="mitr"]')].every(i=>SPELLS[i.value.toLowerCase()].lv===0)&&[...document.querySelectorAll('[data-pjw="mic"]')].every(i=>SPELLS[i.value.toLowerCase()].lv===1));
    await marca('mitr',2);await click('[data-pjw="mic"]');await sel('[data-pjw="mia"]','sab');
    ok('con aptitud, 2 trucos y el conjuro elegidos queda completo y los demás trucos se bloquean',pjwMiOk(PJW)&&[...document.querySelectorAll('[data-pjw="mitr"]:not(:checked)')].every(e=>e.disabled)&&PJW.mi.tf.a==='sab'&&PJW.mi.tf.tr.length===2&&!!PJW.mi.tf.c);
    await click('[data-pjw="el"][data-k="e:versatil"][value="Iniciado en la magia"]');
    ok('si el humano elige Iniciado en la magia en Versátil sale una segunda fuente con lista a elegir, sin repetir la de clérigo',pjwMiFuentes(PJW).length===2&&!!q('[data-pjw="mil"][data-f="ve"]')&&q('[data-pjw="mil"][data-f="ve"] option[value="clerigo"]').disabled&&!pjwMiOk(PJW));
    await click('[data-pjw="el"][data-k="e:versatil"][value="Alerta"]');
    ok('al volver a Alerta se quita esa segunda fuente y lo del Acólito se conserva',pjwMiFuentes(PJW).length===1&&!PJW.mi.ve&&pjwMiOk(PJW));
    ok('lo elegido por la dote no se ofrece como truco de clase (un clérigo no repite sus trucos)',PJW.mi.tf.tr.every(n=>!pjwCjLista(Object.assign({},PJW,{cls:'clerigo'}),'Clérigo',0,'c').some(s=>s.n===n)));
    const miTf=pjwMiLista(PJW)[0];
    ok('el resumen recoge la lista y la aptitud del Iniciado en la magia',miTf.lista==='Clérigo'&&miTf.aptN==='Sabiduría'&&pjwResumen(PJW).bloques.some(x=>x[0]==='Iniciado en la magia'&&x[1].includes('Clérigo (Sabiduría)'))&&pjwResumen(PJW).origen.some(l=>l.includes('Iniciado en la magia (Clérigo')));
    ok('sin idiomas elegidos no deja seguir y común viene fijo',sig().disabled&&q('.pjw-fijos').textContent.includes('Común'));
    ok('la tabla de idiomas tiene los 9 estándar del manual y no los inusuales',document.querySelectorAll('[data-pjw="idi"]').length===9&&!q('[data-pjw="idi"][value="Abisal"]'));
    await chk('[data-pjw="idi"][value="Enano"]',true);await chk('[data-pjw="idi"][value="Elfo"]',true);
    ok('con dos elegidos el resto se bloquea (falta aún repartir los puntos del trasfondo)',q('[data-pjw="idi"][value="Orco"]').disabled&&sig().disabled);
    ok('el pícaro y el druida llevan su idioma de clase y el pícaro elige uno más (estándar o inusual)',(p=>p.fijos.join()==='Común,Jerga de ladrones'&&p.n===3&&p.pool.includes('Abisal')&&!p.pool.includes('Jerga de ladrones'))(pjwIdiomas({cls:'picaro'}))&&pjwIdiomas({cls:'druida'}).fijos.join()==='Común,Druídico'&&pjwIdiomas({cls:'bardo'}).n===2);
    ok('herramientas: «elige tres instrumentos» (bardo) y «elige un tipo de instrumento / juego» (trasfondo) son elecciones con cupo y lista; lo demás son competencias fijas',(a=>a.elec.n===3&&a.elec.cat==='instrumento'&&a.elec.k==='hc'&&!a.fijas.length)(pjwHerrDe('Elige tres instrumentos musicales (consulta el capítulo «Equipo»)','clase Bardo','hc'))&&(a=>a.elec.n===1&&a.elec.cat==='instrumento')(pjwHerrDe('elige un tipo de instrumento musical (consulta el capítulo 6)','trasfondo Animador','ht'))&&pjwHerrDe('elige un tipo de juego','trasfondo Soldado','ht').elec.cat==='juego'&&pjwHerrDe('suministros de calígrafo','trasfondo Escriba','ht').fijas.map(x=>x.n).join()==='Suministros de calígrafo'&&PJW_HERR_CAT.instrumento.pool.length===10&&PJW_HERR_CAT.artesano.pool.length===17);
    const bt=(w,a)=>'[data-act="pjw"][data-w="'+w+'"][data-v="'+a+'"]';
    ok('el trasfondo muestra sus 3 características con +2 y +1 y bloquea hasta repartir',document.querySelectorAll('.pjw-bono li').length===3&&document.querySelectorAll('.pjw-bono button').length===6&&sig().disabled);
    await click(bt('b2','sab'));
    ok('al poner +2 ya no deja poner otro +2 y esa característica no admite +1',q(bt('b2','car')).disabled&&q(bt('b2','int')).disabled&&q(bt('b1','sab')).disabled&&!q(bt('b1','car')).disabled&&sig().disabled);
    await click(bt('b1','car'));
    ok('con +2 SAB y +1 CAR el reparto está completo: el resto se bloquea y se puede seguir',q(bt('b1','int')).disabled&&q(bt('b2','int')).disabled&&!sig().disabled&&body().textContent.includes('Reparto completo'));
    await click(bt('b1','car'));
    ok('pulsar de nuevo quita el punto y libera las opciones',!q(bt('b1','int')).disabled&&sig().disabled);
    await click(bt('b1','car'));
    await click('[data-w="tfm"][data-v="111"]');
    ok('+1 a las tres: no hay nada que repartir y se puede seguir',document.querySelectorAll('.pjw-n').length===3&&!sig().disabled);
    await click('[data-w="tfm"][data-v="21"]');
    ok('al volver a +2 y +1 se conserva el reparto',!sig().disabled&&q(bt('b2','sab')).getAttribute('aria-pressed')==='true');
    await click('[data-w="sig"]');
    ok('paso 4: sin asignar no avanza',sig().disabled);
    const orden=['fue','con','des','sab','car','int'];
    for(const [i,a] of orden.entries())await sel('[data-pjw="asig"][data-a="'+a+'"]',String(i));
    ok('con los 6 valores asignados avanza y no repite valores',!sig().disabled&&q('[data-pjw="asig"][data-a="des"] option[value="0"]').disabled);
    ok('la tabla suma el trasfondo (SAB 12+2=14, CAR 10+1=11)',q('.pjw-car').textContent.includes('14')&&q('.pjw-car').textContent.includes('11'));
    await click('[data-w="atras"]');await click('[data-w="sig"]');
    ok('atrás y adelante conservan lo asignado',q('[data-pjw="asig"][data-a="fue"]').value==='0');
    await chk('[data-pjw="met"][value="compra"]',true);
    ok('compra de puntos: todo a 8 gasta 0 y deja avanzar',body().textContent.includes('0 / 27')&&!sig().disabled);
    for(let i=0;i<4;i++)await click(op('mas','fue'));
    ok('el coste de compra sube (FUE 12 = 4 puntos)',body().textContent.includes('4 / 27'));
    await chk('[data-pjw="met"][value="tabla"]',true);
    ok('tabla predefinida: el guerrero recibe 15 14 13 8 10 12 y se puede seguir sin asignar nada',!sig().disabled&&[...document.querySelectorAll('.pjw-car tbody tr')].map(r=>r.children[1].textContent).join()==='15,14,13,8,10,12'&&!q('[data-pjw="asig"]'));
    ok('cada fila de la tabla usa exactamente 15, 14, 13, 12, 10 y 8 (sin errores de transcripción)',Object.keys(CLSN).every(k=>PJW_TABLA[k]&&PJW_TABLA[k].slice().sort((x,y)=>y-x).join()==='15,14,13,12,10,8'));
    ok('las cuatro formas de repartir están disponibles',document.querySelectorAll('[data-pjw="met"]').length===4);
    await click('[data-w="ajustar"]');
    ok('«Ajustarlo a mano» pasa al conjunto estándar con ese reparto ya puesto',q('[data-pjw="met"][value="std"]').checked&&q('[data-pjw="asig"][data-a="fue"]').value==='0'&&!sig().disabled);
    await chk('[data-pjw="met"][value="std"]',true);
    for(const [i,a] of orden.entries())await sel('[data-pjw="asig"][data-a="'+a+'"]',String(i));
    await click('[data-w="sig"]');
    ok('paso 4 Detalles: nombre, alineamiento, personalidad, ideales, vínculos, defectos e historia juntos',!!q('#pjw-n')&&!!q('[data-pjw="alin"]')&&['personalidad','ideales','vinculos','defectos','historia'].every(k=>!!q('textarea[data-pjw="'+k+'"]')));
    ok('los pasos son 5 y el último de datos es Detalles',q('.pjw-pasos').children.length===5);
    await sel('[data-pjw="alin"]','Legal bueno');
    q('#pjw-n').value='Brenna';q('#pjw-n').dispatchEvent(new Event('input',{bubbles:true}));
    for(const [k,v] of [['personalidad','Directa y leal'],['ideales','Honor'],['vinculos','Mi hermana'],['defectos','Terca'],['historia','Soldado retirado']]){const e=q('textarea[data-pjw="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}
    await click('[data-w="sig"]');
    ok('el resumen va en bloques (habilidades, dotes, equipo…) y guarda el desglose aparte',document.querySelectorAll('.pjw-res section').length>=6&&body().textContent.includes('Dotes y mejoras')&&body().textContent.includes('Legal bueno')&&body().textContent.includes('trasfondo Acólito'));
    await click('[data-w="sig"]');
    const f=PJ[PJ.length-1];
    ok('la ficha guarda los idiomas',f.otras.idiomas.join()==='Común,Enano,Elfo');
    ok('la ficha creada lleva nombre, clase, especie y trasfondo',!!f&&f.nombre==='Brenna'&&f.niveles[0].c==='guerrero'&&f.especie==='Humano'&&f.trasfondo==='Acólito');
    ok('características: reparto + trasfondo',f.car.fue===15&&f.car.con===14&&f.car.des===13&&f.car.sab===14&&f.car.car===11&&f.car.int===8);
    ok('competencias de clase, trasfondo y especie (Diestro)',f.habil.atletismo===1&&f.habil.percepcion===1&&f.habil.perspicacia===1&&f.habil.religion===1&&f.habil.historia===1);
    ok('las elecciones de la especie quedan en la ficha, con sus rasgos',f.lin.v.diestro==='historia'&&f.lin.v.versatil==='Alerta'&&['Ingenioso','Diestro: Historia','Versátil: Alerta'].every(n=>f.rasgos.some(r=>r.n===n)));
    ok('salvaciones del guerrero, dotes (la del trasfondo y la Versátil) y alineamiento',f.salvac.join()==='fue,con'&&f.dotes.length===2&&f.dotes[0].includes('Iniciado en la magia')&&f.dotes[1]==='Alerta'&&f.pers.alineamiento==='Legal bueno'&&f.pers.ideales==='Honor'&&f.pers.vinculos==='Mi hermana'&&f.pers.defectos==='Terca'&&f.pers.historia==='Soldado retirado'&&f.pers.personalidad==='Directa y leal');
    ok('la ficha trae los rasgos de clase del nivel 1 con su texto (Estilo de combate, Maestría con armas, Tomar aliento) además de los de especie',['estilo de combate','maestria con armas','tomar aliento'].every(n=>f.rasgos.some(r=>fold(r.n)===n&&r.txt.length>20)));
    ok('el registro guarda el desglose',f.registro.length>=8&&f.registro.some(r=>r.d.includes('trasfondo Acólito')));
    ok('la ficha lleva los 2 trucos y el conjuro del Iniciado en la magia, con el de nivel 1 de nivel 1 y siempre preparado',f.conjuros.length===3&&f.conjuros.filter(n=>!f.magia.niv[n]).length===2&&Object.values(f.magia.niv).join()==='1'&&f.magia.prep.length===1&&f.conjuros.includes(f.magia.prep[0]));
    ok('el guerrero no lanza conjuros por clase: la aptitud mágica es la de la dote (Sabiduría) y queda un rasgo con su uso diario',f.magia.hab==='sab'&&f.rasgos.some(r=>r.n==='Iniciado en la magia (Clérigo)'&&r.txt.includes('Sabiduría')&&r.r)&&f.recursos.some(q=>q.n==='Iniciado en la magia (Clérigo)'&&q.max===1&&q.rec==='largo'));
    ok('se abre la hoja del personaje',location.hash==='#personajes/'+f.id);
  }catch(e){(window.__err=window.__err||[]).push('flujo: '+e+' '+(e.stack||'').split('\\n')[1]);}
  R.err=window.__err||[];
  const pre=document.createElement('pre');pre.id='__res';pre.textContent=JSON.stringify(R);document.body.append(pre);
})();
</script>`;

function serve(){
  const srv=http.createServer((q,r)=>{
    const u=decodeURIComponent(new URL(q.url,'http://x').pathname);
    if(u==='/__creador.html'){r.writeHead(200,{'content-type':'text/html; charset=utf-8'});return r.end(head+PAGE+TAIL);}
    const f=path.join(ROOT,path.normalize(u).replace(/^([/\\])+/,''));
    if(!f.startsWith(ROOT)||!existsSync(f)){r.writeHead(404);return r.end();}
    try{r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'application/octet-stream'});r.end(readFileSync(f));}catch{r.writeHead(404);r.end();}
  });
  return new Promise(ok=>srv.listen(0,'127.0.0.1',()=>ok(srv)));
}

testNav('el asistente crea un personaje paso a paso',{manual:true,skip:!BROWSER&&'no hay Edge ni Chrome',timeout:120000},async()=>{
  const srv=await serve(),port=srv.address().port,prof=mkdtempSync(path.join(os.tmpdir(),'hdm-cr-'));
  try{
    const dom=await new Promise((ok,ko)=>execFile(BROWSER,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
      `--user-data-dir=${prof}`,'--virtual-time-budget=60000','--dump-dom',`http://127.0.0.1:${port}/__creador.html`],{maxBuffer:64<<20,timeout:110000},(e,out)=>e&&!out?ko(e):ok(out)));
    const m=dom.match(/<pre id="__res">([\s\S]*?)<\/pre>/);
    assert.ok(m,'la página no terminó el flujo: '+dom.slice(-300));
    const R=JSON.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    assert.deepEqual(R.err,[],'errores de JavaScript');
    assert.deepEqual(R.c.filter(c=>!c[1]).map(c=>c[0]),[],'comprobaciones que fallan');
    assert.ok(R.c.length>=23,'el flujo se quedó a medias ('+R.c.length+')');
  }finally{srv.close();try{rmSync(prof,{recursive:true,force:true});}catch{}}
});
