"""Transforma uma gravação só de voz em vídeo vertical, para seguir o fluxo normal de corte.

uso: so_voz.py <voz.(m4a|mp3|wav|mov)> <saida.mp4> [--fundo imagem.png]

Sem --fundo, usa um fundo escuro liso (1080x1920, 30 fps). O vídeo serve só de base para o corte:
na edição, as cenas cobrem a tela inteira.
"""
import subprocess
import sys


def main(argv):
    if len(argv) < 3:
        print(__doc__); return 1
    src, out = argv[1], argv[2]
    if "--fundo" in argv:
        img = argv[argv.index("--fundo") + 1]
        entrada = ["-loop", "1", "-framerate", "30", "-i", img]
        filtro = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p"
    else:
        entrada = ["-f", "lavfi", "-i", "color=c=0x0A0B0E:s=1080x1920:r=30"]
        filtro = "format=yuv420p"
    cmd = ["ffmpeg", "-y", "-loglevel", "error", *entrada, "-i", src, "-map", "0:v", "-map", "1:a",
           "-vf", filtro, "-c:v", "libx264", "-crf", "20", "-tune", "stillimage", "-c:a", "aac", "-b:a", "256k",
           "-ar", "48000", "-shortest", out]
    r = subprocess.run(cmd)
    if r.returncode == 0:
        print(f"ok: {out}")
    return r.returncode


if __name__ == "__main__":
    sys.exit(main(sys.argv))
