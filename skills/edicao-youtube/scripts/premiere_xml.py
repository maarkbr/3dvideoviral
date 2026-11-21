"""Leva os cortes (edl.json) para o Premiere Pro: grava um XML (FCP7 / xmeml) que o Premiere importa
(Arquivo → Importar), com a sequência já cortada, para o Lucas terminar a decupagem lá.

uso: python3 premiere_xml.py PASTA_TRABALHO SAIDA.xml [--nome "Sequência"] [--intro intro.mov]
        [--stem efeitos.wav --stem trilha.wav ...] [--extra video.mp4@SEGUNDOS_RAW]
        [--audio audio_do_bruto_melhorado.wav] [--marca SEGUNDOS_RAW "texto" ...] [--marca-ed SEGUNDOS_NA_EDIÇÃO "texto" ...]

- Resolução: a que QUEM EDITA escolheu (--resolucao fullhd|2k|4k, ou "resolucao" no job.json; sem escolha, Full HD —
  o mínimo; ver resolucao.py). fps da gravação (≥ 50 → 60, senão 30), ou --fps. Intro em 2K/4K: renderize em 4K.
  O bruto entra escalado para caber no quadro.
- V1: a intro pronta (se houver) e depois os clipes da gravação; A1/A2: canal esquerdo/direito da gravação
  (e da voz da intro, se --voz-intro). Cada --stem vira mais um par de faixas (estéreo em L/R), a partir do 0.
- --extra: vídeo extra em V2, DESATIVADO, posto onde o trecho SEGUNDOS_RAW do bruto caiu na edição
  (ex.: o vídeo final pronto para cobrir a tela onde ele aparece tocando sem som).
- --marca: marcador na sequência no ponto em que o segundo SEGUNDOS_RAW do bruto caiu (trechos para conferir).
Tudo em quadros de 30 fps; o Premiere converte pelo tempo, então bruto em 60 fps funciona.
"""
import json, os, subprocess, sys, urllib.parse
from xml.sax.saxutils import escape

a = sys.argv[1:]
wd, saida = a[0], a[1]
def opt(nome, padrao=None):
    return a[a.index(nome) + 1] if nome in a else padrao
def opts(nome, n=1):
    r = []
    for i, x in enumerate(a):
        if x == nome:
            r.append(a[i + 1] if n == 1 else tuple(a[i + 1:i + 1 + n]))
    return r

E = json.load(open(f"{wd}/edl.json"))
FPS = 30
assert E["fps"] == FPS, "edl.json precisa estar em 30 fps"
nome_seq = opt("--nome", "Edição Claude")
intro = opt("--intro")
voz_intro = opt("--voz-intro")
stems = opts("--stem")
extras = opts("--extra")
marcas = opts("--marca", 2)
marcas_ed = opts("--marca-ed", 2)   # segundos na gravação JÁ cortada (o tempo do qa_transcricao.txt)


def sondar(p):
    o = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height,channels,r_frame_rate",
                                   "-of", "json", p], capture_output=True, text=True).stdout)
    v = next((s for s in o["streams"] if s["codec_type"] == "video"), None)
    au = next((s for s in o["streams"] if s["codec_type"] == "audio"), None)
    fr = v and v.get("r_frame_rate", "0/1").split("/")
    return {"dur": float(o["format"]["duration"]), "w": v and v["width"], "h": v and v["height"], "ch": au and au["channels"],
            "fps": v and int(fr[0]) / max(1, int(fr[1]))}


_sb = sondar(E["video"])
SEQ = int(opt("--fps", 60 if (_sb["fps"] or 0) >= 50 else 30))       # fps da sequência (o edl é em 30)
assert SEQ % FPS == 0, "--fps tem que ser múltiplo de 30"
K = SEQ // FPS
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from resolucao import resolucao  # noqa: E402
W, H = resolucao(opt("--resolucao"), wd)


