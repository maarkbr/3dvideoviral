#!/usr/bin/env python3
"""Monta o projeto HyperFrames do vídeo de mapa a partir do roteiro.json e da voz (montar_voz.py).
uso: python montar.py <pasta do vídeo> [--rascunho]
  --rascunho  sem voz ainda: estima o tempo de cada bloco pelo número de palavras (~2,6 por segundo), para tirar as fotos
              das cenas e aprovar antes de gerar a voz. Depois da voz, rode de novo sem --rascunho.
Copia o kit (d3-geo, topojson, mapa.js/css, fonte), os ícones 3D usados (da pasta icones3d/ da skill; nunca emoji) e os
países (Natural Earth 50m) e escreve index.html + dados.js. Se a pasta tiver um cenas.js (cenas próprias deste vídeo), ele entra também."""
import argparse, html as H, json, os, shutil, urllib.parse, urllib.request
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
os.makedirs("emoji", exist_ok=True)
usados = set()
for b in blocos:
    c = b["cena"]; usados |= {c.get("emoji")} | set(c.get("emojis", [])) | {it.get("emoji") for it in c.get("itens", [])}
for e in sorted(usados - {None}):
    alvo = os.path.join("emoji", e + ".png")
    if os.path.exists(alvo):
        continue
    # NUNCA emoji: só os ícones 3D da biblioteca da skill (icones3d/), gerados por nós
    if os.path.exists(os.path.join(SK, "icones3d", e + ".png")):
        shutil.copy(os.path.join(SK, "icones3d", e + ".png"), alvo); continue
    print(f"FALTA o ícone '{e}' em {SK}/icones3d/. Gere no mesmo estilo (até 30 créditos): bash {SK}/scripts/gerar_icone.sh {e} \"<descrição do objeto em inglês>\" "
          "e rode o montar.py de novo. Não use emoji (Fluent/Unicode): fica com cara de amador.")

topo = json.load(open(os.path.join(SK, "dados", "countries-50m.json")))
D = {"dur": round(total + 0.6, 2), "inicios": inicios, "palavras": pal, "cenas": [b["cena"] for b in blocos],
     "destaques": rot.get("destaques", []), "cores": rot.get("cores", {}), "topo": topo}
cta = next((b["cena"] for b in blocos if b["cena"]["tipo"] == "cta"), None) or {}
teclas = "".join(f'<div class="tecla">{H.escape(l)}</div>' for l in cta.get("palavra", ""))
partes = []
if cta.get("selo"):
    logo = '<img src="kit/claude-logo.png">' if cta.get("logo") == "claude" else ""
    partes.append(f'<div class="ia">{logo}{H.escape(cta["selo"])}</div>')
if cta.get("antes", "Comenta"):
    partes.append(f'<div class="linha">{H.escape(cta.get("antes", "Comenta"))}</div>')
if teclas:
    partes.append(f'<div class="teclas">{teclas}</div>')
if cta.get("depois"):
    partes.append(f'<div class="linha" style="font-size:60px">{H.escape(cta["depois"])}</div>')
extra = '<script src="cenas.js"></script>' if os.path.exists("cenas.js") else ""
html = f"""<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=1080, height=1920">
<link rel="stylesheet" href="kit/mapa.css">
<script src="kit/gsap.min.js"></script>
<script src="kit/d3-array.min.js"></script><script src="kit/d3-geo.min.js"></script><script src="kit/topojson-client.min.js"></script>
<script src="kit/mapa.js"></script>{extra}<script src="dados.js"></script>
</head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{D['dur']}" data-width="1080" data-height="1920">
<canvas id="mapa" width="1080" height="1920"></canvas><div id="rotulos"></div><div id="legenda"></div>
<div id="cta">{''.join(partes)}</div>
</div>
<script>const tl = gsap.timeline({{ paused: true }}); MAPA(tl, window.DADOS); window.__timelines = window.__timelines || {{}}; window.__timelines["main"] = tl;</script>
</body></html>"""
open("dados.js", "w", encoding="utf-8").write("window.DADOS = " + json.dumps(D, ensure_ascii=False) + ";")
open("index.html", "w", encoding="utf-8").write(html)
if not os.path.exists("hyperframes.json"):
    json.dump({"$schema": "https://hyperframes.heygen.com/schema/hyperframes.json", "paths": {"assets": "assets"}, "media": {"autoProxy": True}}, open("hyperframes.json", "w"), indent=1)
    json.dump({"name": os.path.basename(P), "private": True, "type": "module", "devDependencies": {"@hyperframes/core": "^0.9.13"}}, open("package.json", "w"), indent=1)
print("ok", D["dur"], "s,", len(D["cenas"]), "cenas", "(rascunho)" if a.rascunho or not os.path.exists("voz/blocos.json") else "")
