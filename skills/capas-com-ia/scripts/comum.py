"""Peças comuns dos scripts de capa: achar o ffmpeg, a pasta de trabalho e o tamanho de cada formato."""
import os
import shutil
import subprocess
import sys

FORMATOS = {"9:16": (1080, 1920), "16:9": (1280, 720)}
AQUI = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.dirname(AQUI)


def pasta_de_trabalho(*pontos):
    """Sobe a partir de cada ponto até achar a pasta que tem _ferramentas/ (a pasta de trabalho do Edição com IA)."""
    for p in list(pontos) + [os.getcwd()]:
        p = os.path.abspath(p or ".")
        if os.path.isfile(p):
            p = os.path.dirname(p)
        while True:
            if os.path.isdir(os.path.join(p, "_ferramentas")):
                return p
            cima = os.path.dirname(p)
            if cima == p:
                break
            p = cima
    return None


def ffmpeg(nome="ffmpeg"):
    c = shutil.which(nome)
    if not c:
        sys.exit(f"Não achei o {nome}. Ele vem com os estilos do painel; peça ao Claude para instalar.")
    return c


def duracao(video):
    r = subprocess.run([ffmpeg("ffprobe"), "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video],
                       capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except ValueError:
        sys.exit("Não consegui ler esse vídeo. Ele abre num player?")


def cobre(img, largura, altura):
    """Redimensiona e corta a imagem para preencher largura x altura (como o 'cover' do CSS)."""
    from PIL import Image
    esc = max(largura / img.width, altura / img.height)
    img = img.resize((max(largura, round(img.width * esc)), max(altura, round(img.height * esc))), Image.LANCZOS)
    x, y = (img.width - largura) // 2, (img.height - altura) // 2
    return img.crop((x, y, x + largura, y + altura))
