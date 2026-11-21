"""Cria um projeto de vídeo 3D em código (HyperFrames + Three.js).
uso: python novo_projeto_3d.py <pasta_do_projeto> [--exemplo]
  --exemplo: já vem com o bunker completo (cena.js + roteiro.json) para estudar ou adaptar."""
import json, os, shutil, sys
SK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dest = os.path.abspath(sys.argv[1]); ex = "--exemplo" in sys.argv
for d in ("voz", "assets", "work", "lib/fonts", "Bruto"): os.makedirs(os.path.join(dest, d), exist_ok=True)
shutil.copy(os.path.join(SK, "kit/fonts/Montserrat-VF.woff2"), os.path.join(dest, "lib/fonts/"))
shutil.copy(os.path.join(SK, "modelo/cena.js"), os.path.join(dest, "cena.js"))
if ex or not os.path.exists(os.path.join(dest, "roteiro.json")):
    shutil.copy(os.path.join(SK, "modelo/roteiro.json"), os.path.join(dest, "roteiro.json"))
json.dump({"name": os.path.basename(dest).lower().replace(" ", "-"), "private": True, "type": "module",
           "scripts": {"check": "npx --yes hyperframes@0.9.13 check", "render": "npx --yes hyperframes@0.9.13 render"},
           "devDependencies": {"@hyperframes/core": "^0.9.13"}}, open(os.path.join(dest, "package.json"), "w"), indent=2)
json.dump({"$schema": "https://hyperframes.heygen.com/schema/hyperframes.json",
           "registry": "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
           "paths": {"blocks": "compositions", "components": "compositions/components", "assets": "assets"},
           "media": {"autoProxy": True}, "authoringSkill": "general-video"}, open(os.path.join(dest, "hyperframes.json"), "w"), indent=2)
print("projeto criado em", dest, "| roteiro.json e cena.js" + (" (exemplo do bunker)" if ex else " (modelo do bunker para adaptar)"))
