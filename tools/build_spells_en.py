# Conjuros del SRD 5.2 en inglés (API de Open5e, documento srd-2024) al formato de conjuros_srd.json.
# Uso: python -I build_spells_en.py raw.json conjuros_srd_en.json
import json,sys,re
R=json.load(open(sys.argv[1],encoding='utf-8'))
R=R['results'] if isinstance(R,dict) else R
SCH={'abjuration':'abjuracion','conjuration':'conjuracion','divination':'adivinacion','enchantment':'encantamiento','evocation':'evocacion','illusion':'ilusionismo','necromancy':'nigromancia','transmutation':'transmutacion'}
CT={'action':'Action','bonus-action':'Bonus Action','reaction':'Reaction'}
def ct(x):
    v=x['casting_time'];t=CT.get(v) or re.sub(r'^(\d+)(\D+)$',lambda m:f"{m[1]} {m[2].rstrip('s')}{'s' if m[1]!='1' else ''}",v)
    if v=='reaction' and x.get('reaction_condition') not in (None,'None',''):t+=', '+x['reaction_condition']
    return t
out=[]
for x in R:
    comp=', '.join([c for c,k in (('V','verbal'),('S','somatic')) if x.get(k)]+([f"M ({x['material_specified']})" if x.get('material_specified') else 'M'] if x.get('material') else []))
    d=x['desc'].strip()
    if x.get('higher_level'):d+=f"\n\n**{'Cantrip Upgrade' if int(x['level'])==0 else 'Using a Higher-Level Spell Slot'}.** {x['higher_level'].strip()}"
    dur=x['duration'];dur=dur[:1].upper()+dur[1:]
    if x.get('concentration'):dur='Concentration, up to '+x['duration']
    out.append({'n':x['name'],'en':x['name'],'lv':int(x['level']),'fl':'','d':d,'dur':dur,'rg':x.get('range_text') or '','ct':ct(x),'comp':comp,
                'conc':bool(x.get('concentration')),'rit':bool(x.get('ritual')),'use':'','cls':sorted(c['name'] for c in x.get('classes',[])),
                'sch':SCH.get(x['school']['key'],''),'pg':'SRD 5.2','src':'srd'})
out.sort(key=lambda s:s['n'])
json.dump(out,open(sys.argv[2],'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print(len(out))
