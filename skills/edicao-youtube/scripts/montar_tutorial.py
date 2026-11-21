"""Monta tutorial ou patrocínio com a NARRAÇÃO gravada à parte: a voz (edl.json da skill) manda no tempo e a imagem vem
das gravações de tela feitas à parte (sem áudio), bloco a bloco, com zoom no clique, letreiros ("rotulos": [{"t","x","y","a","b"}]) e deriva lenta.

uso: python montar_patrocinio.py PASTA_DO_VIDEO [--ate SEG] [--so-audio] [--blocos i,j]

trabalho/blocos.json:
{
 "w": 2560, "h": 1440, "fps": 30,
 "narracao": "assets/<arquivo da narração>",        # o áudio do bruto (a edl aponta para ele)
 "blocos": [
   {"voz": [t0, t1]} ou {"silencio": seg},             # trecho da voz JÁ CORTADA (segundos) ou tempo sem voz
   "fonte": "assets/tela-higgsfield.mkv", "ss": 12.0,  # de onde vem a imagem
   "vel": 1.0,                                          # >1 acelera (espera); a imagem que faltar congela no último quadro
   "modo": "pagina" | "cheia" | "vertical",            # pagina = recorta só a página do Chrome (sem barras e Dock)
   "zoom": [{"x": 0.5, "y": 0.9, "s": 1.6, "a": 0.4, "b": 3.0}],   # centro em fração da PÁGINA, entra em a, sai em b
   "som": 0.0,                                          # volume do som do clipe (vídeos gerados)
   "selo": "publi"                                      # selo pequeno no canto (#publi)
 }]
}
"""
import json, os, subprocess, sys, tempfile

import numpy as np

V = os.path.abspath(sys.argv[1]); T = os.path.join(V, os.environ.get("TRAB", "trabalho"))
arg = sys.argv[2:]
ATE = float(arg[arg.index("--ate") + 1]) if "--ate" in arg else None
SO_AUDIO = "--so-audio" in arg
SO = [int(x) for x in arg[arg.index("--blocos") + 1].split(",")] if "--blocos" in arg else None
cfg = json.load(open(os.path.join(T, "blocos.json")))
W, H, FPS = cfg.get("w", 2560), cfg.get("h", 1440), cfg.get("fps", 30)
SR = 48000
PAG_Y, PAG_H, SRC_W, SRC_H = 302, 1676, 3840, 2160      # página do Chrome dentro da gravação 4K (medido)
FUNDO = "0x0A0A0B"
TMP = os.path.join(T, "montagem"); os.makedirs(TMP, exist_ok=True)


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit("ffmpeg falhou:\n" + " ".join(cmd)[:600] + "\n" + r.stderr[-1500:])


