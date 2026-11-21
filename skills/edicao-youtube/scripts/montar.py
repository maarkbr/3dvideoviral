"""Monta a linha do tempo no projeto do CapCut a partir do edl.json + plano.json, e instala com segurança.

uso: python3 montar.py PASTA_TRABALHO [--so-montar]     (--so-montar: gera e valida, não grava no CapCut)
  lê   PASTA/edl.json, PASTA/palavras_tl.json, PASTA/plano.json, modelos.json (caminho no plano)
  grava PASTA/montado/draft.json, PASTA/montado/resumo.json e, sem --so-montar, instala no projeto
        (backup em <projeto>/_backup_claude/, cópia do que foi entregue em PASTA/entregue.json para o aprender.py)

plano.json:
{
 "projeto": "Nome do projeto no CapCut",
 "modelos": "/caminho/modelos.json",
 "canvas": {"width": 1920, "height": 1080},                       opcional (padrão: 16:9 1920x1080)
 "ajuste": {"saturation": 0.08, "contrast": 0.06, "shadow": -0.05}, opcional (precisa de modelo de ajuste)
 "fundo": "/caminho/fundo.png",                                     placa atrás das cenas em modo "centro"
 "cenas": [{"arquivo": "/abs/img.png", "frase": "primeiras palavras", "ate_frase": "...", "a": 12.3, "b": 15.0,
            "dur": 3.0, "modo": "cheia"|"centro"|"pip"|"livre", "escala": 0.8, "pos": [0, 0], "src": 0.0,
            "respiro": true, "pop": true, "nome": "logo do CapCut"}],
 "textos": [{"texto": "KLING 4.0", "frase": "...", "a":.., "b":.., "modelo": "titulo", "destaque": ["4.0"],
             "pos": [0, 0], "escala": 1.0, "maiusculas": false}],
 "legenda": {"modelo": "legenda", "max_palavras": 3, "max_chars": 16, "maiusculas": true,
             "destaques": ["palavra", ...] | "auto", "y": -0.72} | null,
 "cor_destaque": "#FFC400",
 "musica": [{"arquivo": "/abs/trilha.mp3", "a": 0, "b": 30, "abaixo_da_voz": 18, "src": 0, "fade_in": 1, "fade_out": 2}],
 "sfx": [{"arquivo": "/abs/whoosh.wav", "t": 12.3 | "frase": "...", "abaixo_da_voz": 8}]
}
"a"/"b" são segundos da EDIÇÃO; "frase" ancora na fala (sobrevive a recortes). Sem "b"/"ate_frase", usa "dur".
"modelo" de texto: um apelido de "apelidos" no modelos.json ("legenda", "titulo", "palavra"…) ou um id "t7".
"""
import copy, json, os, re, subprocess, sys, unicodedata

sys.path.insert(0, os.path.dirname(__file__))
import capcut as cc  # noqa: E402

wd = sys.argv[1]
SO_MONTAR = "--so-montar" in sys.argv
E = cc.load(f"{wd}/edl.json")
P = cc.load(f"{wd}/plano.json")
PW = [w for w in cc.load(f"{wd}/palavras_tl.json") if w["s"] is not None and w["e"] is not None]
T = cc.load(P["modelos"])
FPS = E["fps"]
TOTAL_S = E["total_frames"] / FPS
TOTAL = cc.f2us(E["total_frames"], FPS)
CW, CH = P.get("canvas", {}).get("width", 1920), P.get("canvas", {}).get("height", 1080)
AVISOS = []

proj = cc.ler(cc.achar(P["projeto"]))
skel = proj["draft"]
M = copy.deepcopy(skel["materials"])
for k in M:
    if isinstance(M[k], list):
        M[k] = []


# ---------- utilidades ----------
def add(kind, tmpl, **kw):
    o = copy.deepcopy(tmpl)
    o["id"] = cc.U()
    o.update(kw)
    M.setdefault(kind, []).append(o)
    return o["id"]


def refs(pairs, speed=None):
    out = []
    for kind, o in pairs:
        kw = {"speed": float(speed)} if (kind == "speeds" and speed is not None) else {}
        out.append(add(kind, o, **kw))
    return out


def kf(prop, pts):
    return {"id": cc.U(), "material_id": "", "property_type": prop,
            "keyframe_list": [{"id": cc.U(), "curveType": "Line", "time_offset": int(t), "left_control": {"x": 0.0, "y": 0.0},
                               "right_control": {"x": 0.0, "y": 0.0}, "values": [float(v)], "string_value": "",
                               "graphID": ""} for t, v in pts]}


