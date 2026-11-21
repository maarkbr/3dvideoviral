"""Lista de cortes: o que fica do bruto, os zooms (com ponto de foco) e o tempo de cada palavra na edição.

uso: python3 cortes.py PASTA_TRABALHO
  lê   job.json, transcricao.json, db10ms.npy (rode decupar.py antes)
  grava edl.json, palavras_tl.json (cada palavra no tempo da edição) e imprime o resumo

job.json (tempos em segundos do ARQUIVO BRUTO; palavras = índices do transcricao.json, inclusivos):
  video        caminho real do bruto
  fps          fps da linha do tempo (30)
  tipo         "tela" (gravação de tela, padrão) | "camera" (rosto falando)
  ritmo        "dinamico" (padrão: pausa ≥ 0,12 s sai, emenda ≤ 0,08 s, sem respiro — o ritmo do Lucas)
               | "apertado" (pausa vira respiro curto, emenda ≤ 0,18 s) | "natural" (só pausas > 0,6 s saem)
  muletas      true (padrão) | false — "Então/E/Aí/Bom" abrindo frase após pausa e "tá?/né?" antes de pausa (retakes.py)
  remover      [[i0, i1, "motivo"], ...]      tentativas repetidas, erros, recomeços, "corta", vícios
  remover_tempo [[s, e, "motivo"], ...]       o que a transcrição juntou e não dá para pegar por palavra
  manter_tempo [[s, e, "motivo"], ...]        protege silêncio que importa (algo acontecendo na tela)
  zooms        [{"a": i0, "b": i1, "foco": [x, y], "escala": 1.5, "motivo": "..."}]
               foco em 0..1 da imagem (0,0 = canto de cima à esquerda). Na tela: onde está o botão/campo.
  punch        só "camera": alterna enquadramento nas emendas (1.10); 1 desliga
  fim_extra    segundos depois da última palavra (padrão 1.0)
  acelerar     [{"de": i0, "ate": i1, "fator": 1.15}]   acelera um trecho (palavras) sem mudar o tom (CapCut)
  intro_pronta {"arquivo": "/abs/intro.mov", "ate": i}  intro já editada fora (HyperFrames): entra no começo e a
               aula segue da palavra i+1 (mesmo corte do trecho_intro.py). Use o arquivo SEM master (voz no nível do bruto).
"""
import json, sys
import numpy as np

sys.path.insert(0, __import__("os").path.dirname(__file__))
import capcut as cc  # noqa: E402

wd = sys.argv[1]
J = cc.load(f"{wd}/job.json")
TR = cc.load(f"{wd}/transcricao.json")
W = TR["words"]
FALAS = TR.get("motor") == "whisper-falas"   # transcrição fala por fala: tempos confiáveis, retakes à vista
db = np.load(f"{wd}/db10ms.npy")
FPS = J.get("fps", 30)
N = len(db)
# chão de ruído e nível de fala sem o silêncio digital (OBS grava zeros quando o microfone corta) e com a fala
# medida dentro das palavras: senão uma gravação com muita espera puxa o limiar para baixo e o ruído da sala vira "fala"
real = db > -100
ruido = float(np.percentile(db[real], 10)) if real.any() else float(np.percentile(db, 10))
_pal = np.zeros(N, bool)
for _w in W:
    _pal[int(_w["start"] * 100):int(_w["end"] * 100)] = True
fala = float(np.percentile(db[_pal & real], 60)) if (_pal & real).any() else float(np.percentile(db, 70))
SIL = min(-38.0, max(ruido + 8, fala - 26))
if TR.get("limiar_db") is not None:          # limiar de fala medido na transcrição por falas (Otsu entre ruído e voz)
    SIL = float(TR["limiar_db"]) - 2
# ritmo "dinamico" (padrão desde 07/11/2026): o que o Lucas deixa nas emendas dele no Premiere — mediana 0,03 s de
# silêncio, 90% abaixo de 0,08 s, sem respiração ("tem que remover tudo, deixar bem dinâmico").
RITMO = J.get("ritmo", "dinamico")
PACE = {"dinamico": (0.12, 0.03, 0.02), "apertado": (0.22, 0.07, 0.06), "natural": (0.60, 0.20, 0.15)}[RITMO]
S = lambda i: W[i]["start"]
E = lambda i: W[i]["end"]


