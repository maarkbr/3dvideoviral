#!/usr/bin/env python3
"""O ciclo de conferência do estilo Documentário: mede o vídeo final, ouve se cada palavra se entende e tira os quadros
para conferir pela régua. Cada problema sai com o conserto. Repita (consertar → gerar → conferir) até APROVADO.
uso: python conferir.py <pasta do vídeo> <vídeo final.mp4> [--formato 16x9|9x16] [--longo]
grava <pasta>/work/conferencia/RELATORIO.md, folha.jpg (1 quadro por segundo) e destaques.jpg (cada destaque na palavra)."""
import difflib, json, os, re, subprocess, sys, unicodedata
import numpy as np

P = os.path.abspath(sys.argv[1]); V = os.path.abspath(sys.argv[2]); arg = sys.argv[3:]
FMT = arg[arg.index('--formato') + 1] if '--formato' in arg else '16x9'; LONGO = '--longo' in arg
OUT = os.path.join(P, 'work', 'conferencia'); os.makedirs(OUT, exist_ok=True)
def le_js(p): return json.loads(re.sub(r'^window\.\w+\s*=\s*|;\s*$', '', open(p, encoding='utf-8').read().strip()))
def run(*a): return subprocess.run(a, capture_output=True, text=True)
erros, avisos, ok = [], [], []

# 1) formato e duração
pr = json.loads(run('ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate:format=duration', '-of', 'json', V).stdout)
vs = [s for s in pr['streams'] if s['codec_type'] == 'video'][0]; tem_audio = any(s['codec_type'] == 'audio' for s in pr['streams'])
dur = float(pr['format']['duration']); W, H = vs['width'], vs['height']; esperado = (1080, 1920) if FMT == '9x16' else (1920, 1080)
(ok if (W, H) == esperado else erros).append(f'tamanho {W}x{H}' + ('' if (W, H) == esperado else f' (esperado {esperado[0]}x{esperado[1]}: gere de novo no formato certo)'))
fps = eval(vs['r_frame_rate']); (ok if abs(fps - 30) < 0.01 else erros).append(f'{fps:.0f} fps' + ('' if abs(fps - 30) < 0.01 else ' (gere com --fps 30)'))
if not tem_audio: erros.append('o vídeo não tem som (rode mixar.py e finalizar.py)')
cena = le_js(os.path.join(P, 'cena.js')) if os.path.exists(os.path.join(P, 'cena.js')) else None
if cena and not LONGO:
    alvo = cena.get('cta', {}).get('fim', cena['dur']) if FMT == '9x16' else cena['dur']
    (ok if abs(dur - alvo) < 0.15 else erros).append(f'duração {dur:.2f} s' + ('' if abs(dur - alvo) < 0.15 else f' (a cena diz {alvo} s: gere o vídeo de novo depois de mudar a cena)'))

# 2) volume
m = run('ffmpeg', '-nostats', '-hide_banner', '-i', V, '-af', 'ebur128=peak=true', '-f', 'null', '-').stderr
I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', m)[-1]); pk = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', m)[-1])
(ok if -15 <= I <= -13 else erros).append(f'volume {I} LUFS' + ('' if -15 <= I <= -13 else ' (o padrão é -14: rode o finalizar.py)'))
(ok if pk <= -0.9 else erros).append(f'pico {pk} dBFS' + ('' if pk <= -0.9 else ' (estoura: rode o finalizar.py, que limita em -1)'))

