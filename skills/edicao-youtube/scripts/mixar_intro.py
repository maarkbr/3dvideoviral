"""Mixagem e master da intro em HyperFrames, com os stems para o Premiere — numa passada só e conferida.

uso: python3 mixar_intro.py PASTA_HF PROJETO --versao v4 [--video render/intro_v3_sem_trilha.mp4]
        [--musica assets/musica/positive-fuse.mp3] [--musica-ini 0.07] [--musica-vol 0.07] [--efeitos-db 4.6]
Volumes (07/11/2026, o que o Lucas mudou no Premiere na intro do vídeo 3D): efeitos +4,6 dB ("estava bem baixo") e
trilha +8 dB (0,028 → 0,07, ~25 dB abaixo da voz).

1. vídeo: --video (reaproveita um render cuja IMAGEM não mudou, ex. só trocou a voz) ou renderiza
   render/intro_<v>_sem_trilha.mp4 (delivery);
2. efeitos: renderiza de novo com a voz (<audio id="voz">) em data-volume="0" → render/_so_sfx_<v>.mp4 e CONFERE que a
   voz saiu (correlação com assets/voz.wav < 5%). Em 07/11 o sed antigo não casou (o remapear_intro escreve
   data-start="0.0") e o stem "efeitos" das v2/v3 levava a voz inteira: no Premiere a voz tocava em dobro;
3. mix = voz (assets/voz.wav) + efeitos + trilha (EQ −6 dB em 2,5 kHz, ducking pela voz) em float, sem clipar;
4. master: loudnorm em 2 passadas (−14 LUFS, −1 dBTP) → PROJETO/intro-<v>.mp4;
5. Premiere: PROJETO/premiere/intro-<v>-video.mp4 (sem som), -voz.wav, -efeitos.wav, -trilha.wav (24 bits);
   os intro-v*-* antigos ficam (o Premiere pode estar usando); --arquivar-antigos move para premiere/_<versão>/.
"""
import glob, json, os, re, shutil, subprocess, sys

import numpy as np

a = sys.argv[1:]
hf, proj = os.path.abspath(a[0]), os.path.abspath(a[1])
opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d  # noqa: E731
v = opt("--versao")
musica = opt("--musica", "assets/musica/positive-fuse.mp3")
m_ini, m_vol = float(opt("--musica-ini", 0.07)), float(opt("--musica-vol", 0.07))
fx_db = float(opt("--efeitos-db", 4.6))
HFJS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hf.mjs")   # cópia do wrapper do HyperFrames (do editor-ia)
os.chdir(hf)
os.makedirs("render", exist_ok=True)


def sh(*cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"falhou: {' '.join(cmd[:4])}…\n{r.stderr[-1500:]}")
    return r


def pcm_bin(p):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-map", "0:a:0", "-ac", "1", "-ar", "48000", "-f", "f32le", "-"],
                       capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.float32)


def render(saida, q):
    r = subprocess.run(["node", HFJS, "render", ".", "--fps", "30", "-q", q, "-o", saida], capture_output=True, text=True)
    if r.returncode or not os.path.exists(saida):
        sys.exit(f"render falhou ({saida}):\n{(r.stdout + r.stderr)[-1500:]}")


# 1. vídeo
video = opt("--video") or f"render/intro_{v}_sem_trilha.mp4"
if not opt("--video"):
    render(video, "delivery")