def mais_quieto(t0, t1):
    a, b = max(0, int(t0 * 100)), min(N, int(t1 * 100))
    if b <= a:
        return (t0 + t1) / 2
    return (a + int(np.argmin(db[a:b]))) / 100


def borda_remocao(i0, i1):
    """Início e fim de uma remoção, no ponto mais quieto entre palavras. Se o trecho escolhido quase não tem som, o
    Whisper marcou a palavra cedo demais (comum logo depois de um silêncio longo, como o "Bom" do começo): o ponto mais
    quieto caiu no silêncio ANTES da palavra e ela ficava no vídeo. Aí o fim anda até o silêncio depois da fala."""
    s = mais_quieto(min(E(i0 - 1), S(i0)) - 0.12, S(i0) + 0.12) if i0 > 0 else max(0, S(i0) - 0.05)
    e = mais_quieto(E(i1) - 0.12, max(E(i1), S(i1 + 1)) + 0.12) if i1 + 1 < len(W) else E(i1) + 0.1
    a, b = int(s * 100), int(e * 100)
    falado = int(np.sum(db[a:b] > SIL)) if b > a else 0
    esperado = max(1, int((E(i1) - S(i0)) * 100))
    if falado < 0.3 * esperado:
        k = max(b, int(S(i0) * 100))
        while k < N and db[k] <= SIL and k < b + 60:   # onde a fala tirada começa de verdade
            k += 1
        dur = max(0.1, E(i1) - S(i0))                  # duração da fala tirada, pelo Whisper
        if i1 + 1 >= len(W) or k / 100 < S(i1 + 1):    # só se essa fala vem antes da próxima palavra que fica
            e = mais_quieto(k / 100 + 0.6 * dur, k / 100 + dur + 0.1)   # o silêncio logo depois dela
    return s, e


# ---- remoções -> faixas de tempo, bordas no ponto mais quieto entre palavras
removidos = []
for i0, i1, why in J.get("remover", []):
    s, e = borda_remocao(i0, i1)
    removidos.append((s, e, why))
# retakes achados pelo detector (decupar.py → retakes.json): entram sozinhos, menos os que a Claude mandou manter
if J.get("retakes_auto", True) and __import__("os").path.exists(f"{wd}/retakes.json"):
    manter = set(J.get("manter_retakes", []))
    for r in cc.load(f"{wd}/retakes.json"):
        if r["i0"] in manter or (r["motivo"].startswith("muleta") and J.get("muletas", True) is False):
            continue
        i0, i1 = r["i0"], r["i1"]
        s, e = borda_remocao(i0, i1)
        removidos.append((s, e, "auto: " + r["motivo"]))
removidos += [tuple(r) for r in J.get("remover_tempo", [])]
removidos.sort()

# ---- máscara de fala
fala_m = db > SIL
for x, y in cc.runs(~fala_m):
    if y - x < 12:
        fala_m[x:y] = True       # oclusivas não são pausa
for x, y in cc.runs(fala_m):
    if y - x < 6:
        fala_m[x:y] = False      # estalos não são fala

fim = J.get("fim_src") or (W[-1]["end"] + J.get("fim_extra", 1.0))
keep = np.zeros(N, bool)
ini = max(0, int(S(0) * 100) - 12)          # começa logo antes da primeira palavra
lim = max(0, int(S(0) * 100) - 100)          # o Whisper às vezes marca a 1ª palavra tarde: recua enquanto houver fala
while ini > lim and fala_m[ini - 1:ini + 1].any():
    ini -= 1
ini = max(0, ini - 6)
keep[ini:int(fim * 100)] = True
proteger = np.zeros(N, bool)
for s, e, _ in J.get("manter_tempo", []):
    proteger[int(s * 100):int(e * 100)] = True
