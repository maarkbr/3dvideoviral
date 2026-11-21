"""Extrai a intro já cortada (voz + tela) para editar fora do CapCut, em HyperFrames.

uso: python3 trecho_intro.py PASTA_TRABALHO ULTIMA_PALAVRA SAIDA_ASSETS [--vel 1.15] [--resolucao fullhd|2k|4k] [--fps 30|60]
  ULTIMA_PALAVRA: índice (transcricao.json) da última palavra da intro
  grava SAIDA_ASSETS/voz.wav (estéreo 48 kHz) e SAIDA_ASSETS/tela.mp4 (na resolução escolhida — job.json ou
  --resolucao, mínimo Full HD — no fps pedido, padrão 30; sem som),
  com os mesmos cortes do edl.json e a velocidade pedida. Depois transcreva voz.wav para ter o tempo das palavras.
"""
import json, os, subprocess, sys

wd, ult, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
vel = float(sys.argv[sys.argv.index("--vel") + 1]) if "--vel" in sys.argv else 1.15
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from resolucao import resolucao  # noqa: E402
RW, RH = resolucao(sys.argv[sys.argv.index("--resolucao") + 1] if "--resolucao" in sys.argv else None, wd)
TFPS = int(sys.argv[sys.argv.index("--fps") + 1]) if "--fps" in sys.argv else 30
E = json.load(open(f"{wd}/edl.json"))
T = json.load(open(f"{wd}/transcricao.json"))["words"]
FPS = E["fps"]
fim = T[ult]["end"] + 0.25
segs = [(c["src0"] / FPS, min(c["src1"] / FPS, fim)) for c in E["clips"] if c["src0"] / FPS < fim]
os.makedirs(out, exist_ok=True)
fa = ";".join(f"[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS[a{k}]" for k, (a, b) in enumerate(segs))
fa += ";" + "".join(f"[a{k}]" for k in range(len(segs))) + f"concat=n={len(segs)}:v=0:a=1,atempo={vel}[o]"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", E["video"], "-filter_complex", fa, "-map", "[o]", "-ac", "2", "-ar", "48000",
                f"{out}/voz.wav"], check=True)
fv = ";".join(f"[0:v]trim={a:.3f}:{b:.3f},setpts=PTS-STARTPTS[v{k}]" for k, (a, b) in enumerate(segs))
fv += ";" + "".join(f"[v{k}]" for k in range(len(segs))) + \
    f"concat=n={len(segs)}:v=1:a=0,setpts=PTS/{vel},fps={TFPS},scale={RW}:{RH}:force_original_aspect_ratio=decrease,pad={RW}:{RH}:(ow-iw)/2:(oh-ih)/2[o]"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", E["video"], "-filter_complex", fv, "-map", "[o]", "-c:v", "libx264", "-crf", "18",
                "-preset", "fast", f"{out}/tela.mp4"], check=True)
d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"{out}/voz.wav"],
                         capture_output=True, text=True).stdout)
print(f"{len(segs)} trechos · intro de {d:.2f}s em {vel}x → {out}/voz.wav, tela.mp4")
