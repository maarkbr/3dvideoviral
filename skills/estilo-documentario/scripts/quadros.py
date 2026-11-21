#!/usr/bin/env python3
"""Quadros parados para conferir antes de gerar o vídeo, nos dois formatos (Mac e Windows).
uso: python quadros.py <pasta> [--formato 16x9|9x16] (--at 1.9,4.2,8.4 | --folha 40)
--at: os tempos exatos (um por destaque, ~0,4 s depois da palavra); --folha N: N quadros espalhados no vídeo inteiro.
Grava em work/quadros-<formato>/ e mostra o caminho da contact-sheet.jpg (abra e confira pela references/regua.md)."""
import json, os, re, shutil, subprocess, sys
P = os.path.abspath(sys.argv[1]); arg = sys.argv[2:]
fmt = arg[arg.index('--formato') + 1] if '--formato' in arg else '16x9'
C = json.loads(re.sub(r'^window\.\w+\s*=\s*|;\s*$', '', open(os.path.join(P, 'cena.js'), encoding='utf-8').read().strip()))
dur = C.get('cta', {}).get('fim', C['dur']) if fmt == '9x16' else C['dur']
base = P
if fmt == '9x16':   # o snapshot só lê index.html: monta uma cópia com a página vertical no lugar
    base = os.path.join(P, 'work', '_vertical')
    os.makedirs(base, exist_ok=True)
    shutil.copytree(os.path.join(P, 'assets'), os.path.join(base, 'assets'), dirs_exist_ok=True)
    for f in ['cena.js', 'hyperframes.json', 'package.json']:
        if os.path.exists(os.path.join(P, f)): shutil.copy(os.path.join(P, f), os.path.join(base, f))
    shutil.copy(os.path.join(P, 'index-9x16.html'), os.path.join(base, 'index.html'))
saida = os.path.join(P, 'work', f'quadros-{fmt}')
shutil.rmtree(saida, ignore_errors=True)
cmd = ['npx', '--yes', 'hyperframes@0.9.13', 'snapshot', base, '--no-end', '-o', saida]
if '--at' in arg: cmd += ['--at', arg[arg.index('--at') + 1]]
else: cmd += ['--range', f'0,{dur}', '--frames', arg[arg.index('--folha') + 1] if '--folha' in arg else '30']
r = subprocess.run(cmd, capture_output=True, text=True, shell=(os.name == 'nt'))
if r.returncode: print(r.stdout[-1500:], r.stderr[-1500:]); sys.exit(1)
folhas = sorted(f for f in os.listdir(saida) if f.startswith('contact-sheet') and f.endswith('.jpg'))   # com muitos quadros o HyperFrames divide em contact-sheet-1, -2...
for f in folhas: print('folha:', os.path.join(saida, f))
