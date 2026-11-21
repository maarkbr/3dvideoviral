#!/usr/bin/env python3
"""Mixagem do estilo Documentário: narração + trilha (opcional) + efeitos, tudo descrito no som.json do projeto.
uso: python mixar.py <pasta do vídeo> [--9x16]
saída: som/mix.wav (ou som/mix-9x16.wav), 48 kHz estéreo. O master -14 LUFS é feito no finalizar.sh.
As teclas da datilografia saem sozinhas dos tempos em dados.js (tipos e cta)."""
import json, os, re, subprocess, sys
import numpy as np

P = os.path.abspath(sys.argv[1]); VERT = '--9x16' in sys.argv
SR = 48000
ARQ = 'cena.js' if os.path.exists(os.path.join(P, 'cena.js')) else 'dados.js'
DADOS = json.loads(re.sub(r'^window\.\w+\s*=\s*|;\s*$', '', open(os.path.join(P, ARQ), encoding='utf-8').read().strip()))
SOM = json.load(open(os.path.join(P, 'som.json'), encoding='utf-8'))
DUR = DADOS['dur']; FIM = DADOS['cta']['fim'] if VERT and 'cta' in DADOS else DUR; N = int(round(FIM * SR))
rng = np.random.default_rng(34)


def acha_sfx():
    """a pasta sounds/ do SFX Kit: a do som.json, ou _ferramentas/sfx-kit/sounds subindo a partir do projeto."""
    if SOM.get('sfx_pasta') and SOM['sfx_pasta'] != 'auto': return os.path.expanduser(SOM['sfx_pasta'])
    d = P
    for _ in range(6):
        c = os.path.join(d, '_ferramentas', 'sfx-kit', 'sounds')
        if os.path.isdir(c): return c
        d = os.path.dirname(d)
    sys.exit('Não achei o SFX Kit (_ferramentas/sfx-kit/sounds). Ponha o caminho em som.json > sfx_pasta.')
SFX = acha_sfx()
def caminho(a):
    for c in [a, os.path.join(P, a), os.path.join(SFX, a)]:
        if os.path.isfile(os.path.expanduser(c)): return os.path.expanduser(c)
    sys.exit(f'Arquivo de som não encontrado: {a}')


def carrega(c, ss=0.0, t=None):
    cmd = ['ffmpeg', '-v', 'error', '-ss', f'{ss:.4f}'] + (['-t', f'{t:.4f}'] if t else []) + ['-i', c, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32).reshape(-1, 2).astype(np.float64)