min_gap, tail, lead = PACE
# pausas: pelo vão entre palavras (o Whisper marca bem) E pelo volume; respiração no meio do vão também sai,
# mas som alto que o Whisper não transcreveu (palavra perdida) fica.
em_palavra = np.zeros(N, bool)
for w in W:
    em_palavra[max(0, int(w["start"] * 100) - 4):int(w["end"] * 100) + 4] = True
nivel_fala = float(np.percentile(db[em_palavra], 90)) if em_palavra.any() else fala
alto = db > nivel_fala - 14
if FALAS:
    # transcrição por falas: a pausa é o SILÊNCIO de verdade (volume abaixo do limiar Otsu). O fim de palavra que o
    # Whisper marca cedo fica (está acima do limiar). Trecho com som mas sem nenhuma palavra (hesitação "éé",
    # respiração, estalo) sai, se for curto.
    dentro = np.zeros(N, bool)          # miolo das palavras (tempo do Whisper, quase sem folga)
    for w in W:
        dentro[int(w["start"] * 100):int(w["end"] * 100) + 2] = True
    suave = np.convolve(db, np.ones(5) / 5, mode="same")
    # silêncio fundo (abaixo do limiar) é pausa mesmo "dentro" de palavra (o Whisper estica a palavra por cima da pausa
    # em fala longa); fora das palavras, respiração e cauda baixa (até 5 dB acima do limiar) também é pausa
    quieto = (suave < SIL) | ((suave < SIL + 5) & ~dentro)
    for x, y in cc.runs(fala_m):
        if y - x < 150 and not em_palavra[x:y].any() and not proteger[x:y].any():
            quieto[x:y] = True              # som sem palavra nenhuma (hesitação, estalo) também
    for x, y in cc.runs(~quieto):           # vãozinho de consoante dentro da pausa não quebra a pausa
        if y - x < 6 and not dentro[x:y].any():
            quieto[x:y] = True
    vaos = cc.runs(quieto)
else:
    vaos = cc.runs(~fala_m | ~em_palavra)
for x, y in vaos:
    if x == 0 or y >= N:
        continue
    t0, t1 = x / 100, y / 100
    if t1 - t0 >= min_gap:
        a, b = int(round((t0 + tail) * 100)), int(round((t1 - lead) * 100))
        if b <= a or proteger[a:b].any():
            continue
        corte = np.ones(b - a, bool)
        for p, q in cc.runs(alto[a:b]):
            if q - p >= (25 if FALAS else 8) and not em_palavra[a + p:a + q].any():   # fala que o Whisper perdeu
                corte[max(0, p - 6):q + 6] = False
        keep[a:b] &= ~corte
for s, e, _ in removidos:
    keep[int(round(s * 100)):int(round(e * 100))] = False
keep[:ini] = False
for x, y in cc.runs(keep):          # lasca de som entre duas remoções coladas não vira clipe
    if y - x < 15 and not proteger[x:y].any():
        keep[x:y] = False
