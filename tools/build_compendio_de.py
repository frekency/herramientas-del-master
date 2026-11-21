# Versión alemana de build_compendio.py: mismas utilidades, con los nombres de secciones y campos del SRD 5.2.1 en alemán.
# Las categorías (k de objetos, cat de dotes y de reglas) se guardan con las mismas claves que en español para que
# la página las traduzca al mostrarlas.  Uso: python -I build_compendio_de.py srd_de.json datos/de/compendio.json
import os,sys
_src=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'build_compendio.py'),encoding='utf-8').read()
exec(_src[:_src.index('\nout={}')])

out={}
# ---------- magische Gegenstände ----------
i=find('h',2,'Magische Gegenstände A–Z');j=find('h',1,'Monster',i)
objs=[]
for n,pg,els in entries(i,j,4):
    head,rest=first_italic(els)
    dep=0;cut=-1
    for ci,ch in enumerate(head):
        dep+=(ch=='(')-(ch==')')
        if ch==',' and dep==0:cut=ci;break
    tipo,rr=(head[:cut].strip(),head[cut+1:].strip()) if cut>=0 else (head,'')
    sint=''
    ms=re.search(r'\((erfordert Einstimmung[^)]*)\)',rr,re.I)
    if ms:sint=ms[1];rr=rr.replace(ms[0],'').strip()
    objs.append({'n':n,'t':tipo,'r':rr.strip(' ,'),'s':sint,'d':to_html(rest),'pg':pg,'k':'magico'})
# ---------- Ausrüstung ----------
eq=find('h',1,'Ausrüstung');eqend=find('h',1,'Zauber',eq)
for e in S[eq:eqend]:
    if e[0]!='table' or not e[1]['head']:continue
    hd=e[1]['head']
    if hd[:2]==['Name','Schaden']:kind='Waffe'
    elif hd[:1]==['Rüstung']:kind='Rüstung'
    else:continue
    sec=''
    for r in e[1]['rows']:
        if len(r)==1:sec=r[0];continue
        if not r[0]:continue
        r=[re.sub(r'(Reichweite \d+(?:,\d+)?/\d+(?:,\d+)?)(?![\d,]|\s*m\b)',r'\1 m',c) for c in r]   # die Reichweite steht ohne Einheit: Meter
        d=''.join(f'<p><b>{H.escape(h)}:</b> {H.escape(v)}</p>' for h,v in zip(hd[1:],r[1:]) if v)
        objs.append({'n':r[0],'t':(sec[:1].upper()+sec[1:].split(' (')[0]) if sec else kind,'r':'','s':'','d':d,'pg':e[2],'k':'arma' if kind=='Waffe' else 'armadura','precio':r[-1]})
for sect,kind in (('Werkzeug','herramienta'),('Abenteurerausrüstung','equipo')):
    a=find('h',2,sect,eq);b=until(a,lambda e:e[0]=='h' and e[1]<=2)
    for n,pg,els in entries(a,b,4):
        m=re.match(r'(.*?)\s*\(([^)]*\d[^)]*)\)\s*$',n)
        name,price=(m[1],m[2]) if m else (n,'')
        objs.append({'n':name,'t':'Werkzeug' if kind=='herramienta' else 'Abenteurerausrüstung','r':'','s':'','d':to_html(els),'pg':pg,'k':kind,'precio':price})
out['objetos']=objs
# ---------- Talente ----------
i=find('h',1,'Talente');j=find('h',1,'Ausrüstung',i)
CAT={'herkunftstalent':'Origen','allgemeines talent':'General','kampfstil-talent':'Estilo de combate','epische-gabe-talent':'Don épico'}
dotes=[]
for n,pg,els in entries(i,j,4):
    head,rest=first_italic(els)
    m=re.match(r'(Herkunftstalent|Allgemeines Talent|Kampfstil-Talent|Epische-Gabe-Talent)\s*(?:\((?:Voraussetzungen?:\s*)?(.*)\))?',head.strip(),re.I)
    dotes.append({'n':n,'cat':CAT.get(m[1].lower(),'') if m else '','req':re.sub(r'\s+',' ',m[2]).strip() if m and m[2] else '','d':to_html(rest),'pg':pg})
