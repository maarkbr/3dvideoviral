"""Resolução de entrega: QUEM EDITA ESCOLHE (pergunta do passo 1, gravada em trabalho/job.json → "resolucao").

  fullhd / 1080 → 1920x1080   (mais leve; o MÍNIMO — HD 720p não entra, fica ruim)
  2k / 1440     → 2560x1440   (o YouTube usa o codec melhor a partir de 1440p: tela mais nítida mesmo vista em 1080p)
  4k / 2160     → 3840x2160   (o mais pesado; amplia a gravação se ela for menor que 4K)

Sem escolha: Full HD. O fps vem da gravação (≥ 50 → 60; senão 30), a não ser que passem --fps.
Intro em HyperFrames: Full HD → `--resolution landscape`; 2K e 4K → `--resolution landscape-4k` (não há preset 1440:
renderize em 4K e o Premiere reduz). CapCut: o projeto fica 16:9 e a resolução se escolhe na exportação (1080p/2K/4K).
"""
import json, os, sys

RES = {"1080": (1920, 1080), "fullhd": (1920, 1080), "full hd": (1920, 1080), "1920x1080": (1920, 1080),
       "1440": (2560, 1440), "2k": (2560, 1440), "2560x1440": (2560, 1440), "qhd": (2560, 1440),
       "2160": (3840, 2160), "4k": (3840, 2160), "3840x2160": (3840, 2160), "uhd": (3840, 2160)}
NOME = {1080: "Full HD (1080p)", 1440: "2K (1440p)", 2160: "4K (2160p)"}


def resolucao(valor=None, wd=None):
    """(largura, altura) a partir da escolha; sem escolha, procura em wd/job.json; senão Full HD."""
    if not valor and wd and os.path.exists(os.path.join(wd, "job.json")):
        valor = json.load(open(os.path.join(wd, "job.json"))).get("resolucao")
    v = str(valor or "1080").strip().lower().removesuffix("p")
    if v not in RES:
        if v.isdigit() and int(v) < 1080:
            sys.exit(f"resolução {valor}: o mínimo é Full HD (1080p) — HD 720p fica ruim")
        sys.exit(f"resolução {valor} desconhecida: use fullhd, 2k ou 4k")
    return RES[v]


def preset_hf(altura):
    return "landscape" if altura <= 1080 else "landscape-4k"
