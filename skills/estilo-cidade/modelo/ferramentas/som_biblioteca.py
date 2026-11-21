# BIBLIOTECA DE SOM dos vídeos "Nesta cidade": instrumentos e efeitos feitos em código
# (sem banco de sons, sem IA). Igual em todo episódio. A trilha de cada vídeo fica em trilha.py.
import math, os, random, struct, wave
from array import array

SR = 44100
TAU = 2 * math.pi
rnd = random.Random(1958)  # sorteio com semente: o som sai igual toda vez


def nota(m):  # número MIDI -> frequência (69 = lá 440 Hz)
    return 440.0 * 2 ** ((m - 69) / 12)


def novo(segundos):  # trilha vazia
    return array("d", bytes(8 * (int(segundos * SR) + SR)))


def somar(buf, t0, amostras, ganho=1.0):  # cola um som no segundo t0
    i0, n = int(t0 * SR), len(buf)
    for k, v in enumerate(amostras):
        j = i0 + k
        if 0 <= j < n:
            buf[j] += v * ganho


# ---------- instrumentos ----------
def caixinha(f, dur=1.6, vol=1.0, wow=0.0):
    out = []
    for k in range(int(dur * SR)):
        t = k / SR
        ff = f * (1 + wow * math.sin(TAU * 0.7 * t))
        env = min(1.0, t / 0.003) * math.exp(-t * 2.4)
        v = math.sin(TAU * ff * t) + 0.28 * math.sin(TAU * 2 * ff * t) + 0.1 * math.sin(TAU * 3 * ff * t)
        v += 0.25 * math.sin(TAU * 4.2 * ff * t) * math.exp(-t * 14)
        out.append(v * env * vol)
    return out


def pizz(f, dur=0.8, vol=1.0):
    out = []
    for k in range(int(dur * SR)):
        t = k / SR
        env = min(1.0, t / 0.005) * math.exp(-t * 5.5)
        out.append((math.sin(TAU * f * t) + 0.5 * math.sin(TAU * 2 * f * t) + 0.22 * math.sin(TAU * 3 * f * t)) * env * vol)
    return out


def pad(fs, dur, vol=1.0, ataque=0.8):
    out = []
    for k in range(int(dur * SR)):
        t = k / SR
        env = min(1.0, t / ataque) * min(1.0, (dur - t) / 0.8)
        v = 0.0
        for i, f in enumerate(fs):
            v += math.sin(TAU * f * 1.003 * t + i) + math.sin(TAU * f * 0.997 * t)
        out.append(v / (2 * len(fs)) * env * vol)
    return out


def batida(vol=1.0):  # coração: tum-tum
    out = []
    for k in range(int(0.55 * SR)):
        t = k / SR
        v = 0.0
        for t0, a in ((0.0, 1.0), (0.22, 0.7)):
            u = t - t0
            if u >= 0:
                f = 52 + 30 * math.exp(-u * 30)
                v += a * math.sin(TAU * f * u) * math.exp(-u * 14)
        out.append(v * vol)
    return out


# ---------- ruído e filtros ----------
def ruido(dur):
    return [rnd.uniform(-1, 1) for _ in range(int(dur * SR))]


def passa_baixa(x, fc):
    a = 1 - math.exp(-TAU * fc / SR)
    y, out = 0.0, []
    for v in x:
        y += a * (v - y)
        out.append(y)
    return out


def passa_alta(x, fc):
    lp = passa_baixa(x, fc)
    return [a - b for a, b in zip(x, lp)]


def envelope(x, ataque, queda):
    n = len(x)
    return [v * min(1.0, (k / SR) / ataque if ataque else 1) * math.exp(-(k / SR) * queda) for k, v in enumerate(x)]


# ---------- efeitos ----------
def whoosh(dur=0.7, reverso=False, vol=0.3):
    x = ruido(dur)
    out, y = [], 0.0
    for k, v in enumerate(x):
        p = k / len(x)
        fc = 300 + 3500 * (p if reverso else math.sin(math.pi * p))
        a = 1 - math.exp(-TAU * fc / SR)
        y += a * (v - y)
        env = p ** 2 if reverso else math.sin(math.pi * p) ** 2
        out.append(y * env * vol * 2.2)
    return out


def fita(vol=0.3):  # esparadrapo
    x = passa_alta(ruido(0.28), 1800)
    return [v * vol * (0.4 + 0.6 * (rnd.random() < 0.35)) * math.exp(-k / SR * 6) for k, v in enumerate(x)]


