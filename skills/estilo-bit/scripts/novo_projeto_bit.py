"""Cria a pasta de um vídeo no estilo Bit, pronta para editar e renderizar com o HyperFrames.

uso: novo_projeto_bit.py <pasta_do_video> [--exemplo]

Copia o kit, cria index.html (o esqueleto, ou o Reels de exemplo com --exemplo), package.json e hyperframes.json.
Depois: coloque assets/trilha.wav (sons_bit.py), gere as legendas (legendas_bit.py) e rode
  npx --yes hyperframes@0.9.13 check   e   npx --yes hyperframes@0.9.13 render . --fps 30 --crf 14 -o work/raw.mp4
"""
import json
import os
import shutil
import sys

SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PIN = "hyperframes@0.9.13"


def main(argv):
    if len(argv) < 2:
        print(__doc__); return 1
    dst = os.path.abspath(argv[1])
    os.makedirs(os.path.join(dst, "assets"), exist_ok=True); os.makedirs(os.path.join(dst, "work"), exist_ok=True)
    shutil.copytree(os.path.join(SKILL, "kit"), os.path.join(dst, "kit"), dirs_exist_ok=True)
    idx = os.path.join(dst, "index.html")
    if os.path.exists(idx):
        print(f"index.html já existe em {dst}: não sobrescrevi")
    else:
        origem = "index.html" if "--exemplo" in argv else "base.html"
        shutil.copy(os.path.join(SKILL, "modelo", origem), idx)
        if "--exemplo" in argv:
            for f in ("sons.json", "chaves.txt", "corrigir.json"):
                shutil.copy(os.path.join(SKILL, "modelo", f), os.path.join(dst, f))
    nome = os.path.basename(dst.rstrip("/")).lower().replace(" ", "-")
    json.dump({"name": nome, "private": True, "type": "module",
               "scripts": {"dev": f"npx --yes {PIN} preview", "check": f"npx --yes {PIN} check", "render": f"npx --yes {PIN} render"}},
              open(os.path.join(dst, "package.json"), "w"), indent=2)
    json.dump({"$schema": "https://hyperframes.heygen.com/schema/hyperframes.json", "paths": {"assets": "assets"},
               "media": {"autoProxy": True}}, open(os.path.join(dst, "hyperframes.json"), "w"), indent=2)
    print(f"ok: {dst}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
