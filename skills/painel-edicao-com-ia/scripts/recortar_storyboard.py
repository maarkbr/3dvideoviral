#!/usr/bin/env python3
"""Recorta um storyboard (uma imagem com vários quadros, como os que a pessoa faz no ChatGPT ou no Canva) em um arquivo por quadro.

  python3 recortar_storyboard.py <imagem> <pasta de saída>            acha os quadros sozinho (corte por faixas)
  python3 recortar_storyboard.py <imagem> <pasta> --grade 6x2         divide em 6 colunas e 2 linhas iguais
  python3 recortar_storyboard.py <imagem ou .pdf> <pasta> --um        a imagem inteira é um quadro só (ou 1 página = 1 quadro)

Saída: quadro-01.png, quadro-02.png… (da esquerda para a direita, de cima para baixo) e quadros.json com a posição de cada um.
Só precisa de Python e do ffmpeg: nada de pacote extra. Quadros separados por uma margem de cor lisa (branca, cinza ou preta)
são achados sozinhos; se a margem não for lisa, use --grade.
"""
import argparse, json, os, subprocess, sys


def medidas(img):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", img],
                       capture_output=True, text=True, timeout=30)
    w, h = (int(x) for x in r.stdout.strip().split(",")[:2])
    return w, h


def planos(img, transpor=False):
    """Os três planos de cor (G, B, R), cada um em bytes, linha por linha. transpor=True devolve a imagem transposta (coluna vira linha)."""
    vf = ("transpose=0," if transpor else "") + "format=gbrp"
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", img, "-frames:v", "1", "-vf", vf, "-f", "rawvideo", "-"], capture_output=True, timeout=60)
    b = r.stdout
    n = len(b) // 3
    return b[:n], b[n:2 * n], b[2 * n:3 * n]


