#!/usr/bin/env python3
"""Cria um projeto de vídeo motion (HyperFrames + GSAP).
uso: python novo_projeto_motion.py <pasta_do_projeto> [--exemplo]
  --exemplo: já vem com o roteiro do exemplo (o anúncio do Edição com IA) para estudar ou adaptar.
A marca vem do marca.json da pasta de trabalho (o painel preenche); imagens do cliente vão em assets/."""
import json, os, shutil, sys

SK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dest = os.path.abspath(sys.argv[1]); ex = "--exemplo" in sys.argv
for d in ("voz", "assets", "work", "Bruto"):
    os.makedirs(os.path.join(dest, d), exist_ok=True)
if os.path.isdir(os.path.join(dest, "kit")):
    shutil.rmtree(os.path.join(dest, "kit"))
shutil.copytree(os.path.join(SK, "kit"), os.path.join(dest, "kit"))
if ex or not os.path.exists(os.path.join(dest, "roteiro.json")):
    shutil.copy(os.path.join(SK, "modelo", "roteiro.json"), os.path.join(dest, "roteiro.json"))
json.dump({"name": os.path.basename(dest).lower().replace(" ", "-"), "private": True, "type": "module",
           "scripts": {"check": "npx --yes hyperframes@0.9.13 check", "render": "npx --yes hyperframes@0.9.13 render"},
           "devDependencies": {"@hyperframes/core": "^0.9.13"}}, open(os.path.join(dest, "package.json"), "w"), indent=2)
json.dump({"$schema": "https://hyperframes.heygen.com/schema/hyperframes.json",
           "registry": "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
           "paths": {"blocks": "compositions", "components": "compositions/components", "assets": "assets"},
           "media": {"autoProxy": True}, "authoringSkill": "general-video"}, open(os.path.join(dest, "hyperframes.json"), "w"), indent=2)
print("projeto criado em", dest, "| roteiro.json" + (" (exemplo)" if ex else ""))
