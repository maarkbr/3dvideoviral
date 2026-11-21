#!/usr/bin/env python3
"""O ciclo de conferência do estilo Colagem: mede o vídeo final, ouve se cada palavra se entende, mede se a imagem
tem o ritmo das referências e tira os quadros para olhar pela régua. Cada problema sai com o conserto.
uso: python conferir.py <pasta do vídeo> <vídeo final.mp4>
grava <pasta>/work/conferencia/RELATORIO.md, folha.jpg (1 quadro a cada 0,5 s) e entradas.jpg (cada peça logo depois de entrar)."""
import difflib, json, os, re, subprocess, sys, unicodedata
import numpy as np
P = os.path.abspath(sys.argv[1]); V = os.path.abspath(sys.argv[2])
OUT = os.path.join(P, 'work', 'conferencia'); os.makedirs(OUT, exist_ok=True)
def le_js(p): return json.loads(re.sub(r'^window\.\w+\s*=\s*|;\s*$', '', open(p, encoding='utf-8').read().strip()))
def run(*a): return subprocess.run(a, capture_output=True, text=True)
erros, avisos, ok = [], [], []
C = le_js(os.path.join(P, 'cena.js')); FIM = C['cta']['fim'] if C.get('cta') else C['dur']

# 1) formato e duração
pr = json.loads(run('ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate:format=duration', '-of', 'json', V).stdout)
vs = [s for s in pr['streams'] if s['codec_type'] == 'video'][0]; tem_audio = any(s['codec_type'] == 'audio' for s in pr['streams'])
dur = float(pr['format']['duration']); W, H = vs['width'], vs['height']
(ok if (W, H) == (1080, 1920) else erros).append(f'tamanho {W}x{H}' + ('' if (W, H) == (1080, 1920) else ' (esperado 1080x1920)'))
fps = eval(vs['r_frame_rate']); (ok if abs(fps - 30) < 0.01 else erros).append(f'{fps:.0f} fps' + ('' if abs(fps - 30) < 0.01 else ' (gere com --fps 30)'))
if not tem_audio: erros.append('o vídeo não tem som (rode mixar.py e finalizar.py)')
(ok if abs(dur - FIM) < 0.15 else erros).append(f'duração {dur:.2f} s' + ('' if abs(dur - FIM) < 0.15 else f' (a cena diz {FIM} s: gere o vídeo de novo depois de mudar a cena)'))

# 2) volume
m = run('ffmpeg', '-nostats', '-hide_banner', '-i', V, '-af', 'ebur128=peak=true', '-f', 'null', '-').stderr
I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', m)[-1]); pk = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', m)[-1])
(ok if -15 <= I <= -13 else erros).append(f'volume {I} LUFS' + ('' if -15 <= I <= -13 else ' (o padrão é -14: rode o finalizar.py)'))
(ok if pk <= -0.9 else erros).append(f'pico {pk} dBFS' + ('' if pk <= -0.9 else ' (estoura: rode o finalizar.py)'))

