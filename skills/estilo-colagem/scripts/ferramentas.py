#!/usr/bin/env python3
"""Confere tudo o que o estilo Colagem precisa (Mac e Windows) e diz como instalar o que faltar.
uso: python ferramentas.py [pasta do vídeo]"""
import importlib.util, os, shutil, subprocess, sys
ok = True
def tem(nome, comando, dica):
    global ok
    try:
        v = subprocess.run(comando, capture_output=True, text=True, timeout=120, shell=(os.name == 'nt'))
        linha = (v.stdout or v.stderr).strip().splitlines()[0] if (v.stdout or v.stderr).strip() else ''
        print(f'ok    {nome}: {linha[:70]}' if v.returncode == 0 else f'FALTA {nome}: {dica}'); ok &= v.returncode == 0
    except Exception:
        print(f'FALTA {nome}: {dica}'); ok = False
tem('Node 22+', ['node', '--version'], 'instale o Node LTS em https://nodejs.org')
tem('FFmpeg', ['ffmpeg', '-version'], 'Mac: brew install ffmpeg · Windows: winget install Gyan.FFmpeg')
tem('HyperFrames 0.9.13', [shutil.which('npx') or shutil.which('npx.cmd') or 'npx', '--yes', 'hyperframes@0.9.13', '--version'], 'precisa de internet na 1ª vez (npx baixa sozinho)')
for mod, dica in [('numpy', 'pip install numpy'), ('PIL', 'pip install pillow'), ('faster_whisper', 'pip install faster-whisper (para o tempo das palavras)')]:
    achou = importlib.util.find_spec(mod) is not None
    print(f'ok    Python: {mod}' if achou else f'FALTA Python: {mod} → {dica}'); ok &= achou
bom = (3, 10) <= sys.version_info[:2] <= (3, 13)
print(f'ok    Python {sys.version.split()[0]}' if bom else f'FALTA Python 3.10 a 3.13 (este é o {sys.version.split()[0]}: no 3.14+ o faster-whisper não instala). Mac: brew install python@3.12 e crie o .venv com python3.12 · Windows: winget install Python.Python.3.12'); ok &= bom
kit = None; d = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.getcwd()
for _ in range(6):
    c = os.path.join(d, '_ferramentas', 'sfx-kit', 'sounds')
    if os.path.isdir(c): kit = c; break
    d = os.path.dirname(d)
print(f'ok    SFX Kit: {kit}' if kit else 'aviso SFX Kit não achado (_ferramentas/sfx-kit): sem ele, os efeitos precisam vir do seu pack (som.json > sons)')
print('\nTUDO PRONTO' if ok else '\nInstale o que falta e rode de novo.')
sys.exit(0 if ok else 1)
