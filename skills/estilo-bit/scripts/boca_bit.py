"""Gera a boca do Bit acompanhando a voz: lê o volume a cada quadro e grava work/boca.js (window.BOCA).
uso: boca_bit.py <voz.wav> <saida boca.js> [--fps 20]
No index.html: <script src="work/boca.js"></script> antes do script principal e, depois de criar o Bit, bit.fala(window.BOCA)."""
import json, subprocess, sys
import numpy as np
src, out = sys.argv[1], sys.argv[2]
fps = int(sys.argv[sys.argv.index("--fps") + 1]) if "--fps" in sys.argv else 20
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True, check=True).stdout
a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
n = 16000 // fps
rms = np.array([np.sqrt(np.mean(a[i:i + n] ** 2)) for i in range(0, len(a) - n, n)])
ref = np.percentile(rms[rms > 1e-4], 95) if (rms > 1e-4).any() else 1
lv = np.clip(rms / ref, 0, 1)
lv[lv < 0.12] = 0                                     # silêncio: boca fechada
lv = np.round(np.convolve(lv, [.25, .5, .25], "same") * 4) / 4   # suaviza e usa 5 níveis
pts, ant = [], -1
for i, v in enumerate(lv):
    if v != ant: pts.append([round(i / fps, 3), float(v)]); ant = v
open(out, "w").write("window.BOCA = " + json.dumps(pts) + ";\n")
print(f"boca: {len(pts)} mudanças em {len(lv) / fps:.1f}s")
