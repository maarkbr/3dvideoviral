"""Apara as emendas da edl.json no QUADRO mais silencioso (os cortes andam de 33 ms em 33 ms: um quadro a mais no fim de
um pedaço deixa o começo da palavra tirada — "q-", "pra-", "tá-" — e um quadro a menos no começo come a 1ª sílaba).
Para cada emenda: o FIM do pedaço volta até 3 quadros se logo depois do corte ainda houver som (> −45 dB), sem cortar a
última palavra que fica; o COMEÇO do pedaço seguinte recua até 3 quadros se já houver som antes dele. Depois recalcula a
linha do tempo (tl0/tl1) e as palavras (palavras_tl.json). Rode DEPOIS do cortes.py e ANTES do conferir_retakes.py.
uso: python aparar_emendas.py PASTA_TRABALHO
"""
import json, os, subprocess, sys
import numpy as np

T = os.path.abspath(sys.argv[1]); V = os.path.dirname(T)
job = json.load(open(os.path.join(T, "job.json"))); E = json.load(open(os.path.join(T, "edl.json"))); fps = E["fps"]
W = json.load(open(os.path.join(T, "transcricao.json")))["words"]
P = json.load(open(os.path.join(T, "palavras_tl.json")))
bruto = job["video"] if os.path.isabs(job["video"]) else os.path.join(V, job["video"])
SR = 16000
a = np.frombuffer(subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", bruto, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                                 capture_output=True, check=True).stdout, np.int16).astype(np.float32) / 32768
def db(t0, t1):
    s = a[max(0, int(t0 * SR)):max(int(t0 * SR) + 1, int(t1 * SR))]
    return 20 * np.log10(np.sqrt(np.mean(s ** 2)) + 1e-9)
LIM = -45.0
mudou = []
def _dentro(w):
    d = max(1e-3, w["end"] - w["start"])
    return max(max(0.0, min(w["end"], c["src1"] / fps) - max(w["start"], c["src0"] / fps)) for c in E["clips"]) / d
mantidas = {i for i, w in enumerate(W) if _dentro(w) > 0.5}   # palavra que fica = mais da metade dentro de um pedaço
cl = E["clips"]
for k, c in enumerate(cl):
    if k < len(cl) - 1:   # fim do pedaço: o começo da palavra TIRADA entrou no corte?
        s1 = c["src1"]
        dentro = [i for i in range(len(W)) if c["src0"] / fps - 0.05 <= W[i]["start"] < s1 / fps]
        fica = [i for i in dentro if i in mantidas]
        if fica:
            ke = W[max(fica)]["end"]
            prox = next((W[i]["start"] for i in range(max(fica) + 1, len(W)) if i not in mantidas), None)
            if prox is not None and prox < s1 / fps - 0.012:
                lo, hi = int(np.ceil(min(ke, prox) * fps - 0.4)), int(np.floor(max(ke, prox) * fps + 0.4))
                cand = [b for b in range(max(lo, c["src0"] + 3), min(hi, s1) + 1)] or [max(c["src0"] + 3, min(s1, int(round(prox * fps))))]
                b = min(cand, key=lambda b: (db(b / fps - 0.005, b / fps + 0.025), -b))
                if b != s1: mudou.append(("fim", k, s1, b)); c["src1"] = b
    if k > 0 and not c.get("inserido"):   # começo do pedaço: som logo antes do corte?
        s0 = c["src0"]
        if db(s0 / fps - 0.06, s0 / fps) > LIM:
            ant = cl[k - 1]["src1"]
            cand = [b for b in range(s0, s0 - 4, -1) if b > ant]
            if cand:
                b = min(cand, key=lambda b: (db(b / fps - 0.03, b / fps), b))
                if b != s0: mudou.append(("começo", k, s0, b)); c["src0"] = b
# linha do tempo e palavras
tl = 0; desloc = []   # (src0 antigo do pedaço, delta acumulado em s) para mover as palavras
for c in cl:
    vel = c.get("vel", 1.0); n = int(round((c["src1"] - c["src0"]) / vel))
    novo0 = tl; antigo0 = c["tl0"]; c["tl0"], c["tl1"] = tl, tl + n; tl += n
    desloc.append((c["src0"] / fps, c["src1"] / fps, (novo0 - antigo0) / fps))
E["total_frames"] = tl
for p in P:
    if p.get("s") is None: continue
    w = W[p["i"]] if p["i"] < len(W) else None
    if w is None: continue
    d = next((dd for s0, s1, dd in desloc if s0 - 0.05 <= w["start"] <= s1 + 0.05), None)
    if d is not None:
        p["s"] = round(p["s"] + d, 3); p["e"] = None if p.get("e") is None else round(p["e"] + d, 3)
json.dump(E, open(os.path.join(T, "edl.json"), "w"), ensure_ascii=False, indent=1)
json.dump(P, open(os.path.join(T, "palavras_tl.json"), "w"), ensure_ascii=False)
print(f"{len(mudou)} emendas aparadas · edição {tl / fps:.1f} s")
for x in mudou: print(f"  {x[0]:6s} pedaço {x[1]:3d}: quadro {x[2]} → {x[3]}")
