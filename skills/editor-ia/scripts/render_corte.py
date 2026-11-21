"""Render a podcast cut from <out>.segments.json (written by cortar.py) without recomputing the cuts.

uso: render_corte.py <saida.mp4.segments.json> [<out.mp4>] [--crossfade 0.03] [--fps 60000/1001] [--crf 16]
       [--set "k:in=812.95" --set "k:out=819.9" ...]   (editor tweaks of piece k, saved back to the json)

Video pieces are frame-exact; audio pieces overlap by the crossfade at every cut and are joined with
constant-power crossfades centred on the cut, so the audio length equals the video length.
"""
import json
import os
import subprocess
import sys

import numpy as np

SR = 48000


def write_audio(path, start, span, segs, ss, XF, dur, wav):
    """recorta cada trecho (com XF de sobra nas emendas) e junta com crossfade de potência constante centrado no corte."""
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{start:.3f}", "-t", f"{span:.3f}", "-i", path, "-vn", "-ac", "2",
                          "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(pcm, dtype=np.float32).reshape(-1, 2)
    nx = int(round(XF * SR))
    u = (np.arange(nx) + 0.5) / max(nx, 1)
    fin, fout = np.sin(u * np.pi / 2)[:, None], np.cos(u * np.pi / 2)[:, None]
    N = len(segs)
    y = np.zeros((int(round(dur * SR)) + nx + SR, 2), dtype=np.float32)
    pos = 0
    for k, s in enumerate(segs):
        a = int(round((s["in"] - ss - (XF / 2 if k > 0 else 0)) * SR))
        b = int(round((s["out"] - ss + (XF / 2 if k < N - 1 else 0)) * SR))
        p = x[max(0, a):b].copy()
        if k > 0 and nx:
            p[:nx] *= fin[: len(p[:nx])]
            pos -= nx
        if k < N - 1 and nx:
            p[-nx:] *= fout[-len(p[-nx:]):]
        y[pos:pos + len(p)] += p
        pos += len(p)
    y = y[: int(round(dur * SR))]
    fi, fo = int(0.01 * SR), int(0.04 * SR)
    y[:fi] *= np.linspace(0, 1, fi, dtype=np.float32)[:, None]
    y[-fo:] *= np.linspace(1, 0, fo, dtype=np.float32)[:, None]
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_s24le", wav],
                   input=y.astype(np.float32).tobytes(), check=True)


def main(argv):
    seg_path = argv[1]
    out = argv[2] if len(argv) > 2 and not argv[2].startswith("--") else seg_path.replace(".segments.json", "")
    arg = lambda k, d: argv[argv.index(k) + 1] if k in argv else d  # noqa: E731
    XF = float(arg("--crossfade", 0.03))
    num, den = (int(v) for v in arg("--fps", "60000/1001").split("/"))
    FR = den / num
    data = json.load(open(seg_path, encoding="utf-8"))
    segs, src = data["segments"], data["source"]
    aud, aoff = data.get("audio"), float(data.get("audio_offset", 0.0))
    for i, a in enumerate(argv):  # --set "k:in=…" / "k:out=…"
        if a == "--set":
            k, kv = argv[i + 1].split(":")
            side, val = kv.split("=")
            segs[int(k)][side] = round(round(float(val) / FR) * FR, 4)
    t = 0.0
    for s in segs:
        s["at"] = round(t, 4)
        t += s["out"] - s["in"]
    data["duration"] = round(t, 3)
    json.dump(data, open(seg_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    ss = max(0.0, round((segs[0]["in"] - 2.0) / FR) * FR)
    span = segs[-1]["out"] - ss + 2.0
    parts, vlabels, N = [], "", len(segs)
    for k, s in enumerate(segs):
        a, b = s["in"] - ss, s["out"] - ss
        parts.append(f"[0:v]trim=start={a - FR / 2:.5f}:end={b - FR / 2:.5f},setpts=PTS-STARTPTS[v{k}]")
        vlabels += f"[v{k}]"
    parts.append(f"{vlabels}concat=n={N}:v=1:a=0[v]")
    dur = sum(s["out"] - s["in"] for s in segs)
    fc = out + ".filter.txt"
    open(fc, "w", encoding="utf-8").write(";\n".join(parts))
    # áudio montado em numpy (uma cadeia de centenas de acrossfade no ffmpeg trava em cortes longos)
    wav = out + ".audio.wav"
    write_audio(aud or src, ss + (aoff if aud else 0.0), span, segs, ss, XF, dur, wav)
    cmd = ["ffmpeg", "-y", "-v", "error", "-stats", "-ss", f"{ss:.3f}", "-t", f"{span:.3f}", "-i", src, "-i", wav,
           "-/filter_complex", fc, "-map", "[v]", "-map", "1:a",
           "-c:v", "libx264", "-preset", "medium", "-crf", arg("--crf", "16"), "-pix_fmt", "yuv420p", "-r", f"{num}/{den}",
           "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-shortest", "-movflags", "+faststart", out]
    subprocess.run(cmd, check=True)
    os.remove(wav)
    print(f"wrote {out} ({dur:.2f}s, {N} pieces)")


if __name__ == "__main__":
    main(sys.argv)
