#!/usr/bin/env python3
"""Prepara o que a página usa: a textura de papel do fundo, as fotos (coloridas, no tamanho certo), a foto do perfil e
o tempo de cada palavra para a legenda.
uso: python preparar.py <pasta do vídeo> [--corrigir "errado=certo" ...]
lê fotos/*.jpg|png|webp e voz/palavras.json; grava assets/papel.jpg, assets/fotos/<nome>.jpg e assets/palavras.js.
--corrigir troca uma palavra só na legenda (o Whisper às vezes escreve "Paraiba" em vez de "Paraíba")."""
import json, os, re, sys
import numpy as np
from PIL import Image, ImageFilter, ImageOps

P = os.path.abspath(sys.argv[1]); A = os.path.join(P, 'assets'); os.makedirs(os.path.join(A, 'fotos'), exist_ok=True)
args = sys.argv[2:]; trocas = {}
for k, a in enumerate(args):
    if a == '--corrigir' and k + 1 < len(args) and '=' in args[k + 1]: e, c = args[k + 1].split('=', 1); trocas[e] = c

# 1) papel: cinza neutro com fibras e manchas bem leves (o fundo das referências), feito uma vez por projeto
pp = os.path.join(A, 'papel.jpg')
if not os.path.exists(pp):
    rng = np.random.default_rng(7); W, H = 1080, 1920; t = np.zeros((H, W))
    for esc, peso in [(3, .55), (12, .7), (48, .9), (180, 1.0)]:
        n = rng.standard_normal((H // esc + 2, W // esc + 2))
        im = Image.fromarray(((n - n.min()) / (np.ptp(n) + 1e-9) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
        t += (np.asarray(im, dtype=float) - 128) * peso
    fib = np.zeros((H, W))
    for _ in range(900):   # fibras curtas
        x, y, L, a = rng.integers(0, W), rng.integers(0, H), rng.integers(8, 40), rng.uniform(0, np.pi)
        for s in range(L):
            xx, yy = int(x + s * np.cos(a)), int(y + s * np.sin(a))
            if 0 <= xx < W and 0 <= yy < H: fib[yy, xx] += rng.choice([-1, 1]) * 18
    t = t / (np.abs(t).max() + 1e-9) * 46 + fib
    img = Image.fromarray(np.clip(128 + t, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
    img.save(pp, quality=88); print('papel:', pp)

# 2) fotos: coloridas, até 1400 px, com um leve ajuste (sem filtro chamativo)
F = os.path.join(P, 'fotos'); n = 0
for f in sorted(os.listdir(F)) if os.path.isdir(F) else []:
    nome, ext = os.path.splitext(f)
    if ext.lower() not in ('.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff'): continue
    im = ImageOps.exif_transpose(Image.open(os.path.join(F, f)))
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA'); fundo = Image.new('RGBA', im.size, (244, 242, 236, 255)); fundo.alpha_composite(im); im = fundo
    im = im.convert('RGB'); im.thumbnail((1400, 1400), Image.LANCZOS)
    im = ImageOps.autocontrast(im, cutoff=0.4)
    im.save(os.path.join(A, 'fotos', nome + '.jpg'), quality=90); n += 1
print(f'fotos: {n} em assets/fotos/')

# 3) foto do perfil (cena.js > marca.foto), para o celular do fim
cena = json.loads(re.sub(r'^window\.\w+\s*=\s*|;\s*$', '', open(os.path.join(P, 'cena.js'), encoding='utf-8').read().strip()))
mf = (cena.get('marca') or {}).get('foto')
if mf:
    for c in [os.path.join(P, mf), os.path.join(P, 'fotos', mf)]:
        if os.path.exists(c):
            im = ImageOps.fit(ImageOps.exif_transpose(Image.open(c)).convert('RGB'), (400, 400)); im.save(os.path.join(A, os.path.basename(mf)), quality=90); print('perfil:', mf); break
    else: print('aviso: marca.foto não encontrada:', mf)

# 4) palavras da legenda
vp = os.path.join(P, 'voz', 'palavras.json')
if os.path.exists(vp):
    pal = json.load(open(vp, encoding='utf-8'))
    for p in pal:
        lim = re.sub(r'[^\wÀ-ÿ]', '', p['w'])
        if lim in trocas: p['w'] = p['w'].replace(lim, trocas[lim])
    open(os.path.join(A, 'palavras.js'), 'w', encoding='utf-8').write('window.PALAVRAS = ' + json.dumps([{'w': p['w'], 's': round(p['s'], 3), 'e': round(p['e'], 3)} for p in pal], ensure_ascii=False) + ';\n')
    print(f'legenda: {len(pal)} palavras, de {pal[0]["s"]:.2f} a {pal[-1]["e"]:.2f} s')
else:
    open(os.path.join(A, 'palavras.js'), 'w', encoding='utf-8').write('window.PALAVRAS = [];\n'); print('aviso: sem voz/palavras.json ainda (rode montar_voz.py): legenda vazia')