# emenda: silêncio do fim de um clipe + do começo do próximo nunca passa de PAUSA_MAX (cada lado guarda um pouco)
PAUSA_MAX = int(J.get("pausa_max", {"dinamico": 0.08, "apertado": 0.18}.get(RITMO, 0.35)) * 100)
quieto_e = np.convolve(db, np.ones(5) / 5, mode="same") < SIL + 5
R_ = cc.runs(keep)
for (x0, y0), (x1, y1) in zip(R_, R_[1:]):
    if proteger[y0 - 1:x1 + 1].any():
        continue
    fim_a = 0
    while fim_a < y0 - x0 - 1 and quieto_e[y0 - 1 - fim_a]:
        fim_a += 1
    ini_b = 0
    while ini_b < y1 - x1 - 1 and quieto_e[x1 + ini_b]:
        ini_b += 1
    if fim_a + ini_b > PAUSA_MAX:
        ka = min(fim_a, PAUSA_MAX // 2)
        kb = min(ini_b, PAUSA_MAX - ka)
        keep[y0 - (fim_a - ka):y0] = False
        keep[x1:x1 + (ini_b - kb)] = False
INTRO = J.get("intro_pronta")
if INTRO:                        # a intro pronta substitui tudo até a última palavra dela (+0,25 s, igual ao trecho_intro)
    keep[:int(round((E(INTRO["ate"]) + 0.25) * 100))] = False

clips = [(x / 100, y / 100) for x, y in cc.runs(keep)]
fins_remocao = {round(e, 2) for _, e, _ in removidos}


def juntar_curtos(clips, min_len=0.5, max_restore=0.8):
    mudou = True
    while mudou:
        mudou = False
        for k, (a, b) in enumerate(clips):
            if b - a >= min_len:
                continue
            ops = []
            if k > 0 and a - clips[k - 1][1] <= max_restore and round(a, 2) not in fins_remocao:
                ops.append((a - clips[k - 1][1], k - 1))
            if k + 1 < len(clips) and clips[k + 1][0] - b <= max_restore and round(clips[k + 1][0], 2) not in fins_remocao:
                ops.append((clips[k + 1][0] - b, k))
            if ops:
                _, j = min(ops)
                clips[j:j + 2] = [(clips[j][0], clips[j + 1][1])]
                mudou = True
                break
    return clips


clips = juntar_curtos(clips)
tem_palavra = lambda a, b: any(w["start"] < b - 0.05 and w["end"] > a + 0.05 for w in W)
tem_protegido = lambda a, b: proteger[int(a * 100):int(b * 100)].any()
descartados = [(a, b) for a, b in clips if not (tem_palavra(a, b) or tem_protegido(a, b))]
clips = [(a, b) for a, b in clips if tem_palavra(a, b) or tem_protegido(a, b)]
cf = [[cc.fr(a, FPS), cc.fr(b, FPS)] for a, b in clips if cc.fr(b, FPS) - cc.fr(a, FPS) >= 3]

# ---- velocidade por trecho (ex.: intro em 1,15x): corta os clipes nas bordas e guarda "vel" em cada um
vel_trechos = []
for v in J.get("acelerar", []):
    a = S(v["de"]) - 0.15 if "de" in v else float(v.get("de_s", 0))
    b = E(v["ate"]) + 0.15 if "ate" in v else float(v["ate_s"])
    vel_trechos.append((cc.fr(a, FPS), cc.fr(b, FPS), float(v.get("fator", 1.15))))
vel_de = lambda f: next((x for a, b, x in vel_trechos if a <= f < b), 1.0)
bordas = sorted({p for a, b, _ in vel_trechos for p in (a, b)})
cf2 = []
for a, b in cf:
    pts = [a] + [p for p in bordas if a + 3 < p < b - 3] + [b]
    cf2 += [[p, q] for p, q in zip(pts, pts[1:])]

D0 = 0
if INTRO:
    import subprocess
    dur_i = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", INTRO["arquivo"]],
                                 capture_output=True, text=True).stdout)
    D0 = int(dur_i * FPS)        # quadros inteiros que cabem no arquivo
tl = D0
out = []
for a, b in cf2:
    v = vel_de(a)
    n = max(1, int(round((b - a) / v)))
    out.append({"src0": a, "src1": b, "tl0": tl, "tl1": tl + n, "vel": v})
    tl += n
TOTAL = tl


def src_tl(t):
    f = t * FPS
    for c in out:
        if c["src0"] <= f < c["src1"]:
            return (c["tl0"] + (f - c["src0"]) / c["vel"]) / FPS
    for c in out:
        if c["src0"] >= f:
            return c["tl0"] / FPS
    return TOTAL / FPS


# ---- zooms: envelope de escala/posição na linha do tempo (segundos), suave na entrada e na saída
RAMPA = 0.45
zonas = []
for z in J.get("zooms", []):
    a, b = src_tl(S(z["a"]) - 0.1), src_tl(E(z["b"]) + 0.25)
    if b - a < 0.6:
        continue
    s = float(z.get("escala", 1.5))
    fx, fy = z.get("foco", [0.5, 0.5])
    px, py = (fx * 2 - 1) * (1 - s), -(fy * 2 - 1) * (1 - s)     # ponto de foco fica parado no lugar
    zonas.append({"a": a, "b": b, "s": s, "x": px, "y": py, "motivo": z.get("motivo", "")})
