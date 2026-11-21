"""Capa simples (grátis, sem gerador de imagem): um quadro do vídeo em destaque, o fundo desfocado e o título grande.

uso: python capa_simples.py <saida.jpg> --formato 9:16|16:9 --texto "FIZ ESSE VÍDEO *3D* SEM SABER ANIMAR" --quadro <img> [--cor #F2C200]
  --texto: o que vai escrito; as palavras entre *asteriscos* ficam na cor da marca.
  --quadro: um quadro do vídeo (saia do quadros.py) ou uma foto/print.
  --cor: a cor de destaque (o "acento" do marca.json). Padrão: #F2C200.
No vertical, tudo fica entre 14% e 84% da altura (o perfil corta a capa em 3:4). No 16:9, o canto de baixo à direita fica livre (a duração do vídeo aparece ali).
"""
import argparse
import os
import re

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from comum import FORMATOS, SKILL, cobre

FONTE = os.path.join(SKILL, "fontes", "Anton-Regular.ttf")


def palavras(texto):
    """[(palavra, destaque)] a partir de 'FIZ ESSE *VÍDEO 3D*'."""
    out, dest = [], False
    for p in texto.upper().split():
        abre, fecha = p.startswith("*"), p.endswith("*") and len(p.strip("*")) > 0
        limpo = p.strip("*")
        if not limpo:
            dest = not dest
            continue
        if abre:
            dest = True
        out.append((limpo, dest))
        if fecha:
            dest = False
    return out


def quebra(ws, fonte, largura):
    linhas, atual = [], []
    for w in ws:
        teste = atual + [w]
        if atual and fonte.getlength(" ".join(x for x, _ in teste)) > largura:
            linhas.append(atual)
            atual = [w]
        else:
            atual = teste
    if atual:
        linhas.append(atual)
    return linhas


def cabe(ws, largura, altura_max, maior, menor, max_linhas):
    for tam in range(maior, menor - 1, -4):
        f = ImageFont.truetype(FONTE, tam)
        ls = quebra(ws, f, largura)
        if len(ls) <= max_linhas and len(ls) * tam * 1.02 <= altura_max:
            return f, tam, ls
    f = ImageFont.truetype(FONTE, menor)
    return f, menor, quebra(ws, f, largura)


def escreve(img, linhas, fonte, tam, x0, y0, largura, cor, centro=True):
    """Desenha as linhas com sombra suave; devolve o y do fim."""
    sombra = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ds, d = ImageDraw.Draw(sombra), ImageDraw.Draw(img)
    passo = round(tam * 1.02)
    for k, linha in enumerate(linhas):
        txt = " ".join(w for w, _ in linha)
        lw = fonte.getlength(txt)
        x = x0 + (largura - lw) / 2 if centro else x0
        y = y0 + k * passo
        for w, dest in linha:
            ds.text((x + 4, y + 8), w, font=fonte, fill=(0, 0, 0, 200))
            x += fonte.getlength(w + " ")
    img.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(10)))
    for k, linha in enumerate(linhas):
        txt = " ".join(w for w, _ in linha)
        lw = fonte.getlength(txt)
        x = x0 + (largura - lw) / 2 if centro else x0
        y = y0 + k * passo
        for w, dest in linha:
            d.text((x, y), w, font=fonte, fill=cor if dest else (255, 255, 255))
            x += fonte.getlength(w + " ")
    return y0 + len(linhas) * passo


