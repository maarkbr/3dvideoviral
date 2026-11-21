"""Master a rendered vertical cut to -14 LUFS integrated / <= -1 dBTP and write the deliverables.

uso: masterizar.py <render.mp4> <pasta_entrega> [--name corte_vertical] [--voice <cut.mp4>] [--sfx <sfx.wav>] [--music <music.wav>]

Measures the render's mix (BS.1770, gated), applies one gain to hit -14 LUFS, then a look-ahead true-peak limiter
(ceiling -1.3 dBTP, measured with 4x oversampling). The video stream is copied untouched. Stems (voice from the cut,
sfx, music bed before its carve) get the same master gain so they line up with the final.
"""
import os
import subprocess
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audio_core as A  # noqa: E402

arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d  # noqa: E731
SR = A.SR


def read(path):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vn", "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(pcm, dtype=np.float32).reshape(-1, 2).astype(np.float64)


src, out = sys.argv[1], sys.argv[2]
name = arg("--name", "corte_vertical")
os.makedirs(os.path.join(out, "stems"), exist_ok=True)
mix = read(src)
l0 = A.lufs(mix)
g = A.db(-14.0 - l0)
mastered, gr = A.limiter(mix * g, ceiling_db=-1.3)
# limiter trims a little loudness: one corrective pass
l1 = A.lufs(mastered)
if abs(l1 + 14.0) > 0.15:
    g = g * A.db(-14.0 - l1)
    mastered, gr = A.limiter(mix * g, ceiling_db=-1.3)
lufs, tp = A.lufs(mastered), A.true_peak_db(mastered)
wav = os.path.join(out, "stems", "master.wav")
A.write24(wav, mastered)
final = os.path.join(out, f"{name}.mp4")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
                "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-movflags", "+faststart", "-shortest", final], check=True)
for key, fn in (("--voice", "voz.wav"), ("--sfx", "sfx.wav"), ("--music", "music.wav")):
    p = arg(key)
    if p:
        x = read(p)[: len(mix)]
        A.write24(os.path.join(out, "stems", fn), np.clip(x * g, -1, 1))
r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", final, "-af", "ebur128=peak=true", "-f", "null", "-"],
                   capture_output=True, text=True).stderr
summary = r[r.rfind("Summary:"):] if "Summary:" in r else r[-600:]
print(f"render mix {l0:.1f} LUFS -> gain {20*np.log10(g):+.2f} dB -> master {lufs:.2f} LUFS, true peak {tp:.2f} dBTP, max limiting {-20*np.log10(max(1e-9, 1-gr)):.1f} dB")
print("ffmpeg ebur128 on the final file:\n" + summary)
print("wrote", final)
