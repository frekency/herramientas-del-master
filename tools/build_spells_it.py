# Conjuros del SRD 5.2.1 en italiano (secuencia de stream.py) al formato de conjuros_srd.json.
# El nombre inglés sale de conjuros_srd_en.json emparejando nivel, escuela, clases y datos de lanzamiento.
# Ojo: en italiano «Evocazione» es conjuración y «Invocazione» es evocación.
# Uso: python -I build_spells_it.py srd.json conjuros_srd_en.json conjuros_srd_it.json
import re,json,sys
import html as H
EN=json.load(open(sys.argv[2],encoding='utf-8'))
SCH={'abiurazione':'abjuracion','divinazione':'adivinacion','evocazione':'conjuracion','ammaliamento':'encantamiento',
     'invocazione':'evocacion','illusione':'ilusionismo','necromanzia':'nigromancia','trasmutazione':'transmutacion'}
CLS={'bardo':'Bardo','warlock':'Warlock','chierico':'Chierico','druido':'Druido','ranger':'Ranger','stregone':'Stregone','mago':'Mago','paladino':'Paladino'}
CLEN={'Bardo':'Bard','Warlock':'Warlock','Chierico':'Cleric','Druido':'Druid','Ranger':'Ranger','Stregone':'Sorcerer','Mago':'Wizard','Paladino':'Paladin'}
SC='Abiurazione|Divinazione|Evocazione|Ammaliamento|Invocazione|Illusione|Necromanzia|Trasmutazione'
HEAD=re.compile(r'^(?:('+SC+r') di ([1-9])º livello|Trucchetto di ('+SC+r')) \(([^)]+)\)$')
cap=lambda s:s[:1].upper()+s[1:]
AB={'Forza':'FOR','Destrezza':'DES','Costituzione':'COS','Intelligenza':'INT','Saggezza':'SAG','Carisma':'CAR'}
def md(h):   # HTML de stream.py → texto con **negrita** y *cursiva*
    h=re.sub(r'<b>(.*?)</b>',lambda m:'<b>'+re.sub(r'</?i>','',m[1])+'</b>',h)
    h=re.sub(r'<i>(.*?)</i>',lambda m:'<i>'+re.sub(r'</?b>','',m[1])+'</i>' if '<b>' in m[1] else m[0],h)
    h=re.sub(r'<b>(\s*)(.*?)(\s*)</b>',lambda m:m[1]+'**'+m[2]+'**'+m[3] if m[2] else m[0],h)
    h=re.sub(r'<i>(\s*)(.*?)(\s*)</i>',lambda m:m[1]+'*'+m[2]+'*'+m[3] if m[2] else m[0],h)
    return re.sub(r'  +',' ',H.unescape(re.sub(r'<[^>]+>','',h)).replace('\xad','')).strip()
