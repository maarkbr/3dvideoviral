#!/usr/bin/env python3
"""Monta o projeto HyperFrames do vídeo de palitinho a partir do roteiro.json e da voz (montar_voz.py).
uso: python3 montar.py <pasta do vídeo> [--rascunho]
  --rascunho  sem voz ainda: estima o tempo de cada bloco pelo número de palavras (~2,6 por segundo), para tirar as fotos
              das cenas e aprovar antes de gerar a voz. Depois da voz, rode de novo sem --rascunho.
Copia o kit (palitinho.js/css, gsap, fonte) e escreve index.html + dados.js. Se a pasta tiver um cenas.js (cenas próprias
deste vídeo, com window.CENAS_EXTRA), ele entra também."""
import argparse, html as H, json, os, shutil
SK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument("pasta"); ap.add_argument("--rascunho", action="store_true")
a = ap.parse_args(); P = os.path.abspath(a.pasta); os.chdir(P)
rot = json.load(open("roteiro.json", encoding="utf-8"))
blocos = rot["blocos"]

if a.rascunho or not os.path.exists("voz/blocos.json"):
    if not a.rascunho:
        print("sem voz/blocos.json: montando em modo rascunho (tempos estimados)")
    inicios, pal, t = [], [], 0.3
    for k, b in enumerate(blocos):
        ws = b["fala"].split(); d = max(3.0, len(ws) / 2.6 + 0.4); inicios.append(round(t, 3))
        for j, w in enumerate(ws):
            s = t + 0.1 + j * (d - 0.4) / max(1, len(ws)); pal.append({"w": w, "s": round(s, 3), "e": round(s + 0.3, 3), "bloco": k})
        t += d + 0.18
    total = round(t, 3)
else:
    bj = json.load(open("voz/blocos.json")); pal = json.load(open("voz/palavras.json", encoding="utf-8"))
    inicios, total = bj["inicios"], bj["total"]

shutil.copytree(os.path.join(SK, "kit"), "kit", dirs_exist_ok=True)

# modo caprichado: clipes animados (clipes/bN.mp4, do animar_cenas.py) por baixo do desenho em código, encaixados no tempo do bloco
import subprocess
videos = []
os.makedirs("assets", exist_ok=True)
for i, b in enumerate(blocos):
    clip = b["cena"].get("video") if isinstance(b["cena"].get("video"), str) else f"clipes/b{i + 1}.mp4"
    if b["cena"].get("video") is False or not os.path.exists(clip) or not b["cena"].get("imagem"):
        continue
    ini = inicios[i]; fim = inicios[i + 1] if i + 1 < len(inicios) else total + 0.6; dur = round(fim - ini, 3)
    cd = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", clip], capture_output=True, text=True).stdout or 5)
    k = min(max(dur / cd, 0.75), 1.35)  # acelera ou desacelera até ~30%; se ainda faltar, segura o último quadro
    out = f"assets/v{i + 1}.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", clip, "-vf", f"scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setpts=PTS*{k:.4f},"
                    f"tpad=stop_mode=clone:stop_duration={dur:.3f},fps=30", "-t", f"{dur:.3f}", "-an", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", out], check=True)
    b["cena"]["video"] = True
    videos.append(f'<video id="v{i + 1}" class="clip" src="{out}" muted playsinline data-start="{ini}" data-duration="{dur}" data-track-index="1" '
                  f'data-volume="0" style="position:absolute;left:0;top:0;width:1080px;height:1920px;object-fit:cover;z-index:0"></video>')
D = {"dur": round(total + 0.6, 2), "inicios": inicios, "palavras": pal, "cenas": [b["cena"] for b in blocos],
     "destaques": rot.get("destaques", []), "cores": rot.get("cores", {})}
cta = next((b["cena"] for b in blocos if b["cena"].get("tipo") == "cta"), None) or {}
teclas = "".join(f'<div class="tecla">{H.escape(l)}</div>' for l in cta.get("palavra", ""))
partes = []
if cta.get("selo"):
    logo = '<img src="kit/claude-logo.png">' if cta.get("logo") == "claude" else ""
    partes.append(f'<div class="ia">{logo}{H.escape(cta["selo"])}</div>')
partes.append(f'<div class="linha">{H.escape(cta.get("antes", "Comenta"))}</div>')
if teclas:
    partes.append(f'<div class="teclas">{teclas}</div>')
if cta.get("depois"):
    partes.append(f'<div class="linha" style="font-size:54px">{H.escape(cta["depois"])}</div>')
extra = '<script src="cenas.js"></script>' if os.path.exists("cenas.js") else ""
n = max(1, len(cta.get("palavra", ""))); tw = min(136, int(860 / n) - 18)
html = f"""<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=1080, height=1920">
<link rel="stylesheet" href="kit/palitinho.css">
<script src="kit/gsap.min.js"></script><script src="kit/palitinho.js"></script>{extra}<script src="dados.js"></script>
</head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{D['dur']}" data-width="1080" data-height="1920">
{''.join(videos)}
<svg id="palco" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920"></svg>
<div id="legenda"></div><div id="cta" style="--tw:{tw}px">{''.join(partes)}</div>
</div>
<script>const tl = gsap.timeline({{ paused: true }}); PALITO(tl, window.DADOS); window.__timelines = window.__timelines || {{}}; window.__timelines["main"] = tl;</script>
</body></html>"""
open("dados.js", "w", encoding="utf-8").write("window.DADOS = " + json.dumps(D, ensure_ascii=False) + ";")
open("index.html", "w", encoding="utf-8").write(html)
if not os.path.exists("hyperframes.json"):
    json.dump({"$schema": "https://hyperframes.heygen.com/schema/hyperframes.json", "paths": {"assets": "assets"}, "media": {"autoProxy": True}}, open("hyperframes.json", "w"), indent=1)
    json.dump({"name": os.path.basename(P), "private": True, "type": "module", "devDependencies": {"@hyperframes/core": "^0.9.13"}}, open("package.json", "w"), indent=1)
print("ok", D["dur"], "s,", len(D["cenas"]), "cenas", "(rascunho)" if a.rascunho or not os.path.exists("voz/blocos.json") else "")
