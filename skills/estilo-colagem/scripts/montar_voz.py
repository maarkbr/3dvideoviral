#!/usr/bin/env python3
"""Junta a narração num áudio só e acha o tempo de cada palavra (para a legenda e para as cenas entrarem na hora certa).

uso: python montar_voz.py <pasta do vídeo> [--pausa 0.18]
       voz de IA, um arquivo por bloco do roteiro, em voz/ (qualquer um destes, nesta ordem de preferência):
         voz/f1.wav, f2.wav...  feitos pelo voz_ia.py (o "Bom." já foi cortado)
         voz/b1.mp3 / b1.wav... gerados com "Bom. " na frente (o Higgsfield, por exemplo): corta até o fim da primeira pausa
     python montar_voz.py <pasta do vídeo> --gravacao <arquivo>
       a própria voz (ou um áudio pronto) com a narração inteira, na ordem do roteiro. Corte erros e repetições antes
       (skill editor-ia); aqui só tira o silêncio do começo e do fim e acha onde começa cada bloco.
saída: voz/voz.wav, voz/blocos.json {"inicios": [...], "total": s}, voz/palavras.json [{"w","s","e","bloco"}]
Rode com o Python que tem o faster-whisper (o da pasta de trabalho: _ferramentas/.venv).
"""
import argparse, difflib, json, os, re, subprocess, unicodedata, wave
import numpy as np

ap = argparse.ArgumentParser(); ap.add_argument("pasta"); ap.add_argument("--pausa", type=float, default=0.18)
ap.add_argument("--gravacao", help="arquivo com a narração inteira (voz própria ou áudio pronto)")
a = ap.parse_args()
grav = os.path.abspath(os.path.expanduser(a.gravacao)) if a.gravacao else None
os.chdir(a.pasta); os.makedirs("voz", exist_ok=True)
rot = json.load(open("roteiro.json", encoding="utf-8"))
N = len(rot["blocos"])
APARA = "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse"  # tira o silêncio do fim sem cortar frase


def dur(f):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], capture_output=True, text=True).stdout)


def corte_bom(f):
    o = subprocess.run(["ffmpeg", "-nostats", "-i", f, "-t", "2.5", "-af", "silencedetect=n=-35dB:d=0.12", "-f", "null", "-"], capture_output=True, text=True).stderr
    fins = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", o)]
    return max(0.0, fins[0] - 0.04) if fins else 0.0


subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", "0.3", "voz/sil0.wav"], check=True)
inicios = None
if grav:
    if not os.path.exists(grav):
        raise SystemExit(f"não achei a gravação: {grav}")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", grav, "-af", "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08," + APARA,
                    "-ar", "48000", "-ac", "1", "voz/grav.wav"], check=True)
    open("voz/lista.txt", "w", encoding="utf-8").write("file 'sil0.wav'\nfile 'grav.wav'\n")
else:
    partes = []
    for i in range(1, N + 1):
        pronto = f"voz/f{i}.wav" if os.path.exists(f"voz/f{i}.wav") else None
        f = pronto or next((x for x in (f"voz/b{i}.mp3", f"voz/b{i}.wav") if os.path.exists(x)), None)
        if not f:
            raise SystemExit(f"falta a voz do bloco {i} (voz/f{i}.wav ou voz/b{i}.mp3)")
        c = 0.0 if pronto else corte_bom(f)
        out = f"voz/c{i}.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{c:.3f}", "-i", f, "-af", "afade=t=in:d=0.02," + APARA, "-ar", "48000", "-ac", "1", out], check=True)
        partes.append(out)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", str(a.pausa), "voz/sil.wav"], check=True)
    inicios, t, lista = [], 0.3, ["file 'sil0.wav'"]
    for p in partes:
        inicios.append(round(t, 3)); t += dur(p) + a.pausa
        lista += [f"file '{os.path.basename(p)}'", "file 'sil.wav'"]
    open("voz/lista.txt", "w", encoding="utf-8").write("\n".join(lista) + "\n")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", "voz/lista.txt", "-ar", "48000", "-ac", "1", "voz/voz.wav"], check=True)
