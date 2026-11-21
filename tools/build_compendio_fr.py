# Versión francesa de build_compendio.py: mismas utilidades, con los nombres de secciones y campos del SRD 5.2.1 en francés.
# Las categorías (k de objetos, cat de dotes y de reglas) se guardan con las mismas claves que en español para que
# la página las traduzca al mostrarlas.  Uso: python -I build_compendio_fr.py srd_fr.json datos/fr/compendio.json
import os,sys
_src=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'build_compendio.py'),encoding='utf-8').read()
exec(_src[:_src.index('\nout={}')])

out={}
# ---------- objets magiques ----------
i=find('h',2,'Objets magiques de A à Z');j=find('h',1,'Monstres',i)
objs=[]
for n,pg,els in entries(i,j,4):
    head,rest=first_italic(els)
    dep=0;cut=-1
    for ci,ch in enumerate(head):
        dep+=(ch=='(')-(ch==')')
        if ch==',' and dep==0:cut=ci;break
    tipo,rr=(head[:cut].strip(),head[cut+1:].strip()) if cut>=0 else (head,'')
    sint=''
    ms=re.search(r'\((harmonisation requise[^)]*)\)',rr,re.I)
    if ms:sint=ms[1];rr=rr.replace(ms[0],'').strip()
    objs.append({'n':n,'t':tipo,'r':rr.strip(' ,'),'s':sint,'d':to_html(rest),'pg':pg,'k':'magico'})
# ---------- équipement ----------
eq=find('h',1,'Équipement');eqend=find('h',1,'Sorts',eq)
for e in S[eq:eqend]:
    if e[0]!='table' or not e[1]['head']:continue
    hd=e[1]['head']
    if hd[:2]==['Nom','Dégâts']:kind='Arme'
    elif hd[:1]==['Armures']:kind='Armure'
    else:continue
    sec=''
    for r in e[1]['rows']:
        if len(r)==1:sec=r[0];continue
        if not r[0]:continue
        r=[re.sub(r'(portée \d+(?:,\d+)?/\d+(?:,\d+)?)(?![\d,]|\s*m\b)',r'\1 m',c,flags=re.I) for c in r]   # la portée vient sans unité : ce sont des mètres
        d=''.join(f'<p><b>{H.escape(h)} :</b> {H.escape(v)}</p>' for h,v in zip(hd[1:],r[1:]) if v)
        objs.append({'n':r[0],'t':(sec[:1].upper()+sec[1:].split(' (')[0]) if sec else kind,'r':'','s':'','d':d,'pg':e[2],'k':'arma' if kind=='Arme' else 'armadura','precio':r[-1]})
for sect,kind in (('Outils','herramienta'),('Matériel d’aventurier','equipo')):
    a=find('h',2,sect,eq);b=until(a,lambda e:e[0]=='h' and e[1]<=2)
    for n,pg,els in entries(a,b,4):
        m=re.match(r'(.*?)\s*\(([^)]*\d[^)]*)\)\s*$',n)
        name,price=(m[1],m[2]) if m else (n,'')
        objs.append({'n':name,'t':'Outil' if kind=='herramienta' else 'Matériel d’aventurier','r':'','s':'','d':to_html(els),'pg':pg,'k':kind,'precio':price})
out['objetos']=objs
# ---------- dons ----------
i=find('h',1,'Dons');j=find('h',1,'Équipement',i)
CAT={'d’origines':'Origen','d’origine':'Origen','général':'General','de style de combat':'Estilo de combate','de faveur épique':'Don épico'}
dotes=[]
for n,pg,els in entries(i,j,4):
    head,rest=first_italic(els)
    m=re.match(r'Don (d’origines?|général|de Style de combat|de faveur épique)\s*(?:\((?:prérequis\s*:\s*)?(.*)\))?',head,re.I)
    dotes.append({'n':n,'cat':CAT.get(m[1].lower(),'') if m else '','req':re.sub(r'\s+',' ',m[2]).strip() if m and m[2] else '','d':to_html(rest),'pg':pg})
out['dotes']=dotes
# ---------- historiques ----------
i=find('h',3,'Description des historiques');j=find('h',2,'Espèces des personnages',i)
FIELDS={'Valeurs de caractéristique':'car','Don':'dote','Maîtrises de compétence':'hab','Maîtrise d’outils':'herr','Équipement':'equipo'}
tf=[]
for n,pg,els in entries(i,j,4):
    x={'n':n,'pg':pg}
    for e in els:
        if e[0]!='p':continue
        m=re.match(r'\s*<b>([^<:]+?)\s*:\s*</b>\s*(.*)$',e[1],re.S)
        if m and m[1].strip() in FIELDS:x[FIELDS[m[1].strip()]]=re.sub(r'\s*\(cf\. [^)]*\)','',strip(m[2])).strip()
    x['d']=''.join(f'<p><b>{l} :</b> {H.escape(x.get(k,""))}</p>' for l,k in FIELDS.items() if x.get(k))
    tf.append(x)
out['trasfondos']=tf
# ---------- espèces ----------
i=find('h',3,'Description des espèces');j=find('h',1,'Dons',i)
esp=[]
for n,pg,els in entries(i,j,4):
    x={'n':n,'pg':pg};rest=[]
    for e in els:
        if e[0]=='p':
            m=re.match(r'\s*<b>(Type de créature|Catégorie de taille|Vitesse)\s*:\s*</b>\s*(.*)$',e[1],re.S)
            if m:
                v=strip(m[2]);k={'Type de créature':'tipo','Catégorie de taille':'tam','Vitesse':'vel'}[m[1]]
                mm=re.match(r'(.*?)\s+(En tant qu.*)$',v)
                if mm:v=mm[1];rest.append(('p',mm[2],e[2]))
                x[k]=v.strip();continue
        rest.append(e)
    x['d']=to_html(rest);esp.append(x)
