#!/usr/bin/env python3
"""Transcreve uma mensagem de áudio do chat do painel (português), no próprio computador, com o Whisper.
uso: <python com faster-whisper> transcrever_audio.py <arquivo>   → imprime o texto"""
import subprocess, sys
import numpy as np
from faster_whisper import WhisperModel

raw = subprocess.run(["ffmpeg", "-v", "error", "-i", sys.argv[1], "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                     capture_output=True, check=True).stdout
segs, _ = WhisperModel("small", compute_type="int8").transcribe(np.frombuffer(raw, np.int16).astype(np.float32) / 32768,
                                                                language="pt", vad_filter=True)
print(" ".join(s.text.strip() for s in segs).strip())
