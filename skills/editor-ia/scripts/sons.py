"""Som de um corte vertical: trilha de efeitos (SFX) a partir de uma lista de eventos + trilha musical discreta.

uso: sons.py <sfx_events.json> <pasta_saida> --duration 82.55 [--bpm 92] [--clima curioso|tenso|inspirador|leve]
             [--musica minha_trilha.mp3] [--drops 28.2:0.9,72.3:1.0] [--music-lufs -30] [--voz corte.mp4]
     (o montar_vertical.py chama as funções direto)

sfx_events.json = { "library": {"whoosh": "assets/sfx/whoosh-short.mp3", ...},
                    "events": [ {"t": 5.8, "s": "whoosh", "db": -12, "pan": 0.2, "from": 0.0, "len": 0.6}, ...,
                                {"t": 61.42, "synth": "urna", "db": -9} ] }
  db = nível de PICO (dBFS) daquele golpe na trilha; from/len = recorte do arquivo; synth: urna (bipes da urna) ou
  qualquer nome de efeito (sintetizado). Efeito sem arquivo na biblioteca → versão sintetizada (nunca falha).
Grava <saida>/sfx.wav e <saida>/music.wav (48 kHz, estéreo, 24 bits). A trilha tem "drops" (silêncio nos glitches),
entra suave e sai em fade; o nível fica baixo (−30 LUFS) porque a voz "carva" a trilha depois (carve do HyperFrames).
--voz: também grava music_duck.wav (trilha já abaixada sob a voz) para quando o carve não estiver disponível.
"""
import json
import os
import subprocess
import sys
import zlib

import numpy as np
from scipy.signal import butter, lfilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audio_core as A  # noqa: E402

SR = A.SR
arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d  # noqa: E731

# nome do efeito → chave da biblioteca embutida do HyperFrames (media-use/audio/assets/sfx/<chave>.mp3)
CHAVES = {"whoosh": "whoosh-short", "whooshBig": "whoosh-cinematic", "pop": "pop", "impact": "impact-bass-2", "impact2": "impact-bass-1",
          "glitch": "glitch-1", "typing": "typing", "notify": "notification", "ping": "ping", "sparkle": "sparkle", "riser": "riser",
          "click": "click-soft", "error": "error", "chime": "chime"}


def load(path):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(pcm, dtype=np.float32).reshape(-1, 2).astype(np.float64)


# ---------------------------------------------------------------- efeitos sintetizados (reserva)
def _sweep_lp(x, f0, f1, f2=None, block=512):
    """noise through a lowpass whose cutoff glides f0 → f1 (→ f2 over the last 40%), block-wise."""
    out = np.zeros_like(x)
    n = len(x)
    zi = np.zeros(2)
    for i in range(0, n, block):
        p = i / max(1, n - 1)
        if f2 is None:
            f = f0 + (f1 - f0) * p
        elif p < 0.6:
            f = f0 + (f1 - f0) * (p / 0.6)
        else:
            f = f1 + (f2 - f1) * ((p - 0.6) / 0.4)
        b, a = butter(2, float(np.clip(f, 60, SR * 0.45)) / (SR / 2))
        out[i:i + block], zi = lfilter(b, a, x[i:i + block], zi=zi)
    return out


def _env(n, att, rel_curve=2.0):
    t = np.linspace(0, 1, n)
    e = np.where(t < att, (t / att) ** 2, ((1 - t) / (1 - att)) ** rel_curve)
    return e


