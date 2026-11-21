"""Caça retakes e palavras comidas NO ÁUDIO JÁ CORTADO.
O Whisper comum junta as repetições ("sim sim" vira "sim"); por isso este conferidor:
  1. corta a voz pela edl.json e transcreve com o large-v3 (word_timestamps, condition_on_previous_text=False, sem VAD);
  2. acha repetição em sequência (a mesma palavra, um trecho de 2–4 palavras ou uma frase de 5–15 palavras dita 2 vezes);
  3. alinha com o roteiro (difflib): palavra A MAIS que repete a vizinha = retake; o roteiro muda na fala, então troca de texto não conta;
  4. confere CADA emenda no envelope de 10 ms: o corte tem que cair em silêncio (≥ 60 ms abaixo de −40 dB) dos dois lados;
  5. transcreve sozinha uma janela de 3 s em volta de cada emenda suspeita, procurando palavra truncada ou repetida.
Saída: trabalho/retakes_v2.md (lista com o tempo na edição e no bruto) e trabalho/retakes_v2.json. NUNCA entregue com item aberto.

uso: python conferir_retakes.py PASTA_TRABALHO [--roteiro roteiro.md] [--modelo large-v3-turbo]
"""
import difflib, json, os, re, subprocess, sys, unicodedata
import numpy as np

T = os.path.abspath(sys.argv[1]); V = os.path.dirname(T)
arg = sys.argv[2:]
ROT = arg[arg.index("--roteiro") + 1] if "--roteiro" in arg else None
MODELO = arg[arg.index("--modelo") + 1] if "--modelo" in arg else "large-v3-turbo"  # ~1,6 GB na 1ª vez; o large-v3 tem 3 GB
SR = 16000
job = json.load(open(os.path.join(T, "job.json"))); E = json.load(open(os.path.join(T, "edl.json"))); fps = E["fps"]
bruto = os.path.join(V, job["video"]) if not os.path.isabs(job["video"]) else job["video"]
raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", bruto, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
a = np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0
partes, emendas, tl = [], [], 0
for k, c in enumerate(E["clips"]):
    s0, s1 = int(c["src0"] / fps * SR), int(c["src1"] / fps * SR)
    partes.append(a[s0:s1]); tl += (s1 - s0)
    if k < len(E["clips"]) - 1:
        emendas.append({"tl": tl / SR, "src_fim": c["src1"] / fps, "src_ini": E["clips"][k + 1]["src0"] / fps})
voz = np.concatenate(partes)
norm = lambda s: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode())

def db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)

# 4. emendas no envelope de 10 ms (no BRUTO: o que vem logo antes do fim e logo depois do começo de cada pedaço)
def silencio_ms(sinal, ini, direcao, lim=-40.0):
    """quantos ms de silêncio (< lim dB em janelas de 10 ms) existem a partir de ini, indo para 'direcao' (+1/-1)"""
    n, w = 0, int(0.01 * SR)
    while n < 30:
        p = ini + direcao * n * w
        seg = sinal[p:p + w] if direcao > 0 else sinal[p - w:p]
        if len(seg) < w or db(seg) > lim: break
        n += 1
    return n * 10
for e in emendas:
    fim, ini = int(e["src_fim"] * SR), int(e["src_ini"] * SR)
    e["sil_antes"] = silencio_ms(a, fim, -1)      # silêncio que sobrou ANTES do corte (fim do pedaço)
    e["sil_depois"] = silencio_ms(a, ini, +1)     # silêncio DEPOIS do começo do pedaço seguinte
    e["db_fim"], e["db_ini"] = round(float(db(a[fim - 160:fim])), 1), round(float(db(a[ini:ini + 160])), 1)
    e["suspeita"] = bool(e["db_fim"] > -40 or e["db_ini"] > -40)   # corte no meio de som (sílaba comida)

from faster_whisper import WhisperModel
m = WhisperModel(MODELO, device="cpu", compute_type="int8", download_root=os.path.expanduser("~/.cache/edicao-youtube/whisper"))
cache = os.path.join(T, f"palavras_v2_{MODELO}.json")
if os.path.exists(cache) and os.path.getmtime(cache) > os.path.getmtime(os.path.join(T, "edl.json")):
    W = json.load(open(cache))           # a edl não mudou: reaproveita a transcrição
else:
    segs, _ = m.transcribe(voz, language="pt", word_timestamps=True, condition_on_previous_text=False, vad_filter=False, beam_size=5,
                           initial_prompt=job.get("prompt", None))
    W = [{"w": w.word.strip(), "n": norm(w.word), "s": round(float(w.start), 2), "e": round(float(w.end), 2), "p": round(float(w.probability), 2)}
         for s in segs for w in s.words if norm(w.word)]
    json.dump(W, open(cache, "w"), ensure_ascii=False)

itens = []
def tl2src(t):
    """tempo na edição → tempo no bruto"""
    acc = 0
    for c in E["clips"]:
        d = (c["src1"] - c["src0"]) / fps
        if t <= acc + d: return round(c["src0"] / fps + (t - acc), 2)
        acc += d
    return None
