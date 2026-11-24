"""Som do filme: trilha original sintetizada (numpy) + efeitos do SFX Kit (CC0), sincronizados às palavras (tempos.json).
A narração NÃO é editada: entra inteira, com um único ganho linear no master (para -14 LUFS) e limitador de pico.
uso: python3 audio.py  -> stems/musica.wav, stems/efeitos.wav, ../../public/salario/mix.wav"""
import json, os, re, subprocess, unicodedata
import numpy as np
SR = 48000
T = json.load(open("tempos.json"))
DUR = 101.07
N = int(DUR * SR) + SR // 2
nrm = lambda x: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", x.lower()).encode("ascii", "ignore").decode())
def W(fala, w, n=1, fim=False):
    c = 0
    for p in T["palavras"]:
        if p["fala"] == fala - 1 and nrm(p["w"]).startswith(nrm(w)):
            c += 1
            if c == n: return p["e"] if fim else p["s"]
    return T["falas"][fala - 1]["ini"]
FALA = [f["ini"] for f in T["falas"]]
def ler(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()
t = np.arange(N) / SR
# ---------------- trilha ----------------
mus = np.zeros(N, np.float32)
def env(t0, t1, a=0.4, r=0.8):
    e = np.clip((t - t0) / a, 0, 1) * np.clip((t1 - t) / r, 0, 1)
    return e
def tom(f, t0, t1, amp, a=0.4, r=0.8, harm=(1, .35, .15), vib=0.0):
    i0, i1 = max(0, int((t0 - .01) * SR)), min(N, int((t1 + .01) * SR))
    tt = t[i0:i1]; e = env(t0, t1, a, r)[i0:i1]
    ph = 2 * np.pi * f * tt + vib * np.sin(2 * np.pi * 4.8 * tt)
    s = sum(h * np.sin(k * ph + k * .3) for k, h in enumerate(harm, 1))
    mus[i0:i1] += (amp * e * s).astype(np.float32)
def pluck(f, t0, amp, dec=1.2, harm=(1, .5, .25, .12)):
    i0, i1 = int(t0 * SR), min(N, int((t0 + dec * 4) * SR)); tt = t[i0:i1] - t0
    s = sum(h * np.sin(2 * np.pi * f * k * tt) * np.exp(-tt * k / dec) for k, h in enumerate(harm, 1))
    mus[i0:i1] += (amp * s * np.clip(tt / .004, 0, 1)).astype(np.float32)
NT = {n: 440 * 2 ** ((i - 9) / 12) for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}
hz = lambda n, o: NT[n] * 2 ** (o - 4)
AC = {"Am": ["A", "C", "E"], "F": ["F", "A", "C"], "C": ["C", "E", "G"], "G": ["G", "B", "D"], "Dm": ["D", "F", "A"], "E": ["E", "G#", "B"]}
def pad(ac, t0, t1, amp, a=1.2, r=1.5, oit=3):
    for k, n in enumerate(AC[ac]): tom(hz(n, oit + (1 if k == 2 and n in "CDEF" else 0)), t0, t1, amp, a, r, (1, .2, .06), vib=.002)
def pulso(t0, t1, amp, seq=("Am", "F", "C", "G"), bpm=84):
    b = 60 / bpm; k = 0; x = t0
    while x < t1:
        ac = seq[(k // 8) % len(seq)]; pluck(hz(AC[ac][0], 2), x, amp * (1 if k % 2 == 0 else .6), dec=.35)
        x += b; k += 1
# 1. abertura: drone grave
tom(55, 0, FALA[1] + .3, .05, 1.5, .8, (1, .3)); tom(110, 0.5, FALA[1], .02, 2, .8)
# 2-3. pulso + pad
pulso(FALA[1], FALA[3] - .2, .11); pad("Am", FALA[1], FALA[2] + 3, .022); pad("F", FALA[2] + 3, FALA[3], .022)
# 4. rebobinar: pad cai
tom(220, FALA[3], FALA[4], .018, .2, 1.5, (1, .4))
# 5. flashback: piano claro em C-G-Am-F
x, k = FALA[4] + .1, 0
while x < FALA[5] - .3:
    ac = ["C", "G", "Am", "F"][(k // 4) % 4]; n = AC[ac][k % 3]; pluck(hz(n, 4 + (k % 2)), x, .05, dec=.9); pluck(hz(AC[ac][0], 3), x, .03, dec=1.4) if k % 4 == 0 else None
    x += .5; k += 1
pad("C", FALA[4], FALA[4] + 5.3, .014); pad("Am", FALA[4] + 5.3, FALA[5], .014)
# 6. pulso volta
pulso(FALA[5], FALA[6] - .1, .08, ("Am", "F")); pad("Am", FALA[5], FALA[6], .016)
# 7. tensão: só drone e tique
tom(55, FALA[6], FALA[7] + .5, .05, .3, .8, (1, .3))
for x in np.arange(FALA[6], FALA[7], .5): pluck(2600, x, .012, dec=.02, harm=(1,))
# 8. colunas: pulso mais forte, corta logo depois do rotativo
q8 = W(8, "quatrocentos")
pulso(FALA[7], q8 + .3, .12, ("Am", "Dm", "Am", "E"), bpm=96); pad("Dm", FALA[7], q8, .02)
# 9. falsa esperança: acorde maior
pad("C", FALA[8], FALA[9] - .1, .03, .5, .6, oit=3); tom(hz("D", 5), FALA[8] + .3, FALA[9] - .1, .01, .6, .6)
# 10. silêncio (revelação)
# 11-12. pulso baixo e tenso
pulso(FALA[10], FALA[12], .07, ("Am", "Dm")); tom(55, FALA[10], FALA[12], .04, .5, 1, (1, .3))
# 13. cordas crescem até o pico
for k, ac in enumerate(["Am", "F", "C", "E"]):
    a0 = FALA[12] + k * 2.1; pad(ac, a0, a0 + 2.6, .016 + k * .01, a=.9, r=.8)
# 14. fecho: pad baixo some antes de "Paga o passado"
paga = W(14, "paga", 2)
pad("Am", FALA[13], paga - .2, .018, a=.6, r=1.6)
# ---------------- efeitos (SFX Kit) ----------------
K = "/home/user/_ferramentas/sfx-kit/sounds/"
sfx = np.zeros(N, np.float32)
cache = {}
def fx(nome, quando, db=-12, sync=0.0):
    if nome not in cache:
        d = next(x for x in os.listdir(K) if os.path.exists(K + x + "/" + nome + ".wav")); cache[nome] = ler(K + d + "/" + nome + ".wav")
    a = cache[nome] * (10 ** (db / 20)); i0 = int((quando - sync) * SR)
    if i0 < 0: a = a[-i0:]; i0 = 0
    i1 = min(N, i0 + len(a)); sfx[i0:i1] += a[: i1 - i0]
fx("notification-alert-soft", W(1, "salário"), -10)
fx("impact-deep-soft", W(1, "nome"), -8, .045); fx("notification-error-soft", W(1, "nome") + .05, -14)
for k in [2, 3, 5, 6, 7, 8, 9, 11, 12, 13]: fx("whoosh-medium-soft", FALA[k - 1] - .05, -20, .229)
fx("reverse-whoosh-long-soft", W(4, "meses"), -12, 1.192); fx("time-clock-fast", W(4, "volta"), -18)
fx("impact-medium-hard", W(5, "quebra"), -10); fx("notification-failure-minor", W(5, "quebra") + .05, -16)
fx("money-card-tap", W(5, "dez"), -12); fx("foley-paper-touch", W(5, "empréstimo"), -12); fx("shimmer-short-soft", W(5, "cabe"), -18)
for i in range(10):
    if i not in (3, 7): fx("pop-small-in", W(6, "oito") + i * .14, -16)
fx("pop-medium-in", W(7, "preço") - .1, -12)
fx("riser-1s-soft", W(8, "quinze"), -16, .982); fx("riser-1s-strong", W(8, "sessenta"), -15, .984)
fx("riser-2s-strong", q8, -13, 1.978); fx("cinematic-drum-big", q8 + .05, -9)
fx("shimmer-medium-sparkle", W(9, "sobe"), -14)
for i in range(3): fx("foley-paper-slide", W(10, "quase") + i * .3, -10)
fx("swish-medium", W(11, "parcela"), -12); fx("impact-light-soft", W(11, "antes"), -16)
fx("foley-paper-touch", W(12, "fatura"), -10); fx("foley-paper-touch", W(12, "outra"), -10); fx("impact-heavy-hard", W(12, "lista"), -8)
for k in range(4): fx("pop-small-in", W(13, "quase") + k * .18, -16)
fx("bass-808-long", W(14, "passado", fim=True) + .15, -10)
# ---------------- mixagem ----------------
voz = ler("../../public/salario/narracao.wav")[:N]; voz = np.pad(voz, (0, N - len(voz)))
os.makedirs("stems", exist_ok=True)
rms = lambda x: np.sqrt(np.mean(x[np.abs(x) > 1e-3] ** 2))
mus *= (rms(voz) * 10 ** (-15 / 20)) / max(rms(mus), 1e-9)          # trilha 15 dB abaixo da voz (média)
pico_v = np.max(np.abs(voz)); sfx = np.clip(sfx, -.7 * pico_v, .7 * pico_v)  # efeitos nunca acima de 70% do pico da voz
# a trilha baixa um pouco quando a voz fala (6 dB), sem tocar na voz
envv = np.convolve(np.abs(voz), np.ones(SR // 10) / (SR // 10), mode="same"); duck = 1 - .5 * np.clip(envv / (np.percentile(envv, 90) + 1e-9), 0, 1)
mix = voz + mus * duck + sfx
for nome, x in [("musica", mus), ("efeitos", sfx), ("mix_bruto", mix)]:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "stems/" + nome + ".wav"], input=x.astype(np.float32).tobytes(), check=True)
med = subprocess.run(["ffmpeg", "-v", "info", "-i", "stems/mix_bruto.wav", "-af", "loudnorm=I=-14:TP=-1.5:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
I = float(json.loads(med[med.rindex("{"):med.rindex("}") + 1])["input_i"]); g = -14 - I + 0.7
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "stems/mix_bruto.wav", "-af", f"volume={g:.2f}dB,alimiter=limit=0.89:level=false", "-ac", "2", "-ar", "48000",
                "../../public/salario/mix.wav"], check=True)
print(f"mix pronto: entrada {I:.1f} LUFS, ganho {g:+.2f} dB")