total = round(dur("voz/voz.wav"), 3)

from faster_whisper import WhisperModel
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "voz/voz.wav", "-ar", "16000", "-ac", "1", "voz/v16.wav"], check=True)
w = wave.open("voz/v16.wav"); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
seg, _ = WhisperModel("small", compute_type="int8").transcribe(x, language="pt", word_timestamps=True,
                                                               initial_prompt=" ".join(b["fala"] for b in rot["blocos"]))
ouvido = [{"w": wd.word.strip(), "s": round(wd.start, 3), "e": round(wd.end, 3)} for s in seg for wd in s.words]

# a legenda usa o TEXTO DO ROTEIRO (o Whisper erra nome e acento: "cumprido", "Clod"); do Whisper só vêm os tempos
norm = lambda s: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode())
roteiro = [(w, k) for k, b in enumerate(rot["blocos"]) for w in b["fala"].split()]
sm = difflib.SequenceMatcher(None, [norm(w) for w, _ in roteiro], [norm(p["w"]) for p in ouvido], autojunk=False)
tempo = [None] * len(roteiro)
for i0, j0, n in sm.get_matching_blocks():
    for k in range(n): tempo[i0 + k] = (ouvido[j0 + k]["s"], ouvido[j0 + k]["e"])
if inicios is None:  # gravação inteira: cada bloco começa na primeira palavra dele que o Whisper achou
    inicios = []
    for k in range(N):
        ts = [tempo[i][0] for i, (_, bb) in enumerate(roteiro) if bb == k and tempo[i]]
        ini = max(0.3, round(ts[0] - 0.12, 3)) if ts else (inicios[-1] + 0.5 if inicios else 0.3)
        inicios.append(max(ini, inicios[-1] + 0.3) if inicios else 0.3)
json.dump({"inicios": inicios, "total": total}, open("voz/blocos.json", "w", encoding="utf-8"))
faltou = []
for k in range(N):  # palavras sem par: espalha entre as vizinhas, dentro do bloco
    idx = [i for i, (_, bb) in enumerate(roteiro) if bb == k]
    for j, i in enumerate(idx):
        if tempo[i] is None:
            faltou.append((k + 1, roteiro[i][0]))
            ant = next((tempo[y] for y in reversed(idx[:j]) if tempo[y]), (inicios[k], inicios[k]))
            tempo[i] = (ant[1], ant[1] + 0.25)
pal = [{"w": w, "s": round(t[0], 3), "e": round(t[1], 3), "bloco": b} for (w, b), t in zip(roteiro, tempo)]
# o Whisper põe a 1ª palavra em 0,00 mesmo quando a voz começa depois: acerta pelo começo real do som
_sd = subprocess.run(["ffmpeg", "-hide_banner", "-i", "voz/voz.wav", "-af", "silencedetect=n=-40dB:d=0.1", "-f", "null", "-"], capture_output=True, text=True).stderr
_m = re.search(r"silence_start: 0(?:\.0+)?\s.*?silence_end: ([\d.]+)", _sd, re.S)
if pal and _m and pal[0]["s"] < float(_m.group(1)) < pal[0]["e"]: pal[0]["s"] = round(float(_m.group(1)), 2)
json.dump(pal, open("voz/palavras.json", "w", encoding="utf-8"), ensure_ascii=False)
print(f"{N} blocos, {total} s, {len(pal)} palavras ({100 - round(100 * len(faltou) / max(1, len(pal)))}% achadas na voz)")
print("O Whisper ouviu:", " ".join(p["w"] for p in ouvido))
if faltou:
    print("Palavras do roteiro que ele não achou na voz (ouça esses trechos: pode ser pronúncia errada ou fala pulada):")
    for b, wd in faltou: print(f"  bloco {b}: {wd}")