zonas.sort(key=lambda z: z["a"])
for z1, z2 in zip(zonas, zonas[1:]):          # zooms colados viram transição direta
    if z2["a"] - z1["b"] < 2 * RAMPA:
        z1["b"] = z2["a"] = (z1["b"] + z2["a"]) / 2
        z1["colado_dep"] = z2["colado_ant"] = True


def ease(u):
    return u * u * (3 - 2 * u)


def envelope(t):
    """(escala, x, y) no tempo t da edição."""
    for z in zonas:
        if z["a"] <= t <= z["b"]:
            u_in = 1.0 if z.get("colado_ant") else min(1, (t - z["a"]) / RAMPA)
            u_out = 1.0 if z.get("colado_dep") else min(1, (z["b"] - t) / RAMPA)
            k = ease(max(0, min(u_in, u_out)))
            return 1 + (z["s"] - 1) * k, z["x"] * k, z["y"] * k
    return 1.0, 0.0, 0.0


pontos = sorted({p for z in zonas for p in (z["a"], z["a"] + RAMPA / 2, z["a"] + RAMPA, z["b"] - RAMPA, z["b"] - RAMPA / 2, z["b"])})
PUNCH = J.get("punch", 1.10) if J.get("tipo", "tela") == "camera" else 1.0
alterna = False
for c in out:
    t0, t1 = c["tl0"] / FPS, (c["tl1"] - 1) / FPS
    base = PUNCH if (alterna and PUNCH > 1) else 1.0
    alterna = not alterna
    ts = [t0] + [p for p in pontos if t0 < p < t1] + [t1]
    kfs = []
    for t in ts:
        s, x, y = envelope(t)
        kfs.append([round(t, 4), round(s * base, 4), round(x, 4), round(y, 4)])
    c["kf"] = kfs if any(abs(k[1] - kfs[0][1]) > 1e-4 or abs(k[2]) > 1e-4 or abs(k[3]) > 1e-4 for k in kfs) else []
    c["escala"] = kfs[0][1]


def to_tl(t):
    f = t * FPS
    for c in out:
        if c["src0"] <= f < c["src1"]:
            return round((c["tl0"] + (f - c["src0"]) / c["vel"]) / FPS, 3)
    folga = 0.25 * FPS          # palavra que o Whisper marcou um pouco fora da borda do corte gruda na borda
    for c in out:
        if 0 <= c["src0"] - f <= folga:
            return round(c["tl0"] / FPS, 3)
        if 0 <= f - c["src1"] <= folga:
            return round((c["tl1"] - 1) / FPS, 3)
    return None


palavras_tl = [{"i": w["i"], "w": w["text"], "s": to_tl(w["start"] + 0.02), "e": to_tl(max(w["start"] + 0.03, w["end"] - 0.02))}
               for w in W]
cortes_tl = ([0.0] if D0 else []) + [c["tl0"] / FPS for c in out] + [TOTAL / FPS]
cc.save(f"{wd}/palavras_tl.json", palavras_tl)
cc.save(f"{wd}/edl.json", {"fps": FPS, "video": J["video"], "total_frames": TOTAL, "clips": out, "zonas": zonas,
                           "intro": {"arquivo": INTRO["arquivo"], "frames": D0} if INTRO else None,
                           "cortes_tl": cortes_tl,
                           "removidos": [{"s": s, "e": e, "motivo": w} for s, e, w in removidos]})

bruto = W[-1]["end"]
lens = np.array([(c["tl1"] - c["tl0"]) / FPS for c in out])
perdidas = [w for w in palavras_tl if w["s"] is None]
print(f"edição {TOTAL / FPS:.1f}s ({int(TOTAL / FPS // 60)}:{TOTAL / FPS % 60:04.1f}) de {bruto:.1f}s brutos "
      f"(-{100 - TOTAL / FPS / bruto * 100:.0f}%) · {len(out)} clipes · menor {lens.min():.2f}s · limiar {SIL:.1f} dBFS")
print(f"removidos {len(removidos)} trechos · zooms {len(zonas)} · palavras fora da edição {len(perdidas)}")
print("trechos sem fala descartados:", [(round(a, 2), round(b, 2)) for a, b in descartados][:20])