S=[tuple(e) for e in json.load(open(sys.argv[1],encoding='utf-8'))]
a=next(i for i,e in enumerate(S) if e[0]=='h' and e[1]==2 and e[2]=='Descrizioni degli incantesimi')
b=next(i for i,e in enumerate(S) if i>a and e[0]=='h' and e[1]==1 and e[2]=='Glossario delle regole')
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
                    mm=re.match(r'\s*(Tempo di lancio|Gittata|Component[ei]|Durata):\s*(.*)',c)
                    if mm:
                        if 'Durata' in meta and len(meta)==4:paras.append(c.strip());continue
                        meta[mm[1]]=mm[2].strip();lk=mm[1]
                    elif meta:meta[lk]+=' '+c.strip()
            continue
        if e[0]=='p':
            t=md(e[1])
            mm=re.match(r'\*\*(Tempo di lancio|Gittata|Component[ei]|Durata):\*\*\s*(.*)',t)
            if mm and 'Durata' not in meta:   # metadatos como párrafos sueltos; la duración puede llevar pegado el texto
                v=mm[2]
                if mm[1]=='Durata':
                    k=re.search(r' (?=[A-ZÀ-Ý])',v)
                    if k:paras.append(v[k.end():]);v=v[:k.start()]
                meta[mm[1]]=v.strip();continue
            # «**Utilizzo … supe**» + «**riore.** …»: el título en negrita partido en dos párrafos
            if paras and re.fullmatch(r'\*\*[^*]+\*\*',paras[-1]) and t.startswith('**'):paras[-1]=paras[-1][:-2]+t[2:]
            else:paras.append(t)
        elif e[0]=='table':paras+=[' | '.join(r) for r in ([e[1]['head']] if e[1]['head'] else [])+e[1]['rows']]
        elif e[0]=='h':paras.append('**'+e[2]+'**')
    for k in list(meta):
        if 'Componente:' in meta[k]:meta[k],meta['Componenti']=[x.strip() for x in meta[k].split('Componente:',1)]
    ct,rg,comp,dur=(meta.get(k,meta.get(k[:-1]+'e','')) for k in ('Tempo di lancio','Gittata','Componenti','Durata'))
    dur=re.sub(r'\ba(\d)',r'a \1',dur)
    desc='\n'.join(paras)
    rit=bool(re.search(r'\brituale\b',ct,re.I));ct=re.sub(r'\s*o rituale','',ct,flags=re.I)
    conc=dur.lower().startswith('concentrazione')
    js=re.search(r'tiro salvezza su (Forza|Destrezza|Costituzione|Intelligenza|Saggezza|Carisma)',desc)
    use=('TdS '+AB[js[1]]) if js else ('Ataque' if re.search(r'attacco con incantesimo',desc) else '')
    out.append({'n':name,'en':'','lv':lv,'fl':'','d':desc,'dur':cap(dur),'rg':cap(rg),'ct':cap(ct),'comp':comp,'conc':conc,'rit':rit,'use':use,'cls':cls,'sch':sch,'pg':'SRD 5.2.1','src':'srd'})
# Si el texto se perdió en el salto de página del stream, se toma de pdftotext (4.º argumento opcional)
if len(sys.argv)>4:
    R=open(sys.argv[4],encoding='utf-8').read().replace('\f','\n')
    for s in out:
        if s['d']:continue
        m=re.search(r'\n'+re.escape(s['n'])+r'\n[^\n]*livello[^\n]*\n(?:Tempo di lancio[^\n]*\n)(.*?)\n(?=[^\n]+\n(?:Trucchetto di |(?:'+SC+r') di [1-9]º livello))',R,re.S)
        if m:
            L=[l for l in m[1].split('\n') if l.strip() and not re.search(r'System Reference Document',l)]
            s['d']='\n'.join(re.sub(r'^(Utilizzo di uno slot incantesimo di livello superiore\.|Trucchetto potenziato\.)',r'**\1**',l) for l in L).strip()
            js=re.search(r'tiro salvezza su (Forza|Destrezza|Costituzione|Intelligenza|Saggezza|Carisma)',s['d'])
            s['use']=('TdS '+AB[js[1]]) if js else ('Ataque' if 'attacco con incantesimo' in s['d'] else '')
# nombre inglés
pool=[dict(e,cl=sorted(e['cls'])) for e in EN]
used=set()
def vsm(c):return ''.join(x for x in 'VSM' if re.search(r'\b'+x+r'\b',c.split('(')[0]))
def ft(r):
    m=re.match(r'(\d+(?:,\d+)?)\s*(metri|metro|chilometri|chilometro|m|km)\b',r)
    return round(float(m[1].replace(',','.'))*(1000 if m[2].startswith(('k','chil')) else 1)/0.3) if m else None
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
    if len(c)>1:c=[e for e in c if e['dur'].lower().startswith('instant')==s['dur'].lower().startswith('istantane')] or c
    if len(c)>1 and rnd==0:continue
    if len(c)==1:s['en']=c[0]['n'];used.add(c[0]['n'])
FIX={'Fiotto acido':'Acid Splash','Raggio di gelo':'Ray of Frost','Stretta folgorante':'Shocking Grasp','Forma gassosa':'Gaseous Form','Volare':'Fly'}
for s in out:
    if s['n'] in FIX:s['en']=FIX[s['n']];used.add(FIX[s['n']])
json.dump(out,open(sys.argv[3],'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print(len(out),'incantesimi;',sum(1 for s in out if s['en']),'con nombre inglés',file=sys.stderr)
print('sin:',[(s['n'],s['lv'],s['sch'],s['rg']) for s in out if not s['en']],file=sys.stderr)
print('EN sin usar:',[(e['n'],e['lv'],e['sch'],e['rg']) for e in pool if e['n'] not in used],file=sys.stderr)