def synth(nome):
    """mono signal (float) for a named effect — a stand-in for the bundled library."""
    rng = np.random.default_rng(zlib.crc32(nome.encode()))  # stable seed (str hash is randomized per run)
    if nome in ("whoosh", "whooshBig"):
        d = 0.6 if nome == "whoosh" else 2.6
        n = int(d * SR)
        x = _sweep_lp(rng.standard_normal(n), 500, 5200 if nome == "whoosh" else 3000, 900)
        return A.peak_norm(x * _env(n, 0.62 if nome == "whoosh" else 0.75))
    if nome == "pop":
        t = A.tt(0.09)
        f = 380 + 600 * (1 - np.exp(-t / 0.03))
        return A.fade(A.peak_norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.025)), 0.0015, 0.01)
    if nome in ("impact", "impact2"):
        d = 1.3
        t = A.tt(d)
        f0, f1 = (72, 36) if nome == "impact" else (95, 42)
        f = f1 + (f0 - f1) * np.exp(-t / 0.12)
        body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.32 if nome == "impact" else 0.22))
        crack = A.lp(rng.standard_normal(len(t)), 1200) * np.exp(-t / 0.03) * 0.5
        return A.peak_norm(body + crack)
    if nome == "glitch":
        segs = []
        for k in range(14):
            d = int(SR * (0.02 + 0.04 * rng.random()))
            t = np.arange(d) / SR
            kind = k % 3
            s = np.sign(np.sin(2 * np.pi * (200 + 1800 * rng.random()) * t)) if kind == 0 else rng.standard_normal(d) if kind == 1 else np.zeros(d)
            segs.append(np.round(s * 6) / 6 * (0.4 + 0.6 * rng.random()))
        return A.peak_norm(A.hp(np.concatenate(segs), 150))
    if nome == "typing":
        n = int(1.4 * SR)
        x = np.zeros(n)
        t = 0.0
        while t < 1.35:
            c = A.hp(rng.standard_normal(int(0.012 * SR)), 1800) * np.exp(-np.arange(int(0.012 * SR)) / (0.003 * SR))
            i = int(t * SR)
            x[i:i + len(c)] += c[: n - i] * (0.6 + 0.4 * rng.random())
            t += 0.05 + 0.09 * rng.random()
        return A.peak_norm(x)
    if nome == "notify":
        t = A.tt(0.6)
        a = np.sin(2 * np.pi * 880 * t) * np.exp(-t / 0.18) * (t < 0.3)
        b = np.sin(2 * np.pi * 1320 * t) * np.exp(-np.maximum(0, t - 0.12) / 0.25) * (t >= 0.12)
        return A.fade(A.peak_norm(a + b), 0.002, 0.05)
    if nome == "ping":
        t = A.tt(0.9)
        return A.fade(A.peak_norm((np.sin(2 * np.pi * 1760 * t) + 0.3 * np.sin(2 * np.pi * 3520 * t)) * np.exp(-t / 0.22)), 0.001, 0.05)
    if nome == "sparkle":
        n = int(1.2 * SR)
        x = np.zeros(n)
        for k in range(22):
            t0 = (k / 22) ** 1.6 * 1.0
            f = 2200 + 4000 * rng.random()
            tt = A.tt(0.12)
            s = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.04) * (1 - k / 26)
            i = int(t0 * SR)
            x[i:i + len(s)] += s[: n - i]
        return A.peak_norm(x)
    if nome == "riser":
        d = 10.0
        n = int(d * SR)
        t = np.arange(n) / SR
        f = 180 * (2 ** (t / d * 3.4))
        tone = np.sin(2 * np.pi * np.cumsum(f) / SR)
        noise = _sweep_lp(rng.standard_normal(n), 300, 7000)
        return A.peak_norm((0.5 * tone + noise) * (t / d) ** 2.2)
    if nome == "click":
        c = A.hp(rng.standard_normal(int(0.01 * SR)), 2500) * np.exp(-np.arange(int(0.01 * SR)) / (0.0025 * SR))
        return A.peak_norm(np.concatenate([c, np.zeros(int(0.05 * SR))]))
    if nome == "error":
        t = A.tt(0.22)
        sq = lambda f: np.sign(np.sin(2 * np.pi * f * t)) * 0.5 + np.sin(2 * np.pi * f * t) * 0.5  # noqa: E731
        a, b = sq(420) * np.exp(-t / 0.12), sq(300) * np.exp(-t / 0.16)
        return A.peak_norm(A.lp(np.concatenate([a, np.zeros(int(0.04 * SR)), b]), 3500))
    if nome == "chime":
        t = A.tt(1.6)
        x = np.zeros(len(t))
        for k, f in enumerate((1046.5, 1318.5, 1568.0)):
            on = t >= k * 0.09
            x += np.sin(2 * np.pi * f * t) * np.exp(-np.maximum(0, t - k * 0.09) / 0.5) * on
        return A.fade(A.peak_norm(x), 0.002, 0.08)
    if nome == "urna":
        return urna()[:, 0]
    raise KeyError(nome)


