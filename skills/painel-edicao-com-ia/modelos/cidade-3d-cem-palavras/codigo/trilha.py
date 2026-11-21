# TRILHA DO EPISÓDIO "Cem Palavras": a música de cada período e os efeitos presos nas palavras.
# Este é o arquivo de som que muda a cada vídeo. Os instrumentos e efeitos vêm de som_biblioteca.py.
#
# Uso: PY ferramentas/trilha.py <pasta do projeto>
# Gera assets/audio/musica.wav e assets/audio/efeitos.wav (mono, 44,1 kHz).
import json, math, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from som_biblioteca import *  # noqa: F401,F403  (nota, caixinha, pizz, pad, batida, whoosh, fita, giz, risco...)

PASTA = sys.argv[1]
D = json.load(open(os.path.join(PASTA, "assets/audio/palavras.json"), encoding="utf-8"))
DUR = D["duracao"]
B = {b["n"]: b for b in D["blocos"]}  # B[n]["ini"] = começo do bloco n
LEG = D["legenda"]


def palavra(bloco, i):  # segundo em que começa a palavra i do bloco
    return [l for l in LEG if l["bloco"] == bloco][i]["t0"]


# ================= MÚSICA =================
mus = novo(DUR)
BEAT = 0.6
# dia: caixinha brincalhona em lá menor + pizzicato
mel = [81, 84, 88, 84, 83, 81, 76, None, 77, 81, 84, 81, 79, 77, 76, None,
       81, 84, 88, 91, 88, 84, 83, None, 84, 83, 81, 79, 81, None, None, None]
raizes = [45, 41, 48, 40]
fim_dia = B[9]["ini"]
t, i = 0.15, 0
while t < fim_dia - 0.4:
    m = mel[i % len(mel)]
    if m:
        somar(mus, t, caixinha(nota(m), vol=0.17))
    if i % 4 == 0:
        somar(mus, t, pizz(nota(raizes[(i // 8) % 4]), vol=0.16))
    t += BEAT / 2
    i += 1
# noite: notas soltas e um tapete grave
ini_noite, fim_noite = B[9]["ini"], B[14]["ini"]
somar(mus, ini_noite, pad([nota(45), nota(52)], fim_noite - ini_noite, vol=0.12, ataque=1.5))
for k, m in enumerate([69, 72, 76, 74, 72, 71, 69, 64]):
    tt = ini_noite + 0.8 + k * 2.4
    if tt < fim_noite - 1:
        somar(mus, tt, caixinha(nota(m), dur=2.4, vol=0.13))
# entardecer: coração batendo e tapete subindo
ini_t, congela = B[14]["ini"], B[15]["ini"]
somar(mus, ini_t, pad([nota(45), nota(48), nota(52)], congela - ini_t, vol=0.1, ataque=2.5))
t = ini_t + 0.3
while t < congela - 0.3:
    somar(mus, t, batida(0.3))
    t += 0.82
# praça congelada: só um grave subindo até o "Fui eu"
fui = B[17]["ini"]
drone = []
for k in range(int((fui - congela) * SR)):
    u = k / SR
    p = u / (fui - congela)
    f = 50 + 22 * p
    drone.append((math.sin(TAU * f * u) + 0.4 * math.sin(TAU * 2 * f * u)) * 0.14 * p ** 1.5)
somar(mus, congela, drone)
# 1958: valsa de caixinha antiga, que para quando o menino tapa a boca
ini_s, para_s = B[18]["ini"], B[19]["ini"]
valsa = [76, 79, 79, 77, 81, 81, 76, 79, 84, 83, None, None, 74, 77, 77, 76, 79, 79, 72, 76, 79, 77, None, None]
baixos = [48, 43, 48, 43]
t, i = ini_s + 0.25, 0
while t < para_s - 0.1:
    m = valsa[i % len(valsa)]
    if m:
        somar(mus, t, caixinha(nota(m), dur=1.2, vol=0.15, wow=0.006))
    if i % 3 == 0:
        somar(mus, t, pizz(nota(baixos[(i // 6) % 4]), vol=0.12))
    t += 0.48
    i += 1
# volta: acordes tristes
ini_v, ini_n2 = B[20]["ini"], palavra(21, 2) - 0.06
meio = ini_v + (ini_n2 - ini_v) / 2
somar(mus, ini_v, pad([nota(57), nota(60), nota(64)], meio - ini_v + 0.6, vol=0.11, ataque=0.6))
somar(mus, meio, pad([nota(53), nota(57), nota(60)], ini_n2 - meio + 0.8, vol=0.11, ataque=0.6))
somar(mus, ini_v + 0.4, caixinha(nota(76), dur=2.5, vol=0.11))
somar(mus, meio + 0.4, caixinha(nota(72), dur=2.5, vol=0.11))
# fim: a caixinha sozinha, a última nota fica soando
for tt, m in ((ini_n2 + 0.3, 76), (ini_n2 + 1.5, 81), (ini_n2 + 2.7, 84), (ini_n2 + 3.9, 83), (palavra(22, 3) + 0.05, 81)):
    somar(mus, tt, caixinha(nota(m), dur=min(2.6, DUR - tt + 0.5), vol=0.15))
eco(mus)  # um pouco de espaço na música

# ================= EFEITOS =================
efe = novo(DUR)
for tt, rev in ((0.0, False), (B[9]["ini"] - 0.35, False), (B[14]["ini"] - 0.35, False), (B[18]["ini"] - 0.55, True), (B[20]["ini"] - 0.35, False), (palavra(21, 2) - 0.4, False)):
    somar(efe, max(0, tt), whoosh(0.7, rev, 0.22 if not rev else 0.28))
somar(efe, palavra(1, 7) - 0.02, plim())
somar(efe, palavra(2, 3) - 0.08, fita(0.32))
somar(efe, palavra(5, 4), giz(0.2))
somar(efe, B[7]["ini"] + 0.05, fita(0.22))
grilos(efe, B[9]["ini"], B[14]["ini"])
grilos(efe, palavra(21, 2), DUR)
t = palavra(9, 5)
while t < B[10]["ini"] - 0.2:  # ele riscando, baixinho
    somar(efe, t, risco(0.14, 0.18))
    t += 0.33
for k in range(3):  # risc, risc, risc
    somar(efe, palavra(10, k) - 0.03, risco(0.24, 0.55))
somar(efe, palavra(13, 4) - 0.05, estrondo(0.55))
somar(efe, B[15]["ini"], tum(0.45))
somar(efe, B[17]["ini"] + 0.02, estrondo(0.75, 2.2))
chiado_disco(efe, B[18]["ini"], B[20]["ini"])
somar(efe, B[19]["ini"], risco(0.35, 0.3, 600, 4000))  # agulha arrastando: a valsa para
t, alto = B[19]["ini"] + 0.35, True
while t < palavra(19, 5) - 0.05:  # relógio... até parar
    somar(efe, t, tique(alto))
    alto = not alto
    t += 0.5
somar(efe, palavra(19, 5), sino(0.32))
somar(efe, palavra(21, 2) + 1.15, risco(0.38, 0.38, 700, 3500))  # pedrinha no banco
somar(efe, palavra(21, 2) + 1.75, risco(0.3, 0.28, 700, 3500))



gravar(mus, os.path.join(PASTA, "assets/audio/musica.wav"), DUR)
gravar(efe, os.path.join(PASTA, "assets/audio/efeitos.wav"), DUR)
