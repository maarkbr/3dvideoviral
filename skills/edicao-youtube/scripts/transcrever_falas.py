"""Transcrição para DECUPAGEM: corta o áudio em falas (pelo volume, em cada pausa) e transcreve cada fala SOZINHA.

Por quê: o Whisper, transcrevendo o arquivo inteiro, "limpa" a fala — junta tentativas repetidas numa só, some com
falsos começos ("então aqui você vai… então aqui você vai ver") e espalha o tempo de uma palavra por cima da pausa.
Aí o corte não vê o retake (e ainda guarda o áudio "não transcrito" achando que é palavra perdida). Transcrevendo
fala por fala, cada tentativa vira texto próprio, com tempo certo, e o detector de retakes (decupar.py) enxerga.

uso: python3 transcrever_falas.py <vídeo/áudio> <saida.json> [--modelo small] [--modelos <cache>] [--prompt "nomes"] [--limiar -45] [--quebras emendas.json]
saída (mesmo formato do transcrever.py, + falas):
  {fonte, modelo, motor:"whisper-falas", limiar_db, words:[{i,text,start,end,prob,fala}], segments:[...],
   falas:[{k,start,end,i0,i1,text}]}
Também grava <saida>.db10ms.npy (envelope a cada 10 ms) para não decodificar de novo.
"""
import json, os, re, subprocess, sys, time
import numpy as np

arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d  # noqa: E731
src, out = sys.argv[1], sys.argv[2]
SR, HOP = 16000, 160
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vn", "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                     capture_output=True, check=True).stdout
audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
n = len(audio) // HOP
db = 20 * np.log10(np.sqrt((audio[: n * HOP].reshape(n, HOP) ** 2).mean(1)) + 1e-9)
np.save(out + ".db10ms.npy", db)


def runs(m):
    d = np.diff(np.concatenate([[0], m.astype(np.int8), [0]]))
    return list(zip(np.where(d == 1)[0], np.where(d == -1)[0]))


