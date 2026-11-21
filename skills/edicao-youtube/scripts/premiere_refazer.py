"""Refaz uma sequência do Premiere em outra resolução/fps SEM perder o que o Lucas já editou nela.

uso: python3 premiere_refazer.py PROJETO_ou_AUTOSAVE.prproj saida.xml [--sequencia "nome"] [--nome "nova sequência"]
        [--resolucao fullhd|2k|4k] [--fps 60] [--trocar antigo.mp4=novo.mp4 ...]
        [--demo FONTE.mp4@INICIO_NO_BRUTO[@FIM_NO_BRUTO|-[@GANHO_DB]] ...]
        [--enquadrar enquadramento.json] [--ganhos ganhos.json --ganhos-arquivo audio.wav] [--musica trilha.wav@INICIO[@GANHO_DB]]

Lê a linha do tempo (premiere_ler.py), mantém cada clipe no mesmo lugar, com o mesmo trecho da fonte, e grava um
XML FCP7 novo: sequência na resolução escolhida (mínimo Full HD; resolucao.py) e no fps pedido, cada mídia escalada para caber no quadro (3072x1728 → 83,333% em
1440p; intro 4K → 66,667%), clipes desativados continuam desativados, faixas de áudio com o mesmo canal (L/R),
vídeo e áudio do mesmo trecho ligados, marcadores no lugar. --trocar troca um arquivo (ex.: intro 1080p30 → 4K60).
Avisa (e não reproduz) zoom/keyframes/velocidade diferentes de 1: confira no Premiere se aparecer aviso.
Tempos: o Premiere guarda em ticks; na saída tudo vira quadro do fps novo (30 → 60 é exato).
--demo: o som LIMPO de um vídeo que tocou na tela (a fonte, sincronizada: INICIO = segundo do bruto em que ela está no 0;
FIM = onde ele parou o vídeo, '-' = até o fim da fonte — sem FIM o som invade o que vem depois)
vai em DUAS FAIXAS NOVAS embaixo das que existem, picado igual aos cortes dele (um pedaço por clipe da V1 que cai
dentro da reprodução), com o volume do clipe em GANHO_DB. O próprio arquivo-fonte é a mídia: ele pode alongar/ajustar.
Pedido do Lucas (07/11): "só colocar as faixas de áudio abaixo de cada trecho, que daí eu arrumo na timeline".
O que ele mexeu é mantido: volume de cada clipe (o efeito do PAR L/R — ele às vezes sobe só a A1; o Premiere toca as
duas mono no centro, então vale 20·log10((gL+gR)/2) nas duas) e o tamanho relativo ao quadro (escala dele × largura
nova / largura velha × largura da mídia velha / da nova, quando --trocar muda a mídia).
--enquadrar: {"arquivo": "Gravação.mov", "largura": 3072, "altura": 1728, "clipes": {"<in>": {cx, cy, cw}}} — recorte 16:9
em pixels da gravação para cada clipe (pelo ponto de entrada); vira Escala + Centro no Movimento. O Centro do XML é em
frações do tamanho da MÍDIA (calibrado 07/11: 0,25 → +768 px numa gravação de 3072, qualquer escala), a partir do
centro da sequência: centro = (meio_da_mídia − ponto)·escala / tamanho_da_mídia.
--ganhos: {"ganhos": {"<in>": dB}} para os clipes do áudio --ganhos-arquivo (falas baixas); fica o maior entre o dele e este.
--musica: um WAV (ex.: a trilha do corpo já pronta) em duas faixas novas, a partir de INICIO (s da sequência).
"""
import json, os, subprocess, sys, urllib.parse
from xml.sax.saxutils import escape

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from premiere_ler import ler  # noqa: E402
from resolucao import resolucao  # noqa: E402

a = sys.argv[1:]
opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d  # noqa: E731
proj, saida = a[0], a[1]
W, H = resolucao(opt("--resolucao"))
FPS = int(opt("--fps", 60))
trocas = dict(x.split("=", 1) for i, x in enumerate(a) if i and a[i - 1] == "--trocar")
trocas = {os.path.basename(k): v for k, v in trocas.items()}
L = ler(proj, opt("--sequencia"))
nome_seq = opt("--nome", (L["sequencia"] or "Sequência") + f" ({H}p{FPS})")
q = lambda s: int(round(s * FPS))  # noqa: E731
avisos = []