arquivos = {}
def arq(p):
    """devolve (id, xml do <file>) — completo na 1ª vez, só a referência depois."""
    p = os.path.abspath(p)
    if p in arquivos:
        return f'<file id="{arquivos[p]["id"]}"/>'
    s = sondar(p)
    fid = f"file-{len(arquivos) + 1}"
    arquivos[p] = {"id": fid, **s}
    url = "file://localhost" + urllib.parse.quote(p)
    mv = (f"<video><samplecharacteristics><rate><timebase>{SEQ}</timebase><ntsc>FALSE</ntsc></rate><width>{s['w']}</width>"
          f"<height>{s['h']}</height><pixelaspectratio>square</pixelaspectratio></samplecharacteristics></video>") if s["w"] else ""
    ma = (f"<audio><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate></samplecharacteristics>"
          f"<channelcount>{s['ch']}</channelcount></audio>") if s["ch"] else ""
    return (f'<file id="{fid}"><name>{escape(os.path.basename(p))}</name><pathurl>{url}</pathurl>'
            f"<rate><timebase>{SEQ}</timebase><ntsc>FALSE</ntsc></rate><duration>{int(s['dur'] * SEQ)}</duration>"
            f"<media>{mv}{ma}</media></file>")


RATE = f"<rate><timebase>{SEQ}</timebase><ntsc>FALSE</ntsc></rate>"
faixas_v = {1: [], 2: []}
faixas_a = {}
cont = [0]


def item(tipo, faixa, p, t0, t1, i0, i1, escala=None, canal=None, ligados=None, ativo=True):
    cont[0] += 1
    cid = f"ci-{cont[0]}"
    dur = int(sondar(p)["dur"] * SEQ) if p not in arquivos else int(arquivos[os.path.abspath(p)]["dur"] * SEQ)
    x = (f'<clipitem id="{cid}"><name>{escape(os.path.basename(p))}</name><enabled>{"TRUE" if ativo else "FALSE"}</enabled>'
         f"<duration>{dur}</duration>{RATE}<start>{t0}</start><end>{t1}</end><in>{i0}</in><out>{i1}</out>{arq(p)}")
    if tipo == "audio":
        x += f"<sourcetrack><mediatype>audio</mediatype><trackindex>{canal}</trackindex></sourcetrack>"
    if escala and abs(escala - 100) > 0.01:
        x += ("<filter><effect><name>Basic Motion</name><effectid>basic</effectid><effectcategory>motion</effectcategory>"
              "<effecttype>motion</effecttype><mediatype>video</mediatype><parameter authoringApp=\"PremierePro\">"
              f"<parameterid>scale</parameterid><name>Scale</name><valuemin>0</valuemin><valuemax>1000</valuemax><value>{escala:.3f}</value>"
              "</parameter></effect></filter>")
    x += "{LINKS}</clipitem>"
    alvo = faixas_v[faixa] if tipo == "video" else faixas_a.setdefault(faixa, [])
    alvo.append({"id": cid, "xml": x, "tipo": tipo, "faixa": faixa, "ligados": ligados})
    return cid, len(alvo)


def ligar(grupo):
    """grupo: lista de (id, tipo, faixa, índice) — cada item recebe <link> para todos."""
    links = "".join(f"<link><linkclipref>{i}</linkclipref><mediatype>{t}</mediatype><trackindex>{f}</trackindex>"
                    f"<clipindex>{n}</clipindex></link>" for i, t, f, n in grupo)
    for i, t, f, n in grupo:
        lst = faixas_v[f] if t == "video" else faixas_a[f]
        lst[n - 1]["xml"] = lst[n - 1]["xml"].replace("{LINKS}", links)