out['especies']=esp
# ---------- classes ----------
i=find('h',1,'Classes');j=find('h',1,lambda t:t.startswith('Origines'),i)
cls=[]
for n,pg,els in entries(i,j,2):
    info={};k=0
    while k<len(els):
        if els[k][0]=='h' and els[k][2].startswith('Traits de base') and k+1<len(els) and els[k+1][0]=='table':
            rows=[]
            for r in els[k+1][1]['rows']:
                if len(r)<2:continue
                if rows and r[0][:1].islower():rows[-1]=[rows[-1][0]+' '+r[0],(rows[-1][1]+' '+r[1]).strip()]   # libellé coupé en deux lignes
                else:rows.append(list(r[:2]))
            info={a:b for a,b in rows}
            del els[k:k+2];break
        k+=1
    subs=[e[2].split(':',1)[1].strip() for e in els if e[0]=='h' and e[1]==3 and e[2].startswith('Sous-classe')]
    cls.append({'n':n,'pg':pg,'info':info,'sub':subs,'d':to_html(els,base=3)})
out['clases']=cls
# ---------- règles ----------
i=find('h',2,'Définitions des règles');j=find('h',1,'Boîte à outils ludique',i)
reg=[]
for n,pg,els in entries(i,j,4):
    m=re.match(r'(.*?)\s*\[(.*?)\]$',n)
    reg.append({'n':m[1] if m else n,'tag':(m[2] if m else '').lower(),'d':to_html(els),'pg':pg})
have={x['n'].lower() for x in reg}
cj=find('h',1,'Comment jouer');cje=find('h',1,'Création de personnage',cj)
for name,lv in (('Allure de voyage',4),('Cat. de taille de la créature',4),('Éclairage',4),('Visibilité',4),('Sens spéciaux',4),('Votre tour',4),
                ('Se déplacer au milieu d’autres créatures',4),('Plonger à terre',4),('Attaques à distance en combat rapproché',4),('Combat monté',3),
                ('Combat subaquatique',3),('Mort sur le coup',4),('Perte de connaissance',4),('Stabiliser un personnage',4),('Dégâts contre plusieurs cibles',4),
                ('Résistances et Vulnérabilités',3),('Interagir avec des objets',3),('Scinder son déplacement',4)):
    if name.lower() in have:continue
    a=find('h',lv,name,cj)
    if a>=cje:raise SystemExit(f'{name} hors de «Comment jouer»')
    b=until(a,lambda e:e[0]=='h' and e[1]<=lv)
    reg.append({'n':name,'tag':'comment jouer','d':to_html(S[a+1:b],base=lv),'pg':S[a][3]})
RCAT={'Turno y reacciones':'Action|Action Bonus|Réaction|Votre tour|Attaques d’Opportunité|Scinder son déplacement|Initiative|Surprise',
  'Combate':'Jet d’attaque|Attaque d’arme|Attaque de sort|Attaque à mains nues|Lutte|Assommer une créature|Coup critique|Abris|Armes improvisées|Arme|Attaques à distance en combat rapproché|Combat monté|Combat subaquatique|Allonge|Classe d’armure|Cible|Ennemi|Allié|Rencontre',
  'Daño y curación':'Dégâts|Types de dégâts|Jet de dégâts|Résistance|Vulnérabilité|Immunité|Résistances et Vulnérabilités|Dégâts contre plusieurs cibles|Points de vie|Points de vie temporaires|Soins|Dés de vie|Mort sur le coup|Perte de connaissance|Jet de sauvegarde contre la mort|Stabiliser un personnage|Stabilisé|Mort|En péril|Seuil de dégâts',
  'Movimiento':'Vitesse|Vitesse de fouissement|Vitesse de nage|Vitesse d’escalade|Vitesse de vol|Saut|Saut en hauteur|Saut en longueur|Escalade|Nage|Vol|Reptation|Vol stationnaire|Terrain difficile|Se déplacer au milieu d’autres créatures|Plonger à terre|Téléportation|Cat. de taille de la créature|Cat. de taille|Espace occupé|Espace inoccupé',
  'Visión y luz':'Éclairage|Visibilité|Sens spéciaux|Lumière vive|Lumière faible|Ténèbres|Visibilité réduite|Visibilité nulle|Vision aveugle|Vision dans le noir|Vision lucide|Perception des vibrations|Télépathie',
  'Exploración':'Allure de voyage|Interagir avec des objets|Bris des objets|Capacité de charge|Repos court|Repos long|Objet|Aventure|Campagne',
  'Pruebas y tiradas':'Test d20|Test de caractéristique|Jet de sauvegarde|JS|Avantage|Désavantage|Degré de difficulté|Maîtrise|Expertise|Compétence|Perception passive|Inspiration héroïque|Arrondis à l’inférieur|Effets simultanés|Valeur et modificateur de caractéristique|Formation aux armures',
  'Magia':'Sort|Sort mineur|Rituel|Concentration|Focaliseur d’incantation|Effet magique|Illusions|Harmonisation|Métamorphes|Possession|Malédictions',
  'Interacción social':'Attitude'}
RC={n:c for c,ns in RCAT.items() for n in ns.split('|')}
TAGC={'action':'Acciones','état':'Estados','zone d’effet':'Áreas de efecto','danger':'Peligros','attitude':'Interacción social'}
for x in reg:x['cat']=TAGC.get(x['tag'])or RC.get(x['n'])or'General'
out['reglas']=reg

json.dump(out,open(sys.argv[2],'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
for k,v in out.items():print(k,len(v))
