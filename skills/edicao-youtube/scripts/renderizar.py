"""Vídeo final 100% no Claude — sem CapCut e sem Premiere: cortes + intro + enquadramento/zoom suave + volume + trilha
+ master em −14 LUFS, num MP4 pronto para o YouTube.

uso: python3 renderizar.py PASTA_TRABALHO saida.mp4 [--intro intro_mix.mov] [--audio audio_da_gravacao.wav]
        [--enquadrar enquadramento.json] [--ganhos ganhos.json] [--trilha trilha.wav]
        [--resolucao fullhd|2k|4k] [--fps 30|60] [--ate SEGUNDOS] [--rapido]

  PASTA_TRABALHO  tem o edl.json (cortes) e o job.json (gravação; "resolucao" escolhida no passo 1)
  --intro         a intro pronta COM som e SEM master (mixar_intro.py → render/intro_vN_mix.mov): entra antes da aula
  --audio         o áudio da gravação no tamanho do bruto (ex.: o melhorado do Adobe já remontado com audio_adobe.py
                  voltar); sem ele, o som da própria gravação
  --enquadrar     o json do enquadrar_tela.py (base sem barra/Dock + zoom suave com keyframes); sem ele, a tela inteira
  --ganhos        o json do nivelar_voz.py (falas baixas) · --trilha o WAV do trilha_corpo.py (começa no fim da intro)
  --ate           só os primeiros N s da linha do tempo — prévia rápida para a pessoa aprovar antes do render inteiro
  --rapido        codificador do Mac (VideoToolbox) no lugar do x264: bem mais rápido, arquivo maior

Cada clipe da gravação vira um pedaço (corte + enquadramento, zoom animado por expressão no tempo), os pedaços
são emendados sem recodificar, o áudio é montado à parte com precisão de amostra (3 ms de transição em cada emenda
para não estalar), somado à trilha, e o master final é loudnorm em 2 passadas (−14 LUFS, −1 dBTP).
Leva ~1x a duração do vídeo em 1440p60 num Mac M (x264 veryfast); rode em segundo plano e avise.
"""
import json, os, shutil, subprocess, sys, tempfile

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from premiere_ler import ler_linha  # noqa: E402
from resolucao import resolucao  # noqa: E402

a = sys.argv[1:]
opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d  # noqa: E731
wd, saida = os.path.abspath(a[0]), os.path.abspath(a[1])
J = json.load(open(os.path.join(wd, "job.json"))) if os.path.exists(os.path.join(wd, "job.json")) else {}
W, H = resolucao(opt("--resolucao"), wd)
intro = opt("--intro")
L = ler_linha(wd, intro=intro, audio=opt("--audio"))
v1 = L["faixas"][0]["clipes"]
bruto = next(c["arquivo"] for c in v1 if not intro or c["arquivo"] != os.path.abspath(intro))


def sondar(p):
    o = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate:format=duration",
                                   "-of", "json", p], capture_output=True, text=True).stdout)
    v = next((s for s in o["streams"] if s["codec_type"] == "video"), {})
    fr = v.get("r_frame_rate", "30/1").split("/")
    return float(o["format"]["duration"]), v.get("width"), v.get("height"), int(fr[0]) / max(1, int(fr[1]))


_, SW, SH, rfps = sondar(bruto)
FPS = int(opt("--fps", 60 if rfps >= 50 else 30))
ATE = float(opt("--ate")) if opt("--ate") else None
ENQ = json.load(open(opt("--enquadrar")))["clipes"] if opt("--enquadrar") else {}
GAN = json.load(open(opt("--ganhos")))["ganhos"] if opt("--ganhos") else {}
vcodec = (["-c:v", "h264_videotoolbox", "-b:v", "24M" if H >= 1440 else "14M"] if "--rapido" in a
          else ["-c:v", "libx264", "-preset", "veryfast", "-crf", "18"])
tmp = tempfile.mkdtemp(prefix="render_", dir=os.path.dirname(saida))


def expr(kf, i):
    """kf: [[t, cx, cy, cw], ...] → expressão do ffmpeg, linear entre os pontos, no tempo t do pedaço."""
    e = f"{kf[-1][i]}"
    for k in range(len(kf) - 2, -1, -1):
        t0, t1 = kf[k][0], kf[k + 1][0]
        v0, v1_ = kf[k][i], kf[k + 1][i]
        e = f"if(lt(t,{t1}),{v0}+({v1_}-{v0})*(t-{t0})/{max(1e-6, t1 - t0)},{e})"
    return e


