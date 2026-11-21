#!/usr/bin/env python3
"""Vídeo longo: emenda os capítulos (cada um uma pasta em <raiz>/capitulos/NN-nome/, gerado e mixado à parte) num vídeo só.
uso: python emendar.py <raiz> [--9x16]
lê de cada capítulo work/video.mp4 (ou video-9x16.mp4) e som/mix.wav (ou mix-9x16.wav), na ordem do nome da pasta;
grava <raiz>/work/video*.mp4 e <raiz>/som/mix*.wav. Depois: python finalizar.py <raiz> <nome> [16x9|9x16] (um master só)."""
import os, subprocess, sys
R = os.path.abspath(sys.argv[1]); V = '--9x16' in sys.argv; SUF = '-9x16' if V else ''
caps = sorted(d for d in os.listdir(os.path.join(R, 'capitulos')) if os.path.isdir(os.path.join(R, 'capitulos', d)))
if not caps: sys.exit('Nenhum capítulo em capitulos/.')
for d in ['work', 'som']: os.makedirs(os.path.join(R, d), exist_ok=True)
falta = [c for c in caps if not (os.path.exists(os.path.join(R, 'capitulos', c, 'work', f'video{SUF}.mp4')) and os.path.exists(os.path.join(R, 'capitulos', c, 'som', f'mix{SUF}.wav')))]
if falta: sys.exit('Falta gerar ou mixar: ' + ', '.join(falta))
lv, la = os.path.join(R, 'work', 'lista-video.txt'), os.path.join(R, 'work', 'lista-som.txt')
with open(lv, 'w', encoding='utf-8') as f:
    for c in caps: f.write("file '" + os.path.join(R, 'capitulos', c, 'work', f'video{SUF}.mp4').replace("'", "'\\''") + "'\n")
with open(la, 'w', encoding='utf-8') as f:
    for c in caps: f.write("file '" + os.path.join(R, 'capitulos', c, 'som', f'mix{SUF}.wav').replace("'", "'\\''") + "'\n")
# fusão de 0,6 s entre os capítulos (os do meio não escurecem: "abre": false / "fecha": false na cena.js)
X = 0.6
dur = lambda p: float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout)
vids = [os.path.join(R, 'capitulos', c, 'work', f'video{SUF}.mp4') for c in caps]; mixs = [os.path.join(R, 'capitulos', c, 'som', f'mix{SUF}.wav') for c in caps]
if len(caps) == 1:
    __import__('shutil').copy(vids[0], os.path.join(R, 'work', f'video{SUF}.mp4')); __import__('shutil').copy(mixs[0], os.path.join(R, 'som', f'mix{SUF}.wav'))
else:
    ent, fv, fa, off, ult_v, ult_a = [], [], [], 0.0, '[0:v]', '[0:a]'
    for v in vids: ent += ['-i', v]
    for m in mixs: ent += ['-i', m]
    n = len(caps)
    for k in range(1, n):
        off += dur(vids[k - 1]) - X
        sv, sa = f'[v{k}]', f'[a{k}]'
        fv.append(f'{ult_v}[{k}:v]xfade=transition=fade:duration={X}:offset={off:.3f}{sv}')
        fa.append(f'{ult_a if k > 1 else f"[{n}:a]"}[{n + k}:a]acrossfade=d={X}:c1=tri:c2=tri{sa}')
        ult_v, ult_a = sv, sa
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *ent, '-filter_complex', ';'.join(fv), '-map', ult_v, '-c:v', 'libx264', '-crf', '14', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', '30', os.path.join(R, 'work', f'video{SUF}.mp4')], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *ent, '-filter_complex', ';'.join(fa), '-map', ult_a, '-c:a', 'pcm_f32le', '-ar', '48000', os.path.join(R, 'som', f'mix{SUF}.wav')], check=True)
com_assets = [c for c in caps if os.path.exists(os.path.join(R, 'capitulos', c, 'assets', 'mascara-foco.png'))]
if not os.path.exists(os.path.join(R, 'assets', 'mascara-foco.png')):
    if not com_assets: sys.exit('Nenhum capítulo tem assets/mascara-foco.png (rode o preparar.py num deles).')
    if os.path.islink(os.path.join(R, 'assets')): os.remove(os.path.join(R, 'assets'))
    __import__('shutil').copytree(os.path.join(R, 'capitulos', com_assets[0], 'assets'), os.path.join(R, 'assets'), dirs_exist_ok=True)
print(f'{len(caps)} capítulos emendados: vídeo {dur(os.path.join(R, "work", f"video{SUF}.mp4")):.2f} s, som {dur(os.path.join(R, "som", f"mix{SUF}.wav")):.2f} s')
print(f'Agora: python finalizar.py "{R}" <nome>' + (' 9x16' if V else ' 16x9'))
