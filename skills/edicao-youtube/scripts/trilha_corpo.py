"""Trilha baixinha no corpo do vídeo inteiro, já pronta num WAV só, encaixada na sequência dele no Premiere.

uso: python3 trilha_corpo.py PROJETO.prproj|PASTA_TRABALHO saida.wav [--sequencia "nome"] --voz <áudio da gravação> [--intro intro.mp4]
        --musicas "a.mp3,b.mp3,..." [--abaixo 23] [--transicao 3]

Pedido de 07/11/2026: "colocar a trilha sonora em todo o vídeo, uma trilha baixinha para ir tocando — prende a atenção
e aumenta a retenção". As músicas são da pasta dele `Pack de edições/PACK 3.0 - VOLTADO PARA YOUTUBE/MAIS MÚSICAS SEM
COPY` (artistas da Biblioteca de Áudio do YouTube); escolha instrumentais calmas com o earshot rank ("calm relaxed
lo-fi instrumental background music with a soft steady beat, no vocals") e confira que não têm voz cantada.
  - cada música no mesmo volume (−16 LUFS), transição de --transicao s entre elas;
  - começa no fim da intro (o clipe de vídeo com "intro" no nome) com entrada de 1,5 s, termina com saída de 3 s;
  - SOME (0,4 s antes / 0,6 s depois) onde a V1 tem outro vídeo que não é a gravação nem a intro (as demos têm som próprio);
  - fica --abaixo dB abaixo da voz (LUFS do arquivo de voz): 23 no corpo (ele subiu a trilha da intro para ~25 abaixo).
Depois: premiere_refazer.py ... --musica saida.wav@<início> (o início sai impresso e no .json ao lado).
"""
import json, os, subprocess, sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from premiere_ler import ler_linha  # noqa: E402

a = sys.argv[1:]
opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d  # noqa: E731
proj, saida, voz = a[0], a[1], opt("--voz")
musicas = [m.strip() for m in opt("--musicas").split(",") if m.strip()]
ABAIXO, TRANS, SR = float(opt("--abaixo", 23)), float(opt("--transicao", 3)), 48000


def lufs(x):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-af", "ebur128", "-f", "null", "-"],
                       input=np.ascontiguousarray(x, np.float32).tobytes(), capture_output=True)
    return float([l for l in r.stderr.decode().splitlines() if l.strip().startswith("I:")][-1].split()[1])


def ler_audio(p):
    return np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                                        capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).astype(np.float64)


L = ler_linha(proj, opt("--sequencia"), intro=opt("--intro"), audio=opt("--voz"))
v1 = next(f for f in L["faixas"] if f["tipo"] == "video" and f["index"] == 0)["clipes"]
from collections import Counter  # noqa: E402
gravacao = Counter(c["arquivo"] for c in v1).most_common(1)[0][0]
ini = max((c["t1"] for c in v1 if "intro" in os.path.basename(c["arquivo"] or "").lower()), default=0.0)
fim = max(c["t1"] for c in v1)
demos = [(c["t0"], c["t1"]) for c in v1 if c["arquivo"] != gravacao and "intro" not in os.path.basename(c["arquivo"] or "").lower()]
X = int(TRANS * SR)
bed = None
for m in musicas:
    x = ler_audio(m)
    x *= 10 ** ((-16 - lufs(x)) / 20)
    if bed is None:
        bed = x
        continue
    r = np.linspace(0, 1, X)[:, None]
    bed = np.concatenate([bed[:-X], bed[-X:] * (1 - r) + x[:X] * r, x[X:]])
N = int((fim - ini) * SR)
if len(bed) < N:
    sys.exit(f"músicas somam {len(bed) / SR:.0f} s, o corpo tem {N / SR:.0f} s: ponha mais músicas")
bed = bed[:N]
env = np.ones(N)
fi, fo, rr = int(1.5 * SR), int(3 * SR), int(0.4 * SR)
env[:fi] *= np.linspace(0, 1, fi)
env[-fo:] *= np.linspace(1, 0, fo)
for d0, d1 in demos:
    s, e = max(0, int((d0 - ini - 0.4) * SR)), min(N, int((d1 - ini + 0.6) * SR))
    env[s:e] = 0
    if s - rr > 0:
        env[s - rr:s] *= np.linspace(1, 0, rr)
    if e + rr < N:
        env[e:e + rr] *= np.linspace(0, 1, rr)
vz = float([l for l in subprocess.run(["ffmpeg", "-hide_banner", "-i", voz, "-af", "ebur128", "-f", "null", "-"],
                                      capture_output=True).stderr.decode().splitlines() if l.strip().startswith("I:")][-1].split()[1])
bed *= 10 ** ((vz - ABAIXO - lufs(bed)) / 20)
bed *= env[:, None]
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_s16le", saida],
               input=np.clip(bed, -1, 1).astype(np.float32).tobytes(), check=True)
json.dump({"inicio_na_sequencia": ini, "fim": fim, "demos": demos, "voz_lufs": vz, "trilha_lufs": vz - ABAIXO,
           "musicas": [os.path.basename(m) for m in musicas]}, open(os.path.splitext(saida)[0] + ".json", "w"), ensure_ascii=False, indent=1)
print(f"trilha {N / SR / 60:.1f} min · começa em {ini:.3f} s · voz {vz:.1f} LUFS → trilha {vz - ABAIXO:.1f} · some em {len(demos)} demos → {saida}")
