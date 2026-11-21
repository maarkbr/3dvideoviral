"""Prévia em baixa resolução de um draft do CapCut (o montado ou o do projeto, já com os ajustes do Lucas):
cortes, zooms, cenas por cima, textos/legendas (aproximados) e áudio (voz, música, efeitos).

uso: PY previa.py DRAFT.json SAIDA.mp4 [--tam 960x540] [--de 0 --ate 60]
  DRAFT.json: PASTA/montado/draft.json, ou o draft_info.json de um projeto
  PY = o Python do painel (<pasta de trabalho>/_ferramentas/.venv/bin/python), com Pillow e numpy
A prévia serve para conferir ritmo, cortes e posição das coisas. Fonte e animação dos textos são aproximadas:
o visual final é o do CapCut.
"""
import json, os, shutil, subprocess, sys, tempfile

sys.path.insert(0, os.path.dirname(__file__))
import capcut as cc  # noqa: E402
from PIL import Image, ImageDraw, ImageFont  # noqa: E402

arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d  # noqa: E731
src_draft, out = sys.argv[1], sys.argv[2]
W, H = (int(x) for x in arg("--tam", "960x540").split("x"))
DE, ATE = float(arg("--de", 0)), arg("--ate")
D = cc.load(src_draft)
M = cc.materiais(D)
FPS = 30
TOT = D["duration"] / 1e6
ATE = min(float(ATE), TOT) if ATE else TOT
tmp = tempfile.mkdtemp(prefix="previa_")


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(" ".join(cmd[:14]) + " ...\n" + r.stderr[-1200:])


def pl(pts, var="t"):
    """expressão ffmpeg linear por partes a partir de [(t, v)]."""
    if len(pts) == 1:
        return f"{pts[0][1]:.5f}"
    e = f"{pts[-1][1]:.5f}"
    for (t0, v0), (t1, v1) in reversed(list(zip(pts, pts[1:]))):
        lin = f"({v0:.5f}+({v1 - v0:.5f})*({var}-{t0:.4f})/{max(1e-4, t1 - t0):.4f})"
        e = f"if(lt({var},{t1:.4f}),{lin},{e})"
    return f"if(lt({var},{pts[0][0]:.4f}),{pts[0][1]:.5f},{e})"


def kfs(seg, prop, padrao):
    src0 = (seg.get("source_timerange") or {"start": 0})["start"]
    for k in seg.get("common_keyframes") or []:
        if k["property_type"] == prop:
            return [((p["time_offset"] - src0) / 1e6, p["values"][0]) for p in k["keyframe_list"]]
    return [(0.0, padrao)]


# ---------- 1) faixa principal com zooms ----------
principal = D["tracks"][0]["segments"]
partes = []
for k, s in enumerate(principal):
    a, d = s["target_timerange"]["start"] / 1e6, s["target_timerange"]["duration"] / 1e6
    if a + d <= DE or a >= ATE:
        continue
    m = M[s["material_id"]][1]
    ss = s["source_timerange"]["start"] / 1e6
    corte0 = max(0.0, DE - a)
    dur = min(d, ATE - a) - corte0
    e0 = s["clip"]["scale"]["x"]
    S_, X_, Y_ = kfs(s, "KFTypeScaleX", e0), kfs(s, "KFTypePositionX", s["clip"]["transform"]["x"]), \
        kfs(s, "KFTypePositionY", s["clip"]["transform"]["y"])
    vel = float(s.get("speed", 1.0) or 1.0)
    sh = lambda pts: [(t / vel - corte0, v) for t, v in pts]      # keyframe em tempo da fonte -> tempo da edição
    se, xe, ye = pl(sh(S_)), pl(sh(X_)), pl(sh(Y_))
    iw, ih = m.get("width") or W, m.get("height") or H
    caber = min(W / iw, H / ih)
    # zoompan: janela iw/zoom x ih/zoom centrada onde o CapCut põe o centro da tela (ponto -t/s da imagem)
    vf = (f"setpts=PTS/{vel},fps={FPS},scale={W * 2}:{H * 2}:force_original_aspect_ratio=decrease,"
          f"pad={W * 2}:{H * 2}:(ow-iw)/2:(oh-ih)/2:color=black,"
          f"zoompan=z='max(1,({se}))':d=1:s={W}x{H}:fps={FPS}:"
          f"x='max(0,min(iw-iw/zoom,iw/2*(1-({xe})/zoom)-iw/zoom/2))':"
          f"y='max(0,min(ih-ih/zoom,ih/2*(1+({ye})/zoom)-ih/zoom/2))',format=yuv420p,setsar=1")
    vf = vf.replace("(t-", "(it-").replace("lt(t,", "lt(it,")
    p = f"{tmp}/p{k:04d}.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-ss", f"{ss + corte0 * vel:.4f}", "-t", f"{dur * vel:.4f}", "-i", m["path"], "-vf", vf,
         "-af", f"atempo={vel},volume={s.get('volume', 1.0)},aresample=48000", "-ac", "2", "-c:v", "libx264", "-preset", "ultrafast",
         "-crf", "28", "-c:a", "aac", "-b:a", "128k", p])
    partes.append(p)
open(f"{tmp}/lista.txt", "w").write("".join(f"file '{p}'\n" for p in partes))
base = f"{tmp}/base.mp4"
run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", f"{tmp}/lista.txt", "-c", "copy", base])

