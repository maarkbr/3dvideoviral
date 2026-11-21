"""Analisa um vídeo de referência (o viral escolhido): baixa, transcreve e tira quadros, para o Claude entender a
sequência de problemas e soluções e as etapas da obra. Não copia nada: o roteiro e o 3D são feitos do zero.
uso: python referencia_3d.py <link do YouTube/TikTok/Instagram ou arquivo .mp4> <pasta_do_projeto> [--a-cada 3]
Saída em <projeto>/referencia/: video.mp4, transcricao.txt (com tempos), quadros-*.jpg (folhas de 12 quadros) e cortes.txt.
Precisa: yt-dlp, ffmpeg e faster-whisper."""
import os, subprocess, sys
import numpy as np

src, proj = sys.argv[1], os.path.abspath(sys.argv[2])
passo = float(sys.argv[sys.argv.index("--a-cada") + 1]) if "--a-cada" in sys.argv else 3.0
R = os.path.join(proj, "referencia"); os.makedirs(R, exist_ok=True)
vid = os.path.join(R, "video.mp4")
if os.path.exists(src):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-c", "copy", vid], check=True)
else:
    subprocess.run(["yt-dlp", "-q", "-f", "bv*[height<=720][ext=mp4]+ba[ext=m4a]/b[height<=720]/b", "--merge-output-format", "mp4",
                    "-o", vid, src], check=True)
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", vid],
                           capture_output=True, text=True).stdout)
# transcrição com tempo (idioma detectado sozinho)
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", vid, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True, check=True).stdout
from faster_whisper import WhisperModel
segs, info = WhisperModel("small", compute_type="int8").transcribe(np.frombuffer(raw, np.int16).astype(np.float32) / 32768)
with open(os.path.join(R, "transcricao.txt"), "w") as f:
    f.write(f"# idioma: {info.language} · duração: {dur:.1f}s\n")
    for s in segs: f.write(f"[{s.start:6.1f}–{s.end:6.1f}] {s.text.strip()}\n")
# trocas de cena
out = subprocess.run(["ffmpeg", "-v", "info", "-i", vid, "-vf", "select='gt(scene,0.3)',showinfo", "-an", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
cortes = [l.split("pts_time:")[1].split()[0] for l in out.splitlines() if "pts_time:" in l]
open(os.path.join(R, "cortes.txt"), "w").write(f"{len(cortes)} trocas de cena em {dur:.1f}s (uma a cada {dur / max(1, len(cortes)):.1f}s)\n" + " ".join(cortes) + "\n")
# folhas de quadros (12 por folha, um a cada `passo` segundos)
n = 0
for i in range(0, int(dur / passo) + 1, 12):
    t0 = i * passo
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t0}", "-i", vid, "-vf",
                    f"fps=1/{passo},scale=240:-1,tile=6x2", "-frames:v", "1", "-q:v", "6", os.path.join(R, f"quadros-{n:02d}.jpg")])
    n += 1
print(f"referência pronta em {R}: {dur:.0f}s, {len(cortes)} trocas de cena, {n} folhas de quadros, transcrição em {info.language}")
print("Agora: leia transcricao.txt e as folhas de quadros, anote a sequência de problemas/soluções e as etapas da obra,"
      " e escreva um roteiro NOVO em português (fatos pesquisados, palavras suas). Não copie texto nem imagens.")
