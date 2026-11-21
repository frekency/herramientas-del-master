# Conjuros del SRD 5.2.1 en alemán (secuencia de stream.py) al formato de datos/es/conjuros.json.
# El nombre inglés sale de datos/en/conjuros.json emparejando nivel, escuela, clases y datos de lanzamiento.
# Uso: python -I build_spells_de.py srd.json datos/en/conjuros.json datos/de/conjuros.json
import re,json,sys

EN=json.load(open(sys.argv[2],encoding='utf-8'))
SCH={'bann':'abjuracion','erkenntnis':'adivinacion','beschwörung':'conjuracion','verzauberung':'encantamiento',
     'hervorrufung':'evocacion','illusion':'ilusionismo','nekromantie':'nigromancia','verwandlung':'transmutacion'}
CLS={'barde':'Barde','hexenmeister':'Hexenmeister','kleriker':'Kleriker','druide':'Druide','waldläufer':'Waldläufer','zauberer':'Zauberer','magier':'Magier','paladin':'Paladin'}
CLEN={'Barde':'Bard','Hexenmeister':'Warlock','Kleriker':'Cleric','Druide':'Druid','Waldläufer':'Ranger','Zauberer':'Sorcerer','Magier':'Wizard','Paladin':'Paladin'}
SC='Bann|Erkenntnis|Beschwörung|Verzauberung|Hervorrufung|Illusion|Nekromantie|Verwandlung'
HEAD=re.compile(r'^(?:('+SC+r')s?zauber ([1-9])\. Grades|Zaubertrick de[rs] ('+SC+r')s?) \(([^)]+)\)$')
import html as H
cap=lambda s:s[:1].upper()+s[1:]
AB={'Stärke':'STÄ','Geschicklichkeit':'GES','Konstitution':'KON','Intelligenz':'INT','Weisheit':'WEI','Charisma':'CHA'}
def md(h):   # HTML de stream.py → texto con **negrita** y *cursiva*
    h=re.sub(r'<b>(.*?)</b>',lambda m:'<b>'+re.sub(r'</?i>','',m[1])+'</b>',h)
    h=re.sub(r'<i>(.*?)</i>',lambda m:'<i>'+re.sub(r'</?b>','',m[1])+'</i>' if '<b>' in m[1] else m[0],h)
    h=re.sub(r'<b>(\s*)(.*?)(\s*)</b>',lambda m:m[1]+'**'+m[2]+'**'+m[3] if m[2] else m[0],h)
    h=re.sub(r'<i>(\s*)(.*?)(\s*)</i>',lambda m:m[1]+'*'+m[2]+'*'+m[3] if m[2] else m[0],h)
    return re.sub(r'  +',' ',H.unescape(re.sub(r'<[^>]+>','',h)).replace('\xad','')).strip()
# El texto de pdftotext mezcla columnas en algunas páginas de conjuros: se usa la secuencia de stream.py (srd.json)
S=[tuple(e) for e in json.load(open(sys.argv[1],encoding='utf-8'))]
a=next(i for i,e in enumerate(S) if e[0]=='h' and e[1]==2 and e[2]=='Beschreibungen der Zauber')
b=next(i for i,e in enumerate(S) if i>a and e[0]=='h' and e[1]==1 and e[2]=='Regelglossar')
ents=[];cur=None
for e in S[a+1:b]:
    if e[0]=='h' and e[1]==4:cur=[e[2],[]];ents.append(cur)
    elif cur:cur[1].append(e)