def faixa(kind, flag=0, nome=""):
    return {"id": cc.U(), "type": kind, "flag": flag, "attribute": 0, "name": nome, "is_default_name": not nome,
            "segments": []}


norm = lambda s: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKD", s.lower()).encode("ascii", "ignore").decode())
TOK = [norm(w["w"]) for w in PW]


TEXTO, DONO = "", []          # fala editada como uma string só, e de qual palavra é cada letra
for k, t in enumerate(TOK):
    TEXTO += t
    DONO += [k] * len(t)


def achar_frase(fr, depois=0.0):
    """Acha a frase na fala editada. Tolera uma palavra faltando (palavra que caiu na borda de um corte)."""
    alvo = [norm(x) for x in fr.split() if norm(x)]
    tentativas = [alvo] + ([alvo[:k] + alvo[k + 1:] for k in range(len(alvo))] if len(alvo) >= 3 else [])
    for tent in tentativas:
        s = "".join(tent)
        p = TEXTO.find(s)
        while p >= 0:
            i0, i1 = DONO[p], DONO[p + len(s) - 1]
            if PW[i0]["s"] >= depois - 0.01:
                return i0, i1
            p = TEXTO.find(s, p + 1)
    raise SystemExit(f"frase não encontrada na fala editada: '{fr}' (veja palavras_tl.json)")


def janela(it, dur_padrao=3.0, lead=0.08):
    if "frase" in it:
        i0, i1 = achar_frase(it["frase"], it.get("depois", 0.0))
        a = max(0.0, PW[i0]["s"] - lead)
    else:
        a, i1 = float(it["a"]), None
    if "ate_frase" in it:
        _, j1 = achar_frase(it["ate_frase"], a)
        b = PW[j1]["e"] + 0.15
    elif "b" in it:
        b = float(it["b"])
    else:
        b = a + float(it.get("dur", dur_padrao))
    return a, min(b, TOTAL_S)


CORTES = E["cortes_tl"]


def colar_nos_cortes(a, b, thr=0.4):
    """Sem 'piscada' da tela: cena que começa logo depois de um corte começa NO corte; que termina logo antes, estica."""
    antes = [c for c in CORTES if c <= a + 0.01]
    if antes and 0.01 < a - antes[-1] < thr:
        a = antes[-1]
    depois = [c for c in CORTES if c >= b - 0.01]
    if depois and 0.01 < depois[0] - b < thr:
        b = depois[0]
    return a, b


def lufs(path, t0=None, dur=None):
    cmd = ["ffmpeg", "-nostats"] + (["-ss", str(t0)] if t0 else []) + (["-t", str(dur)] if dur else []) + \
          ["-i", path, "-vn", "-af", "ebur128", "-f", "null", "-"]
    r = subprocess.run(cmd, capture_output=True, text=True)
    v = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
    return float(v[-1]) if v else -20.0


def hex_rgb(h):
    h = h.lstrip("#")
    return [round(int(h[i:i + 2], 16) / 255, 3) for i in (0, 2, 4)]


DEST = hex_rgb(P.get("cor_destaque", "#FFC400"))


# ---------- segmentos de vídeo/imagem ----------
def vseg(mid, src_us, dur_us, tl_us, vol, escala=1.0, pos=(0.0, 0.0), kfs=None, speed=1.0):
    s = copy.deepcopy(T["video_segment"])
    s.update({"id": cc.U(), "material_id": mid, "extra_material_refs": refs(T["video_refs"], speed=speed),
              "source_timerange": {"start": src_us, "duration": int(round(dur_us * speed))},
              "target_timerange": {"start": tl_us, "duration": dur_us}, "speed": float(speed),
              "volume": float(vol), "last_nonzero_volume": 1.0, "keyframe_refs": [], "render_index": 0,
              "track_render_index": 0, "visible": True})
    s["clip"] = {"scale": {"x": escala, "y": escala}, "rotation": 0.0, "transform": {"x": pos[0], "y": pos[1]},
                 "flip": {"vertical": False, "horizontal": False}, "alpha": 1.0}
    s["uniform_scale"] = {"on": True, "value": 1.0}
    s["common_keyframes"] = []
    if kfs:   # [(segundos desde o início do clipe, escala, x, y)] — tempo do keyframe = tempo da FONTE
        fim = src_us + s["source_timerange"]["duration"] - cc.f2us(1, FPS)
        pt = lambda t: max(src_us, min(fim, src_us + cc.us(max(0.0, t) * speed)))
        s["common_keyframes"] = [kf("KFTypeScaleX", [(pt(t), e) for t, e, _, _ in kfs]),
                                 kf("KFTypePositionX", [(pt(t), x) for t, _, x, _ in kfs]),
                                 kf("KFTypePositionY", [(pt(t), y) for t, _, _, y in kfs])]
    return s