def urna(dur_beep=0.075, gap=0.05, n=5, long=0.5, f=2150.0):
    # o "fim" da urna eletrônica: bipes curtos e um longo (tom quase quadrado, suavizado)
    out = []
    t = A.tt(dur_beep)
    tone = lambda tt_: np.sign(np.sin(2 * np.pi * f * tt_)) * 0.35 + np.sin(2 * np.pi * f * tt_) * 0.65  # noqa: E731
    for _ in range(n):
        out.append(A.fade(tone(t), 0.002, 0.006))
        out.append(np.zeros(int(gap * SR)))
    tl_ = A.tt(long)
    out.append(A.fade(tone(tl_), 0.002, 0.03))
    x = A.lp(np.concatenate(out), 6000)
    return np.stack([x, x], axis=1)


# ---------------------------------------------------------------- biblioteca do HyperFrames
def biblioteca_hyperframes():
    """pasta dos SFX embutidos no plugin do HyperFrames (media-use), ou None."""
    try:
        here = os.path.dirname(os.path.abspath(__file__))
        skills = subprocess.run(["node", os.path.join(here, "hf.mjs"), "--where"], capture_output=True, text=True, timeout=60).stdout.strip()
        d = os.path.join(skills, "media-use", "audio", "assets", "sfx")
        return d if os.path.isdir(d) else None
    except Exception:  # noqa: BLE001
        return None


def resolver_biblioteca(nomes, destino):
    """copia os SFX usados para <destino>/ (assets/sfx do projeto) e devolve {nome: caminho}. Os ausentes ficam de fora (→ sintetizados)."""
    src = biblioteca_hyperframes()
    lib = {}
    os.makedirs(destino, exist_ok=True)
    for n in sorted(set(nomes)):
        k = CHAVES.get(n)
        if not (src and k):
            continue
        a = os.path.join(src, k + ".mp3")
        if os.path.exists(a):
            b = os.path.join(destino, k + ".mp3")
            if not os.path.exists(b):
                import shutil
                shutil.copyfile(a, b)
            lib[n] = b
    return lib, src


def place(buf, sig, t, gain, pan=0.0):
    a = int(round(t * SR))
    if a >= len(buf) or a + len(sig) <= 0:
        return
    if sig.ndim == 1:
        sig = np.stack([sig, sig], axis=1)
    if a < 0:
        sig, a = sig[-a:], 0
    b = min(len(buf), a + len(sig))
    seg = sig[: b - a] * gain
    lg, rg = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2), np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
    buf[a:b, 0] += seg[:, 0] * lg
    buf[a:b, 1] += seg[:, 1] * rg


def build_sfx(spec, dur, base="."):
    n = int(round(dur * SR))
    buf = np.zeros((n, 2))
    lib = {}
    for k, v in spec.get("library", {}).items():
        p = v if os.path.isabs(v) else os.path.join(base, v)
        if os.path.exists(p):
            lib[k] = load(p)
    cache = {}
    falt = set()
    for e in spec["events"]:
        nome = e.get("synth") or e["s"]
        if e.get("synth") == "urna":
            sig = urna()
        elif nome in lib and not e.get("synth"):
            src = lib[nome]
            a = int(e.get("from", 0) * SR)
            b = a + int(e["len"] * SR) if "len" in e else len(src)
            sig = src[a:b].copy()
        else:
            if nome not in cache:
                cache[nome] = synth(nome)
                falt.add(nome)
            s = cache[nome]
            a = int(e.get("from", 0) * SR) if nome == "riser" else 0
            b = a + int(e["len"] * SR) if "len" in e else len(s)
            sig = s[a:b].copy()
        if len(sig) == 0:
            continue
        fo = min(len(sig), int(0.03 * SR))
        if fo:
            sig[-fo:] *= np.linspace(1, 0, fo)[:, None] if sig.ndim == 2 else np.linspace(1, 0, fo)
        pk = np.max(np.abs(sig)) or 1.0
        place(buf, sig, e["t"], A.db(e.get("db", -14)) / pk, e.get("pan", 0.0))
    if falt - {"urna"}:
        print("sintetizados (sem arquivo na biblioteca): " + ", ".join(sorted(falt - {"urna"})))
    return buf


# ---------------------------------------------------------------- trilha
def clap():
    x = np.zeros(int(0.25 * SR))
    for k, d in enumerate((0.0, 0.011, 0.023)):
        b = A.hp(A.lp(A.noise(0.03), 3200), 900) * np.exp(-np.arange(int(0.03 * SR)) / (0.008 * SR))
        i = int(d * SR)
        x[i:i + len(b)] += b * (1 - 0.2 * k)
    tail = A.hp(A.lp(A.noise(0.2), 2500), 800) * np.exp(-np.arange(int(0.2 * SR)) / (0.05 * SR)) * 0.5
    x[int(0.023 * SR):int(0.023 * SR) + len(tail)] += tail[: len(x) - int(0.023 * SR)]
    return A.peak_norm(x)


