"""Busca e baixa b-roll (vídeo) ou foto do Pexels, com crédito anotado.

uso: python3 pexels.py videos "termo em inglês" PASTA_DESTINO [--n 3] [--min-dur 4] [--max-dur 20] [--orient landscape]
     python3 pexels.py fotos  "termo em inglês" PASTA_DESTINO [--n 3] [--orient landscape]

A chave vem de PEXELS_API_KEY no ambiente ou de um arquivo .env (na pasta atual, na pasta do vídeo ou em
~/.claude/skills/edicao-youtube/.env). Nunca escreva a chave no chat nem em outro arquivo.
Grava os arquivos como pexels_<id>.mp4/.jpg e anota autor e link em PASTA_DESTINO/creditos.md.
Vídeo: escolhe o arquivo HD (1920 de largura, ou o mais próximo) — 4K pesa e o CapCut não precisa.
"""
import json, os, sys, urllib.parse, urllib.request

arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d  # noqa: E731
tipo, termo, dest = sys.argv[1], sys.argv[2], sys.argv[3]
N = int(arg("--n", 3))
ORI = arg("--orient", "landscape")


def chave():
    if os.environ.get("PEXELS_API_KEY"):
        return os.environ["PEXELS_API_KEY"]
    for p in (".env", os.path.join(dest, "..", ".env"), os.path.expanduser("~/.claude/skills/edicao-youtube/.env")):
        if os.path.exists(p):
            for linha in open(p):
                if linha.strip().startswith("PEXELS_API_KEY="):
                    return linha.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit("Sem PEXELS_API_KEY. Crie a chave grátis em pexels.com/api e cole em "
                     "~/.claude/skills/edicao-youtube/.env como PEXELS_API_KEY=...")


def get(url):
    req = urllib.request.Request(url, headers={"Authorization": chave(), "User-Agent": "edicao-youtube/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def baixar(url, path):
    req = urllib.request.Request(url, headers={"User-Agent": "edicao-youtube/1.0"})
    with urllib.request.urlopen(req, timeout=120) as r, open(path, "wb") as f:
        while True:
            b = r.read(1 << 20)
            if not b:
                break
            f.write(b)


os.makedirs(dest, exist_ok=True)
q = urllib.parse.quote(termo)
cred = open(os.path.join(dest, "creditos.md"), "a")
feitos = []
if tipo.startswith("v"):
    mn, mx = float(arg("--min-dur", 4)), float(arg("--max-dur", 25))
    j = get(f"https://api.pexels.com/videos/search?query={q}&orientation={ORI}&per_page=30&size=medium")
    for v in j.get("videos", []):
        if not (mn <= v["duration"] <= mx):
            continue
        fs = [f for f in v["video_files"] if f.get("file_type") == "video/mp4" and f.get("width")]
        if not fs:
            continue
        f = min(fs, key=lambda f: abs(f["width"] - 1920))
        path = os.path.join(dest, f"pexels_{v['id']}.mp4")
        if not os.path.exists(path):
            baixar(f["link"], path)
        cred.write(f"- {os.path.basename(path)} — vídeo de {v['user']['name']} no Pexels: {v['url']} (busca: {termo})\n")
        feitos.append((path, v["duration"], f["width"], f["height"]))
        if len(feitos) >= N:
            break
else:
    j = get(f"https://api.pexels.com/v1/search?query={q}&orientation={ORI}&per_page=15")
    for p in j.get("photos", [])[:N]:
        path = os.path.join(dest, f"pexels_{p['id']}.jpg")
        if not os.path.exists(path):
            baixar(p["src"]["large2x"], path)
        cred.write(f"- {os.path.basename(path)} — foto de {p['photographer']} no Pexels: {p['url']} (busca: {termo})\n")
        feitos.append((path, None, p["width"], p["height"]))
for x in feitos:
    print(*x)
if not feitos:
    print("nada encontrado — tente outro termo (2 ou 3 palavras concretas, em inglês)")