def material_video(path, foto=False):
    w, h, d, aud = cc.sondar(path)
    if foto:
        return add("videos", T["photo_material"], path=path, material_name=os.path.basename(path), width=w, height=h,
                   unique_id="", local_material_id="", media_path="", type="photo"), w, h, None
    return add("videos", T["video_material"], path=path, material_name=os.path.basename(path), width=w, height=h,
               duration=cc.us(d), has_audio=aud, unique_id="", local_material_id="", media_path=""), w, h, d


# 1) faixa principal: o bruto cortado, com zooms
cam = E["video"]
cw_, ch_, cdur, _ = cc.sondar(cam)
principal = faixa("video")
if E.get("intro"):               # intro pronta (HyperFrames) no começo, com o som dela (voz + efeitos + trilha)
    mid_i, _, _, _ = material_video(E["intro"]["arquivo"])
    principal["segments"].append(vseg(mid_i, 0, cc.f2us(E["intro"]["frames"], FPS), 0, 1.0))
for c in E["clips"]:
    tl_us = cc.f2us(c["tl0"], FPS)
    dur_us = cc.f2us(c["tl1"], FPS) - tl_us
    src_us = cc.f2us(c["src0"], FPS)
    mid = add("videos", T["video_material"], path=cam, material_name=os.path.basename(cam), width=cw_, height=ch_,
              duration=cc.us(cdur), has_audio=True, unique_id="", local_material_id="", media_path="")
    t0 = c["tl0"] / FPS
    kfs = [(k[0] - t0, k[1], k[2], k[3]) for k in c.get("kf", [])]
    principal["segments"].append(vseg(mid, src_us, dur_us, tl_us, 1.0, escala=c.get("escala", 1.0), kfs=kfs or None,
                                      speed=c.get("vel", 1.0)))
faixas = [principal]

# 2) camada de ajuste (cor) logo acima da principal: cenas por cima mantêm a cor original
if P.get("ajuste"):
    if "adjust_segment" in T:
        adj = dict(copy.deepcopy(T["adjust_track"]), id=cc.U(), segments=[])
        s = copy.deepcopy(T["adjust_segment"])
        rr = []
        for kind, o in T["adjust_refs"]:
            if kind == "effects":
                if o.get("type") in P["ajuste"]:
                    rr.append(add("effects", o, value=float(P["ajuste"][o["type"]])))
            else:
                rr.append(add(kind, o))
        s.update({"id": cc.U(), "material_id": add("placeholders", T["adjust_placeholder"]), "extra_material_refs": rr,
                  "target_timerange": {"start": 0, "duration": TOTAL}, "keyframe_refs": [], "common_keyframes": []})
        adj["segments"].append(s)
        faixas.append(adj)
    else:
        AVISOS.append("sem modelo de camada de ajuste: cor não aplicada (faça uma no projeto de modelos)")

# 3) cenas (imagens, b-rolls, motion graphics) em faixas que não se sobrepõem
cenas = []
for k, it in enumerate(P.get("cenas", [])):
    a, b = janela(it)
    if it.get("colar", True):
        a, b = colar_nos_cortes(a, b)
    cenas.append(dict(it, a=a, b=b, nome=it.get("nome", f"cena {k + 1}")))
cenas.sort(key=lambda x: x["a"])
fx_placa, fx_cenas = [], []


def encaixar(lista_faixas, a, b, flag=2):
    for f in lista_faixas:
        if all(b <= s["_a"] - 1e-3 or a >= s["_b"] + 1e-3 for s in f["_ocup"]):
            return f
    f = faixa("video", flag)
    f["_ocup"] = []
    lista_faixas.append(f)
    return f


