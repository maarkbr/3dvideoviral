"""Confere as emendas de um corte bruto pelo áudio da fonte: acha os FINS e INÍCIOS de frase cortados
(a fala continua do outro lado do corte, sem pausa) e desenha cada um numa folha (PNG) para você olhar.

uso: ver_emendas.py <saida.mp4.segments.json> [--png work/emendas.png] [--todas]

Para cada emenda entre o trecho k e o k+1:
  FIM CORTADO    — o trecho k termina com som de fala e a fonte continua falando logo depois do corte
                   (palavra comida ou "né"/"tá" colado arrancado): solte a palavra seguinte ou mova o corte;
  INÍCIO CORTADO — o trecho k+1 começa já no meio de som que vinha de antes (sílaba engolida).
A folha mostra a onda da fonte em volta de cada emenda acusada: em cor o que ficou, em cinza o que saiu,
linha vermelha no corte, e as palavras do corte. Com --todas, desenha todas as emendas.
Ideia emprestada do timeline_view do video-use (browser-use/video-use): olhar a emenda antes de mostrar.
"""
import json
import os
import subprocess
import sys
import unicodedata

import numpy as np

SR = 16000
HOP = 0.01


def carregar(path, t0, dur):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{max(0.0, t0):.3f}", "-t", f"{dur:.3f}", "-i", path, "-vn", "-ac", "1",
                          "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(pcm, dtype=np.float32)


def env_db(x):
    h, w = int(HOP * SR), int(0.03 * SR)
    n = max(0, (len(x) - w) // h)
    return np.array([10 * np.log10(np.mean(x[i * h: i * h + w] ** 2) + 1e-12) for i in range(n)])


def ascii_(t):
    return unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode()


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    seg_path = sys.argv[1]
    arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d  # noqa: E731
    png = arg("--png", os.path.join(os.path.dirname(os.path.abspath(seg_path)), "work", "emendas.png"))
    data = json.load(open(seg_path, encoding="utf-8"))
    segs = data["segments"]
    aud, aoff = data.get("audio") or data["source"], float(data.get("audio_offset", 0.0)) if data.get("audio") else 0.0
    wpath = seg_path.replace(".segments.json", ".words.json")
    texto = {w["i"]: w["text"] for w in json.load(open(wpath, encoding="utf-8"))} if os.path.exists(wpath) else {}
    PRE, POS = 1.2, 0.8
    flags, quadros = [], []
    for k in range(len(segs) - 1):
        a, b = segs[k], segs[k + 1]
        problemas = []
        for lado, t, dentro in (("FIM", a["out"], -1), ("INÍCIO", b["in"], +1)):
            x = carregar(aud, t + aoff - PRE, PRE + POS)
            e = env_db(x)
            if not len(e):
                continue
            c = min(len(e) - 1, int(round(PRE / HOP)))
            piso = float(np.percentile(e, 10))
            fala = max(-45.0, piso + 15.0)
            borda = e[max(0, c - 4): c] if dentro < 0 else e[c: c + 4]
            fora = e[c:] if dentro < 0 else e[:c][::-1]
            seguido = 0
            while seguido < len(fora) and fora[seguido] > fala:
                seguido += 1
            if len(borda) and float(borda.mean()) > fala + 6 and seguido * HOP >= 0.12:
                problemas.append(f"{lado} CORTADO (a fala segue {seguido * HOP:.2f} s {'depois' if dentro < 0 else 'antes'} do corte)")
            quadros.append((k, lado, t, e, c, dentro))
        if problemas:
            fim = " ".join(texto.get(i, "") for i in a["words"][-3:])
            ini = " ".join(texto.get(i, "") for i in b["words"][:3])
            flags.append(k)
            print(f"emenda {k:3d} → {k + 1:<3d} [{a['out']:8.2f} | {b['in']:8.2f}]  …{fim} ‖ {ini}…  ·  " + "; ".join(problemas))
    print(f"\n{len(flags)} de {len(segs) - 1} emendas acusadas" + ("" if flags else " — todas limpas"))
    desenhar = [q for q in quadros if "--todas" in sys.argv or q[0] in flags]
    if not desenhar:
        return
    try:
        import cv2
    except ImportError:
        print("(sem opencv: folha não desenhada)")
        return
    W, H = 640, 110
    cols = 2
    rows = (len(desenhar) + cols - 1) // cols
    img = np.full((rows * H, cols * W, 3), 18, np.uint8)
    for n, (k, lado, t, e, c, dentro) in enumerate(desenhar):
        x0, y0 = (n % cols) * W, (n // cols) * H
        lo, hi = -70.0, max(-10.0, float(e.max()))
        for i in range(len(e)):
            xx = x0 + int(i / len(e) * (W - 10)) + 5
            hh = int((np.clip(e[i], lo, hi) - lo) / (hi - lo) * (H - 40))
            ficou = (i < c) if dentro < 0 else (i >= c)
            cor = (0, 184, 255) if ficou else (90, 90, 90)
            cv2.line(img, (xx, y0 + H - 12), (xx, y0 + H - 12 - hh), cor, 1)
        xc = x0 + int(c / len(e) * (W - 10)) + 5
        cv2.line(img, (xc, y0 + 22), (xc, y0 + H - 8), (40, 40, 230), 2)
        seg = segs[k] if dentro < 0 else segs[k + 1]
        pal = [texto.get(i, "") for i in (seg["words"][-3:] if dentro < 0 else seg["words"][:3])]
        cv2.putText(img, ascii_(f"#{k} {lado} {t:.2f}s  " + " ".join(pal))[:70], (x0 + 6, y0 + 16), cv2.FONT_HERSHEY_SIMPLEX, 0.45,
                    (90, 110, 255) if k in flags else (200, 200, 200), 1, cv2.LINE_AA)
    os.makedirs(os.path.dirname(png) or ".", exist_ok=True)
    cv2.imwrite(png, img)
    print(f"folha: {png}")


if __name__ == "__main__":
    main()