bruto = E["video"]
audio_bruto = opt("--audio", bruto)   # ex.: o áudio do bruto inteiro melhorado no Adobe Podcast (mesma duração)
sb = sondar(bruto)
esc = min(W / sb["w"], H / sb["h"]) * 100
D0 = 0
if intro:
    si = sondar(intro)
    D0 = int(round(si["dur"] * SEQ))
    v = item("video", 1, intro, 0, D0, 0, D0, escala=min(W / si["w"], H / si["h"]) * 100)
    grupo = [(v[0], "video", 1, v[1])]
    if voz_intro:
        for c in (1, 2):
            r = item("audio", c, voz_intro, 0, D0, 0, D0, canal=c)
            grupo.append((r[0], "audio", c, r[1]))
    ligar(grupo)
    for k, st in enumerate(stems):
        ds = int(round(sondar(st)["dur"] * SEQ))
        for c in (1, 2):
            item("audio", 2 + 2 * k + c, st, 0, min(ds, D0), 0, min(ds, D0), canal=c)
            faixas_a[2 + 2 * k + c][-1]["xml"] = faixas_a[2 + 2 * k + c][-1]["xml"].replace("{LINKS}", "")

# edl.json já reserva o começo para a intro quando há "intro_pronta"; aqui a gravação vem logo depois da intro
base = E["clips"][0]["tl0"] if E["clips"] else 0
mapa = []
for c in E["clips"]:
    t0 = D0 + (c["tl0"] - base) * K
    t1 = D0 + (c["tl1"] - base) * K
    i0 = c["src0"] * K
    i1 = i0 + (c["tl1"] - c["tl0"]) * K
    mapa.append((c["src0"], c["src1"], t0))
    v = item("video", 1, bruto, t0, t1, i0, i1, escala=esc)
    g = [(v[0], "video", 1, v[1])]
    for ch in (1, 2):
        r = item("audio", ch, audio_bruto, t0, t1, i0, i1, canal=ch)
        g.append((r[0], "audio", ch, r[1]))
    ligar(g)
fim = mapa[-1][2] + (E["clips"][-1]["tl1"] - E["clips"][-1]["tl0"]) * K if mapa else D0


def raw_tl(seg):
    f = seg * FPS
    for s0, s1, t0 in mapa:
        if f < s1:
            return t0 + max(0, int((f - s0) * K))
    return fim


ultima_a = max(faixas_a) if faixas_a else 2
for k, ex in enumerate(extras):
    p, seg = ex.rsplit("@", 1)
    t0 = raw_tl(float(seg))
    se = sondar(p)
    d = int(se["dur"] * SEQ)
    v = item("video", 2, p, t0, t0 + d, 0, d, escala=min(W / se["w"], H / se["h"]) * 100, ativo=False)
    g = [(v[0], "video", 2, v[1])]
    if se["ch"]:
        for c in (1, 2):
            fa = ultima_a + 2 * k + c
            r = item("audio", fa, p, t0, t0 + d, 0, d, canal=c, ativo=False)
            g.append((r[0], "audio", fa, r[1]))
    ligar(g)

mk = "".join(f"<marker><name>{escape(txt)}</name><comment>{escape(txt)}</comment><in>{raw_tl(float(seg))}</in><out>-1</out></marker>"
             for seg, txt in marcas)
mk += "".join(f"<marker><name>{escape(txt)}</name><comment>{escape(txt)}</comment><in>{D0 + int(float(seg) * SEQ)}</in><out>-1</out></marker>"
              for seg, txt in marcas_ed)


def trilha(itens, extra=""):
    return "<track>" + "".join(i["xml"].replace("{LINKS}", "") for i in itens) + f"{extra}<enabled>TRUE</enabled><locked>FALSE</locked></track>"


vid = "".join(trilha(faixas_v[f]) for f in sorted(faixas_v) if faixas_v[f])
aud = "".join(trilha(faixas_a[f]) for f in sorted(faixas_a))
xml = f"""<?xml version="1.0" encoding="UTF-8"?>
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
"""
open(saida, "w").write(xml)
print(f"{saida}: {len(E['clips'])} clipes da gravação · {W}x{H} {SEQ} fps · {fim / SEQ / 60:.1f} min · V{len([f for f in faixas_v if faixas_v[f]])} A{len(faixas_a)} · {len(marcas)} marcadores")
