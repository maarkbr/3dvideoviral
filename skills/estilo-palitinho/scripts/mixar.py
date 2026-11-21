#!/usr/bin/env python3
"""Mixa a narração, os efeitos (work/sons.json, tirado do kit) e a trilha, e junta com o vídeo renderizado.
uso: python3 mixar.py <pasta do vídeo> <saida.mp4> [--trilha "Melhores Trilhas sonoras/arquivo.mp3"]
A mistura é feita em numpy (o ffmpeg com dezenas de entradas e sidechain travava). Efeitos e trilha vêm do Pack Lucas
no Google Drive (copiados para sons/ na primeira vez). Trilha abaixa quando a voz fala. Master em -14 LUFS no ffmpeg.
Rode com um Python que tenha numpy (ex.: ~/Lucas Editor/_ferramentas/.venv/bin/python).
"""
import argparse, json, os, shutil, subprocess, sys
import numpy as np

PACK = os.path.expanduser("~/Library/CloudStorage/GoogleDrive-lucasbceditor@gmail.com/Meu Drive/Pack Lucas")
SR = 48000
KIT = {  # sem o Pack Lucas: efeitos CC0 do sfx-kit que o painel instala em <pasta de trabalho>/_ferramentas/sfx-kit
    "whoosh": ("whooshes/whoosh-medium-soft.wav", 0.32),
    "ping": ("tones/tone-ding-mid.wav", 0.18),
    "pop": ("pops/pop-medium-in.wav", 0.35),
    "impacto": ("impacts/impact-deep-firm.wav", 0.38),
    "riser": ("shimmers/shimmer-medium-soft.wav", 0.25),
    "tecla": ("keyboard/keyboard-letter-medium.wav", 0.4),
}
SFX = {  # tipo -> (arquivo no pack, ganho)
    "whoosh": ("SFX/Whoosh two.wav", 0.32),
    "ping": ("SFX/Kinetic Action - Tonal Ping Impact.mp3", 0.22),
    "pop": ("SFX usados recentemente/button-202966.mp3", 0.35),
    "impacto": ("SFX/Whoosh deep impact.mp3", 0.38),
    "riser": ("SFX/Riser 2.wav", 0.25),
    "tecla": ("SFX/Keyboard - 5.mp3", 0.4),
}


def le(f, maxs=None, ss=0):
    a = ["ffmpeg", "-v", "error", "-ss", str(ss), "-i", f]
    if maxs: a += ["-t", str(maxs)]
    a += ["-f", "f32le", "-ac", "1", "-ar", str(SR), "-"]
    return np.frombuffer(subprocess.run(a, capture_output=True, check=True).stdout, np.float32).copy()


ap = argparse.ArgumentParser(); ap.add_argument("pasta"); ap.add_argument("saida")
ap.add_argument("--trilha", default=None); ap.add_argument("--inicio-trilha", type=float, default=None); ap.add_argument("--vol-trilha", type=float, default=0.13)
a = ap.parse_args(); os.chdir(a.pasta); os.makedirs("sons", exist_ok=True)
_tr = json.load(open("roteiro.json", encoding="utf-8")).get("trilha", {})
a.trilha = a.trilha or _tr.get("arquivo") or ("Musicas/01 Genesis - Tristan Barton (320 kbps).mp3" if os.path.isdir(PACK) else None)
a.inicio_trilha = a.inicio_trilha if a.inicio_trilha is not None else _tr.get("inicio", 0)

def acha_kit():
    d = os.path.abspath(".")
    for _ in range(6):
        k = os.path.join(d, "_ferramentas", "sfx-kit", "sounds")
        if os.path.isdir(k): return k
        d = os.path.dirname(d)
    k = os.path.expanduser("~/ferramentas/sfx-kit/sounds")
    return k if os.path.isdir(k) else None

USA_PACK = os.path.isdir(PACK)
KITDIR = None if USA_PACK else acha_kit()
if not USA_PACK and not KITDIR:
    sys.exit("não achei efeitos sonoros: nem o Pack Lucas nem o sfx-kit (_ferramentas/sfx-kit da pasta de trabalho).")
if not USA_PACK:
    SFX = {k: (os.path.join(KITDIR, f), g) for k, (f, g) in KIT.items()}

def local(f):
    if os.path.isabs(f) and os.path.exists(f): return f
    d = os.path.join("sons", os.path.basename(f))
    if not os.path.exists(d): shutil.copy(os.path.join(PACK, f), d)
    return d

dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", "work/video.mp4"], capture_output=True, text=True).stdout)
N = int(dur * SR)
voz = np.zeros(N, np.float32); v = le("voz/voz.wav"); voz[:min(N, len(v))] = v[:N]
pk = np.max(np.abs(voz)) or 1; voz = voz / pk * 0.7
fx = np.zeros(N, np.float32); cache = {}
for s in json.load(open("work/sons.json")):
    f, g = SFX[s["tipo"]]
    if f not in cache:
        x = le(local(f), 3.0); cache[f] = x / (np.max(np.abs(x)) or 1)
    x = cache[f] * g; t = max(0, s["t"] - (0.25 if s["tipo"] == "whoosh" else 0)); i = int(t * SR)
    if i < N: fx[i:i + len(x)] += x[: N - i]
try:
    arq_trilha = local(a.trilha) if a.trilha else None
except (FileNotFoundError, OSError):
    print("não achei a trilha", a.trilha, "- sigo sem música"); arq_trilha = None
if arq_trilha:
    m = le(arq_trilha, dur + 1, a.inicio_trilha)[:N]; m = np.pad(m, (0, N - len(m))); m = m / (np.max(np.abs(m)) or 1) * a.vol_trilha
else:
    print("sem trilha: passe --trilha <arquivo de música livre> (ex.: Biblioteca de Áudio do YouTube) ou ponha em roteiro.json > trilha")
    m = np.zeros(N, np.float32)
# abaixa a trilha quando a voz fala (envelope da voz suavizado)
jan = int(0.05 * SR); env = np.convolve(np.abs(voz), np.ones(jan) / jan, mode="same")
abaixa = np.clip(env / 0.08, 0, 1); k = int(0.3 * SR); abaixa = np.convolve(abaixa, np.ones(k) / k, mode="same")
m = m * (1 - 0.55 * abaixa)
fi = int(1.5 * SR); m[:fi] *= np.linspace(0, 1, fi); fo = int(2.5 * SR); m[-fo:] *= np.linspace(1, 0, fo)
mix = voz + fx + m
mix = mix / max(1.0, np.max(np.abs(mix)) / 0.98)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", "loudnorm=I=-13:TP=-1.2:LRA=9,alimiter=limit=0.89", "-ar", str(SR), "work/mix.wav"],
               input=mix.astype(np.float32).tobytes(), check=True, timeout=300)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "work/video.mp4", "-i", "work/mix.wav", "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                "-shortest", "-movflags", "+faststart", a.saida], check=True, timeout=300)
print("ok", a.saida, round(dur, 1), "s")
