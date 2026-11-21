#!/usr/bin/env python3
"""Escreve as falas do roteiro em voz/b1.txt, b2.txt... para o voz_ia.py gerar a narração bloco por bloco.
uso: python falas.py <pasta do vídeo>
Se um bloco tiver "tts" (a grafia para a voz, ex.: "Clóde" no lugar de "Claude"), ele vai para voz/bN.tts.txt: a voz lê o tts
e a legenda continua com a "fala"."""
import json, os, sys
P = os.path.abspath(sys.argv[1]); os.makedirs(os.path.join(P, "voz"), exist_ok=True)
blocos = json.load(open(os.path.join(P, "roteiro.json"), encoding="utf-8"))["blocos"]
for i, b in enumerate(blocos, 1):
    open(os.path.join(P, "voz", f"b{i}.txt"), "w", encoding="utf-8").write(b["fala"].strip() + "\n")
    tts = os.path.join(P, "voz", f"b{i}.tts.txt")
    if b.get("tts"):
        open(tts, "w", encoding="utf-8").write(b["tts"].strip() + "\n")
    elif os.path.exists(tts):
        os.remove(tts)
print(f"{len(blocos)} falas em voz/. Agora: python voz_ia.py --pasta \"{os.path.join(P, 'voz')}\" --motor <voicestudio|elevenlabs|higgsfield> --voz <id> "
      + " ".join(str(i) for i in range(1, len(blocos) + 1)))
