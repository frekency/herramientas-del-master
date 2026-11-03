# Convierte el CSV de conjuros al JSON que lee el tracker (conjuros.json).
import csv,json,sys,re
SCH=['abjuracion','conjuracion','adivinacion','encantamiento','evocacion','ilusionismo','nigromancia','transmutacion']
yes=lambda v:str(v).strip().lower() in ('true','sí','si','x','1')
out=[]
for r in csv.DictReader(open(sys.argv[1],encoding='utf-8-sig')):
    r={k.strip().lower():(v or '').strip() for k,v in r.items()}
    if not r.get('name'):continue
    det=[s.strip() for s in r.get('details','').split('\n') if s.strip()]
    cost=r.get('cost','')
    comp=', '.join([c for c in [yes(r.get('verbal'))and'V',yes(r.get('somatic'))and'S',yes(r.get('material'))and('M'+(f' ({cost})' if cost and cost!='~' else ''))] if c])
    lv=r.get('level','')
    out.append({'n':r['name'],'en':r.get('name_ingles',''),'lv':0 if re.search('truco',lv,re.I) else int(lv or 0),'fl':r.get('flavour',''),'d':r.get('description',''),
      'dur':det[0] if det else '','rg':det[1] if len(det)>1 else '','ct':det[2] if len(det)>2 else '','comp':comp,'conc':yes(r.get('concentration')),'rit':yes(r.get('ritual')),
      'use':r.get('como_usar',''),'cls':[c.strip() for c in r.get('clase del hechizo','').split(',') if c.strip()],'sch':next((k for k in SCH if yes(r.get(k))),''),'pg':r.get('page','')})
json.dump(out,open(sys.argv[2],'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print(len(out))