def ler_audio(caminho, ss=0.0, dur=None):
    cmd = ["ffmpeg", "-v", "error", "-ss", str(ss)] + (["-t", str(dur)] if dur else []) + [
        "-i", caminho, "-vn", "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def salvar_wav(x, caminho):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                          "-c:a", "pcm_f32le", caminho], stdin=subprocess.PIPE)
    p.communicate(x.astype(np.float32).tobytes())


# ---------- 1. voz cortada (a mesma edl da skill) ----------
def voz_cortada():
    edl = json.load(open(os.path.join(T, "edl.json")))
    fps = edl["fps"]; bruto = ler_audio(os.path.join(V, cfg["narracao"]))
    f = int(0.003 * SR); rampa = np.linspace(0, 1, f, dtype=np.float32)[:, None]
    partes = []
    for c in edl["clips"]:
        a, b = int(round(c["src0"] / fps * SR)), int(round(c["src1"] / fps * SR))
        p = bruto[a:b].copy()
        if len(p) > 2 * f:
            p[:f] *= rampa; p[-f:] *= rampa[::-1]
        partes.append(p)
    return np.concatenate(partes)


# ---------- 2. imagem de cada bloco ----------
def expr_zoom(zs, D):
    """Z(t) com entrada e saída suaves (0,8 s); vários zooms somam (não se sobrepõem)."""
    termos = []
    for z in zs:
        a, b, s = z.get("a", 0.0), min(z.get("b", D + 1), D + 1), z.get("s", 1.5)
        r = z.get("r", 0.8)   # tempo da entrada/saída (s); longo = aproximação lenta
        e = lambda t0: f"(clip((t-{t0:.3f})/{r},0,1)*clip((t-{t0:.3f})/{r},0,1)*(3-2*clip((t-{t0:.3f})/{r},0,1)))"
        termos.append(f"{s - 1:.4f}*({e(a)}-{e(b)})")
    return "1+" + "+".join(termos) if termos else "1"


def centro_expr(zs, eixo, Z, ph=PAG_H):
    """Centro do zoom em fração do quadro: muda junto com o zoom que estiver ativo."""
    if not zs:
        return "0.5"
    z = zs[0]
    # o quadro é a página centralizada num fundo 3840x2160 (faixa de (SRC_H-ph)/2 em cima e embaixo)
    c = z["x"] if eixo == "x" else ((SRC_H - ph) / 2 + z["y"] * ph) / SRC_H
    return f"{c:.4f}"


def recorte(fonte):
    """[x, y, w, h] da página do Chrome dentro da gravação (medido): tela inteira 4K ou só a janela."""
    for chave, r in cfg.get("recortes", {}).items():
        if chave in fonte:
            return r
    return [0, PAG_Y, SRC_W, PAG_H]


def _px(c, ph):
    x, y = int(c["x"] * SRC_W) // 2 * 2, int(c["y"] * ph) // 2 * 2
    w, h = min(int(c["w"] * SRC_W) // 2 * 2, SRC_W - x), min(int(c["h"] * ph) // 2 * 2, ph - y)
    return x, y, w, h


def desfoque(caixas, ph=PAG_H, nitido=None):
    """Desfoca retângulos da página (frações da página; opcional "a"/"b" em segundos do bloco).
    nitido = [...]: desfoca a página INTEIRA (um pouco mais escura) e devolve nítidos só esses retângulos
    (a barra de cima, o prompt, o resultado) — para esconder as capas da galeria com marca de terceiro."""
    if nitido is not None:
        f = ["[pg]split=" + str(len(nitido) + 1) + "[base]" + "".join(f"[s{k}]" for k in range(len(nitido))),
             "[base]boxblur=28:3,eq=brightness=-0.05[bl]"]
        atual = "[bl]"
        for k, c in enumerate(nitido):
            x, y, w, h = _px(c, ph)
            en = f":enable='between(t,{c['a']},{c['b']})'" if "a" in c else ""
            f.append(f"[s{k}]crop={w}:{h}:{x}:{y}[c{k}]")
            f.append(f"{atual}[c{k}]overlay={x}:{y}{en}[n{k}]")
            atual = f"[n{k}]"
        if not caixas:
            return ";".join(f) + ";", atual
        f.append(f"{atual}null[pg2]"); pre, entrada = ";".join(f) + ";", "[pg2]"
    else:
        pre, entrada = "", "[pg]"
    if not caixas:
        return pre, entrada
    f = [entrada + "split=" + str(len(caixas) + 1) + "[base2]" + "".join(f"[d{k}]" for k in range(len(caixas)))]
    atual = "[base2]"
    for k, c in enumerate(caixas):
        x, y, w, h = _px(c, ph)
        en = f":enable='between(t,{c['a']},{c['b']})'" if "a" in c else ""
        r = max(2, min(30, min(w, h) // 4 - 2))
        f.append(f"[d{k}]crop={w}:{h}:{x}:{y},boxblur={r}:3[b{k}]")
        f.append(f"{atual}[b{k}]overlay={x}:{y}{en}[o{k}]")
        atual = f"[o{k}]"
    return pre + ";".join(f) + ";", atual


def fazer_contador(base0, vel, D, saida):
    """Selo 'TRABALHANDO · N min' (tempo da sessão gravada) em quadros RGBA desenhados com o Pillow."""
    from PIL import Image, ImageDraw, ImageFont
    fb = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
    f1, f2 = ImageFont.truetype(fb, 30), ImageFont.truetype(fb, 56)
    n = int(round(D * FPS)) + 2; cache = {}
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", "520x130", "-r", str(FPS), "-i", "-",
                          "-c:v", "qtrle", saida], stdin=subprocess.PIPE)
    for k in range(n):
        m = int((base0 + k / FPS * vel) // 60)
        if m not in cache:
            im = Image.new("RGBA", (520, 130), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
            d.rounded_rectangle([0, 0, 519, 129], 22, fill=(16, 16, 20, 225), outline=(255, 255, 255, 50), width=2)
            d.text((30, 18), "TRABALHANDO SOZINHO", font=f1, fill=(255, 196, 0, 255))
            d.text((30, 56), f"{m} min", font=f2, fill=(255, 255, 255, 255))
            cache[m] = im.tobytes()
        p.stdin.write(cache[m])
    p.stdin.close(); p.wait()


def fazer_rotulo(texto, saida, estilo="amarelo"):
    """Pílula de destaque (o que a fala cita e a tela não mostra bem): amarela com texto preto, ou escura com borda."""
    from PIL import Image, ImageDraw, ImageFont
    fb = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"; f = ImageFont.truetype(fb, 64)
    w = int(ImageDraw.Draw(Image.new("RGBA", (10, 10))).textlength(texto, font=f)) + 110
    im = Image.new("RGBA", (w, 130), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    if estilo == "amarelo":
        d.rounded_rectangle([0, 0, w - 1, 129], 65, fill=(255, 196, 0, 255)); cor = (17, 17, 17, 255)
    else:
        d.rounded_rectangle([0, 0, w - 1, 129], 65, fill=(16, 16, 20, 235), outline=(255, 196, 0, 255), width=4); cor = (255, 255, 255, 255)
    d.text((55, 28), texto, font=f, fill=cor)
    im.save(saida)


def render_bloco(i, b, D, saida):
    fonte = os.path.join(V, b["fonte"]); ss = b.get("ss", 0.0); vel = b.get("vel", 1.0)
    modo = b.get("modo", "pagina"); zs = b.get("zoom", [])
    if modo == "pagina" and not zs and not b.get("parado"):
        # deriva: aproximação lenta e contínua (a tela nunca fica parada)
        zs = [{"x": b.get("dx", 0.5), "y": b.get("dy", 0.5), "s": 1.07, "a": 0.0, "b": D + 5, "r": max(D, 1.0)}]
    precisa = D * vel + 0.5
    if fonte.lower().endswith((".png", ".jpg", ".jpeg")):
        ent = ["-loop", "1", "-framerate", str(FPS), "-t", f"{precisa:.3f}", "-i", fonte]
    else:
        ent = ["-ss", f"{ss:.3f}", "-t", f"{precisa:.3f}", "-i", fonte]
    pre = f"setpts=(PTS-STARTPTS)/{vel},fps={FPS}"
    hold = f"tpad=stop_mode=clone:stop_duration={D + 1:.3f},trim=duration={D + 0.2:.3f},setpts=PTS-STARTPTS"
    if modo == "pagina":
        rx, ry, rw, rh = b.get("recorte") or recorte(b["fonte"])
        ph = int(round(SRC_W * rh / rw / 2)) * 2
        blur, saida_blur = desfoque(b.get("desfocar", []), ph, b.get("nitido"))
        base = (f"[0:v]crop={rw}:{rh}:{rx}:{ry},scale={SRC_W}:{ph},{pre},{hold}[pg];{blur}"
                f"{saida_blur}pad={SRC_W}:{SRC_H}:0:{(SRC_H - ph) // 2}:color={FUNDO}")
        if zs:
            # zoompan trabalha com quadro de tamanho FIXO (o scale eval=frame + crop prendia o recorte no canto de
            # cima à esquerda quando o bloco começava sem zoom). Tempo do bloco = on/FPS (d=1: 1 quadro por quadro).
            Z = expr_zoom(zs, D).replace("(t-", f"(on/{FPS}-")
            cx, cy = centro_expr(zs, "x", Z, ph), centro_expr(zs, "y", Z, ph)
            # a janela do zoom fica presa dentro da PÁGINA (sem mostrar a faixa escura de cima/baixo)
            topo, fundo = (SRC_H - ph) / 2 / SRC_H, (SRC_H + ph) / 2 / SRC_H
            lo, hi = f"({topo:.4f}*ih)", f"({fundo:.4f}*ih-ih/zoom)"
            vf = (f"{base},zoompan=z='{Z}':d=1:s={W}x{H}:fps={FPS}:"
                  f"x='clip({cx}*iw-iw/zoom/2,0,iw-iw/zoom)':"
                  f"y='if(gte({hi},{lo}),clip({cy}*ih-ih/zoom/2,{lo},{hi}),({lo}+{hi})/2)'")
        else:
            vf = f"{base},scale={W}:{H}:flags=lanczos"
        fc = f"{vf},setsar=1,format=yuv420p[v]"
    elif modo == "vertical":
        fc = (f"[0:v]{pre},{hold},split[a][b];[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
              f"boxblur=40:2,eq=brightness=-0.25[fundo];[b]scale=-2:{H}:flags=lanczos[frente];"
              f"[fundo][frente]overlay=(W-w)/2:0,setsar=1,format=yuv420p[v]")
    elif modo == "fundo":  # tela final: o vídeo desfocado e escuro, para os elementos de tela final do YouTube
        fc = (f"[0:v]{pre},{hold},scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{H},"
              f"boxblur=36:2,eq=brightness=-0.32:saturation=0.8,setsar=1,format=yuv420p[v]")
    else:  # cheia
        fc = (f"[0:v]{pre},{hold},scale={W}:{H}:force_original_aspect_ratio=decrease:flags=lanczos,"
              f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color={FUNDO},setsar=1,format=yuv420p[v]")
    extra_cont = []
    if "contador" in b:
        cont = os.path.join(TMP, f"contador{i:03d}.mov")
        fazer_contador(b["contador"], vel, D, cont)
        extra_cont = ["-i", cont]
        fc = fc.replace("[v]", "[vc]") + f";[vc][CONT:v]overlay={W - 580}:40:eof_action=repeat[v]"
    rot = b.get("rotulos", [])
    extra_rot = []
    for k, r in enumerate(rot):
        png = os.path.join(TMP, f"rot{i:03d}_{k}.png"); fazer_rotulo(r["t"], png, r.get("estilo", "amarelo"))
        extra_rot.append(png)
    selo = b.get("selo")
    extra = []
    if selo:
        png = os.path.join(T, "selos", f"{selo}.png")
        extra = ["-loop", "1", "-t", f"{D:.3f}", "-i", png]
        fc = fc.replace("[v]", "[v0]") + f";[v0][1:v]overlay=W-w-48:48:enable='between(t,0.3,{min(D, 6):.2f})'[v]"
    if extra_cont:
        fc = fc.replace("[CONT:v]", f"[{1 + (1 if extra else 0)}:v]")
    if extra_rot:
        base_idx = 1 + (1 if extra else 0) + (1 if extra_cont else 0)
        for k, r in enumerate(rot):
            j = base_idx + k; a, bb = r.get("a", 0.2), min(r.get("b", D), D)
            fc = fc.replace("[v]", f"[vr{k}]") + (f";[{j}:v]format=rgba,fade=t=in:st={a:.2f}:d=0.25:alpha=1,fade=t=out:st={max(a, bb - 0.25):.2f}:d=0.25:alpha=1[r{k}]"
                  f";[vr{k}][r{k}]overlay=x='{r.get('x', 0.5)}*W-w/2':y='{r.get('y', 0.12)}*H-h/2':enable='between(t,{a:.2f},{bb:.2f})'[v]")
        extra_cont = extra_cont + sum([["-loop", "1", "-t", f"{D:.3f}", "-i", png] for png in extra_rot], [])
    run(["ffmpeg", "-v", "error", "-y"] + ent + extra + extra_cont + ["-filter_complex", fc, "-map", "[v]", "-r", str(FPS),
         "-frames:v", str(max(1, b.get("_q") or int(round(D * FPS)))),
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "17", "-pix_fmt", "yuv420p", "-an", saida])


# ---------- 3. linha do tempo ----------
voz = voz_cortada()
pos = 0.0; linha = []
for i, b in enumerate(cfg["blocos"]):
    D = (b["voz"][1] - b["voz"][0]) if "voz" in b else b["silencio"]
    # o áudio usa o tempo exato (voz contínua); a imagem de cada bloco vai em quadros inteiros arredondados
    # a partir do tempo acumulado exato (no máximo meio quadro de diferença, sem acumular)
    b = dict(b, _q=int(round((pos + D) * FPS)) - int(round(pos * FPS)))
    linha.append((i, b, pos, D)); pos += D
TOTAL = pos if ATE is None else min(pos, ATE)
print(f"voz cortada {len(voz) / SR:.1f} s · linha do tempo {pos:.1f} s · {len(linha)} blocos")

# ---------- 4. áudio: voz no lugar + som dos clipes + trilha com ducking ----------
n = int(TOTAL * SR) + SR
pista_voz = np.zeros((n, 2), np.float32); pista_clip = np.zeros((n, 2), np.float32)
for i, b, t0, D in linha:
    if t0 >= TOTAL:
        break
    D = min(D, TOTAL - t0); a = int(t0 * SR)
    if "voz" in b:
        s = voz[int(b["voz"][0] * SR): int(b["voz"][0] * SR) + int(D * SR)]
        pista_voz[a:a + len(s)] += s
    if b.get("som", 0) > 0:
        s = ler_audio(os.path.join(V, b["fonte"]), b.get("ss", 0.0), D) * b["som"]
        f = int(0.15 * SR)
        if len(s) > 2 * f:
            s[:f] *= np.linspace(0, 1, f)[:, None]; s[-f:] *= np.linspace(1, 0, f)[:, None]
        pista_clip[a:a + len(s)] += s[: n - a]
# efeitos sonoros do pack: {"t": s na linha do tempo, "arquivo": caminho, "db": -12, "ss": 0}
inicio_bloco = {i: t0 for i, b, t0, D in linha}
for fx in cfg.get("sfx", []):
    t = fx["t"] if "bloco" not in fx else inicio_bloco[fx["bloco"]] + fx.get("dt", 0.0)
    if t >= TOTAL:
        continue
    s = ler_audio(os.path.join(V, fx["arquivo"]), fx.get("ss", 0.0), fx.get("dur")) * (10 ** (fx.get("db", -12) / 20))
    a = int(t * SR); s = s[: n - a]
    pista_clip[a:a + len(s)] += s
salvar_wav(pista_voz, os.path.join(TMP, "voz.wav")); salvar_wav(pista_clip, os.path.join(TMP, "clipes.wav"))

trilha = cfg.get("trilha", [])
mix = os.path.join(TMP, "mix.wav")
if trilha:
    ins = []
    for m in trilha:
        ins += ["-i", os.path.join(V, m) if not os.path.isabs(m) else m]
    k = len(trilha); cad = ""
    for j in range(k):
        ate = (cfg.get("trilha_ate") or [None] * k)[j]
        corte = f"atrim=0:{ate},afade=t=out:st={ate - 2}:d=2," if ate else ""
        cad += f"[{j + 2}:a]aresample={SR},aformat=channel_layouts=stereo,{corte}afade=t=in:d=1.5[m{j}];"
    seq = "[m0]"
    for j in range(1, k):
        seq_out = f"[x{j}]"; cad += f"{seq}[m{j}]acrossfade=d=3{seq_out};"; seq = seq_out
    nivel = cfg.get("trilha_db", -24)
    cad += (f"{seq}atrim=0:{TOTAL:.3f},afade=t=out:st={max(TOTAL - 3, 0):.3f}:d=3,volume={nivel}dB,"
            f"equalizer=f=2500:t=q:w=1.2:g=-4[mus];"
            f"[0:a][1:a]amix=inputs=2:normalize=0[fala];[fala]asplit[f1][f2];"
            f"[mus][f1]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=500[musd];"
            f"[f2][musd]amix=inputs=2:normalize=0[out]")
    run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(TMP, "voz.wav"), "-i", os.path.join(TMP, "clipes.wav")]
        + ins + ["-filter_complex", cad, "-map", "[out]", "-t", f"{TOTAL:.3f}", "-c:a", "pcm_f32le", mix])
else:
    run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(TMP, "voz.wav"), "-i", os.path.join(TMP, "clipes.wav"),
         "-filter_complex", "[0:a][1:a]amix=inputs=2:normalize=0[out]", "-map", "[out]", "-t", f"{TOTAL:.3f}",
         "-c:a", "pcm_f32le", mix])
# master −14 LUFS / −1 dBTP em 2 passadas
r = subprocess.run(["ffmpeg", "-hide_banner", "-i", mix, "-af", "loudnorm=I=-14:TP=-1:LRA=11:print_format=json",
                    "-f", "null", "-"], capture_output=True, text=True).stderr
med = json.loads(r[r.rindex("{"): r.rindex("}") + 1])
final_audio = os.path.join(TMP, "master.wav")
run(["ffmpeg", "-v", "error", "-y", "-i", mix, "-af",
     f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={med['input_i']}:measured_TP={med['input_tp']}:"
     f"measured_LRA={med['input_lra']}:measured_thresh={med['input_thresh']}:offset={med['target_offset']}:linear=true,"
     f"aresample={SR}", "-c:a", "pcm_s16le", final_audio])
print("áudio pronto (−14 LUFS)")
if SO_AUDIO:
    sys.exit(0)

# ---------- 5. vídeo ----------
lista = os.path.join(TMP, "lista.txt"); linhas = []
for i, b, t0, D in linha:
    if t0 >= TOTAL:
        break
    D = min(D, TOTAL - t0)
    out = os.path.join(TMP, f"b{i:03d}.mp4")
    if SO is None or i in SO or not os.path.exists(out):
        render_bloco(i, b, D, out)
        print(f"  bloco {i:3d} {t0:7.1f}s +{D:5.1f}s  {os.path.basename(b['fonte'])} @ {b.get('ss', 0):.1f}")
    linhas.append(f"file '{out}'")
open(lista, "w").write("\n".join(linhas) + "\n")
saida = os.path.join(V, "Prontos", cfg.get("saida", "higgsfield-primeiro-video") + (f"-previa{int(ATE)}" if ATE else "") + ".mp4")
run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lista, "-i", final_audio, "-map", "0:v",
     "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-shortest", "-movflags", "+faststart", saida])
