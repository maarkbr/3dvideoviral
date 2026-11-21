"""Sobe as falas baixas (ele volta de uma espera e fala baixinho) clipe a clipe, na sequência dele no Premiere.

uso: python3 nivelar_voz.py PROJETO.prproj|PASTA_TRABALHO saida.json [--sequencia "nome"] --audio <áudio da gravação> [--intro intro.mp4]
        [--max 8] [--minimo 2]

Mede a fala de cada clipe desse áudio (média de energia das janelas de 50 ms acima de −50 dBFS), acha a mediana
(pesada pela duração) e sobe os clipes que estão ≥ --minimo dB abaixo até ela (no máximo --max dB, sem passar de −1 dBFS
de pico). Saída para premiere_refazer.py --ganhos/--ganhos-arquivo: {"alvo_db", "ganhos": {"<in>": dB}}.
Pedido de 07/11/2026: "aumentar o som em algumas partes em que eu estava esperando, volto e começo a falar bem baixo".
No vídeo 3D: 18 de 416 clipes, +2 a +5,3 dB (ele mesmo tinha subido 3, de +2,4 a +9,8 dB — vale o maior).
"""
import json, os, subprocess, sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from premiere_ler import ler_linha  # noqa: E402

a = sys.argv[1:]
opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d  # noqa: E731
proj, saida, audio = a[0], a[1], opt("--audio")
GMAX, GMIN = float(opt("--max", 8)), float(opt("--minimo", 2))
L = ler_linha(proj, opt("--sequencia"), intro=opt("--intro"), audio=opt("--audio"))
clipes = [c for f in L["faixas"] if f["tipo"] == "audio" and f["index"] == 0 for c in f["clipes"]
          if c["arquivo"] and os.path.basename(c["arquivo"]) == os.path.basename(audio)]
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", audio, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                                 capture_output=True, check=True).stdout, np.float32)
J = 800
med = []
for c in clipes:
    s = x[int(c["in"] * 16000):int(c["out"] * 16000)]
    n = len(s) // J
    if n < 4:
        continue
    e = (s[:n * J].reshape(n, J) ** 2).mean(1)
    fala = 10 * np.log10(e + 1e-12) > -50
    if fala.sum() < 4:
        continue
    med.append((c, float(10 * np.log10(e[fala].mean())), float(20 * np.log10(np.abs(s).max() + 1e-9))))
v = np.array([m[1] for m in med])
d = np.array([m[0]["out"] - m[0]["in"] for m in med])
o = np.argsort(v)
alvo = float(v[o][np.searchsorted(np.cumsum(d[o]), d.sum() / 2)])
ganhos = {}
for c, lv, pk in med:
    g = min(alvo - lv, GMAX, -1.0 - pk)
    if alvo - lv >= GMIN and g >= 1.0:
        ganhos[f"{c['in']:.3f}"] = round(float(g), 1)
json.dump({"alvo_db": alvo, "ganhos": ganhos}, open(saida, "w"), indent=0)
g = list(ganhos.values())
print(f"fala: mediana {alvo:.1f} dB · {len(g)} de {len(clipes)} clipes sobem" + (f" (+{min(g):.1f} a +{max(g):.1f} dB)" if g else "") + f" → {saida}")
