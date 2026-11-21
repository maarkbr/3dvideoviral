"""Enquadramento 9:16 de um corte horizontal: acha o rosto ao longo do vídeo e sugere o centro do recorte por trecho.

uso: enquadramento.py <corte.mp4> <saida.json> [--segments corte.mp4.segments.json] [--folha folha.jpg] [--passo 0.5]

- Amostra o vídeo a cada --passo s, detecta rostos (OpenCV Haar: frontal + perfil, os dois lados) e guarda o maior.
- Trechos: as emendas do corte (segments.json do cortar.py) e as trocas de câmera detectadas na imagem.
  Em cada trecho, fx = mediana do centro do rosto (0..1 da largura). Trecho sem rosto herda o vizinho.
- Saída JSON: {fonte, largura, altura, aspecto, fy (0..1), face_w (0..1), trechos:[{t0,t1,fx,fy,w,n,camera,aberto}], cortes_camera:[t...]}
  aberto = plano aberto (rosto bem menor que o normal): cubra com uma cena de tela cheia ou aceite o recorte mais solto.
- --folha: grava uma folha de contato (1 quadro/s) com o rosto marcado e a janela 9:16 sugerida, para conferir a olho.
Sem OpenCV instalado: grava só a folha de contato (sem marcações) e avisa — o enquadramento vira estimativa visual.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile

import numpy as np

arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d  # noqa: E731


def probe(src):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration",
                          "-of", "json", src], capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    return d["streams"][0]["width"], d["streams"][0]["height"], float(d["format"]["duration"])


def frames(src, step, w, h):
    cmd = ["ffmpeg", "-v", "error", "-i", src, "-vf", f"fps={1 / step:.6f},scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    n = w * h * 3
    i = 0
    while True:
        buf = p.stdout.read(n)
        if len(buf) < n:
            break
        yield i * step, np.frombuffer(buf, dtype=np.uint8).reshape(h, w, 3)
        i += 1
    p.wait()


def cascades(cv2):
    """Haar cascades shipped with opencv-python 4.x (5.x dropped them). None when unavailable."""
    tmp = os.path.join(tempfile.gettempdir(), "cortes10k_cv")  # OpenCV can't open non-ASCII paths on Windows
    os.makedirs(tmp, exist_ok=True)
    out = []
    for name in ("haarcascade_frontalface_default.xml", "haarcascade_profileface.xml"):
        dst = os.path.join(tmp, name)
        srcf = os.path.join(getattr(getattr(cv2, "data", None), "haarcascades", ""), name)
        if not os.path.exists(dst):
            if not os.path.exists(srcf):
                print(f"AVISO: OpenCV {cv2.__version__} sem os classificadores Haar — instale: pip install \"opencv-python-headless>=4.9,<5\"")
                return None
            shutil.copyfile(srcf, dst)
        c = cv2.CascadeClassifier(dst)
        if c.empty():
            return None
        out.append(c)
    return out


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    src, out = sys.argv[1], sys.argv[2]
    step = float(arg("--passo", 0.5))
    W, H, dur = probe(src)
    aw = 480
    ah = int(round(aw * H / W / 2) * 2)
    try:
        import cv2
    except ImportError:
        cv2 = None
    samples, prev, cuts_cam = [], None, []
    det = cascades(cv2) if cv2 else None
    sem_detector = bool(cv2) and det is None   # OpenCV 5: importa, mas sem os detectores de rosto
    if det is None:
        cv2 = None
    sheet = []
    for t, img in frames(src, step, aw, ah):
        gray = img.mean(axis=2).astype(np.uint8)
        small = gray[::4, ::4].astype(np.float32)
        if prev is not None and np.abs(small - prev).mean() > 28:
            cuts_cam.append(round(t, 2))
        prev = small
        face = None
        if det:
            g = cv2.equalizeHist(gray)
            found = []
            for k, c in enumerate(det):
                for flip in ((False, True) if k == 1 else (False,)):
                    gg = cv2.flip(g, 1) if flip else g
                    rects = c.detectMultiScale(gg, scaleFactor=1.1, minNeighbors=5, minSize=(int(ah * 0.12), int(ah * 0.12)))
                    for (x, y, w, h) in rects:
                        if flip:
                            x = aw - x - w
                        found.append((w * h, x, y, w, h))
            if found:
                _, x, y, w, h = max(found)
                face = {"cx": (x + w / 2) / aw, "cy": (y + h / 2) / ah, "w": w / aw}
        samples.append({"t": round(t, 2), **(face or {})})
        if abs(t - round(t)) < 1e-6:
            sheet.append((t, img.copy(), face))

    sp = arg("--segments")
    if sp and os.path.exists(sp):
        S = json.load(open(sp, encoding="utf-8"))["segments"]
        bounds = sorted(set([round(s["at"], 3) for s in S] + [c for c in cuts_cam]))
    else:
        bounds = sorted(set([0.0] + cuts_cam + [round(x, 2) for x in np.arange(0, dur, 4.0)]))
    bounds = [b for b in bounds if b < dur - 0.05] + [dur]
    if bounds[0] > 0:
        bounds = [0.0] + bounds
    trechos = []
    for a, b in zip(bounds, bounds[1:]):
        inn = [s for s in samples if a - 1e-6 <= s["t"] < b and "cx" in s]
        xs = [s["cx"] for s in inn]
        trechos.append({"t0": round(a, 3), "t1": round(b, 3), "fx": round(float(np.median(xs)), 3) if xs else None,
                        "fy": round(float(np.median([s["cy"] for s in inn])), 3) if inn else None,
                        "w": round(float(np.median([s["w"] for s in inn])), 3) if inn else None, "n": len(xs),
                        "camera": any(abs(c - a) < 0.3 for c in cuts_cam)})
    allx = [s["cx"] for s in samples if "cx" in s]
    gx = float(np.median(allx)) if allx else 0.5
    fy = float(np.median([s["cy"] for s in samples if "cy" in s])) if allx else 0.42
    fw = float(np.median([s["w"] for s in samples if "w" in s])) if allx else 0.2
    for i, tr in enumerate(trechos):  # empty stretches inherit the nearest detected neighbour
        if tr["fx"] is None:
            near = [t2 for t2 in trechos if t2["fx"] is not None]
            nb = min(near, key=lambda t2: abs(t2["t0"] - tr["t0"])) if near else None
            tr["fx"], tr["fy"], tr["w"] = (nb["fx"], nb["fy"], nb["w"]) if nb else (gx, fy, fw)
            tr["herdado"] = True
        tr["aberto"] = bool(tr["w"] and tr["w"] < 0.6 * fw)  # wide shot: face much smaller than usual
    res = {"fonte": os.path.abspath(src), "largura": W, "altura": H, "aspecto": round(W / H, 4), "fy": round(fy, 3), "face_w": round(fw, 3),
           "deteccoes": f"{len(allx)}/{len(samples)}", "cortes_camera": cuts_cam, "trechos": trechos}
    json.dump(res, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"rosto em {len(allx)}/{len(samples)} amostras · fy {fy:.2f} · largura do rosto {fw:.2f} · {len(trechos)} trechos · trocas de câmera: {cuts_cam}")
    if not cv2:
        motivo = ("o OpenCV desta pasta veio sem os detectores de rosto (versão 5): rode a instalação do painel de novo, que ela volta para a 4"
                  if sem_detector else "OpenCV não instalado")
        print(f"AVISO: {motivo} — sem detecção. Use a folha de contato e estime o centro do rosto por trecho.")

    folha = arg("--folha")
    if folha and sheet:
        cols = 12
        cw, ch = aw // 2, ah // 2
        rows = (len(sheet) + cols - 1) // cols
        canvas = np.full((rows * (ch + 4), cols * (cw + 4), 3), 24, np.uint8)
        for k, (t, img, face) in enumerate(sheet):
            im = img[::2, ::2].copy()
            fx = next((tr["fx"] for tr in trechos if tr["t0"] <= t < tr["t1"]), gx)
            win = (1080 / 1920) * (H / W) * cw  # 9:16 window width when the frame height fills 1920
            x0 = int(max(0, min(cw - win, fx * cw - win / 2)))
            im[:, x0:x0 + 2] = (0, 200, 255)
            im[:, min(cw - 2, int(x0 + win)):min(cw, int(x0 + win) + 2)] = (0, 200, 255)
            if face and cv2:
                x, y, w = face["cx"] * cw, face["cy"] * ch, face["w"] * cw
                cv2.rectangle(im, (int(x - w / 2), int(y - w / 2)), (int(x + w / 2), int(y + w / 2)), (0, 255, 0), 2)
            if cv2:
                cv2.putText(im, f"{t:.0f}s", (4, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)
            r, c = divmod(k, cols)
            canvas[r * (ch + 4): r * (ch + 4) + ch, c * (cw + 4): c * (cw + 4) + cw] = im
        if cv2:
            ok, enc = cv2.imencode(".jpg", canvas, [cv2.IMWRITE_JPEG_QUALITY, 85])
            open(folha, "wb").write(enc.tobytes())
        else:
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src, "-vf", "fps=1,scale=240:-2,tile=12x8:padding=4", "-frames:v", "1", folha])
        print("folha de contato:", folha)


if __name__ == "__main__":
    main()
