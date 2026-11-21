"""Gera o index.html do vídeo 3D a partir do roteiro.json e da voz (voz_3d.py).
uso: python montar_3d.py <projeto>
As etiquetas do roteiro usam "de"/"ate" em segundos de um bloco de 10 s; o script escala pela duração real de cada fala."""
import json, os, sys
P = os.path.abspath(sys.argv[1]); os.chdir(P)
rot = json.load(open("roteiro.json"))
pal = json.load(open("voz/palavras.json"))
bj = json.load(open("voz/blocos.json")); b, DUR = bj["inicios"], bj["total"]
LB = [(b[i + 1] if i + 1 < len(b) else DUR - 1.2) - b[i] for i in range(len(b))]
bt = lambda i, x: b[i] + min(x, 10) * LB[i] / 10
ET = []
for i, bl in enumerate(rot["blocos"]):
    for e in bl.get("etiquetas", []):
        ET.append({"txt": e["txt"], "p": e["p"], "a": round(bt(i, e.get("de", 1)), 2), "b": round(bt(i, e.get("ate", 10)), 2)})
DADOS = {"dur": DUR, "blocos": b, "palavras": [{"w": p["w"], "s": p["s"], "e": p["e"]} for p in pal], "etiquetas": ET}
html = f"""<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=1080, height=1920">
<style>@font-face{{font-family:"M";font-weight:100 900;src:url("lib/fonts/Montserrat-VF.woff2") format("woff2");}}
*{{margin:0;padding:0;box-sizing:border-box}}html,body{{width:1080px;height:1920px;overflow:hidden;background:#8FD0F5}}
#root{{position:relative;width:1080px;height:1920px;overflow:hidden}}
#cena{{position:absolute;left:0;top:0;width:1080px;height:1920px}}
#etq{{position:absolute;inset:0;pointer-events:none}}
.etq{{position:absolute;left:0;top:0;white-space:nowrap;font:900 44px "M";color:#FFD21F;letter-spacing:.01em;
-webkit-text-stroke:8px #1A1A1A;paint-order:stroke fill;opacity:0;transform-origin:50% 100%}}
#leg{{position:absolute;left:0;width:1080px;top:1260px;text-align:center;font:800 64px "M";color:#fff;
-webkit-text-stroke:9px #111;paint-order:stroke fill;text-shadow:0 6px 18px rgba(0,0,0,.35)}}
</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="1080" data-height="1920">
<canvas id="cena" width="1080" height="1920"></canvas><div id="etq"></div><div id="leg"></div></div>
<script type="importmap">{{"imports":{{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}}}</script>
<script>window.DADOS={json.dumps(DADOS, ensure_ascii=False)};</script>
<script type="module" src="cena.js"></script>
</body></html>"""
open("index.html", "w").write(html)
print(f"index.html pronto: {DUR}s, {len(pal)} palavras, {len(ET)} etiquetas, falas em {b}")
