#!/usr/bin/env python3
"""Acabamento e entrega: vídeo + mix, grão bem leve, master -14 LUFS / pico -1,5 dBTP, 1080x1920, 30 fps.
uso: python finalizar.py <pasta do vídeo> <nome final>
lê work/video.mp4 e som/mix.wav; grava <pasta>/<nome final>.mp4 e work/folha-final.jpg (um quadro por segundo)."""
import json, os, subprocess, sys
P = os.path.abspath(sys.argv[1]); NOME = sys.argv[2]; os.chdir(P)
VID, MIX = 'work/video.mp4', 'som/mix.wav'
DUR = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', VID], capture_output=True, text=True).stdout.strip())
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', MIX, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:"
      f"measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,aresample=48000,apad=whole_dur={DUR:.3f}")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', MIX, '-af', af, '-c:a', 'pcm_s16le', 'som/master.wav'], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-stats', '-y', '-i', VID, '-i', 'som/master.wav', '-map', '0:v', '-map', '1:a',
                '-vf', 'scale=1080:1920,fps=30,noise=alls=3,format=yuv420p', '-c:v', 'libx264', '-crf', '18', '-preset', 'slow',
                '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-t', f'{DUR:.3f}', '-movflags', '+faststart', NOME + '.mp4'], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', NOME + '.mp4', '-vf', 'fps=1,scale=180:-2,tile=10x2:padding=4', '-frames:v', '1', 'work/folha-final.jpg'], check=False)
med = subprocess.run(['ffmpeg', '-nostats', '-hide_banner', '-i', NOME + '.mp4', '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
lin = [l.strip() for l in med.splitlines() if l.strip().startswith(('I:', 'Peak:'))]
print('PRONTO:', os.path.join(P, NOME + '.mp4'))
print(f'duração {DUR:.2f} s · ' + ' · '.join(lin[-2:]) + ' · folha: work/folha-final.jpg')
