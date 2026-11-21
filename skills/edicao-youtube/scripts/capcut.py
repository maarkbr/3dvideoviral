"""Biblioteca do CapCut: achar projeto, ler, colher modelos dos projetos do próprio Lucas, validar e instalar.

Ideia (aprendida com a skill capcut-talking-head-edit do Matt Loui e adaptada): o CapCut desktop internacional
salva cada projeto como JSON aberto. Dá para montar a linha do tempo escrevendo esse JSON direto, sem abrir o
CapCut, desde que:
  1. o CapCut esteja FECHADO na hora de gravar (ele sobrescreve o arquivo quando fecha);
  2. cada objeto seja clonado de um que o próprio CapCut do Lucas já escreveu (nada de inventar campo);
  3. as seis cópias da linha do tempo sejam gravadas (raiz e Timelines/<id>: .json, .bak e template-2.tmp);
  4. haja backup antes de gravar e conferência de md5 depois.

Uso como linha de comando:
  python3 capcut.py listar                         projetos (nome, pasta, duração, faixas)
  python3 capcut.py aberto                         diz se o CapCut está aberto (código 1 se estiver)
  python3 capcut.py midia "<projeto>"              arquivos no painel de mídia do projeto
  python3 capcut.py colher saida.json "<proj>"...  colhe modelos de objetos de projetos do Lucas
"""
import copy, glob, hashlib, json, os, shutil, subprocess, sys, time, uuid

# pasta dos projetos do CapCut: Mac, Windows, ou a que a pessoa disser (CAPCUT_PROJETOS)
RAIZ = os.environ.get("CAPCUT_PROJETOS") or (
    os.path.join(os.environ.get("LOCALAPPDATA", ""), "CapCut", "User Data", "Projects", "com.lveditor.draft")
    if sys.platform.startswith("win") else os.path.expanduser("~/Movies/CapCut/User Data/Projects/com.lveditor.draft"))
NOMES = ("draft_info.json", "draft_content.json")


# ---------- tempo e ids ----------
def U():
    return str(uuid.uuid4()).upper()


def us(seg):
    """segundos -> microssegundos (inteiro, como o CapCut guarda)."""
    return int(round(seg * 1_000_000))


def fr(t, fps):
    return int(round(t * fps))


