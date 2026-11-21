# Mistura voz + música + efeitos e entrega o master em -14 LUFS (pico até -1 dB).
#
# Uso: PY ferramentas/mixar.py <pasta do projeto> [voz] [--musica <trilha do pack>]   (voz em assets/audio; padrão narracao.wav)
#   --musica: usa uma trilha do pack de edições no lugar da música feita em código (cortada na duração, com fade no fim)
# Gera assets/audio/mix.wav (48 kHz, estéreo), que é o som do vídeo.
import os, re, subprocess, sys

GANHO_MUSICA = -11  # dB: música bem baixinha por baixo da voz
GANHO_EFEITOS = -8  # dB: efeitos presentes sem brigar com a voz
ALVO = -14.0  # LUFS

args = sys.argv[1:]
MUSICA_PACK = None
if "--musica" in args:
    k = args.index("--musica"); MUSICA_PACK = os.path.abspath(os.path.expanduser(args[k + 1])); del args[k:k + 2]
PASTA = args[0]
A = os.path.join(PASTA, "assets/audio")
VOZ = os.path.join(A, args[1] if len(args) > 1 else "narracao.wav")
if MUSICA_PACK:
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", VOZ]).decode())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", MUSICA_PACK, "-t", f"{d:.3f}", "-af",
                    f"afade=t=in:d=0.4,afade=t=out:st={max(0, d - 2):.3f}:d=2", "-ar", "48000", "-ac", "2",
                    os.path.join(A, "musica.wav")], check=True)
    print("música: a trilha do pack (", os.path.basename(MUSICA_PACK), ")")


def medir(arquivo):
    s = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", arquivo, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    i = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", s)[-1])
    pico = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", s)[-1])
    return i, pico


bruto = os.path.join(A, "mix_bruto.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", VOZ, "-i", os.path.join(A, "musica.wav"), "-i", os.path.join(A, "efeitos.wav"), "-filter_complex",
                f"[0:a]aresample=48000[v];[1:a]aresample=48000,volume={GANHO_MUSICA}dB[m];[2:a]aresample=48000,volume={GANHO_EFEITOS}dB[e];[v][m][e]amix=inputs=3:normalize=0:duration=first[o]",
                "-map", "[o]", "-ac", "2", "-ar", "48000", bruto], check=True)
i, _ = medir(bruto)
ganho = round(ALVO - i, 2)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", bruto, "-af", f"volume={ganho}dB,alimiter=limit=0.8:level=false:attack=3:release=60", "-ar", "48000", os.path.join(A, "mix.wav")], check=True)
os.remove(bruto)
i2, pico = medir(os.path.join(A, "mix.wav"))
print(f"mix.wav: {i2} LUFS, pico {pico} dB (bruto {i} LUFS, ganho {ganho} dB)")
