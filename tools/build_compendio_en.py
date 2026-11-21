# Versión inglesa de build_compendio.py: mismas utilidades, con los nombres de secciones y campos del SRD 5.2.1 en inglés.
# Las categorías (k de objetos, cat de dotes y de reglas) se guardan con las mismas claves que en español para que
# la página las traduzca al mostrarlas.  Uso: python -I build_compendio_en.py srd_en.json datos/en/compendio.json
import os,sys
_src=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'build_compendio.py'),encoding='utf-8').read()
exec(_src[:_src.index('\nout={}')])

out={}
# ---------- magic items ----------
i=find('h',2,'Magic Items A–Z');j=find('h',1,'Monsters',i)
objs=[]
for n,pg,els in entries(i,j,4):
    head,rest=first_italic(els)
    dep=0;cut=-1
    for ci,ch in enumerate(head):
        dep+=(ch=='(')-(ch==')')
        if ch==',' and dep==0:cut=ci;break
    tipo,rr=(head[:cut].strip(),head[cut+1:].strip()) if cut>=0 else (head,'')
    sint=''
    ms=re.search(r'\((requires attunement[^)]*)\)',rr,re.I)
    if ms:sint=ms[1];rr=rr.replace(ms[0],'').strip()
    objs.append({'n':n,'t':tipo,'r':rr.strip(' ,'),'s':sint,'d':to_html(rest),'pg':pg,'k':'magico'})
# ---------- equipment ----------
eq=find('h',1,'Equipment');eqend=find('h',1,'Spells',eq)
for e in S[eq:eqend]:
    if e[0]!='table' or not e[1]['head']:continue
    hd=e[1]['head']
    if hd[:2]==['Name','Damage']:kind='Weapon'
    elif hd[:1]==['Armor']:kind='Armor'
    else:continue
    sec=''
    for r in e[1]['rows']:
        if len(r)==1:sec=r[0];continue
        if not r[0]:continue
        r=[re.sub(r'(Range \d+/\d+)(?![\d/]|\s*(?:feet|ft))',r'\1 feet',c) for c in r]   # el alcance viene sin unidad: son pies
        d=''.join(f'<p><b>{H.escape(h)}:</b> {H.escape(v)}</p>' for h,v in zip(hd[1:],r[1:]) if v)
        objs.append({'n':r[0],'t':(sec[:1].upper()+sec[1:].split(' (')[0]) if sec else kind,'r':'','s':'','d':d,'pg':e[2],'k':'arma' if kind=='Weapon' else 'armadura','precio':r[-1]})
for sect,kind in (('Tools','herramienta'),('Adventuring Gear','equipo')):
    a=find('h',2,sect,eq);b=until(a,lambda e:e[0]=='h' and e[1]<=2)
    for n,pg,els in entries(a,b,4):
        m=re.match(r'(.*?)\s*\(([^)]*\d[^)]*)\)\s*$',n)
        name,price=(m[1],m[2]) if m else (n,'')
        objs.append({'n':name,'t':'Tool' if kind=='herramienta' else 'Adventuring Gear','r':'','s':'','d':to_html(els),'pg':pg,'k':kind,'precio':price})
out['objetos']=objs
# ---------- feats ----------
i=find('h',1,'Feats');j=find('h',1,'Equipment',i)
CAT={'origin':'Origen','general':'General','fighting style':'Estilo de combate','epic boon':'Don épico'}
dotes=[]
for n,pg,els in entries(i,j,4):
    head,rest=first_italic(els)
    m=re.match(r'(Origin|General|Fighting Style|Epic Boon) Feat\s*(?:\((?:Prerequisites?:\s*)?(.*)\))?',head,re.I)
    dotes.append({'n':n,'cat':CAT.get(m[1].lower(),'') if m else '','req':re.sub(r'\s+',' ',m[2]).strip() if m and m[2] else '','d':to_html(rest),'pg':pg})
out['dotes']=dotes
# ---------- backgrounds ----------
i=find('h',3,'Background Descriptions');j=find('h',2,'Character Species',i)
FIELDS={'Ability Scores':'car','Feat':'dote','Skill Proficiencies':'hab','Tool Proficiency':'herr','Equipment':'equipo'}
tf=[]
for n,pg,els in entries(i,j,4):
    x={'n':n,'pg':pg}
    for e in els:
        if e[0]!='p':continue
        m=re.match(r'\s*<b>([^<:]+):\s*</b>\s*(.*)$',e[1],re.S)
        if m and m[1].strip() in FIELDS:x[FIELDS[m[1].strip()]]=re.sub(r'\s*\(see [^)]*\)','',strip(m[2])).strip()
    x['d']=''.join(f'<p><b>{l}:</b> {H.escape(x.get(k,""))}</p>' for l,k in FIELDS.items() if x.get(k))
    tf.append(x)
out['trasfondos']=tf
# ---------- species ----------
i=find('h',3,'Species Descriptions');j=find('h',1,'Feats',i)
esp=[]
for n,pg,els in entries(i,j,4):
    x={'n':n,'pg':pg};rest=[]
    for e in els:
        if e[0]=='p':
            m=re.match(r'\s*<b>(Creature Type|Size|Speed):\s*</b>\s*(.*)$',e[1],re.S)
            if m:
                v=strip(m[2]);k={'Creature Type':'tipo','Size':'tam','Speed':'vel'}[m[1]]
                mm=re.match(r'(.*?)\s+(As an? .*)$',v)
                if mm:v=mm[1];rest.append(('p',mm[2],e[2]))
                x[k]=v.strip();continue
        rest.append(e)
    x['d']=to_html(rest);esp.append(x)