# 2. repetição em sequência (1 a 4 palavras)
for n in (1, 2, 3, 4):
    for i in range(len(W) - 2 * n + 1):
        A_, B_ = [x["n"] for x in W[i:i + n]], [x["n"] for x in W[i + n:i + 2 * n]]
        if A_ == B_ and (n > 1 or len(A_[0]) > 1) and W[i + n]["s"] - W[i + n - 1]["e"] < 1.5:
            if n == 1 and A_[0] in ("e", "a", "o", "que", "de", "do", "da", "tem", "é"): continue
            itens.append({"tipo": "repetição", "texto": " ".join(x["w"] for x in W[i:i + 2 * n]), "tl": W[i]["s"], "src": tl2src(W[i]["s"])})
# 2b. frase inteira dita 2 vezes (5 a 15 palavras): o retake clássico. O Whisper escreve as duas cópias um pouco diferente,
# então compara o texto com tolerância
usados = set()
for n in range(15, 4, -1):
    for i in range(len(W) - 2 * n + 1):
        if any(k in usados for k in range(i, i + 2 * n)): continue
        A_, B_ = " ".join(x["n"] for x in W[i:i + n]), " ".join(x["n"] for x in W[i + n:i + 2 * n])
        if W[i + n]["s"] - W[i + n - 1]["e"] < 1.5 and difflib.SequenceMatcher(None, A_, B_).ratio() >= 0.85:
            itens.append({"tipo": "retake (trecho dito 2 vezes)", "texto": " ".join(x["w"] for x in W[i:i + 2 * n]),
                          "tl": W[i]["s"], "src": tl2src(W[i]["s"])})
            usados.update(range(i, i + 2 * n))
# 3. alinhamento com o roteiro
if ROT and os.path.exists(ROT):
    txt = open(ROT).read()
    txt = re.sub(r"_Tela:.*?_", " ", txt); txt = re.sub(r"\*\*\[.*?\]\*\*", " ", txt); txt = re.sub(r"^#.*$", " ", txt, flags=re.M)
    R = [norm(x) for x in txt.split() if norm(x)]
    sm = difflib.SequenceMatcher(a=R, b=[x["n"] for x in W], autojunk=False)
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "insert" and j2 - j1 <= 4:
            ins = [x["n"] for x in W[j1:j2]]; viz = [x["n"] for x in W[max(0, j1 - 4):j1]] + [x["n"] for x in W[j2:j2 + 4]]
            if all(t in viz for t in ins):
                itens.append({"tipo": "a mais (repete a vizinha)", "texto": " ".join(x["w"] for x in W[max(0, j1 - 2):j2 + 2]), "tl": W[j1]["s"], "src": tl2src(W[j1]["s"])})
# 5. janela de 3 s em volta de cada emenda suspeita (e de cada palavra com probabilidade baixa colada numa emenda)
baixa = [x for x in W if x["p"] < 0.45]
for e in emendas:
    perto = [x for x in baixa if abs(x["s"] - e["tl"]) < 0.4 or abs(x["e"] - e["tl"]) < 0.4]
    if not (e["suspeita"] or perto): continue
    j0, j1 = max(0, int((e["tl"] - 1.5) * SR)), int((e["tl"] + 1.5) * SR)
    sj, _ = m.transcribe(voz[j0:j1], language="pt", word_timestamps=True, condition_on_previous_text=False, vad_filter=False)
    pal = [w.word.strip() for s in sj for w in s.words]
    nn = [norm(p) for p in pal]
    rep = any(nn[k] and nn[k] == nn[k + 1] and len(nn[k]) > 1 for k in range(len(nn) - 1))
    itens.append({"tipo": "emenda " + ("no meio de som" if e["suspeita"] else "com palavra incerta") + (" + repetição" if rep else ""),
                  "texto": " ".join(pal), "tl": round(float(e["tl"]), 2), "src": round(float(e["src_fim"]), 2),
                  "db": [e["db_fim"], e["db_ini"]], "palavra_incerta": [x["w"] for x in perto]})
itens.sort(key=lambda x: x["tl"])
json.dump({"itens": itens, "emendas": emendas}, open(os.path.join(T, "retakes_v2.json"), "w"), ensure_ascii=False, indent=1)
mm = lambda t: f"{int(t // 60)}:{t % 60:04.1f}" if t is not None else "?"
with open(os.path.join(T, "retakes_v2.md"), "w") as f:
    f.write(f"# Retakes e emendas — {MODELO} no áudio cortado ({len(voz) / SR:.1f} s, {len(emendas)} emendas, {len(itens)} itens)\n\n")
    for x in itens:
        f.write(f"- [{mm(x['tl'])} na edição · {mm(x['src'])} no bruto] **{x['tipo']}**: {x['texto']}" + (f" (dB {x['db']})" if 'db' in x else "") + "\n")
print(len(itens), "itens →", os.path.join(T, "retakes_v2.md"))