def fundo(pl, w, h):
    """A cor da margem: a mediana do contorno da imagem, em cada plano."""
    out = []
    for p in pl:
        borda = list(p[0:w]) + list(p[(h - 1) * w:h * w]) + [p[y * w] for y in range(h)] + [p[y * w + w - 1] for y in range(h)]
        borda.sort()
        out.append(borda[len(borda) // 2])
    return out


def mascara(pl, bg, limiar):
    """1 onde o pixel é diferente da margem em qualquer canal, 0 onde é margem. Tudo em bytes (rápido, sem laço por pixel)."""
    total = 0
    for p, b in zip(pl, bg):
        tab = bytes(1 if abs(v - b) > limiar else 0 for v in range(256))
        total |= int.from_bytes(p.translate(tab), "big")
    return total.to_bytes(len(pl[0]), "big")


def faixas(somas, minimo, vazio):
    """Trechos seguidos onde a soma passa de 'vazio', com pelo menos 'minimo' de tamanho: [(início, fim)]."""
    out, ini = [], None
    for i, s in enumerate(list(somas) + [0]):
        if s > vazio and ini is None:
            ini = i
        elif s <= vazio and ini is not None:
            if i - ini >= minimo:
                out.append((ini, i))
            ini = None
    return out


def acha_quadros(img, limiar=18):
    w, h = medidas(img)
    pl, plt = planos(img), planos(img, transpor=True)
    bg = fundo(pl, w, h)
    m, mt = mascara(pl, bg, limiar), mascara(plt, bg, limiar)  # mt: transposta (linha x = coluna x da original)
    linhas = [sum(m[y * w:(y + 1) * w]) for y in range(h)]
    quadros = []
    for y0, y1 in faixas(linhas, max(8, int(h * 0.05)), max(2, int(w * 0.004))):
        cols = [sum(mt[x * h + y0:x * h + y1]) for x in range(w)]
        for x0, x1 in faixas(cols, max(8, int(w * 0.03)), max(2, int((y1 - y0) * 0.01))):
            # aperta em cima e embaixo: dentro da faixa, cada quadro pode ser mais baixo que o vizinho
            ls = [sum(m[y * w + x0:y * w + x1]) for y in range(y0, y1)]
            fx = faixas(ls, 1, max(1, int((x1 - x0) * 0.01)))
            ya, yb = (y0 + fx[0][0], y0 + fx[-1][1]) if fx else (y0, y1)
            quadros.append((x0, ya, x1 - x0, yb - ya))
    return w, h, bg, quadros


def grade(img, spec):
    w, h = medidas(img)
    c, l = (int(x) for x in spec.lower().split("x"))
    return w, h, [(round(i * w / c), round(j * h / l), round((i + 1) * w / c) - round(i * w / c), round((j + 1) * h / l) - round(j * h / l))
                  for j in range(l) for i in range(c)]


def recorta(img, pasta, caixas):
    os.makedirs(pasta, exist_ok=True)
    lista = []
    for n, (x, y, cw, ch) in enumerate(caixas, 1):
        nome = f"quadro-{n:02d}.png"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", img, "-frames:v", "1", "-vf", f"crop={cw}:{ch}:{x}:{y}", os.path.join(pasta, nome)],
                       capture_output=True, timeout=60, check=True)
        lista.append({"n": n, "arquivo": nome, "x": x, "y": y, "largura": cw, "altura": ch})
    return lista


def main():
    ap = argparse.ArgumentParser(description="Recorta um storyboard em um arquivo por quadro.")
    ap.add_argument("imagem"); ap.add_argument("pasta")
    ap.add_argument("--grade", help="colunas x linhas, ex.: 6x2")
    ap.add_argument("--um", action="store_true", help="a imagem inteira (ou cada página do PDF) é um quadro")
    ap.add_argument("--limiar", type=int, default=18, help="o quanto um pixel precisa fugir da cor da margem (padrão 18)")
    a = ap.parse_args()
    img = os.path.abspath(os.path.expanduser(a.imagem))
    if not os.path.isfile(img):
        sys.exit(f"não achei a imagem: {img}")
    pasta = os.path.abspath(os.path.expanduser(a.pasta))
    if img.lower().endswith(".pdf"):
        os.makedirs(pasta, exist_ok=True)
        r = subprocess.run(["pdftoppm", "-png", "-r", "150", img, os.path.join(pasta, "pagina")], capture_output=True)
        if r.returncode != 0:
            sys.exit("para PDF, preciso do pdftoppm (poppler). Peça à pessoa a imagem do storyboard, ou exporte as páginas como PNG.")
        paginas = sorted(f for f in os.listdir(pasta) if f.startswith("pagina") and f.endswith(".png"))
        if a.um or len(paginas) > 1:
            lista = []
            for n, p in enumerate(paginas, 1):
                novo = f"quadro-{n:02d}.png"; os.replace(os.path.join(pasta, p), os.path.join(pasta, novo))
                lista.append({"n": n, "arquivo": novo})
            json.dump({"origem": img, "quadros": lista}, open(os.path.join(pasta, "quadros.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
            return print(f"{len(lista)} quadros (1 por página) em {pasta}")
        img = os.path.join(pasta, paginas[0])
    if a.um:
        w, h = medidas(img); caixas, bg = [(0, 0, w, h)], None
    elif a.grade:
        w, h, caixas = grade(img, a.grade); bg = None
    else:
        w, h, bg, caixas = acha_quadros(img, a.limiar)
    lista = recorta(img, pasta, caixas)
    json.dump({"origem": img, "largura": w, "altura": h, "margem": bg, "quadros": lista}, open(os.path.join(pasta, "quadros.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print(f"{len(lista)} quadro(s) em {pasta}")
    if len(lista) == 1 and not (a.um or a.grade):
        print("ATENÇÃO: achei um quadro só. Se for uma grade, rode de novo com --grade <colunas>x<linhas> (ex.: --grade 6x2).")


if __name__ == "__main__":
    main()
