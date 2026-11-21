"""Confere o corte: monta o áudio JÁ CORTADO, transcreve fala por fala (transcrever_falas.py) e aponta o que sobrou.

uso: python3 conferir.py PASTA_TRABALHO [--modelos PASTA_CACHE] [--vel 1.15]
  lê edl.json; grava audio_editado.wav, qa_falas.json e qa_transcricao.txt (tempo da edição + texto, uma fala por linha)

No qa_transcricao.txt:
  ✂ / ◐  = o detector de retakes ainda vê tentativa repetida/gagueira nessa fala (inteira / em parte)
  PAUSA  = silêncio que sobrou maior que 0,4 s (já contando a velocidade --vel)
Para cada ✂/◐/PAUSA: ache a fala no frases.txt (pelo texto), acrescente "remover"/"remover_tempo" no job.json
(ou "manter_retakes" se o detector errou), rode cortes.py e confira de novo, até não sobrar nada.
Transcrever o arquivo inteiro de uma vez NÃO serve para conferir: o Whisper junta as repetições e elas somem do texto.
"""
import json, os, subprocess, sys, wave
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import capcut as cc  # noqa: E402
from retakes import detectar  # noqa: E402

wd = sys.argv[1]
modelos = sys.argv[sys.argv.index("--modelos") + 1] if "--modelos" in sys.argv else os.environ.get(
    "CORTES_MODELOS", os.path.expanduser("~/.cache/edicao-youtube/whisper"))
vel = float(sys.argv[sys.argv.index("--vel") + 1]) if "--vel" in sys.argv else 1.0
E = cc.load(f"{wd}/edl.json")
FPS = E["fps"]
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", E["video"], "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                     capture_output=True, check=True).stdout
a = np.frombuffer(pcm, np.int16)
x = np.concatenate([a[int(round(c["src0"] / FPS * 16000)):][:int(round((c["src1"] - c["src0"]) / FPS * 16000))]
                    for c in E["clips"]])   # sem aceleração: os tempos aqui são da fala original
with wave.open(f"{wd}/audio_editado.wav", "wb") as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(16000)
    wf.writeframes(x.astype(np.int16).tobytes())
emendas, acc = [], 0.0
for c in E["clips"][:-1]:
    acc += (c["src1"] - c["src0"]) / FPS
    emendas.append(round(acc, 3))
json.dump(emendas, open(f"{wd}/qa_emendas.json", "w"))
subprocess.run([sys.executable, "-I", os.path.join(os.path.dirname(os.path.abspath(__file__)), "transcrever_falas.py"),
                f"{wd}/audio_editado.wav", f"{wd}/qa_falas.json", "--modelos", modelos, "--quebras", f"{wd}/qa_emendas.json"]
               + (["--limiar", str(cc.load(f"{wd}/transcricao.json").get("limiar_db"))]
                  if cc.load(f"{wd}/transcricao.json").get("limiar_db") is not None else []), check=True,
               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
Q = json.load(open(f"{wd}/qa_falas.json"))
W, F = Q["words"], Q["falas"]
R = detectar(W, F)
corta = {}
for r in R:
    for i in range(r["i0"], r["i1"] + 1):
        corta[i] = r["motivo"]
db = np.load(f"{wd}/qa_falas.json.db10ms.npy")
silencio = np.convolve(db, np.ones(5) / 5, mode="same") < Q.get("limiar_db", -45)
pausas = []
k = 0
while k < len(silencio):
    if silencio[k]:
        j = k
        while j < len(silencio) and silencio[j]:
            j += 1
        if (j - k) / 100 / vel > 0.4 and k > 0 and j < len(silencio):
            pausas.append((k / 100, (j - k) / 100))
        k = j
    else:
        k += 1


def linha(f0):
    ws = W[f0["i0"]:f0["i1"] + 1]
    m = "✂ " if all(w["i"] in corta for w in ws) else ("◐ " if any(w["i"] in corta for w in ws) else "  ")
    return m + f"{f0['start']:8.2f} " + " ".join((f"[{w['text']}]" if w["i"] in corta else w["text"]) for w in ws)


linhas = [(f0["start"], linha(f0)) for f0 in F] + [(t, f"  {t:8.2f} PAUSA {d / vel:.2f}s") for t, d in pausas]
linhas.sort()
with open(f"{wd}/qa_transcricao.txt", "w") as f:
    for _, l in linhas:
        f.write(l + "\n")
print(f"{len(F)} falas · {len(R)} retakes/tropeços ainda vistos · {len(pausas)} pausas > 0,4 s → {wd}/qa_transcricao.txt")
