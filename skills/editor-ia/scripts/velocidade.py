"""Acelera (ou desacelera) um vídeo sem mudar o tom da voz.

uso: velocidade.py <entrada.mp4> <saida.mp4> [--fator 1.2]

Rode depois do corte (e da voz limpa) e antes da transcrição do corte: os tempos das legendas
precisam ser os do vídeo já acelerado. Fator entre 0.5 e 2.0.
"""
import subprocess
import sys


def main(argv):
    if len(argv) < 3:
        print(__doc__); return 1
    src, out = argv[1], argv[2]
    fator = float(argv[argv.index("--fator") + 1]) if "--fator" in argv else 1.2
    if not 0.5 <= fator <= 2.0:
        print("fator precisa ficar entre 0.5 e 2.0"); return 1
    tem_video = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=index",
                                "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip() != ""
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", src]
    if tem_video:
        cmd += ["-filter_complex", f"[0:v]setpts=PTS/{fator}[v];[0:a]atempo={fator}[a]", "-map", "[v]", "-map", "[a]",
                "-c:v", "libx264", "-crf", "16", "-preset", "medium"]
    else:
        cmd += ["-af", f"atempo={fator}"]
    cmd += ["-c:a", "aac", "-b:a", "256k", out]
    r = subprocess.run(cmd)
    if r.returncode == 0:
        print(f"ok: {out} ({fator}x)")
    return r.returncode


if __name__ == "__main__":
    sys.exit(main(sys.argv))
