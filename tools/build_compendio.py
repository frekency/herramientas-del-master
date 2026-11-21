# Genera datos/es/compendio.json (objetos, dotes, trasfondos, especies y clases del SRD 5.2.1 en español)
# a partir de la secuencia que produce stream.py.  Uso: python -I build_compendio.py srd.json datos/es/compendio.json
import json,re,sys,html as H

S=[tuple(e) for e in json.load(open(sys.argv[1],encoding='utf-8'))]
strip=lambda h:re.sub(r'<[^>]+>','',h)
def find(kind,lv,txt,start=0):
    for i in range(start,len(S)):
        e=S[i]
        if e[0]=='h' and e[1]==lv and (e[2]==txt if isinstance(txt,str) else txt(e[2])):return i
    raise SystemExit(f'no encuentro {txt}')
def until(i,stop):
    j=i+1
    while j<len(S) and not stop(S[j]):j+=1
    return j

def table_html(t,cap=''):
    h=f'<table class="cmtab">'+(f'<caption>{H.escape(cap)}</caption>' if cap else '')
    if t['head']:h+='<thead><tr>'+''.join(f'<th>{H.escape(c)}</th>' for c in t['head'])+'</tr></thead>'
    n=max([len(r) for r in t['rows']]+[len(t['head'] or [])])
    h+='<tbody>'+''.join(f'<tr><td colspan="{n}" class="sec">{H.escape(r[0])}</td></tr>' if len(r)==1 and n>1 else '<tr>'+''.join(f'<td>{H.escape(c)}</td>' for c in r)+'</tr>' for r in t['rows'])+'</tbody></table>'
    return h
def to_html(els,base=3):
    out=[];cap='';ul=False
    for e in els:
        if e[0]=='p' and e[1].lstrip().startswith(('•','●')):
            if not ul:out.append('<ul>');ul=True
            out.append('<li>'+re.sub(r'^\s*[•●]\s*','',e[1])+'</li>');continue
        if ul:out.append('</ul>');ul=False
        if e[0]=='h':
            if e[1]>=5:cap=e[2];continue                     # título de tabla
            lv=min(6,max(3,e[1]-base+3));out.append(f'<h{lv}>{H.escape(e[2])}</h{lv}>')
        elif e[0]=='p':out.append(f'<p>{e[1]}</p>')
        elif e[0]=='table':out.append(table_html(e[1],cap));cap=''
    if ul:out.append('</ul>')
    return ''.join(out)

def entries(lo,hi,lv):
    """Entradas de nivel lv entre lo y hi: [(nombre, página, [elementos])]. Las tablas con título que mencione
    otra entrada («Linajes élficos») se mueven a la entrada que las cita."""
    res=[];cur=None
    for e in S[lo:hi]:
        if e[0]=='h' and e[1]==lv:cur=[e[2],e[3],[]];res.append(cur)
        elif e[0]=='h' and e[1]<lv:cur=None
        elif cur:cur[2].append(e)
    # tablas descolocadas por la maquetación
    for r in res:
        els=r[2];k=0
        while k<len(els):
            e=els[k]
            if e[0]=='h' and e[1]>=5 and k+1<len(els) and els[k+1][0]=='table':
                cap=e[2];own=any(f'“{cap}”' in x[1] for x in els if x[0]=='p')
                if not own:
                    dest=next((o for o in res if o is not r and any(f'“{cap}”' in x[1] for x in o[2] if x[0]=='p')),None)
                    if dest:dest[2].extend([e,els[k+1]]);del els[k:k+2];continue
            k+=1
    return res

def first_italic(els):
    """Primer párrafo «<i>Tipo, rareza</i> texto…»: devuelve (cabecera, resto de elementos)."""
    if els and els[0][0]=='p':
        m=re.match(r'\s*<i>(.*?)</i>\s*(.*)$',els[0][1],re.S)
        if m:
            rest=[('p',m[2],els[0][2])] if m[2].strip() else []
            return strip(m[1]).strip(),rest+els[1:]
    return '',els

out={}
# ---------- objetos mágicos ----------
i=find('h',2,'Objetos mágicos de la A a la Z');j=find('h',1,'Monstruos',i)
objs=[]
for n,pg,els in entries(i,j,4):
    head,rest=first_italic(els)
    dep=0;cut=-1
    for ci,ch in enumerate(head):                       # primera coma fuera de paréntesis: «Arma (cimitarra, espada…), rara»
        dep+=(ch=='(')-(ch==')')
        if ch==',' and dep==0:cut=ci;break
    tipo,rr=(head[:cut].strip(),head[cut+1:].strip()) if cut>=0 else (head,'')
    sint=''
    ms=re.search(r'\((requiere sintonizaci[oó]n[^)]*)\)',rr)
    if ms:sint=ms[1];rr=rr.replace(ms[0],'').strip()
    objs.append({'n':n,'t':tipo,'r':rr.strip(' ,'),'s':sint,'d':to_html(rest),'pg':pg,'k':'magico'})
