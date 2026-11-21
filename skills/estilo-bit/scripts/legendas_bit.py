"""Gera as legendas do estilo Bit (1–3 palavras, minúsculas, uma *palavra-chave* em destaque) e injeta no index.html.

uso: legendas_bit.py <transcricao_corte.json> <index.html> [--chaves chaves.txt] [--corrigir corrigir.json] [--fim 56.2]

- transcricao: a do corte final (transcrever.py do editor-ia), com "words" ou "segments[].words".
- chaves.txt: uma palavra por linha (sem acento ou com, tanto faz). Sem ele, destaca números e palavras longas.
- corrigir.json: [{"t": 25.46, "texto": "ferramentas"}, {"t": 52.74, "texto": ""}] troca (ou apaga, com "") a palavra
  que começa nesse tempo (±0,03 s). Use para erros do Whisper.
- --fim: até quando a última legenda fica na tela (padrão: fim da última palavra + 1,5 s).
"""
import json
import re
import sys
import unicodedata


def tira_acento(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def limpa(t):
    return re.sub(r"[,.!?;:]", "", t).lower()


def main(argv):
    if len(argv) < 3:
        print(__doc__); return 1
    tr = json.load(open(argv[1], encoding="utf-8"))
    W = tr.get("words") or [w for s in tr.get("segments", []) for w in s.get("words", [])]
    words = [[(w.get("text") or w.get("word") or "").strip(), float(w["start"]), float(w["end"])] for w in W]
    if "--corrigir" in argv:
        for c in json.load(open(argv[argv.index("--corrigir") + 1], encoding="utf-8")):
            for w in words:
                if abs(w[1] - c["t"]) <= 0.03:
                    w[0] = c["texto"]
        words = [w for w in words if w[0]]
    chaves = set()
    if "--chaves" in argv:
        chaves = {tira_acento(l.strip().lower()) for l in open(argv[argv.index("--chaves") + 1], encoding="utf-8") if l.strip()}
    fim_total = float(argv[argv.index("--fim") + 1]) if "--fim" in argv else words[-1][2] + 1.5

    def eh_chave(c):
        base = tira_acento(c)
        return base in chaves if chaves else (c.isdigit() or len(c) >= 9)

    grupos, g = [], []
    for i, (t, a, b) in enumerate(words):
        g.append((t, a, b))
        prox = words[i + 1][1] if i + 1 < len(words) else None
        letras = sum(len(limpa(x[0])) + 1 for x in g)
        if len(g) == 3 or letras > 15 or re.search(r"[,.!?]$", t) or (prox is not None and prox - b > 0.25) or prox is None:
            grupos.append(g); g = []

    out = []
    for k, g in enumerate(grupos):
        ini = g[0][1]
        fim = min(grupos[k + 1][0][1], g[-1][2] + 0.6) if k + 1 < len(grupos) else fim_total
        marcou, txt = False, []
        for t, _, _ in g:
            c = limpa(t)
            if not marcou and eh_chave(c):
                txt.append(f"*{c}*"); marcou = True
            else:
                txt.append(c)
        out.append([" ".join(txt), round(ini, 2), round(fim, 2)])

    p = argv[2]; s = open(p, encoding="utf-8").read()
    if "/*LEG*/" not in s:
        print("o index.html precisa ter K.legendas(/*LEG*/[]/*FIM*/)"); return 1
    s = re.sub(r"/\*LEG\*/.*?/\*FIM\*/", lambda m: "/*LEG*/" + json.dumps(out, ensure_ascii=False) + "/*FIM*/", s, flags=re.S)
    open(p, "w", encoding="utf-8").write(s)
    print(f"{len(out)} legendas no {p}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
