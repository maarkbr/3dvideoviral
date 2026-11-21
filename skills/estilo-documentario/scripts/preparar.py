#!/usr/bin/env python3
"""Trata as fotos do vídeo como cópia impressa em P&B (tom quente de papel antigo) e gera as texturas do mundo.
uso: python preparar.py <pasta do vídeo>
lê fotos/*.jpg|png e grava assets/<nome>-p.jpg; gera assets/manchas.jpg, fibra.png, exemplos.jpg,
mascara-foco.png (16:9) e mascara-foco-9x16.png. Tudo determinístico (sementes fixas)."""
import math, os, random, sys
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

P = os.path.abspath(sys.argv[1]); F = os.path.join(P, 'fotos'); A = os.path.join(P, 'assets'); os.makedirs(A, exist_ok=True)

def impressa(arq, alvo_h=1000, gama=1.05, contraste=1.2):
    im = Image.open(os.path.join(F, arq)).convert('RGB'); w, h = im.size
    alvo_h = max(700, min(alvo_h, h * 2)); s = alvo_h / h
    im = im.resize((round(w * s), alvo_h), Image.LANCZOS)
    g = ImageEnhance.Contrast(ImageOps.autocontrast(ImageOps.grayscale(im), cutoff=1)).enhance(contraste)
    a = (np.asarray(g).astype(np.float32) / 255) ** gama
    a = np.clip(a + np.random.default_rng(7).normal(0, 0.025, a.shape), 0, 1)       # grão de papel fotográfico
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]; cx, cy = a.shape[1] / 2, a.shape[0] / 2
    a = a * (1 - 0.18 * np.clip(((xx - cx) / cx) ** 2 + ((yy - cy) / cy) ** 2 - 0.35, 0, 1.5))  # vinheta da ampliação
    rgb = np.dstack([np.clip(a * 255 + 8, 0, 255), np.clip(a * 240 + 4, 0, 255), np.clip(a * 209, 0, 255)])
    nome = os.path.splitext(arq)[0] + '-p.jpg'
    Image.fromarray(rgb.astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.4)).save(os.path.join(A, nome), quality=90)
    PROP[os.path.splitext(arq)[0]] = round(im.size[0] / im.size[1], 4)
    print('foto', nome)

PROP = {}
for arq in sorted(os.listdir(F)) if os.path.isdir(F) else []:
    if arq.lower().endswith(('.jpg', '.jpeg', '.png')) and not arq.endswith('-p.jpg'): impressa(arq)

import json as _json
open(os.path.join(A, 'fotos.js'), 'w', encoding='utf-8').write('window.FOTOS = ' + _json.dumps(PROP) + ';\n')

def ruido(w, h, oitavas, seed):
    rng = np.random.default_rng(seed); acc = np.zeros((h, w), np.float32); amp, tot = 1.0, 0
    for o in range(oitavas):
        f = 2 ** o; g = rng.random((max(2, int(h / 256 * f) + 2), max(2, int(w / 256 * f) + 2))).astype(np.float32)
        acc += np.asarray(Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)).astype(np.float32) / 255 * amp
        tot += amp; amp *= 0.55
    return acc / tot
n, n2 = ruido(2048, 1062, 6, 11), ruido(2048, 1062, 3, 23)
v, v2 = (n - n.min()) / (n.max() - n.min()), (n2 - n2.min()) / (n2.max() - n2.min())
lum = 1 - 0.20 * np.clip((v - 0.45) * 2.2, 0, 1) - 0.12 * np.clip((v2 - 0.6) * 3, 0, 1)
Image.fromarray(np.dstack([lum * 255, lum * 246, lum * 228]).clip(0, 255).astype(np.uint8)).save(os.path.join(A, 'manchas.jpg'), quality=88)
t = ruido(512, 512, 7, 5); t = (t - t.min()) / (t.max() - t.min())
fib = 0.5 + (t - 0.5) * 0.35 + np.random.default_rng(3).normal(0, 0.06, t.shape)
fib = (fib + np.roll(fib, 256, 0) + np.roll(fib, 256, 1) + np.roll(np.roll(fib, 256, 0), 256, 1)) / 4
Image.fromarray(((0.5 + (fib - fib.mean()) * 2.0).clip(0, 1) * 255).astype(np.uint8)).save(os.path.join(A, 'fibra.png'))

# atlas das "fotinhos de exemplo" (8x8 de 64x48): rostos, paisagens, dígitos e objetos, desenhados
TW, TH, NN = 64, 48, 8; atlas = Image.new('RGB', (TW * NN, TH * NN)); r = random.Random(42)
for k in range(NN * NN):
    im = Image.new('L', (TW, TH)); d = ImageDraw.Draw(im); base = r.randint(60, 200)
    for y in range(TH): d.line([(0, y), (TW, y)], fill=int(base * (0.7 + 0.5 * y / TH)) % 256)
    tipo = k % 4
    if tipo == 0:
        cx = TW / 2 + r.randint(-8, 8); d.ellipse([cx - 11, 8, cx + 11, 34], fill=r.randint(140, 230)); d.ellipse([cx - 22, 32, cx + 22, 60], fill=r.randint(20, 90))
    elif tipo == 1:
        hz = r.randint(20, 32); d.polygon([(0, hz), (r.randint(10, 30), hz - r.randint(6, 16)), (r.randint(35, 50), hz - 2), (TW, hz - r.randint(4, 12)), (TW, TH), (0, TH)], fill=r.randint(20, 90))
    elif tipo == 2:
        d.rectangle([0, 0, TW, TH], fill=r.randint(200, 235)); dig = r.randint(0, 9)
        d.line([(TW / 2 + 9 * math.sin(i / 23 * math.tau * (0.85 if dig in (0, 6, 8, 9) else 0.5) + dig), TH / 2 - 14 + 28 * i / 23) for i in range(24)], fill=25, width=4)
    else:
        x0 = r.randint(8, 24); d.rectangle([x0, r.randint(14, 26), x0 + r.randint(18, 34), TH - 6], fill=r.randint(10, 80))
    a = np.asarray(im.filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32) / 255
    atlas.paste(Image.fromarray(np.dstack([a * 255 + 6, a * 240 + 3, a * 214]).clip(0, 255).astype(np.uint8)), ((k % NN) * TW, (k // NN) * TH))
atlas.save(os.path.join(A, 'exemplos.jpg'), quality=90)

# máscaras do foco raso (borda desfocada) para o finalizar.sh
for nome, (W, H, cy, kx, ky, d0, d1) in {'mascara-foco.png': (1920, 1080, 520, 0.85, 1.35, 0.42, 1.15), 'mascara-foco-9x16.png': (1080, 1920, 930, 1.1, 1.0, 0.45, 1.2)}.items():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    dd = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 * kx + ((yy - cy) / (H / 2)) ** 2 * ky)
    t = np.clip((dd - d0) / (d1 - d0), 0, 1); Image.fromarray((t * t * (3 - 2 * t) * 255).astype(np.uint8)).convert('RGB').save(os.path.join(A, nome))
print('texturas ok em', A)
