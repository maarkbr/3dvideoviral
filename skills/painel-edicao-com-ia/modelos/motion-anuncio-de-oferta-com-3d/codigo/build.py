"""Monta o index.html do anúncio motion a partir do modelo.tpl (na mesma pasta).
uso: python build.py 9x16   (Reels/Stories, 1080x1920)
     python build.py 4x5    (feed, 1080x1350)"""
import json, sys, html
F = sys.argv[1] if len(sys.argv) > 1 else "9x16"
H, OFF = (1920, 0) if F == "9x16" else (1350, -160)
DUR = 32.2
# tempos conferidos no Whisper (voz/voz.wav, 08/11)
W = dict(s2=2.12, anuncio=.40, foi=.76, claude1=1.54, edicao=2.62, ia1=3.36, voce=3.68, grava=3.98, e_o=4.32, edita=4.80,
         s3=5.40, oito=5.66, estilos=6.02, s5=12.70, aula=13.42, passo=14.02,
         s6=14.90, tres=14.98, bonus=15.24, instalacao=15.96, b54=17.64, temas=18.12, como=19.94,
         s8=21.55, sempre=22.46, por=23.00, r37=23.22, pagamento=24.40, s9=25.20, sete=25.48, dias=25.76,
         s10=26.75, mac=27.26, claude3=28.46, pago=29.10, s11=29.60, saiba=30.10, mais=30.42)
ITENS = [("fone", "v-podcast-antes-depois.mp4"), ("tela", "v-youtube-intro.mp4"), ("fone", "v-bit-tutorial.mp4"), ("fone", "v-3d-ponte.mp4"),
         ("fone", "v-mapas-chile.mp4"), ("fone", "v-motion-produto.mp4"), ("fone", "v-palitinho.mp4")]
CAR = [("Cortes de podcast", 6.72, 0), ("Vídeo falado", 7.84, 0), ("YouTube", 8.80, 1), ("Estilo Bit", 9.44, 2), ("Vídeo 3D", 9.96, 3),
       ("Mapas e história", 10.74, 4), ("Motion", 11.44, 5), ("Palitinho", 12.08, 6)]
CAPAS = ["capa-cortes", "capa-youtube", "capa-bit", "capa-3d", "capa-mapas", "capa-motion", "capa-palitinho"]
LEG = [("No painel do", 2.04, 2.60), ("Edição com *IA*,", 2.62, 3.66), ("você *grava*", 3.68, 4.30), ("e o Claude *edita*.", 4.32, 5.36),
       ("Já são *oito* estilos:", 5.38, 6.70), ("*cortes* de podcast,", 6.72, 7.82), ("*vídeo* falado,", 7.84, 8.78), ("*YouTube*,", 8.80, 9.42),
       ("*Bit*,", 9.44, 9.94), ("*três D*,", 9.96, 10.72), ("*mapas*,", 10.74, 11.42), ("*Motion*", 11.44, 11.82), ("e *palitinho*.", 11.84, 12.76),
       ("Cada um com", 12.78, 13.40), ("*aula*", 13.42, 14.00), ("e *passo a passo*.", 14.02, 14.92), ("E *três* bônus:", 14.94, 15.94),
       ("*instalação* em", 15.96, 16.60), ("*dez* minutos,", 16.62, 17.62), ("*54* temas", 17.64, 18.56), ("que já *viralizaram*", 18.58, 19.66),
       ("e como *vender*", 19.68, 20.46), ("edição com *IA*.", 20.48, 21.62), ("*Atualizações*", 21.64, 22.10), ("para *sempre*,", 22.12, 22.98),
       ("por *R$ 37*,", 23.00, 24.38), ("pagamento *único*.", 24.40, 25.20), ("Precisa de", 26.82, 27.24), ("*Mac* ou *Windows*", 27.26, 28.10),
       ("e do *Claude Pro*,", 28.12, 29.08), ("*pago* à parte.", 29.10, 29.62)]

def leg_html(txt):
    out, on = [], False
    for w in txt.split(" "):
        k = w.startswith("*") or on
        if w.startswith("*"): on = True
        fim = w.endswith("*") or w.rstrip(",.:").endswith("*")
        wl = html.escape(w.replace("*", ""))
        out.append(f'<span class="pal{" k" if k else ""}">{wl}</span>')
        if fim: on = False
    return '<div class="lg">' + " ".join(out) + "</div>"

fones = []
for i, (tipo, arq) in enumerate(ITENS):
    vid = f'<video id="cv{i}" src="assets/{arq}" data-start="5.9" data-duration="6.95" data-media-start="0" muted playsinline data-track-index="{2 + i}"></video>'
    if tipo == "fone": fones.append(f'<div class="p3 item fone" style="left:375px;top:612px"><div class="ilha"></div>{vid}</div>')
    else: fones.append(f'<div class="p3 item tela169" style="left:240px;top:736px">{vid}</div>')
chips = "".join(f'<span class="pilula">{html.escape(n)}</span>' for n, _, _ in CAR)
capas = "".join(f'<div class="capa" style="left:{110 + i * 326}px"><img src="assets/{c}.jpg"></div>' for i, c in enumerate(CAPAS))
s = open("modelo.tpl").read()
rep = {"__H__": str(H), "__OFF__": str(OFF), "__DUR__": str(DUR), "__TEMPOS__": json.dumps(W),
       "__CARROSSEL__": json.dumps([{"t": t, "item": it} for _, t, it in CAR]), "__LEGJS__": json.dumps([[a, b] for _, a, b in LEG]),
       "__FONES__": "".join(fones), "__CHIPS__": chips, "__CAPAS__": capas, "__LEGENDA__": "".join(leg_html(t) for t, _, _ in LEG)}
for k, v in rep.items(): s = s.replace(k, v)
open("index.html", "w").write(s)
print(f"index.html ({F}, 1080x{H}, {DUR}s, {len(LEG)} legendas, {len(CAR)} passos no carrossel)")
