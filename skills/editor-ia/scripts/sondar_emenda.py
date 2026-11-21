"""Inspect a join: local Whisper words (with times) + loudness envelope of a source range.
uso: sondar_emenda.py <video_original.mp4> <t0> <t1> [<t0> <t1> ...]   (tempos em segundos da fonte)"""
import os
import subprocess
import sys

import numpy as np
from faster_whisper import WhisperModel

sys.stdout.reconfigure(encoding="utf-8")
src = sys.argv[1]
m = WhisperModel("small", device="cpu", compute_type="int8", download_root=os.environ.get("CORTES_MODELOS", os.path.join(os.getcwd(), ".models")))
r = [float(v) for v in sys.argv[2:]]
for a, b in zip(r[::2], r[1::2]):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{a}", "-t", f"{b - a}", "-i", src, "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768
    pad = np.zeros(8000, np.float32)
    segs, _ = m.transcribe(np.concatenate([pad, x, pad]), language="pt", beam_size=5, word_timestamps=True, condition_on_previous_text=False)
    ws = " ".join(f"{w.word.strip()}[{w.start - 0.5 + a:.2f}-{w.end - 0.5 + a:.2f}]" for s_ in segs for w in s_.words)
    env = " ".join(f"{a + i * 0.02 + 0.015:.2f}:{10 * np.log10(np.mean(x[i * 320:i * 320 + 480] ** 2) + 1e-12):.0f}" for i in range(int((b - a) / 0.02) - 1))
    print(f"=== {a}-{b}\n  heard: {ws}\n  env:   {env}\n")
