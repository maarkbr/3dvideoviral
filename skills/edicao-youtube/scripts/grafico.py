"""Gráficos estáticos na identidade do canal, em PNG 1920x1080 (transparente quando faz sentido), para pôr como
"cenas" no plano. O CapCut anima com o pop/respiro do montar.py, e o Lucas consegue trocar fácil.

uso ($PY = Python com Pillow):
  $PY grafico.py cartao  SAIDA.png --titulo "PASSO 1" --sub "gerar as cenas" [--destaque "1"] [--fundo escuro|claro]
  $PY grafico.py nome    SAIDA.png --titulo "KLING 4.0" --destaque "4.0" [--pilula "a nova IA de vídeo"]
  $PY grafico.py pilula  SAIDA.png --titulo "link na descrição" [--y 0.62]        (transparente)
  $PY grafico.py palavra SAIDA.png --titulo "simples" [--destaque simples]        (transparente, palavra gigante)
  $PY grafico.py anel    SAIDA.png --caixa x0 y0 x1 y1                            (transparente; caixa em 0..1)
  $PY grafico.py escurecer SAIDA.png [--alfa 0.55]                                 (transparente, escurece a tela)
  $PY grafico.py logo    SAIDA.png --imagem logo.png --titulo "CapCut" [--fundo escuro|claro]
Use "cheia" (escala 1) no plano para os de tela inteira e transparentes; "palavra"/"pilula" ficam por cima da tela.
"""
import argparse, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONTE = os.path.join(os.path.dirname(__file__), "..", "assets", "fonts", "Montserrat-VF.ttf")
W, H = 1920, 1080
PRETO, CREME, AMARELO, CARD, BRANCO = (10, 10, 11), (241, 240, 236), (255, 196, 0), (22, 22, 26), (245, 243, 238)

ap = argparse.ArgumentParser()
ap.add_argument("tipo")
ap.add_argument("saida")
ap.add_argument("--titulo", default="")
ap.add_argument("--sub", default="")
ap.add_argument("--destaque", default="")
ap.add_argument("--pilula", default="")
ap.add_argument("--fundo", default="escuro")
ap.add_argument("--imagem")
ap.add_argument("--caixa", nargs=4, type=float)
ap.add_argument("--alfa", type=float, default=0.55)
ap.add_argument("--y", type=float, default=0.5)
a = ap.parse_args()


def fonte(px, peso=900):
    f = ImageFont.truetype(FONTE, px)
    f.set_variation_by_axes([peso])
    return f


def fundo(tipo):
    claro = tipo == "claro"
    im = Image.new("RGBA", (W, H), CREME + (255,) if claro else PRETO + (255,))
    d = ImageDraw.Draw(im)
    linha = (0, 0, 0, 18) if claro else (255, 255, 255, 10)
    for x in range(W // 2 % 96, W, 96):
        d.line([(x, 0), (x, H)], fill=linha, width=1)
    for y in range(H // 2 % 96, H, 96):
        d.line([(0, y), (W, y)], fill=linha, width=1)
    vin = Image.new("L", (W, H), 0)
    dv = ImageDraw.Draw(vin)
    dv.ellipse([-W * 0.25, -H * 0.35, W * 1.25, H * 1.35], fill=255)
    vin = vin.filter(ImageFilter.GaussianBlur(220))
    escuro = Image.new("RGBA", (W, H), (0, 0, 0, 46 if claro else 190))
    im = Image.composite(im, Image.alpha_composite(im, escuro), vin)
    return im


def texto_misto(d, cx, y, txt, px, cor, destaque, peso=900, caixa=False):
    """Escreve txt centrado em cx; o trecho 'destaque' em amarelo (ou numa caixa amarela, se caixa=True)."""
    while px > 24 and fonte(px, peso).getlength(txt) > W * 0.86:   # cabe na largura
        px = int(px * 0.92)
    f = fonte(px, peso)
    partes = []
    if destaque and destaque.lower() in txt.lower():
        i = txt.lower().index(destaque.lower())
        partes = [(txt[:i], False), (txt[i:i + len(destaque)], True), (txt[i + len(destaque):], False)]
    else:
        partes = [(txt, False)]
    larg = sum(f.getlength(p) for p, _ in partes)
    x = cx - larg / 2
    for p, dest in partes:
        if not p:
            continue
        w = f.getlength(p)
        if dest and caixa:
            d.rounded_rectangle([x - px * 0.22, y - px * 0.08, x + w + px * 0.22, y + px * 1.12], radius=px * 0.2, fill=AMARELO)
            d.text((x, y), p, font=f, fill=(17, 17, 17))
        else:
            d.text((x, y), p, font=f, fill=AMARELO if dest else cor)
        x += w


def pilula(d, cx, cy, txt, px=54, girar=False):
    f = fonte(px, 900)
    w = f.getlength(txt)
    caixa = [cx - w / 2 - px * 0.6, cy - px * 0.75, cx + w / 2 + px * 0.6, cy + px * 0.75]
    d.rounded_rectangle(caixa, radius=px * 0.28, fill=AMARELO)
    d.text((cx - w / 2, cy - px * 0.62), txt, font=f, fill=(0, 0, 0))


t = a.tipo
if t in ("cartao", "nome"):
    im = fundo(a.fundo)
    d = ImageDraw.Draw(im)
    cor = (17, 17, 17) if a.fundo == "claro" else BRANCO
    if t == "cartao":
        texto_misto(d, W / 2, 360, a.titulo, 150, cor, a.destaque, caixa=a.fundo == "claro")
        if a.sub:
            texto_misto(d, W / 2, 580, a.sub, 64, cor, "", peso=700)
    else:
        texto_misto(d, W / 2, 330, a.titulo, 210, cor, a.destaque, caixa=a.fundo == "claro")
        if a.pilula:
            pilula(d, W / 2, 660, a.pilula)
elif t == "pilula":
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pilula(ImageDraw.Draw(im), W / 2, H * a.y, a.titulo, px=62)
elif t == "palavra":
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sombra = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    texto_misto(ImageDraw.Draw(sombra), W / 2, H * a.y - 110, a.titulo, 220, (0, 0, 0, 200), "")
    im = Image.alpha_composite(im, sombra.filter(ImageFilter.GaussianBlur(18)))
    texto_misto(ImageDraw.Draw(im), W / 2, H * a.y - 110, a.titulo, 220, BRANCO, a.destaque)
elif t == "anel":
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    x0, y0, x1, y1 = a.caixa
    ImageDraw.Draw(im).rounded_rectangle([x0 * W, y0 * H, x1 * W, y1 * H], radius=40, outline=AMARELO, width=7)
elif t == "escurecer":
    im = Image.new("RGBA", (W, H), (0, 0, 0, int(255 * a.alfa)))
elif t == "logo":
    im = fundo(a.fundo)
    lg = Image.open(a.imagem).convert("RGBA")
    lado = 380
    lg.thumbnail((lado, lado), Image.LANCZOS)
    im.alpha_composite(lg, (int(W / 2 - lg.width / 2), int(H / 2 - lg.height / 2 - 70)))
    if a.titulo:
        cor = (17, 17, 17) if a.fundo == "claro" else BRANCO
        texto_misto(ImageDraw.Draw(im), W / 2, H / 2 + lado / 2 - 20, a.titulo, 72, cor, a.destaque, peso=800)
else:
    raise SystemExit(f"tipo desconhecido: {t}")
os.makedirs(os.path.dirname(os.path.abspath(a.saida)), exist_ok=True)
im.save(a.saida)
print(a.saida)
