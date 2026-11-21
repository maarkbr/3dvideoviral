"""Podcast rough cut from a word-level transcript: keep only the chosen phrases, drop
silences / fillers / tangents, snap every cut to the quietest point next to the word and
to the video frame grid (so audio and video never drift), then render with ffmpeg.

uso: cortar.py <edl.json> [--render] [--no-refine] [--debug A-B]

edl.json = {
  "source": "C:/.../podcast.mp4",          # original video
  "transcript": "work/transcript.json",    # from transcrever.py (absolute times)
  "fps": [60000, 1001],                    # source frame rate (optional: read from the file when missing)
  "max_gap": 0.20,                         # pauses longer than this inside a kept phrase are removed
  "keep_gap": 0.05,                        # max air kept at a cut (only where the level stays at the dip)
  "tail_gap": 0.15,                        # optional: air kept after the last word of a piece (phrase ends decay softly; default keep_gap)
  "lambda_db_per_s": 30,                   # how far (dB per second) a deeper dip may pull a cut off Whisper's estimate
  "speech_db_above_floor": 12,             # speech-activity threshold (above the 2nd-percentile floor) for trimming silence
  "keep_glued_fillers": true,              # a dropped short filler glued to its neighbour (no pause) is kept: cutting it clips the phrase
  "crossfade": 0.03,                       # constant-power audio crossfade centred on every cut
  "audio": "C:/.../voz_limpa.wav",         # optional: separate (cleaned) audio with the same timeline as the video
  "audio_offset": 0.02,                    # optional: seconds to skip in that audio to line it up with the video
  "out": "corte_bruto.mp4",
  "keep": [ {"a": 12, "b": 40, "drop": [17, 18], "note": "..."}, ... ],  # inclusive word indices
  "overrides": {"123": {"in": 812.95}, "140": {"out": 819.9}}          # optional: editor's final cut points
}
Flags: --render (write the video), --no-refine (skip the ASR check of cuts inside speech), --debug A-B.
Writes <out>, plus <out>.segments.json (source in/out of every piece and its position in the cut)
and <out>.words.json (the kept words re-timed to the cut, ready for captions).
"""
import json
import os
import subprocess
import sys

import numpy as np

EDL = sys.argv[1]
base = os.path.dirname(os.path.abspath(EDL))
cfg = json.load(open(EDL, encoding="utf-8"))
P = lambda p: p if os.path.isabs(p) else os.path.join(base, p)  # noqa: E731
words = json.load(open(P(cfg["transcript"]), encoding="utf-8"))["words"]
if "fps" in cfg:
    num, den = cfg["fps"]
else:  # taxa de quadros da fonte, lida do arquivo
    _r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", cfg["source"]],
                        capture_output=True, text=True).stdout.strip()
    num, den = (int(v) for v in _r.split("/")) if "/" in _r else (int(float(_r) * 1000), 1000)
FR = den / num
MAX_GAP = cfg.get("max_gap", 0.20)
KEEP_GAP = cfg.get("keep_gap", 0.06)
src = cfg["source"]
AUD = cfg.get("audio") or src            # áudio separado (ex.: limpo no Adobe Podcast), com a mesma linha do tempo do vídeo
AOFF = float(cfg.get("audio_offset", 0.0))  # segundos a pular no áudio separado para alinhar com o vídeo

# ---- 2. audio envelope around the cut range. Whisper word edges are off by up to ~0.25 s
# (word ends usually early), so every cut is re-found on the audio itself:
#   * cut = minimum of  level(dB) + LAMBDA * |t - whisper estimate|  inside a window that never
#     reaches past the middle of the neighbouring word (deepest dip wins unless it is far away);
#   * a little air is added only while the level stays at the dip (no padding into a neighbour);
#   * leading/trailing silence left inside a piece is trimmed with a speech-activity mask.
t_lo = min(words[k["a"]]["start"] for k in cfg["keep"]) - 1.5
t_hi = max(words[k["b"]]["end"] for k in cfg["keep"]) + 1.5
SR = 16000
pcm = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{max(0.0, t_lo + AOFF):.3f}", "-t", f"{t_hi - t_lo:.3f}", "-i", AUD,
                      "-vn", "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
x = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768.0
HOP, WIN = 0.005, 0.03
h, w = int(HOP * SR), int(WIN * SR)
n = (len(x) - w) // h
csum = np.concatenate([[0.0], np.cumsum(x.astype(np.float64) ** 2)])
env = 10 * np.log10((csum[np.arange(n) * h + w] - csum[np.arange(n) * h]) / w + 1e-12)  # dB, window centred at i*HOP + WIN/2
tm = lambda i: t_lo + i * HOP + WIN / 2  # noqa: E731
ix = lambda t: int(np.clip(round((t - t_lo - WIN / 2) / HOP), 0, n - 1))  # noqa: E731
floor = float(np.percentile(env, 2))                     # podcasts have little silence: use the 2nd percentile
THR = float(np.clip(floor + cfg.get("speech_db_above_floor", 12.0), -55.0, -38.0))
active = env > THR
LAMBDA = cfg.get("lambda_db_per_s", 30.0)                # penalty for moving a cut-in away from Whisper's start
LAMBDA_OUT_EARLY, LAMBDA_OUT_LATE = 40.0, 12.0           # Whisper word ends are usually early: let cut-outs move later
LAMBDA_IN_EARLY, LAMBDA_IN_LATE = 80.0, LAMBDA            # ...while starts are right or early: cut-ins rarely move earlier
DEBUG = [int(v) for v in sys.argv[sys.argv.index("--debug") + 1].split("-")] if "--debug" in sys.argv else None


# ---- 1. pieces: split every kept range at long pauses and at dropped words
#      (needs the audio envelope above, to tell a real pause from a filler glued to its neighbour)
def glued(wa, wb):
    # no dip to silence between two words: cutting between them clips the coarticulated tail/onset
    lo, hi = sorted((wa["end"], wb["start"]))
    seg_ = env[ix(lo - 0.02): ix(hi + 0.04) + 1]
    return len(seg_) > 0 and float(seg_.min()) > THR


def curta(i):
    return len("".join(c for c in words[i]["text"] if c.isalnum())) <= 4


pieces, kept_glued = [], 0
for k in cfg["keep"]:
    drop = set(k.get("drop", []))
    if cfg.get("keep_glued_fillers", True):
        # a dropped filler ("né", "tá", "ó") glued to a kept word cannot be removed without clipping that word:
        # keep it (the editor can still remove it by hand) instead of chopping the end of the phrase
        for i in sorted(drop):
            if i in drop and i - 1 not in drop and curta(i) and (i + 1 not in drop or (i + 2 not in drop and curta(i + 1))):
                run = [i] if i + 1 not in drop else [i, i + 1]
                left = run[0] - 1 >= k["a"] and glued(words[run[0] - 1], words[run[0]])
                right = run[-1] + 1 <= k["b"] and glued(words[run[-1]], words[run[-1] + 1])
                if left or right:
                    drop -= set(run)
                    kept_glued += len(run)
    run = []
    for i in range(k["a"], k["b"] + 1):
        if i in drop:
            if run:
                pieces.append(run)
            run = []
            continue
        if run and words[i]["start"] - words[run[-1]]["end"] > MAX_GAP:
            pieces.append(run)
            run = []
        run.append(i)
    if run:
        pieces.append(run)
if kept_glued:
    print(f"{kept_glued} dropped filler word(s) kept: glued to a neighbour, removing them would clip it")

def best_cut(est, lo, hi, early=None, late=None):
    i0, i1 = ix(lo), ix(hi)
    if i1 <= i0:
        return est
    idx = np.arange(i0, i1 + 1)
    d = tm(idx) - est
    cost = env[idx] + np.where(d < 0, -d * (early or LAMBDA), d * (late or LAMBDA))
    return tm(int(idx[np.argmin(cost)]))


