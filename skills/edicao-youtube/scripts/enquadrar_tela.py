"""Enquadramento da gravação de tela, clipe a clipe, a partir da sequência que o Lucas editou no Premiere.

uso (precisa de OpenCV: rode com o Python do painel, <pasta de trabalho>/_ferramentas/.venv/bin/python):
  enquadrar_tela.py PROJETO.prproj|PASTA_TRABALHO saida.json [--sequencia "nome"] [--intro intro.mp4] [--bruto Gravação.mov]
  (PASTA_TRABALHO = sem editor: usa os cortes do edl.json; --intro põe a intro antes, como no vídeo final)
        [--zoom-max 1.39] [--zoom-min 1.25] [--intervalo 25] [--rampa 0.8] [--sem-navegador]

Pedido do Lucas (07/11/2026): "aproximar um pouco a tela para não mostrar tanta coisa do Mac (data, as coisas ali em
cima)" e "em alguns locais bem específicos, dar um zoom onde estou mostrando o mouse — mas tem que mostrar exatamente
a parte que estou especificando, não pode cortar nada".
  BASE: corta a barra do Mac (em cima) e o Dock (embaixo), medidos na média da tela; centrado e FIXO o vídeo todo
        (deslocar por clipe deu "corte seco, a tela pula" — feedback de 07/11).
  ZOOM: só onde o CURSOR (seta do Mac, achada pelo modelo references/cursor-mac.png, correlação > 0,75) fica numa área
        pequena (≤ 25% x 30% da tela) por ≥ 2,5 s em clipes colados; o quadro inclui os pontos do cursor e o que mudou na
        tela perto dele, com folga (mais em cima: a pergunta/título costuma ficar acima de onde ele clica); no máximo
        --zoom-max do quadro inteiro; zoom menor que --zoom-min não vale (fica a base); ≥ --intervalo s entre zooms.
Saída para premiere_refazer.py --enquadrar (já passada pelo zoom_suave.py: zoom entra/sai com keyframes):
{"arquivo", "largura", "altura", "topo", "fundo", "base", "momentos", "clipes": {"<in>": {tipo, cx, cy, cw, kf?}}}.
Em 07/11 (vídeo 3D, 20 min de aula): base sem barra/Dock = 1,13x; 6 zooms de 1,29–1,39x somando 110 s.
"""
import json, os, subprocess, sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from premiere_ler import ler_linha  # noqa: E402

a = sys.argv[1:]
opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d  # noqa: E731
proj, saida = a[0], a[1]
ZMAX, ZMIN, INTERV = float(opt("--zoom-max", 1.39)), float(opt("--zoom-min", 1.25)), float(opt("--intervalo", 25))
REF = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "references")
L = ler_linha(proj, opt("--sequencia"), intro=opt("--intro"), audio=opt("--audio"))
v1 = next(f for f in L["faixas"] if f["tipo"] == "video" and f["index"] == 0)["clipes"]
from collections import Counter  # noqa: E402
bruto = opt("--bruto") or Counter(c["arquivo"] for c in v1 if c["arquivo"]).most_common(1)[0][0]
A = [c for c in v1 if c["arquivo"] == bruto or os.path.basename(c["arquivo"] or "") == os.path.basename(bruto)]
bruto = A[0]["arquivo"]
info = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                                  "-of", "json", bruto], capture_output=True, text=True).stdout)["streams"][0]
SW, SH = info["width"], info["height"]

