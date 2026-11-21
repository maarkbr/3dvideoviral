"""Mapa de leitura de um podcast transcrito, para escolher os melhores cortes.

uso: mapa_do_podcast.py <transcricao.json> <saida.md> [--bloco 45] [--max 75]

Agrupa a transcrição em blocos de ~45 s (quebra em pausas longas, nunca passa de --max s) e anota pistas
de "momento forte" por bloco: marcadores de história, polêmica/emoção, números e dinheiro, perguntas,
risadas e ritmo da fala. A nota ★ é só uma PISTA para priorizar a leitura — quem decide o corte é o
editor (o agente), lendo o texto e aplicando o critério de references/selecao-de-cortes.md.
Também grava <saida>.json com os mesmos blocos.
"""
import json
import re
import sys
import unicodedata

arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d  # noqa: E731

MARCAS = {
    "historia": [r"\beu tava\b", r"\bteve uma vez\b", r"\buma vez\b", r"\baconteceu\b", r"\bsabe o que\b", r"\beu juro\b", r"\bai eu\b",
                 r"\bda[ií] eu\b", r"\bfoi quando\b", r"\bnaquele dia\b", r"\bimagina\b", r"\bcontar\b", r"\bhist[oó]ria\b", r"\bum cara\b"],
    "emocao": [r"\babsurd", r"\bloucur", r"\bmaluc", r"\bchoc", r"\bmedo\b", r"\bchorei\b", r"\bchorar\b", r"\bincr[ií]vel\b", r"\bsurreal\b",
               r"\bbizarr", r"\bnunca\b", r"\bjamais\b", r"\bodeio\b", r"\bamo\b", r"\bpior\b", r"\bmelhor\b", r"\berrad", r"\bmentir",
               r"\bverdade\b", r"\bpol[eê]mic", r"\bproibid", r"\bsegredo\b", r"\bningu[eé]m\b", r"\bperig"],
    "numeros": [r"\bmilh[aã]o", r"\bmilh[oõ]es\b", r"\bbilh", r"\bmil\b", r"\breais\b", r"\bd[oó]lar", r"\bdinheiro\b", r"\bsal[aá]rio\b",
                r"\bpor cento\b", r"%", r"\b\d{2,}\b"],
    "riso": [r"\brisos?\b", r"\bkkk", r"\bha(ha)+\b", r"\brs(rs)+\b"],
    "conselho": [r"\bvoc[eê] tem que\b", r"\bo segredo\b", r"\bo erro\b", r"\bo problema\b", r"\bo que eu aprendi\b", r"\bdica\b", r"\bregra\b",
                 r"\bsempre\b", r"\bpasso\b", r"\bjeito\b"],
}
PESOS = {"historia": 1.2, "emocao": 1.0, "numeros": 0.6, "riso": 1.5, "conselho": 0.8}


def fmt(t):
    t = max(0, t)
    h, r = divmod(int(t), 3600)
    m, s = divmod(r, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m:02d}:{s:02d}"


def norm(s):
    return unicodedata.normalize("NFC", s.lower())


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    src, out = sys.argv[1], sys.argv[2]
    alvo, maxd = float(arg("--bloco", 45)), float(arg("--max", 75))
    d = json.load(open(src, encoding="utf-8"))
    segs = [s for s in d["segments"] if s["text"].strip()]
    blocos, cur = [], []
    for i, s in enumerate(segs):
        if cur:
            dur = s["end"] - cur[0]["start"]
            pausa = s["start"] - cur[-1]["end"]
            if dur > maxd or (cur[-1]["end"] - cur[0]["start"] >= alvo and (pausa > 0.6 or re.search(r"[.?!]$", cur[-1]["text"]))) or pausa > 1.6:
                blocos.append(cur)
                cur = []
        cur.append(s)
    if cur:
        blocos.append(cur)

    rows = []
    for k, b in enumerate(blocos):
        a, z = b[0]["start"], b[-1]["end"]
        texto = " ".join(s["text"] for s in b)
        t = norm(texto)
        nw = len(texto.split())
        hits = {cat: sum(len(re.findall(p, t)) for p in pats) for cat, pats in MARCAS.items()}
        perg = texto.count("?")
        ritmo = nw / max(1.0, z - a)
        score = sum(PESOS[c] * min(4, n) for c, n in hits.items()) + 0.5 * min(4, perg) + max(0, ritmo - 2.6) * 2
        rows.append({"n": k + 1, "inicio": round(a, 2), "fim": round(z, 2), "dur": round(z - a, 1), "palavras_por_s": round(ritmo, 2),
                     "pistas": {c: n for c, n in hits.items() if n}, "perguntas": perg, "score": score, "texto": texto})
    mx = max((r["score"] for r in rows), default=1) or 1
    for r in rows:
        r["nota"] = round(10 * r["score"] / mx, 1)

    total = segs[-1]["end"] if segs else 0
    top = sorted(rows, key=lambda r: -r["nota"])[:15]
    L = [f"# Mapa do podcast — {fmt(total)} · {len(d['words'])} palavras · {len(rows)} blocos", "",
         "A nota ★ é uma pista automática (marcadores de história, emoção, números, riso, ritmo). Leia o texto: o critério de",
         "escolha está em references/selecao-de-cortes.md. Um bom corte costuma juntar 2 a 4 blocos seguidos.", "",
         "## Blocos mais quentes (pista)", ""]
    for r in top:
        p = ", ".join(f"{c} {n}" for c, n in r["pistas"].items())
        L.append(f"- bloco {r['n']} · [{fmt(r['inicio'])}–{fmt(r['fim'])}] · ★{r['nota']} · {p} · “{r['texto'][:110]}…”")
    L += ["", "## Transcrição em blocos", ""]
    for r in rows:
        L.append(f"### {r['n']} · [{fmt(r['inicio'])}–{fmt(r['fim'])}] · {r['dur']:.0f} s · ★{r['nota']}")
        L.append(r["texto"])
        L.append("")
    open(out, "w", encoding="utf-8").write("\n".join(L))
    json.dump(rows, open(out + ".json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{len(rows)} blocos em {fmt(total)} -> {out}")


if __name__ == "__main__":
    main()
