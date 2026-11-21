#!/usr/bin/env python3
"""Junta o vídeo renderizado com a voz, os efeitos (work/sons.json) e a trilha (opcional), e entrega em -14 LUFS, estéreo.
uso: python finalizar_motion.py <projeto> <saida.mp4> [--trilha musica.mp3] [--trilha-vol 0.10] [--sem-efeitos]
A trilha abaixa sozinha quando a voz fala. Os efeitos vêm do SFX Kit (CC0) da pasta de trabalho (_ferramentas/sfx-kit)
ou de ~/ferramentas/sfx-kit. Normalização em duas passadas."""
import argparse, json, os, subprocess

ap = argparse.ArgumentParser(); ap.add_argument("projeto"); ap.add_argument("saida")
ap.add_argument("--trilha"); ap.add_argument("--trilha-vol", type=float, default=0.10); ap.add_argument("--sem-efeitos", action="store_true")
a = ap.parse_args(); P = os.path.abspath(a.projeto)
S = json.load(open(os.path.join(P, "work/sons.json")))
DUR = S["dur"]

def acha_sfx():
    d = P
    while True:
        c = os.path.join(d, "_ferramentas", "sfx-kit", "sounds")
        if os.path.isdir(c):
            return c
        nd = os.path.dirname(d)
        if nd == d:
            break
        d = nd
    c = os.path.expanduser("~/ferramentas/sfx-kit/sounds")
    return c if os.path.isdir(c) else None

inp, flt, fundo, k = [], [], [], 0
tem_voz = os.path.exists(os.path.join(P, "voz/voz.wav"))
if tem_voz:
    inp += ["-i", os.path.join(P, "voz/voz.wav")]; flt.append(f"[{k}]pan=stereo|c0=c0|c1=c0,loudnorm=I=-16:TP=-2,apad,atrim=0:{DUR}[v]"); k += 1
if a.trilha:
    inp += ["-stream_loop", "-1", "-i", a.trilha]
    flt.append(f"[{k}]atrim=0:{DUR},aformat=channel_layouts=stereo,volume={a.trilha_vol},afade=t=in:d=0.8,afade=t=out:st={max(0, DUR - 1.5)}:d=1.5[m]"); fundo.append("[m]"); k += 1
sfx = None if a.sem_efeitos else acha_sfx()
if not a.sem_efeitos and not sfx:
    print("aviso: SFX Kit não encontrado; seguindo sem efeitos")
efeitos = []
for s in (S["sons"] if sfx else []):
    arq = os.path.join(sfx, s["som"] + ".wav")
    if not os.path.exists(arq):
        print("aviso: efeito não encontrado:", s["som"]); continue
    ms = max(0, int((s["t"] - s.get("sync", 0)) * 1000))
    inp += ["-i", arq]
    flt.append(f"[{k}]aresample=48000,aformat=channel_layouts=stereo,volume={s.get('vol', 0.2)},adelay={ms}:all=1[e{k}]"); efeitos.append(f"[e{k}]"); k += 1
mix = fundo + efeitos
if not inp:
    raise SystemExit("nada para mixar: sem voz, sem trilha e sem efeitos")
if tem_voz and fundo:
    flt.append("".join(fundo) + f"amix=inputs={len(fundo)}:normalize=0,apad,atrim=0:{DUR}[f]")
    flt += ["[v]asplit=2[v1][v2]", "[f][v2]sidechaincompress=threshold=0.03:ratio=5:attack=20:release=300[fd]"]
    partes = ["[v1]", "[fd]"] + efeitos
elif tem_voz:
    partes = ["[v]"] + efeitos
else:
    partes = mix
flt.append("".join(partes) + f"amix=inputs={len(partes)}:normalize=0,apad,atrim=0:{DUR}[out]" if len(partes) > 1 else f"{partes[0]}apad,atrim=0:{DUR}[out]")
bruto, final = os.path.join(P, "work/mix_bruto.wav"), os.path.join(P, "work/mix.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", *inp, "-filter_complex", ";".join(flt), "-map", "[out]", "-ar", "48000", "-ac", "2", bruto], check=True)
med = subprocess.run(["ffmpeg", "-v", "info", "-i", bruto, "-af", "loudnorm=I=-14:TP=-1.5:LRA=9:print_format=json", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
j = json.loads(med[med.rindex("{"):med.rindex("}") + 1])
ln = (f"loudnorm=I=-14:TP=-1.5:LRA=9:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", bruto, "-af", ln, "-ar", "48000", "-ac", "2", final], check=True)
os.makedirs(os.path.dirname(os.path.abspath(a.saida)), exist_ok=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(P, "work/video.mp4"), "-i", final, "-map", "0:v", "-map", "1:a",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", a.saida], check=True)
print(f"pronto: {a.saida} ({len(efeitos)} efeitos{', com trilha' if a.trilha else ''})")