# uma leitura do bruto: 4 quadros/s em 1536x864 (cursor) e 768x432 (o que muda)
W2, H2, W1, H1, FPS = 1536, 864, 768, 432, 4
T = cv2.imread(os.path.join(REF, "cursor-mac.png"), 0)
M = cv2.imread(os.path.join(REF, "cursor-mac-mascara.png"), 0)
th, tw = T.shape
mm_ = M > 0
ints = sorted((c["in"], c["out"], k) for k, c in enumerate(A))
mapas = {k: np.zeros((H1 // 8, W1 // 8), np.float32) for k in range(len(A))}
nq = {k: 0 for k in range(len(A))}
cur = {k: [] for k in range(len(A))}
soma = np.zeros((H1, W1), np.float64)
ns = 0
fr = W2 * H2
p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", bruto, "-vf", f"fps={FPS},scale={W2}:{H2}:flags=area,format=gray",
                      "-f", "rawvideo", "-"], stdout=subprocess.PIPE, bufsize=fr * 4)
prev = None
t = 0.0
j = 0
n = 0
while True:
    b = p.stdout.read(fr)
    if len(b) < fr:
        break
    f2 = np.frombuffer(b, np.uint8).reshape(H2, W2)
    f1 = cv2.resize(f2, (W1, H1), interpolation=cv2.INTER_AREA).astype(np.int16)
    if n % 40 == 0:
        soma += f1
        ns += 1
    while j < len(ints) and ints[j][1] < t:
        j += 1
    ativos = [k for x0, x1, k in ints[j:j + 3] if x0 <= t <= x1]
    if ativos:
        if prev is not None:
            m = (np.abs(f1 - prev) > 18).astype(np.float32).reshape(H1 // 8, 8, W1 // 8, 8).mean((1, 3))
            for k in ativos:
                mapas[k] += m
                nq[k] += 1
        if n % 2 == 0:
            r = np.nan_to_num(cv2.matchTemplate(f2, T, cv2.TM_CCORR_NORMED, mask=M), nan=0, posinf=0, neginf=0)
            _, _, _, (x0, y0) = cv2.minMaxLoc(r)
            pat = f2[y0:y0 + th, x0:x0 + tw].astype(np.float32)
            if pat.shape == T.shape:
                c = np.corrcoef(pat[mm_], T.astype(np.float32)[mm_])[0, 1]
                if c > 0.75:
                    for k in ativos:
                        cur[k].append(((x0 + 4) * SW / W2, (y0 + 4) * SH / H2))
    prev = f1
    t += 1 / FPS
    n += 1
p.wait()

# barra do Mac e Dock pela média da tela (perfil de linhas: salto forte perto das bordas)
row = (soma / max(1, ns)).mean(1)
d = np.abs(np.diff(row))
topo_i = int(np.argmax(d[:int(0.06 * H1)])) + 1
zona = d[int(0.85 * H1):]
fundo_i = int(0.85 * H1) + int(np.argmax(zona > 0.5 * zona.max())) + 1   # o 1º salto forte = borda de baixo da janela
TOPO, FUNDO = topo_i / H1, fundo_i / H1
if not (0.01 <= TOPO <= 0.06) or not (0.85 <= FUNDO <= 0.97):
    TOPO, FUNDO = 0.030, 0.917
if "--sem-navegador" in a:
    # gravação no navegador: tira também as abas, o endereço e os favoritos (16/11: no teste apareciam abas pessoais,
    # uma delas com um código de verificação). A borda de baixo dessa barra é o salto mais forte logo abaixo da barra
    # do Mac (até 16% da altura). Sem um salto claro, não mexe: melhor sobrar barra do que cortar a página.
    z0 = int(TOPO * H1) + int(0.02 * H1)
    z1 = int(TOPO * H1) + int(0.16 * H1)
    k = z0 + int(np.argmax(d[z0:z1]))
    if d[k] >= 8:
        TOPO = (k + 2) / H1
        print(f"sem a barra do navegador: corte em cima em {TOPO:.1%} da altura")
    else:
        print("--sem-navegador: não achei a borda da barra do navegador; ficou só sem a barra do Mac (confira um quadro)")
BASE_W = (FUNDO - TOPO) * SH * 16 / 9
MIN_W = SW / ZMAX
BASE = dict(cx=SW / 2, cy=(TOPO + FUNDO) / 2 * SH, cw=BASE_W)


def ativ(k, perto=None, raio=0.18):
    m = mapas[k] / max(1, nq[k])
    m[:int(TOPO * 54) + 1] = 0
    m[int(FUNDO * 54):] = 0
    ys, xs = np.nonzero(m > 0.012)
    pts = [((x + 0.5) / 96 * SW, (y + 0.5) / 54 * SH) for y, x in zip(ys, xs)]
    if perto:
        pts = [q for q in pts if abs(q[0] - perto[0]) < raio * SW and abs(q[1] - perto[1]) < raio * SW]
    return pts


def quadro_para(pts):
    xs, ys = [q[0] for q in pts], [q[1] for q in pts]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    mx, my = max(0.07 * SW, 0.25 * (x1 - x0)), max(0.08 * SH, 0.25 * (y1 - y0))
    x0, x1, y0, y1 = x0 - mx, x1 + mx, y0 - 2.2 * my, y1 + 0.8 * my
    cw = min(BASE_W, max(MIN_W, x1 - x0, (y1 - y0) * 16 / 9))
    ch = cw * 9 / 16
    return dict(cx=min(max((x0 + x1) / 2, cw / 2), SW - cw / 2),
                cy=min(max((y0 + y1) / 2, TOPO * SH + ch / 2), FUNDO * SH - ch / 2), cw=cw)


cand = []
k = 0
while k < len(A):
    if len(cur[k]) >= 2:
        jj, todos = k, list(cur[k])
        while jj + 1 < len(A) and abs(A[jj + 1]["t0"] - A[jj]["t1"]) < 0.05 and cur[jj + 1]:
            nov = todos + cur[jj + 1]
            xs, ys = [q[0] for q in nov], [q[1] for q in nov]
            if max(xs) - min(xs) > 0.25 * SW or max(ys) - min(ys) > 0.3 * SH:
                break
            todos, jj = nov, jj + 1
        xs, ys = [q[0] for q in todos], [q[1] for q in todos]
        if len(todos) >= 5 and A[jj]["t1"] - A[k]["t0"] >= 2.5 and max(xs) - min(xs) <= 0.25 * SW and max(ys) - min(ys) <= 0.3 * SH:
            c = (float(np.mean(xs)), float(np.mean(ys)))
            q = quadro_para(todos + [pp for i in range(k, jj + 1) for pp in ativ(i, c)])
            if SW / q["cw"] >= ZMIN:
                cand.append(dict(k0=k, k1=jj, t0=A[k]["t0"], t1=A[jj]["t1"], n=len(todos), q=q))
            k = jj + 1
            continue
    k += 1
cand.sort(key=lambda c: -c["n"])
esc = []
for c in cand:
    if all(abs(c["t0"] - e["t0"]) >= INTERV for e in esc):
        esc.append(c)
esc.sort(key=lambda c: c["t0"])
out = {}
for e in esc:
    for i in range(e["k0"], e["k1"] + 1):
        out[f"{A[i]['in']:.3f}"] = dict(tipo="zoom", **e["q"])
for i, c in enumerate(A):
    key = f"{c['in']:.3f}"
    if key in out:
        continue
    q = dict(BASE)
    pts = ativ(i) + cur[i]
    if pts:
        xs = [pp[0] for pp in pts]
        x0, x1 = np.percentile(xs, 3), np.percentile(xs, 97)
        if x0 < q["cx"] - q["cw"] / 2 or x1 > q["cx"] + q["cw"] / 2:
            q["cw"] = min(SW, max(q["cw"], x1 - x0 + 0.04 * SW))
            q["cx"] = min(max((x0 + x1) / 2, q["cw"] / 2), SW - q["cw"] / 2)
            q["cy"] = min(max(q["cy"], q["cw"] * 9 / 32), SH - q["cw"] * 9 / 32)
    out[key] = dict(tipo="base", **q)
from zoom_suave import suavizar  # noqa: E402
# base FIXA e zoom com keyframes (07/11: "corte seco, a tela pula para um lado e para o outro — não precisa")
json.dump(suavizar(A, {"arquivo": os.path.basename(bruto), "largura": SW, "altura": SH, "topo": TOPO, "fundo": FUNDO,
                       "clipes": out}, float(opt("--rampa", 0.8))), open(saida, "w"), indent=0)
mmss = lambda t: f"{int(t // 60)}:{t % 60:04.1f}"  # noqa: E731
print(f"barra do Mac até {TOPO * 100:.1f}% · Dock a partir de {FUNDO * 100:.1f}% → base {SW / BASE_W:.2f}x · "
      f"{len(esc)} zooms ({sum(e['t1'] - e['t0'] for e in esc):.0f} s) · {len(A)} clipes → {saida}")
for e in esc:
    print(f"  zoom {mmss(e['t0'])}–{mmss(e['t1'])} ({e['n']} pontos do cursor) {SW / e['q']['cw']:.2f}x")