def filtro(c):
    q = ENQ.get(f"{c['in']:.3f}")
    if not q:
        return f"scale={W}:{H}:force_original_aspect_ratio=decrease:flags=lanczos,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2"
    if q.get("kf"):
        cw, cx, cy = expr(q["kf"], 3), expr(q["kf"], 1), expr(q["kf"], 2)
    else:
        cw, cx, cy = q["cw"], q["cx"], q["cy"]
    # aumenta a imagem inteira para o recorte caber em WxH e recorta (tamanho fixo, posição por quadro)
    return (f"scale=w='trunc({SW}*{W}/({cw})/2)*2':h='trunc({SH}*{W}/({cw})/2)*2':eval=frame:flags=bicubic,"
            f"crop={W}:{H}:x='({cx})*{W}/({cw})-{W}/2':y='({cy})*{W}/({cw})-{H}/2'")


def roda(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"ffmpeg falhou: {' '.join(cmd[:8])}…\n{r.stderr[-1200:]}")


# 1) vídeo: um pedaço por clipe
pedacos = []
for k, c in enumerate(v1):
    if ATE is not None and c["t0"] >= ATE:
        break
    dur = (min(c["t1"], ATE) if ATE else c["t1"]) - c["t0"]
    out = os.path.join(tmp, f"v{k:04d}.mp4")
    if intro and c["arquivo"] == os.path.abspath(intro):
        vf = f"scale={W}:{H}:force_original_aspect_ratio=decrease:flags=lanczos,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2"
    else:
        vf = filtro(c)
    roda(["ffmpeg", "-v", "error", "-y", "-ss", f"{c['in']:.4f}", "-t", f"{dur:.4f}", "-i", c["arquivo"], "-an",
          "-vf", f"{vf},fps={FPS},format=yuv420p", *vcodec, "-video_track_timescale", str(FPS * 1000), out])
    pedacos.append(out)
    if k % 25 == 0:
        print(f"vídeo: {k + 1}/{len(v1)} pedaços", flush=True)
lista = os.path.join(tmp, "lista.txt")
open(lista, "w").write("".join(f"file '{p}'\n" for p in pedacos))
video = os.path.join(tmp, "video.mp4")
roda(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", video])
DUR = sondar(video)[0]

# 2) áudio com precisão de amostra
SR = 48000


def pcm(p, ss=None, t=None):
    cmd = ["ffmpeg", "-v", "error"] + (["-ss", f"{ss:.4f}"] if ss is not None else []) + (["-t", f"{t:.4f}"] if t else []) + \
        ["-i", p, "-map", "0:a:0", "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).astype(np.float64)


N = int(round(DUR * SR))
mix = np.zeros((N, 2))
src_audio = os.path.abspath(opt("--audio")) if opt("--audio") else bruto
cache = {}
for c in v1:
    if ATE is not None and c["t0"] >= ATE:
        break
    i0, i1 = int(round(c["t0"] * SR)), min(N, int(round((min(c["t1"], ATE) if ATE else c["t1"]) * SR)))
    n = i1 - i0
    if n <= 0:
        continue
    if intro and c["arquivo"] == os.path.abspath(intro):
        x = pcm(intro, c["in"], n / SR)
    else:
        if src_audio not in cache:
            cache[src_audio] = pcm(src_audio)
        s0 = int(round(c["in"] * SR))
        x = cache[src_audio][s0:s0 + n]
        g = GAN.get(f"{c['in']:.3f}", 0.0)
        if g:
            x = x * 10 ** (g / 20)
    x = x[:n]
    f = min(len(x) // 2, int(0.003 * SR))
    if f:
        r = np.linspace(0, 1, f)[:, None]
        x = x.copy()
        x[:f] *= r
        x[-f:] *= r[::-1]
    mix[i0:i0 + len(x)] += x
if opt("--trilha"):
    tri = pcm(opt("--trilha"))
    ini = int(round((v1[0]["t1"] if intro else 0) * SR))
    m = min(len(tri), N - ini)
    if m > 0:
        mix[ini:ini + m] += tri[:m]
wav = os.path.join(tmp, "mix.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_f32le", wav],
               input=mix.astype(np.float32).tobytes(), check=True)

# 3) master −14 LUFS (2 passadas) e junta
med = subprocess.run(["ffmpeg", "-hide_banner", "-i", wav, "-af", "loudnorm=I=-14:TP=-1:LRA=11:print_format=json", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
Jl = json.loads(med[med.rindex("{"):med.rindex("}") + 1])
roda(["ffmpeg", "-v", "error", "-y", "-i", video, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
      "-af", f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={Jl['input_i']}:measured_TP={Jl['input_tp']}:measured_LRA={Jl['input_lra']}:"
             f"measured_thresh={Jl['input_thresh']}:offset={Jl['target_offset']}:linear=true,aresample=48000",
      "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", "-shortest", saida])
shutil.rmtree(tmp, ignore_errors=True)
print(f"{saida}: {W}x{H} {FPS} fps · {DUR / 60:.2f} min · {len(pedacos)} pedaços · −14 LUFS")