resumo_cenas = []
for c in cenas:
    path = c["arquivo"]
    if not os.path.exists(path):
        raise SystemExit(f"arquivo de cena não existe: {path}")
    foto = os.path.splitext(path)[1].lower() in (".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif")
    mid, w, h, d = material_video(path, foto)
    a_us, b_us = cc.us(c["a"]), cc.us(c["b"])
    if not foto:
        b_us = min(b_us, a_us + cc.us(d - c.get("src", 0.0)) - cc.f2us(1, FPS))
    dur_us = b_us - a_us
    if dur_us <= cc.f2us(3, FPS):
        AVISOS.append(f"cena curta demais, pulada: {c['nome']}")
        continue
    modo = c.get("modo", "centro")
    cobre = max((CW / CH) / (w / h), (w / h) / (CW / CH))     # escala 1 = caber; isto = cobrir
    if modo == "cheia":
        e0 = cobre
    elif modo == "centro":
        e0 = float(c.get("escala", 0.78))
    elif modo == "pip":
        e0 = float(c.get("escala", 0.42))
    else:
        e0 = float(c.get("escala", 1.0))
    pos = c.get("pos", [0.0, 0.0] if modo != "pip" else [0.52, 0.42])
    dur_s = dur_us / 1e6
    kfs = []
    if c.get("pop", modo != "cheia"):
        kfs += [(0.0, e0 * 0.92, pos[0], pos[1]), (min(0.22, dur_s / 4), e0 * 1.0, pos[0], pos[1])]
    else:
        kfs += [(0.0, e0, pos[0], pos[1])]
    if c.get("respiro", True):
        kfs += [(dur_s - 1 / FPS, e0 * (1 + min(0.06, 0.012 * dur_s)), pos[0], pos[1])]
    if modo == "centro" and P.get("fundo"):
        pm, _, _, _ = material_video(P["fundo"], True)
        f = encaixar(fx_placa, c["a"], c["b"])
        f["segments"].append(vseg(pm, 0, dur_us, a_us, 0.0, escala=1.0))
        f["_ocup"].append({"_a": c["a"], "_b": c["b"]})
    f = encaixar(fx_cenas, c["a"], c["b"])
    f["segments"].append(vseg(mid, cc.us(c.get("src", 0.0)) if not foto else 0, dur_us, a_us, 0.0, escala=e0, pos=pos,
                              kfs=kfs if len(kfs) > 1 else None))
    f["_ocup"].append({"_a": c["a"], "_b": c["b"]})
    resumo_cenas.append((round(c["a"], 2), round(b_us / 1e6, 2), modo, c["nome"]))
faixas += fx_placa + fx_cenas

# 4) textos (títulos, palavras grandes) e legenda, clonados dos modelos do Lucas
APELIDOS = T.get("apelidos", {})
TXT = {t["id"]: t for t in T.get("textos", [])}


def modelo_texto(nome):
    tid = APELIDOS.get(nome, nome)
    if tid not in TXT:
        raise SystemExit(f"modelo de texto '{nome}' não existe no modelos.json (apelidos: {APELIDOS})")
    return TXT[tid]


def u16(s):
    return len(s.encode("utf-16-le")) // 2


def conteudo(tm, texto, destaques, maius):
    base = json.loads(tm["material"]["content"])
    st0 = copy.deepcopy((base.get("styles") or [{}])[0])
    if maius:
        texto = texto.upper()
    marcas = [False] * len(texto)
    for d in destaques or []:
        dd = d.upper() if maius else d
        for m in re.finditer(re.escape(dd), texto):
            for k in range(m.start(), m.end()):
                marcas[k] = True
    styles, i = [], 0
    while i < len(texto):
        j = i
        while j < len(texto) and marcas[j] == marcas[i]:
            j += 1
        st = copy.deepcopy(st0)
        st["range"] = [u16(texto[:i]), u16(texto[:j])]
        if marcas[i]:
            st["fill"] = {"content": {"render_type": "solid", "solid": {"color": DEST}}}
        styles.append(st)
        i = j
    return json.dumps({"text": texto, "styles": styles}, ensure_ascii=False)


