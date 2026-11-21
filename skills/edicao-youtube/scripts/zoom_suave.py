"""Enquadramento SEM pulos: a base fica FIXA o vídeo todo e o zoom entra e sai com keyframes (suave), não no corte.

uso: python3 zoom_suave.py PROJETO.prproj|PASTA_TRABALHO enquadramento.json saida.json [--sequencia "nome"] [--intro intro.mp4] [--rampa 0.8]
     (também é chamado no fim do enquadrar_tela.py)

Feedback do Lucas (07/11/2026) sobre a 1ª versão (enquadramento por clipe): "tô na tela do Claude e tem corte toda hora,
fica estranho — é um corte seco, a tela pula para um lado, pula para o outro. Corta a parte de baixo dos aplicativos e a
de cima, deixa só o meio. Dá para aproximar com keyframes em alguns lugares, e não um corte brusco numa coisa que já está
na tela." Então:
  - BASE: um quadro só para a gravação inteira (sem a barra do Mac e sem o Dock, centrado), nunca deslocado por clipe;
  - ZOOM: os momentos do enquadrar_tela (clipes colados com o mesmo quadro de zoom) viram uma curva no tempo da
    sequência: --rampa s de entrada (suave: 3x²−2x³), zoom parado, --rampa s de volta no fim do momento. Cada clipe
    do momento recebe os keyframes do pedaço da curva que cai nele — a câmera anda contínua mesmo atravessando cortes.
Saída: o formato do --enquadrar do premiere_refazer.py, com "kf": [[t_no_clipe_s, cx, cy, cw], ...] onde há movimento.
No XML, o <when> do keyframe é em quadros da MÍDIA (como o <in>), não do começo do clipe — calibrado no Premiere 2026.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from premiere_ler import ler_linha  # noqa: E402


def suavizar(A, enq, rampa=0.8, amostras=7):
    """A: clipes da gravação na V1 (ordem da sequência); enq: o json do enquadrar_tela. Devolve o json novo."""
    SW, SH = enq["largura"], enq["altura"]
    topo, fundo = enq.get("topo", 0.030), enq.get("fundo", 0.917)
    base = dict(cx=SW / 2, cy=(topo + fundo) / 2 * SH, cw=(fundo - topo) * SH * 16 / 9)
    C = enq["clipes"]
    # momentos de zoom: clipes colados na sequência com o mesmo quadro de zoom
    mom = []
    for i, c in enumerate(A):
        q = C.get(f"{c['in']:.3f}")
        if not q or q["tipo"] != "zoom":
            continue
        z = (round(q["cx"]), round(q["cy"]), round(q["cw"]))
        if mom and mom[-1]["k1"] == i - 1 and mom[-1]["z"] == z and abs(A[i - 1]["t1"] - c["t0"]) < 0.05:
            mom[-1]["k1"] = i
        else:
            mom.append(dict(k0=i, k1=i, z=z))
    out = {f"{c['in']:.3f}": dict(tipo="base", **base) for c in A}
    for m in mom:
        T0, T1 = A[m["k0"]]["t0"], A[m["k1"]]["t1"]
        r = min(rampa, (T1 - T0) / 3)
        Z = dict(cx=m["z"][0], cy=m["z"][1], cw=m["z"][2])

        def quadro(t):
            if t <= T0 + r:
                x = max(0.0, (t - T0) / r)
            elif t >= T1 - r:
                x = max(0.0, (T1 - t) / r)
            else:
                x = 1.0
            e = 3 * x * x - 2 * x ** 3
            return [base[k] + (Z[k] - base[k]) * e for k in ("cx", "cy", "cw")]

        marcas = [T0 + r * j / (amostras - 1) for j in range(amostras)] + [T1 - r + r * j / (amostras - 1) for j in range(amostras)]
        for i in range(m["k0"], m["k1"] + 1):
            c = A[i]
            ts = sorted({c["t0"], c["t1"]} | {t for t in marcas if c["t0"] < t < c["t1"]})
            kf = [[round(t - c["t0"], 4)] + [round(v, 1) for v in quadro(t)] for t in ts]
            parado = all(abs(k[3] - kf[0][3]) < 0.5 and abs(k[1] - kf[0][1]) < 0.5 and abs(k[2] - kf[0][2]) < 0.5 for k in kf)
            e = dict(tipo="zoom", cx=Z["cx"], cy=Z["cy"], cw=Z["cw"])
            if parado:
                e.update(cx=kf[0][1], cy=kf[0][2], cw=kf[0][3])
            else:
                e["kf"] = kf
            out[f"{c['in']:.3f}"] = e
    novo = dict(enq)
    novo["clipes"] = out
    novo["base"] = base
    novo["momentos"] = [[A[m["k0"]]["t0"], A[m["k1"]]["t1"]] for m in mom]
    return novo


if __name__ == "__main__":
    a = sys.argv[1:]
    opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d  # noqa: E731
    L = ler_linha(a[0], opt("--sequencia"), intro=opt("--intro"))
    enq = json.load(open(a[1]))
    v1 = next(f for f in L["faixas"] if f["tipo"] == "video" and f["index"] == 0)["clipes"]
    A = [c for c in v1 if os.path.basename(c["arquivo"] or "") == enq["arquivo"]]
    novo = suavizar(A, enq, float(opt("--rampa", 0.8)))
    json.dump(novo, open(a[2], "w"), indent=0)
    nkf = sum(1 for q in novo["clipes"].values() if "kf" in q)
    print(f"base fixa em {sum(1 for q in novo['clipes'].values() if q['tipo'] == 'base')} clipes · "
          f"{len(novo['momentos'])} zooms suaves ({nkf} clipes com keyframes) → {a[2]}")
    for t0, t1 in novo["momentos"]:
        print(f"  {int(t0 // 60)}:{t0 % 60:04.1f}–{int(t1 // 60)}:{t1 % 60:04.1f}")
