#!/usr/bin/env python3
"""Copia a narração para o vídeo e descobre o tempo de cada palavra no computador (Whisper local, modelo "small",
português). Não usa serviço pago.

uso: PY transcrever.py <pasta-do-video> <arquivo-da-narracao.mp3|wav> [--local]
  --local: usa direto o faster-whisper da pasta de trabalho (sem o HyperFrames)
grava <pasta>/audio/<narracao> e <pasta>/audio/transcript.json. Depois rode o casar_palavras.py."""
import json, os, shutil, subprocess, sys

HF = "hyperframes@0.9.58"
if len(sys.argv) < 3:
    sys.exit(__doc__)
pasta, audio = os.path.abspath(os.path.expanduser(sys.argv[1])), os.path.abspath(os.path.expanduser(sys.argv[2]))
os.makedirs(os.path.join(pasta, "audio"), exist_ok=True)
nome = os.path.basename(audio)
alvo = os.path.join(pasta, "audio", nome)
if os.path.abspath(alvo) != audio:
    shutil.copy(audio, alvo)
dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", alvo],
                     capture_output=True, text=True).stdout.strip()
print(f"Duração: {dur} s")
npx = shutil.which("npx") or shutil.which("npx.cmd")
tr = os.path.join(pasta, "audio", "transcript.json")
if os.path.exists(tr):
    os.remove(tr)
ok = False
if npx and "--local" not in sys.argv:
    # --engine whisper: o motor "heygen" é pago
    with open(os.path.join(pasta, "audio", "transcricao.log"), "w", encoding="utf-8") as log:
        r = subprocess.run([npx, "--yes", HF, "transcribe", os.path.join("audio", nome), "--engine", "whisper", "--model", "small",
                            "--language", "pt", "--no-runtime-install", "--json"], cwd=pasta, stdout=subprocess.DEVNULL, stderr=log)
    ok = r.returncode == 0 and os.path.exists(tr)
if not ok:
    # plano B: o faster-whisper do Python da pasta de trabalho (o PY já tem), no mesmo formato
    try:
        import numpy as np
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit("A transcrição do HyperFrames não deu (audio/transcricao.log) e este Python não tem o faster-whisper: "
                 "rode com o Python da pasta de trabalho (PY).")
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", alvo, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                         capture_output=True).stdout
    segs, _ = WhisperModel("small", device="cpu", compute_type="int8").transcribe(
        np.frombuffer(pcm, np.float32), language="pt", word_timestamps=True, vad_filter=False)
    pal = [{"text": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)} for sg in segs for w in (sg.words or [])
           if w.word.strip()]
    for k, w in enumerate(pal):
        w["id"] = f"w{k}"
    json.dump(pal, open(tr, "w", encoding="utf-8"), ensure_ascii=False)
    print("(transcrito com o faster-whisper da pasta de trabalho)")
print(f"Transcrição: {len(json.load(open(tr, encoding='utf-8')))} palavras em audio/transcript.json")
