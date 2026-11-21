# Criaturas del SRD 5.2.1 en italiano (texto de pdftotext -enc UTF-8) fusionadas sobre datos/en/bestiario.json por CA, PG y características.
# Se leen dos versiones del texto (la «raw», con el orden real de lectura, y la normal) y por criatura gana la que encaja mejor.
# Uso: python -I build_it.py r.txt datos/en/bestiario.json datos/it/bestiario.json   (espera también r_raw.txt junto a r.txt)
import re,json,sys,collections
EN=json.load(open(sys.argv[2],encoding='utf-8'))
SIZES=r'(?:Minuscol[aeoi]|Piccol[aeoi]|Medi[aeoi]|Grand[ei]|Enorm[ei]|Mastodontic[aoh]e?)'
TYR=re.compile(r'\b'+SIZES+r'\b.*,|^Sciame\b')
NOISE=re.compile(r'^\d+ System Reference Document|^System Reference Document|^\d+$|^MOD SALV$|^Animali$')
SECH={'Tratti':'t','Azioni':'a','Azioni bonus':'b','Reazioni':'r','Azioni leggendarie':'l'}
LABS='Velocità|Abilità|Vulnerabilità|Resistenze|Immunità|Equipaggiamento|Sensi|Lingue|GS|Iniziativa|For|Des|Cos|Int|Sag|Car|MOD SALV|PF|CA'
NOTENT=re.compile(r'^(?:Fallimento|Successo|Fallimento o successo|Colpito|Colpito o mancato|Mancato|Innesco|Risposta)$|^Tiro |^\d+/giorno|^A volontà')
SUB={'Luce del sole','Paletto nel cuore','Proibizione','Acqua corrente'}   # debolezze dei vampiri
def build(L):
    heads=[]
    for i in range(1000,len(L)):
        if re.match(r'^CA \d',L[i]):
            for t in range(i-1,max(0,i-6),-1):
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
    def parse(name,tyline,lines):
        lines=[l.strip() for l in lines if l.strip() and not NOISE.match(l.strip())]
        idx=[n for n,l in enumerate(lines) if l in SECH]
        head=' '.join(lines[:idx[0]] if idx else lines)
        secs={}
        for a,b in zip(idx,idx[1:]+[len(lines)]):
            secs.setdefault(SECH[lines[a]],[]).extend(lines[a+1:b])
        g=lambda pat:(re.search(pat,head) or [None,None])[1]
        d={'n':name,'tyl':tyline}
        d['ab']=tuple(int(x) if x else None for x in [g(r'\b%s (\d+)'%a) for a in ['For','Des','Cos','Int','Sag','Car']])
        d['ac']=g(r'\bCA (\d+)'); d['hp']=g(r'\bPF (\d+)'); d['cr']=g(r'\bGS ([\d/]+)')
        for lab,key in [('Velocità','sp'),('Abilità','sk'),('Vulnerabilità','vu'),('Resistenze','re'),('Immunità','im'),('Sensi','se'),('Lingue','la'),('Equipaggiamento','eq')]:
            m=re.search(r'\b'+lab+r' (.*?)(?= (?:'+LABS+r')\b |$)',head)
            if m:d[key]=m.group(1).strip().rstrip(';,')
        if 'se' in d:   # «Percezione passiva 20; scurovisione 36 m»: el valor pasivo va aparte
            d['se']=re.sub(r'(?:^|[;,] ?)Percezione passiva \d+[;,]? ?','',d['se']).strip().strip(';, ')
        for k,ls in secs.items():
            j=[]
            for l in ls:
                if j and j[-1].count('(')>j[-1].count(')'):j[-1]+=' '+l
                else:j.append(l)
            ls=j
            ents=[];prev_end=True;skip=False;last=None
            for l in ls:
                m=re.match(r"^([A-ZÀÈÉÌÒÙ][^.:]{0,80}?(?: \([^)]*\))?)\. (.+)$",l)
                if skip:
                    if m and prev_end:skip=False
                    else:prev_end=bool(re.search(r'[.:)»]$',l));continue
                if k=='l' and l.startswith('Utilizzi di azioni leggendarie'):
                    mm=re.search(r'(\d+)',l); d['lu']=int(mm.group(1)) if mm else 3; prev_end=bool(re.search(r'[.:)»]$',l)); skip=True; continue
                ok=m and prev_end and len(m.group(1).split())<=9 and not NOTENT.search(m.group(1))
                deb=[x for x in ents if x[0].startswith('Debolezze')]
                if ok and m.group(1) in SUB and deb:deb[-1][1]+=' '+l;last=deb[-1]   # la maquetación intercala otros rasgos
                elif ok:ents.append([m.group(1),m.group(2)]);last=ents[-1]
                elif ents:
                    last=last if last in ents else ents[-1]
                    if last[1].endswith('-') and l[:1].islower():last[1]=last[1][:-1]+l
                    else:last[1]+=' '+l
                else:ents.append(['',l])
                prev_end=bool(re.search(r'[.:)»]$',l))
            deb=[x for x in ents if x[0].startswith('Debolezze')]
            if deb:
                for x in [x for x in ents if x[0] in SUB]:deb[0][1]+=f' {x[0]}. {x[1]}';ents.remove(x)
            d[k]=ents
        return d
    IT=[parse(*b) for b in blocks]
    idx=collections.defaultdict(list)
    for e in IT: idx[(str(e['ac']),str(e['hp']))].append(e)
    merged=[];stats=collections.Counter();used=set()
    for m in EN:
        cands=[e for e in idx[(str(m['ac']),str(m['hp']))] if id(e) not in used and sum(a==b for a,b in zip(e['ab'],m['ab']))>=4]
        o=dict(m);o['en']=m['n']
        if not cands: stats['nomatch']+=1;o['_fb']=list('xxxxxxxxxx');merged.append(o);continue
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
                    t=re.search(r'\s*\(((?:Ricarica|ricarica)[^)]*|\d+/giorno[^)]*)\)\s*$',nm)
                    if t and k!='t':tag=t.group(1)[0].upper()+t.group(1)[1:];nm=nm[:t.start()]
                    new.append([nm,x[1]]+([tag] if tag else []))
                o[k]=new;stats['sec_ok']+=1
            elif mk: stats['sec_fallback']+=1;o.setdefault('_fb',[]).append(k)
        stats['match']+=1
        merged.append(o)
    print(stats,file=sys.stderr)
    return merged
rd=lambda f:open(f,encoding='utf-8').read().replace(chr(12),chr(10)).split(chr(10))
A=build(rd(sys.argv[1].replace('.txt','_raw.txt')))
B=build(rd(sys.argv[1]))
bad=lambda o:len(o.get('_fb',[]))
merged=[]
for a,b in zip(A,B):
    o=a if bad(a)<=bad(b) else b
    if bad(o):print('reserva',o['en'],o['n'],o.get('_fb'),file=sys.stderr)
    o.pop('_fb',None);merged.append(o)
json.dump(merged,open(sys.argv[3],'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
