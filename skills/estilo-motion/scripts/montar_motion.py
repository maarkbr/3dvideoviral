#!/usr/bin/env python3
"""Monta o index.html do vídeo motion a partir do roteiro.json, da voz (voz_motion.py) e da marca do cliente.
uso: python montar_motion.py <projeto>
- Marca: procura marca.json no projeto e nas pastas acima (a pasta de trabalho do Edição com IA). Usa acento (cor), nome, logo
  e tema ("escuro" ou "claro"; o roteiro.json pode trocar com "tema").
- Sem voz (sem voz/blocos.json): cada bloco dura o "dur" dele (padrão 2,6 s). Serve para motion só com trilha.
- Gera também work/sons.json: os efeitos (whoosh nas trocas de cena, pop na palavra em destaque, clique no botão final,
  assinatura sonora no logo), que o finalizar_motion.py mixa com a voz."""
import json, os, re, shutil, sys, unicodedata

P = os.path.abspath(sys.argv[1]); os.chdir(P)
rot = json.load(open("roteiro.json", encoding="utf-8"))
blocos = rot["blocos"]
os.makedirs("work", exist_ok=True); os.makedirs("assets", exist_ok=True)

# ---------- tempos ----------
if os.path.exists("voz/blocos.json"):
    bj = json.load(open("voz/blocos.json")); INI, DUR = bj["inicios"], bj["total"]
    PAL = json.load(open("voz/palavras.json", encoding="utf-8"))
else:
    INI, t = [], 0.3
    for b in blocos:
        INI.append(round(t, 2)); t += float(b.get("dur", 2.6))
    DUR, PAL = round(t + 0.8, 2), []
    print("sem voz: usando o 'dur' de cada bloco")

# ---------- marca ----------
def acha_marca():
    d = P
    while True:
        c = os.path.join(d, "marca.json")
        if os.path.exists(c):
            return json.load(open(c, encoding="utf-8")), d
        nd = os.path.dirname(d)
        if nd == d:
            return {}, P
        d = nd
marca, dir_marca = acha_marca()
cor = marca.get("acento") if re.fullmatch(r"#[0-9A-Fa-f]{6}", str(marca.get("acento", ""))) else "#F2C200"
tema = rot.get("tema") or marca.get("tema") or "escuro"
r, g, b = (int(cor[i:i + 2], 16) / 255 for i in (1, 3, 5))
lin = lambda v: v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
sobre = "#0B0D12" if lum > 0.32 else "#FFFFFF"
rgb = f"{round(r * 255)},{round(g * 255)},{round(b * 255)}"
if tema == "claro":
    VARS = {"--fundo": "#F4F5F8", "--fundo-2": "#FFFFFF", "--texto": "#12141A", "--texto-2": "#5D6370", "--linha": "rgba(0,0,0,.08)", "--brilho": f"rgba({rgb},.16)"}
else:
    VARS = {"--fundo": "#0B0D12", "--fundo-2": "#151922", "--texto": "#F4F6FA", "--texto-2": "#A7ADBA", "--linha": "rgba(255,255,255,.10)", "--brilho": f"rgba({rgb},.22)"}
VARS.update({"--marca": cor, "--sobre-marca": sobre})
logo = None
if marca.get("logo"):
    src = os.path.join(dir_marca, marca["logo"])
    if os.path.exists(src):
        logo = "assets/logo" + os.path.splitext(src)[1].lower()
        shutil.copy(src, logo)
M = {"nome": rot.get("nome") or marca.get("nome") or "", "logo": logo, "selo": rot.get("selo", True)}

# ---------- cenas ----------
CENAS = []
for i, bl in enumerate(blocos):
    c = dict(bl.get("cena") or {"tipo": "frase", "texto": bl.get("fala", "")})
    for k in ("imagem", "ilustra"):
        if c.get(k) and not os.path.exists(c[k]):
            print(f"ATENÇÃO bloco {i + 1}: imagem não encontrada: {c[k]}")
    CENAS.append(c)
DADOS = {"dur": DUR, "inicios": INI, "palavras": [{"w": p["w"], "s": p["s"], "bloco": p["bloco"]} for p in PAL], "cenas": CENAS, "marca": M}

# ---------- sons (efeitos nos momentos certos) ----------
norm = lambda x: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", str(x).lower()).encode("ascii", "ignore").decode())
def quando(i, palavra, padrao):
    if not palavra:
        return padrao
    n = norm(str(palavra).split()[0])
    return next((p["s"] for p in PAL if p["bloco"] == i and norm(p["w"]) == n), padrao)
SONS = []
for i, c in enumerate(CENAS):
    t0 = INI[i]
    if i > 0:
        SONS.append({"t": t0, "som": "whooshes/whoosh-medium-soft", "sync": 0.229, "vol": 0.20})
    for campo in ("texto", "titulo"):
        m = re.search(r"\*([^*]+)\*", c.get(campo) or "")
        if m:
            SONS.append({"t": max(t0 + 0.2, quando(i, m.group(1), t0 + 0.35)), "som": "pops/pop-small-in", "sync": 0.0, "vol": 0.16})
    if c.get("tipo") == "logo":
        SONS.append({"t": t0 + 0.35, "som": "logo-stings/sting-minimal-short", "sync": 0.100, "vol": 0.22})
    if c.get("tipo") == "cta":
        SONS.append({"t": quando(i, c.get("em"), t0 + 1.3), "som": "interface/click-mouse-firm", "sync": 0.009, "vol": 0.35})
json.dump({"dur": DUR, "sons": SONS}, open("work/sons.json", "w"), indent=1)

css_vars = ";".join(f"{k}:{v}" for k, v in VARS.items())
html = f"""<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=1080, height=1920">
<link rel="stylesheet" href="kit/motion.css">
<style>:root{{{css_vars}}}</style>
<script src="kit/gsap.min.js"></script>
<script src="kit/motion.js"></script>
</head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="1080" data-height="1920">
<div id="fundo"></div><div id="grade"></div><div id="palco"></div>
</div>
<script>
window.DADOS = {json.dumps(DADOS, ensure_ascii=False)};
const tl = gsap.timeline({{ paused: true }});
MOTION(tl, window.DADOS);
window.__timelines = window.__timelines || {{}};
window.__timelines["main"] = tl;
</script>
</body></html>"""
# a biblioteca de animação vai junto no kit (nada de buscar na internet na hora de gerar); projeto antigo ganha a cópia aqui
SK_KIT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "kit")
if os.path.isdir("kit") and not os.path.isfile(os.path.join("kit", "gsap.min.js")):
    shutil.copyfile(os.path.join(SK_KIT, "gsap.min.js"), os.path.join("kit", "gsap.min.js"))
open("index.html", "w", encoding="utf-8").write(html)
print(f"index.html pronto: {DUR}s, {len(CENAS)} cenas, tema {tema}, cor {cor} (texto sobre ela: {sobre}), logo {'sim' if logo else 'não'}, {len(SONS)} efeitos em work/sons.json")