CLIMAS = {
    # bpm, progressão [(baixo, acorde)], escala do pluck, kick, hats por compasso, palmas, nível do pluck
    "curioso": dict(bpm=92, prog=[(110.0, [220.0, 261.63, 329.63]), (87.31, [174.61, 220.0, 261.63, 329.63]),
                                  (65.41, [261.63, 329.63, 392.0]), (98.0, [196.0, 246.94, 293.66])],
                    escala=[440.0, 523.25, 587.33, 659.25, 783.99, 880.0], kick=(0, 2.5), hats=8, palmas=False, pluck=-15),
    "tenso": dict(bpm=84, prog=[(55.0, [110.0, 164.81, 220.0]), (58.27, [116.54, 174.61, 233.08]),
                                (55.0, [110.0, 164.81, 220.0]), (49.0, [98.0, 146.83, 196.0])],
                  escala=[440.0, 466.16, 523.25, 587.33, 659.25, 698.46], kick=(0, 2), hats=16, palmas=False, pluck=-18),
    "inspirador": dict(bpm=100, prog=[(65.41, [261.63, 329.63, 392.0]), (98.0, [196.0, 246.94, 293.66, 392.0]),
                                      (110.0, [220.0, 261.63, 329.63]), (87.31, [174.61, 220.0, 261.63])],
                       escala=[523.25, 587.33, 659.25, 783.99, 880.0, 1046.5], kick=(0, 1, 2, 3), hats=8, palmas=True, pluck=-16),
    "leve": dict(bpm=108, prog=[(65.41, [261.63, 329.63, 392.0]), (110.0, [220.0, 261.63, 329.63]),
                                (87.31, [174.61, 220.0, 261.63]), (98.0, [196.0, 246.94, 293.66])],
                 escala=[523.25, 587.33, 659.25, 783.99, 880.0, 1046.5], kick=(0, 1.5, 2), hats=8, palmas=True, pluck=-14),
}


def _envelope(n, drops):
    env = np.ones(n)
    for a, d in drops:  # glitch slams: corte seco, volta rápida
        i0, i1 = int(a * SR), int((a + d) * SR)
        env[max(0, i0):max(0, i1)] = 0.0
        r = int(0.15 * SR)
        if i1 < n:
            env[i1:i1 + r] = np.linspace(0, 1, min(r, n - i1))
    tail = min(n, int(1.2 * SR))
    env[-tail:] *= np.linspace(1, 0, tail) ** 1.5
    head = int(0.06 * SR)
    env[:head] *= np.linspace(0, 1, head)
    return env


def build_music(dur, bpm=None, drops=(), clima="curioso", lufs=-30.0):
    C = CLIMAS.get(clima, CLIMAS["curioso"])
    bpm = bpm or C["bpm"]
    n = int(round(dur * SR))
    beat = 60.0 / bpm
    drums, bassb, padb, arpb = (np.zeros((n, 2)) for _ in range(4))
    K, H, HO, CL = A.kick(), A.hat(), A.hat(True), clap()
    prog, penta = C["prog"], C["escala"]
    bar = 4 * beat
    t = 0.0
    i = 0
    while t < dur:
        root, chord = prog[int(t / (2 * bar)) % 4]
        bar_idx = int(t / bar)
        for k_t in C["kick"]:
            A.place(drums, K, t + k_t * beat, 0.9)
        hn = C["hats"]
        for h in range(hn):
            A.place(drums, H, t + h * 4 * beat / hn, (0.16 if h % 2 else 0.24) * (0.6 if hn == 16 else 1), pan=0.2)
        A.place(drums, HO, t + 3.5 * beat, 0.14, pan=-0.2)
        if C["palmas"]:
            for c_t in (1, 3):
                A.place(drums, CL, t + c_t * beat, 0.35)
        A.place(bassb, A.bass(root, beat * 1.6), t, 1.0)
        A.place(bassb, A.bass(root * 2, beat * 0.45), t + 3.5 * beat, 0.55)
        if bar_idx % 2 == 0:
            A.place(padb, A.pad(chord, 2 * bar, 0.6, 1.2, att=0.4, rel=0.6), t, 0.8)
        for s in range(8):
            if (s * 3 + bar_idx) % 5 == 2:
                continue
            note = penta[(s * 2 + bar_idx * 3) % len(penta)]
            A.place(arpb, A.pluck(note, 0.14), t + s * beat / 2, 0.42 if s % 2 == 0 else 0.28, pan=0.4 * np.sin(i * 0.7))
            i += 1
        t += bar
    mix = (A.peak_norm(drums) * A.db(-4) + A.peak_norm(bassb) * A.db(-6) + A.peak_norm(padb) * A.db(-11) + A.peak_norm(arpb) * A.db(C["pluck"]))
    mix = A.add_reverb(mix, 0.1)
    mix = mix * _envelope(n, drops)[:, None]
    return mix * A.db(lufs - A.lufs(mix))


