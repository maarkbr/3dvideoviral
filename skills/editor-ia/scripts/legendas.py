"""Word-timed caption groups for a vertical cut (Lucas Editor style: 1-3 words, one keyword highlighted).

uso: legendas.py <transcricao_do_corte.json> <legendas_spec.json> <legendas.json>
     (o montar_vertical.py chama gerar() direto, com o spec que vem de plano.json → "legenda")

words.json: a transcript of the FINAL cut ({"words": [{text, start, end}]}, from transcrever.py on corte_bruto.mp4).
captions_spec.json = {
  "fix":   [{"i": 74, "j": 76, "text": "Ele falou assim:"}, ...],   # replace words i..j (inclusive); "" deletes
  "censor": {"porra": "p*rra", "puta": "p*ta", "caralho": "c*ralho"},
  "keywords": ["CHINA", "DEMOCRACIA", ...],                        # highlighted (accent colour), one per group
  "hide": [[0, 3.0], [28.2, 29.1]],                               # no captions in these windows (hook, inserts)
  "max_words": 3, "max_chars": 15, "lead": 0.04, "hold": 0.45, "duration": 82.5,  # optional end clamp
  "caixa": "alta"                                                   # or "normal" (keep the transcript's case)
}
Output: [{"t0", "t1", "w": [{"x": "EU", "t": 3.04, "k": 0|1}]}]  (upper-case, punctuation stripped except ? and !)
"""
import json
import re
import sys
import unicodedata


def norm(s):
    s = unicodedata.normalize("NFKD", s.upper())
    return "".join(c for c in s if c.isalnum() or c == "*")


def corrigir(words, fix):
    """apply the index corrections (replace words i..j, inclusive; "" deletes), spreading the new words over the old span."""
    toks = [{"text": w["text"], "start": w["start"], "end": w["end"]} for w in words]
    for f in sorted(fix, key=lambda f: -f["i"]):
        i, j = f["i"], f["j"]
        t0, t1 = toks[i]["start"], toks[j]["end"]
        new = f["text"].split()
        if not new:
            del toks[i:j + 1]
            continue
        total = sum(len(w) + 1 for w in new)
        rep, acc = [], t0
        for w in new:
            d = (t1 - t0) * (len(w) + 1) / total
            rep.append({"text": w, "start": round(acc, 3), "end": round(acc + d, 3)})
            acc += d
        toks[i:j + 1] = rep
    return toks


def gerar(words, spec):
    """words: [{text, start, end}] of the final cut; spec: see the module doc. Returns the caption groups."""
    toks = corrigir(words, spec.get("fix", []))

    censor = {k.lower(): v for k, v in spec.get("censor", {}).items()}
    keys = {norm(k) for k in spec.get("keywords", [])}
    hide = spec.get("hide", [])
    MAXW, MAXC = spec.get("max_words", 3), spec.get("max_chars", 15)
    LEAD, HOLD = spec.get("lead", 0.04), spec.get("hold", 0.45)
    caixa = spec.get("caixa", "alta")  # "alta" = tudo maiúsculo; "normal" = como foi transcrito

    def show(w):
        core = re.sub(r"[^\w*?!\-]", "", w, flags=re.UNICODE)
        base = core.rstrip("?!").lower()
        if base in censor:
            core = censor[base] + core[len(base):]
        return core.upper() if caixa == "alta" else core

    def hidden(t):
        return any(a <= t < b for a, b in hide)

    # 2. grouping: break on punctuation, long pauses, word/char limits, hide windows
    groups, cur = [], []
    for k, w in enumerate(toks):
        x = show(w["text"])
        if not x or hidden(w["start"]):
            if cur:
                groups.append(cur)
                cur = []
            continue
        if cur:
            chars = sum(len(c["x"]) for c in cur) + len(cur) + len(x)
            gap = w["start"] - cur[-1]["end"]
            if len(cur) >= MAXW or chars > MAXC or gap > 0.35 or cur[-1]["brk"]:
                groups.append(cur)
                cur = []
        cur.append({"x": x, "t": w["start"], "end": w["end"], "brk": bool(re.search(r"[.,:;?!]$", w["text"]))})
    if cur:
        groups.append(cur)

    # 3. timing + one keyword per group (the longest matching word)
    out = []
    for gi, g in enumerate(groups):
        t0 = max(0.0, g[0]["t"] - LEAD)
        nxt = groups[gi + 1][0]["t"] - LEAD if gi + 1 < len(groups) else g[-1]["end"] + HOLD
        t1 = min(nxt, g[-1]["end"] + HOLD)
        for a, b in hide:  # never run into a hide window
            if t0 < a < t1:
                t1 = a
        t1 = max(t1, t0 + 0.22)
        cand = [c for c in g if norm(c["x"]) in keys]
        kw = max(cand, key=lambda c: len(c["x"])) if cand else None
        if "duration" in spec:
            t1 = min(t1, spec["duration"])
        out.append({"t0": round(t0, 3), "t1": round(t1, 3),
                    "w": [{"x": c["x"], "t": round(c["t"], 3), "k": int(c is kw)} for c in g]})
    for a, b in zip(out, out[1:]):  # a group hands over at the next group's start
        if a["t1"] > b["t0"]:
            a["t1"] = b["t0"]
    return out


def main(words_path, spec_path, out_path):
    words = json.load(open(words_path, encoding="utf-8"))["words"]
    spec = json.load(open(spec_path, encoding="utf-8"))
    out = gerar(words, spec)
    json.dump(out, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    sys.stdout.reconfigure(encoding="utf-8")
    print(f"{len(out)} caption groups -> {out_path}")
    for c in out:
        print(f"  {c['t0']:6.2f}-{c['t1']:6.2f}  " + " ".join(("[" + w["x"] + "]") if w["k"] else w["x"] for w in c["w"]))


if __name__ == "__main__":
    main(*sys.argv[1:4])