# ---------- equipo: armas, armaduras, herramientas y equipo de aventureros ----------
eq=find('h',1,'Equipo');eqend=find('h',1,'Conjuros',eq)
for e in S[eq:eqend]:
    if e[0]!='table' or not e[1]['head']:continue
    hd=e[1]['head']
    if hd[:2]==['Nombre','Daño']:kind='Arma'
    elif hd[:1]==['Armadura']:kind='Armadura'
    else:continue
    sec=''
    for r in e[1]['rows']:
        if len(r)==1:sec=r[0];continue
        if not r[0]:continue
        r=[re.sub(r'(alcance \d+(?:,\d+)?/\d+(?:,\d+)?)(?![\d,]|\s*m\b)',r'\1 m',c) for c in r]   # el SRD da el alcance sin unidad: son metros
        d=''.join(f'<p><b>{H.escape(h)}:</b> {H.escape(v)}</p>' for h,v in zip(hd[1:],r[1:]) if v)
        sub=re.sub(r'\s*\(.*\)','',sec).rstrip('s') if sec else kind
        objs.append({'n':r[0],'t':(sec[:1].upper()+sec[1:].split(' (')[0]) if sec else kind,'r':'','s':'','d':d,'pg':e[2],'k':'arma' if kind=='Arma' else 'armadura','precio':r[-1]})
for sect,kind in (('Herramientas','herramienta'),('Equipo de aventureros','equipo')):
    a=find('h',2,sect,eq);b=until(a,lambda e:e[0]=='h' and e[1]<=2)
    for n,pg,els in entries(a,b,4):
        m=re.match(r'(.*?)\s*\(([^)]*\d[^)]*)\)\s*$',n)
        name,price=(m[1],m[2]) if m else (n,'')
        objs.append({'n':name,'t':'Herramienta' if kind=='herramienta' else 'Equipo de aventurero','r':'','s':'','d':to_html(els),'pg':pg,'k':kind,'precio':price})
out['objetos']=objs
# ---------- dotes ----------
i=find('h',1,'Dotes');j=find('h',1,'Equipo',i)
CAT={'origen':'Origen','general':'General','estilo de combate':'Estilo de combate','don épico':'Don épico'}
dotes=[]
for n,pg,els in entries(i,j,4):
    head,rest=first_italic(els)
    m=re.match(r'Dote (de )?(origen|general|de estilo de combate|estilo de combate|de don épico|don épico)\s*(?:\((?:requisitos?:\s*)?(.*)\))?',head)
    cat=CAT.get(re.sub(r'^de ','',m[2]),'') if m else ''
    dotes.append({'n':n,'cat':cat,'req':re.sub(r'\s+',' ',m[3]).strip() if m and m[3] else '','d':to_html(rest),'pg':pg})
out['dotes']=dotes
# ---------- trasfondos ----------
i=find('h',3,'Descripciones de trasfondos');j=find('h',2,'Especies de personaje',i)
FIELDS={'Puntuaciones de característica':'car','Dote':'dote','Competencias en habilidades':'hab','Competencia con herramientas':'herr','Equipo':'equipo'}
tf=[]
for n,pg,els in entries(i,j,4):
    x={'n':n,'pg':pg}
    for e in els:
        if e[0]!='p':continue
        m=re.match(r'\s*<b>([^<:]+):\s*</b>\s*(.*)$',e[1],re.S)
        if m and m[1].strip() in FIELDS:x[FIELDS[m[1].strip()]]=re.sub(r'\s*\(consulta el capítulo[^)]*\)','',strip(m[2])).strip()
    x['d']=''.join(f'<p><b>{l}:</b> {H.escape(x.get(k,""))}</p>' for l,k in FIELDS.items() if x.get(k))
    tf.append(x)
out['trasfondos']=tf
# ---------- especies ----------
i=find('h',3,'Descripciones de las especies');j=find('h',1,'Dotes',i)
esp=[]
for n,pg,els in entries(i,j,4):
    x={'n':n,'pg':pg};rest=[]
    for e in els:
        if e[0]=='p':
            m=re.match(r'\s*<b>(Tipo de criatura|Tamaño|Velocidad):\s*</b>\s*(.*)$',e[1],re.S)
            if m:
                v=strip(m[2]);k={'Tipo de criatura':'tipo','Tamaño':'tam','Velocidad':'vel'}[m[1]]
                mm=re.match(r'(.*?)\s+(Como .*)$',v)     # «9 m Como enano, tienes…» viene en la misma línea
                if mm:v=mm[1];rest.append(('p',mm[2],e[2]))
                x[k]=v.strip();continue
        rest.append(e)
    x['d']=to_html(rest);esp.append(x)
out['especies']=esp
# ---------- clases ----------
i=find('h',1,'Clases');j=find('h',1,lambda t:t.startswith('Orígenes'),i)
cls=[]
for n,pg,els in entries(i,j,2):
    info={};k=0
    while k<len(els):
        if els[k][0]=='h' and els[k][2].startswith('Atributos básicos') and k+1<len(els) and els[k+1][0]=='table':
            for r in els[k+1][1]['rows']:
                if len(r)>=2:info[r[0]]=r[1]
            del els[k:k+2];break
        k+=1
    subs=[e[2].split(':',1)[1].strip() for e in els if e[0]=='h' and e[1]==3 and e[2].startswith('Subclase de')]
    cls.append({'n':n,'pg':pg,'info':info,'sub':subs,'d':to_html(els,base=3)})
