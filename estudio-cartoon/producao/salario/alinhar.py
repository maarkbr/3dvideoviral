import json, re, unicodedata, difflib, sys
from faster_whisper import WhisperModel
wav = sys.argv[1]
import subprocess, numpy as np
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", wav, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True, check=True).stdout
au = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
segs, _ = WhisperModel("small", compute_type="int8").transcribe(au, language="pt", word_timestamps=True)
W = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
norm = lambda x: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", x.lower()).encode("ascii", "ignore").decode())
falas = [l.strip() for l in open("falas.txt", encoding="utf-8") if l.strip()]
S, dono = [], []
for i, f in enumerate(falas):
    for w in f.split(): S.append(w); dono.append(i)
sm = difflib.SequenceMatcher(None, [norm(x) for x in S], [norm(x["w"]) for x in W], autojunk=False)
tp = [None] * len(S)
for a, b, n in sm.get_matching_blocks():
    for k in range(n): tp[a + k] = (W[b + k]["s"], W[b + k]["e"])
for op, i1, i2, j1, j2 in sm.get_opcodes():
    if op == "replace" and j2 > j1:
        s0, e0 = W[j1]["s"], W[j2 - 1]["e"]; n = i2 - i1
        for k in range(n): tp[i1 + k] = (s0 + (e0 - s0) * k / n, s0 + (e0 - s0) * (k + 1) / n)
for i in range(len(S)):
    if tp[i] is None: prev = next((tp[j] for j in range(i - 1, -1, -1) if tp[j]), (0, 0)); tp[i] = (prev[1], prev[1] + .25)
pal = [{"w": re.sub(r"[,.!?:;]", "", w), "s": round(tp[i][0], 3), "e": round(tp[i][1], 3), "fala": dono[i]} for i, w in enumerate(S)]
ini = [min(p["s"] for p in pal if p["fala"] == k) for k in range(len(falas))]
fim = [max(p["e"] for p in pal if p["fala"] == k) for k in range(len(falas))]
json.dump({"palavras": pal, "falas": [{"i": k, "ini": ini[k], "fim": fim[k], "texto": falas[k]} for k in range(len(falas))]}, open("tempos.json", "w"), ensure_ascii=False, indent=1)
casou = sum(n for _, _, n in sm.get_matching_blocks())
print(f"{casou}/{len(S)} palavras casadas; whisper: {len(W)}")
for k in range(len(falas)): print(k + 1, f"{ini[k]:6.2f}-{fim[k]:6.2f}", falas[k][:50])
print("transcricao:", " ".join(x["w"] for x in W))
