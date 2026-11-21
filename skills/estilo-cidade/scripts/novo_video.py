#!/usr/bin/env python3
"""Cria o projeto de um vídeo "Nesta cidade" (Mac e Windows).

uso: PY novo_video.py "<pasta de trabalho>/cidade" <nome-do-video>
Na primeira vez, instala na pasta da cidade (com o npm, que vem com o Node) as versões travadas do HyperFrames, do
three.js e das fontes. Depois cria <pasta>/<nome> com a página, o motor, os bonecos, as ferramentas e o exemplo
"Cem Palavras" (cena/episodio.js), pronto para trocar."""
import glob, os, shutil, subprocess, sys

PACOTES = {"hyperframes": "0.9.61", "three": "0.187.0", "@fontsource/fredoka": "5.3.0",
           "@fontsource/pacifico": "5.3.0", "@fontsource/inter": "5.3.0"}
if len(sys.argv) < 3:
    sys.exit(__doc__)
raiz = os.path.abspath(os.path.expanduser(sys.argv[1]))
nome = sys.argv[2].strip().strip("/\\")
SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
npm = shutil.which("npm") or shutil.which("npm.cmd")
if not npm:
    sys.exit("Não achei o npm (vem com o Node). Instale o Node 22 ou mais novo e rode de novo.")
os.makedirs(raiz, exist_ok=True)
destino = os.path.join(raiz, nome)
if os.path.exists(destino):
    sys.exit(f"Já existe uma pasta chamada {nome} aqui; escolha outro nome.")
if not os.path.isfile(os.path.join(raiz, "package.json")):
    subprocess.run([npm, "init", "-y"], cwd=raiz, check=True, capture_output=True)
faltam = [f"{p}@{v}" for p, v in PACOTES.items() if not os.path.isdir(os.path.join(raiz, "node_modules", *p.split("/")))]
if faltam:
    print("instalando (só na primeira vez):", ", ".join(faltam))
    r = subprocess.run([npm, "install", "--save-exact", *faltam], cwd=raiz, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit("O npm não conseguiu instalar:\n" + (r.stderr or r.stdout)[-1500:])
bin_ = os.path.join(raiz, "node_modules", ".bin")
hf = next((os.path.join(bin_, n) for n in ("hyperframes.cmd", "hyperframes") if os.path.exists(os.path.join(bin_, n))), None)
if not hf:
    sys.exit("O HyperFrames não ficou instalado em node_modules/.bin.")
r = subprocess.run([hf, "init", nome, "--example=blank", "--resolution=portrait", "--non-interactive", "--skip-skills",
                    "--skip-transcribe"], cwd=raiz, capture_output=True, text=True)
if r.returncode != 0 or not os.path.isdir(destino):
    sys.exit("O HyperFrames não criou o projeto:\n" + (r.stderr or r.stdout)[-1500:])
for f in ("CLAUDE.md", "AGENTS.md"):                    # as instruções do projeto vêm desta skill
    if os.path.exists(os.path.join(destino, f)):
        os.remove(os.path.join(destino, f))
nm = os.path.join(raiz, "node_modules")
for d in ("assets/three/addons", "assets/fontes", "assets/audio", "render"):
    os.makedirs(os.path.join(destino, d), exist_ok=True)
for f in ("three.module.js", "three.core.js"):
    shutil.copy(os.path.join(nm, "three", "build", f), os.path.join(destino, "assets", "three"))
for d in ("postprocessing", "shaders", "geometries", "utils"):
    shutil.copytree(os.path.join(nm, "three", "examples", "jsm", d), os.path.join(destino, "assets", "three", "addons", d))
gsap = glob.glob(os.path.join(nm, "hyperframes", "dist", "vendor", "**", "gsap.min.js"), recursive=True)
if not gsap:
    sys.exit("Não achei o gsap.min.js dentro do HyperFrames.")
shutil.copy(gsap[0], os.path.join(destino, "assets"))
fontes = [("fredoka", "fredoka-latin-600-normal.woff2"), ("fredoka", "fredoka-latin-700-normal.woff2"),
          ("pacifico", "pacifico-latin-400-normal.woff2"), ("inter", "inter-latin-800-normal.woff2")]
for pac, arq in fontes:
    shutil.copy(os.path.join(nm, "@fontsource", pac, "files", arq), os.path.join(destino, "assets", "fontes"))
for f in ("index.html", "roteiro.txt"):
    shutil.copy(os.path.join(SKILL, "modelo", f), destino)
for d in ("cena", "ferramentas"):
    shutil.copytree(os.path.join(SKILL, "modelo", d), os.path.join(destino, d), ignore=shutil.ignore_patterns("__pycache__"))
print(f"projeto criado: {destino}")
print("próximo passo: escrever o roteiro.txt e rodar ferramentas/voz.py com a narração")
