#!/usr/bin/env python3
"""Cria a pasta de um vídeo novo no modo animado (desenho animado 2D no cenário 3D), pronta para preencher.

uso: PY novo.py <pasta-do-video>
  ex.: PY novo.py "~/Meu Canal/palitinho/preso-no-elevador"
Cria um projeto HyperFrames vertical (sem instalar skills de fora), copia a biblioteca (personagens, objetos, cenário,
montagem), o modelo da página (index.html), a lista de sons (som/deixas.mjs) e o modelo de roteiro (roteiro.md).
Roda no Mac e no Windows (precisa do Node: o npx baixa o HyperFrames na primeira vez)."""
import os, shutil, subprocess, sys

HF = "hyperframes@0.9.58"
if len(sys.argv) < 2:
    sys.exit(__doc__)
destino = os.path.abspath(os.path.expanduser(sys.argv[1]))
nome = os.path.basename(destino.rstrip("/\\"))
if os.path.exists(destino):
    sys.exit(f"Já existe uma pasta em {destino}. Escolha outro nome.")
ANIM = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # <skill>/animado
npx = shutil.which("npx") or shutil.which("npx.cmd")
if not npx:
    sys.exit("Não achei o npx (vem com o Node). Instale o Node 22 ou mais novo e rode de novo.")
os.makedirs(os.path.dirname(destino), exist_ok=True)
env = dict(os.environ, HYPERFRAMES_SKIP_SKILLS="1")
r = subprocess.run([npx, "--yes", HF, "init", nome, "--example", "blank", "--resolution", "portrait", "--non-interactive",
                    "--skip-skills"], cwd=os.path.dirname(destino), env=env, capture_output=True, text=True)
if r.returncode != 0 or not os.path.isdir(destino):
    sys.exit("O HyperFrames não criou o projeto:\n" + (r.stderr or r.stdout)[-1500:])
for f in ("personagem", "objetos", "shopping3d", "montagem"):          # cópia (atalho não funciona bem no Windows)
    shutil.copy(os.path.join(ANIM, "biblioteca", f + ".js"), os.path.join(destino, f + ".js"))
for d in ("audio", "som", "quadros", "renders"):
    os.makedirs(os.path.join(destino, d), exist_ok=True)
shutil.copy(os.path.join(ANIM, "modelo", "index.html"), os.path.join(destino, "index.html"))
shutil.copy(os.path.join(ANIM, "modelo", "deixas.mjs"), os.path.join(destino, "som", "deixas.mjs"))
shutil.copy(os.path.join(ANIM, "modelo", "roteiro.md"), os.path.join(destino, "roteiro.md"))
print(f"Pronto: {destino}")
print("  roteiro:  roteiro.md")
print("  cenas:    index.html")
print("  sons:     som/deixas.mjs")
