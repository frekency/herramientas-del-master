# Convierte el PDF del SRD 5.2.1 en español en una secuencia de elementos con su estilo:
#   ('h', nivel, texto, página)        títulos (por tamaño de letra de GillSans-SemiBold)
#   ('p', html, página)               párrafos (cursiva y negrita como <i>/<b>)
#   ('row', [celdas], página)         filas de tabla (texto en GillSans pequeño, agrupado por altura)
import pymupdf,re,html,json,sys

HEAD={26.0:1,18.0:2,14.0:3,12.0:4,10.5:5}
def kind(s):
    f,z=s['font'],round(s['size'],1)
    if 'SemiBold' in f and 'SC700' not in f and z in HEAD:return 'h',HEAD[z]
    if f.startswith('GillSans-SemiBold-SC') or f.startswith('GillSans-Bold-SC'):return 'sc',z
    if f.startswith('Cambria'):return 'body',f
    if f.startswith('GillSans') and z in (10.0,):return 'label',f    # «Dote: …», listas de atributos
    if f.startswith('Optima'):return 'stat',f
    if f.startswith('GillSans') and z<=9.9:return 'table',f
    return 'other',f

def span_html(s):
    t=html.escape(s['text'].replace('\xa0',' '))
    f=s['font']
    if 'BoldItalic' in f:return f'<b><i>{t}</i></b>' if t.strip() else t
    if 'Bold' in f or ('SemiBold' in f and kind(s)[0]=='label'):return f'<b>{t}</b>' if t.strip() else t
    if 'Italic' in f:return f'<i>{t}</i>' if t.strip() else t
    return t

def lines(doc):
    for pn,page in enumerate(doc,1):
        for b in page.get_text('dict')['blocks']:
            for l in b.get('lines',[]):
                sp=[s for s in l['spans'] if s['text'].strip()]
                if not sp:continue
                k=kind(sp[0])
                # cabecera y número de página
                if sp[0]['font'].startswith('GillSans') and round(sp[0]['size'],1)==11.0:continue
                # mayúsculas en versalitas dentro de un título: se tratan como parte del título
                if k[0]=='sc':
                    hk=[kind(s) for s in sp if kind(s)[0]=='h']
                    z=round(sp[-1]['size'],1);k=hk[0] if hk else (('h',HEAD[z]) if z in HEAD else ('table','') if z<=9.9 else ('stat',''))
                yield {'pg':pn,'k':k,'x':l['bbox'][0],'y':l['bbox'][1],'spans':l['spans'],
                       'text':''.join(s['text'] for s in l['spans']).replace('\xa0',' ')}

def join(a,b):
    m=re.search(r'\xad((?:</[bi]>)*)$',a)
    if m:                                  # guion de corte, también al final de una cursiva
        tags=m[1];b=b.lstrip()
        for tg in re.findall(r'</([bi])>',tags):
            if b.startswith(f'<{tg}>'):b=b[3:];tags=tags.replace(f'</{tg}>','',1)
        return a[:m.start()]+tags+b
    if a.endswith('‑') or a.endswith('-') and re.search(r'\w-$',a) and b[:1].islower():return a+b.lstrip()
    return a.rstrip()+' '+b.lstrip()

