#!/usr/bin/env python3
"""Confere o MP4 final: formato, som (-14 LUFS, pico abaixo de -1 dBTP), trechos pretos ou travados e uma folha de quadros.

uso: PY conferir.py <video.mp4> ["2,6,10,14"]
A folha fica em <pasta do mp4>/folha/folha.jpg (abra com o Read). O som é medido, não ouvido: diga isso à pessoa."""
import os, re, subprocess, sys

if len(sys.argv) < 2:
    sys.exit(__doc__)
v = os.path.abspath(os.path.expanduser(sys.argv[1]))
tempos = [t for t in (sys.argv[2].split(",") if len(sys.argv) > 2 else []) if t.strip()]
run = lambda *a: subprocess.run(list(a), capture_output=True, text=True)
info = run("ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate:format=duration", "-of",
           "compact", v).stdout.strip()
print("== formato\n" + info)
if "width=1080" not in info or "height=1920" not in info:
    print("ATENÇÃO: não está em 1080x1920")
e = run("ffmpeg", "-hide_banner", "-i", v, "-af", "ebur128=peak=true", "-f", "null", "-").stderr
res = e[e.rfind("Summary"):]
I = re.search(r"I:\s+(-?[\d.]+)", res); P = re.search(r"Peak:\s+(-?[\d.]+)", res)
I = float(I.group(1)) if I else None; P = float(P.group(1)) if P else None
print(f"== som\nintegrado {I} LUFS (alvo -14) · pico {P} dBTP (alvo abaixo de -1)")
pretos = run("ffmpeg", "-hide_banner", "-i", v, "-vf", "blackdetect=d=0.1:pix_th=0.05", "-an", "-f", "null", "-").stderr.count("black_start")
travados = run("ffmpeg", "-hide_banner", "-i", v, "-vf", "freezedetect=n=0.001:d=1", "-an", "-f", "null", "-").stderr.count("freeze_start")
print(f"== problemas\ntrechos pretos: {pretos} · trechos travados (> 1 s): {travados}")
ok = I is not None and abs(I + 14) <= 1 and P is not None and P <= -1 and pretos == 0 and travados == 0
if tempos:
    d = os.path.join(os.path.dirname(v), "folha"); os.makedirs(d, exist_ok=True)
    for f in os.listdir(d):
        if f.startswith("f_"): os.remove(os.path.join(d, f))
    for k, t in enumerate(tempos, 1):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", t, "-i", v, "-frames:v", "1", "-vf", "scale=270:-2",
                        os.path.join(d, f"f_{k:02d}.png")], check=True)
    cols = min(7, len(tempos))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(d, "f_%02d.png"), "-vf",
                    f"tile={cols}x{(len(tempos) + cols - 1) // cols}:padding=6:color=black", "-frames:v", "1",
                    os.path.join(d, "folha.jpg")], check=True)
    print(f"folha de quadros: {os.path.join(d, 'folha.jpg')}")
print("== veredito\n" + ("ok" if ok else "CONFERIR: algum número fora do alvo (acima)"))