out['dotes']=dotes
# ---------- Hintergründe ----------
i=find('h',3,'Beschreibungen der Hintergründe');j=find('h',2,'Charakterspezies',i)
FIELDS={'Attributswerte':'car','Talent':'dote','Fertigkeiten, in denen du geübt bist':'hab','Übung im Umgang mit Werkzeug':'herr','Ausrüstung':'equipo'}
tf=[]
for n,pg,els in entries(i,j,4):
    x={'n':n,'pg':pg}
    for e in els:
        if e[0]!='p':continue
        m=re.match(r'\s*<b>([^<:]+?)\s*:\s*</b>\s*(.*)$',e[1],re.S)
        if m and m[1].strip() in FIELDS:x[FIELDS[m[1].strip()]]=re.sub(r'\s*\(siehe [^)]*\)','',strip(m[2])).strip()
    x['d']=''.join(f'<p><b>{l}:</b> {H.escape(x.get(k,""))}</p>' for l,k in FIELDS.items() if x.get(k))
    tf.append(x)
out['trasfondos']=tf
# ---------- Spezies ----------
i=find('h',3,'Beschreibungen der Spezies');j=find('h',1,'Talente',i)
esp=[]
for n,pg,els in entries(i,j,4):
    x={'n':n,'pg':pg};rest=[]
    for e in els:
        if e[0]=='p':
            m=re.match(r'\s*<b>(Kreaturentyp|Größe|Bewegungsrate)\s*:\s*</b>\s*(.*)$',e[1],re.S)
            if m:
                v=strip(m[2]);k={'Kreaturentyp':'tipo','Größe':'tam','Bewegungsrate':'vel'}[m[1]]
                mm=re.match(r'(.*?)\s+(Als .*)$',v)
                if mm:v=mm[1];rest.append(('p',mm[2],e[2]))
                x[k]=v.strip();continue
        rest.append(e)
    x['d']=to_html(rest);esp.append(x)
out['especies']=esp
# ---------- Klassen ----------
LABELS=['Hauptattribut','Trefferpunktewürfel','Rettungswürfe, in denen du geübt bist','Fertigkeiten, in denen du geübt bist',
        'Übung im Umgang mit Waffen','Übung im Umgang mit Werkzeug','Rüstungsvertrautheit','Anfangsausrüstung']
i=find('h',1,'Klassen');j=find('h',1,lambda t:t.startswith('Charakterherkunft'),i)
cls=[]
for n,pg,els in entries(i,j,2):
    info={};k=0
    while k<len(els):
        if els[k][0]=='h' and els[k][2].startswith('Hauptmerkmale') and k+1<len(els) and els[k+1][0]=='table':
            rows=[]
            for r in els[k+1][1]['rows']:
                if len(r)<2:continue
                if rows and r[0][:1].islower():rows[-1]=[rows[-1][0]+' '+r[0],(rows[-1][1]+' '+r[1]).strip()]   # Beschriftung auf zwei Zeilen
                else:rows.append(list(r[:2]))
            for a,b in rows:
                two=[l for l in LABELS if l in a]
                sp=re.search(r'\b(?:Wähle|Drei|Zwei|Vier)\b',b)
                if len(two)==2 and sp:      # zwei Zeilen zusammengefallen: der zweite Wert beginnt mit «Wähle …» oder «Drei …»
                    two.sort(key=a.index);c=sp.start()
                    info[two[0]]=b[:c].strip();info[two[1]]=b[c:].strip()
                else:info[a]=b
            del els[k:k+2];break
        k+=1
    subs=[e[2].split(':',1)[1].strip() for e in els if e[0]=='h' and e[1]==3 and 'Unterklasse:' in e[2]]
    cls.append({'n':n,'pg':pg,'info':info,'sub':subs,'d':to_html(els,base=3)})
out['clases']=cls
# ---------- Regeln ----------
i=find('h',2,'Regeldefinitionen');j=find('h',1,'Werkzeugkasten fürs Spiel',i)
reg=[]
for n,pg,els in entries(i,j,4):
    m=re.match(r'(.*?)\s*\((Aktion|Zustand|Wirkungsbereich|Gefahr|Haltung)\)$',n)
    reg.append({'n':m[1] if m else n,'tag':(m[2] if m else '').lower(),'d':to_html(els),'pg':pg})
