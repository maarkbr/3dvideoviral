"""Prepara a decupagem: envelope de volume (a cada 10 ms), frases com o índice da 1ª palavra e suspeitas de
tentativa repetida, para a Claude decidir o que sai.

uso: python3 decupar.py PASTA_TRABALHO
  precisa: PASTA/transcricao.json (do transcrever_falas.py desta skill) e PASTA/job.json com "video"
  grava:   PASTA/db10ms.npy, PASTA/frases.txt, PASTA/suspeitas.txt

frases.txt:  [  índice] início-fim  (pausa antes)  texto        — quebra a cada pausa > 0,3 s
suspeitas.txt: trechos onde 2+ palavras seguidas se repetem logo depois (sinal de tentativa repetida),
               palavras com baixa confiança e pausas longas no meio de frase (sinal de erro e recomeço).
"""
import json, os, re, subprocess, sys, unicodedata
import numpy as np

w_dir = sys.argv[1]
J = json.load(open(f"{w_dir}/job.json"))
T = json.load(open(f"{w_dir}/transcricao.json"))
W = T["words"]

pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", J["video"], "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                     capture_output=True, check=True).stdout
a = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
hop = 160
n = len(a) // hop
db = 20 * np.log10(np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12))
np.save(f"{w_dir}/db10ms.npy", db)
ruido = float(np.percentile(db, 10))
fala = float(np.percentile(db, 70))
print(f"áudio {len(a) / 16000:.1f}s · chão de ruído {ruido:.1f} dBFS · fala típica {fala:.1f} dBFS")

norm = lambda s: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKD", s.lower()).encode("ascii", "ignore").decode())

with open(f"{w_dir}/frases.txt", "w") as f:
    linha, prev_e = [], None
    for w in W:
        if linha and w["start"] - linha[-1]["end"] > 0.3:
            pausa = linha[0]["start"] - prev_e if prev_e is not None else 0
            f.write(f"[{linha[0]['i']:5d}] {linha[0]['start']:8.2f}-{linha[-1]['end']:8.2f} ({pausa:4.1f}s) "
                    f"{' '.join(x['text'] for x in linha)}\n")
            prev_e = linha[-1]["end"]
            linha = []
        linha.append(w)
    if linha:
        pausa = linha[0]["start"] - prev_e if prev_e is not None else 0
        f.write(f"[{linha[0]['i']:5d}] {linha[0]['start']:8.2f}-{linha[-1]['end']:8.2f} ({pausa:4.1f}s) "
                f"{' '.join(x['text'] for x in linha)}\n")

toks = [norm(w["text"]) for w in W]
sus = []
# transcrição fala por fala (transcrever_falas.py): detector de retakes → retakes.json (o cortes.py aplica sozinho)
if T.get("falas"):
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from retakes import detectar
    R = detectar(W, T["falas"])
    json.dump(R, open(f"{w_dir}/retakes.json", "w"), ensure_ascii=False, indent=1)
    corta = {}
    for r in R:
        for i in range(r["i0"], r["i1"] + 1):
            corta[i] = r["motivo"]
        sus.append((W[r["i0"]]["start"], f"RETAKE  [{r['i0']}-{r['i1']}] '{' '.join(w['text'] for w in W[r['i0']:r['i1'] + 1])}'"
                    f" · {r['motivo']}" + (f" → fica: '{r['fica']}'" if r["fica"] else "")))
    with open(f"{w_dir}/frases.txt", "w") as f:      # uma linha por fala; ✂ = sai pelo detector, [palavras] = trecho que sai
        prev = None
        for F in T["falas"]:
            ws = W[F["i0"]:F["i1"] + 1]
            txt = " ".join((f"[{w['text']}]" if w["i"] in corta else w["text"]) for w in ws)
            marca = "✂ " if all(w["i"] in corta for w in ws) else ("◐ " if any(w["i"] in corta for w in ws) else "  ")
            pausa = F["start"] - prev if prev is not None else 0
            f.write(f"{marca}[{F['i0']:5d}] {ws[0]['start']:8.2f}-{ws[-1]['end']:8.2f} ({pausa:4.1f}s) {txt}\n")
            prev = ws[-1]["end"]
    print(f"{len(R)} retakes/tropeços detectados → retakes.json (✂/◐ no frases.txt)")
# repetição: uma sequência de 2 a 6 palavras que reaparece em até 25 palavras
pular_ate = -1
for i in range(len(W)):
    if i <= pular_ate:
        continue
    for L in (6, 5, 4, 3, 2):
        seq = toks[i:i + L]
        if len(seq) < L or not all(seq) or sum(len(s) for s in seq) < 7:
            continue
        for j in range(i + L, min(len(W) - L, i + 25)):
            if toks[j:j + L] == seq:
                sus.append((W[i]["start"], f"REPETE  [{i}-{j + L - 1}] '{' '.join(w['text'] for w in W[i:i + L])}' "
                            f"de novo em [{j}] {W[j]['start']:.2f}s"))
                pular_ate = j - 1
                break
        else:
            continue
        break
for w in W:
    if w["prob"] < 0.35:
        sus.append((w["start"], f"DÚVIDA  [{w['i']}] '{w['text']}' (confiança {w['prob']:.2f})"))
for x, y in zip(W, W[1:]):
    g = y["start"] - x["end"]
    if g > 1.2:
        sus.append((x["end"], f"PAUSA   {g:.1f}s entre [{x['i']}] '{x['text']}' e [{y['i']}] '{y['text']}'"))
sus.sort()
with open(f"{w_dir}/suspeitas.txt", "w") as f:
    for t, s in sus:
        f.write(f"{t:8.2f}  {s}\n")
print(f"{len(W)} palavras · frases.txt · {len(sus)} suspeitas em suspeitas.txt")
