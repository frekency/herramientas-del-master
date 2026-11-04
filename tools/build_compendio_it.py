# Versión italiana de build_compendio.py: mismas utilidades, con los nombres de secciones y campos del SRD 5.2.1 en italiano.
# Las categorías (k de objetos, cat de dotes y de reglas) se guardan con las mismas claves que en español para que
# la página las traduzca al mostrarlas.  Uso: python -I build_compendio_it.py srd_it.json compendio_srd_it.json
import os,sys
_src=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'build_compendio.py'),encoding='utf-8').read()
exec(_src[:_src.index('\nout={}')])

out={}
# ---------- oggetti magici ----------
i=find('h',2,'Oggetti magici A–Z');j=find('h',1,'Mostri',i)
objs=[]
for n,pg,els in entries(i,j,4):
    head,rest=first_italic(els)
    dep=0;cut=-1
    for ci,ch in enumerate(head):
        dep+=(ch=='(')-(ch==')')
        if ch==',' and dep==0:cut=ci;break
    tipo,rr=(head[:cut].strip(),head[cut+1:].strip()) if cut>=0 else (head,'')
    sint=''
    ms=re.search(r'\((richiede (?:la )?sintonia[^)]*)\)',rr,re.I)
    if ms:sint=ms[1];rr=rr.replace(ms[0],'').strip()
    objs.append({'n':n,'t':tipo,'r':rr.strip(' ,'),'s':sint,'d':to_html(rest),'pg':pg,'k':'magico'})
# ---------- equipaggiamento ----------
eq=find('h',1,'Equipaggiamento');eqend=find('h',1,'Incantesimi',eq)
pk=None;seen=set()
for e in S[eq:eqend]:
    if e[0]!='table' or not e[1]['head']:continue
    hd=e[1]['head']
    if hd[:2]==['Nome','Danni']:kind='Arma'
    elif hd[:1]==['Armature']:kind='Armatura'
    else:continue
    if kind!=pk:sec=''   # la tabla de armas sigue en la página siguiente con la misma sección
    pk=kind
    for r in e[1]['rows']:
        if len(r)==1:sec=r[0];continue
        if not r[0] or (r[0],kind) in seen:continue
        seen.add((r[0],kind))
        r=[re.sub(r'(Gittata \d+(?:,\d+)?/\d+(?:,\d+)?)(?![\d,]|\s*m\b)',r'\1 m',c) for c in r]   # la gittata va sin unidad: metros
        d=''.join(f'<p><b>{H.escape(h)}:</b> {H.escape(v)}</p>' for h,v in zip(hd[1:],r[1:]) if v)
        objs.append({'n':r[0],'t':(sec[:1].upper()+sec[1:].split(' (')[0]) if sec else kind,'r':'','s':'','d':d,'pg':e[2],'k':'arma' if kind=='Arma' else 'armadura','precio':r[-1]})
for sect,kind in (('Strumenti','herramienta'),("Equipaggiamento d'avventura",'equipo')):
    a=find('h',2,sect,eq);b=until(a,lambda e:e[0]=='h' and e[1]<=2)
    for n,pg,els in entries(a,b,4):
        m=re.match(r'(.*?)\s*\(([^)]*\d[^)]*)\)\s*$',n)
        name,price=(m[1],m[2]) if m else (n,'')
        objs.append({'n':name,'t':'Strumento' if kind=='herramienta' else "Equipaggiamento d'avventura",'r':'','s':'','d':to_html(els),'pg':pg,'k':kind,'precio':price})
out['objetos']=objs
# ---------- talenti ----------
i=find('h',1,'Talenti');j=find('h',1,'Equipaggiamento',i)
CAT={'origini':'Origen','generale':'General','stile di combattimento':'Estilo de combate','dono epico':'Don épico'}
dotes=[]
for n,pg,els in entries(i,j,4):
    head,rest=first_italic(els)
    m=re.match(r'Talento (Origini|Generale|Stile di combattimento|Dono epico)\s*(?:\((?:prerequisit[oi]:\s*)?(.*)\))?',head.strip(),re.I)
    dotes.append({'n':n,'cat':CAT.get(m[1].lower(),'') if m else '','req':re.sub(r'\s+',' ',m[2]).strip() if m and m[2] else '','d':to_html(rest),'pg':pg})
