"""Detector de retakes (tentativas repetidas) e tropeços, em cima da transcrição FALA POR FALA (transcrever_falas.py).

Regra do Lucas: fica sempre a ÚLTIMA tentativa completa. Para cada fala A, olha as próximas falas B (até 4 à frente,
até 25 s depois) e marca A (ou o fim de A) como retake quando:
  1. B recomeça A do início: as primeiras palavras batem (≥ 3, ou A inteira é o começo de B — "Então aqui você vai…"
     → "Então aqui você vai ver");
  2. B recomeça do MEIO de A: o começo de B aparece dentro de A (≥ 3 palavras, ou o resto inteiro de A ≥ 2) →
     sai de A só a parte que foi refeita ("…e a IA faz" → "IA faz o 3D");
  3. A é quase igual ao começo de B (palavras ≥ 70% ou o maior bloco em comum cobre ≥ 70% de A, mín. 3 palavras) —
     pega a mesma frase dita de outro jeito ou mal transcrita ("O supreso de um computador…" → "Você só precisa de um…");
  4. A é curta (≤ 5 palavras), B vem em até 4 s e as letras de A são quase o começo de B ("I-I-I-A, faz…" → "Ia faz o 3D").
Dentro da fala: palavra repetida colada ("com com", "Ia Ia") e bloco de 2+ palavras repetido logo depois.
Devolve sugestões [{i0, i1, motivo, fica}] em índices de palavra — o cortes.py usa direto (retakes.json).

MULETAS (muletas(), aprendido da decupagem do Lucas no vídeo 3D, 07/11/2026 — premiere_aprender.py):
  - no COMEÇO da frase, depois de pausa ≥ 0,35 s: "Então", "E", "Aí", "Daí", "Bom" (e a sequência: "Bom, então…")
    — ele tira quando recomeça a frase com elas; no meio da fala ele deixa (antes: tirou 0,3–0,8 s, manteve 0–0,2 s);
  - no FIM da frase, "tá?" / "né?" seguido de pausa ≥ 0,35 s — "é para preencher silêncio, tenho que remover".
  Desligue com "muletas": false no job.json; volte uma pelo índice em "manter_retakes".
"""
import re, unicodedata
from difflib import SequenceMatcher

MULETAS = {"e", "entao", "ai", "dai", "e,", "o", "a", "bom", "pronto", "agora", "ta", "ne", "so", "tipo", "assim", "aqui"}


def norm(t):
    t = unicodedata.normalize("NFD", t.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9%]+", "", t)


def _toks(W, i0, i1):
    """[(índice, palavra normalizada)] sem vazios, com hífen de gagueira separado ("I-I-A" → i, i, a)."""
    out = []
    for i in range(i0, i1 + 1):
        for p in re.split(r"[-–]", W[i]["text"]):
            p = norm(p)
            if p:
                out.append((i, p))
    return out


def _sem_muleta(t):
    k = 0
    while k < len(t) - 1 and t[k][1] in MULETAS:
        k += 1
    return t[k:]


def _colapsa(t):
    """tira gagueira: palavras iguais coladas viram uma."""
    out = []
    for x in t:
        if not out or out[-1][1] != x[1]:
            out.append(x)
    return out


def _igual(a, b):
    if a == b:
        return True
    if len(a) >= 4 and len(b) >= 4:
        return SequenceMatcher(None, a, b).ratio() >= 0.8
    return len(a) >= 2 and len(b) >= 1 and (a.startswith(b) or b.startswith(a)) and abs(len(a) - len(b)) == 1  # "as"/"a"


