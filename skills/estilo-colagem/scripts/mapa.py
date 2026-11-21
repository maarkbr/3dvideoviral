#!/usr/bin/env python3
"""Prepara um mapa recortado (estados de um país, Natural Earth, domínio público) para a peça "mapa" da cena.
uso: python mapa.py <pasta do vídeo> --nome sudeste --pais BRA --caixa=-53.5,-25.5,-39,-14 [--largura 1000]
  --caixa=lon_min,lat_min,lon_max,lat_max (com "=", porque começa com sinal de menos) (o pedaço do mundo que aparece). Os estados do --pais ficam claros com borda;
           os de outros países, num tom de papel, sem borda (como nas referências).
grava assets/mapas/<nome>.js (window.MAPAS["<nome>"] = {w, h, caixa, estados: {UF: {d, cx, cy, nome}}}) e mostra os estados.
Na 1ª vez baixa o arquivo de estados do Natural Earth (~40 MB) para _ferramentas/mapas/ (fica para os próximos vídeos).
Para pôr um pino: a cena usa lon/lat; o motor converte com a mesma conta (está no .js)."""
import argparse, json, math, os, sys, urllib.request
ap = argparse.ArgumentParser(); ap.add_argument('pasta'); ap.add_argument('--nome', required=True); ap.add_argument('--pais', default='BRA')
ap.add_argument('--caixa', required=True); ap.add_argument('--largura', type=int, default=1000); ap.add_argument('--tol', type=float, default=1.4)
a = ap.parse_args(); P = os.path.abspath(a.pasta)
lon0, lat0, lon1, lat1 = [float(x) for x in a.caixa.split(',')]
URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson'
def acha_geo():
    cands = [os.path.expanduser('~/.cache/videos-de-mapa/ne-admin1/ne_10m_admin_1_states_provinces.geojson')]
    d = P
    for _ in range(7):
        cands.append(os.path.join(d, '_ferramentas', 'mapas', 'ne_10m_admin_1_states_provinces.geojson')); d = os.path.dirname(d)
    for c in cands:
        if os.path.exists(c) and os.path.getsize(c) > 1e6: return c
    d = P   # baixa para a _ferramentas mais próxima (ou para a pasta do vídeo)
    alvo = None
    for _ in range(7):
        if os.path.isdir(os.path.join(d, '_ferramentas')): alvo = os.path.join(d, '_ferramentas', 'mapas'); break
        d = os.path.dirname(d)
    alvo = alvo or os.path.join(P, 'work'); os.makedirs(alvo, exist_ok=True)
    dest = os.path.join(alvo, 'ne_10m_admin_1_states_provinces.geojson')
    print('baixando os estados do Natural Earth (domínio público, ~40 MB)...'); urllib.request.urlretrieve(URL, dest); return dest
G = json.load(open(acha_geo(), encoding='utf-8'))
latc = (lat0 + lat1) / 2; kx = math.cos(math.radians(latc))
W = a.largura; esc = W / ((lon1 - lon0) * kx); H = round((lat1 - lat0) * esc)
proj = lambda lo, la: ((lo - lon0) * kx * esc, (lat1 - la) * esc)
def dentro(bb): return not (bb[2] < lon0 - 6 or bb[0] > lon1 + 6 or bb[3] < lat0 - 6 or bb[1] > lat1 + 6)   # margem larga: estado pequeno (o DF) não vira buraco no vizinho
def bbox(geom):
    xs, ys = [], []
    polys = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
    for pol in polys:
        for anel in pol:
            for lo, la in anel: xs.append(lo); ys.append(la)
    return (min(xs), min(ys), max(xs), max(ys))
def caminho(geom):
    polys = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
    partes = []; area_max, centro = 0, (0, 0)
    for pol in polys:
        for k, anel in enumerate(pol):
            pts = [proj(lo, la) for lo, la in anel]; s = [pts[0]]
            for p in pts[1:]:
                if math.hypot(p[0] - s[-1][0], p[1] - s[-1][1]) >= a.tol: s.append(p)
            if len(s) < 4: continue
            partes.append('M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in s) + 'Z')
            if k == 0:
                ar = 0.5 * abs(sum(s[i][0] * s[i - 1][1] - s[i - 1][0] * s[i][1] for i in range(len(s))))
                if ar > area_max: area_max = ar; centro = (sum(x for x, _ in s) / len(s), sum(y for _, y in s) / len(s))
    return ''.join(partes), centro
estados, fora = {}, []
for f in G['features']:
    pr = f['properties']; g = f['geometry']
    if not g or not dentro(bbox(g)): continue
    d, (cx, cy) = caminho(g)
    if not d: continue
    if pr.get('adm0_a3') == a.pais:
        uf = pr.get('postal') or pr.get('iso_3166_2') or pr.get('name')
        estados[uf] = {'d': d, 'cx': round(cx, 1), 'cy': round(cy, 1), 'nome': pr.get('name')}
    else: fora.append(d)
os.makedirs(os.path.join(P, 'assets', 'mapas'), exist_ok=True)
dados = {'w': W, 'h': H, 'caixa': [lon0, lat0, lon1, lat1], 'kx': kx, 'esc': esc, 'estados': estados, 'fora': ''.join(fora)}
open(os.path.join(P, 'assets', 'mapas', a.nome + '.js'), 'w', encoding='utf-8').write(
    f'window.MAPAS = window.MAPAS || {{}}; window.MAPAS[{json.dumps(a.nome)}] = ' + json.dumps(dados, ensure_ascii=False) + ';\n')
print(f'mapa "{a.nome}": {W}x{H} px, {len(estados)} estados de {a.pais}: {", ".join(sorted(estados))}')
print(f'  ponha <script src="assets/mapas/{a.nome}.js"></script> no index.html (o montar.py faz isso sozinho)')