out['dotes']=dotes
# ---------- background ----------
i=find('h',3,'Descrizioni dei background');j=find('h',2,'Specie dei personaggi',i)
FIELDS={'Punteggi di caratteristica':'car','Talento':'dote','Competenze nelle abilità':'hab','Competenza negli strumenti':'herr','Equipaggiamento':'equipo'}
tf=[]
for n,pg,els in entries(i,j,4):
    x={'n':n,'pg':pg}
    for e in els:
        if e[0]!='p':continue
        m=re.match(r'\s*<b>([^<:]+?)\s*:\s*</b>\s*(.*)$',e[1],re.S)
        if m and m[1].strip() in FIELDS:x[FIELDS[m[1].strip()]]=re.sub(r'\s*\(vedi [^)]*\)','',strip(m[2])).strip()
    x['d']=''.join(f'<p><b>{l}:</b> {H.escape(x.get(k,""))}</p>' for l,k in FIELDS.items() if x.get(k))
    tf.append(x)
out['trasfondos']=tf
# ---------- specie ----------
i=find('h',3,'Descrizioni delle specie');j=find('h',1,'Talenti',i)
esp=[]
for n,pg,els in entries(i,j,4):
    x={'n':n,'pg':pg};rest=[]
    for e in els:
        if e[0]=='p':
            m=re.match(r'\s*<b>\s*(Tipo di creatura|Taglia|Velocità)\s*:\s*</b>\s*(.*)$',e[1],re.S)
            if m:
                v=strip(m[2]);k={'Tipo di creatura':'tipo','Taglia':'tam','Velocità':'vel'}[m[1]]
                mm=re.match(r'(.*?)\s+(In quanto .*)$',v)
                if mm:v=mm[1];rest.append(('p',mm[2],e[2]))
                x[k]=v.strip();continue
        rest.append(e)
    x['d']=to_html(rest);esp.append(x)
out['especies']=esp
# ---------- classi ----------
LABELS=['Caratteristiche primarie','Dado Vita','Competenze nei tiri salvezza','Competenze nelle abilità',
        'Competenza nelle armi','Competenza negli strumenti','Competenza nelle armature','Equipaggiamento iniziale']
i=find('h',1,'Classi');j=find('h',1,lambda t:t.startswith('Origini dei personaggi'),i)
cls=[]
for n,pg,els in entries(i,j,2):
    info={};k=0
    while k<len(els):
        if els[k][0]=='h' and els[k][2].startswith('Tratti d') and k+1<len(els) and els[k+1][0]=='table':
            rows=[]
            for r in els[k+1][1]['rows']:
                if len(r)<2:continue
                if rows and r[0][:1].islower():rows[-1]=[rows[-1][0]+' '+r[0],(rows[-1][1]+' '+r[1]).strip()]   # etiqueta en dos líneas
                else:rows.append(list(r[:2]))
            for a,b in rows:
                two=[l for l in LABELS if l in a]
                sp=re.search(r'\b(?:Due|Tre|Quattro|A scelta)\b',b)
                if len(two)==2 and sp:      # dos filas fundidas: el segundo valor empieza por «Due …» o «A scelta …»
                    two.sort(key=a.index);c=sp.start()
                    info[two[0]]=b[:c].strip();info[two[1]]=b[c:].strip()
                else:info[a]=b
            del els[k:k+2];break
        k+=1
    subs=[e[2].split(':',1)[1].strip() for e in els if e[0]=='h' and e[1]==3 and e[2].startswith('Sottoclasse') and ':' in e[2]]
    cls.append({'n':n,'pg':pg,'info':info,'sub':subs,'d':to_html(els,base=3)})
out['clases']=cls
# ---------- regole ----------
i=find('h',2,'Definizione delle regole');j=find('h',1,'Strumenti di gioco',i)
reg=[]
for n,pg,els in entries(i,j,4):
    m=re.match(r'(.*?)\s*\[(azione|condizione|area di effetto|pericolo|atteggiamento)\]$',n)
    reg.append({'n':m[1] if m else n,'tag':(m[2] if m else '').lower(),'d':to_html(els),'pg':pg})
