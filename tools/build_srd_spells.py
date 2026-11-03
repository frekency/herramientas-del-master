# Extrae los conjuros del SRD 5.2.1 en español (texto de pdftotext) al formato de conjuros.json.
# Uso: python build_srd_spells.py es/r.txt srd_en_spells.json conjuros_srd.json
import re,json,sys,unicodedata
L=open(sys.argv[1],encoding='utf-8').read().replace('\f','\n').split('\n')
EN=json.load(open(sys.argv[2],encoding='utf-8'))
SCH={'abjuración':'abjuracion','adivinación':'adivinacion','conjuración':'conjuracion','encantamiento':'encantamiento',
     'evocación':'evocacion','ilusionismo':'ilusionismo','nigromancia':'nigromancia','transmutación':'transmutacion'}
CLS={'bardo':'Bardo','brujo':'Brujo','clérigo':'Clérigo','druida':'Druida','explorador':'Explorador','hechicero':'Hechicero','mago':'Mago','paladín':'Paladín'}
HEAD=re.compile(r'^(?:(Abjuración|Adivinación|Conjuración|Encantamiento|Evocación|Ilusionismo|Nigromancia|Transmutación) de nivel ([1-9])|Truco de (\w+)) \(([^)]+)\)$')
NOISE=re.compile(r'^\d+ Documento de referencia del sistema|^Documento de referencia del sistema|^\d+$')
heads=[i for i,l in enumerate(L) if HEAD.match(l.strip()) and L[i-1].strip()]
def clean(s):
    s=s.replace('­','').replace('‑ ','').replace('‑','-')
    return re.sub(r'[ \t]+',' ',s).strip()
def join(lines):
    out=''
    for l in lines:
        if out.endswith('-') and l[:1].islower():out=out[:-1]+l
        else:out+=('\n' if out else '')+l
    return out
def fold(s):return ''.join(c for c in unicodedata.normalize('NFD',s.lower()) if unicodedata.category(c)!='Mn')
out=[]
for k,i in enumerate(heads):
    end=heads[k+1]-1 if k+1<len(heads) else len(L)
    m=HEAD.match(L[i].strip())
    sch=SCH[(m[1] or m[3]).lower()];lv=int(m[2] or 0)
    cls=[CLS[c.strip().lower()] for c in m[4].split(',') if c.strip().lower() in CLS]
    body=[clean(l) for l in L[i+1:end] if l.strip() and not NOISE.match(l.strip())]
    # bloque de datos: desde «Tiempo de lanzamiento» hasta la línea que contiene «Duración:»
    j=next(n for n,l in enumerate(body) if 'Duración:' in l)
    meta=join(body[:j+1]).replace('\n',' ')
    g=lambda a,b:(re.search(a+r':\s*(.*?)\s*(?='+b+r':|$)',meta) or [None,''])[1].strip()
    ct=g('Tiempo de lanzamiento','Alcance');rg=g('Alcance','Componentes');comp=g('Componentes','Duración');dur=g('Duración','$^')
    desc=join(body[j+1:])
    rit=bool(re.search(r'\britual\b',ct,re.I));ct=re.sub(r'\s*o un ritual','',ct,flags=re.I)
    conc=dur.lower().startswith('concentración')
    tds=re.search(r'tirada de salvación de (Fuerza|Destreza|Constitución|Inteligencia|Sabiduría|Carisma)',desc)
    use=('TdS '+tds[1][:3].upper().replace('Í','I')) if tds else ('Ataque' if re.search(r'tirada de ataque de conjuro',desc) else '')
    out.append({'n':clean(L[i-1]),'en':'','lv':lv,'fl':'','d':desc,'dur':dur,'rg':rg,'ct':ct,'comp':comp,'conc':conc,'rit':rit,'use':use,'cls':cls,'sch':sch,'pg':'SRD 5.2.1','src':'srd'})
# nombre en inglés: mismo nivel y escuela, desempate por clases y componentes
ENS={'abjuration':'abjuracion','divination':'adivinacion','conjuration':'conjuracion','enchantment':'encantamiento','evocation':'evocacion','illusion':'ilusionismo','necromancy':'nigromancia','transmutation':'transmutacion'}
ENC={'bard':'Bardo','warlock':'Brujo','cleric':'Clérigo','druid':'Druida','ranger':'Explorador','sorcerer':'Hechicero','wizard':'Mago','paladin':'Paladín'}
pool=[dict(e,sch=ENS.get(e['school'].lower(),''),cls=sorted(ENC[c] for c in e['classes'] if c in ENC)) for e in EN]
used=set()
for s in out:
    c=[e for e in pool if e['level']==s['lv'] and e['sch']==s['sch'] and e['name'] not in used]
    if len(c)>1:c=[e for e in c if e['cls']==sorted(s['cls'])] or c
    if len(c)>1:c=[e for e in c if e['conc']==s['conc'] and e['rit']==s['rit']] or c
    if len(c)>1:c=[e for e in c if e['comp']==''.join(x for x in 'VSM' if re.search(r'\b'+x+r'\b',s['comp'].split('(')[0]))] or c
    if len(c)>1:c=[e for e in c if e['dur'].lower().startswith('instant')==s['dur'].lower().startswith('instant')] or c
    if len(c)==1:s['en']=c[0]['name'];used.add(c[0]['name'])
json.dump(out,open(sys.argv[3],'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print(len(out),'conjuros;',sum(1 for s in out if s['en']),'con nombre en inglés',file=sys.stderr)
# segunda pasada: nombres en inglés conocidos por el CSV propio (opcional) y, si no, alcance
if len(sys.argv)>4:
    MAP={fold(x['n']):x['en'] for x in json.load(open(sys.argv[4],encoding='utf-8')) if x.get('en')}
    names={e['name'].lower():e['name'] for e in EN}
    for s in out:
        if not s['en']:
            e=names.get((MAP.get(fold(s['n'])) or '').lower())
            if e and e not in used:s['en']=e;used.add(e)
ft=lambda r:(re.match(r'(\d+)\s*m',r) or [0,0])[1]
for s in out:
    if s['en']:continue
    c=[e for e in pool if e['level']==s['lv'] and e['sch']==s['sch'] and e['name'] not in used and e['cls']==sorted(s['cls'])]
    m=ft(s['rg']);c=[e for e in c if m and re.match(r'(\d+)',e['range']) and round(int(re.match(r'(\d+)',e['range'])[1])*.3)==int(m)] if len(c)>1 else c
    if len(c)==1:s['en']=c[0]['name'];used.add(c[0]['name'])
json.dump(out,open(sys.argv[3],'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print('tras segunda pasada:',sum(1 for s in out if s['en']),file=sys.stderr)
FIX={'Cofre oculto':'Secret Chest'}
for s in out:
    if s['n'] in FIX:s['en']=FIX[s['n']]
json.dump(out,open(sys.argv[3],'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