def detectar(W, falas):
    sug, saiu = [], set()
    for a, FA in enumerate(falas):
        A = _colapsa(_sem_muleta(_toks(W, FA["i0"], FA["i1"])))
        if not A:
            continue
        for b in range(a + 1, min(a + 5, len(falas))):
            FB = falas[b]
            if FB["start"] - FA["end"] > 25:
                break
            B = _colapsa(_sem_muleta(_toks(W, FB["i0"], FB["i1"])))
            if not B:
                continue
            na, nb = [x[1] for x in A], [x[1] for x in B]
            fica = " ".join(w["text"] for w in W[FB["i0"]:FB["i1"] + 1])[:70]
            # 1. recomeça do início
            p = 0
            while p < min(len(na), len(nb)) and _igual(na[p], nb[p]):
                p += 1
            A0 = [x[1] for x in _colapsa(_toks(W, FA["i0"], FA["i1"]))]   # sem tirar muleta: "Então..." → "Então fica…"
            B0 = [x[1] for x in _colapsa(_toks(W, FB["i0"], FB["i1"]))]
            inteira = len(A0) <= 3 and len(B0) > len(A0) and all(_igual(u, v) for u, v in zip(A0, B0))
            # recomeço de verdade: repete pelo menos metade de A (ou A acaba logo depois do trecho repetido);
            # só abrir com as mesmas 3 palavras ("Então tem várias coisas…" / "Tem várias coisas aqui…") não basta
            if (p >= 3 and (p >= 0.5 * len(na) or len(na) - p <= 3)) or (p >= 1 and p == len(na)) or inteira:
                sug.append({"i0": FA["i0"], "i1": FA["i1"], "motivo": f"retake (refeito {b - a} fala(s) depois)", "fica": fica})
                saiu.add(a)
                # falas no meio que são pedaço da tentativa abandonada (o texto delas está dentro de B) também saem
                for m in range(a + 1, b):
                    X = [x[1] for x in _colapsa(_sem_muleta(_toks(W, falas[m]["i0"], falas[m]["i1"])))]
                    if len(X) >= 2:
                        sm = SequenceMatcher(None, X, nb)
                        if max((g.size for g in sm.get_matching_blocks()), default=0) >= 0.7 * len(X):
                            sug.append({"i0": falas[m]["i0"], "i1": falas[m]["i1"], "motivo": "pedaço da tentativa abandonada", "fica": fica})
                            saiu.add(m)
                break
            # 2. recomeça do meio de A
            achou = False
            for q in range(1, len(na)):
                L = 0
                while q + L < len(na) and L < len(nb) and _igual(na[q + L], nb[L]):
                    L += 1
                if (L >= 3 and len(na) - (q + L) <= 3) or (L >= 2 and q + L == len(na)):
                    ini = FA["i0"] if q <= 1 else A[q][0]          # sobrou 1 palavra solta: sai a fala toda
                    sug.append({"i0": ini, "i1": FA["i1"], "motivo": "fim da fala refeito na seguinte", "fica": fica})
                    if q <= 1:
                        saiu.add(a)
                    achou = True
                    break
            if achou:
                break
            # 3. mesma frase de outro jeito / mal transcrita
            if len(na) >= 3:
                sm = SequenceMatcher(None, na, nb[:len(na) + 3])
                bloco = max((m.size for m in sm.get_matching_blocks()), default=0)
                if sm.ratio() >= 0.7 or (bloco >= 3 and bloco >= 0.7 * len(na)):
                    sug.append({"i0": FA["i0"], "i1": FA["i1"], "motivo": "mesma frase repetida (dita de novo)", "fica": fica})
                    saiu.add(a)
                    break
            # 4. começo curto gaguejado
            ca, cb = "".join(na), "".join(nb)
            if len(na) <= 5 and len(ca) >= 4 and FB["start"] - FA["end"] < 4 and \
                    SequenceMatcher(None, ca, cb[:len(ca)]).ratio() >= 0.6:
                sug.append({"i0": FA["i0"], "i1": FA["i1"], "motivo": "começo gaguejado/abandonado", "fica": fica})
                saiu.add(a)
                break
    # dentro da fala: gagueira de 1 palavra e bloco repetido
    for FA in falas:
        if FA["k"] in saiu:
            continue
        T = _toks(W, FA["i0"], FA["i1"])
        for k in range(1, len(T)):
            if T[k][1] == T[k - 1][1] and T[k][0] != T[k - 1][0] and len(T[k][1]) > 1:
                sug.append({"i0": T[k - 1][0], "i1": T[k - 1][0], "motivo": f"palavra dobrada '{W[T[k][0]]['text']}'", "fica": ""})
        n = [x[1] for x in T]
        k = 0
        while k < len(n):
            feito = False
            for L in (5, 4, 3, 2):
                if k + 2 * L <= len(n) and n[k:k + L] == n[k + L:k + 2 * L]:
                    sug.append({"i0": T[k][0], "i1": T[k + L - 1][0], "motivo": f"bloco repetido '{' '.join(n[k:k + L])}'", "fica": ""})
                    k += L
                    feito = True
                    break
            if not feito:
                k += 1
    sug += muletas(W)
    sug.sort(key=lambda s: s["i0"])
    return sug


INICIO = {"entao", "e", "ai", "dai", "bom"}
FIM = {"ta", "ne"}


def muletas(W, pausa=0.35):
    """Muletas que o Lucas corta: abrindo frase depois de pausa, e "tá?/né?" fechando frase antes de pausa."""
    sug = []
    n = len(W)
    i = 0
    while i < n:
        w = W[i]
        a = norm(w["text"])
        antes = w["start"] - W[i - 1]["end"] if i else 9.0
        if a in INICIO and antes >= pausa and i + 1 < n and W[i + 1]["start"] - w["end"] < 0.6:
            j = i
            while j + 1 < n and norm(W[j + 1]["text"]) in INICIO and W[j + 1]["start"] - W[j]["end"] < 0.6:
                j += 1   # "Bom, então…" / "E aí…"
            if j + 1 < n:  # sobra fala depois
                sug.append({"i0": i, "i1": j, "motivo": f"muleta no começo '{' '.join(W[k]['text'].strip() for k in range(i, j + 1))}'", "fica": ""})
                i = j + 1
                continue
        depois = W[i + 1]["start"] - w["end"] if i + 1 < n else 9.0
        if a in FIM and depois >= pausa and i and w["start"] - W[i - 1]["end"] < 0.5:
            sug.append({"i0": i, "i1": i, "motivo": f"muleta no fim '{w['text'].strip()}'", "fica": ""})
        i += 1
    return sug