def cartao(img, quadro, caixa, cor):
    """O quadro do vídeo como um cartão de cantos redondos, com borda e brilho da cor da marca atrás."""
    x0, y0, x1, y1 = [round(v) for v in caixa]
    w, h = x1 - x0, y1 - y0
    raio = round(min(w, h) * 0.07)
    brilho = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(brilho).rounded_rectangle((x0 - 30, y0 - 30, x1 + 30, y1 + 30), raio + 30, fill=cor + (120,))
    img.alpha_composite(brilho.filter(ImageFilter.GaussianBlur(60)))
    sombra = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sombra).rounded_rectangle((x0 + 10, y0 + 24, x1 + 10, y1 + 24), raio, fill=(0, 0, 0, 170))
    img.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(22)))
    foto = cobre(quadro, w, h).convert("RGBA")
    mascara = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mascara).rounded_rectangle((0, 0, w - 1, h - 1), raio, fill=255)
    img.paste(foto, (x0, y0), mascara)
    ImageDraw.Draw(img).rounded_rectangle((x0, y0, x1, y1), raio, outline=(20, 20, 24, 255), width=8)
    ImageDraw.Draw(img).rounded_rectangle((x0 + 4, y0 + 4, x1 - 4, y1 - 4), raio - 4, outline=(255, 255, 255, 60), width=2)


def fundo(quadro, w, h, cor):
    bg = cobre(quadro, w, h).filter(ImageFilter.GaussianBlur(34))
    bg = Image.blend(bg, Image.new("RGB", (w, h), (8, 8, 10)), 0.62).convert("RGBA")
    luz = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(luz).ellipse((w * 0.1, h * 0.25, w * 0.9, h * 0.85), fill=cor + (70,))
    bg.alpha_composite(luz.filter(ImageFilter.GaussianBlur(min(w, h) * 0.18)))
    vinheta = Image.new("L", (w, h), 0)
    ImageDraw.Draw(vinheta).ellipse((-w * 0.25, -h * 0.15, w * 1.25, h * 1.15), fill=255)
    escuro = Image.new("RGBA", (w, h), (0, 0, 0, 150))
    bg.paste(escuro, (0, 0), Image.eval(vinheta.filter(ImageFilter.GaussianBlur(min(w, h) * 0.12)), lambda v: 255 - v))
    return bg


def main():
    ap = argparse.ArgumentParser(description="Capa simples (grátis)")
    ap.add_argument("saida")
    ap.add_argument("--formato", choices=sorted(FORMATOS), required=True)
    ap.add_argument("--texto", required=True)
    ap.add_argument("--quadro", required=True)
    ap.add_argument("--cor", default="#F2C200")
    a = ap.parse_args()
    if not re.fullmatch(r"#[0-9A-Fa-f]{6}", a.cor):
        raise SystemExit("A cor precisa ser no formato #RRGGBB.")
    cor = tuple(int(a.cor[i:i + 2], 16) for i in (1, 3, 5))
    ws = palavras(a.texto)
    if not ws:
        raise SystemExit("Falta o texto da capa.")
    if not any(d for _, d in ws):  # sem destaque marcado: a última palavra fica na cor
        ws[-1] = (ws[-1][0], True)
    q = Image.open(a.quadro).convert("RGB")
    W, H = FORMATOS[a.formato]
    img = fundo(q, W, H, cor)
    if a.formato == "9:16":
        f, tam, ls = cabe(ws, W - 120, 560, 200, 110, 4)
        fim = escreve(img, ls, f, tam, 60, round(H * 0.145), W - 120, cor)
        topo, base = fim + 36, H * 0.84
        alt = base - topo
        larg = min(W - 160, alt * q.width / q.height)
        alt = larg * q.height / q.width
        x0 = (W - larg) / 2
        cartao(img, q, (x0, topo, x0 + larg, topo + alt), cor)
    else:
        deitado = q.width >= q.height
        if deitado:
            larg = 600; alt = larg * q.height / q.width
        else:
            alt = 580; larg = alt * q.width / q.height
        x1, y0 = W - 70, (H - alt) / 2 - 20
        cartao(img, q, (x1 - larg, y0, x1, y0 + alt), cor)
        area = W - larg - 70 - 60 - 60
        f, tam, ls = cabe(ws, area, H - 160, 150, 70, 3)
        altura = len(ls) * round(tam * 1.02)
        escreve(img, ls, f, tam, 60, (H - altura) / 2 - 10, area, cor, centro=False)
    os.makedirs(os.path.dirname(os.path.abspath(a.saida)), exist_ok=True)
    img.convert("RGB").save(a.saida, quality=92)
    print(f"ok: {a.saida} ({W}x{H})")


if __name__ == "__main__":
    main()
