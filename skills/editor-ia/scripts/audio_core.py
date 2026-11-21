"""Núcleo de áudio da skill editor-ia: síntese simples, loudness BS.1770, limitador de pico real, WAV 24-bit.

Tudo em 48 kHz estéreo float64. Sem efeitos colaterais na importação (não cria pastas, não lê arquivos).
"""
import wave

import numpy as np
import scipy.signal as ss
from scipy.ndimage import minimum_filter1d, uniform_filter1d

SR = 48000
_rng = np.random.default_rng(2026)


def db(x):
    return 10 ** (x / 20)


def tt(dur):
    return np.arange(int(round(dur * SR))) / SR


def noise(dur):
    return _rng.standard_normal(int(round(dur * SR)))


def hp(x, f, order=2):
    return ss.sosfilt(ss.butter(order, f, btype="high", fs=SR, output="sos"), x, axis=0)


def lp(x, f, order=2):
    return ss.sosfilt(ss.butter(order, f, btype="low", fs=SR, output="sos"), x, axis=0)


def peak_norm(x, peak=1.0):
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 0 else x


def fade(x, fin=0.002, fout=0.004):
    x = x.copy()
    a, b = int(fin * SR), int(fout * SR)
    sh = (-1,) + (1,) * (x.ndim - 1)
    if a:
        x[:a] *= np.linspace(0, 1, a).reshape(sh)
    if b:
        x[-b:] *= np.linspace(1, 0, b).reshape(sh)
    return x


def place(buf, sig, start, gain=1.0, pan=0.0):
    """Soma um sinal mono (pan de potência constante, centro = ganho 1) ou estéreo em buf a partir de start (s)."""
    i = int(round(start * SR))
    if sig.ndim == 1:
        lg = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
        rg = np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
        sig = np.stack([sig * lg, sig * rg], 1)
    if i < 0:
        sig, i = sig[-i:], 0
    j = min(len(buf), i + len(sig))
    if j > i:
        buf[i:j] += sig[: j - i] * gain


# ---------------------------------------------------------------- instrumentos
def kick():
    t = tt(0.5)
    f = 44 + 100 * np.exp(-t / 0.032)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.17)
    click = hp(noise(0.5), 3000) * np.exp(-t / 0.003) * 0.25
    return fade(np.tanh(1.6 * (body + click)) / np.tanh(1.6))


def hat(open_=False):
    d = 0.25 if open_ else 0.06
    t = tt(d)
    return fade(peak_norm(hp(noise(d), 7500, 3) * np.exp(-t / (0.09 if open_ else 0.018))))


def bass(f, dur):
    t = tt(dur)
    s = np.tanh(2.2 * np.sin(2 * np.pi * f * t) + 0.6 * np.sin(4 * np.pi * f * t))
    env = np.minimum(1, t / 0.004) * np.exp(-t / 0.16)
    return fade(lp(s * env, 420))


def pad(freqs, dur, b0, b1, att=0.01, rel=0.25):
    t = tt(dur)
    bright = np.linspace(b0, b1, len(t))
    out = np.zeros(len(t))
    for f in freqs:
        for det in (-0.12, 0.0, 0.11):
            fd = f * 2 ** (det / 12)
            ph = _rng.uniform(0, 2 * np.pi)
            for k in range(1, 18):
                if fd * k > 9000:
                    break
                out += np.sin(2 * np.pi * fd * k * t + ph * k) / k * np.exp(-(k - 1) / bright)
    env = np.minimum(1, t / att) * np.minimum(1, (dur - t) / rel).clip(0, 1)
    return out * env


def pluck(f, dur=0.16):
    t = tt(dur)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return fade(s * np.exp(-t / 0.045))


def _reverb_ir(dur=1.3, decay=0.32, seed=5):
    r = np.random.default_rng(seed)
    t = tt(dur)
    ir = np.stack([r.standard_normal(len(t)), r.standard_normal(len(t))], 1)
    ir *= np.exp(-t / decay)[:, None]
    ir = np.stack([lp(ir[:, 0], 6000), lp(ir[:, 1], 6000)], 1)
    ir[: int(0.012 * SR)] = 0
    return ir / np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True))


_IR = None


def add_reverb(buf, wet):
    global _IR
    if _IR is None:
        _IR = _reverb_ir()
    out = np.zeros_like(buf)
    mono = buf.mean(1)
    for c in range(2):
        out[:, c] = ss.fftconvolve(mono, _IR[:, c])[: len(buf)]
    return buf + out * wet


# ---------------------------------------------------------------- loudness / pico / limitador
def _k_weight(x):
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1, -1.99004745483398, 0.99007225036621]
    return ss.lfilter(b2, a2, ss.lfilter(b1, a1, x, axis=0), axis=0)


def lufs(x):
    """Loudness integrada BS.1770-4 (gate absoluto -70 e relativo -10). x: (n, 2) a 48 kHz."""
    y = _k_weight(x)
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    z = np.array([np.mean(y[i: i + blk] ** 2, axis=0).sum() for i in range(0, len(y) - blk + 1, hop)])
    lv = -0.691 + 10 * np.log10(z + 1e-12)
    z = z[lv > -70]
    rel = -0.691 + 10 * np.log10(z.mean()) - 10
    z = z[(-0.691 + 10 * np.log10(z)) > rel]
    return -0.691 + 10 * np.log10(z.mean())


def true_peak_db(x):
    up = ss.resample_poly(x, 4, 1, axis=0)
    return 20 * np.log10(np.max(np.abs(up)) + 1e-12)


def limiter(x, ceiling_db=-1.3, look_ms=4.0):
    """Limitador de pico real com look-ahead (detecção com oversampling 4x). Devolve (sinal, redução máxima 0..1)."""
    up = np.abs(ss.resample_poly(x, 4, 1, axis=0)).max(1)
    pk = up.reshape(-1, 4).max(1)[: len(x)]
    thr = db(ceiling_db)
    g = np.minimum(1.0, thr / np.maximum(pk, 1e-9))
    w = int(look_ms / 1000 * SR) | 1
    g = minimum_filter1d(g, size=2 * w + 1)
    g = uniform_filter1d(g, size=w)
    return x * g[:, None], float(1 - g.min())


def write24(path, x):
    x = np.clip(x, -1.0, 1.0 - 1 / 8388608)
    i = np.round(x * 8388607).astype("<i4")
    raw = i.reshape(-1).view(np.uint8).reshape(-1, 4)[:, :3].tobytes()
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(3)
        w.setframerate(SR)
        w.writeframes(raw)
