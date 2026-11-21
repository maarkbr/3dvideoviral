#!/usr/bin/env python3
"""Mixagem do estilo Colagem: narração na frente, trilha baixa por baixo e efeitos curtos e secos nas entradas.
Os níveis vêm das referências medidas: a trilha fica ~16 dB abaixo da voz e os efeitos quase escondidos (só o carimbo
e o selo aparecem um pouco). O master -14 LUFS é feito no finalizar.py.
uso: python mixar.py <pasta do vídeo>
lê voz/voz.wav, som/eventos.json (do montar.py) e som.json; grava som/mix.wav (48 kHz, estéreo).
som.json:
  "sons":    {"papel": ["arq.wav", ...], "pop": [...], ...}  arquivos do pack da pessoa (caminho completo ou relativo à pasta);
             tipo sem arquivo usa o SFX Kit. Tipos: papel, papel-leve, pop, impacto, carimbo, caneta, caneta-curta, tecla, clique, deslize.
  "niveis":  {"papel": -22, ...}  dB em relação à voz (troque só se ouvir e achar alto ou baixo).
  "trilha":  {"arquivo": "", "inicio": 0, "nivel": -16, "credito": ""}
  "efeitos": [{"t": 3.2, "arquivo": "...", "nivel": -18}]  efeitos a mais, à mão."""
import json, os, subprocess, sys
import numpy as np
P = os.path.abspath(sys.argv[1]); SR = 48000
SOM = json.load(open(os.path.join(P, 'som.json'), encoding='utf-8'))
EV = json.load(open(os.path.join(P, 'som', 'eventos.json'), encoding='utf-8'))
import re
h = open(os.path.join(P, 'index.html'), encoding='utf-8').read(); FIM = float(re.search(r'data-duration="([\d.]+)"', h).group(1)); N = int(round(FIM * SR))

def acha_sfx():
    if SOM.get('sfx_pasta') and SOM['sfx_pasta'] != 'auto': return os.path.expanduser(SOM['sfx_pasta'])
    d = P
    for _ in range(7):
        c = os.path.join(d, '_ferramentas', 'sfx-kit', 'sounds')
        if os.path.isdir(c): return c
        d = os.path.dirname(d)
    return None
SFX = acha_sfx()
PADRAO = {   # sem pack: o SFX Kit (CC0), escolhido ouvindo para soar como papel e caneta, nada de "efeito de videogame"
    'papel': ['swishes-and-zips/swish-soft.wav', 'everyday-props/props-page-turn.wav'],
    'papel-leve': ['pops/pop-small-in.wav'],
    'pop': ['pops/pop-small-in.wav', 'pops/pop-medium-in.wav'],
    'impacto': ['impacts/impact-light-firm.wav'],
    'carimbo': ['impacts/impact-medium-firm.wav'],
    'caneta': ['writing-and-drawing/writing-marker-draw.wav', 'writing-and-drawing/writing-pen-draw.wav'],
    'caneta-curta': ['writing-and-drawing/writing-marker-tick.wav', 'writing-and-drawing/writing-pen-tick.wav'],
    'tecla': ['keyboard/keyboard-letter-soft.wav', 'keyboard/keyboard-letter-medium.wav'],
    'clique': ['interface/click-tap-medium.wav'],
    'deslize': ['whooshes/whoosh-fast-soft.wav'],
}
NIVEL = {'papel': -23, 'papel-leve': -25, 'pop': -22, 'impacto': -15, 'carimbo': -13, 'caneta': -22, 'caneta-curta': -24, 'tecla': -28, 'clique': -18, 'deslize': -22}
NIVEL.update(SOM.get('niveis', {}))

def caminho(a):
    for c in [a, os.path.join(P, a)] + ([os.path.join(SFX, a)] if SFX else []):
        c = os.path.expanduser(c)
        if os.path.isfile(c): return c
    return None
def carrega(c, ss=0.0, t=None):
    cmd = ['ffmpeg', '-v', 'error', '-ss', f'{ss:.4f}'] + (['-t', f'{t:.4f}'] if t else []) + ['-i', c, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32).reshape(-1, 2).astype(np.float64)
