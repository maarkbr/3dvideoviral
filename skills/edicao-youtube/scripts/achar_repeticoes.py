"""Acha repetição CURTA de fala ("o o", "que que", "pra pra", "e a a", "escolhido, escolhido") no áudio JÁ CORTADO — o Whisper
limpa isso por natureza.

Três sinais, juntos:
  A. acústico: MFCC + DTW entre cada palavra (ou par de palavras) de 0,12–0,9 s e o trecho de mesmo tamanho logo depois;
     par muito parecido em sequência = repetição, mesmo que a transcrição mostre uma palavra só;
  B. palavra longa demais para o tamanho dela (duas fundidas): compara as metades / o começo com o resto;
  C. transcrição literal (medium, temperature 0, initial_prompt cheio de hesitações): toda palavra dobrada que a passada normal
     não tem é suspeita.
O limiar é calibrado no próprio arquivo: positivos = pares de repetição conhecidos do BRUTO (--positivos "a0-a1:b0-b1,…" em
segundos do bruto), negativos = pares vizinhos de palavras diferentes. Saída: trabalho/repeticoes.md e .json (tempo na edição e
no bruto). Rode depois do aparar_emendas.py; repita até não achar nada.
uso: python achar_repeticoes.py PASTA_TRABALHO [--limiar 1.85] [--positivos "414.08-414.80:415.22-415.95"] [--modelo medium]
"""
import json, os, re, subprocess, sys, unicodedata
import numpy as np
from scipy.fft import dct
from scipy.signal import get_window

T = os.path.abspath(sys.argv[1]); V = os.path.dirname(T); arg = sys.argv[2:]
MODELO = arg[arg.index("--modelo") + 1] if "--modelo" in arg else "medium"
POS = arg[arg.index("--positivos") + 1] if "--positivos" in arg else ""
LIM_FIXO = float(arg[arg.index("--limiar") + 1]) if "--limiar" in arg else None
SR = 16000
job = json.load(open(os.path.join(T, "job.json"))); E = json.load(open(os.path.join(T, "edl.json"))); fps = E["fps"]
bruto = job["video"] if os.path.isabs(job["video"]) else os.path.join(V, job["video"])
a = np.frombuffer(subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", bruto, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                                 capture_output=True, check=True).stdout, np.int16).astype(np.float32) / 32768
voz = np.concatenate([a[int(c["src0"] / fps * SR):int(c["src1"] / fps * SR)] for c in E["clips"]])
def tl2src(t):
    acc = 0
    for c in E["clips"]:
        d = (c["src1"] - c["src0"]) / fps
        if t <= acc + d: return round(c["src0"] / fps + (t - acc), 2)
        acc += d
norm = lambda s: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode())