def air(t, direction, limit):
    # add breathing room only through near-silence (never through a neighbouring word)
    i = ix(t)
    base, j = env[i], i
    cap = min(base + 3.0, THR + 6.0)
    while 0 < j + direction < n - 1 and abs(tm(j + direction) - t) <= limit and env[j + direction] <= cap:
        j += direction
    return tm(j)


def snap_frame(t):
    return round(t / FR) * FR


AIR = KEEP_GAP
AIR_OUT = cfg.get("tail_gap", KEEP_GAP)  # fim de frase: o decaimento da última sílaba fica abaixo do limiar de fala
segs = []
for p in pieces:
    w0, w1 = words[p[0]], words[p[-1]]
    prv = words[p[0] - 1] if p[0] > 0 else None
    nxt = words[p[-1] + 1] if p[-1] + 1 < len(words) else None
    # cut-in: Whisper starts are usually right or early -> may move later freely, earlier only a little
    lo = max((prv["start"] + prv["end"]) / 2 if prv else w0["start"] - 0.15, w0["start"] - 0.15)
    a = best_cut(w0["start"], lo, w0["start"] + 0.4 * (w0["end"] - w0["start"]), LAMBDA_IN_EARLY, LAMBDA_IN_LATE)
    # cut-out: Whisper ends are usually early -> may move later, up to just past the next word's start
    hi = min(nxt["start"] + 0.25 * (nxt["end"] - nxt["start"]) if nxt else w1["end"] + 0.35, w1["end"] + 0.35)
    hi = max(hi, w1["end"] + 0.03)
    b = best_cut(w1["end"], w1["start"] + 0.6 * (w1["end"] - w1["start"]), hi, LAMBDA_OUT_EARLY, LAMBDA_OUT_LATE)
    a, b = air(a, -1, AIR), air(b, +1, AIR_OUT)
    if DEBUG and DEBUG[0] <= p[0] <= DEBUG[1]:
        print(f"[debug] words {p[0]}-{p[-1]}: dip-in {a:.3f} dip-out {b:.3f} (floor {floor:.1f} dB, thr {THR:.1f} dB)")
    ia, ib = ix(a), ix(b)
    act = active[ia: ib + 1]
    on = np.where(act)[0]
    if not len(on):
        continue
    # trim leftover silence at the edges, and split at pauses the word clock missed
    runs, k0 = [], on[0]
    for k in range(on[0] + 1, on[-1] + 1):
        if act[k] and not act[k - 1]:
            gap0 = k0
        if not act[k] and act[k - 1]:
            k0 = k                                  # silence starts
        if act[k] and not act[k - 1] and (k - k0) * HOP > MAX_GAP + 0.05:
            runs.append((k0, k))                    # long silence [k0, k)
    bounds, start_k = [], on[0]
    for s0, s1 in runs:
        bounds.append((start_k, s0))
        start_k = s1
    bounds.append((start_k, on[-1]))
    for q0, q1 in bounds:
        qa = max(a, tm(ia + q0) - AIR)
        qb = min(b, tm(ia + q1) + AIR_OUT + 0.02)
        qa, qb = snap_frame(qa), snap_frame(qb)
        if qb - qa >= 2 * FR:
            segs.append({"in": round(qa, 4), "out": round(qb, 4), "words": [i for i in p if qa - 0.05 <= (words[i]["start"] + words[i]["end"]) / 2 <= qb + 0.05] or p[:1]})

# merge pieces that touch in the source (no real cut between them)
merged = []
for s in segs:
    if (merged and s["in"] - merged[-1]["out"] < cfg.get("merge_below", 0.10)
            and s["words"] and merged[-1]["words"] and s["words"][0] == merged[-1]["words"][-1] + 1):
        merged[-1]["out"] = s["out"]
        merged[-1]["words"] += s["words"]
    else:
        merged.append(dict(s))