out=[]
for name,els in ents:
    hd=next(md(e[1]) for e in els if e[0]=='p').strip('* ')
    m=HEAD.match(hd)
    if not m:print('sin cabecera',name,hd,file=sys.stderr);continue
    sch=SCH[(m[1] or m[3]).lower()];lv=int(m[2] or 0)
    cls=[CLS[c.strip().lower()] for c in m[4].split(',') if c.strip().lower() in CLS]
    meta={};paras=[];seen=False
    for e in els:
        if e[0]=='p' and not seen:seen=True;continue
        if e[0]=='table' and not meta:
            for r in e[1]['rows']:
                for c in r:
                    mm=re.match(r'\s*(Zeitaufwand|Reichweite|Komponenten|Wirkungsdauer):\s*(.*)',c)
                    if mm:meta[mm[1]]=mm[2].strip()
                    elif meta:k=list(meta)[-1];meta[k]+=' '+c.strip()
            continue
        if e[0]=='p':
            t=md(e[1])
            mm=re.match(r'\*\*(Zeitaufwand|Reichweite|Komponenten|Wirkungsdauer):\*\*\s*(.*)',t)
            if mm and 'Wirkungsdauer' not in meta:   # datos de lanzamiento como párrafos sueltos; la duración puede llevar pegado el texto
                v=mm[2]
                if mm[1]=='Wirkungsdauer':
                    k=re.search(r' (?=(?:Du|Ein|Eine|Bis|Wähle|Jede|Das|Der|Die|Dieser|Diese|Ziel)\b)',v)
                    if k:paras.append(v[k.end():]);v=v[:k.start()]
                meta[mm[1]]=v.strip();continue
            paras.append(t)
        elif e[0]=='table':paras+=[' | '.join(r) for r in ([e[1]['head']] if e[1]['head'] else [])+e[1]['rows']]
        elif e[0]=='h':paras.append('**'+e[2]+'**')
    ct,rg,comp,dur=(re.sub(r'(\w)- (?=[A-ZÄÖÜ])',r'\1-',meta.get(k,'')) for k in ('Zeitaufwand','Reichweite','Komponenten','Wirkungsdauer'))
    desc='\n'.join(paras)
    rit=bool(re.search(r'\bRitual\b',ct,re.I));ct=re.sub(r'\s*oder Ritual','',ct,flags=re.I)
    conc=dur.lower().startswith('konzentration')
    js=re.search(r'(Stärke|Geschicklichkeit|Konstitution|Intelligenz|Weisheit|Charisma)s?rettungswurf',desc)
    use=('TdS '+AB[js[1]]) if js else ('Ataque' if re.search(r'Zauberangriff',desc) else '')
    out.append({'n':name,'en':'','lv':lv,'fl':'','d':desc,'dur':cap(dur),'rg':cap(rg),'ct':cap(ct),'comp':comp,'conc':conc,'rit':rit,'use':use,'cls':cls,'sch':sch,'pg':'SRD 5.2.1','src':'srd'})
# nombre inglés
pool=[dict(e,cl=sorted(e['cls'])) for e in EN]
used=set()
def vsm(c):
    c=re.sub(r'\bG\b','S',c.split('(')[0])          # G = Gesten (somático)
    return ''.join(x for x in 'VSM' if re.search(r'\b'+x+r'\b',c))
def ft(r):
    m=re.match(r'(\d+(?:,\d+)?)\s*(Meter|Kilometer|m|km)\b',r)
    return round(float(m[1].replace(',','.'))*(1000 if m[2] in('km','Kilometer') else 1)/0.3) if m else None
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
    if len(c)>1:c=[e for e in c if e['dur'].lower().startswith('instant')==s['dur'].lower().startswith('unmittelbar')] or c
    if len(c)>1 and rnd==0:continue
    if len(c)==1:s['en']=c[0]['n'];used.add(c[0]['n'])
FIX={'Flug':'Fly','Gasförmige Gestalt':'Gaseous Form','Kältestrahl':'Ray of Frost','Säurespritzer':'Acid Splash','Schockgriff':'Shocking Grasp'}
for s in out:
    if s['n'] in FIX:s['en']=FIX[s['n']];used.add(FIX[s['n']])
json.dump(out,open(sys.argv[3],'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print(len(out),'Zauber;',sum(1 for s in out if s['en']),'con nombre inglés',file=sys.stderr)
print('sin:',[(s['n'],s['lv'],s['sch'],s['rg']) for s in out if not s['en']],file=sys.stderr)
print('EN sin usar:',[(e['n'],e['lv'],e['sch'],e['rg']) for e in pool if e['n'] not in used],file=sys.stderr)
