import sys, cv2, numpy as np, json
src = sys.argv[1]; cap = cv2.VideoCapture(src); F = []
while True:
    ok, f = cap.read()
    if not ok: break
    s = cv2.resize(f, (90, 160), interpolation=cv2.INTER_AREA); F.append(cv2.cvtColor(s, cv2.COLOR_BGR2LAB).astype(np.float32))
F = np.stack(F); n = len(F)
def dist(a, b):  # distância de cor em grade 3x6 (estrutura espacial)
    A = a.reshape(6, 160 // 6 if False else 1, -1) if False else None
    ga = cv2.resize(a, (3, 6), interpolation=cv2.INTER_AREA); gb = cv2.resize(b, (3, 6), interpolation=cv2.INTER_AREA)
    return float(np.abs(ga - gb).mean())
d1 = np.array([0] + [dist(F[i], F[i - 1]) for i in range(1, n)])
d6 = np.array([dist(F[min(n - 1, i + 3)], F[max(0, i - 3)]) for i in range(n)])
json.dump({'d1': d1.round(2).tolist(), 'd6': d6.round(2).tolist()}, open(sys.argv[2], 'w'))
med1 = np.median(d1); med6 = np.median(d6)
# corte seco: d1 pico isolado; fusão: d6 alto com d1 moderado espalhado
ev = []
i = 1
while i < n:
    if d1[i] > max(6, med1 * 5) and d1[i] >= d1[max(0, i - 2):i + 3].max():
        ev.append(('corte', i, round(i / 30, 2), round(d1[i], 1))); i += 4; continue
    i += 1
cand = [i for i in range(3, n - 3) if d6[i] > max(10, med6 * 3.5) and d6[i] >= d6[i - 3:i + 4].max()]
for c in cand:
    if all(abs(c - e[1]) > 6 for e in ev):
        # fusão: estimar início/fim onde d1 fica acima do normal
        a = c; b = c
        while a > 0 and d1[a] > med1 * 1.8: a -= 1
        while b < n - 1 and d1[b] > med1 * 1.8: b += 1
        ev.append(('transicao', c, round(c / 30, 2), round(d6[c], 1), round(a / 30, 2), round(b / 30, 2)))
ev.sort(key=lambda e: e[1])
print(src, 'quadros', n, 'med d1', round(med1, 2), 'med d6', round(med6, 2), 'eventos', len(ev))
for e in ev: print(' ', e)
