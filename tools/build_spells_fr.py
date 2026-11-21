# Conjuros del SRD 5.2.1 en francés (texto de pdftotext -enc UTF-8) al formato de datos/es/conjuros.json.
# El nombre inglés sale de datos/en/conjuros.json emparejando nivel, escuela, clases y datos de lanzamiento.
# Uso: python -I build_spells_fr.py r.txt datos/en/conjuros.json datos/fr/conjuros.json
import re,json,sys
L=open(sys.argv[1],encoding='utf-8').read().replace('\f','\n').split('\n')
EN=json.load(open(sys.argv[2],encoding='utf-8'))
SCH={'abjuration':'abjuracion','divination':'adivinacion','invocation':'conjuracion','enchantement':'encantamiento',
     'évocation':'evocacion','illusion':'ilusionismo','nécromancie':'nigromancia','transmutation':'transmutacion'}
CLS={'barde':'Barde','occultiste':'Occultiste','clerc':'Clerc','druide':'Druide','rôdeur':'Rôdeur','ensorceleur':'Ensorceleur','magicien':'Magicien','paladin':'Paladin'}
CLEN={'Barde':'Bard','Occultiste':'Warlock','Clerc':'Cleric','Druide':'Druid','Rôdeur':'Ranger','Ensorceleur':'Sorcerer','Magicien':'Wizard','Paladin':'Paladin'}
SC='Abjuration|Divination|Enchantement|Évocation|Illusion|Invocation|Nécromancie|Transmutation'
HEAD=re.compile(r'^(?:('+SC+r') du ([1-9])(?:er|e) niveau|('+SC+r') mineure?) \(([^)]+)\)$')
NOISE=re.compile(r'^\d+ Document de Référence du Système|^Document de Référence du Système|^\d+$')
start=max(i for i,l in enumerate(L) if l.strip()=='Description des sorts')
end_=next(i for i,l in enumerate(L) if i>start and l.strip()=='Glossaire de règles')
heads=[i for i in range(start,end_) if HEAD.match(L[i].strip()) and L[i-1].strip()]
def clean(s):
    s=s.replace('\xad','').replace('‑ ','').replace('‑','-')
    return re.sub(r'[ \t]+',' ',s).strip()
def join(lines):
    out=''
    for l in lines:
        if out.endswith('-') and l[:1].islower():out=out[:-1]+l
        else:out+=('\n' if out else '')+l
    return out
cap=lambda s:s[:1].upper()+s[1:]
out=[]
for k,i in enumerate(heads):
    end=heads[k+1]-1 if k+1<len(heads) else end_
    m=HEAD.match(L[i].strip())
    sch=SCH[(m[1] or m[3]).lower()];lv=int(m[2] or 0)
    cls=[CLS[c.strip().lower()] for c in m[4].split(',') if c.strip().lower() in CLS]
    body=[clean(l) for l in L[i+1:end] if l.strip() and not NOISE.match(l.strip())]
    j=next(n for n,l in enumerate(body) if 'Durée :' in l)
    # la línea de duración puede seguir en la siguiente si termina en coma
    meta=join(body[:j+1]).replace('\n',' ')
    g=lambda a,b:(re.search(a+r'\s*:\s*(.*?)\s*(?='+b+r'\s*:|$)',meta) or [None,''])[1].strip()
    ct=g('Temps d’incantation','Portée');rg=g('Portée','Composantes');comp=g('Composantes','Durée');dur=g('Durée','$^')
    desc=join(body[j+1:])
    rit=bool(re.search(r'\brituel\b',ct,re.I));ct=re.sub(r'\s*ou rituel','',ct,flags=re.I)
    conc=dur.lower().startswith('concentration')
    js=re.search(r'jet de sauvegarde (?:de |d’)(Force|Dextérité|Constitution|Intelligence|Sagesse|Charisme)',desc)
    AB={'Force':'FOR','Dextérité':'DEX','Constitution':'CON','Intelligence':'INT','Sagesse':'SAG','Charisme':'CHA'}
    use=('TdS '+AB[js[1]]) if js else ('Ataque' if re.search(r'attaque de sort',desc) else '')
    desc=re.sub(r'^(Emplacement de niveau supérieur|Amélioration de sort mineur)\. ',r'**\1.** ',desc,flags=re.M)
    out.append({'n':clean(L[i-1]),'en':'','lv':lv,'fl':'','d':desc,'dur':cap(dur),'rg':cap(rg),'ct':cap(ct),'comp':comp,'conc':conc,'rit':rit,'use':use,'cls':cls,'sch':sch,'pg':'SRD 5.2.1','src':'srd'})
# nombre inglés
pool=[dict(e,cl=sorted(e['cls'])) for e in EN]
used=set()
def vsm(c):return ''.join(x for x in 'VSM' if re.search(r'\b'+x+r'\b',c.split('(')[0]))
def ft(r):
    m=re.match(r'(\d+(?:,\d+)?)\s*(m|km)\b',r)
    return round(float(m[1].replace(',','.'))*(1000 if m[2]=='km' else 1)/0.3) if m else None
def eft(r):
    m=re.match(r'(\d+)\s*(feet|foot|miles?)',r)
    return int(m[1])*(5280 if m[2].startswith('mile') else 1) if m else None
for rnd in range(2):
  for s in out:
    if s['en']:continue
    c=[e for e in pool if e['lv']==s['lv'] and e['sch']==s['sch'] and e['n'] not in used and e['cl']==sorted(CLEN[x] for x in s['cls'])]
    if len(c)>1:c=[e for e in c if e['conc']==s['conc'] and e['rit']==s['rit']] or c
    if len(c)>1:c=[e for e in c if vsm(e['comp'])==vsm(s['comp'])] or c
    if len(c)>1:c=[e for e in c if eft(e['rg']) is not None and ft(s['rg']) is not None and abs(eft(e['rg'])-ft(s['rg']))<=ft(s['rg'])*0.05+1] or c
    if len(c)>1:c=[e for e in c if e['dur'].lower().startswith('instant')==s['dur'].lower().startswith('instant')] or c
    if len(c)>1 and rnd==0:continue
    if len(c)>=1 and (len(c)==1 or rnd==1):
        if len(c)==1:s['en']=c[0]['n'];used.add(c[0]['n'])
FIX={'Aspersion acide':'Acid Splash','Rayon de givre':'Ray of Frost','Poigne électrique':'Shocking Grasp','Vol':'Fly','Forme gazeuse':'Gaseous Form'}
for s in out:
    if s['n'] in FIX:s['en']=FIX[s['n']];used.add(FIX[s['n']])
json.dump(out,open(sys.argv[3],'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print(len(out),'sorts;',sum(1 for s in out if s['en']),'con nombre inglés',file=sys.stderr)
print('sin:',[(s['n'],s['lv'],s['sch'],s['rg']) for s in out if not s['en']],file=sys.stderr)
print('EN sin usar:',[(e['n'],e['lv'],e['sch'],e['rg']) for e in pool if e['n'] not in used],file=sys.stderr)