def giz(vol=0.22):
    out = []
    for s in range(3):
        for k in range(int(0.11 * SR)):
            t = k / SR
            f = 2300 + 300 * math.sin(TAU * 31 * t) + s * 140
            out.append((0.6 * math.sin(TAU * f * t) + 0.4 * rnd.uniform(-1, 1)) * math.sin(math.pi * t / 0.11) * vol)
        out += [0.0] * int(0.05 * SR)
    return out


def risco(dur=0.2, vol=0.5, fc_baixo=1500, fc_alto=7000):
    x = passa_baixa(passa_alta(ruido(dur), fc_baixo), fc_alto)
    out = []
    for k, v in enumerate(x):
        t = k / SR
        grao = 0.5 + 0.5 * (math.sin(TAU * 310 * t) > 0.2)
        out.append(v * grao * math.sin(math.pi * min(1, t / dur)) * vol * 2.5)
    return out


def estrondo(vol=0.7, dur=1.6):
    out = []
    lp = passa_baixa(ruido(0.25), 400)
    for k in range(int(dur * SR)):
        t = k / SR
        f = 40 + 55 * math.exp(-t * 6)
        v = math.sin(TAU * f * t) * math.exp(-t * 2.6)
        if k < len(lp):
            v += lp[k] * 3 * math.exp(-t * 18)
        out.append(v * vol)
    return out


def tum(vol=0.4):
    return [math.sin(TAU * (45 + 40 * math.exp(-k / SR * 25)) * k / SR) * math.exp(-k / SR * 9) * vol for k in range(int(0.4 * SR))]


def sino(vol=0.35, base=196.0, dur=5.0):
    parc = [(0.5, 0.4, 0.9), (1, 1, 1.2), (1.19, 0.5, 1.6), (1.56, 0.35, 2.0), (2.0, 0.3, 2.4), (2.51, 0.15, 3.0), (3.0, 0.1, 3.5)]
    out = []
    for k in range(int(dur * SR)):
        t = k / SR
        v = sum(a * math.sin(TAU * base * r * t) * math.exp(-t * d) for r, a, d in parc)
        out.append(v * min(1, t / 0.004) * vol / 2.2)
    return out


def tique(alto, vol=0.25):
    f = 2100 if alto else 1500
    return [(math.sin(TAU * f * k / SR) * 0.7 + rnd.uniform(-1, 1) * 0.3) * math.exp(-k / SR * 160) * vol for k in range(int(0.04 * SR))]


def plim(vol=0.16):
    return [(math.sin(TAU * 1318.5 * k / SR) + 0.3 * math.sin(TAU * 2637 * k / SR)) * math.exp(-k / SR * 4) * vol for k in range(int(0.9 * SR))]


def grilos(buf, t0, t1, vol=0.035):
    for c, (per, f) in enumerate(((0.83, 4600), (1.07, 4300), (0.95, 4900))):
        t = t0 + c * 0.21
        while t < t1 - 0.2:
            chirp = []
            for p in range(3):
                chirp += [math.sin(TAU * f * k / SR) * math.sin(math.pi * k / (0.018 * SR)) * vol for k in range(int(0.018 * SR))]
                chirp += [0.0] * int(0.014 * SR)
            somar(buf, t, chirp)
            t += per * (0.9 + 0.2 * rnd.random())


def chiado_disco(buf, t0, t1, vol=0.02):
    chiado = passa_baixa(ruido(t1 - t0), 3000)
    somar(buf, t0, [v * vol * (0.85 + 0.15 * math.sin(TAU * 24 * k / SR)) for k, v in enumerate(chiado)])
    t = t0
    while t < t1:
        t += rnd.expovariate(14)
        estalo = [rnd.uniform(-1, 1) * math.exp(-k / SR * 900) * vol * rnd.uniform(3, 9) for k in range(int(0.006 * SR))]
        somar(buf, t, estalo)



def eco(buf, atrasos=((0.23, 0.22), (0.37, 0.12))):  # um pouco de espaço
    for atraso, g in atrasos:
        d = int(atraso * SR)
        for k in range(len(buf) - 1, d - 1, -1):
            buf[k] += buf[k - d] * g


def gravar(buf, caminho, segundos):
    pico = max(1e-9, max(abs(v) for v in buf))
    esc = min(1.0, 0.95 / pico)
    with wave.open(caminho, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, v * esc)) * 32767)) for v in buf[: int(segundos * SR)]))
    print(os.path.basename(caminho), "pico", round(pico, 3), "escala", round(esc, 3))