def nivel_db(x):
    m = x.mean(1); hop = 960
    w = np.array([np.sqrt(np.mean(m[i:i + hop] ** 2)) for i in range(0, max(1, len(m) - hop), hop)]) + 1e-9
    w = np.sort(w)[len(w) // 2:]; return 20 * np.log10(np.sqrt(np.mean(w ** 2)))
def pico_db(x): return 20 * np.log10(np.abs(x).max() + 1e-9)
def fades(x, fi=0.004, fo=0.03):
    n = len(x); a = np.ones(n); i = min(n, int(fi * SR)); o = min(n, int(fo * SR))
    if i: a[:i] = np.linspace(0, 1, i)
    if o: a[-o:] = np.minimum(a[-o:], np.linspace(1, 0, o))
    return x * a[:, None]

mix = np.zeros((N, 2)); sfx = np.zeros((N, 2)); mus = np.zeros((N, 2))
def poe(buf, x, t, g=0.0, pan=0.0):
    i0 = int(round(t * SR)); x = x * 10 ** (g / 20)
    if pan: x = x.copy(); x[:, 0] *= np.sqrt(1 - pan); x[:, 1] *= np.sqrt(1 + pan)
    a, b = max(0, i0), min(N, i0 + len(x))
    if b > a: buf[a:b] += x[a - i0:b - i0]
CACHE = {}
def efeito(som, t, ataque=0.0, nivel=-28, pan=0.0, de=0.0, dur=None, fi=0.004, fo=0.03, **_):
    """o ataque do som ('sync' no catálogo do SFX Kit) cai em t; nivel = dB ativos, com o pico limitado a nivel+12."""
    k = (som, de, dur)
    if k not in CACHE: CACHE[k] = carrega(caminho(som), de, dur)
    x = fades(CACHE[k], fi, fo)
    poe(sfx, x, t - ataque, min(nivel - nivel_db(x), nivel + 12 - pico_db(x)), pan)

# narração
voz = carrega(os.path.join(P, 'voz', 'voz.wav'))[:N]
voz *= 10 ** ((-20 - nivel_db(voz)) / 20); mix[:len(voz)] += voz
# trilha: trechos de uma música livre para uso comercial
tr = SOM.get('trilha') or {}
if tr.get('arquivo'):
    for k, tc in enumerate(tr['trechos']):
        ultimo = k == len(tr['trechos']) - 1
        dur = tc['dur'] + (FIM - DUR if VERT and ultimo else 0)
        x = carrega(caminho(tc.get('arquivo', tr['arquivo'])), tc['de'], dur);   # cada trecho pode ser outra música do pack
        x *= 10 ** ((tc['nivel'] - nivel_db(x[:SR * 6])) / 20)
        tt = np.arange(len(x)) / SR; env = np.clip(tt / tc.get('entra', 0.8), 0, 1) ** 1.5
        if 'sai_em' in tc and not (VERT and ultimo): env *= np.clip((tc['sai_em'] - tc['em'] - tt) / tc.get('sai', 0.3), 0, 1)   # sai_em no tempo do vídeo (antes contava do início do trecho e a música cortava seco)
        if VERT and ultimo: env *= np.clip((FIM - tc['em'] - 0.05 - tt) / 1.2, 0, 1)
        poe(mus, x * env[:, None], tc['em'])
    # a trilha abaixa quando a voz fala (som.json > trilha.abaixa, padrão 3 dB)
    vm = np.abs(voz.mean(1)); hop = 480
    ve = np.array([np.sqrt(np.mean(vm[i:i + hop] ** 2)) for i in range(0, len(vm), hop)])
    at = np.convolve((20 * np.log10(ve + 1e-9) > -45).astype(float), np.ones(25) / 25, 'same')
    duck = np.repeat(10 ** (-tr.get('abaixa', 3) * at / 20), hop)[:N]; duck = np.pad(duck, (0, max(0, N - len(duck))), constant_values=1)
    mus *= duck[:, None]
# efeitos automáticos, tirados da cena (som.json > "auto": true): cada som no quadro em que a coisa acontece
SONS = {'papel': 'foley/foley-paper-touch.wav', 'deslizar': 'foley/foley-paper-slide.wav', 'whoosh': 'whooshes/whoosh-slow-soft.wav',
        'whoosh_curto': 'whooshes/whoosh-medium-soft.wav', 'caneta': 'writing-and-drawing/writing-marker-draw.wav', 'risco': 'writing-and-drawing/writing-highlighter.wav',
        'impacto': 'impacts/impact-heavy-hard.wav', 'impacto_grave': 'impacts/impact-deep-hard.wav', 'relogio': 'time/time-clock.wav',
        'luz_apaga': 'mechanical/mechanical-switch-heavy.wav', 'luz_acende': 'mechanical/mechanical-switch-light.wav', 'riser': 'risers-and-fallers/riser-4s-soft.wav', 'boom': 'booms-and-bass/boom-drop-soft.wav'}
ATAQ = {'papel': 0.022, 'deslizar': 0.006, 'whoosh': 0.452, 'whoosh_curto': 0.229, 'impacto': 0.010, 'impacto_grave': 0.010, 'luz_apaga': 0.021, 'luz_acende': 0.010, 'riser': 3.945, 'boom': 0.019}
SONS.update({k: v for k, v in SOM.get('sons', {}).items() if isinstance(v, (str, dict))}); ATAQ.update(SOM.get('ataques', {}))
def toca(som, t, ataque=None, nivel=-28, pan=0.0, dur=None, fi=0.004, fo=0.03, nome=None):
    """som = um arquivo, ou um trecho de um arquivo do pack: {"som": arquivo, "de": início, "dur": duração, "ataque": s, "ganho": dB}."""
    if isinstance(som, dict):
        return efeito(som['som'], t, som.get('ataque', ATAQ.get(nome, 0.0) if ataque is None else ataque), nivel + som.get('ganho', 0), pan,
                      de=som.get('de', 0.0), dur=som.get('dur', dur), fi=som.get('fi', fi), fo=som.get('fo', fo))
    return efeito(som, t, ATAQ.get(nome, 0.0) if ataque is None else ataque, nivel, pan, dur=dur, fi=fi, fo=fo)
def auto_efeitos():
    ev = []; objs = DADOS.get('objetos', []); lug = DADOS.get('lugares', {})
    dest = sorted([(o['tempos'][0] if o.get('tipo') == 'ano' else o['t'], o) for o in objs], key=lambda x: x[0])
    for i, (t, o) in enumerate(dest):
        if o.get('tipo') != 'ano':
            if o.get('entra') == 'desliza': ev.append(('deslizar', t - 0.1, -31, 0.2))
            else: ev.append(('papel', t, -27, 0.1 if i % 2 else -0.1))
            if o.get('circulo'): ev.append(('caneta', o['circulo']['t'], -27, 0.05, 0.55))
            if o.get('riscar'): ev.append(('risco', o['riscar'], -28, 0.05))
            if o.get('carimbo'): ev += [('impacto', o['carimbo']['t'], -24, 0), ('impacto_grave', o['carimbo']['t'], -34, 0)]
        if i + 1 < len(dest):
            t2, o2 = dest[i + 1]
            if o2.get('lugar') != o.get('lugar') and o2.get('lugar') in lug and o.get('lugar') in lug:
                a, b = lug[o['lugar']], lug[o2['lugar']]; d = ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5
                ev.append(('whoosh' if d > 8 else 'whoosh_curto', t2 - 0.55, -27 if d > 8 else -31, -0.2 if i % 2 else 0.2))
    for e in DADOS.get('escuro', []):
        ev.append(('relogio', e.get('desde', e['de'] - 2.5), -30, 0, e['de'] - e.get('desde', e['de'] - 2.5)))
        ev.append(('luz_apaga', e['de'], -24, -0.1))
    for l in DADOS.get('luzes', []): ev.append(('luz_acende', l['t'], -24 if not ev or l is DADOS['luzes'][0] else -32, 0.3))
    F = DADOS.get('final')
    if F and F.get('tipo') == 'cabeca':
        T0 = F['t']; ev += [('whoosh', T0 + 0.35, -26, 0), ('whoosh', T0 + 4.55, -30, 0.3)]
        pens = F.get('pensamento', T0 + 7.9); ev += [('riser', pens, -34, 0), ('boom', pens, -32, 0)]
        for i in range(16):
            u = i / 15; ev.append(('papel', T0 + 0.1 + 1.35 * u ** 0.8 + rng.uniform(0, 0.08), -31 - 4 * u + rng.uniform(-2, 2), rng.uniform(-0.7, 0.7)))
    for nome, t, nivel, pan, *resto in ev:
        dur = resto[0] if resto else None
        toca(SONS[nome], t, None, nivel, pan, dur=dur, fi=(0.9 if nome == 'relogio' else 0.004), fo=(0.1 if dur else 0.03), nome=nome)
if SOM.get('auto'):
    auto_efeitos()
# efeitos pontuais
for e in SOM.get('efeitos', []):
    if e.get('chuva'):  # vários do mesmo som espalhados num trecho (ex.: as fotinhos caindo)
        for i in range(e['n']):
            u = i / max(1, e['n'] - 1)
            efeito(e['som'], e['de_t'] + (e['ate_t'] - e['de_t']) * u ** 0.8 + rng.uniform(0, 0.08), e.get('ataque', 0), e['nivel'] - 4 * u + rng.uniform(-2, 2), rng.uniform(-0.7, 0.7))
    else:
        efeito(**e)
# teclas: uma por letra datilografada (tempos de dados.js)
tec = SOM.get('teclas', {}); sons = tec.get('sons', [])
def datilografa(segs, nivel, pan=0.1):
    i = 0
    for t0, t1, s in segs:
        letras = s.replace('\n', '')
        for j, ch in enumerate(letras):
            if ch != ' ': toca(sons[i % len(sons)], t0 + j * (t1 - t0) / len(letras), tec.get('ataque', 0.009), nivel + rng.uniform(-2, 1.5), pan + rng.uniform(-0.08, 0.08), fi=0.002, fo=0.02); i += 1
if sons:
    for segs in DADOS.get('tipos', {}).values(): datilografa(segs, tec.get('nivel', -29))
    if VERT and 'cta' in DADOS:
        C = DADOS['cta']; txt = C['texto'].replace('\n', ''); datilografa([[C['t0'], C['t0'] + len(txt) * C['passo'], txt]], tec.get('nivel', -29) - 1)
        teclas_t = C.get('teclas') or [C['comenta'] + 0.35 + 0.22 * i for i in range(len(C.get('palavra', '')))]
        for k, t in enumerate(teclas_t): toca(sons[k % len(sons)], t + 0.08, tec.get('ataque', 0.009), tec.get('nivel', -29) + 6, (k - 1) * 0.3, fi=0.002, fo=0.02)

mix += mus + sfx
mix *= np.clip((FIM - np.arange(N) / SR) / (0.6 if VERT else 0.33), 0, 1)[:, None]
pk = np.abs(mix).max()
if pk > 0.98: mix *= 0.98 / pk
os.makedirs(os.path.join(P, 'som'), exist_ok=True)
saida = os.path.join(P, 'som', 'mix-9x16.wav' if VERT else 'mix.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_f32le', saida], input=mix.astype(np.float32).tobytes(), check=True)
print('ok', saida, round(N / SR, 3), 's')