sond = {}


def sondar(p):
    if p not in sond:
        o = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                                       "format=duration:stream=codec_type,width,height,channels,r_frame_rate",
                                       "-of", "json", p], capture_output=True, text=True, check=True).stdout)
        v = next((s for s in o["streams"] if s["codec_type"] == "video"), None)
        au = next((s for s in o["streams"] if s["codec_type"] == "audio"), None)
        fr = v and v["r_frame_rate"].split("/")
        sond[p] = {"dur": float(o["format"]["duration"]), "w": v and v["width"], "h": v and v["height"],
                   "ch": au and au["channels"], "fps": v and round(int(fr[0]) / int(fr[1]))}
    return sond[p]


ids = {}


def arq(p):
    if p in ids:
        return f'<file id="{ids[p]}"/>'
    s = sondar(p)
    ids[p] = f"file-{len(ids) + 1}"
    taxa = s["fps"] or FPS
    mv = (f"<video><samplecharacteristics><rate><timebase>{taxa}</timebase><ntsc>FALSE</ntsc></rate><width>{s['w']}</width>"
          f"<height>{s['h']}</height><pixelaspectratio>square</pixelaspectratio></samplecharacteristics></video>") if s["w"] else ""
    ma = (f"<audio><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate></samplecharacteristics>"
          f"<channelcount>{s['ch']}</channelcount></audio>") if s["ch"] else ""
    return (f'<file id="{ids[p]}"><name>{escape(os.path.basename(p))}</name>'
            f"<pathurl>file://localhost{urllib.parse.quote(p)}</pathurl><rate><timebase>{taxa}</timebase><ntsc>FALSE</ntsc></rate>"
            f"<duration>{int(s['dur'] * taxa)}</duration><media>{mv}{ma}</media></file>")


RATE = f"<rate><timebase>{FPS}</timebase><ntsc>FALSE</ntsc></rate>"
cont = [0]
faixas = {"video": {}, "audio": {}}


def novo(c):
    p = c["arquivo"]
    b = os.path.basename(p or "")
    if b in trocas:
        p = os.path.abspath(trocas[b])
    if not p or not os.path.exists(p):
        sys.exit(f"mídia não encontrada: {p}")
    return p


import math
ENQ = json.load(open(opt("--enquadrar"))) if opt("--enquadrar") else None
GAN = json.load(open(opt("--ganhos")))["ganhos"] if opt("--ganhos") else {}
GAN_ARQ = os.path.basename(opt("--ganhos-arquivo", "")) if opt("--ganhos-arquivo") else None
QW = (L.get("quadro") or [W, H])[0]


def par_db(f, c):
    fp = next((g for g in L["faixas"] if g["tipo"] == "audio" and g["index"] == f["index"] ^ 1), None)
    m = fp and next((d for d in fp["clipes"] if abs(d["t0"] - c["t0"]) < 0.01 and abs(d["t1"] - c["t1"]) < 0.01), None)
    if m:
        return 20 * math.log10((10 ** (c.get("nivel_db", 0) / 20) + 10 ** (m.get("nivel_db", 0) / 20)) / 2)
    return c.get("nivel_db", 0.0)


def f_nivel(db):
    return ("<filter><effect><name>Audio Levels</name><effectid>audiolevels</effectid><effectcategory>audiolevels</effectcategory>"
            "<effecttype>audiolevels</effecttype><mediatype>audio</mediatype><parameter authoringApp=\"PremierePro\">"
            "<parameterid>level</parameterid><name>Level</name><valuemin>0</valuemin><valuemax>3.98109</valuemax>"
            f"<value>{10 ** (db / 20):.5f}</value></parameter></effect></filter>")


