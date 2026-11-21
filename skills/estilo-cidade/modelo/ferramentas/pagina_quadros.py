# Monta as páginas de conferência no painel do app: quadros parados (antes do render) e o vídeo pronto.
#
# Uso: PY ferramentas/pagina_quadros.py <pasta do projeto> <pasta de prints> [mais pastas de prints...]
#   as pastas de prints são as que o "hyperframes snapshot -o" criou (a última vence quando o segundo se repete)
# Gera <projeto>/quadros/index.html (grade de quadros) e quadros/video.html (player do vídeo pronto).
import glob, json, os, re, subprocess, sys

PASTA = sys.argv[1].rstrip("/")
SAIDA = os.path.join(PASTA, "quadros")
os.makedirs(SAIDA, exist_ok=True)
D = json.load(open(os.path.join(PASTA, "assets/audio/palavras.json"), encoding="utf-8"))
FRASES = [re.sub(r"\{[^|]+\|([^}]+)\}", lambda m: m.group(1), f) for f in D.get("frases", [])]
nome = os.path.basename(PASTA)
titulo = nome.replace("-", " ").title()

fontes = {}
for pasta in sys.argv[2:]:
    for f in glob.glob(os.path.join(pasta, "frame-*-at-*s.png")):
        fontes[float(re.search(r"at-([\d.]+)s", f).group(1))] = f
cartoes = []
for t in sorted(fontes):
    arq = f"quadro-{t:06.2f}s.jpg".replace(".", "_", 1)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", fontes[t], "-vf", "scale=720:-2", "-q:v", "3", os.path.join(SAIDA, arq)], check=True)
    b = next((x for x in D["blocos"] if x["ini"] <= t < x["fim"] + 0.001), D["blocos"][-1])
    frase = FRASES[b["n"] - 1] if FRASES else ""
    m, s = divmod(t, 60)
    cartoes.append(f'      <figure><img src="{arq}" alt="Quadro em {int(m)}:{s:04.1f}" loading="lazy" /><figcaption><span class="tempo">{int(m)}:{s:04.1f}</span><span class="bloco">bloco {b["n"]}</span><p>{frase}</p></figcaption></figure>')

ESTILO = """
      :root { --fundo: #14120e; --cartao: #1f1c17; --texto: #f3ede2; --apagado: #b6ad9f; --destaque: #f3c45a; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: var(--fundo); color: var(--texto); font: 16px/1.5 -apple-system, "Helvetica Neue", Arial, sans-serif; padding: 28px 16px 60px; }
      main { max-width: 1200px; margin: 0 auto; }
      h1 { font-size: 30px; letter-spacing: -0.01em; }
      .sub { color: var(--apagado); margin: 6px 0 22px; }
      .grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
      figure { background: var(--cartao); border-radius: 14px; overflow: hidden; }
      figure img { display: block; width: 100%; aspect-ratio: 9 / 16; object-fit: cover; background: #000; }
      figcaption { padding: 10px 12px 14px; }
      .tempo { font-weight: 700; color: var(--destaque); margin-right: 8px; font-variant-numeric: tabular-nums; }
      .bloco { font-size: 13px; color: var(--apagado); }
      figcaption p { margin-top: 4px; font-size: 14px; }
      a { color: var(--texto); }
"""
open(os.path.join(SAIDA, "index.html"), "w", encoding="utf-8").write(f"""<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{titulo}: quadros</title>
    <style>{ESTILO}</style>
  </head>
  <body>
    <main>
      <h1>{titulo}: quadros para conferir</h1>
      <p class="sub">{len(cartoes)} quadros parados, já com a legenda · {D['duracao']:.1f} s de vídeo · <a href="video.html">vídeo pronto</a></p>
      <div class="grade">
{chr(10).join(cartoes)}
      </div>
    </main>
  </body>
</html>
""")
open(os.path.join(SAIDA, "video.html"), "w", encoding="utf-8").write(f"""<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{titulo}</title>
    <style>{ESTILO}
      html, body {{ height: 100%; }}
      body {{ display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 16px; }}
      video {{ height: calc(100vh - 80px); max-width: 100%; aspect-ratio: 9 / 16; background: #000; border-radius: 14px; }}
      p {{ color: var(--apagado); }}
    </style>
  </head>
  <body>
    <video src="{nome}.mp4" controls playsinline preload="auto"></video>
    <p>{titulo} · 1080x1920 · <a href="index.html">ver os quadros parados</a></p>
  </body>
</html>
""")
print(len(cartoes), "quadros em", os.path.join(SAIDA, "index.html"))
