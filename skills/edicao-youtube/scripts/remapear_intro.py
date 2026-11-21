"""Reajusta os tempos de uma intro em HyperFrames depois que a decupagem mudou (a voz encurtou/mudou).

Cada tempo da intro antiga vira um ponto do BRUTO (pelo edl antigo) e esse ponto vira o tempo novo (pelo edl novo).
Se o ponto do bruto foi cortado na decupagem nova (era um retake), ele cai no começo do próximo trecho que ficou.

uso: python3 remapear_intro.py PASTA_HF --ancoras ancoras.json [--vel 1.15]          (recomendado)
     python3 remapear_intro.py PASTA_HF --edl-antes v1/edl.json --fim-antes 165.1 --edl-depois edl.json --fim-depois 165.0
  ancoras.json = [[tempo_antigo, tempo_novo], ...] da palavra de cada animação (início das cenas, palavras-chave, 0 e o fim).
  Pelo edl, um tempo preso num retake que saiu cai no começo da tentativa que ficou, não na palavra: confira e prefira âncoras.
  - na 1ª vez copia index.html → index_base.html (os tempos "originais"); depois gera index.html sempre a partir dela;
  - data-start/data-duration (cenas, legendas, sons, vídeos) são reescritos; o data-duration da raiz vira o total novo;
  - as posições do GSAP passam por T(t) (a tabela MAPA vai dentro do HTML), as durações das animações ficam iguais.
Depois: trecho_intro.py de novo (voz.wav/tela.mp4 novos), transcrever a voz, conferir as legendas e renderizar.
"""
import json, os, re, shutil, sys

a = sys.argv[1:]
hf = a[0]
opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d  # noqa: E731
vel = float(opt("--vel", 1.15))


def trechos(edl, fim):
    E = json.load(open(edl))
    F = E["fps"]
    out, acc = [], 0.0
    for c in E["clips"]:
        s0, s1 = c["src0"] / F, min(c["src1"] / F, fim)
        if s0 >= fim:
            break
        out.append((s0, s1, acc))
        acc += s1 - s0
    return out, acc


ANC = json.load(open(opt("--ancoras"))) if opt("--ancoras") else None
if ANC:
    # âncoras [tempo antigo, tempo novo] tiradas das palavras (voz.json antiga x nova): o certo quando a decupagem nova
    # tirou retakes — a cena que estava presa numa tentativa cortada tem que ir para a palavra da tentativa que ficou
    ANC = sorted(ANC)
    tot_a, tot_d = ANC[-1][0] * vel, ANC[-1][1] * vel
else:
    antes, tot_a = trechos(opt("--edl-antes"), float(opt("--fim-antes")))
    depois, tot_d = trechos(opt("--edl-depois"), float(opt("--fim-depois")))


def T_anc(t):
    for (a0, b0), (a1, b1) in zip(ANC, ANC[1:]):
        if t <= a1:
            return round(b0 + (b1 - b0) * (t - a0) / (a1 - a0), 3) if a1 > a0 else b1
    return ANC[-1][1]


def T(t):
    if ANC:
        return T_anc(t)
    c = t * vel
    src = antes[-1][1]
    for s0, s1, acc in antes:
        if c < acc + (s1 - s0):
            src = s0 + max(0.0, c - acc)
            break
    for s0, s1, acc in depois:
        if src < s1:
            return round((acc + max(0.0, src - s0)) / vel, 3)
    return round(tot_d / vel, 3)


base = os.path.join(hf, opt("--base", "versoes/index_base.html"))
if not os.path.exists(base):
    shutil.copy(os.path.join(hf, "index.html"), base)
h = open(base, encoding="utf-8").read()


def par(m):
    s, d = float(m.group(2)), float(m.group(4))
    ns = T(s)
    nd = max(0.04, round(T(s + d) - ns, 3))
    return f'{m.group(1)}{ns}{m.group(3)}{nd}"'


h = re.sub(r'(data-start=")([\d.]+)(" data-duration=")([\d.]+)"', par, h)
total = round(tot_d / vel, 2)
h = re.sub(r'(data-composition-id="main" data-start="0" data-duration=")[\d.]+"', rf'\g<1>{total}"', h, count=1)
h = re.sub(r'(<audio id="voz"[^>]*data-duration=")[\d.]+"', rf'\g<1>{total}"', h)
mapa = [[round(i * 0.05, 2), T(i * 0.05)] for i in range(int(tot_a / vel / 0.05) + 2)]
js = ("const MAPA = " + json.dumps(mapa, separators=(",", ":")) + ";\n"
      "      const T = (t) => { if (t <= 0) return MAPA[0][1]; const k = Math.min(MAPA.length - 2, Math.floor(t / 0.05));"
      " const [a0, b0] = MAPA[k], [a1, b1] = MAPA[k + 1]; return b1 - b0 > 0.2 ? b0 + (t - a0) : b0 + (b1 - b0) * (t - a0) / (a1 - a0); };\n"
      "      const _tl = gsap.timeline({ paused: true });\n"
      "      const tl = { fromTo: (x, y, z, p) => _tl.fromTo(x, y, z, T(p)), to: (x, y, p) => _tl.to(x, y, T(p)) };")
assert "const tl = gsap.timeline({ paused: true });" in h
h = h.replace("const tl = gsap.timeline({ paused: true });", js)
h = h.replace('document.querySelectorAll(".leg").forEach((l) => tl.fromTo(', 'document.querySelectorAll(".leg").forEach((l) => _tl.fromTo(')
h = h.replace('window.__timelines["main"] = tl;', 'window.__timelines["main"] = _tl;').replace("tl.seek(0);", "_tl.seek(0);")
open(os.path.join(hf, "index.html"), "w", encoding="utf-8").write(h)
print(f"intro {tot_a / vel:.2f}s → {total}s · {h.count('data-start=')} tempos reescritos · MAPA {len(mapa)} pontos")