def tseg(tm, texto, a, b, destaques=None, maius=False, pos=None, escala=None):
    mat = copy.deepcopy(tm["material"])
    mid = add("texts", mat, content=conteudo(tm, texto, destaques, maius))
    s = copy.deepcopy(tm["segment"])
    dur = cc.us(b - a)
    rr = []
    for kind, o in tm["refs"]:
        o = copy.deepcopy(o)
        if kind == "material_animations":
            for an in o.get("animations", []):
                an["duration"] = int(min(an["duration"], dur * 0.45))
                if an.get("type") == "out":
                    an["start"] = dur - an["duration"]
        rr.append(add(kind, o))
    s.update({"id": cc.U(), "material_id": mid, "extra_material_refs": rr,
              "target_timerange": {"start": cc.us(a), "duration": dur}, "keyframe_refs": [], "common_keyframes": []})
    if s.get("source_timerange"):
        s["source_timerange"] = {"start": 0, "duration": dur}
    if pos is not None:
        s["clip"]["transform"] = {"x": float(pos[0]), "y": float(pos[1])}
    if escala is not None:
        s["clip"]["scale"] = {"x": float(escala), "y": float(escala)}
    return s


fx_textos = []
for it in P.get("textos", []):
    a, b = janela(it, dur_padrao=2.0)
    tm = modelo_texto(it.get("modelo", "titulo"))
    f = encaixar(fx_textos, a, b, flag=0)
    f["type"] = "text"
    f["segments"].append(tseg(tm, it["texto"], a, b, it.get("destaque"), it.get("maiusculas", False), it.get("pos"),
                              it.get("escala")))
    f["_ocup"].append({"_a": a, "_b": b})

PARADAS = set("a o e é de da do das dos em no na nos nas um uma uns umas que pra para por com se eu você voce isso "
              "esse essa aqui ali lá la tá ta né ne vai vou ao aos as os mas mais muito já ja então entao tipo "
              "também tambem como quando onde ele ela eles elas meu minha seu sua nosso não nao sim só so".split())
leg = P.get("legenda")
n_leg = 0
if leg:
    tm = modelo_texto(leg.get("modelo", "legenda"))
    fl = faixa("text")
    grupos, g = [], []
    maxp, maxc = leg.get("max_palavras", 3), leg.get("max_chars", 16)
    for k, w in enumerate(PW):
        txt = w["w"].strip()
        quebra = g and (len(g) >= maxp or len(" ".join(x["w"] for x in g + [w])) > maxc or w["s"] - g[-1]["e"] > 0.25
                        or re.search(r"[.!?,;:]$", g[-1]["w"]))
        if quebra:
            grupos.append(g)
            g = []
        if txt:
            g.append(w)
    if g:
        grupos.append(g)
    lista = leg.get("destaques", "auto")
    ultimo_dest = -9
    for k, g in enumerate(grupos):
        a = g[0]["s"]
        b = grupos[k + 1][0]["s"] if k + 1 < len(grupos) else g[-1]["e"] + 0.3
        b = min(b, g[-1]["e"] + 0.6, TOTAL_S)
        if b - a < 0.08:
            continue
        texto = re.sub(r"[.,;:]+$", "", " ".join(x["w"].strip() for x in g))
        dest = []
        if lista == "auto":
            cands = [re.sub(r"[^\wÀ-ú]", "", x["w"]) for x in g]
            cands = [c for c in cands if len(c) >= 6 and c.lower() not in PARADAS]
            if cands and k - ultimo_dest >= 2:
                dest = [max(cands, key=len)]
                ultimo_dest = k
        else:
            dest = [d for d in lista if norm(d) in [norm(x["w"]) for x in g]]
        fl["segments"].append(tseg(tm, texto, a, b, dest, leg.get("maiusculas", True),
                                   [0.0, leg["y"]] if "y" in leg else None))
        n_leg += 1
    fx_textos.append(fl)
faixas += fx_textos

# 5) música e efeitos sonoros (volumes relativos ao volume da voz)
voz = lufs(cam, E["clips"][0]["src0"] / FPS, min(120, TOTAL_S))