have={x['n'].lower() for x in reg}
cj=find('h',1,'Come si gioca');cje=find('h',1,lambda t:t.startswith('Creazione del'),cj)
for name,lv in (('Passo di viaggio',4),('Taglia delle creature',4),('Luce',4),('Aree oscurate',4),('Sensi speciali',4),('Il turno di un personaggio',4),
                ('Muoversi attorno ad altre creature',4),('Buttarsi a terra proni',4),('Attacchi a distanza in combattimento ravvicinato',4),('Combattere in sella',3),
                ("Combattere sott'acqua",3),('Morte istantanea',4),('Perdere conoscenza (privo di sensi)',4),('Stabilizzare un personaggio',4),('Danni contro bersagli multipli',4),
                ('Resistenza e vulnerabilità',3),('Interazioni con gli oggetti',3),('Spezzare il proprio movimento',4)):
    if name.lower() in have:continue
    a=find('h',lv,name,cj)
    if a>=cje:raise SystemExit(f'{name} fuori da «Come si gioca»')
    b=until(a,lambda e:e[0]=='h' and e[1]<=lv)
    reg.append({'n':name,'tag':'come si gioca','d':to_html(S[a+1:b],base=lv),'pg':S[a][3]})
RCAT={'Turno y reacciones':'Azione|Azione bonus|Reazione|Il turno di un personaggio|Attacchi di opportunità|Spezzare il proprio movimento|Iniziativa|Sorpresa',
  'Combate':"Tiro per colpire|Attacco con arma|Attacco con incantesimo|Colpo senz'armi|Afferrare|Tramortire una creatura|Colpo critico|Copertura|Armi improvvisate|Arma|Attacchi a distanza in combattimento ravvicinato|Combattere in sella|Combattere sott'acqua|Portata|Classe Armatura|Bersaglio|Nemico|Alleato|Incontro",
  'Daño y curación':'Danni|Tipi di danno|Tiro per i danni|Resistenza|Vulnerabilità|Immunità|Resistenza e vulnerabilità|Danni contro bersagli multipli|Punti ferita|Punti ferita temporanei|Guarigione|Dadi Vita|Morte istantanea|Perdere conoscenza (privo di sensi)|Tiro salvezza contro morte|Stabilizzare un personaggio|Stabile|Morte|Sanguinante|Soglia di danno',
  'Movimiento':'Velocità|Velocità di scavo|Velocità di nuoto|Velocità di scalata|Velocità di volo|Saltare|Salto in alto|Salto in lungo|Scalare|Nuotare|Volare|Strisciare|Fluttuare|Terreno difficile|Muoversi attorno ad altre creature|Buttarsi a terra proni|Teletrasporto|Taglia delle creature|Taglia|Spazio occupato|Spazio libero',
  'Visión y luz':'Luce|Aree oscurate|Sensi speciali|Luce intensa|Luce fioca|Oscurità|Leggermente oscurata|Pesantemente oscurata|Vista cieca|Scurovisione|Vista pura|Percezione tellurica|Telepatia',
  'Exploración':'Passo di viaggio|Interazioni con gli oggetti|Rompere gli oggetti|Capacità di trasporto|Riposo breve|Riposo lungo|Oggetto|Avventura|Campagna',
  'Pruebas y tiradas':'Prova con D20|Prova di caratteristica|Tiro salvezza|Vantaggio|Svantaggio|Classe Difficoltà|Competenza|Maestria|Abilità|Percezione passiva|Ispirazione eroica|Arrotondare per difetto|Effetti simultanei|Punteggio di caratteristica e modificatore|Competenza nelle armature',
  'Magia':'Incantesimo|Trucchetto|Rituale|Concentrazione|Focus da incantatore|Effetto magico|Illusioni|Sintonia|Mutaforma|Possessione|Maledizioni',
  'Interacción social':'Atteggiamento'}
RC={n:c for c,ns in RCAT.items() for n in ns.split('|')}
TAGC={'azione':'Acciones','condizione':'Estados','area di effetto':'Áreas de efecto','pericolo':'Peligros','atteggiamento':'Interacción social'}
for x in reg:x['cat']=TAGC.get(x['tag'])or RC.get(x['n'])or'General'
out['reglas']=reg

json.dump(out,open(sys.argv[2],'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
for k,v in out.items():print(k,len(v))
