#!/usr/bin/env python3
"""Confere a cena.js antes de gerar o vídeo e prepara a página e a lista de efeitos sonoros.
uso: python montar.py <pasta do vídeo>
- barra o que quebra o vídeo (foto faltando, tipo de peça desconhecido, cena fora de ordem, peça fora da tela);
- barra a cena sem a assinatura do estilo (foto com fita + um traço ou carimbo + um número);
- avisa o que deixa o vídeo parado (cena longa demais, mais de ~2 s sem nada entrando);
- grava a duração no index.html e a lista de efeitos em som/eventos.json (o mixar.py usa)."""
import json, os, re, shutil, subprocess, sys
P = os.path.abspath(sys.argv[1])
def le_js(p): return json.loads(re.sub(r'^window\.\w+\s*=\s*|;\s*$', '', open(p, encoding='utf-8').read().strip()))
try: C = le_js(os.path.join(P, 'cena.js'))
except Exception as e: sys.exit(f'cena.js não é um JSON válido depois de "window.CENA =": {e}')
node = shutil.which('node') or sys.exit('Falta o Node (https://nodejs.org).')
os.makedirs(os.path.join(P, 'work'), exist_ok=True)   # .cjs: o package.json do projeto é "module" e o Node trataria o .js como ESM
shutil.copy(os.path.join(P, 'assets', 'eventos.js'), os.path.join(P, 'work', 'eventos.cjs'))
r = subprocess.run([node, os.path.join(P, 'work', 'eventos.cjs'), os.path.join(P, 'cena.js')], capture_output=True, text=True)
if r.returncode: sys.exit('eventos.js falhou:\n' + r.stderr[-1500:])
plano = json.loads(r.stdout)
erros, avisos = [], list(plano['avisos'])
TIPOS = {'mapa', 'barras', 'foto', 'tv', 'cartao', 'etiqueta', 'folha', 'selo', 'carimbo', 'lista', 'pilha', 'ano', 'seta', 'circulo', 'fio', 'nota'}
cenas = C.get('cenas', [])
if not cenas: erros.append('a cena não tem nenhuma "cenas"')
if cenas and cenas[0]['t'] > 0.05: erros.append(f'a primeira cena começa em {cenas[0]["t"]} s: comece em 0')
for a, b in zip(cenas, cenas[1:]):
    if b['t'] <= a['t']: erros.append(f'cenas fora de ordem: {a["t"]} s e depois {b["t"]} s')
tem = set()
for i, c in enumerate(cenas, 1):
    for j, o in enumerate(c.get('objetos', []), 1):
        tp = o.get('tipo')
        if tp not in TIPOS: erros.append(f'cena {i}, peça {j}: tipo "{tp}" não existe (use um destes: {", ".join(sorted(TIPOS))})'); continue
        tem.add(tp)
        if tp == 'cartao' and o.get('numero'): tem.add('numero')
        imgs = [o['img']] if tp == 'foto' else [x['img'] for x in o.get('imgs', [])] if tp == 'tv' else []
        if tp == 'mapa' and not os.path.exists(os.path.join(P, 'assets', 'mapas', str(o.get('mapa')) + '.js')): erros.append(f'cena {i}: o mapa "{o.get("mapa")}" não foi preparado (rode mapa.py --nome {o.get("mapa")} ...)')
        for im in imgs:
            if not os.path.exists(os.path.join(P, 'assets', 'fotos', im + '.jpg')): erros.append(f'cena {i}: a foto "{im}" não está em assets/fotos/ (ponha em fotos/ e rode preparar.py)')
        x, y, w = o.get('x', 540), o.get('y', 900), o.get('w', 0)
        if tp in ('foto', 'cartao', 'folha', 'tv', 'lista') and w and (x - w / 2 < -40 or x + w / 2 > 1120): avisos.append(f'cena {i}, peça {j} ({tp}): passa da borda lateral (x {x}, largura {w}); de propósito só se for uma folha de fundo')
        if tp not in ('folha',) and (y < 330 or y > 1640): avisos.append(f'cena {i}, peça {j} ({tp}): y {y} fica fora da área segura do Reels (330 a 1640): a legenda no topo e os botões embaixo cobrem')
        if tp in ('seta', 'fio') and not (o.get('de_xy') and o.get('para_xy')): erros.append(f'cena {i}, peça {j} ({tp}): precisa de "de_xy" e "para_xy"')
fotos = 'foto' in tem or 'tv' in tem
traco = tem & {'seta', 'circulo', 'carimbo', 'fio'}
numero = tem & {'selo', 'numero', 'ano', 'lista', 'barras'}
if not fotos: erros.append('assinatura do estilo: falta uma foto colada com fita')
if not traco: erros.append('assinatura do estilo: falta um traço à mão (seta, círculo, fio) ou um carimbo na palavra falada')
if not numero: avisos.append('assinatura do estilo: sem número na tela (selo, cartão com número, ano ou lista). Toda referência tem pelo menos um.')
if not C.get('enfase'): avisos.append('"enfase" vazia: nenhuma frase da legenda fica em itálico. Liste as palavras-chave da fala.')
if not os.path.exists(os.path.join(P, 'assets', 'palavras.js')) or os.path.getsize(os.path.join(P, 'assets', 'palavras.js')) < 30: avisos.append('sem palavras na legenda: rode montar_voz.py e preparar.py')
# duração no index.html e os mapas preparados
ih = os.path.join(P, 'index.html'); h = open(ih, encoding='utf-8').read()
md = os.path.join(P, 'assets', 'mapas')
for f in sorted(os.listdir(md)) if os.path.isdir(md) else []:
    tag = f'<script src="assets/mapas/{f}"></script>'
    if f.endswith('.js') and tag not in h: h = h.replace('<script src="cena.js"></script>', tag + '\n<script src="cena.js"></script>')
h = re.sub(r'data-duration="[^"]*"', f'data-duration="{plano["fim"]:.2f}"', h, count=1); open(ih, 'w', encoding='utf-8').write(h)
os.makedirs(os.path.join(P, 'som'), exist_ok=True)
json.dump(plano['sons'], open(os.path.join(P, 'som', 'eventos.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(f'duração {plano["fim"]:.2f} s · {len(cenas)} cenas · {sum(len(c.get("objetos", [])) for c in cenas)} peças · {len(plano["sons"])} efeitos sonoros')
for a in avisos: print('aviso:', a)
for e in erros: print('ERRO:', e)
print('OK: pode tirar os quadros' if not erros else 'Conserte a cena.js e rode de novo.')
sys.exit(1 if erros else 0)