# 3) tela preta fora da abertura e do fecho
bd = run('ffmpeg', '-hide_banner', '-i', V, '-vf', 'blackdetect=d=0.08:pix_th=0.06', '-an', '-f', 'null', '-').stderr
pretos = [(float(a), float(b)) for a, b in re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', bd)]
fim_doc = dur
if cena and not LONGO and FMT == '9x16' and cena.get('cta'): fim_doc = min(dur, cena['dur'])   # o "Comenta" do fim é de propósito sobre o escuro
apagoes = []   # o apagão declarado na cena ("escuro") é de propósito: só avisa se o breu total durar demais
if cena and not LONGO:
    for e in cena.get('escuro', []):
        luz = min([l['t'] for l in cena.get('luzes', []) if l['t'] >= e['de'] - 0.05] or [e.get('ate', e['de'])])
        apagoes.append((e['de'] - 0.15, luz + 0.25))
meio = []
for a, b in pretos:
    if a <= 0.9 or b >= fim_doc - 0.6: continue
    if any(x <= a and b <= y for x, y in apagoes):
        if b - a > 0.4: avisos.append(f'apagão de {b - a:.2f} s no breu total ({a:.2f}–{b:.2f} s): no celular parece defeito; acenda a luminária até ~0,3 s depois do apagão ("luzes": t)')
        continue
    meio.append((a, b))
if meio: erros.append('tela preta no meio: ' + ', '.join(f'{a:.2f}–{b:.2f} s' for a, b in meio) + ' (num vídeo longo, ponha "abre": false / "fecha": false nos capítulos do meio; senão, um objeto ou luz faltando: veja o quadro)')
else: ok.append('sem tela preta no meio')

# 4) folga no fim e 5) a fala: cada palavra se entende?
falas = []
if os.path.exists(os.path.join(P, 'roteiro.json')): falas = [b['fala'] for b in json.load(open(os.path.join(P, 'roteiro.json'), encoding='utf-8'))['blocos']]
if LONGO:
    falas = []
    for c in sorted(os.listdir(os.path.join(P, 'capitulos'))):
        rp = os.path.join(P, 'capitulos', c, 'roteiro.json')
        if os.path.exists(rp): falas += [b['fala'] for b in json.load(open(rp, encoding='utf-8'))['blocos']]
UN = "zero um dois tres quatro cinco seis sete oito nove dez onze doze treze quatorze quinze dezesseis dezessete dezoito dezenove".split()
DZ = "_ _ vinte trinta quarenta cinquenta sessenta setenta oitenta noventa".split()
CT = "_ cento duzentos trezentos quatrocentos quinhentos seiscentos setecentos oitocentos novecentos".split()
def extenso(n):   # o Whisper escreve "73" e "1.500"; o roteiro, por extenso
    if n < 20: return UN[n]
    if n < 100: return DZ[n // 10] + ("" if n % 10 == 0 else " e " + UN[n % 10])
    if n == 100: return "cem"
    if n < 1000: return CT[n // 100] + ("" if n % 100 == 0 else " e " + extenso(n % 100))
    if n < 1000000:
        m, r = divmod(n, 1000); txt = "mil" if m == 1 else extenso(m) + " mil"
        return txt if r == 0 else txt + (" e " if r < 100 or r % 100 == 0 else " ") + extenso(r)
    return str(n)
def norm(t):
    t = unicodedata.normalize('NFKD', t.lower()); t = ''.join(ch for ch in t if not unicodedata.combining(ch))
    t = re.sub(r'(\d)[.\s](\d{3})\b', r'\1\2', t)
    t = re.sub(r'\d+', lambda m: ' ' + extenso(int(m.group())) + ' ', t)
    ws = re.findall(r'[a-z]+', t)
    return [{'quinhentas': 'quinhentos', 'duzentas': 'duzentos', 'trezentas': 'trezentos', 'quatrocentas': 'quatrocentos', 'seiscentas': 'seiscentos', 'setecentas': 'setecentos', 'oitocentas': 'oitocentos', 'novecentas': 'novecentos', 'duas': 'dois', 'uma': 'um'}.get(w, w) for w in ws]
if falas:
    try:
        from faster_whisper import WhisperModel
        a = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', V, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout, dtype=np.float32)
        modelo = WhisperModel('medium', compute_type='int8')
        # a dica leva só nomes e palavras raras: o roteiro inteiro como dica faz o Whisper pular trechos num vídeo longo
        raras = []
        for w in re.findall(r"[\wÀ-ÿ'-]+", ' '.join(falas)):
            if (w[:1].isupper() or len(w) >= 10) and w.lower() not in [r.lower() for r in raras]: raras.append(w)
        segs, _ = modelo.transcribe(a, language='pt', initial_prompt=', '.join(raras)[:240] or None, word_timestamps=True, vad_filter=True, condition_on_previous_text=False)
        segs = list(segs); ouvido = ' '.join(s.text.strip() for s in segs)
        open(os.path.join(OUT, 'ouvido.txt'), 'w', encoding='utf-8').write(ouvido)
        A, B = norm(' '.join(falas)), norm(ouvido); dif = []
        for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, A, B, autojunk=False).get_opcodes():
            if op != 'equal': dif.append((' '.join(A[i1:i2]) or '—', ' '.join(B[j1:j2]) or '—'))
        if dif:
            for esp, ouv in dif:
                erros.append(f'fala: o roteiro diz "{esp}", o vídeo soa "{ouv}" → se for nome estrangeiro, escreva a pronúncia no "tts" do bloco; se for palavra comum, a voz está rápida ou embolada: gere aquela fala de novo mais devagar (ou regrave)')
        else: ok.append(f'a fala bate com o roteiro ({len(A)} palavras)')
        ultima = max((w.end for s in segs for w in (s.words or [])), default=0)
        if ultima and dur - ultima < 0.45: avisos.append(f'a última palavra termina em {ultima:.2f} s e o vídeo em {dur:.2f} s: deixe ~0,8 s de fecho (aumente "dur" na cena)')
    except ImportError:
        avisos.append('sem o faster-whisper não dá para ouvir a fala: instale (pip install faster-whisper) e rode de novo')

# 6) quadros: a folha inteira e cada destaque, para olhar pela régua
lado = '320:-2' if FMT == '16x9' else '180:-2'
run('ffmpeg', '-v', 'error', '-y', '-i', V, '-vf', f'fps=1,scale={lado},tile={"6x5" if FMT == "16x9" else "10x3"}:padding=4', '-frames:v', '1', os.path.join(OUT, 'folha.jpg'))
if cena and not LONGO:
    ts = sorted((o['tempos'][-1] + 0.3) if o.get('tipo') == 'ano' else (o['circulo']['t'] + 0.6 if o.get('circulo') else o['t'] + 0.6) for o in cena.get('objetos', []))
    if ts:   # um quadro em cada destaque, numa folha
        from PIL import Image
        larg = 640 if FMT == '16x9' else 360; ims = []
        for k, t in enumerate(ts):
            f = os.path.join(OUT, f'_d{k}.png'); run('ffmpeg', '-v', 'error', '-y', '-ss', f'{min(t, dur - 0.05):.2f}', '-i', V, '-frames:v', '1', '-vf', f'scale={larg}:-2', f)
            if os.path.exists(f): ims.append(Image.open(f).convert('RGB')); os.remove(f)
        if ims:
            cols = min(4, len(ims)); rows = (len(ims) + cols - 1) // cols; w, h = ims[0].size
            folha = Image.new('RGB', (cols * (w + 6), rows * (h + 6)), (20, 20, 20))
            for k, im in enumerate(ims): folha.paste(im, ((k % cols) * (w + 6), (k // cols) * (h + 6)))
            folha.save(os.path.join(OUT, 'destaques.jpg'), quality=85)

ver = 'APROVADO' if not erros else 'CONSERTAR'
rel = [f'# Conferência · {os.path.basename(V)}', '', '## Medido', *[f'- ok: {x}' for x in ok], *[f'- PROBLEMA: {x}' for x in erros], *[f'- aviso: {x}' for x in avisos], '',
       '## Agora olhe (o script não vê isto)', f'- `work/conferencia/destaques.jpg`: cada destaque no instante da palavra. `work/conferencia/folha.jpg`: um quadro por segundo.',
       '- Passe pela `references/regua.md`: destaque grande e no centro, um por vez, nada atrás dele; ano inteiro e legível; nada cortado na borda (no 9:16, entre 14% e 84% da altura); letra legível no celular; luz de luminária, nada chapado; viagem que não vira borrão.',
       '- Para cada problema: conserte na cena.js (ou no som.json / na voz), gere de novo e rode esta conferência outra vez.', '', f'## Veredito\n{ver}']
open(os.path.join(OUT, 'RELATORIO.md'), 'w', encoding='utf-8').write('\n'.join(rel) + '\n')
print('\n'.join(rel)); sys.exit(0 if ver == 'APROVADO' else 1)