def f_motion(esc, vx=0.0, vy=0.0):
    x = ("<filter><effect><name>Basic Motion</name><effectid>basic</effectid><effectcategory>motion</effectcategory>"
         "<effecttype>motion</effecttype><mediatype>video</mediatype><parameter authoringApp=\"PremierePro\">"
         f"<parameterid>scale</parameterid><name>Scale</name><valuemin>0</valuemin><valuemax>1000</valuemax>"
         f"<value>{esc:.3f}</value></parameter>")
    if abs(vx) > 1e-5 or abs(vy) > 1e-5:
        x += (f"<parameter authoringApp=\"PremierePro\"><parameterid>center</parameterid><name>Center</name>"
              f"<value><horiz>{vx:.6f}</horiz><vert>{vy:.6f}</vert></value></parameter>")
    return x + "</effect></filter>"


def f_motion_kf(pts):
    """pts: [(quadro_da_mídia, escala%, centro_h, centro_v)] — keyframes de Escala e Centro (zoom suave)."""
    e = ("<filter><effect><name>Basic Motion</name><effectid>basic</effectid><effectcategory>motion</effectcategory>"
         "<effecttype>motion</effecttype><mediatype>video</mediatype><parameter authoringApp=\"PremierePro\">"
         f"<parameterid>scale</parameterid><name>Scale</name><valuemin>0</valuemin><valuemax>1000</valuemax><value>{pts[0][1]:.3f}</value>"
         + "".join(f"<keyframe><when>{w}</when><value>{sc:.3f}</value></keyframe>" for w, sc, _, _ in pts) + "</parameter>"
         "<parameter authoringApp=\"PremierePro\"><parameterid>center</parameterid><name>Center</name>"
         f"<value><horiz>{pts[0][2]:.6f}</horiz><vert>{pts[0][3]:.6f}</vert></value>"
         + "".join(f"<keyframe><when>{w}</when><value><horiz>{vx:.6f}</horiz><vert>{vy:.6f}</vert></value></keyframe>" for w, _, vx, vy in pts)
         + "</parameter></effect></filter>")
    return e


n_enq = 0
n_kf = 0
for f in L["faixas"]:
    for c in f["clipes"]:
        p = novo(c)
        s = sondar(p)
        cont[0] += 1
        c["id"] = f"ci-{cont[0]}"
        c["p"] = p
        t0, t1, i0 = q(c["t0"]), q(c["t1"]), q(c["in"])
        i1 = i0 + (t1 - t0)
        if abs(c["vel"] - 1) > 1e-6 or c.get("keyframes"):
            avisos.append(f"{f['tipo']} {f['index'] + 1} em {c['t0']:.2f}s: velocidade/keyframes não reproduzidos")
        x = (f'<clipitem id="{c["id"]}"><name>{escape(os.path.basename(p))}</name><enabled>{"FALSE" if c["mudo"] else "TRUE"}</enabled>'
             f"<duration>{int(s['dur'] * FPS)}</duration>{RATE}<start>{t0}</start><end>{t1}</end><in>{i0}</in><out>{i1}</out>{arq(p)}")
        if f["tipo"] == "audio":
            x += f"<sourcetrack><mediatype>audio</mediatype><trackindex>{f['index'] % 2 + 1 if (s['ch'] or 1) > 1 else 1}</trackindex></sourcetrack>"
            db = par_db(f, c)
            if GAN_ARQ and os.path.basename(p) == GAN_ARQ and f"{c['in']:.3f}" in GAN:
                db = max(db, GAN[f"{c['in']:.3f}"])
            if abs(db) > 0.05:
                x += f_nivel(db)
        else:
            q_ = ENQ and os.path.basename(p) == ENQ["arquivo"] and ENQ["clipes"].get(f"{c['in']:.3f}")
            if q_ and q_.get("kf"):
                pts = []
                for tk, cx_, cy_, cw_ in q_["kf"]:
                    sc = W / cw_
                    pts.append((i0 + q(tk), sc * 100, (s["w"] / 2 - cx_) * sc / s["w"], (s["h"] / 2 - cy_) * sc / s["h"]))
                x += f_motion_kf(pts)   # <when> em quadros da mídia (como o <in>) — calibrado no Premiere 2026
                n_enq += 1
                n_kf += 1
            elif q_:
                sc = W / q_["cw"]
                vx = (s["w"] / 2 - q_["cx"]) * sc / s["w"]
                vy = (s["h"] / 2 - q_["cy"]) * sc / s["h"]
                x += f_motion(sc * 100, vx, vy)
                n_enq += 1
            else:
                so = sondar(c["arquivo"]) if c["arquivo"] and os.path.exists(c["arquivo"]) else s
                esc = (c.get("escala") or 100) * (W / QW) * ((so["w"] or s["w"]) / s["w"])
                if abs(esc - 100) > 0.01:
                    x += f_motion(esc)
        c["xml"] = x + "{LINKS}</clipitem>"
        faixas[f["tipo"]].setdefault(f["index"], []).append(c)

