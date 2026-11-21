"""QA of a podcast rough cut: transcribe every piece on its own and compare it with the planned words.

uso: qa_corte.py <saida.mp4.segments.json> <transcricao.json> [--prompt "..."] [--model small] [--only 3,7,12]

For each piece prints OK, or what is wrong at its edges: EXTRA (a syllable/word of a removed passage
leaked in) or MISSING (a planned word got clipped). Whisper also mishears words in the middle, so only
the first/last two words are judged; the full heard text is printed for flagged pieces.
"""
import difflib
import json
import os
import subprocess
import sys
import unicodedata

import numpy as np
from faster_whisper import WhisperModel

sys.stdout.reconfigure(encoding="utf-8")
seg_path, tr_path = sys.argv[1], sys.argv[2]
arg = lambda k, d: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d  # noqa: E731
segs = json.load(open(seg_path, encoding="utf-8"))
words = json.load(open(tr_path, encoding="utf-8"))["words"]
only = {int(v) for v in arg("--only", "").split(",") if v.strip()}
model = WhisperModel(arg("--model", "small"), device="cpu", compute_type="int8", download_root=os.environ.get("CORTES_MODELOS", os.path.join(os.getcwd(), ".models")))
SR = 16000
S = segs["segments"]
t_lo, t_hi = S[0]["in"] - 0.5, S[-1]["out"] + 0.5
pcm = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t_lo:.3f}", "-t", f"{t_hi - t_lo:.3f}", "-i", segs["source"],
                      "-vn", "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
x = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768.0


def norm(t):
    t = unicodedata.normalize("NFKD", t.lower())
    return "".join(c for c in t if c.isalnum() or c.isspace()).split()


def sim(a, b):
    return difflib.SequenceMatcher(None, a, b).ratio()


bad = 0
for k, s in enumerate(S):
    if only and k not in only:
        continue
    exp = [w for i in s["words"] for w in norm(words[i]["text"])]
    seg = x[int((s["in"] - t_lo) * SR): int((s["out"] - t_lo) * SR)]
    pad = np.zeros(int(0.3 * SR), np.float32)
    out, _ = model.transcribe(np.concatenate([pad, seg, pad]), language="pt", beam_size=5, temperature=0.0,
                              condition_on_previous_text=False, initial_prompt=arg("--prompt", None))
    rec = norm(" ".join(o.text for o in out))
    notes = []
    if not rec:
        notes.append("NOTHING HEARD")
    else:
        # align heard vs planned words, then look only at the edges
        sm = difflib.SequenceMatcher(None, rec, exp, autojunk=False)
        ops = sm.get_opcodes()
        first, last = ops[0], ops[-1]
        if first[0] in ("insert", "delete", "replace") and first[1] == 0 and first[3] == 0:
            heard_extra, plan_missing = rec[first[1]:first[2]], exp[first[3]:first[4]]
            if heard_extra and not (plan_missing and sim(" ".join(heard_extra), " ".join(plan_missing)) > 0.6):
                notes.append(f"start EXTRA {heard_extra}" + (f" instead of {plan_missing}" if plan_missing else ""))
            elif plan_missing and not heard_extra:
                notes.append(f"start MISSING {plan_missing}")
        if last[0] in ("insert", "delete", "replace") and last[2] == len(rec) and last[4] == len(exp):
            heard_extra, plan_missing = rec[last[1]:last[2]], exp[last[3]:last[4]]
            if heard_extra and not (plan_missing and sim(" ".join(heard_extra), " ".join(plan_missing)) > 0.6):
                notes.append(f"end EXTRA {heard_extra}" + (f" instead of {plan_missing}" if plan_missing else ""))
            elif plan_missing and not heard_extra:
                notes.append(f"end MISSING {plan_missing}")
    flag = "OK " if not notes else "CHK"
    bad += bool(notes)
    print(f"{flag} {k:2d} [{s['in']:.3f}-{s['out']:.3f}] planned: {' '.join(exp)}", flush=True)
    if notes:
        print(f"       heard:   {' '.join(rec)}\n       -> {'; '.join(notes)}", flush=True)
print(f"\n{bad} piece(s) to check of {len(S) if not only else len(only)}")