have={x['n'].lower() for x in reg}
cj=find('h',1,'Die Spielregeln');cje=find('h',1,lambda t:t.startswith('Charakterer'),cj)
for name,lv in (('Reisegeschwindigkeit',4),('Kreaturengröße',4),('Licht',4),('Verschleierte Bereiche',4),('Spezialsinne',4),('Dein Zug',4),
                ('Sich um andere Kreaturen herumbewegen',4),('Der Zustand Liegend',4),('Fernkampfangriffe im Nahkampf',4),('Berittener Kampf',3),
                ('Unterwasserkampf',3),('Sofortiger Tod',4),('Das Bewusstsein verlieren',4),('Einen Charakter stabilisieren',4),('Schaden bei mehreren Zielen',4),
                ('Resistenz und Anfälligkeit',3),('Mit Gegenständen interagieren',3),('Deine Bewegung aufteilen',4)):
    if name.lower() in have:continue
    a=find('h',lv,name,cj)
    if a>=cje:raise SystemExit(f'{name} außerhalb von «Die Spielregeln»')
    b=until(a,lambda e:e[0]=='h' and e[1]<=lv)
    reg.append({'n':name,'tag':'spielregeln','d':to_html(S[a+1:b],base=lv),'pg':S[a][3]})
RCAT={'Turno y reacciones':'Aktion|Bonusaktion|Reaktion|Dein Zug|Gelegenheitsangriffe|Deine Bewegung aufteilen|Initiative|Überraschung',
  'Combate':'Angriffswurf|Waffenangriff|Zauberangriff|Waffenloser Angriff|Gepackt halten|Kreaturen in den Zustand Bewusstlos versetzen|Kritischer Treffer|Deckung|Improvisierte Waffen|Waffe|Fernkampfangriffe im Nahkampf|Berittener Kampf|Unterwasserkampf|Nahkampfreichweite|Rüstungsklasse|Ziel|Gegner|Verbündeter|Begegnung',
  'Daño y curación':'Schaden|Schadensarten|Schadenswurf|Resistenz|Anfälligkeit|Immunität|Resistenz und Anfälligkeit|Schaden bei mehreren Zielen|Trefferpunkte|Temporäre Trefferpunkte|Heilung|Trefferpunktewürfel|Sofortiger Tod|Das Bewusstsein verlieren|Todesrettungswurf|Einen Charakter stabilisieren|Stabil|Tot|Blutig|Schadensschwellenwert',
  'Movimiento':'Bewegungsrate|Grabbewegungsrate|Schwimmbewegungsrate|Kletterbewegungsrate|Flugbewegungsrate|Springen|Hochsprung|Weitsprung|Klettern|Schwimmen|Fliegen|Kriechen|Schweben|Schwieriges Gelände|Sich um andere Kreaturen herumbewegen|Der Zustand Liegend|Teleportation|Kreaturengröße|Größe|Besetzter Bereich|Freier Bereich',
  'Visión y luz':'Licht|Verschleierte Bereiche|Spezialsinne|Helles Licht|Dämmriges Licht|Dunkelheit|Leicht verschleiert|Komplett verschleiert|Blindsicht|Dunkelsicht|Wahrer Blick|Erschütterungssinn|Telepathie',
  'Exploración':'Reisegeschwindigkeit|Mit Gegenständen interagieren|Gegenstände zerstören|Traglast|Kurze Rast|Lange Rast|Gegenstand|Abenteuer|Kampagne',
  'Pruebas y tiradas':'W20-Prüfung|Attributswurf|Rettungswurf|RW|Vorteil|Nachteil|Schwierigkeitsgrad|Übung|Expertise|Fertigkeit|Passive Wahrnehmung|Heldische Inspiration|Abrunden|Gleichzeitige Effekte|Attributswert und -modifikator|Rüstungsvertrautheit',
  'Magia':'Zauber|Zaubertrick|Ritual|Konzentration|Zauberfokus|Magischer Effekt|Illusionen|Einstimmung|Gestaltwandeln|Besessenheit|Flüche',
  'Interacción social':'Haltung'}
RC={n:c for c,ns in RCAT.items() for n in ns.split('|')}
TAGC={'aktion':'Acciones','zustand':'Estados','wirkungsbereich':'Áreas de efecto','gefahr':'Peligros','haltung':'Interacción social'}
for x in reg:x['cat']=TAGC.get(x['tag'])or RC.get(x['n'])or'General'
out['reglas']=reg

json.dump(out,open(sys.argv[2],'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
for k,v in out.items():print(k,len(v))