# som das demos em faixas novas, embaixo das que existem
demos = [x for i, x in enumerate(a) if i and a[i - 1] == "--demo"]
if demos:
    v1 = next(f for f in L["faixas"] if f["tipo"] == "video" and f["index"] == 0)["clipes"]
    from collections import Counter
    bruto = Counter(c["arquivo"] for c in v1).most_common(1)[0][0]   # o arquivo da maior parte da V1 = a gravação
    base_a = max(faixas["audio"]) + 1 if faixas["audio"] else 0
    for d in demos:
        partes = d.split("@")
        fonte, ini = os.path.abspath(os.path.expanduser(partes[0])), float(partes[1])
        dur = sondar(fonte)["dur"]
        if len(partes) > 2 and partes[2] not in ("", "-"):
            dur = min(dur, float(partes[2]) - ini)
        ganho = float(partes[3]) if len(partes) > 3 else 0.0
        n = 0
        for c in v1:
            if c["arquivo"] != bruto:
                continue
            s0, s1 = max(c["in"], ini), min(c["out"], ini + dur)
            if s1 - s0 < 1 / FPS:
                continue
            t0 = q(c["t0"] + s0 - c["in"])
            t1 = t0 + q(s1 - s0)
            i0 = q(s0 - ini)
            n += 1
            for k in (0, 1):
                cont[0] += 1
                cid = f"ci-{cont[0]}"
                nivel = 10 ** (ganho / 20)
                x = (f'<clipitem id="{cid}"><name>{escape(os.path.basename(fonte))}</name><enabled>TRUE</enabled>'
                     f"<duration>{int(sondar(fonte)['dur'] * FPS)}</duration>{RATE}<start>{t0}</start><end>{t1}</end><in>{i0}</in><out>{i0 + t1 - t0}</out>"
                     f"{arq(fonte)}<sourcetrack><mediatype>audio</mediatype><trackindex>{k + 1 if (sondar(fonte)['ch'] or 1) > 1 else 1}</trackindex></sourcetrack>"
                     "<filter><effect><name>Audio Levels</name><effectid>audiolevels</effectid><effectcategory>audiolevels</effectcategory>"
                     "<effecttype>audiolevels</effecttype><mediatype>audio</mediatype><parameter authoringApp=\"PremierePro\">"
                     f"<parameterid>level</parameterid><name>Level</name><valuemin>0</valuemin><valuemax>3.98109</valuemax>"
                     f"<value>{nivel:.5f}</value></parameter></effect></filter>{{LINKS}}</clipitem>")
                faixas["audio"].setdefault(base_a + k, []).append({"id": cid, "xml": x, "t0": t0 / FPS, "t1": t1 / FPS})
            print(f"demo {os.path.basename(fonte)}: {n}º pedaço na sequência em {int(t0 / FPS // 60)}:{t0 / FPS % 60:05.2f} "
                  f"({(t1 - t0) / FPS:.1f} s, fonte {i0 / FPS:.2f}s) → A{base_a + 1}/A{base_a + 2}, {ganho:+.1f} dB")
    for k in (0, 1):
        faixas["audio"].get(base_a + k, []).sort(key=lambda c: c["t0"])