out['clases']=cls
# ---------- reglas: el glosario y algunas secciones de «Cómo jugar» que se consultan en la mesa ----------
i=find('h',2,'Definiciones de las reglas');j=find('h',1,'Herramientas del juego',i)
reg=[]
for n,pg,els in entries(i,j,4):
    m=re.match(r'(.*?)\s*\[(.*?)\]$',n)
    reg.append({'n':m[1] if m else n,'tag':m[2] if m else '','d':to_html(els),'pg':pg})
have={fold for fold in (x['n'].lower() for x in reg)}
cj=find('h',1,'Cómo jugar');cje=find('h',1,'Creación de personajes',cj)
for name,lv in (('Ritmo de viaje',4),('Tamaño de una criatura',4),('Iluminación',4),('Zonas oscuras',4),('Sentidos especiales',4),('Tu turno',4),
                ('Moverse alrededor de otras criaturas',4),('Tirarse al suelo',4),('Ataques a distancia en combate cuerpo a cuerpo',4),('Combate montado',3),
                ('Combate bajo el agua',3),('Muerte instantánea',4),('Caer inconsciente',4),('Estabilizar a un personaje',4),('Daño contra varios objetivos',4),
                ('Resistencia y vulnerabilidad',3),('Interactuar con objetos',3),('Dividir el movimiento',4)):
    if name.lower() in have:continue
    a=find('h',lv,name,cj)
    if a>=cje:raise SystemExit(f'{name} fuera de «Cómo jugar»')
    b=until(a,lambda e:e[0]=='h' and e[1]<=lv)
    reg.append({'n':name,'tag':'cómo jugar','d':to_html(S[a+1:b],base=lv),'pg':S[a][3]})
RCAT={'Turno y reacciones':'Acción|Acción adicional|Reacción|Tu turno|Ataques de oportunidad|Dividir el movimiento|Iniciativa|Sorpresa',
  'Combate':'Tirada de ataque|Ataque con arma|Ataque de conjuro|Ataque sin armas|Agarrar|Noquear a una criatura|Crítico|Cobertura|Armas improvisadas|Arma|Ataques a distancia en combate cuerpo a cuerpo|Combate montado|Combate bajo el agua|Alcance|Clase de armadura|Objetivo|Enemigo|Aliado|Encuentro',
  'Daño y curación':'Daño|Tipos de daño|Tirada de daño|Resistencia|Vulnerabilidad|Inmunidad|Resistencia y vulnerabilidad|Daño contra varios objetivos|Puntos de golpe|Puntos de golpe temporales|Curación|Dados de puntos de golpe|Muerte instantánea|Caer inconsciente|Tirada de salvación contra muerte|Estabilizar a un personaje|Estable|Muerto|Maltrecho|Umbral de daño',
  'Movimiento':'Velocidad|Velocidad excavando|Velocidad nadando|Velocidad trepando|Velocidad volando|Saltar|Salto de altura|Salto de longitud|Trepar|Nadar|Volar|Arrastrarse|Levitar|Terreno difícil|Moverse alrededor de otras criaturas|Tirarse al suelo|Teletransporte|Tamaño de una criatura|Tamaño|Espacio ocupado|Espacio sin ocupar',
  'Visión y luz':'Iluminación|Zonas oscuras|Sentidos especiales|Luz brillante|Luz tenue|Oscuridad|Ligeramente oscuro|Muy oscuro|Visión ciega|Visión en la oscuridad|Visión verdadera|Sentir vibraciones|Telepatía',
  'Exploración':'Ritmo de viaje|Interactuar con objetos|Romper objetos|Capacidad de carga|Descanso corto|Descanso largo|Objeto|Aventura|Campaña',
  'Pruebas y tiradas':'Prueba con d20|Prueba de característica|Tirada de salvación|Salvación|Ventaja|Desventaja|Clase de dificultad|Competencia|Pericia|Habilidad|Percepción pasiva|Inspiración heroica|Redondear hacia abajo|Efectos simultáneos|Puntuación de característica y modificador|Entrenamiento con armaduras',
  'Magia':'Conjuro|Truco|Ritual|Concentración|Canalizador mágico|Efecto mágico|Ilusiones|Sintonización|Cambio de forma|Posesión|Maldiciones',
  'Interacción social':'Actitud'}
RC={n:c for c,ns in RCAT.items() for n in ns.split('|')}
TAGC={'acción':'Acciones','estado':'Estados','área de efecto':'Áreas de efecto','peligro':'Peligros','actitud':'Interacción social'}
for x in reg:x['cat']=TAGC.get(x['tag'])or RC.get(x['n'])or'General'
out['reglas']=reg

json.dump(out,open(sys.argv[2],'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
for k,v in out.items():print(k,len(v))
