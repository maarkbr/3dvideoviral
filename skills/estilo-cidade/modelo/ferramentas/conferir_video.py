# Confere o vídeo pronto e termina em APROVADO ou REPROVADO.
#
# Uso: PY ferramentas/conferir_video.py <pasta do projeto> [video] [fps]
#   padrão: render/<nome do projeto>.mp4 e 60 fps
# Confere: formato 1080x1920, fps, duração igual à do som, -14 LUFS (±1), pico até -1 dB,
# nenhum trecho preto, nenhuma imagem congelada, som alinhado e grava uma folha de quadros.
import os, re, subprocess, sys

PASTA = sys.argv[1].rstrip("/")
VIDEO = sys.argv[2] if len(sys.argv) > 2 else os.path.join(PASTA, "render", os.path.basename(PASTA) + ".mp4")
FPS = int(sys.argv[3]) if len(sys.argv) > 3 else 60
MIX = os.path.join(PASTA, "assets/audio/mix.wav")


def rodar(*args):
    return subprocess.run(args, capture_output=True, text=True)


def ffmpeg_err(*args):
    return rodar("ffmpeg", "-hide_banner", "-nostats", *args).stderr


problemas = []
info = rodar("ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate:format=duration", "-of", "default=nw=1", VIDEO).stdout
w = int(re.search(r"width=(\d+)", info).group(1))
h = int(re.search(r"height=(\d+)", info).group(1))
fps = eval(re.search(r"r_frame_rate=(\d+/\d+)", info).group(1))
dur = float(re.search(r"duration=([\d.]+)", info).group(1))
tem_som = "codec_type=audio" in info
print(f"formato: {w}x{h}, {fps:g} fps, {dur:.2f} s, som: {'sim' if tem_som else 'NÃO'}")
if (w, h) != (1080, 1920):
    problemas.append("tamanho não é 1080x1920")
if abs(fps - FPS) > 0.01:
    problemas.append(f"fps {fps:g} (esperado {FPS})")
if not tem_som:
    problemas.append("vídeo sem som")

dur_mix = float(rodar("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", MIX).stdout)
print(f"duração do som (mix.wav): {dur_mix:.2f} s")
if abs(dur - dur_mix) > 0.15:
    problemas.append("duração do vídeo diferente da do som")

s = ffmpeg_err("-i", VIDEO, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-")
lufs = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", s)[-1])
pico = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", s)[-1])
print(f"volume: {lufs} LUFS, pico {pico} dB")
if abs(lufs + 14) > 1:
    problemas.append(f"volume {lufs} LUFS (alvo -14)")
if pico > -0.9:
    problemas.append(f"pico {pico} dB (limite -1)")

pretos = ffmpeg_err("-i", VIDEO, "-an", "-vf", "blackdetect=d=0.2:pix_th=0.08", "-f", "null", "-").count("black_start")
congelados = ffmpeg_err("-i", VIDEO, "-an", "-vf", "freezedetect=n=0.002:d=1.5", "-f", "null", "-").count("freeze_start")
print(f"trechos pretos: {pretos} | imagens congeladas (mais de 1,5 s): {congelados}")
if pretos:
    problemas.append("tem trecho preto")
if congelados:
    problemas.append("tem imagem congelada")


def primeiro_som(arq):
    s = ffmpeg_err("-i", arq, "-vn", "-af", "silencedetect=noise=-45dB:d=0.02", "-f", "null", "-")
    m = re.search(r"silence_end: ([\d.]+)", s)
    return float(m.group(1)) if m else 0.0


a, b = primeiro_som(VIDEO), primeiro_som(MIX)
print(f"sincronia: o som começa em {a:.3f} s no vídeo e {b:.3f} s no mix")
if abs(a - b) > 0.02:
    problemas.append("som desalinhado")

folha = os.path.join(os.path.dirname(VIDEO), "folha-video.jpg")
passo = max(1.0, dur / 24)
rodar("ffmpeg", "-v", "error", "-y", "-i", VIDEO, "-vf", f"fps=1/{passo:.3f},scale=200:-2,tile=8x3:padding=4:color=white", "-frames:v", "1", "-q:v", "3", folha)
print("folha de quadros:", folha, "(abra e olhe antes de entregar)")
print("APROVADO" if not problemas else "REPROVADO: " + "; ".join(problemas))