ovs = [o for o in cfg.get("overlays", []) if (o["t"] if "bloco" not in o else 0) < TOTAL]
if os.environ.get("SEM_OV"):
    os.replace(saida, saida.replace(".mp4", "-sem-overlay.mp4")); print("sem overlays (burns.py aplica)"); sys.exit(0)
if ovs:
    base = saida.replace(".mp4", "-sem-overlay.mp4"); os.replace(saida, base)
    ent = ["-i", base]; fc = "[0:v]format=gbrp[b0];"; cur = "b0"
    for k, o in enumerate(ovs):
        t = o["t"] if "bloco" not in o else inicio_bloco[o["bloco"]] + o.get("dt", 0.0)
        ent += ["-itsoffset", f"{t:.3f}", "-i", os.path.join(V, o["arquivo"])]
        d = o.get("dur", 0.9)
        fc += (f"[{k + 1}:v]trim=start={o.get('ss', 0.0)}:duration={d},setpts=PTS-STARTPTS+{t:.3f}/TB,scale={W}:{H},format=gbrp,"
               f"fade=t=out:st={t + d - 0.25:.3f}:d=0.25[o{k}];"
               f"[{cur}][o{k}]blend=all_mode=screen:all_opacity={o.get('opacidade', 1.0)}:enable='between(t,{t:.3f},{t + d:.3f})':shortest=0:eof_action=pass[b{k + 1}];")
        cur = f"b{k + 1}"
    fc += f"[{cur}]format=yuv420p[v]"
    run(["ffmpeg", "-v", "error", "-y"] + ent + ["-filter_complex", fc, "-map", "[v]", "-map", "0:a", "-c:v", "libx264",
         "-preset", "medium", "-crf", "17", "-c:a", "copy", "-movflags", "+faststart", saida])
print("pronto:", saida)
