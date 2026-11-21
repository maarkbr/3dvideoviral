#!/usr/bin/env python3
"""Acabamento e entrega (Mac e Windows): foco raso nas bordas, brilho suave, vinheta, poeira de filme antigo (opcional),
grão, narração + trilha + efeitos, master -14 LUFS / -1 dBTP.
uso: python finalizar.py <pasta do vídeo> <nome final> [16x9|9x16] [--filme <vídeo de poeira sobre fundo preto>]
lê work/video.mp4 (ou work/video-9x16.mp4) e som/mix.wav (ou som/mix-9x16.wav); grava <pasta>/<nome final>.mp4"""
import json, os, subprocess, sys
P = os.path.abspath(sys.argv[1]); NOME = sys.argv[2]; FMT = sys.argv[3] if len(sys.argv) > 3 and not sys.argv[3].startswith('--') else '16x9'
FILME = sys.argv[sys.argv.index('--filme') + 1] if '--filme' in sys.argv else None
os.chdir(P)
V = FMT == '9x16'; SUF = '-9x16' if V else ''
MASC = f'assets/mascara-foco{SUF}.png'; ESC = 'scale=-2:1920,crop=1080:1920,' if V else 'scale=1920:1080,'
VID, MIX = f'work/video{SUF}.mp4', f'som/mix{SUF}.wav'
DUR = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', VID], capture_output=True, text=True).stdout.strip())
ent = ['-i', VID]; ov = '[g]null[o];'; mi = 1
if FILME and os.path.exists(FILME):
    ent += ['-stream_loop', '-1', '-i', FILME]; ov = f'[1:v]{ESC}fps=30,format=gbrp,setpts=PTS-STARTPTS,eq=brightness=0.02:contrast=1.3[ov];[g][ov]blend=all_mode=screen:all_opacity=0.55[o];'; mi = 2
ent += ['-loop', '1', '-t', f'{DUR}', '-i', MASC]
fc = (f"[0:v]format=gbrp,split=3[a][b][c];[b]gblur=sigma=5:steps=2[bb];[{mi}:v]format=gbrp,fps=30[m];[a][bb][m]maskedmerge[f];"
      f"[c]curves=all='0/0 0.55/0 0.8/0.35 1/0.9',gblur=sigma=28:steps=2[h];[f][h]blend=all_mode=screen:all_opacity=0.32[g];{ov}"
      "[o]vignette=angle=PI/4.6:mode=forward,noise=alls=7:allf=t+u,format=yuv420p[v]")
subprocess.run(['ffmpeg', '-v', 'error', '-stats', '-y', *ent, '-filter_complex', fc, '-map', '[v]', '-t', f'{DUR}', '-r', '30', '-c:v', 'libx264', '-crf', '19', '-preset', 'slow', '-pix_fmt', 'yuv420p', f'work/imagem{SUF}.mp4'], check=True)
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', MIX, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
af = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:linear=true,aresample=48000,apad=whole_dur={DUR:.3f}"
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', MIX, '-af', af, '-c:a', 'pcm_s16le', f'som/master{SUF}.wav'], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'work/imagem{SUF}.mp4', '-i', f'som/master{SUF}.wav', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-t', f'{DUR}', '-movflags', '+faststart', NOME + '.mp4'], check=True)
print('PRONTO:', os.path.join(P, NOME + '.mp4'))
# conferência rápida: duração, volume e uma folha com um quadro por segundo
saida = NOME + '.mp4'
fps_tile = '8x6' if not V else '12x4'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', saida, '-vf', f'fps=1,scale={"320:-2" if not V else "180:-2"},tile={fps_tile}:padding=4', '-frames:v', '1', 'work/folha-final.jpg'], check=False)
med = subprocess.run(['ffmpeg', '-nostats', '-hide_banner', '-i', saida, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
lin = [l.strip() for l in med.splitlines() if l.strip().startswith(('I:', 'Peak:'))]
print(f'duração {DUR:.2f} s · ' + ' · '.join(lin[-2:]) + ' · folha: work/folha-final.jpg')
