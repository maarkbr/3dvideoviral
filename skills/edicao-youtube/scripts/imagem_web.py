"""Baixa uma imagem da internet (logo, print de site, ícone de app) e deixa pronta para o CapCut (PNG ou JPG).

uso: python3 imagem_web.py URL PASTA_DESTINO nome_do_arquivo [--fundo-claro]
  - .webp, .avif, .gif, .ico viram .png (o CapCut nem sempre abre esses);
  - anota a URL de origem em PASTA_DESTINO/creditos.md;
  - SVG: não converte aqui; procure a versão PNG do logo (ou tire um print da página no navegador).
Onde achar: site oficial (página de imprensa/brand/"press kit"), a loja de apps (ícone), Wikimedia Commons,
ou um print da própria página com o navegador. Prefira PNG com fundo transparente para logos.
"""
import os, subprocess, sys, urllib.request

url, dest, nome = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(dest, exist_ok=True)
base = os.path.join(dest, os.path.splitext(nome)[0])
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Macintosh) edicao-youtube/1.0"})
with urllib.request.urlopen(req, timeout=60) as r:
    dados = r.read()
    ctype = r.headers.get("Content-Type", "")
ext = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/gif": ".gif", "image/avif": ".avif",
       "image/svg+xml": ".svg", "image/x-icon": ".ico", "image/vnd.microsoft.icon": ".ico"}.get(ctype.split(";")[0],
                                                                                              os.path.splitext(url.split("?")[0])[1] or ".bin")
if ext == ".svg":
    raise SystemExit("é SVG: procure a versão PNG do logo ou tire um print da página")
tmp = base + "_orig" + ext
open(tmp, "wb").write(dados)
if ext in (".png", ".jpg", ".jpeg"):
    final = base + (".jpg" if ext == ".jpeg" else ext)
    os.replace(tmp, final)
else:
    final = base + ".png"
    r = subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-frames:v", "1", final], capture_output=True, text=True)
    if r.returncode:
        raise SystemExit("não consegui converter: " + r.stderr[-300:])
    os.remove(tmp)
w_h = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", final],
                     capture_output=True, text=True).stdout.strip()
with open(os.path.join(dest, "creditos.md"), "a") as f:
    f.write(f"- {os.path.basename(final)} — {url}\n")
print(final, w_h)
