# Analisa TODOS os quadros de um vídeo: cor, luz, nitidez, diferença entre quadros e movimento global de câmera.
import sys, csv, cv2, numpy as np
src, out = sys.argv[1], sys.argv[2]
cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS)
orb = cv2.ORB_create(1500); bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
prev = None; prevh = None; rows = []; i = 0
while True:
    ok, f = cap.read()
    if not ok: break
    s = cv2.resize(f, (360, 640), interpolation=cv2.INTER_AREA)
    g = cv2.cvtColor(s, cv2.COLOR_BGR2GRAY); hsv = cv2.cvtColor(s, cv2.COLOR_BGR2HSV)
    h = cv2.calcHist([hsv], [0, 1], None, [30, 16], [0, 180, 0, 256]); cv2.normalize(h, h)
    b, gg, r = [float(c.mean()) for c in cv2.split(s)]
    hue = hsv[..., 0][hsv[..., 1] > 60]; hd = int(np.bincount((hue // 10).ravel(), minlength=18).argmax() * 20) if hue.size else -1
    row = dict(f=i, t=round(i / fps, 3), luma=round(float(g.mean()), 1), contraste=round(float(g.std()), 1),
               sat=round(float(hsv[..., 1].mean()), 1), quente=round(r - b, 1), matiz_dom=hd,
               nitidez=round(float(cv2.Laplacian(g, cv2.CV_64F).var()), 0), pct_escuro=round(float((g < 40).mean() * 100), 1),
               pct_claro=round(float((g > 220).mean() * 100), 1))
    if prev is not None:
        row['dif'] = round(float(cv2.absdiff(g, prev).mean()), 2)
        row['histcorr'] = round(float(cv2.compareHist(prevh, h, cv2.HISTCMP_CORREL)), 4)
        k1, d1 = orb.detectAndCompute(prev, None); k2, d2 = orb.detectAndCompute(g, None)
        esc = rot = tx = ty = ''; inl = 0
        if d1 is not None and d2 is not None and len(k1) > 20 and len(k2) > 20:
            m = bf.match(d1, d2)
            if len(m) > 20:
                p1 = np.float32([k1[x.queryIdx].pt for x in m]); p2 = np.float32([k2[x.trainIdx].pt for x in m])
                M, msk = cv2.estimateAffinePartial2D(p1, p2, method=cv2.RANSAC, ransacReprojThreshold=2.0)
                if M is not None:
                    inl = int(msk.sum()); sc = float(np.hypot(M[0, 0], M[1, 0]))
                    esc, rot, tx, ty = round(sc, 5), round(float(np.degrees(np.arctan2(M[1, 0], M[0, 0]))), 3), round(float(M[0, 2]), 2), round(float(M[1, 2]), 2)
        row.update(escala=esc, rot=rot, tx=tx, ty=ty, inliers=inl)
    rows.append(row); prev = g; prevh = h; i += 1
keys = ['f', 't', 'luma', 'contraste', 'sat', 'quente', 'matiz_dom', 'nitidez', 'pct_escuro', 'pct_claro', 'dif', 'histcorr', 'escala', 'rot', 'tx', 'ty', 'inliers']
with open(out, 'w', newline='') as fo:
    w = csv.DictWriter(fo, fieldnames=keys); w.writeheader(); [w.writerow(r) for r in rows]
print(src, 'quadros:', i, 'fps:', fps)
