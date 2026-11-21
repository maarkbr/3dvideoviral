#!/usr/bin/env python3
"""Põe a referência e o seu vídeo lado a lado (para comparar ritmo, entradas e legenda), com o som do seu vídeo.
uso: python lado_a_lado.py <referência.mp4> <seu vídeo.mp4> <saída.mp4> [--inicio-ref 13] [--folha]
--folha: também grava <saída>.jpg com 12 pares de quadros (referência em cima, o seu embaixo)."""
import os, subprocess, sys
ref, meu, out = sys.argv[1:4]; a = sys.argv[4:]
ini = a[a.index('--inicio-ref') + 1] if '--inicio-ref' in a else '0'
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', meu], capture_output=True, text=True).stdout)
fc = ('[0:v]fps=30,scale=540:960:force_original_aspect_ratio=decrease,pad=540:960:(ow-iw)/2:(oh-ih)/2,setsar=1[r];'
      '[1:v]fps=30,scale=540:960,setsar=1[m];[r][m]hstack=2[v]')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', ini, '-t', f'{dur:.2f}', '-i', ref, '-i', meu, '-filter_complex', fc,
                '-map', '[v]', '-map', '1:a?', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', out], check=True)
print('lado a lado:', out)
if '--folha' in a:
    n = 12; passo = dur / n
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', out, '-vf', f'fps=1/{passo:.3f},scale=540:-2,tile=6x2:padding=6', '-frames:v', '1', os.path.splitext(out)[0] + '.jpg'], check=True)
    print('folha:', os.path.splitext(out)[0] + '.jpg')
