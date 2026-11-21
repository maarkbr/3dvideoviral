"""Prepara a narração do vídeo 3D e o tempo de cada palavra.
uso:
  python voz_3d.py <projeto> --falas a1.wav a2.wav ...   (uma fala por arquivo, na ordem do roteiro; ex.: voz de IA)
  python voz_3d.py <projeto> --gravacao Bruto/voz.m4a     (uma gravação só, já sem erros; use a editor-ia para cortar erros antes)
opções: --vel 1.15 (velocidade, sem mudar o tom)  --pausa 0.12 (pausa máxima dentro da fala)  --respiro 0.22 (entre falas)
Saída em <projeto>/voz/: voz.wav, palavras.json (texto do roteiro com o tempo de cada palavra) e blocos.json (início de cada fala + total).
Precisa: ffmpeg e faster-whisper (pip install faster-whisper)."""
import argparse, difflib, json, os, re, subprocess, unicodedata
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("projeto"); ap.add_argument("--falas", nargs="+"); ap.add_argument("--gravacao")
ap.add_argument("--vel", type=float, default=1.15); ap.add_argument("--pausa", type=float, default=0.12)
ap.add_argument("--respiro", type=float, default=0.22); ap.add_argument("--modelo", default="small")
a = ap.parse_args()
P = os.path.abspath(a.projeto); V = os.path.join(P, "voz"); os.makedirs(V, exist_ok=True)
run = lambda *x: subprocess.run(x, check=True)
dur = lambda f: float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], capture_output=True, text=True).stdout)
FILTRO = ("silenceremove=start_periods=1:start_threshold=-45dB,"
          f"silenceremove=stop_periods=-1:stop_duration={a.pausa + .1}:stop_threshold=-42dB:stop_silence={a.pausa},"
          f"atempo={a.vel},areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,aresample=48000")
INI, CAUDA = 0.15, 1.4
if a.falas:
    inp, flt, t = [], [], INI
    for i, f in enumerate(a.falas):
        o = os.path.join(V, f"c{i + 1}.wav"); run("ffmpeg", "-v", "error", "-y", "-i", f, "-af", FILTRO, "-ac", "1", o)
        inp += ["-i", o]; flt.append(f"[{i}]adelay={int(t * 1000)}|{int(t * 1000)}[v{i}]"); t += dur(o) + a.respiro
    total = round(t - a.respiro + CAUDA, 2)
    flt.append("".join(f"[v{i}]" for i in range(len(a.falas))) + f"amix=inputs={len(a.falas)}:normalize=0,apad,atrim=0:{total}[o]")
    run("ffmpeg", "-v", "error", "-y", *inp, "-filter_complex", ";".join(flt), "-map", "[o]", "-ar", "48000", os.path.join(V, "voz.wav"))
else:
    o = os.path.join(V, "c.wav"); run("ffmpeg", "-v", "error", "-y", "-i", a.gravacao, "-af", FILTRO, "-ac", "1", o)
    total = round(INI + dur(o) + CAUDA, 2)
    run("ffmpeg", "-v", "error", "-y", "-i", o, "-af", f"adelay={int(INI * 1000)},apad,atrim=0:{total}", "-ar", "48000", os.path.join(V, "voz.wav"))

# tempo de cada palavra (Whisper) alinhado ao texto do roteiro (o Whisper erra palavras; a legenda usa o roteiro)
run("ffmpeg", "-v", "error", "-y", "-i", os.path.join(V, "voz.wav"), "-ac", "1", "-ar", "16000", "-f", "s16le", os.path.join(V, "voz.raw"))
from faster_whisper import WhisperModel
au = np.fromfile(os.path.join(V, "voz.raw"), dtype=np.int16).astype(np.float32) / 32768
segs, _ = WhisperModel(a.modelo, compute_type="int8").transcribe(au, language="pt", word_timestamps=True)
W = [{"w": w.word.strip(), "s": w.start, "e": w.end} for s in segs for w in s.words]
norm = lambda x: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", x.lower()).encode("ascii", "ignore").decode())
rot = json.load(open(os.path.join(P, "roteiro.json")))["blocos"]
S, dono = [], []
for bi, b in enumerate(rot):
    for w in b["fala"].split(): S.append(w); dono.append(bi)
sm = difflib.SequenceMatcher(None, [norm(x) for x in S], [norm(x["w"]) for x in W], autojunk=False)
tp = [None] * len(S)
for i0, j0, n in sm.get_matching_blocks():
    for k in range(n): tp[i0 + k] = (W[j0 + k]["s"], W[j0 + k]["e"])
# número por extenso no roteiro ("mil novecentos e setenta e um") e em algarismos no Whisper ("1971"): o tempo do
# trecho do Whisper é dividido entre as palavras do roteiro, pelo tamanho de cada uma
por_numero = 0
for op, i1, i2, j1, j2 in sm.get_opcodes():
    if op == "replace" and any(ch.isdigit() for x in W[j1:j2] for ch in x["w"]):
        s0, e0 = W[j1]["s"], W[j2 - 1]["e"]; pesos = [len(norm(x)) + 1 for x in S[i1:i2]]; acc = 0
        for k, pw in enumerate(pesos):
            tp[i1 + k] = (s0 + (e0 - s0) * acc / sum(pesos), s0 + (e0 - s0) * (acc + pw) / sum(pesos)); acc += pw
        por_numero += i2 - i1
for i in range(len(S)):
    if tp[i] is None:
        ant = next((tp[j] for j in range(i - 1, -1, -1) if tp[j]), (INI, INI)); tp[i] = (ant[1], ant[1] + .3)
pal = []
for i, w in enumerate(S):
    s0, e0 = tp[i]; nxt = tp[i + 1][0] if i + 1 < len(S) else e0 + .4
    pal.append({"w": w.strip(",.!?:;").upper(), "s": round(s0 - .02, 3), "e": round(max(e0, min(nxt, s0 + .6)), 3), "bloco": dono[i]})
inicios = [float(round(max(0, min(p["s"] for p in pal if p["bloco"] == bi) - .12), 3)) for bi in range(len(rot))]
inicios[0] = 0.0
json.dump(pal, open(os.path.join(V, "palavras.json"), "w"), ensure_ascii=False)
json.dump({"inicios": inicios, "total": total}, open(os.path.join(V, "blocos.json"), "w"))
casou = sum(n for _, _, n in sm.get_matching_blocks()) + por_numero
print(f"voz pronta: {total}s | falas começam em {inicios} | {casou}/{len(S)} palavras do roteiro reconhecidas")
if casou < .85 * len(S): print("ATENÇÃO: muitas palavras do roteiro não apareceram na voz. Ouça e confira se alguma fala saiu cortada.")