D = float(sh("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video).stdout)

# 2. efeitos sem a voz
html = open("index.html").read()
tag = re.search(r'<audio[^>]*\bid="voz"[^>]*>', html)
if not tag:
    sys.exit('não achei <audio id="voz"> no index.html')
mudo = re.sub(r'data-volume="[^"]*"', 'data-volume="0"', tag.group(0)) if "data-volume" in tag.group(0) \
    else tag.group(0).replace("<audio", '<audio data-volume="0"', 1)
sfx_mp4 = f"render/_so_sfx_{v}.mp4"
try:
    open("index.html", "w").write(html.replace(tag.group(0), mudo, 1))
    render(sfx_mp4, "draft")
finally:
    open("index.html", "w").write(html)
fx = f"render/stem_efeitos_{v}.wav"
sh("ffmpeg", "-v", "error", "-y", "-i", sfx_mp4, "-vn", "-c:a", "pcm_s24le", fx)
voz_a, fx_a = pcm_bin("assets/voz.wav"), pcm_bin(fx)
n = min(len(voz_a), len(fx_a))
k = float(np.dot(fx_a[:n], voz_a[:n]) / max(1e-9, np.dot(voz_a[:n], voz_a[:n])))
if abs(k) > 0.05:
    sys.exit(f"o stem de efeitos ainda tem a voz (fator {k:.2f}): confira o <audio id=\"voz\">")
print(f"efeitos sem a voz: ok (fator {k:+.3f})")

# 3. mix
mix = f"render/intro_{v}_mix.mov"
fc = (f"[3:a]aresample=48000,aformat=channel_layouts=stereo,volume={m_vol},equalizer=f=2500:t=q:w=1.2:g=-6,"
      f"afade=t=in:d=0.3,afade=t=out:st={D - 1.2:.3f}:d=1.2[m];"
      "[2:a]aresample=48000,aformat=channel_layouts=stereo,asplit=3[k][k2][vz];"
      "[m][k]sidechaincompress=threshold=0.015:ratio=6:attack=20:release=400[md];[md]asplit[md1][md2];"
      f"[1:a]aresample=48000,aformat=channel_layouts=stereo,volume={fx_db}dB[fx];"
      "[fx][vz][md1]amix=inputs=3:normalize=0:duration=first[mix]")
sh("ffmpeg", "-v", "error", "-y", "-i", video, "-i", fx, "-i", "assets/voz.wav", "-ss", str(m_ini), "-t", f"{D:.3f}",
   "-i", musica, "-filter_complex", fc,
   "-map", "0:v", "-map", "[mix]", "-c:v", "copy", "-c:a", "pcm_f32le", mix,
   "-map", "[md2]", "-c:a", "pcm_s24le", f"render/stem_trilha_{v}.wav",
   "-map", "[k2]", "-c:a", "pcm_s24le", f"render/stem_voz_{v}.wav")

# 4. master
med = subprocess.run(["ffmpeg", "-hide_banner", "-i", mix, "-af", "loudnorm=I=-14:TP=-1:LRA=11:print_format=json",
                      "-f", "null", "-"], capture_output=True, text=True).stderr
J = json.loads(med[med.rindex("{"):med.rindex("}") + 1])
final = os.path.join(proj, f"intro-{v}.mp4")
sh("ffmpeg", "-v", "error", "-y", "-i", mix, "-af",
   f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={J['input_i']}:measured_TP={J['input_tp']}:measured_LRA={J['input_lra']}:"
   f"measured_thresh={J['input_thresh']}:offset={J['target_offset']}:linear=true,aresample=48000",
   "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", final)

# 5. Premiere
P = os.path.join(proj, "premiere")
os.makedirs(P, exist_ok=True)
# os intro-v*-* antigos FICAM onde estão: um projeto do Premiere aberto pode estar usando (mover = mídia offline).
# Arquive só com --arquivar-antigos.
for velho in glob.glob(os.path.join(P, "intro-v*-*")) if "--arquivar-antigos" in a else []:
    ver = os.path.basename(velho).split("-")[1]
    if ver != v:
        os.makedirs(os.path.join(P, f"_{ver}"), exist_ok=True)
        shutil.move(velho, os.path.join(P, f"_{ver}", os.path.basename(velho)))
sh("ffmpeg", "-v", "error", "-y", "-i", mix, "-an", "-c:v", "copy", os.path.join(P, f"intro-{v}-video.mp4"))
for s, nome in ((f"render/stem_voz_{v}.wav", "voz"), (fx, "efeitos"), (f"render/stem_trilha_{v}.wav", "trilha")):
    shutil.copy(s, os.path.join(P, f"intro-{v}-{nome}.wav"))
print(f"intro-{v}.mp4 ({D:.2f} s, mix {J['input_i']} LUFS → −14) e stems em premiere/")
