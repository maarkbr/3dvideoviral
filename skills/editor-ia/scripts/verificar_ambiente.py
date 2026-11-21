"""Fase 1 da skill editor-ia: verifica tudo que a edição precisa e imprime um checklist ✓/✗.

uso: python verificar_ambiente.py [--projeto <pasta>] [--json]

Checa: Python 3.10+, pacotes (faster-whisper, numpy, scipy; opencv opcional), ffmpeg/ffprobe, Node 22+,
plugin HyperFrames no Claude Code, espaço em disco e o modelo do Whisper em cache.
Não instala nada: só relata. A instalação é feita pelo agente, com a permissão do usuário.
"""
import importlib.util
import json
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d  # noqa: E731
proj = os.path.abspath(arg("--projeto", os.getcwd()))
checks = []


def add(key, ok, detail, fix=""):
    checks.append({"item": key, "ok": bool(ok), "detalhe": detail, "como_resolver": fix})


def run(cmd):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        return (r.stdout or "") + (r.stderr or "")
    except Exception as e:  # noqa: BLE001
        return f"ERRO {e}"


v = sys.version_info
add("Python 3.10 a 3.13", (3, 10) <= v[:2] <= (3, 13), f"{v.major}.{v.minor}.{v.micro} em {sys.executable}",
    "o faster-whisper ainda não instala no Python 3.14+ (o pacote av não compila) nem roda abaixo do 3.10: "
    "instale o Python 3.12 (brew install python@3.12 / winget install Python.Python.3.12) e recrie a venv com ele")
venv = sys.prefix != getattr(sys, "base_prefix", sys.prefix)
add("ambiente virtual (venv) ativo", venv, sys.prefix,
    "criar na pasta do projeto: python -m venv .venv  e rodar os scripts com .venv/Scripts/python (Windows) ou .venv/bin/python")
for mod, pip in (("faster_whisper", "faster-whisper"), ("numpy", "numpy"), ("scipy", "scipy")):
    add(f"pacote {pip}", importlib.util.find_spec(mod) is not None, "", f"pip install -r {os.path.join(os.path.dirname(HERE), 'requirements.txt')}")
add("pacote opencv (opcional: enquadramento automático do rosto)", importlib.util.find_spec("cv2") is not None, "",
    "pip install opencv-python-headless  (sem ele, o enquadramento é feito pela folha de contato)")
for exe in ("ffmpeg", "ffprobe"):
    p = shutil.which(exe)
    ver = run([exe, "-version"]).splitlines()[0] if p else ""
    add(exe, bool(p), ver or "não encontrado", "Windows: winget install Gyan.FFmpeg  ·  Mac: brew install ffmpeg")
node = shutil.which("node")
nv = run(["node", "--version"]).strip() if node else ""
m = re.match(r"v(\d+)", nv)
add("Node.js 22+", bool(m and int(m.group(1)) >= 22), nv or "não encontrado", "Windows: winget install OpenJS.NodeJS.LTS  ·  Mac: brew install node")
hfv = run(["node", os.path.join(HERE, "hf.mjs"), "--version"]).strip() if node else ""
add("plugin HyperFrames (Claude Code)", bool(re.match(r"^\d+\.\d+", hfv)), hfv or "não instalado",
    "claude plugin marketplace add heygen-com/hyperframes  e  claude plugin install hyperframes@hyperframes")
total, used, free = shutil.disk_usage(proj if os.path.exists(proj) else os.getcwd())
add("espaço livre ≥ 8 GB", free >= 8 * 1024 ** 3, f"{free / 1024 ** 3:.1f} GB livres", "liberar espaço: cada corte renderizado usa ~0,3–1 GB de trabalho")
models = os.environ.get("CORTES_MODELOS", os.path.join(proj, ".models"))
has_model = os.path.isdir(models) and any("faster-whisper" in d for d in os.listdir(models))
add("modelo Whisper em cache (baixa ~0,5 GB na 1ª transcrição)", has_model, models, "é baixado sozinho na primeira transcrição (precisa de internet)")
envf = os.path.join(proj, ".env")
tem_chave = bool(os.environ.get("ELEVENLABS_API_KEY")) or (os.path.exists(envf) and any(
    ln.strip().startswith("ELEVENLABS_API_KEY=") and len(ln.split("=", 1)[1].strip()) > 8 for ln in open(envf, encoding="utf-8")))
add("chave ElevenLabs para o Scribe (opcional: transcrição literal, pega vícios e repetições)", tem_chave,
    "configurada" if tem_chave else "sem chave: usa o Whisper grátis",
    "criar a chave em elevenlabs.io e gravar ELEVENLABS_API_KEY=... no arquivo .env da pasta do projeto")

if "--json" in sys.argv:
    print(json.dumps(checks, ensure_ascii=False, indent=1))
else:
    sys.stdout.reconfigure(encoding="utf-8")
    for c in checks:
        print(("✓ " if c["ok"] else "✗ ") + c["item"] + (f"  — {c['detalhe']}" if c["detalhe"] else ""))
        if not c["ok"] and c["como_resolver"]:
            print("    → " + c["como_resolver"])
    faltam = [c for c in checks if not c["ok"] and "opcional" not in c["item"] and "cache" not in c["item"]]
    print("\nTudo pronto." if not faltam else f"\nFaltam {len(faltam)} item(ns) obrigatório(s).")
