"""Junta o vídeo renderizado com a voz (e trilha, se tiver) e entrega em -14 LUFS, em estéreo.
O áudio sai em estéreo de propósito: um arquivo mono medido em -14 toca como ~-11 LUFS no celular (sai igual nos dois lados).
A normalização final é em duas passadas (a de uma passada costuma errar ~1 dB).
uso: python finalizar_3d.py <projeto> <saida.mp4> [--trilha musica.mp3] [--trilha-vol 0.09] [--whoosh efeito.mp3 --cortes 3.4,6.8,...]
A trilha abaixa sozinha quando a voz fala. Os "whoosh" (opcionais) entram nas trocas de câmera."""
import argparse, json, os, subprocess
ap = argparse.ArgumentParser(); ap.add_argument("projeto"); ap.add_argument("saida")
ap.add_argument("--trilha"); ap.add_argument("--trilha-vol", type=float, default=0.09)
ap.add_argument("--whoosh"); ap.add_argument("--cortes", default="")
a = ap.parse_args(); P = os.path.abspath(a.projeto)
DUR = json.load(open(os.path.join(P, "voz/blocos.json")))["total"]
inp = ["-i", os.path.join(P, "voz/voz.wav")]; flt = ["[0]pan=stereo|c0=c0|c1=c0,loudnorm=I=-16:TP=-2[v]"]; fundo = []
k = 1
if a.trilha:
    inp += ["-stream_loop", "-1", "-i", a.trilha]
    flt.append(f"[{k}]atrim=0:{DUR},aformat=channel_layouts=stereo,volume={a.trilha_vol},afade=t=in:d=1,afade=t=out:st={max(0, DUR - 2)}:d=2[m]"); fundo.append("[m]"); k += 1
if a.whoosh and a.cortes:
    for t in [float(x) for x in a.cortes.split(",") if x.strip()]:
        inp += ["-i", a.whoosh]; flt.append(f"[{k}]aresample=48000,aformat=channel_layouts=stereo,volume=0.18,adelay={int(t*1000)}:all=1[e{k}]"); fundo.append(f"[e{k}]"); k += 1
if fundo:
    flt.append("".join(fundo) + f"amix=inputs={len(fundo)}:normalize=0,apad,atrim=0:{DUR}[f]")
    flt += ["[v]asplit=2[v1][v2]", "[f][v2]sidechaincompress=threshold=0.03:ratio=5:attack=20:release=300[fd]",
            f"[v1][fd]amix=inputs=2:normalize=0,atrim=0:{DUR}[out]"]
else:
    flt.append(f"[v]apad,atrim=0:{DUR}[out]")
bruto, mix = os.path.join(P, "work/mix_bruto.wav"), os.path.join(P, "work/mix.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", *inp, "-filter_complex", ";".join(flt), "-map", "[out]", "-ar", "48000", "-ac", "2", bruto], check=True)
# loudnorm em duas passadas: mede, depois aplica com os números medidos (linear) para cair em -14 LUFS de verdade
med = subprocess.run(["ffmpeg", "-v", "info", "-i", bruto, "-af", "loudnorm=I=-14:TP=-1.5:LRA=9:print_format=json", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
j = json.loads(med[med.rindex("{"):med.rindex("}") + 1])
ln = (f"loudnorm=I=-14:TP=-1.5:LRA=9:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
      ",alimiter=limit=0.8:level=false")  # 16/11: o linear não segura o pico (saía +0,1 dBFS com trilha); teto em -1,9 dBFS
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", bruto, "-af", ln, "-ar", "48000", "-ac", "2", mix], check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(P, "work/video.mp4"), "-i", mix, "-map", "0:v", "-map", "1:a",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", a.saida], check=True)
print("pronto:", a.saida)