def otsu(x):
    h, e = np.histogram(x, bins=120)
    c = (e[:-1] + e[1:]) / 2
    w = np.cumsum(h); m = np.cumsum(h * c); tot = m[-1]
    best, thr = -1, c[len(c) // 2]
    for i in range(1, len(c) - 1):
        w0, w1 = w[i], w[-1] - w[i]
        if w0 == 0 or w1 == 0:
            continue
        v = w0 * w1 * (m[i] / w0 - (tot - m[i]) / w1) ** 2
        if v > best:
            best, thr = v, c[i]
    return float(thr)


real = db > -100                                   # fora o silêncio digital (o OBS grava zeros)
suave = np.convolve(db, np.ones(5) / 5, mode="same")
ruido = float(np.percentile(db[real], 10))
limiar = otsu(suave[real])
limiar = min(max(limiar, ruido + 6), -30.0)
if arg("--limiar"):                                # conferência: usa o limiar do bruto (áudio cortado quase não tem silêncio)
    limiar = float(arg("--limiar"))
fala = suave > limiar
for a, b in runs(~fala):                           # buraco de consoante / respiro curto não separa fala
    if b - a < 25:
        fala[a:b] = True
if arg("--quebras"):                               # conferência: quebra também em cada emenda do corte
    for t in json.load(open(arg("--quebras"))):
        k = int(round(t * 100))
        if 0 < k < n - 1:
            fala[k] = False
for a, b in runs(fala):                            # estalo não é fala
    if b - a < 10:
        fala[a:b] = False
# falas = trechos de fala separados por pausa >= 0,15 s (já garantido acima); bordas com folga de 0,12 s
R = runs(fala)
falas = []
for k, (a, b) in enumerate(R):
    a2 = max(a - 12, (R[k - 1][1] + a) // 2 if k else 0)
    b2 = min(b + 12, (b + R[k + 1][0]) // 2 if k + 1 < len(R) else n)
    falas.append([a2, b2])


def dividir(a, b):                                 # fala > 24 s: parte no ponto mais quieto do meio
    if b - a <= 2400:
        return [(a, b)]
    m0, m1 = a + (b - a) // 4, b - (b - a) // 4
    c = m0 + int(np.argmin(suave[m0:m1]))
    return dividir(a, c) + dividir(c, b)


pedacos = [p for a, b in falas for p in dividir(a, b)]
print(f"áudio {len(audio) / SR / 60:.1f} min · ruído {ruido:.1f} dB · limiar {limiar:.1f} dB · {len(pedacos)} falas", flush=True)

from faster_whisper import WhisperModel  # noqa: E402

models = arg("--modelos", os.environ.get("CORTES_MODELOS", os.path.expanduser("~/.cache/edicao-youtube/whisper")))  # ~460 MB na 1ª vez
model = WhisperModel(arg("--modelo", "small"), device="cpu", compute_type="int8", download_root=models)
words, segs, fl = [], [], []
PROMPT_T = {re.sub(r"\W+", "", t.lower()) for t in re.split(r"[,\s]+", arg("--prompt", "") or "") if len(t) > 1}
t_ini = time.time()
so_pont = re.compile(r"^[\W_]+$")
for k, (a, b) in enumerate(pedacos):
    s0 = a / 100
    ch = audio[a * HOP: b * HOP]
    if len(ch) < SR * 0.25:
        continue
    def ouvir(prompt):
        r, _ = model.transcribe(ch, language="pt", word_timestamps=True, beam_size=5, condition_on_previous_text=False,
                                initial_prompt=prompt, vad_filter=False, no_speech_threshold=0.6)
        r = list(r)
        t = [re.sub(r"\W+", "", w.word.lower()) for s in r for w in (s.words or [])]
        t = [x for x in t if x]
        return r, bool(PROMPT_T and t and sum(x in PROMPT_T for x in t) >= max(2, 0.5 * len(t)))
    i0 = len(words)
    # eco do --prompt: em som curto (clique, respiro) o Whisper "lê" a lista de nomes do prompt. Mas fala que começa no
    # meio de uma palavra também sai como eco ("Higgsfield, Higgsfield, Claude" no lugar de "…ficiais dentro para a
    # criação de vídeo"): jogar fora apagava fala de verdade. Então ouve de novo sem o prompt; só sai se ainda for eco.
    res, eco = ouvir(arg("--prompt"))
    if eco:
        res, eco = ouvir(None)
        if eco or not res:
            continue
    for s in res:
        if s.no_speech_prob > 0.75 and s.avg_logprob < -1.0:
            continue
        for w in s.words or []:
            t = w.word.strip()
            if not t or so_pont.match(t):
                continue
            words.append({"i": len(words), "text": t, "start": round(s0 + max(0.0, w.start), 3),
                          "end": round(min(b / 100, s0 + w.end), 3), "prob": round(w.probability, 3), "fala": len(fl)})
    if len(words) > i0:
        txt = " ".join(w["text"] for w in words[i0:])
        fl.append({"k": len(fl), "start": round(s0, 3), "end": round(b / 100, 3), "i0": i0, "i1": len(words) - 1, "text": txt})
        segs.append({"start": words[i0]["start"], "end": words[-1]["end"], "text": txt, "words": list(range(i0, len(words)))})
        m, sec = divmod(s0, 60)
        print(f"[{int(m):02d}:{sec:05.2f}] {txt}", flush=True)
json.dump({"fonte": os.path.abspath(src), "offset": 0.0, "modelo": arg("--modelo", "small"), "motor": "whisper-falas",
           "limiar_db": round(limiar, 1), "ruido_db": round(ruido, 1), "words": words, "segments": segs, "falas": fl},
          open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"\n{len(words)} palavras · {len(fl)} falas · {time.time() - t_ini:.0f} s -> {out}")
