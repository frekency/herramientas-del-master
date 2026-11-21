# Criaturas del SRD 5.2.1 en alemán (texto de pdftotext -enc UTF-8) fusionadas sobre datos/en/bestiario.json por CA, PG y características.
# En el SRD alemán las entradas van con dos puntos («Tentakel: …») y los dados con W («2W6+5»); los dados se guardan tal cual.
# Uso: python -I build_de.py r.txt datos/en/bestiario.json datos/de/bestiario.json
import re,json,sys,collections
EN=json.load(open(sys.argv[2],encoding='utf-8'))
def build(L):
  start=next(i for i,l in enumerate(L) if l.strip()=='Aboleth' and i>1000)-40   # la Riesenfliege va antes, en las figuritas
  heads=[]
  TYR=re.compile(r'^(?:Winzig|Klein|Mittelgroß|Groß|Riesig|Gigantisch)\w*\b.*,|^Schwarm\b|^(?:Winzig|Klein|Mittelgroß|Groß|Riesig|Gigantisch)\w* oder')
  for i in range(1000,len(L)):
      if re.match(r'^RK \d',L[i]):
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
  NOISE=re.compile(r'^\d+ Systemreferenzdokument|^Systemreferenzdokument|^\d+$|^MOD RW$|^Tiere$')
  SECH={'Merkmale':'t','Besondere Merkmale':'t','Ungewöhnliche Merkmale':'t','Aktionen':'a','Bonusaktionen':'b','Reaktionen':'r','Legendäre Aktionen':'l'}
  LABS='Bewegungsrate|Fertigkeiten|Anfälligkeiten|Resistenzen|Immunitäten|Ausrüstung|Sinne|Sprachen|HG|Initiative|Stä|Ges|Kon|Int|Wei|Cha|MOD RW|TP|RK'
  NOTENT=re.compile(r'^(?:Misserfolg|Erfolg|Erfolg oder Misserfolg|Treffer|Treffer oder Fehlschlag|Fehlschlag|Auslöser|Reaktion)$|rettungswurf$|angriffswurf$|^Je \d+-mal täglich|^Beliebig oft|^\d+-mal täglich')
  SUB={'Fließendes Wasser','Holzpflock ins Herz','Sonnenlicht','Eindringen verboten','Kein Zutritt ohne Einladung'}
  def parse(name,tyline,lines):
      lines=[l.strip() for l in lines if l.strip() and not NOISE.match(l.strip())]
      idx=[n for n,l in enumerate(lines) if l in SECH]
      head=' '.join(lines[:idx[0]] if idx else lines)
      secs={}
      for a,b in zip(idx,idx[1:]+[len(lines)]):
          secs.setdefault(SECH[lines[a]],[]).extend(lines[a+1:b])
      g=lambda pat:(re.search(pat,head) or [None,None])[1]
      d={'n':name,'tyl':tyline}
      d['ab']=tuple(int(x) if x else None for x in [g(r'\b%s (\d+)'%a) for a in ['Stä','Ges','Kon','Int','Wei','Cha']])
      d['ac']=g(r'RK (\d+)'); d['hp']=g(r'TP (\d+)'); d['cr']=g(r'HG ([\d/]+)')
      for lab,key in [('Bewegungsrate','sp'),('Fertigkeiten','sk'),('Anfälligkeiten','vu'),('Resistenzen','re'),('Immunitäten','im'),('Sinne','se'),('Sprachen','la'),('Ausrüstung','eq')]:
          m=re.search(r'\b'+lab+r' (.*?)(?= (?:'+LABS+r')\b |$)',head)
          if m:d[key]=m.group(1).strip().rstrip(';,')
      if 'se' in d:
          m=re.search(r'[;,]? ?Passive Wahrnehmung (\d+)',d['se'])
          if m:d['se']=d['se'][:m.start()].strip().rstrip(';,')
      if d.get('la') in ('−','-','–'):d['la']='—'
      for k,ls in secs.items():
          j=[]
          for l in ls:
              if j and j[-1].count('(')>j[-1].count(')'):j[-1]+=' '+l
              else:j.append(l)
          ls=j
          ents=[];prev_end=True;skip=False
          for l in ls:
              if skip:
                  if re.match(r'^([A-ZÄÖÜ„][^.:]{0,80}?(?: \([^)]*\))?): ',l) and prev_end:skip=False
                  else:prev_end=bool(re.search(r'[.:)“]$',l));continue
              if k=='l' and l.startswith('Anwendungen legendärer Aktionen'):
                  mm=re.search(r'(\d+)',l); d['lu']=int(mm.group(1)) if mm else 3; prev_end=bool(re.search(r'[.:)“]$',l)); skip=True; continue
              m=re.match(r'^([A-ZÄÖÜ„][^.:]{0,80}?(?: \([^)]*\))?): (.+)$',l)
              ok=m and prev_end and len(m.group(1).split())<=9 and not NOTENT.search(m.group(1))
              if ok and ents and (ents[-1][1].endswith(':') or m.group(1) in SUB):ents[-1][1]+=' '+l
              elif ok:ents.append([m.group(1),m.group(2)])
              elif ents:ents[-1][1]+=('' if ents[-1][1].endswith('-') else ' ')+l
              else:ents.append(['',l])
              prev_end=bool(re.search(r'[.:)“]$',l))
          d[k]=ents
      return d
  DE=[parse(*b) for b in blocks]
  idx=collections.defaultdict(list)
  for e in DE: idx[(str(e['ac']),str(e['hp']))].append(e)
  merged=[];stats=collections.Counter();un=[];used=set()
  for m in EN:
      cands=[e for e in idx[(str(m['ac']),str(m['hp']))] if id(e) not in used and sum(a==b for a,b in zip(e['ab'],m['ab']))>=4]
      o=dict(m);o['en']=m['n']
      if not cands: stats['nomatch']+=1;un.append(m['n']);o['_fb']=list('xxxxxxxxxx');merged.append(o);continue
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
                  t=re.search(r'\s*\(((?:Aufladung|aufladung)[^)]*|\d+-mal täglich[^)]*)\)\s*$',nm)
                  if t and k!='t':tag=t.group(1)[0].upper()+t.group(1)[1:];nm=nm[:t.start()]
                  new.append([nm,x[1]]+([tag] if tag else []))
              o[k]=new;stats['sec_ok']+=1
          elif mk: stats['sec_fallback']+=1;o.setdefault('_fb',[]).append(k)
      stats['match']+=1
      merged.append(o)
  print(stats,file=sys.stderr)
  return merged
# dos lecturas del PDF: la normal (mejor orden de líneas) y la «raw» (sin mezclar columnas); por criatura gana la que tenga menos secciones de reserva
rd=lambda f:open(f,encoding='utf-8').read().replace(chr(173),'').replace(chr(12),chr(10)).split(chr(10))
A=build(rd(sys.argv[1]))
B=build(rd(sys.argv[1].replace('.txt','_raw.txt')))
bad=lambda o:len(o.get('_fb',[]))
merged=[]
for a,b in zip(A,B):
    o=a if bad(a)<=bad(b) else b
    if bad(o):print('reserva',o['en'],o['n'],o.get('_fb'),file=sys.stderr)
    o.pop('_fb',None);merged.append(o)
for o in merged:
    if o['en']=='Giant Fly' and o['n']=='Giant Fly':o['n']='Riesenfliege'
json.dump(merged,open(sys.argv[3],'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