def nivel_db(x):   # nível das partes com som (ignora silêncio)
    m = x.mean(1); hop = 960
    w = np.array([np.sqrt(np.mean(m[i:i + hop] ** 2)) for i in range(0, max(1, len(m) - hop), hop)]) + 1e-9
    w = np.sort(w)[len(w) // 2:]; return 20 * np.log10(np.sqrt(np.mean(w ** 2)))
def apara(x):   # começa no ataque (sem atraso) e termina sem clique
    m = np.abs(x).max(1); lim = m.max() * 0.05; i = int(np.argmax(m > lim)); x = x[max(0, i - 48):]
    if len(x) > SR * 1.6: x = x[:int(SR * 1.6)]
    f = min(len(x), 2400); x[-f:] *= np.linspace(1, 0, f)[:, None]; return x

mix = np.zeros((N, 2))
voz = carrega(os.path.join(P, 'voz', 'voz.wav'))[:N]; mix[:len(voz)] += voz
VDB = nivel_db(voz); print(f'voz: {VDB:.1f} dB')
cache, usados, faltou = {}, {}, set()
def som_de(tipo, k):
    lista = SOM.get('sons', {}).get(tipo) or PADRAO.get(tipo, [])
    cands = [c for c in (caminho(a) for a in lista) if c]
    if not cands: faltou.add(tipo); return None
    c = cands[k % len(cands)]
    if c not in cache: cache[c] = apara(carrega(c))
    usados.setdefault(tipo, set()).add(os.path.basename(c)); return cache[c]
ultimo = {}
for k, e in enumerate(EV):
    tp = e['tipo']
    if tp == 'tecla' and e['t'] - ultimo.get(tp, -9) < 0.05: continue
    x = som_de(tp, k)
    if x is None: continue
    ultimo[tp] = e['t']
    alvo = VDB + NIVEL.get(tp, -22); g = 10 ** ((alvo - nivel_db(x)) / 20)
    i = int(e['t'] * SR); j = min(N, i + len(x))
    if i < N: mix[i:j] += x[:j - i] * g
for e in SOM.get('efeitos', []):
    c = caminho(e['arquivo'])
    if not c: print('aviso: efeito não encontrado:', e['arquivo']); continue
    x = apara(carrega(c, e.get('ss', 0), e.get('dur'))); g = 10 ** ((VDB + e.get('nivel', -20) - nivel_db(x)) / 20)
    i = int(e['t'] * SR); j = min(N, i + len(x)); mix[i:j] += x[:j - i] * g

tr = SOM.get('trilha', {})
if tr.get('arquivo') and caminho(tr['arquivo']):
    t = carrega(caminho(tr['arquivo']), tr.get('inicio', 0))
    while len(t) < N: t = np.concatenate([t, t])
    t = t[:N]; g = 10 ** ((VDB + tr.get('nivel', -16) - nivel_db(t)) / 20); t = t * g
    fi, fo = int(0.25 * SR), int(0.9 * SR); t[:fi] *= np.linspace(0, 1, fi)[:, None]; t[-fo:] *= np.linspace(1, 0, fo)[:, None]
    mix += t; print(f'trilha: {os.path.basename(tr["arquivo"])} a {tr.get("nivel", -16)} dB da voz')
else: print('aviso: sem trilha (som.json > trilha.arquivo). As referências têm uma batida leve por baixo.')
pk = np.abs(mix).max()
if pk > 0.98: mix *= 0.98 / pk
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f64le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s24le', os.path.join(P, 'som', 'mix.wav')], input=mix.astype('<f8').tobytes(), check=True)
for tp, fs in usados.items(): print(f'  {tp}: {", ".join(sorted(fs))}')
if faltou: print('aviso: sem som para', ', '.join(sorted(faltou)), '(ponha no som.json > sons, ou instale o SFX Kit)')
print('mix:', os.path.join(P, 'som', 'mix.wav'))