segs = merged

# ---- 2b. verify every cut that lands inside speech by ear (ASR): try the nearby level dips, transcribe
# the piece edge alone and keep the deepest dip whose edge word is exactly the planned one (no syllable
# of a removed word leaking in, no planned word clipped).
REFINE = "--no-refine" not in sys.argv and cfg.get("refine", True)
if REFINE:
    import difflib
    import unicodedata
    from faster_whisper import WhisperModel

    asr = WhisperModel(cfg.get("model", "small"), device="cpu", compute_type="int8",
                       download_root=os.environ.get("CORTES_MODELOS", os.path.join(os.getcwd(), ".models")))

    def norm(t):
        t = unicodedata.normalize("NFKD", t.lower())
        t = "".join(c for c in t if c.isalnum() or c.isspace())
        return t.split()

    def heard(a, b):
        seg_ = x[max(0, int((a - t_lo) * SR)): int((b - t_lo) * SR)]
        pad = np.zeros(int(0.3 * SR), np.float32)
        out_, _ = asr.transcribe(np.concatenate([pad, seg_, pad]), language="pt", beam_size=2, temperature=0.0,
                                 condition_on_previous_text=False, initial_prompt=cfg.get("prompt"))
        return norm(" ".join(s_.text for s_ in out_))

    def same(u, v):
        r = difflib.SequenceMatcher(None, u, v).ratio()
        return r >= (0.75 if max(len(u), len(v)) >= 4 else 0.99)

    def edge_ok(rec, exp, side):
        # the edge word must be heard exactly; a short edge word ("eu", "e", "a") also needs its neighbour,
        # because Whisper happily "hears" a clipped short word or skips it
        if not rec or not exp:
            return False
        r, e = (rec, exp) if side == "in" else (rec[::-1], exp[::-1])
        if not same(r[0], e[0]):
            return False
        return len(e[0]) > 3 or len(e) < 2 or (len(r) > 1 and same(r[1], e[1]))

    def dips(lo, hi, k=5):
        i0, i1 = max(1, ix(lo)), min(n - 2, ix(hi))
        cand = [i for i in range(i0, i1 + 1) if env[i] <= env[i - 1] and env[i] <= env[i + 1]]
        picked = []
        for i in sorted(cand, key=lambda i: env[i]):
            if all(abs(i - j) * HOP >= 0.04 for j in picked):
                picked.append(i)
            if len(picked) == k:
                break
        return [tm(i) for i in picked]

    fixed = 0
    for k, s in enumerate(segs):
        exp = [w_ for i in s["words"] for w_ in norm(words[i]["text"])]
        for side in ("in", "out"):
            t = s[side]
            if env[ix(t)] < THR:                     # cut sits in silence: nothing can leak
                continue
            prev_out = segs[k - 1]["out"] if k else -1e9
            next_in = segs[k + 1]["in"] if k + 1 < len(segs) else 1e9
            if side == "in":
                cands = [c for c in dips(max(t - 0.15, prev_out), t + 0.15) if c < s["out"] - 0.3] + [t]
                test = lambda c: heard(c, min(c + 1.2, s["out"]))  # noqa: E731
            else:
                cands = [c for c in dips(t - 0.15, min(t + 0.15, next_in)) if c > s["in"] + 0.3] + [t]
                test = lambda c: heard(max(c - 1.2, s["in"]), c)  # noqa: E731
            best = None
            # stay close to the level-based cut unless the ear says otherwise
            for c in sorted(set(round(c_, 3) for c_ in cands), key=lambda c_: env[ix(c_)] + 30.0 * abs(c_ - t)):
                if edge_ok(test(c), exp, side):
                    best = c
                    break
            if best is not None:
                best = snap_frame(air(best, -1, AIR) if side == "in" else air(best, +1, AIR_OUT))
                best = max(best, prev_out) if side == "in" else min(best, next_in)
                if abs(best - t) > 0.5 * FR:
                    fixed += 1
                    print(f"[refine] piece {k} {side}: {t:.3f} -> {best:.3f}", flush=True)
                s[side] = round(best, 4)
            else:
                print(f"[refine] piece {k} {side}: no candidate matched '{exp[0] if side == 'in' else exp[-1]}' (kept {t:.3f})", flush=True)
    print(f"refine: {fixed} cut(s) moved after listening to the edges")

