import sys, cv2, numpy as np
src, out, evs = sys.argv[1], sys.argv[2], [int(x) for x in sys.argv[3].split(',')]
cap = cv2.VideoCapture(src); fr = []
while True:
    ok, f = cap.read()
    if not ok: break
    fr.append(cv2.resize(f, (96, 170), interpolation=cv2.INTER_AREA))
linhas = []
for e in evs:
    row = []
    for k in range(e - 5, e + 7):
        k2 = min(max(k, 0), len(fr) - 1); im = fr[k2].copy()
        cv2.rectangle(im, (0, 0), (96, 16), (0, 0, 0), -1); cv2.putText(im, f'{k2}', (2, 12), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255) if k2 != e else (0, 0, 255), 1)
        row.append(im)
    linhas.append(np.hstack(row))
for j in range(0, len(linhas), 6):
    cv2.imwrite(f'{out}_{j // 6:02d}.jpg', np.vstack(linhas[j:j + 6]), [cv2.IMWRITE_JPEG_QUALITY, 85])