def f2us(frames, fps):
    return int(frames * 1_000_000 // fps)


def load(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def save(p, obj, compacto=False):
    os.makedirs(os.path.dirname(os.path.abspath(p)) or ".", exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        if compacto:
            f.write(json.dumps(obj, ensure_ascii=False, separators=(",", ":")))
        else:
            json.dump(obj, f, ensure_ascii=False, indent=1)


def runs(mask):
    """[(ini, fim)) dos trechos onde mask é True."""
    out, i, n = [], 0, len(mask)
    while i < n:
        if mask[i]:
            j = i
            while j < n and mask[j]:
                j += 1
            out.append((i, j))
            i = j
        else:
            i += 1
    return out


def sondar(path):
    """(largura, altura, duração em s, tem_audio) via ffprobe. Imagem: duração None."""
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height:format=duration",
                        "-of", "json", path], capture_output=True, text=True)
    j = json.loads(r.stdout or "{}")
    w = h = None
    aud = False
    for s in j.get("streams", []):
        if s.get("codec_type") == "video" and w is None:
            w, h = s.get("width"), s.get("height")
        if s.get("codec_type") == "audio":
            aud = True
    d = j.get("format", {}).get("duration")
    ext = os.path.splitext(path)[1].lower()
    if ext in (".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"):
        d = None
    return w, h, (float(d) if d else None), aud


# ---------- projetos ----------
def capcut_aberto():
    r = subprocess.run(["pgrep", "-x", "CapCut"], capture_output=True, text=True)
    return bool(r.stdout.strip())


def projetos():
    out = []
    for d in sorted(glob.glob(RAIZ + "/*/")):
        try:
            meta = load(d + "draft_meta_info.json")
        except Exception:
            continue
        out.append({"nome": meta.get("draft_name"), "pasta": d.rstrip("/"), "meta": meta})
    return out


def achar(nome):
    """Pasta do projeto pelo draft_name (a pasta pode ter outro nome)."""
    achados = [p for p in projetos() if (p["nome"] or "").strip().lower() == nome.strip().lower()]
    if not achados:
        raise SystemExit(f"Projeto '{nome}' não encontrado. Rode: capcut.py listar")
    if len(achados) > 1:
        raise SystemExit(f"Há {len(achados)} projetos chamados '{nome}': {[a['pasta'] for a in achados]}")
    return achados[0]["pasta"]


def ler(pasta):
    """Lê o projeto. Devolve dict com draft, meta, nome do arquivo, id da linha do tempo e mtime."""
    nome = next((n for n in NOMES if os.path.exists(f"{pasta}/{n}")), None)
    assert nome, f"sem draft_info.json em {pasta}"
    raw = open(f"{pasta}/{nome}", "rb").read()
    assert raw.lstrip()[:1] == b"{", "este CapCut criptografa os projetos (JianYing?): não dá para editar por fora"
    tl_id = None
    if os.path.exists(f"{pasta}/Timelines/project.json"):
        tl_id = load(f"{pasta}/Timelines/project.json").get("main_timeline_id")
    return {"pasta": pasta, "arquivo": nome, "draft": json.loads(raw), "meta": load(f"{pasta}/draft_meta_info.json"),
            "tl_id": tl_id, "mtime": os.path.getmtime(f"{pasta}/{nome}"), "md5": hashlib.md5(raw).hexdigest()}


def alvos(p):
    n, tl = p["arquivo"], p["tl_id"]
    ts = [n, n + ".bak", "template-2.tmp"]
    if tl:
        ts += [f"Timelines/{tl}/{x}" for x in (n, n + ".bak", "template-2.tmp")]
    return ts


def materiais(draft):
    m = {}
    for k, v in draft["materials"].items():
        if isinstance(v, list):
            for o in v:
                if isinstance(o, dict) and "id" in o:
                    m[o["id"]] = (k, o)
    return m


def caminhos_de_midia(draft):
    ps = set()
    for k in ("videos", "audios"):
        for m in draft["materials"].get(k, []):
            if m.get("path") and not m["path"].startswith("##"):
                ps.add(m["path"])
    return sorted(ps)


def validar(draft):
    """Recusa um draft que o CapCut não abriria: referência solta, id duplicado, sobreposição, chave fora do clipe."""
    ids = set()
    for k, v in draft["materials"].items():
        if isinstance(v, list):
            for x in v:
                if isinstance(x, dict) and "id" in x:
                    assert x["id"] not in ids, ("id de material duplicado", k)
                    ids.add(x["id"])
    total = draft["duration"]
    for tr in draft["tracks"]:
        prev = -1
        for s in sorted(tr["segments"], key=lambda s: s["target_timerange"]["start"]):
            assert s["material_id"] in ids, ("material faltando", tr["type"])
            assert all(r in ids for r in s.get("extra_material_refs", [])), ("material extra faltando", tr["type"])
            st, du = s["target_timerange"]["start"], s["target_timerange"]["duration"]
            assert du > 0 and st >= prev, (tr["type"], "sobreposição ou clipe vazio em", st / 1e6)
            assert st + du <= total + 1, (tr["type"], "clipe passa do fim em", (st + du) / 1e6)
            src = s.get("source_timerange")
            if src:
                for k in s.get("common_keyframes") or []:
                    for p in k["keyframe_list"]:
                        assert src["start"] <= p["time_offset"] <= src["start"] + src["duration"] + 1, \
                            ("keyframe fora do clipe", tr["type"], st / 1e6)
            prev = st + du
    main = draft["tracks"][0]["segments"]
    if main:
        assert main[0]["target_timerange"]["start"] == 0, "a faixa principal tem que começar em 0"
        for a, b in zip(main, main[1:]):
            assert a["target_timerange"]["start"] + a["target_timerange"]["duration"] == b["target_timerange"]["start"], \
                ("buraco na faixa principal em", b["target_timerange"]["start"] / 1e6)
    for p in caminhos_de_midia(draft):
        assert os.path.exists(p), ("arquivo de mídia não existe", p)
    return True


def instalar(p, draft, meta=None, etapa="edicao", snapshot=None):
    """Grava o draft no projeto com segurança. p = resultado de ler() feito ANTES de montar."""
    if capcut_aberto():
        raise SystemExit("O CapCut está aberto. Feche com Cmd+Q e rode de novo (ele sobrescreve o projeto ao fechar).")
    pasta = p["pasta"]
    atual = os.path.getmtime(f"{pasta}/{p['arquivo']}")
    if abs(atual - p["mtime"]) > 1e-3:
        raise SystemExit("O projeto mudou depois que foi lido (você editou?). Leia de novo e monte outra vez, "
                         "ou rode aprender.py antes para guardar suas mudanças.")
    validar(draft)
    carimbo = time.strftime("%Y%m%d-%H%M%S")
    bk = f"{pasta}/_backup_claude/{carimbo}_{etapa}"
    os.makedirs(bk, exist_ok=True)
    for rel in alvos(p) + ["draft_meta_info.json"]:
        if os.path.exists(f"{pasta}/{rel}"):
            os.makedirs(os.path.dirname(f"{bk}/{rel}"), exist_ok=True)
            shutil.copy2(f"{pasta}/{rel}", f"{bk}/{rel}")
    blob = json.dumps(draft, ensure_ascii=False, separators=(",", ":"))
    md5 = hashlib.md5(blob.encode("utf-8")).hexdigest()
    gravados = []
    for rel in alvos(p):
        dst = f"{pasta}/{rel}"
        if os.path.exists(dst) or rel == p["arquivo"]:
            with open(dst, "w", encoding="utf-8") as f:
                f.write(blob)
            gravados.append(rel)
    meta = copy.deepcopy(meta or p["meta"])
    meta["tm_duration"] = draft["duration"]
    meta["tm_draft_modified"] = int(time.time() * 1e6)
    save(f"{pasta}/draft_meta_info.json", meta, compacto=True)
    for rel in gravados:
        h = hashlib.md5(open(f"{pasta}/{rel}", "rb").read()).hexdigest()
        assert h == md5, ("md5 diferente depois de gravar", rel)
    if snapshot:   # cópia do que a Claude entregou, para o aprender.py comparar depois
        save(snapshot, draft, compacto=True)
    return {"backup": bk, "gravados": gravados, "md5": md5}


# ---------- modelos (clonar objetos que o CapCut do Lucas já escreveu) ----------
LOOKS = ("effects", "hsl", "color_curves", "hsl_curves", "primary_color_wheels", "log_color_wheels", "video_effects",
         "common_mask", "chromas", "beats", "audio_effects", "realtime_denoises", "audio_track_indexes",
         "material_animations", "transitions", "filters")


def _refs(draft, seg, pular=LOOKS):
    m = materiais(draft)
    return [[m[r][0], copy.deepcopy(m[r][1])] for r in seg.get("extra_material_refs", []) if r in m and m[r][0] not in pular]


def colher(paths):
    """Colhe modelos de segmentos/materiais. Textos: guarda TODOS os estilos distintos (para legenda e títulos)."""
    T = {"fontes": [], "textos": []}
    vistos = set()
    for pasta in paths:
        try:
            p = ler(pasta)
        except Exception as e:
            print("pulado:", pasta, e)
            continue
        d = p["draft"]
        m = materiais(d)
        for tr in d["tracks"]:
            for s in tr["segments"]:
                kind, mat = m.get(s["material_id"], (None, {}))
                if tr["type"] == "video" and kind == "videos" and mat.get("type") == "video" and "video_segment" not in T:
                    T["video_segment"], T["video_refs"], T["video_material"] = copy.deepcopy(s), _refs(d, s), copy.deepcopy(mat)
                if tr["type"] == "video" and kind == "videos" and mat.get("type") == "photo" and "photo_material" not in T:
                    T["photo_material"] = copy.deepcopy(mat)
                if tr["type"] == "audio" and kind == "audios" and not T.get("_audio_com_fade"):
                    r = _refs(d, s)
                    fade = any(k == "audio_fades" for k, _ in r)
                    if fade or "audio_segment" not in T:
                        T["audio_segment"], T["audio_refs"], T["audio_material"] = copy.deepcopy(s), r, copy.deepcopy(mat)
                        T["_audio_com_fade"] = fade
                if tr["type"] == "adjust" and "adjust_segment" not in T:
                    T["adjust_track"] = {k: v for k, v in tr.items() if k != "segments"}
                    T["adjust_segment"], T["adjust_placeholder"] = copy.deepcopy(s), copy.deepcopy(mat)
                    T["adjust_refs"] = [[m[r][0], copy.deepcopy(m[r][1])] for r in s["extra_material_refs"] if r in m]
                if tr["type"] == "text" and kind == "texts":
                    try:
                        c = json.loads(mat["content"])
                    except Exception:
                        continue
                    st = (c.get("styles") or [{}])[0]
                    anims = [m[r][1] for r in s.get("extra_material_refs", []) if m.get(r, ("",))[0] == "material_animations"]
                    nomes_anim = [a.get("name") for an in anims for a in an.get("animations", [])]
                    chave = (st.get("font", {}).get("path"), json.dumps(st.get("fill")), st.get("size"),
                             json.dumps(st.get("strokes")), tuple(nomes_anim), round(s["clip"]["transform"]["y"], 2))
                    if chave in vistos:
                        continue
                    vistos.add(chave)
                    T["textos"].append({
                        "id": f"t{len(T['textos']) + 1}", "projeto": p["meta"].get("draft_name"),
                        "exemplo": c.get("text", "")[:40], "fonte": os.path.basename(st.get("font", {}).get("path", "")),
                        "tamanho": st.get("size"), "cor": st.get("fill"), "animacoes": nomes_anim,
                        "y": s["clip"]["transform"]["y"], "canvas": d.get("canvas_config"),
                        "segment": copy.deepcopy(s), "material": copy.deepcopy(mat),
                        "refs": [[m[r][0], copy.deepcopy(m[r][1])] for r in s.get("extra_material_refs", []) if r in m]})
        T["fontes"].append(pasta)
        T["versao"] = T.get("versao") or (d.get("last_modified_platform") or d.get("platform") or {}).get("app_version")
    if "photo_material" not in T and "video_material" in T:
        pm = copy.deepcopy(T["video_material"])
        pm.update(type="photo", duration=10800000000, has_audio=False)
        T["photo_material"] = pm
    return T


# ---------- CLI ----------
if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "listar"
    if cmd == "listar":
        for pr in projetos():
            try:
                p = ler(pr["pasta"])
                d = p["draft"]
                fx = {}
                for t in d["tracks"]:
                    fx[t["type"]] = fx.get(t["type"], 0) + len(t["segments"])
                print(f"{pr['nome'][:34]:34} {d['duration'] / 1e6:8.1f}s  {d.get('canvas_config', {}).get('ratio', '?'):5} {fx}")
            except Exception as e:
                print(f"{pr['nome'][:34]:34} (não lido: {e})")
    elif cmd == "aberto":
        a = capcut_aberto()
        print("CapCut ABERTO" if a else "CapCut fechado")
        sys.exit(1 if a else 0)
    elif cmd == "midia":
        p = ler(achar(sys.argv[2]))
        for grp in p["meta"].get("draft_materials", []):
            for v in grp.get("value", []):
                print(v.get("metetype"), v.get("duration", 0) / 1e6, v.get("width"), v.get("height"), v.get("file_Path"))
    elif cmd == "colher":
        out, nomes = sys.argv[2], sys.argv[3:]
        T = colher([achar(n) for n in nomes])
        save(out, T)
        faltam = [k for k in ("video_segment", "audio_segment", "adjust_segment", "photo_material") if k not in T]
        print("modelos de", [os.path.basename(x) for x in T["fontes"]], "CapCut", T.get("versao"))
        print("textos:", [(t["id"], t["exemplo"], t["fonte"], t["animacoes"]) for t in T["textos"]])
        print("FALTAM:", faltam or "nada")
