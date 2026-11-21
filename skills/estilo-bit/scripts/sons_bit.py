"""Efeitos sonoros discretos do estilo Bit + mixagem final (voz + efeitos + trilha opcional).

uso: sons_bit.py <sons.json> <voz.wav> <saida.wav> --dur 56.2 [--trilha musica.wav] [--trilha-db -14]

sons.json = [[tempo, "tipo"], ...]  (um efeito por movimento que aparece na tela; nunca em toda entrada)
tipos:
  digita:FIM   cliques de teclado do tempo até FIM (ex.: [0.22, "digita:1.0"])
  tick         check, linha de lista, ficha entrando
  pop          algo importante aparecendo (salvar, selo, resultado)
  baque        objeto caindo / card chegando / carimbo / tecla apertada
  risco        risco de caneta (preço riscado)
  sobe         nó do trilho de passos acendendo, envio de mensagem
  bolha        mensagem de chat
  brilho       animação / mágica acontecendo
  teclas:N     N teclas apertadas em sequência (CTA)
Os volumes já são baixos de propósito (efeito discreto, por baixo da voz). A voz é normalizada em -15 LUFS.
"""
import json
import subprocess
import sys
import tempfile
import wave

import numpy as np

SR = 48000


def gera(eventos, dur):
    out = np.zeros(int(SR * dur)); rng = np.random.default_rng(7)
    db = lambda x: 10 ** (x / 20)  # noqa: E731

    def put(t, s, g):
        i = int(t * SR); n = min(len(s), len(out) - i)
        if n > 0: out[i:i + n] += s[:n] * db(g)

    def env(n, a=0.002, d=0.03):
        t = np.arange(n) / SR; return np.minimum(t / a, 1) * np.exp(-t / d)

    def click(ms=14, d=0.004):
        n = int(SR * ms / 1000); s = np.diff(np.concatenate([[0], rng.standard_normal(n)])); return s * env(n, 0.0005, d)

    def tone(f0, f1, ms, d):
        n = int(SR * ms / 1000); f = np.linspace(f0, f1, n); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, d)

    def baque(ms=60):
        s = tone(170, 120, ms, 0.02); c = click(10, 0.003); s[:len(c)] += 0.5 * c; return s

    def risco(ms=160):
        n = int(SR * ms / 1000); s = np.convolve(rng.standard_normal(n), np.ones(6) / 6, "same")
        return s * np.minimum(np.arange(n) / (0.04 * SR), 1) * np.exp(-np.arange(n) / (0.07 * SR))

    for t, tipo in eventos:
        nome, _, arg = tipo.partition(":")
        if nome == "digita":
            for x in np.arange(t, float(arg or t + 0.8), 0.068): put(x + rng.uniform(-0.01, 0.01), click(), -34 + rng.uniform(-2, 2))
        elif nome == "tick": put(t, tone(1600, 1600, 45, 0.012), -33)
        elif nome == "pop": put(t, tone(420, 980, 90, 0.035), -28)
        elif nome == "baque": put(t, baque(), -29)
        elif nome == "risco": put(t, risco(), -30)
        elif nome == "sobe": put(t, tone(880, 1320, 70, 0.03), -31)
        elif nome == "bolha": put(t, tone(700, 1000, 60, 0.025), -32)
        elif nome == "brilho": put(t, tone(900, 1600, 120, 0.05), -33)
        elif nome == "teclas":
            for i in range(int(arg or 5)): put(t + i * 0.055, baque(50), -27)
        else:
            print(f"[aviso] tipo de som desconhecido: {tipo}")
    return np.clip(out, -1, 1)


def main(argv):
    if len(argv) < 4 or "--dur" not in argv:
        print(__doc__); return 1
    eventos = json.load(open(argv[1], encoding="utf-8")); voz, saida = argv[2], argv[3]
    dur = float(argv[argv.index("--dur") + 1])
    sfx = gera(eventos, dur)
    tmp = tempfile.mkdtemp()
    with wave.open(f"{tmp}/sfx.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((sfx * 32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", voz, "-af", "loudnorm=I=-15:TP=-1.5:LRA=11", "-ar", str(SR), "-ac", "1", f"{tmp}/voz.wav"], check=True)
    ins = ["-i", f"{tmp}/voz.wav", "-i", f"{tmp}/sfx.wav"]
    fc = f"[0]apad=whole_dur={dur}[v];[1]apad=whole_dur={dur}[s];"
    if "--trilha" in argv:
        tdb = argv[argv.index("--trilha-db") + 1] if "--trilha-db" in argv else "-14"
        ins += ["-stream_loop", "-1", "-i", argv[argv.index("--trilha") + 1]]
        fc += f"[2]atrim=0:{dur},volume={tdb}dB,afade=t=in:d=0.3,afade=t=out:st={dur - 1.1}:d=1.1,aresample={SR},aformat=channel_layouts=mono[m];[v][s][m]amix=inputs=3"
    else:
        fc += "[v][s]amix=inputs=2"
    fc += ":normalize=0:duration=first,alimiter=limit=0.9,aformat=channel_layouts=stereo"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *ins, "-filter_complex", fc, "-t", str(dur), saida], check=True)
    print(f"ok: {saida} ({len(eventos)} efeitos)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