def stream(path):
    doc=pymupdf.open(path);out=[];cur=None;tab=[]
    def flush():
        nonlocal cur
        if cur:out.append(cur);cur=None
    def flush_tab():
        # Reconstruye la tabla. Cada línea se parte en celdas por los huecos entre fragmentos; las columnas salen
        # de las filas más habituales (intervalos x0–x1) y cada celda va a la columna que contiene su centro.
        nonlocal tab
        if not tab:return
        cells_of=[]
        for l in tab:
            grp=[]
            for s in l['spans']:
                if not s['text'].strip():continue
                x0,_,x1,_=s['bbox']
                if grp and x0-grp[-1]['x1']<6:grp[-1]['t']+=s['text'];grp[-1]['x1']=x1
                else:grp.append({'x0':x0,'x1':x1,'t':s['text'],'f':s['font'],'pg':l['pg'],'y':l['y']})
            cells_of+=grp
        rows={}
        for c in cells_of:rows.setdefault((c['pg'],round(c['y']/2.5)),[]).append(c)
        rows=[sorted(rows[k],key=lambda c:c['x0']) for k in sorted(rows)]
        from collections import Counter
        n=Counter(len(r) for r in rows if len(r)>1).most_common(1)
        n=n[0][0] if n else 1
        if n>1:
            ref=[r for r in rows if len(r)==n]
            iv=[(min(r[i]['x0'] for r in ref),max(r[i]['x1'] for r in ref)) for i in range(n)]
            bounds=[(iv[i][1]+iv[i+1][0])/2 for i in range(n-1)]
        else:bounds=[]
        def col(c):
            m=(c['x0']+c['x1'])/2
            if bounds and c['x0']<=iv[0][0]+4 and c['x1']>bounds[0]:return 0      # texto ancho que empieza en la 1.ª columna
            return sum(m>b for b in bounds)
        bold=lambda r:all('Bold' in c['f'] for c in r)                       # cabeceras
        marked=lambda r:all('Bold' in c['f'] or 'Italic' in c['f'] for c in r)  # filas de sección
        head=['']*n;body=[];secs=set();in_head=True
        for r in rows:
            cells={}
            for c in r:
                i=col(c);cells[i]=join(cells[i],c['t']) if i in cells else c['t']
            if in_head and n>2 and (bold(r) or 0 not in cells):
                for i,v in cells.items():head[i]=join(head[i],v) if head[i] else v
                continue
            in_head=False
            if body and n==2 and len(cells)==1:                       # tabla de dos columnas: línea partida
                i=next(iter(cells));body[-1][i]=join(body[-1][i],cells[i]) if body[-1][i] else cells[i];continue
            if body and n>2 and (0 not in cells or (len(cells)==1 and not marked(r)) or cells[0][:1].islower()):   # continuación de la fila anterior
                if len(body)-1 in secs:secs.discard(len(body)-1)
                for i,v in cells.items():body[-1][i]=join(body[-1][i],v) if body[-1][i] else v
                continue
            if len(cells)==1 and 0 in cells and n>2:secs.add(len(body));body.append([cells[0]]+['']*(n-1));continue   # fila de sección
            body.append([cells.get(i,'') for i in range(n)])
        clean=lambda v:re.sub(r'\s+',' ',v.replace('­','')).strip()
        if not any(head) or n<=2:head=None
        out.append(('table',{'head':[clean(h) for h in head] if head else None,'rows':[[clean(r[0])] if i in secs else [clean(v) for v in r] for i,r in enumerate(body)]},tab[0]['pg']))
        tab=[]
    prev=None
    for l in lines(doc):
        k=l['k'][0];txt=l['text']
        if k=='table':flush();tab.append(l);prev=l;continue
        flush_tab()
        if k=='h':
            lv=l['k'][1]
            if cur and cur[0]=='h' and cur[1]==lv and prev and prev['pg']==l['pg'] and abs(l["y"]-prev["y"])<{1:40,2:30,3:22,4:18,5:16}[lv] and abs(l['x']-prev['x'])<60:
                cur=('h',lv,join(cur[2],txt),cur[3])          # título en dos líneas
            else:flush();cur=('h',lv,txt.strip(),l['pg'])
        elif k in('body','label','stat','other'):
            h=''.join(span_html(s) for s in l['spans'])
            hanging=bool(cur and cur[0]=='p' and cur[4] and l['x']>cur[5]+3)   # sangría francesa (listas y «Negrita.» al margen)
            newpara=(cur is None or cur[0]!='p' or
                     (k=='body' and prev and prev['k'][0]=='body' and l['x']-prev['x']>5 and abs(l['x']-prev['x'])<20 and not hanging) or   # sangría = párrafo nuevo
                     (k=='label' and l['spans'][0]['font'].endswith('SemiBold')) or                                           # «Dote: …» empieza línea
                     (k=='body' and re.match(r'(Cambria-BoldItalic|Cambria-Bold)$',l['spans'][0]['font'])) or
                     (prev and prev['k'][0]!=k and not (prev['k'][0]=='label' and k in('label','body') and abs(l['x']-prev['x'])<4)) or
                     (txt.lstrip().startswith(('•','●'))))
            if newpara:flush();cur=['p',h,l['pg'],k,l['spans'][0]['font']=='Cambria-Bold' or txt.lstrip().startswith(('•','●')),l['x']]
            else:cur[1]=join(cur[1],h)
        prev=l
    flush();flush_tab()
    res=[]
    for e in out:
        if e[0]=='p':
            h=re.sub(r'</(b|i)>(\s*)<\1>',r'\2',e[1]).replace('\xad','').strip()
            h=re.sub(r'</b><b>|</i><i>','',h)
            res.append(('p',re.sub(r'  +',' ',h.replace('\t',' ')),e[2]))
        else:res.append(tuple(e))
    return res

if __name__=='__main__':
    s=stream(sys.argv[1])
    json.dump(s,open(sys.argv[2],'w',encoding='utf-8'),ensure_ascii=False)
    with open(sys.argv[2].replace('.json','.md'),'w',encoding='utf-8') as f:
        for e in s:
            if e[0]=='h':f.write(f"\n{'#'*e[1]} {e[2]}   [p{e[3]}]\n")
            elif e[0]=='p':f.write(e[1]+'\n')
            else:
                if e[1]['head']:f.write('|H '+' | '.join(e[1]['head'])+' |\n')
                for r in e[1]['rows']:f.write('| '+' | '.join(r)+' |\n')
    print(len(s))