def aseg(path, a, b, src, vol, fin=0.0, fout=0.0):
    _, _, d, _ = cc.sondar(path)
    src_us = cc.us(src)
    dur_us = min(cc.us(b - a), cc.us(d) - src_us - cc.f2us(1, FPS))
    aid = add("audios", T["audio_material"], name=os.path.basename(path), path=path, duration=cc.us(d), unique_id="",
              local_material_id="", type="music" if T["audio_material"].get("type") == "music" else T["audio_material"].get("type"))
    rr = []
    tem_fade = False
    for kind, o in T["audio_refs"]:
        if kind == "audio_fades":
            tem_fade = True
            rr.append(add(kind, o, fade_in_duration=cc.us(fin), fade_out_duration=cc.us(fout)))
        else:
            rr.append(add(kind, o, **({"speed": 1.0} if kind == "speeds" else {})))
    if (fin or fout) and not tem_fade:   # formato do audio_fade do CapCut (o mesmo do pyJianYingDraft)
        rr.append(add("audio_fades", {"fade_in_duration": cc.us(fin), "fade_out_duration": cc.us(fout),
                                      "fade_type": 0, "type": "audio_fade"}))
        if "fade sintético" not in " ".join(AVISOS):
            AVISOS.append("fade sintético na música (sem modelo com fade): confira o fade no CapCut")
    s = copy.deepcopy(T["audio_segment"])
    s.update({"id": cc.U(), "material_id": aid, "extra_material_refs": rr, "source_timerange": {"start": src_us, "duration": dur_us},
              "target_timerange": {"start": cc.us(a), "duration": dur_us}, "volume": round(vol, 5), "last_nonzero_volume": 1.0,
              "speed": 1.0, "keyframe_refs": [], "common_keyframes": [], "render_index": 0})
    return s


fx_aud = []
cache_lufs = {}
for m in P.get("musica", []):
    a, b = janela(m, dur_padrao=TOTAL_S)
    l = cache_lufs.setdefault(m["arquivo"], lufs(m["arquivo"]))
    vol = 10 ** (((voz - m.get("abaixo_da_voz", 18)) - l) / 20)
    f = encaixar(fx_aud, a, b, flag=0)
    f["type"] = "audio"
    f["segments"].append(aseg(m["arquivo"], a, b, m.get("src", 0.0), vol, m.get("fade_in", 1.0), m.get("fade_out", 2.0)))
    f["_ocup"].append({"_a": a, "_b": b})
fx_sfx = []
for x in P.get("sfx", []):
    a = janela(x, dur_padrao=1)[0] if "frase" in x else float(x["t"])
    _, _, d, _ = cc.sondar(x["arquivo"])
    b = min(a + min(d, x.get("dur", d)), TOTAL_S)
    l = cache_lufs.setdefault(x["arquivo"], lufs(x["arquivo"]))
    vol = min(4.0, 10 ** (((voz - x.get("abaixo_da_voz", 8)) - l) / 20))
    f = encaixar(fx_sfx, a, b, flag=0)
    f["type"] = "audio"
    f["segments"].append(aseg(x["arquivo"], a, b, 0.0, vol))
    f["_ocup"].append({"_a": a, "_b": b})
faixas += fx_aud + fx_sfx

# ---------- fecha o draft ----------
ri = 0
for i, tr in enumerate(faixas):
    tr.pop("_ocup", None)
    tr["segments"].sort(key=lambda s: s["target_timerange"]["start"])
    for s in tr["segments"]:
        s["track_render_index"] = i
        if tr["type"] == "video" and tr["flag"] == 2:
            s["render_index"] = i
        if tr["type"] == "text":
            ri += 1
            s["render_index"] = 14000 + ri
D = copy.deepcopy(skel)
D.update(tracks=faixas, materials=M, duration=TOTAL, fps=float(FPS))
D["canvas_config"] = dict(D.get("canvas_config") or {}, ratio="16:9" if CW * 9 == CH * 16 else "original", width=CW, height=CH)
D["keyframes"] = {k: [] for k in (skel.get("keyframes") or {})}
cc.validar(D)

os.makedirs(f"{wd}/montado", exist_ok=True)
cc.save(f"{wd}/montado/draft.json", D, compacto=True)
resumo = {"duracao": round(TOTAL_S, 2), "voz_lufs": voz, "faixas": [(t["type"], t["flag"], len(t["segments"])) for t in faixas],
          "cenas": resumo_cenas, "legendas": n_leg, "avisos": AVISOS}
cc.save(f"{wd}/montado/resumo.json", resumo)
print(f"montado: {TOTAL_S:.1f}s · faixas {resumo['faixas']} · {len(resumo_cenas)} cenas · {n_leg} legendas")
for a in AVISOS:
    print("AVISO:", a)
if not SO_MONTAR:
    r = cc.instalar(proj, D, etapa="montagem", snapshot=f"{wd}/entregue.json")
    print(f"instalado em '{P['projeto']}' · {len(r['gravados'])} cópias · backup {r['backup']}")
    print("Abra o CapCut e clique no projeto. Se algum arquivo aparecer vermelho, use 'reconectar mídia'.")
