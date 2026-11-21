import re,json,sys,collections
L=open('es/r.txt',encoding='utf-8').read().replace('\f','\n').split('\n')
EN=json.load(open('datos/en/bestiario.json',encoding='utf-8'))
TY='Aberración|Bestia|Celestial|Constructo|Dragón|Elemental|Feérico|Infernal|Gigante|Humanoide|Monstruosidad|Cieno|Planta|Muerto viviente|Enjambre'
SZ='Diminut|Pequeñ|Median|Grande|Enorme|Gargant'
start=next(i for i,l in enumerate(L) if l.strip()=='Aboleth' and i>18000)
heads=[]
SZR=re.compile(r'\b('+SZ+r')\w*\b.*,')
for i in range(start,len(L)):
    if re.match(r'^CA: \d',L[i]):
        for t in range(i-1,max(start-3,i-6),-1):
            if SZR.search(L[t]) and len(L[t])<90:
                if L[t-1].strip() and len(L[t-1].split())<=7: heads.append((t-1,t))
                break
heads=sorted(set(heads))
# dedupe: name line may be repeated
blocks=[]
for k,(j,i) in enumerate(heads):
    end=heads[k+1][0] if k+1<len(heads) else len(L)
    name=L[j].strip()
    # skip repeated name line
    e=end
    if k+1<len(heads) and L[heads[k+1][0]-1].strip()==L[heads[k+1][0]].strip(): e-=1
    blocks.append((name,L[i].strip(),L[i+1:e]))
print('blocks',len(blocks),file=sys.stderr)
NOISE=re.compile(r'^\d+ Documento de referencia del sistema|^Documento de referencia del sistema|^\d+$|^MOD\. SALV\.$')
SECH={'Atributos':'t','Rasgos':'t','Acciones':'a','Acciones adicionales':'b','Reacciones':'r','Acciones legendarias':'l'}
def num(s):return int(s.replace('−','-').replace('+',''))
out={}
def parse(name,tyline,lines):
    lines=[l.strip() for l in lines if l.strip() and not NOISE.match(l.strip())]
    # split head vs sections
    idx=[n for n,l in enumerate(lines) if l in SECH]
    head=' '.join(lines[:idx[0]] if idx else lines)
    secs={}
    for a,b in zip(idx,idx[1:]+[len(lines)]):
        secs.setdefault(SECH[lines[a]],[]).extend(lines[a+1:b])
    g=lambda pat:(re.search(pat,head) or [None,None])[1]
    d={'n':name,'tyl':tyline}
    d['ab']=tuple(int(x) if x else None for x in [g(r'\b%s (\d+)'%a) for a in ['Fue','Des','Con','Int','Sab','Car']])
    d['ac']=g(r'CA: (\d+)'); d['hp']=g(r'PG: (\d+)'); d['cr']=g(r'VD: ([\d/]+)')
    LAB=['Velocidad','Habilidades','Vulnerabilidades','Resistencias','Inmunidades','Equipo','Sentidos','Idiomas','VD','Iniciativa','CA','PG','Fue','Des','Con','Int','Sab','Car','MOD']
    pat=r'(%s)[: ]'%'|'.join(LAB)
    for lab,key in [('Velocidad','sp'),('Habilidades','sk'),('Vulnerabilidades','vu'),('Resistencias','re'),('Inmunidades','im'),('Sentidos','se'),('Idiomas','la'),('Equipo','eq')]:
        m=re.search(lab+r': (.*?)(?= (?:Velocidad|Habilidades|Vulnerabilidades|Resistencias|Inmunidades|Equipo|Sentidos|Idiomas|VD|Iniciativa|Fue|Des|Con|Int|Sab|Car|MOD\.|PG|CA)\b[: ]|$)',head)
        if m:d[key]=m.group(1).strip().rstrip(';,')
    if 'se' in d:
        m=re.search(r';? ?Percepción pasiva (\d+)',d['se']); 
        if m:d['se']=d['se'][:m.start()].strip().rstrip(';,')
    for k,ls in secs.items():
        ents=[];prev_end=True
        for l in ls:
            if k=='l' and l.startswith('Usos de acciones legendarias'):
                mm=re.search(r'(\d+)',l); d['lu']=int(mm.group(1)) if mm else 3; prev_end=True; continue
            m=re.match(r'^([A-ZÁÉÍÓÚÑ¿][^.:]{0,70}?(?: \([^)]*\))?)\. (.+)$',l)
            if m and prev_end and len(m.group(1).split())<=8:
                ents.append([m.group(1),m.group(2)])
            elif ents:
                ents[-1][1]+=('' if ents[-1][1].endswith('-') else ' ')+l
            else: ents.append(['',l])
            prev_end=bool(re.search(r'[.:)]$',l))
        if k=='l':
            lu=[e for e in ents if e[0].startswith('Usos de acciones legendarias')]
            if lu:
                mm=re.match(r':?\s*(\d+)',lu[0][1]) or re.search(r'(\d+)',lu[0][0]+lu[0][1]); d['lu']=int(mm.group(1)) if mm else 3
            ents=[e for e in ents if not e[0].startswith('Usos de acciones legendarias')]
        d[k]=ents
    return d