def musica_arquivo(path, dur, drops=(), lufs=-30.0):
    """trilha do usuário: repete (com cruzamento de 1 s) até cobrir o corte, aplica drops e fades, ajusta o nível."""
    x = load(path)
    n = int(round(dur * SR))
    xf = int(1.0 * SR)
    if len(x) <= 2 * xf:
        out = np.tile(x, (int(np.ceil(n / max(1, len(x)))) + 1, 1))
    else:
        out = x.copy()
        ramp = np.linspace(0, 1, xf)[:, None]
        while len(out) < n:
            join = out[-xf:] * (1 - ramp) + x[:xf] * ramp
            out = np.concatenate([out[:-xf], join, x[xf:]])
    out = out[:n] * _envelope(n, drops)[:, None]
    return out * A.db(lufs - A.lufs(out))


def duck(music, voice_path, reducao_db=-10.0):
    """abaixa a trilha onde há voz (reserva para quando o carve do HyperFrames não roda)."""
    v = load(voice_path).mean(axis=1)
    hop = int(0.02 * SR)
    nfr = len(v) // hop
    rms = np.sqrt(np.mean(v[: nfr * hop].reshape(nfr, hop) ** 2, axis=1) + 1e-12)
    dbv = 20 * np.log10(rms)
    floor = np.percentile(dbv, 10)
    act = (dbv > floor + 12).astype(float)
    g = np.ones(nfr)
    cur = 1.0
    tgt_low = A.db(reducao_db)
    a_att, a_rel = np.exp(-1 / (0.04 / 0.02)), np.exp(-1 / (0.35 / 0.02))
    for k in range(nfr):
        tgt = tgt_low if act[k] else 1.0
        coef = a_att if tgt < cur else a_rel
        cur = tgt + (cur - tgt) * coef
        g[k] = cur
    gs = np.repeat(g, hop)
    gs = np.concatenate([gs, np.full(max(0, len(music) - len(gs)), gs[-1] if len(gs) else 1.0)])[: len(music)]
    return music * gs[:, None]


def pk(x):
    return 20 * np.log10(np.max(np.abs(x)) + 1e-12)


if __name__ == "__main__":
    spec = json.load(open(sys.argv[1], encoding="utf-8"))
    out = sys.argv[2]
    dur = float(arg("--duration", 82.55))
    drops = [tuple(float(v) for v in p.split(":")) for p in (arg("--drops", "") or "").split(",") if p]
    os.makedirs(out, exist_ok=True)
    sfx = build_sfx(spec, dur, os.path.dirname(os.path.abspath(sys.argv[1])))
    A.write24(os.path.join(out, "sfx.wav"), sfx)
    lufs = float(arg("--music-lufs", -30.0))
    if arg("--musica"):
        mus = musica_arquivo(arg("--musica"), dur, drops, lufs)
    else:
        mus = build_music(dur, float(arg("--bpm")) if arg("--bpm") else None, drops, arg("--clima", "curioso"), lufs)
    A.write24(os.path.join(out, "music.wav"), mus)
    if arg("--voz"):
        A.write24(os.path.join(out, "music_duck.wav"), duck(mus, arg("--voz")))
    sys.stdout.reconfigure(encoding="utf-8")
    print(f"sfx.wav: {len(spec['events'])} eventos, pico {pk(sfx):.1f} dBFS | music.wav: {A.lufs(mus):.1f} LUFS, pico {pk(mus):.1f} dBFS")