# ---------- 2) cenas por cima (vídeo/imagem) e textos como imagens ----------
camadas = []   # (arquivo, a, b, escala_px, x_px, y_px, eh_video, src)
for tr in D["tracks"][1:]:
    for s in tr["segments"]:
        a = s["target_timerange"]["start"] / 1e6
        b = a + s["target_timerange"]["duration"] / 1e6
        if b <= DE or a >= ATE:
            continue
        kind, m = M.get(s["material_id"], ("?", {}))
        if tr["type"] == "video" and kind == "videos":
            iw, ih = m.get("width") or W, m.get("height") or H
            e = s["clip"]["scale"]["x"]
            S_ = kfs(s, "KFTypeScaleX", e)
            e = max(v for _, v in S_)
            larg = iw * min(W / iw, H / ih) * e
            camadas.append({"f": m["path"], "a": a, "b": b, "w": int(larg / 2) * 2,
                            "x": W / 2 + s["clip"]["transform"]["x"] * W / 2, "y": H / 2 - s["clip"]["transform"]["y"] * H / 2,
                            "video": m.get("type") != "photo", "src": (s.get("source_timerange") or {"start": 0})["start"] / 1e6})
        elif tr["type"] == "text" and kind == "texts":
            c = json.loads(m["content"])
            txt = c.get("text", "")
            sts = c.get("styles") or [{}]
            tam = sts[0].get("size", 7) * s["clip"]["scale"]["x"]
            px = max(10, int(tam * H / 150))
            fp = sts[0].get("font", {}).get("path", "")
            try:
                fonte = ImageFont.truetype(fp, px)
            except Exception:
                fonte = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", px)
            larg = int(fonte.getlength(txt)) + 2 * px
            img = Image.new("RGBA", (max(8, larg), int(px * 1.6)), (0, 0, 0, 0))
            dr = ImageDraw.Draw(img)
            x = px
            borda = any(st.get("strokes") for st in sts)
            for st in sts:
                r0, r1 = st.get("range", [0, len(txt)])
                pedaco = txt[r0:r1]
                cor = st.get("fill", {}).get("content", {}).get("solid", {}).get("color", [1, 1, 1])
                rgb = tuple(int(v * 255) for v in cor)
                dr.text((x, int(px * 0.2)), pedaco, font=fonte, fill=rgb + (255,),
                        stroke_width=max(1, px // 14) if borda else 0, stroke_fill=(0, 0, 0, 255))
                x += int(fonte.getlength(pedaco))
            f = f"{tmp}/t{len(camadas):04d}.png"
            img.save(f)
            camadas.append({"f": f, "a": a, "b": b, "w": img.width - img.width % 2,
                            "x": W / 2 + s["clip"]["transform"]["x"] * W / 2, "y": H / 2 - s["clip"]["transform"]["y"] * H / 2,
                            "video": False, "src": 0})

atual = base
LOTE = 24
for i in range(0, len(camadas), LOTE):
    lote = camadas[i:i + LOTE]
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", atual]
    for c in lote:
        if c["video"]:
            cmd += ["-ss", f"{c['src']:.3f}", "-i", c["f"]]
        else:
            cmd += ["-loop", "1", "-i", c["f"]]
    fc, prev = [], "0:v"
    for j, c in enumerate(lote):
        a, b = c["a"] - DE, c["b"] - DE
        fc.append(f"[{j + 1}:v]scale={c['w']}:-2,setpts=PTS-STARTPTS+{max(0, a):.3f}/TB[s{j}]")
        fc.append(f"[{prev}][s{j}]overlay=x={c['x']:.1f}-overlay_w/2:y={c['y']:.1f}-overlay_h/2:"
                  f"enable='between(t,{a:.3f},{b:.3f})':eof_action=pass[o{j}]")
        prev = f"o{j}"
    nxt = f"{tmp}/c{i:04d}.mp4"
    cmd += ["-filter_complex", ";".join(fc), "-map", f"[{prev}]", "-map", "0:a?", "-t", f"{ATE - DE:.3f}",
            "-c:v", "libx264", "-preset", "ultrafast", "-crf", "28", "-c:a", "copy", nxt]
    run(cmd)
    atual = nxt

# ---------- 3) áudio: música e efeitos ----------
auds = []
for tr in D["tracks"]:
    if tr["type"] != "audio":
        continue
    for s in tr["segments"]:
        a = s["target_timerange"]["start"] / 1e6
        d = s["target_timerange"]["duration"] / 1e6
        if a + d <= DE or a >= ATE:
            continue
        m = M[s["material_id"]][1]
        auds.append((m["path"], a - DE, d, s["source_timerange"]["start"] / 1e6, s.get("volume", 1.0)))
if auds:
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", atual]
    fc = []
    for j, (p, a, d, ss, v) in enumerate(auds):
        cmd += ["-ss", f"{ss:.3f}", "-t", f"{d:.3f}", "-i", p]
        atraso = int(max(0, a) * 1000)
        fc.append(f"[{j + 1}:a]volume={v:.4f},aresample=48000,aformat=channel_layouts=stereo,adelay={atraso}|{atraso}[a{j}]")
    fc.append("[0:a]" + "".join(f"[a{j}]" for j in range(len(auds))) +
              f"amix=inputs={len(auds) + 1}:normalize=0:duration=first[am]")
    cmd += ["-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[am]", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", out]
    run(cmd)
else:
    shutil.copy(atual, out)
shutil.rmtree(tmp, ignore_errors=True)
print(f"prévia: {out} ({ATE - DE:.1f}s, {len(camadas)} camadas, {len(auds)} áudios)")