# 3) ritmo, medido como nas referências: diferença entre cada quadro e o anterior, no meio da tela
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', V, '-an', '-vf', 'scale=135:240,crop=135:160:0:40,format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
q = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 160, 135).astype(np.float32)
d = np.abs(np.diff(q, axis=0)).mean(axis=(1, 2)); t = np.arange(1, len(q)) / 30.0
cortes = int(((d > 12) & (d > 4 * (np.r_[0, d[:-1]] + 0.3))).sum())
mov = d > 0.6; ev = int((mov[1:] & ~mov[:-1]).sum()) + int(mov[0])
parado = float((d < 0.15).mean())
seg = dur
(ok if seg / max(1, ev) <= 1.6 else avisos).append(f'algo novo se mexe a cada {seg / max(1, ev):.1f} s (referências: ~1,1 s)' + ('' if seg / max(1, ev) <= 1.6 else ': ponha mais peças entrando (etiqueta, seta, número)'))
(ok if parado <= 0.35 else avisos if parado <= 0.6 else erros).append(f'{parado:.0%} dos quadros parados (referências: 6% a 31%)' + ('' if parado <= 0.35 else ': a câmera precisa empurrar ("empurra") ou faltam entradas'))
# cortes vistos na imagem (o mesmo critério do conferidor de vídeo: mudança de cena acima de 0,35)
sc = run('ffmpeg', '-hide_banner', '-i', V, '-an', '-vf', "select='gt(scene,0.35)',showinfo", '-f', 'null', '-').stderr
salto = [float(t[i]) for i in range(len(d)) if d[i] > 12 and d[i] > 4 * ((d[i - 1] if i else 0) + 0.3)]   # troca seca entre cenas de cor parecida (mapa → mapa)
vistos = sorted(set(round(x, 1) for x in [float(x) for x in re.findall(r'pts_time:([\d.]+)', sc)] + salto))
tc = [0.0] + vistos + [dur]
maior = max(b - a for a, b in zip(tc, tc[1:]))
ok.append(f'{len(tc) - 2} cortes de cena (troca forte de imagem ou salto seco; referências: 1 a cada ~3 s)')
(ok if maior <= 5.0 else avisos if maior <= 6.0 else erros).append(f'o maior trecho sem corte visível tem {maior:.1f} s' + ('' if maior <= 5.0 else ': nas referências é até ~4 s; ponha um corte (cena nova, ou o mesmo mapa já com zoom, que vira corte)'))
# tela preta
bd = run('ffmpeg', '-hide_banner', '-i', V, '-vf', 'blackdetect=d=0.08:pix_th=0.06', '-an', '-f', 'null', '-').stderr
pretos = [(float(a), float(b)) for a, b in re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', bd)]
if pretos and C.get('fundo') != 'escuro': erros.append('tela preta em ' + ', '.join(f'{a:.2f}–{b:.2f} s' for a, b in pretos) + ' (cena sem fundo ou foto que não carregou)')

# 4) a fala: cada palavra se entende?
falas = []
if os.path.exists(os.path.join(P, 'roteiro.json')): falas = [b['fala'] for b in json.load(open(os.path.join(P, 'roteiro.json'), encoding='utf-8'))['blocos']]
UN = "zero um dois tres quatro cinco seis sete oito nove dez onze doze treze quatorze quinze dezesseis dezessete dezoito dezenove".split()
DZ = "_ _ vinte trinta quarenta cinquenta sessenta setenta oitenta noventa".split()
CT = "_ cento duzentos trezentos quatrocentos quinhentos seiscentos setecentos oitocentos novecentos".split()
def extenso(n):
    if n < 20: return UN[n]
    if n < 100: return DZ[n // 10] + ("" if n % 10 == 0 else " e " + UN[n % 10])
    if n == 100: return "cem"
    if n < 1000: return CT[n // 100] + ("" if n % 100 == 0 else " e " + extenso(n % 100))
    if n < 1000000:
        mm, r = divmod(n, 1000); txt = "mil" if mm == 1 else extenso(mm) + " mil"
        return txt if r == 0 else txt + (" e " if r < 100 or r % 100 == 0 else " ") + extenso(r)
    return str(n)
def norm(tx):
    tx = unicodedata.normalize('NFKD', tx.lower()); tx = ''.join(ch for ch in tx if not unicodedata.combining(ch))
    tx = re.sub(r'(\d)[.\s](\d{3})\b', r'\1\2', tx); tx = re.sub(r'\d+', lambda mm: ' ' + extenso(int(mm.group())) + ' ', tx)
    return re.findall(r'[a-z]+', tx)
if falas:
    try:
        from faster_whisper import WhisperModel
        a = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', V, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout, dtype=np.float32)
        raras = []
        for w in re.findall(r"[\wÀ-ÿ'-]+", ' '.join(falas)):
            if (w[:1].isupper() or len(w) >= 10) and w.lower() not in [r.lower() for r in raras]: raras.append(w)
        segs, _ = WhisperModel('medium', compute_type='int8').transcribe(a, language='pt', initial_prompt=', '.join(raras)[:240] or None, word_timestamps=True, vad_filter=True)
        segs = list(segs); ouvido = ' '.join(s.text.strip() for s in segs); open(os.path.join(OUT, 'ouvido.txt'), 'w', encoding='utf-8').write(ouvido)
        A, B = norm(' '.join(falas)), norm(ouvido); dif = []
        for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, A, B, autojunk=False).get_opcodes():
            if op != 'equal': dif.append((' '.join(A[i1:i2]) or '—', ' '.join(B[j1:j2]) or '—'))
        for esp, ouv in dif: erros.append(f'fala: o roteiro diz "{esp}", o vídeo soa "{ouv}" → nome estrangeiro: escreva a pronúncia em voz/bN.tts.txt; palavra comum: gere a fala de novo')
        if not dif: ok.append(f'a fala bate com o roteiro ({len(A)} palavras)')
        ult = max((w.end for s in segs for w in (s.words or [])), default=0)
        if ult and C['dur'] - ult < 0.4: avisos.append(f'a última palavra termina em {ult:.2f} s e a fala da cena em {C["dur"]} s: deixe ~0,6 s antes do fim/CTA')
    except ImportError: avisos.append('sem o faster-whisper não dá para ouvir a fala: instale e rode de novo')

# 5) quadros para olhar
run('ffmpeg', '-v', 'error', '-y', '-i', V, '-vf', 'fps=2,scale=150:-2,tile=10x4:padding=3', '-frames:v', '1', os.path.join(OUT, 'folha.jpg'))
ts = sorted({round(o.get('t', c['t']) + 0.45, 2) for c in C.get('cenas', []) for o in c.get('objetos', [])})
if C.get('cta'): ts.append(round(C['cta']['t'] + 1.4, 2))
if ts:
    from PIL import Image
    ims = []
    for k, tt in enumerate(ts):
        f = os.path.join(OUT, f'_e{k}.png'); run('ffmpeg', '-v', 'error', '-y', '-ss', f'{min(tt, dur - 0.05):.2f}', '-i', V, '-frames:v', '1', '-vf', 'scale=300:-2', f)
        if os.path.exists(f): ims.append(Image.open(f).convert('RGB')); os.remove(f)
    if ims:
        cols = min(6, len(ims)); rows = (len(ims) + cols - 1) // cols; w, h = ims[0].size
        fo = Image.new('RGB', (cols * (w + 6), rows * (h + 6)), (20, 20, 20))
        for k, im in enumerate(ims): fo.paste(im, ((k % cols) * (w + 6), (k // cols) * (h + 6)))
        fo.save(os.path.join(OUT, 'entradas.jpg'), quality=85)

ver = 'APROVADO' if not erros else 'CONSERTAR'
rel = [f'# Conferência · {os.path.basename(V)}', '', '## Medido', *[f'- ok: {x}' for x in ok], *[f'- PROBLEMA: {x}' for x in erros], *[f'- aviso: {x}' for x in avisos], '',
       '## Agora olhe (o script não vê isto)', '- `work/conferencia/entradas.jpg` (cada peça logo depois de entrar) e `folha.jpg` (2 quadros por segundo).',
       '- Passe pela `references/regua.md` item por item.', '', f'## Veredito\n{ver}']
open(os.path.join(OUT, 'RELATORIO.md'), 'w', encoding='utf-8').write('\n'.join(rel) + '\n')
print('\n'.join(rel)); sys.exit(0 if ver == 'APROVADO' else 1)
