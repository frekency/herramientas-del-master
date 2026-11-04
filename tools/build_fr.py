# Criaturas del SRD 5.2.1 en francés (texto de pdftotext -enc UTF-8) fusionadas sobre srd2024.json por CA, PG y características.
# Uso: python -I build_fr.py r.txt srd2024.json srd2024_fr.json
import re,json,sys,collections
L=open(sys.argv[1],encoding='utf-8').read().replace('\f','\n').split('\n')
EN=json.load(open(sys.argv[2],encoding='utf-8'))
start=next(i for i,l in enumerate(L) if l.strip()=='Monstres de A à Z' and i>1000)
heads=[]
TYR=re.compile(r'\bde taille (TP|P|M|G|TG|Gig)\b.*,|^Nuée de créatures')
for i in range(start,len(L)):
    if re.match(r'^CA \d',L[i]):
        for t in range(i-1,max(start-3,i-6),-1):
            if TYR.search(L[t]) and len(L[t])<110:
                if L[t-1].strip() and len(L[t-1].split())<=8: heads.append((t-1,t))
                break
heads=sorted(set(heads))
blocks=[]
for k,(j,i) in enumerate(heads):
    end=heads[k+1][0] if k+1<len(heads) else len(L)
    e=end
    if k+1<len(heads) and L[heads[k+1][0]-1].strip()==L[heads[k+1][0]].strip(): e-=1
    blocks.append((L[j].strip(),L[i].strip(),L[i+1:e]))
print('blocks',len(blocks),file=sys.stderr)
NOISE=re.compile(r'^\d+ Document de Référence du Système|^Document de Référence du Système|^\d+$|^MOD JS$|^Animaux$')
SECH={'Traits':'t','Actions':'a','Actions Bonus':'b','Actions bonus':'b','Réactions':'r','Actions Légendaires':'l','Actions légendaires':'l'}
LABS='Vitesse|Compétences|Vulnérabilités|Résistances|Immunités|Équipement|Sens|Langues|FP|Initiative|For|Dex|Con|Int|Sag|Cha|MOD JS|Pv|CA'
SUB={'Défense d’entrer','Eau vive','Pieu dans le cœur','Lumière du soleil'}
def parse(name,tyline,lines):
    lines=[l.strip() for l in lines if l.strip() and not NOISE.match(l.strip())]
    idx=[n for n,l in enumerate(lines) if l in SECH]
    head=' '.join(lines[:idx[0]] if idx else lines)
    secs={}
    for a,b in zip(idx,idx[1:]+[len(lines)]):
        secs.setdefault(SECH[lines[a]],[]).extend(lines[a+1:b])
    g=lambda pat:(re.search(pat,head) or [None,None])[1]
    d={'n':name,'tyl':tyline}
    d['ab']=tuple(int(x) if x else None for x in [g(r'\b%s (\d+)'%a) for a in ['For','Dex','Con','Int','Sag','Cha']])
    d['ac']=g(r'CA (\d+)'); d['hp']=g(r'Pv (\d+)'); d['cr']=g(r'FP ([\d/]+)')
    for lab,key in [('Vitesse','sp'),('Compétences','sk'),('Vulnérabilités','vu'),('Résistances','re'),('Immunités','im'),('Sens','se'),('Langues','la'),('Équipement','eq')]:
        m=re.search(r'\b'+lab+r' (.*?)(?= (?:'+LABS+r')\b |$)',head)
        if m:d[key]=m.group(1).strip().rstrip(';,')
    if 'se' in d:
        m=re.search(r';? ?Perception passive (\d+)',d['se'])
        if m:d['se']=d['se'][:m.start()].strip().rstrip(';,')
    for k,ls in secs.items():
        ents=[];prev_end=True
        for l in ls:
            if k=='l' and l.startswith('Utilisations d’action'):
                mm=re.search(r'(\d+)',l); d['lu']=int(mm.group(1)) if mm else 3; prev_end=True; continue
            m=re.match(r'^([A-ZÀÂÉÈÊÎÔÛÇŒ«][^.:]{0,80}?(?: \([^)]*\))?)\. (.+)$',l)
            if m and prev_end and len(m.group(1).split())<=9 and ents and (ents[-1][1].endswith(':') or m.group(1) in SUB):
                ents[-1][1]+=' '+l
            elif m and prev_end and len(m.group(1).split())<=9:
                ents.append([m.group(1),m.group(2)])
            elif ents:
                ents[-1][1]+=('' if ents[-1][1].endswith('-') else ' ')+l
            else: ents.append(['',l])
            prev_end=bool(re.search(r'[.:)»]$',l))
        d[k]=ents
    return d
FR=[parse(*b) for b in blocks]
idx=collections.defaultdict(list)
for e in FR: idx[(str(e['ac']),str(e['hp']))].append(e)
merged=[];stats=collections.Counter();un=[];used=set()
for m in EN:
    cands=[e for e in idx[(str(m['ac']),str(m['hp']))] if id(e) not in used and sum(a==b for a,b in zip(e['ab'],m['ab']))>=4]
    o=dict(m);o['en']=m['n']
    if not cands: stats['nomatch']+=1;un.append(m['n']);merged.append(o);continue
    def score(e):return (sum(a==b for a,b in zip(e['ab'],m['ab'])), str(e['cr'])==str(m['cr']), sum(len(e.get(k,[]))==len(m.get(k,[])) for k in 'tabrl'))
    e=max(cands,key=score);used.add(id(e))
    o['n']=e['n'];o['tyl']=e['tyl']
    if e.get('lu'):o['lu']=e['lu']
    for k in ['sp','sk','vu','re','im','se','la','eq']:
        if e.get(k):o[k]=e[k]
    for k in 'tabrl':
        ek=e.get(k,[]);mk=m.get(k,[])
        if ek and all(x[0] for x in ek) and abs(len(ek)-len(mk))<=2:
            new=[]
            for x in ek:
                nm=x[0];tag=''
                t=re.search(r'\s*\(((?:Recharge|recharge)[^)]*|\d+/jour[^)]*)\)\s*$',nm)
                if t and k!='t':tag=t.group(1)[0].upper()+t.group(1)[1:];nm=nm[:t.start()]
                new.append([nm,x[1]]+([tag] if tag else []))
            o[k]=new;stats['sec_ok']+=1
        elif mk: stats['sec_fallback']+=1;stats['fb_'+k]+=1;print('fb',m['n'],k,len(ek),len(mk),file=sys.stderr)
    stats['match']+=1
    merged.append(o)
print(stats,file=sys.stderr)
print('sinusar',[e['n'] for e in FR if id(e) not in used],file=sys.stderr);print('sinpareja',un,file=sys.stderr)
for o in merged:
    if o['en']=='Giant Fly':o['n']='Mouche géante'
json.dump(merged,open(sys.argv[3],'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
