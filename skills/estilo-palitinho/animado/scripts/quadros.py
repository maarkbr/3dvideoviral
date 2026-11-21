#!/usr/bin/env python3
"""Tira quadros parados do vídeo (antes de renderizar), monta uma folha para o Claude olhar e uma página para a pessoa.

uso: PY quadros.py <pasta-do-video> "2.3,6,8.2,15.5" ["legenda 1|legenda 2|..."]
grava <pasta>/quadros/qNN.jpg, quadros/folha.jpg (todos numa imagem só: abra com o Read) e quadros/index.html."""
import glob, html, os, shutil, subprocess, sys

HF = "hyperframes@0.9.58"
if len(sys.argv) < 3:
    sys.exit(__doc__)
pasta, tempos = os.path.abspath(os.path.expanduser(sys.argv[1])), sys.argv[2]
legs = sys.argv[3].split("|") if len(sys.argv) > 3 else []
TT = [t.strip() for t in tempos.split(",") if t.strip()]
saida_snap = os.path.join(pasta, ".hyperframes", "quadros-snap")
shutil.rmtree(saida_snap, ignore_errors=True)
npx = shutil.which("npx") or shutil.which("npx.cmd")
r = subprocess.run([npx, "--yes", HF, "snapshot", "--at", ",".join(TT), "--output", saida_snap], cwd=pasta,
                   capture_output=True, text=True)
fr = sorted(glob.glob(os.path.join(saida_snap, "frame-*.png")))[:len(TT)]   # às vezes vem um quadro extra do fim
if not fr:
    sys.exit("O snapshot não gerou quadros:\n" + (r.stderr or r.stdout)[-1500:])
q = os.path.join(pasta, "quadros")
os.makedirs(q, exist_ok=True)
for f in glob.glob(os.path.join(q, "q*.jpg")):
    os.remove(f)
for k, f in enumerate(fr, 1):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f, "-vf", "scale=540:-2", "-q:v", "3", os.path.join(q, f"q{k:02d}.jpg")], check=True)
cols = min(6, len(fr))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(q, "q%02d.jpg"), "-vf",
                f"scale=270:-2,tile={cols}x{(len(fr) + cols - 1) // cols}:padding=6:color=black", "-frames:v", "1",
                os.path.join(q, "folha.jpg")], check=True)
figs = "".join(f'<figure><img src="q{k:02d}.jpg" alt=""><figcaption><b>{html.escape(t)} s</b> · '
               f'{html.escape(legs[k - 1] if k - 1 < len(legs) else "")}</figcaption></figure>' for k, t in enumerate(TT[:len(fr)], 1))
open(os.path.join(q, "index.html"), "w", encoding="utf-8").write(f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Quadros para conferir</title>
<style>
 :root {{ --fundo: #0e1030; --texto: #f4f2ff; --sub: #b9b6dd; --amarelo: #ffd93d; }}
 * {{ box-sizing: border-box; }}
 body {{ margin: 0; background: var(--fundo); color: var(--texto); font: 15px/1.4 system-ui, sans-serif; padding: 20px 16px 40px; }}
 h1 {{ font-size: 20px; margin: 0 0 4px; }} p.sub {{ margin: 0 0 18px; color: var(--sub); }}
 .grade {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }}
 figure {{ margin: 0; }} img {{ width: 100%; aspect-ratio: 9 / 16; object-fit: cover; border-radius: 12px; display: block; background: #000; }}
 figcaption {{ margin-top: 6px; font-size: 13px; color: var(--sub); }} figcaption b {{ color: var(--amarelo); }}
</style></head><body>
<h1>Quadros parados</h1><p class="sub">Um quadro por momento. O vídeo ainda não foi renderizado.</p>
<div class="grade">{figs}</div></body></html>
""")
print(f"{len(fr)} quadros em {q}")
print(f"  folha para olhar: {os.path.join(q, 'folha.jpg')}")
print(f"  página para a pessoa: {os.path.join(q, 'index.html')}")
