"""Busca temas de vídeo 3D que já funcionaram lá fora (YouTube), ordenados por visualização.
uso: python temas_3d.py [--tema "bunker"] [--max 15] [--curtos] [--saida temas.md]
Sem --tema, usa buscas prontas do nicho ("what if you built…", "how it's made 3D"...). Precisa do yt-dlp (brew/pip install yt-dlp).
Só lê a busca pública do YouTube: não entra em conta nenhuma."""
import argparse, subprocess, sys

ap = argparse.ArgumentParser()
ap.add_argument("--tema", default=""); ap.add_argument("--max", type=int, default=15)
ap.add_argument("--curtos", action="store_true", help="só vídeos de até 3 min (formato Shorts/Reels)")
ap.add_argument("--saida", default="temas.md")
a = ap.parse_args()
BASE = ["what if you built a {t} 3d animation", "how a {t} is built 3d animation", "building a {t} one problem at a time",
        "{t} cutaway 3d animation", "how it's made {t} 3d"] if a.tema else \
       ["one disaster at a time animation", "one problem at a time building animation", "how it works 3d animation engineering shorts",
        "cutaway animation how it's built shorts", "how they built it 3d animation shorts", "engineering explained 3d animation shorts"]
buscas = [q.format(t=a.tema) for q in BASE]
vistos, linhas = set(), []
for q in buscas:
    r = subprocess.run(["yt-dlp", "--flat-playlist", "--print", "%(id)s\t%(view_count)s\t%(duration)s\t%(channel)s\t%(title)s",
                        f"ytsearch{a.max}:{q}"], capture_output=True, text=True, timeout=180)
    for l in r.stdout.splitlines():
        p = l.split("\t")
        if len(p) < 5 or p[0] in vistos: continue
        vistos.add(p[0])
        v = int(p[1]) if p[1].isdigit() else 0
        d = float(p[2]) if p[2] not in ("NA", "None", "") else 0
        if a.curtos and d > 180: continue
        linhas.append((v, d, p[3], p[4], p[0]))
linhas.sort(reverse=True)
out = ["| views | duração | canal | título | link |", "|---:|---:|---|---|---|"]
out += [f"| {v:,} | {int(d)//60}:{int(d)%60:02d} | {c} | {t} | https://youtu.be/{i} |".replace(",", ".") for v, d, c, t, i in linhas[:40]]
open(a.saida, "w").write("# Temas que já funcionaram (busca no YouTube)\n\n" + "\n".join(out) + "\n")
print("\n".join(out[:22])); print(f"\n{len(linhas)} vídeos; tabela completa em {a.saida}")
