"""Tira quadros de um vídeo para escolher o que entra na capa.

uso: python quadros.py <video> <pasta de saída> [--n 12]
Salva q01.jpg, q02.jpg… no tamanho cheio e quadros.jpg, uma folha com todos numerados (olhe a folha e escolha 2 ou 3).
Pula quadro quase preto (fade) e quadro repetido.
"""
import argparse
import os
import subprocess

from PIL import Image, ImageDraw, ImageStat

from comum import duracao, ffmpeg


def quadro(video, t, saida):
    subprocess.run([ffmpeg(), "-nostdin", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", video, "-frames:v", "1", "-q:v", "2", saida], check=True)
    return Image.open(saida).convert("RGB")


def main():
    ap = argparse.ArgumentParser(description="Quadros de um vídeo para a capa")
    ap.add_argument("video")
    ap.add_argument("pasta")
    ap.add_argument("--n", type=int, default=12)
    a = ap.parse_args()
    os.makedirs(a.pasta, exist_ok=True)
    dur = duracao(a.video)
    n = max(4, min(a.n, 24))
    feitos, anterior = [], None
    for i in range(n):
        t = (i + 0.5) / n * dur
        nome = os.path.join(a.pasta, f"q{len(feitos) + 1:02d}.jpg")
        img = None
        for passo in (0, 0.6, -0.6, 1.2):  # fade ou quadro igual ao anterior: anda um pouco
            tt = min(max(t + passo, 0), max(dur - 0.05, 0))
            img = quadro(a.video, tt, nome)
            pequeno = img.convert("L").resize((48, 48))
            claro = ImageStat.Stat(pequeno).mean[0] > 14
            novo = anterior is None or sum(abs(x - y) for x, y in zip(pequeno.tobytes(), anterior.tobytes())) / 2304 > 4
            if claro and novo:
                break
        anterior = img.convert("L").resize((48, 48))
        feitos.append((nome, t))
    # folha
    primeiro = Image.open(feitos[0][0])
    deitado = primeiro.width > primeiro.height
    lw = 320 if deitado else 240
    lh = round(lw * primeiro.height / primeiro.width)
    cols = 4 if deitado else 6
    linhas = (len(feitos) + cols - 1) // cols
    folha = Image.new("RGB", (cols * lw, linhas * (lh + 34)), (17, 17, 20))
    d = ImageDraw.Draw(folha)
    for k, (nome, t) in enumerate(feitos):
        x, y = (k % cols) * lw, (k // cols) * (lh + 34)
        folha.paste(Image.open(nome).convert("RGB").resize((lw, lh)), (x, y))
        d.text((x + 8, y + lh + 8), f"q{k + 1:02d}  {t:.1f}s", fill=(240, 240, 240))
    folha.save(os.path.join(a.pasta, "quadros.jpg"), quality=88)
    print(f"{len(feitos)} quadros em {a.pasta} (folha: quadros.jpg)")


if __name__ == "__main__":
    main()
