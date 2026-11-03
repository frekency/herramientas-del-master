import json,sys,os
d=sys.argv[1]
r=[]
for p in range(1,5): r+=json.load(open(os.path.join(d,f'p{p}.json')))['results']
AB=['strength','dexterity','constitution','intelligence','wisdom','charisma']
def cr(v):
    return {0.125:'1/8',0.25:'1/4',0.5:'1/2'}.get(v, str(int(v)) if v==int(v) else str(v))
def speed(s):
    out=[]
    for k in ['walk','burrow','climb','fly','swim']:
        v=s.get(k)
        if v: out.append(f"{v} ft." if k=='walk' else f"{k} {v} ft.")
    if s.get('hover'): out.append('(hover)')
    return ', '.join(out)
def senses(m):
    out=[]
    for k,l in [('blindsight_range','Blindsight'),('darkvision_range','Darkvision'),('tremorsense_range','Tremorsense'),('truesight_range','Truesight')]:
        if m.get(k): out.append(f"{l} {int(m[k])} ft.")
    return ', '.join(out)
USE={'RECHARGE_ON_ROLL':'Recharge {}–6','RECHARGE':'Recharge {}–6','PER_DAY':'{}/Day'}
mons=[]
for m in sorted(r,key=lambda x:x['name']):
    ri=m['resistances_and_immunities']
    acts={'a':[],'b':[],'r':[],'l':[]}
    tmap={'ACTION':'a','BONUS_ACTION':'b','REACTION':'r','LEGENDARY_ACTION':'l'}
    for a in sorted(m['actions'],key=lambda x:x['order_in_statblock']):
        u=a['usage_limits']; tag=''
        if u:
            p=u['param']; t=u['type']
            tag=('Recharge 6' if t.startswith('RECHARGE') and p==6 else USE.get(t,'{}').format(p))
        acts[tmap.get(a['action_type'],'a')].append([a['name'],a['desc']]+([tag] if tag else []))
    imm=', '.join(x for x in [ri['damage_immunities_display'],ri['condition_immunities_display']] if x)
    o={'n':m['name'],'sz':m['size']['name'],'ty':m['type']['name'],'al':m['alignment'],'cr':cr(m['challenge_rating']),'xp':m['experience_points'],
       'ac':m['armor_class'],'hp':m['hit_points'],'hd':(m['hit_dice'] or '').replace(' ',''),'sp':speed(m['speed']),
       'in':m['initiative_bonus'] if m['initiative_bonus'] is not None else m['modifiers']['dexterity'],
       'ab':[m['ability_scores'][k] for k in AB],'sv':[m['saving_throws_all'][k] for k in AB],
       'sk':', '.join(f"{k.replace('_',' ').title()} +{v}" if v>=0 else f"{k.title()} {v}" for k,v in (m['skill_bonuses'] or {}).items()),
       'se':senses(m),'pp':m['passive_perception'],'la':(m['languages'] or {}).get('as_string',''),
       'vu':ri['damage_vulnerabilities_display'],'re':ri['damage_resistances_display'],'im':imm,
       't':[[t['name'],t['desc']] for t in m['traits']]}
    for k,v in acts.items():
        if v: o[k]=v
    for k in list(o):
        if o[k] in ('',None,[]): del o[k]
    mons.append(o)
json.dump(mons,open(sys.argv[2],'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print(len(mons), os.path.getsize(sys.argv[2]))
