#!/usr/bin/env python3
"""Quadros parados para conferir antes de gerar o vídeo (Mac e Windows).
uso: python quadros.py <pasta> (--at 1.9,4.2,8.4 | --folha 30)
--at: os tempos exatos (cada peça ~0,4 s depois de entrar); --folha N: N quadros espalhados no vídeo inteiro.
Grava em work/quadros/ e mostra o caminho da contact-sheet.jpg (abra e confira pela references/regua.md)."""
import os, re, shutil, subprocess, sys
P = os.path.abspath(sys.argv[1]); arg = sys.argv[2:]
h = open(os.path.join(P, 'index.html'), encoding='utf-8').read(); dur = float(re.search(r'data-duration="([\d.]+)"', h).group(1))
saida = os.path.join(P, 'work', 'quadros'); shutil.rmtree(saida, ignore_errors=True)
cmd = [shutil.which('npx') or shutil.which('npx.cmd') or 'npx', '--yes', 'hyperframes@0.9.13', 'snapshot', P, '--no-end', '-o', saida]
if '--at' in arg: cmd += ['--at', arg[arg.index('--at') + 1]]
else: cmd += ['--range', f'0,{dur}', '--frames', arg[arg.index('--folha') + 1] if '--folha' in arg else '30']
r = subprocess.run(cmd, capture_output=True, text=True, shell=(os.name == 'nt'))
if r.returncode: print(r.stdout[-1500:], r.stderr[-1500:]); sys.exit(1)
folhas = sorted(f for f in os.listdir(saida) if f.startswith('contact-sheet') and f.endswith('.jpg'))
for f in folhas: print('folha:', os.path.join(saida, f))
if not folhas: print('quadros em:', saida)
