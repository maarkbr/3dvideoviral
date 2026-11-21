"""Compara o que o Lucas fez no Premiere com os cortes da skill — para aprender com ele.

uso: python3 premiere_aprender.py PASTA_TRABALHO PROJETO_ou_AUTOSAVE.prproj saida.md [--sequencia "nome"] [--json saida.json]

PASTA_TRABALHO tem o edl.json (o que a skill manteve do bruto) e a transcricao.json (palavras com tempo no bruto).
Do Premiere sai o que ELE manteve do bruto (clipes da faixa V1 cujo arquivo é o bruto). A diferença:
  - TIROU (a skill manteve, ele cortou): com as palavras de dentro → "silêncio/respiro", "muleta", "frase", "retake"…
  - VOLTOU (a skill cortou, ele trouxe de volta): o que a skill não devia ter tirado.
Só conta até onde ele já editou (o último ponto da linha do tempo em que algo difere), para não chamar de "aprovado"
o resto que ele nem viu. Leia o relatório e passe as regras para references/preferencias.md e, se der, para o
cortes.py / retakes.py (com teste no vídeo seguinte).
"""
import json, os, re, sys, unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from premiere_ler import ler  # noqa: E402

a = sys.argv[1:]
opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d  # noqa: E731
wd, proj, saida = a[0], a[1], a[2]
E = json.load(open(os.path.join(wd, "edl.json")))
TR = json.load(open(os.path.join(wd, "transcricao.json")))
W = TR["words"]
F = E["fps"]
bruto = os.path.basename(E["video"])
L = ler(proj, opt("--sequencia"))
MULETAS = {"ta", "ne", "entao", "ai", "tipo", "assim", "bom", "pronto", "daí", "dai", "e", "o", "a", "eh", "ah", "hum", "uhum"}


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return re.sub(r"[^a-z0-9%]", "", "".join(ch for ch in s if unicodedata.category(ch) != "Mn"))


def junta(rs):
    rs = sorted(rs)
    out = []
    for s, e in rs:
        if out and s <= out[-1][1] + 1e-3:
            out[-1][1] = max(out[-1][1], e)
        else:
            out.append([s, e])
    return out


def menos(A, B):
    """A − B (listas de intervalos)."""
    out = []
    for s, e in A:
        cur = s
        for bs, be in B:
            if be <= cur or bs >= e:
                continue
            if bs > cur:
                out.append([cur, bs])
            cur = max(cur, be)
        if cur < e:
            out.append([cur, e])
    return [r for r in out if r[1] - r[0] >= 1 / F - 1e-6]


skill = junta([[c["src0"] / F, c["src1"] / F] for c in E["clips"]])
v1 = next(f for f in L["faixas"] if f["tipo"] == "video" and f["index"] == 0)
dele_clipes = [c for c in v1["clipes"] if c["arquivo"] and os.path.basename(c["arquivo"]) == bruto]
dele = junta([[c["in"], c["out"]] for c in dele_clipes])
tirou, voltou = menos(skill, dele), menos(dele, skill)

# até onde ele editou: o último ponto do bruto em que algo difere
limite = max([e for _, e in tirou + voltou], default=0)


def palavras(s, e):
    return [w for w in W if w["end"] > s + 0.02 and w["start"] < e - 0.02]


def contexto(s, e):
    antes = [w["text"] for w in W if w["end"] <= s + 0.02][-4:]
    depois = [w["text"] for w in W if w["start"] >= e - 0.02][:4]
    return " ".join(antes), " ".join(depois)


def classe(ws, s, e):
    if not ws:
        return "silêncio/respiro"
    ns = [norm(w["text"]) for w in ws]
    if all(n in MULETAS for n in ns):
        return "muleta"
    txt = " ".join(ns)
    ctx_dep = " ".join(norm(w["text"]) for w in W if w["start"] >= e - 0.02 and w["start"] < e + 8)
    if len(ns) >= 2 and txt[: max(6, len(txt) // 2)] in ctx_dep:
        return "retake (repetiu depois)"
    return "frase/trecho"


itens = []
for tipo, rs in (("TIROU", tirou), ("VOLTOU", voltou)):
    for s, e in rs:
        ws = palavras(s, e)
        ant, dep = contexto(s, e)
        itens.append({"tipo": tipo, "s": round(s, 2), "e": round(e, 2), "dur": round(e - s, 2),
                      "classe": classe(ws, s, e) if tipo == "TIROU" else ("silêncio" if not ws else "fala"),
                      "texto": " ".join(w["text"] for w in ws), "antes": ant, "depois": dep})
itens.sort(key=lambda x: x["s"])

# pausas que ficaram na versão dele: silêncio entre palavras dentro de um clipe dele
pausas = []
for c in dele_clipes:
    ws = palavras(c["in"], c["out"])
    for w1, w2 in zip(ws, ws[1:]):
        g = w2["start"] - w1["end"]
        if g > 0.25:
            pausas.append(round(g, 2))

tot = lambda k, c=None: sum(i["dur"] for i in itens if i["tipo"] == k and (c is None or i["classe"] == c))  # noqa: E731
classes = sorted({i["classe"] for i in itens if i["tipo"] == "TIROU"})
mm = lambda t: f"{int(t // 60)}:{t % 60:04.1f}"  # noqa: E731
md = [f"# O que o Lucas mudou no Premiere — {L['sequencia']}",
      f"\nComparado até o ponto {mm(limite)} do bruto (onde ele parou de mexer). "
      f"Clipes dele na V1: {len(dele_clipes)} (a skill entregou {len(E['clips'])}).",
      f"\n- Tirou além da skill: **{tot('TIROU'):.1f} s** em {sum(i['tipo'] == 'TIROU' for i in itens)} cortes"]
md += [f"  - {c}: {tot('TIROU', c):.1f} s ({sum(i['tipo'] == 'TIROU' and i['classe'] == c for i in itens)}×)" for c in classes]
md += [f"- Trouxe de volta o que a skill cortou: **{tot('VOLTOU'):.1f} s** em {sum(i['tipo'] == 'VOLTOU' for i in itens)} trechos"]
if pausas:
    pausas.sort()
    md += [f"- Pausas entre palavras que ele deixou (> 0,25 s): {len(pausas)}, mediana {pausas[len(pausas) // 2]:.2f} s, maior {pausas[-1]:.2f} s"]
md += ["\n## Um por um (tempo no bruto)"]
for i in itens:
    md.append(f"- **{i['tipo']}** {mm(i['s'])}–{mm(i['e'])} ({i['dur']:.2f} s) · {i['classe']} · "
              f"…{i['antes']} [{i['texto'] or '—'}] {i['depois']}…")
open(saida, "w").write("\n".join(md) + "\n")
if opt("--json"):
    json.dump({"limite": limite, "itens": itens, "pausas": pausas}, open(opt("--json"), "w"), ensure_ascii=False, indent=1)
print("\n".join(md[:12]))
