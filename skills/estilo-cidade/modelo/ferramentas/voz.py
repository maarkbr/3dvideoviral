# Prepara a narração: copia para o projeto, acelera se pedir (sem mudar o tom) e tira o tempo de cada palavra.
#
# Uso: PY ferramentas/voz.py <pasta do projeto> <arquivo de voz> [velocidade]   (PY = o Python da pasta de trabalho)
#   velocidade: 1 = como veio; 1.25 = 25% mais rápida (o que usamos no "Cem Palavras")
# Gera assets/audio/narracao.wav e assets/audio/transcript.json (Whisper local, de graça).
import json, os, shutil, subprocess, sys

PASTA, ORIGEM = sys.argv[1], sys.argv[2]
VEL = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
AUDIO = os.path.join(PASTA, "assets/audio")
os.makedirs(AUDIO, exist_ok=True)
original = os.path.join(AUDIO, "voz-original" + os.path.splitext(ORIGEM)[1])
shutil.copyfile(ORIGEM, original)
filtro = ["-af", f"atempo={VEL}"] if abs(VEL - 1) > 1e-6 else []
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", original, *filtro, "-ar", "44100", "-ac", "1", os.path.join(AUDIO, "narracao.wav")], check=True)
dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", os.path.join(AUDIO, "narracao.wav")]).decode())
print(f"narração: {dur:.2f} s (velocidade {VEL}x)")

# Whisper local pelo HyperFrames (modelo "small" multilíngue, em português); no Windows o binário é hyperframes.cmd
raiz = os.path.dirname(os.path.abspath(PASTA.rstrip("/\\")))
bin_ = os.path.join(raiz, "node_modules", ".bin")
hf = next((os.path.join(bin_, n) for n in ("hyperframes.cmd", "hyperframes") if os.path.exists(os.path.join(bin_, n))), None)
npx = shutil.which("npx") or shutil.which("npx.cmd")
tr = os.path.join(AUDIO, "transcript.json")
if os.path.exists(tr):
    os.remove(tr)
ok = False
if (hf or npx) and "--local" not in sys.argv:
    cmd = [hf] if hf else [npx, "--yes", "hyperframes@0.9.61"]
    r = subprocess.run([*cmd, "transcribe", os.path.join(AUDIO, "narracao.wav"), "-e", "whisper", "-m", "small", "-l", "pt"],
                       cwd=PASTA, capture_output=True, text=True)
    ok = r.returncode == 0 and os.path.exists(tr)
if not ok:
    # plano B: o faster-whisper do Python da pasta de trabalho (PY), no mesmo formato do HyperFrames
    try:
        import numpy as np
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit("A transcrição do HyperFrames não deu e este Python não tem o faster-whisper: rode com o Python da pasta de trabalho (PY).")
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(AUDIO, "narracao.wav"), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                         capture_output=True).stdout
    segs, _ = WhisperModel("small", device="cpu", compute_type="int8").transcribe(
        np.frombuffer(pcm, np.float32), language="pt", word_timestamps=True, vad_filter=False)
    pal = [{"text": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)} for sg in segs for w in (sg.words or []) if w.word.strip()]
    for k, w in enumerate(pal):
        w["id"] = f"w{k}"
    json.dump(pal, open(tr, "w", encoding="utf-8"), ensure_ascii=False)
    print("(transcrito com o faster-whisper da pasta de trabalho)")
print("transcrição:", tr)