# ---- MFCC (25 ms / 10 ms, 26 filtros mel, 13 coef. sem o c0) + DTW normalizado
NFFT, HOP, WIN = 512, 160, 400
def _mel(n=26):
    hz = lambda m: 700 * (10 ** (m / 2595) - 1); mel = lambda f: 2595 * np.log10(1 + f / 700)
    pts = hz(np.linspace(mel(80), mel(7600), n + 2)); b = np.floor((NFFT + 1) * pts / SR).astype(int)
    fb = np.zeros((n, NFFT // 2 + 1))
    for i in range(1, n + 1):
        fb[i - 1, b[i - 1]:b[i]] = (np.arange(b[i - 1], b[i]) - b[i - 1]) / max(1, b[i] - b[i - 1])
        fb[i - 1, b[i]:b[i + 1]] = (b[i + 1] - np.arange(b[i], b[i + 1])) / max(1, b[i + 1] - b[i])
    return fb
FB = _mel(); JAN = get_window("hamming", WIN)
def mfcc(x):
    if len(x) < WIN: x = np.pad(x, (0, WIN - len(x)))
    n = 1 + (len(x) - WIN) // HOP
    fr = np.stack([x[i * HOP:i * HOP + WIN] * JAN for i in range(n)])
    p = np.abs(np.fft.rfft(fr, NFFT)) ** 2
    m = dct(np.log(p @ FB.T + 1e-10), type=2, axis=1, norm="ortho")[:, 1:14]
    return (m - m.mean(0)) / (m.std(0) + 1e-6)
def dtw(A, B):
    n, m = len(A), len(B); D = np.full((n + 1, m + 1), np.inf); D[0, 0] = 0
    C = np.sqrt(((A[:, None, :] - B[None, :, :]) ** 2).sum(-1))
    for i in range(1, n + 1):
        for j in range(max(1, i - int(0.5 * n) - 3), min(m, i + int(0.5 * m) + 3) + 1):
            D[i, j] = C[i - 1, j - 1] + min(D[i - 1, j], D[i, j - 1], D[i - 1, j - 1])
    return D[n, m] / (n + m)
def fala(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9) > -38
def dist(sig, a0, a1, b0, b1):
    x, y = sig[int(a0 * SR):int(a1 * SR)], sig[int(b0 * SR):int(b1 * SR)]
    if len(x) < 0.08 * SR or len(y) < 0.08 * SR or not (fala(x) and fala(y)): return None
    return dtw(mfcc(x), mfcc(y))

# ---- transcrições (normal e literal)
from faster_whisper import WhisperModel
m = WhisperModel(MODELO, device="cpu", compute_type="int8", download_root=os.path.expanduser("~/.cache/edicao-youtube/whisper"))
def trans(prompt):
    segs, _ = m.transcribe(voz, language="pt", temperature=0, word_timestamps=True, condition_on_previous_text=False,
                           vad_filter=False, beam_size=5, initial_prompt=prompt)
    return [{"w": w.word.strip(), "n": norm(w.word), "s": float(w.start), "e": float(w.end)} for s in segs for w in s.words if norm(w.word)]
cache = os.path.join(T, f"rep_{MODELO}.json")
if os.path.exists(cache) and os.path.getmtime(cache) > os.path.getmtime(os.path.join(T, "edl.json")):
    W, WL = json.load(open(cache))
else:
    W = trans(None); WL = []
    json.dump([W, WL], open(cache, "w"), ensure_ascii=False)

# ---- calibração do limiar
pos = []
for par in [p for p in POS.split(",") if p]:
    (a0, a1), (b0, b1) = [tuple(map(float, x.split("-"))) for x in par.split(":")]
    d = dist(a, a0, a1, b0, b1)
    if d is not None: pos.append(d)
neg = []
for i in range(0, len(W) - 1, 3):
    w1, w2 = W[i], W[i + 1]
    if w1["n"] != w2["n"] and 0.15 <= w1["e"] - w1["s"] <= 0.8 and 0.15 <= w2["e"] - w2["s"] <= 0.8:
        d = dist(voz, w1["s"], w1["e"], w2["s"], w2["e"])
        if d is not None: neg.append(d)
neg = np.array(neg)
lim = float(np.percentile(neg, 2)) if len(neg) else 0.9
if pos: lim = min(lim, max(pos) * 1.15) if max(pos) < np.percentile(neg, 5) else (max(pos) + np.percentile(neg, 2)) / 2
if LIM_FIXO: lim = LIM_FIXO
LITERAL = "é, é, então, então, o o, que que, pra pra, de de, a a, e e, você você, as as, ahn, tipo assim, né, tá, eu eu, isso isso."
def confirma(t0):
    """transcrição LITERAL só da janela (±1,2 s): tem palavra dobrada em sequência?"""
    j0, j1 = max(0, int((t0 - 1.2) * SR)), int((t0 + 1.6) * SR)
    sg, _ = m.transcribe(voz[j0:j1], language="pt", temperature=0, word_timestamps=True, condition_on_previous_text=False,
                         vad_filter=False, initial_prompt=LITERAL)
    pw = [x.word.strip() for q in sg for x in q.words]; nn = [norm(x) for x in pw]
    # laço do Whisper (o prompt de hesitação faz ele repetir "é, é, é…" 100 vezes): 4+ iguais seguidas = alucinação, não confirma
    if any(nn[k] and nn[k] == nn[k + 1] == nn[k + 2] == nn[k + 3] for k in range(len(nn) - 3)): return False, " ".join(pw[:20]) + "…"
    dob = any(nn[k] and (nn[k] == nn[k + 1] or (len(nn[k]) >= 2 and nn[k + 1].startswith(nn[k]) and pw[k].endswith(("-", "...")))) for k in range(len(nn) - 1))
    return dob, " ".join(pw)
itens = []
def add(tipo, t0, txt, d=None):
    if any(abs(x["tl"] - t0) < 0.4 and x["tipo"] == tipo for x in itens): return
    itens.append({"tipo": tipo, "tl": round(t0, 2), "src": tl2src(t0), "texto": txt, "dist": None if d is None else round(d, 3)})
# A. unidade (1 ou 2 palavras) vs o trecho de mesmo tamanho logo depois
for i in range(len(W)):
    for k in (1, 2):
        if i + k > len(W): continue
        u0, u1 = W[i]["s"], W[i + k - 1]["e"]; L = u1 - u0
        if not (0.12 <= L <= 0.9): continue
        prox = W[i + k]["s"] if i + k < len(W) else u1
        if prox - u1 > 0.6: continue
        d = dist(voz, u0, u1, prox, prox + L)
        if d is not None and d < lim:
            dob, txt = confirma(u0)
            if dob: add("repetição (som + literal)", u0, txt, d)
# B. palavra longa demais (duas fundidas): começo vs resto
for i, w in enumerate(W):
    L = w["e"] - w["s"]; esperado = 0.09 + 0.065 * len(w["n"])
    if L > max(0.45, 1.9 * esperado):
        for f in (0.35, 0.45, 0.5):
            corte = w["s"] + f * L
            d = dist(voz, w["s"], corte, corte, min(w["e"], corte + f * L))
            if d is not None and d < lim * 1.05:
                dob, txt = confirma(w["s"])
                if dob: add("palavra longa = duas fundidas", w["s"], txt + f"  ({L:.2f} s)", d)
                break
# C. transcrição literal: palavra dobrada que a normal não tem
for i in range(len(WL) - 1):
    if WL[i]["n"] == WL[i + 1]["n"] and WL[i + 1]["s"] - WL[i]["e"] < 0.5:
        perto = [x for x in W if abs(x["s"] - WL[i]["s"]) < 0.8]
        if sum(1 for x in perto if x["n"] == WL[i]["n"]) < 2:
            add("literal mostra dobrada", WL[i]["s"], " ".join(x["w"] for x in WL[max(0, i - 3):i + 4]))
WO = json.load(open(os.path.join(T, "transcricao.json")))["words"]
def _dentro(w):
    dd = max(1e-3, w["end"] - w["start"])
    return max(max(0.0, min(w["end"], c["src1"] / fps) - max(w["start"], c["src0"] / fps)) for c in E["clips"]) / dd
def src2tl(t):
    acc = 0
    for c in E["clips"]:
        if c["src0"] / fps <= t < c["src1"] / fps: return acc + t - c["src0"] / fps
        acc += (c["src1"] - c["src0"]) / fps
K = [i for i, w in enumerate(WO) if _dentro(w) > 0.2]; NN = [norm(WO[i]["text"]) for i in K]
for n in (1, 2, 3):
    for j in range(len(K) - 2 * n + 1):
        if NN[j:j + n] == NN[j + n:j + 2 * n] and all(NN[j:j + n]):
            t0 = src2tl(WO[K[j]]["start"])
            if t0 is not None: add("palavra da tomada anterior que ficou", t0, " ".join(WO[K[x]]["text"].strip() for x in range(max(0, j - 2), min(len(K), j + 2 * n + 2))))
itens.sort(key=lambda x: x["tl"])
json.dump({"limiar": lim, "positivos": pos, "negativos_p2_p5_p50": [float(np.percentile(neg, q)) for q in (2, 5, 50)] if len(neg) else [],
           "itens": itens}, open(os.path.join(T, "repeticoes.json"), "w"), ensure_ascii=False, indent=1)
mm = lambda t: f"{int(t // 60)}:{t % 60:04.1f}" if t is not None else "?"
with open(os.path.join(T, "repeticoes.md"), "w") as f:
    f.write(f"# Repetições curtas — limiar DTW {lim:.3f} (positivos {[round(p, 3) for p in pos]}, negativos p2/p5/p50 "
            f"{[round(float(np.percentile(neg, q)), 3) for q in (2, 5, 50)] if len(neg) else []}) · {len(itens)} itens\n\n")
    for x in itens:
        f.write(f"- [{mm(x['tl'])} na edição · {mm(x['src'])} no bruto] **{x['tipo']}**{'' if x['dist'] is None else ' d=' + str(x['dist'])}: {x['texto']}\n")
print(f"limiar {lim:.3f} · positivos {[round(p, 3) for p in pos]} · {len(itens)} itens → {os.path.join(T, 'repeticoes.md')}")