ES=[parse(*b) for b in blocks]
def sig(ac,hp,cr):return (str(ac),str(hp))
idx=collections.defaultdict(list)
for e in ES: idx[sig(e['ac'],e['hp'],e['cr'])].append(e)
merged=[];stats=collections.Counter();un=[]
used=set()
for m in EN:
    cands=[e for e in idx[sig(m['ac'],m['hp'],m['cr'])] if id(e) not in used and sum(a==b for a,b in zip(e['ab'],m['ab']))>=4]
    o=dict(m);o['en']=m['n']
    if not cands: stats['nomatch']+=1;un.append(m['n']);merged.append(o);continue
    e=cands[0]
    if len(cands)>1:
        # prefer same entry counts
        def score(e):return (sum(a==b for a,b in zip(e['ab'],m['ab'])), str(e['cr'])==str(m['cr']), sum(len(e.get(k,[]))==len(m.get(k,[])) for k in 'tabrl'))
        e=max(cands,key=score)
    used.add(id(e))
    o['n']=e['n']
    tm=re.match(r'^(.*?) (Diminut\w*|Pequeñ\w*|Median\w*|Grande|Enorme|Gargantues\w*)(?: o (\w+))?(.*?), (.*)$',e['tyl'])
    if tm:o['tyl']=e['tyl']
    if e.get('lu'):o['lu']=e['lu']
    o['_abok']=sum(a==b for a,b in zip(e['ab'],m['ab']))
    for k in ['sp','sk','vu','re','im','se','la','eq']:
        if e.get(k):o[k]=e[k]
    for k in 'tabrl':
        ek=e.get(k,[]);mk=m.get(k,[])
        if ek and ek[0][0]=='' and len(ek)>1: ek[1][1]=ek[0][1]+' '+ek[1][1] if False else ek[1][1]; ek=[x for x in ek if x[0]] if ek and ek[0][0]=='' and len(ek)>1 else ek
        if ek and all(x[0] for x in ek) and abs(len(ek)-len(mk))<=2:
            new=[]
            for x in ek:
                nm=x[0];tag=''
                t=re.search(r'\s*\(((?:recarga|Recarga)[^)]*|\d+/día[^)]*)\)\s*$',nm)
                if t and k!='t':tag=t.group(1)[0].upper()+t.group(1)[1:];nm=nm[:t.start()]
                new.append([nm,x[1]]+([tag] if tag else []))
            o[k]=new;stats['sec_ok']+=1
        elif mk: stats['sec_fallback']+=1; o.setdefault('fb',[]).append(k)
    stats['match']+=1
    merged.append(o)
print(stats,file=sys.stderr)
print('dupES',[e['n'] for e in ES if id(e) not in used],file=sys.stderr);print('unmatched',un,file=sys.stderr)
for o in merged:
    o.pop('_abok',None);o.pop('fb',None)
    if o['en']=='Giant Fly':o['n']='Mosca gigante'
    if o.get('eq'):pass
json.dump(merged,open('datos/es/bestiario.json','w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
