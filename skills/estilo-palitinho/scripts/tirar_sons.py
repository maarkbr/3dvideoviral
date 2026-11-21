#!/usr/bin/env python3
"""Tira do kit os momentos de cada efeito sonoro (whoosh, ping, pop, impacto, tecla) e grava work/sons.json.
uso: python3 tirar_sons.py <pasta do vídeo>
Abre o index.html num Chrome/Edge sem janela (acha sozinho no Mac, Windows e Linux), lê o <pre id="sons"> que o kit escreve."""
import glob, html, http.server, json, os, re, shutil, socketserver, subprocess, sys, threading

P = os.path.abspath(sys.argv[1]); os.chdir(P)
CAND = ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe", r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe", r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"]
CAND += [shutil.which(x) for x in ("google-chrome", "chromium", "chromium-browser", "microsoft-edge") if shutil.which(x)]
# sem Chrome nem Edge: o navegador que o HyperFrames baixa no primeiro render
CAND += sorted(glob.glob(os.path.expanduser("~/.cache/hyperframes/chrome/chrome-headless-shell/*/*/chrome-headless-shell*")), reverse=True)
chrome = next((c for c in CAND if c and os.path.isfile(c)), None)
if not chrome:
    sys.exit("não achei o Chrome, o Edge nem o navegador do HyperFrames. Rode o render uma vez (ele baixa o navegador) e tente de novo.")


class Quieto(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass


srv = socketserver.TCPServer(("127.0.0.1", 0), Quieto)
threading.Thread(target=srv.serve_forever, daemon=True).start()
url = f"http://127.0.0.1:{srv.server_address[1]}/index.html"
out = subprocess.run([chrome, "--headless=new", "--disable-gpu", "--virtual-time-budget=6000", "--dump-dom", url], capture_output=True, text=True, timeout=120).stdout
srv.shutdown()
m = re.search(r'<pre id="sons"[^>]*>(.*?)</pre>', out, re.S)
if not m:
    sys.exit("o kit não escreveu os sons (confira se o index.html abre sem erro).")
sons = json.loads(html.unescape(m.group(1)))
os.makedirs("work", exist_ok=True); json.dump(sons, open("work/sons.json", "w"))
print(len(sons), "efeitos em work/sons.json")