# ---- 2b'. a split between consecutive words with no silence between the two cut points removes a slice of
# continuous speech (clipped syllable): join the two pieces back
joined = []
for s_ in segs:
    pv = joined[-1] if joined else None
    if (pv and s_["words"] and pv["words"] and s_["words"][0] == pv["words"][-1] + 1 and s_["in"] > pv["out"]
            and float(env[ix(pv["out"]): ix(s_["in"]) + 1].min()) > THR):
        pv["out"] = s_["out"]
        pv["words"] += s_["words"]
    else:
        joined.append(s_)
if len(joined) < len(segs):
    print(f"{len(segs) - len(joined)} split(s) inside continuous speech joined back")
segs = joined

# ---- 2c. editor overrides (final say): "overrides": {"<word index>": {"in": t} | {"out": t}} moves the cut
# of the piece that starts (in) / ends (out) with that word to an absolute source time.
for wi, ov in (cfg.get("overrides") or {}).items():
    wi = int(wi)
    for s in segs:
        if "in" in ov and s["words"] and s["words"][0] == wi:
            s["in"] = round(snap_frame(ov["in"]), 4)
        if "out" in ov and s["words"] and s["words"][-1] == wi:
            s["out"] = round(snap_frame(ov["out"]), 4)

# pedaço invertido ou curto demais (um override caiu numa palavra com tempo esticado pelo Whisper):
# descarta em vez de quebrar o render, e avisa qual foi
ok = []
for k, s in enumerate(segs):
    if s["out"] - s["in"] < 0.05:
        txt = " ".join(words[i]["text"] for i in s["words"])[:60]
        print(f"[aviso] pedaço {k} descartado: fim ({s['out']:.3f}) antes ou colado no início ({s['in']:.3f}) — \"{txt}\". "
              f"Confira o override desse trecho no edl.json.", flush=True)
        continue
    ok.append(s)
segs = ok

# ---- 3. timeline + re-timed words
t = 0.0
cut_words = []
for s in segs:
    s["at"] = round(t, 4)
    for i in s["words"]:
        w = words[i]
        cut_words.append({"i": i, "text": w["text"], "start": round(max(0, w["start"] - s["in"]) + t, 3),
                          "end": round(min(s["out"], w["end"]) - s["in"] + t, 3), "prob": w.get("prob")})
    t += s["out"] - s["in"]
total = t
out = P(cfg.get("out", "corte_bruto.mp4"))
json.dump({"source": src, **({"audio": AUD, "audio_offset": AOFF} if AUD != src else {}), "duration": round(total, 3), "segments": segs}, open(out + ".segments.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(cut_words, open(out + ".words.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
sys.stdout.reconfigure(encoding="utf-8")
src_span = sum(words[k["b"]]["end"] - words[k["a"]]["start"] for k in cfg["keep"])
print(f"{len(segs)} pieces, cut = {total:.2f}s (kept ranges span {src_span:.1f}s of source)")
for s in segs:
    txt = " ".join(words[i]["text"] for i in s["words"])
    print(f"  {s['at']:7.2f}  [{s['in']:8.3f} → {s['out']:8.3f}] {txt[:110]}")

# ---- 4. render (render_corte.py: frame-exact video, centred constant-power audio crossfades)
if "--render" in sys.argv:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import render_corte  # noqa: E402

    render_corte.main(["render_corte.py", out + ".segments.json", out, "--crossfade", str(cfg.get("crossfade", 0.03)),
                     "--fps", f"{num}/{den}"])