out['especies']=esp
# ---------- classes ----------
i=find('h',1,'Classes');j=find('h',1,lambda t:t.startswith('Character Origins'),i)
cls=[]
for n,pg,els in entries(i,j,2):
    info={};k=0
    while k<len(els):
        if els[k][0]=='h' and re.match(r'Core .* Traits$',els[k][2]) and k+1<len(els) and els[k+1][0]=='table':
            for r in els[k+1][1]['rows']:
                if len(r)>=2:info[r[0]]=r[1]
            del els[k:k+2];break
        k+=1
    subs=[e[2].split(':',1)[1].strip() for e in els if e[0]=='h' and e[1]==3 and re.match(r'.* Subclass:',e[2])]
    cls.append({'n':n,'pg':pg,'info':info,'sub':subs,'d':to_html(els,base=3)})
out['clases']=cls
# ---------- rules ----------
i=find('h',2,'Rules Definitions');j=find('h',1,'Gameplay Toolbox',i)
reg=[]
for n,pg,els in entries(i,j,4):
    m=re.match(r'(.*?)\s*\[(.*?)\]$',n)
    reg.append({'n':m[1] if m else n,'tag':(m[2] if m else '').lower(),'d':to_html(els),'pg':pg})
have={x['n'].lower() for x in reg}
cj=find('h',1,'Playing the Game');cje=find('h',1,'Character Creation',cj)
for name,lv in (('Travel Pace',4),('Creature Size',4),('Light',4),('Obscured Areas',4),('Special Senses',4),('Your Turn',4),
                ('Moving around Other Creatures',4),('Dropping Prone',4),('Ranged Attacks in Close Combat',4),('Mounted Combat',3),
                ('Underwater Combat',3),('Instant Death',4),('Falling Unconscious',4),('Stabilizing a Character',4),('Damage against Multiple Targets',4),
                ('Resistance and Vulnerability',3),('Interacting with Objects',3),('Breaking Up Your Move',4)):
    if name.lower() in have:continue
    a=find('h',lv,name,cj)
    if a>=cje:raise SystemExit(f'{name} outside Playing the Game')
    b=until(a,lambda e:e[0]=='h' and e[1]<=lv)
    reg.append({'n':name,'tag':'playing the game','d':to_html(S[a+1:b],base=lv),'pg':S[a][3]})
RCAT={'Turno y reacciones':'Action|Bonus Action|Reaction|Your Turn|Opportunity Attacks|Breaking Up Your Move|Initiative|Surprise',
  'Combate':'Attack Roll|Weapon Attack|Spell Attack|Unarmed Strike|Grappling|Knocking Out a Creature|Critical Hit|Cover|Improvised Weapons|Weapon|Ranged Attacks in Close Combat|Mounted Combat|Underwater Combat|Reach|Armor Class|Target|Enemy|Ally|Encounter',
  'Daño y curación':'Damage|Damage Types|Damage Roll|Resistance|Vulnerability|Immunity|Resistance and Vulnerability|Damage against Multiple Targets|Hit Points|Temporary Hit Points|Healing|Hit Point Dice|Instant Death|Falling Unconscious|Death Saving Throw|Stabilizing a Character|Stable|Dead|Bloodied|Damage Threshold',
  'Movimiento':'Speed|Burrow Speed|Swim Speed|Climb Speed|Fly Speed|Jumping|High Jump|Long Jump|Climbing|Swimming|Flying|Crawling|Hover|Difficult Terrain|Moving around Other Creatures|Dropping Prone|Teleportation|Creature Size|Size|Occupied Space|Unoccupied Space',
  'Visión y luz':'Light|Obscured Areas|Special Senses|Bright Light|Dim Light|Darkness|Lightly Obscured|Heavily Obscured|Blindsight|Darkvision|Truesight|Tremorsense|Telepathy',
  'Exploración':'Travel Pace|Interacting with Objects|Breaking Objects|Carrying Capacity|Short Rest|Long Rest|Object|Adventure|Campaign',
  'Pruebas y tiradas':'D20 Test|Ability Check|Saving Throw|Save|Advantage|Disadvantage|Difficulty Class|Proficiency|Expertise|Skill|Passive Perception|Heroic Inspiration|Round Down|Simultaneous Effects|Ability Score and Modifier|Armor Training',
  'Magia':'Spell|Cantrip|Ritual|Concentration|Spellcasting Focus|Magical Effect|Illusions|Attunement|Shape-Shifting|Possession|Curses',
  'Interacción social':'Attitude'}
RC={n:c for c,ns in RCAT.items() for n in ns.split('|')}
TAGC={'action':'Acciones','condition':'Estados','area of effect':'Áreas de efecto','hazard':'Peligros','attitude':'Interacción social'}
for x in reg:x['cat']=TAGC.get(x['tag'])or RC.get(x['n'])or'General'
out['reglas']=reg

json.dump(out,open(sys.argv[2],'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
for k,v in out.items():print(k,len(v))