# liga vídeo e áudio do mesmo trecho (mesmo início e fim na linha do tempo)
por_tempo = {}
for tipo in faixas:
    for k, lst in faixas[tipo].items():
        for n, c in enumerate(lst, 1):
            por_tempo.setdefault((q(c["t0"]), q(c["t1"])), []).append((c, tipo, k + 1, n))
for grupo in por_tempo.values():
    if len(grupo) > 1 and any(t == "video" for _, t, _, _ in grupo):
        links = "".join(f"<link><linkclipref>{c['id']}</linkclipref><mediatype>{t}</mediatype><trackindex>{k}</trackindex>"
                        f"<clipindex>{n}</clipindex></link>" for c, t, k, n in grupo)
        for c, _, _, _ in grupo:
            c["xml"] = c["xml"].replace("{LINKS}", links)

# trilha (um WAV pronto) em duas faixas novas
if opt("--musica"):
    partes = opt("--musica").split("@")
    pm, ini_m = os.path.abspath(partes[0]), float(partes[1])
    g_m = float(partes[2]) if len(partes) > 2 else 0.0
    sm = sondar(pm)
    base_m = max(faixas["audio"]) + 1
    for k in (0, 1):
        cont[0] += 1
        t0m, dm = q(ini_m), int(sm["dur"] * FPS)
        x = (f'<clipitem id="ci-{cont[0]}"><name>{escape(os.path.basename(pm))}</name><enabled>TRUE</enabled>'
             f"<duration>{dm}</duration>{RATE}<start>{t0m}</start><end>{t0m + dm}</end><in>0</in><out>{dm}</out>{arq(pm)}"
             f"<sourcetrack><mediatype>audio</mediatype><trackindex>{k + 1}</trackindex></sourcetrack>"
             + (f_nivel(g_m) if abs(g_m) > 0.05 else "") + "{LINKS}</clipitem>")
        faixas["audio"].setdefault(base_m + k, []).append({"id": f"ci-{cont[0]}", "xml": x, "t0": t0m / FPS, "t1": (t0m + dm) / FPS})
    print(f"trilha {os.path.basename(pm)} em A{base_m + 1}/A{base_m + 2} a partir de {ini_m:.2f}s")
if ENQ:
    print(f"enquadramento aplicado em {n_enq} clipes ({n_kf} com keyframes de zoom)")

fim = max(q(c["t1"]) for t in faixas.values() for lst in t.values() for c in lst)
mk = "".join(f"<marker><name>{escape(m['nome'])}</name><comment>{escape(m['comentario'])}</comment><in>{q(m['t'])}</in><out>-1</out></marker>"
             for m in L["marcadores"])


def trilha(lst):
    return "<track>" + "".join(c["xml"].replace("{LINKS}", "") for c in lst) + "<enabled>TRUE</enabled><locked>FALSE</locked></track>"


vid = "".join(trilha(faixas["video"][k]) for k in sorted(faixas["video"]))
aud = "".join(trilha(faixas["audio"][k]) for k in sorted(faixas["audio"]))
open(saida, "w").write(f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="4">
<sequence id="seq-1"><name>{escape(nome_seq)}</name><duration>{fim}</duration>{RATE}
<timecode>{RATE}<string>00:00:00:00</string><frame>0</frame><displayformat>NDF</displayformat></timecode>
{mk}
<media>
<video><format><samplecharacteristics>{RATE}<width>{W}</width><height>{H}</height><anamorphic>FALSE</anamorphic>
<pixelaspectratio>square</pixelaspectratio><fielddominance>none</fielddominance></samplecharacteristics></format>{vid}</video>
<audio><numOutputChannels>2</numOutputChannels><format><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate></samplecharacteristics></format>
{aud}</audio>
</media>
</sequence>
</xmeml>
""")
nv = sum(len(x) for x in faixas["video"].values())
print(f"{saida}: {W}x{H} {FPS} fps · {nv} clipes de vídeo · {fim / FPS / 60:.2f} min · V{len(faixas['video'])} A{len(faixas['audio'])} · "
      f"{len(L['marcadores'])} marcadores" + (f"\nAVISOS:\n  " + "\n  ".join(avisos) if avisos else ""))
