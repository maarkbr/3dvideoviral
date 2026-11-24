import sys, csv, json, math, statistics as st
v = sys.argv[1]; B = json.loads(sys.argv[2])  # lista de [quadro, tipo, dur_transicao_quadros]
R = list(csv.DictReader(open(f'{v}-quadros.csv'))); W = json.load(open(f'{v}-fala.json')); n = len(R)
f = lambda x: float(x) if x not in ('', None) else None
lim = [[0, 'inicio', 0]] + B + [[n, 'fim', 0]]
out = []
for (a, ta, _), (b, tb, db) in zip(lim, lim[1:]):
    S = R[a:b]; zoom = 1; px = py = rot = 0; vel = []
    for r in S[1:]:
        e = f(r['escala']); inl = int(r['inliers'] or 0)
        if e and inl >= 25 and 0.85 < e < 1.18:
            zoom *= e; px -= f(r['tx']); py -= f(r['ty']); rot += f(r['rot']); vel.append(abs(math.log(e)) * 100 * 3 + math.hypot(f(r['tx']), f(r['ty'])) / 3.6)
        else: vel.append(None)
    vv = [x for x in vel if x is not None]; cob = len(vv) / max(1, len(vel))
    q = lambda k: (lambda p: round(st.mean(p), 2) if p else None)([x for x in vel[k * len(vel) // 4:(k + 1) * len(vel) // 4] if x is not None])
    fala = [w for w in W if a / 30 <= w['i'] < b / 30]
    out.append(dict(plano=len(out) + 1, ini=round(a / 30, 2), fim=round(b / 30, 2), dur=round((b - a) / 30, 2), entrada=ta, saida=tb, saida_quadros=db,
        zoom_pct=round((zoom - 1) * 100, 1), pan_x_pct=round(px / 360 * 100, 1), pan_y_pct=round(py / 640 * 100, 1), rot=round(rot, 1),
        vel_q1=q(0), vel_q2=q(1), vel_q3=q(2), vel_q4=q(3), vel_max=round(max(vv), 1) if vv else None, cobertura_medida=round(cob, 2),
        luma=round(st.mean(float(r['luma']) for r in S)), sat=round(st.mean(float(r['sat']) for r in S)), quente=round(st.mean(float(r['quente']) for r in S)),
        contraste=round(st.mean(float(r['contraste']) for r in S)), escuro=round(st.mean(float(r['pct_escuro']) for r in S), 1), claro=round(st.mean(float(r['pct_claro']) for r in S), 1),
        palavras=len(fala), fala=' '.join(w['w'] for w in fala)))
json.dump(out, open(f'{v}-planos.json', 'w'), ensure_ascii=False, indent=1)
for p in out: print(p['plano'], p['ini'], p['fim'], p['dur'], p['entrada'], '| zoom', p['zoom_pct'], 'pan', p['pan_x_pct'], p['pan_y_pct'], 'rot', p['rot'], '| vel', p['vel_q1'], p['vel_q2'], p['vel_q3'], p['vel_q4'], 'max', p['vel_max'], 'cob', p['cobertura_medida'], '| L', p['luma'], 'S', p['sat'], 'Q', p['quente'], '|', p['palavras'], 'pal')
d = [p['dur'] for p in out]; print('planos', len(d), 'média', round(st.mean(d), 2), 'mediana', st.median(d))
