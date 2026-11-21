"""Lê a linha do tempo de uma sequência num projeto do Premiere (.prproj, XML em gzip) — inclusive os auto-saves.

uso: python3 premiere_ler.py PROJETO.prproj saida.json [--sequencia "nome"]
     (sem --sequencia: a primeira sequência do projeto)

Saída: {"sequencia", "faixas": [{"tipo": video|audio, "index", "clipes": [{t0, t1, in, out, arquivo, nome, vel,
        mudo, escala, nivel_db, keyframes}]}], "marcadores": [{t, nome, comentario}], "quadro": [w, h]}  — tempos em s.
nivel_db: o "Nível" do clipe (volume) em dB — o Premiere guarda linear com 0,1778 = 0 dB (15 dB de folga).
Use para: (1) refazer a sequência em outra resolução/fps sem perder o que o Lucas editou (premiere_refazer.py);
(2) aprender com os cortes dele (comparar com o edl.json da skill).
O Premiere salva sozinho a cada ~2 min em ~/Documents/Adobe/Premiere Pro/<versão>/Adobe Premiere Pro Auto-Save/:
o auto-save mais novo tem as edições mesmo quando ele não salvou o projeto.
Unidade interna: 254016000000 ticks por segundo. Campo omitido = 0 (Start, InPoint).
"""
import gzip, json, sys, xml.etree.ElementTree as ET

TPS = 254016000000


def ler(caminho, nome_seq=None):
    bruto = open(caminho, "rb").read()
    root = ET.fromstring(gzip.decompress(bruto) if bruto[:2] == b"\x1f\x8b" else bruto)
    by = {}
    for e in root:
        for k in ("ObjectID", "ObjectUID"):
            if e.get(k):
                by[e.get(k)] = e

    def ref(el):
        return by.get(el.get("ObjectRef") or el.get("ObjectURef")) if el is not None else None

    seqs = [e for e in root if e.tag == "Sequence" and (not nome_seq or e.findtext("Name") == nome_seq)]
    if not seqs:
        sys.exit(f"sequência não encontrada: {nome_seq}")
    seq = seqs[0]

    def componentes(it):
        """escala do Movimento, se tem keyframes em algum parâmetro e o nível de áudio."""
        r = {"escala": None, "keyframes": False, "nivel_db": 0.0}
        comps = ref(it.find("./ClipTrackItem/ComponentOwner/Components"))
        if comps is None:
            return r
        for c in comps.iter("Component"):
            fc = by.get(c.get("ObjectRef"))
            if fc is None:
                continue
            for p in fc.iter("Param"):
                pe = by.get(p.get("ObjectRef"))
                if pe is None:
                    continue
                kfs = pe.findtext("Keyframes")
                if kfs and pe.findtext("Name") in ("Level", "Nível"):
                    # rampa de volume: vale o último valor (07/11: ele subiu +14 dB em 67 ms no começo de uma fala baixa)
                    ult = [k for k in kfs.split(";") if k.strip()][-1].split(",")
                    import math
                    r["nivel_db"] = round(20 * math.log10(max(1e-9, float(ult[1])) / 0.177827941), 2)
                    r["nivel_rampa"] = True
                    continue
                if kfs:
                    r["keyframes"] = True
                nome_p = pe.findtext("Name")
                sk = (pe.findtext("StartKeyframe") or "").split(",")
                if nome_p in ("Scale", "Escala"):
                    if pe.findtext("CurrentValue"):
                        r["escala"] = float(pe.findtext("CurrentValue"))
                    elif len(sk) > 1 and sk[1]:
                        r["escala"] = float(sk[1])
                if nome_p in ("Level", "Nível") and len(sk) > 1 and sk[1] and not r.get("nivel_rampa"):
                    import math
                    r["nivel_db"] = round(20 * math.log10(max(1e-9, float(sk[1])) / 0.177827941), 2)
        return r

    out = {"sequencia": seq.findtext("Name"), "faixas": [], "marcadores": [], "quadro": None}
    for tg in seq.findall("./TrackGroups/TrackGroup/Second"):
        g = ref(tg)
        if g is None:
            continue
        for t in g.findall(".//Tracks/Track"):
            tr = ref(t)
            if tr is None or "ClipTrack" not in tr.tag:
                continue
            faixa = {"tipo": "video" if "Video" in tr.tag else "audio", "index": int(t.get("Index", 0)), "clipes": []}
            for ti in tr.findall(".//ClipItems/TrackItems/TrackItem"):
                it = ref(ti)
                if it is None:
                    continue
                ct = it.find("./ClipTrackItem")
                sub = ref(ct.find("./SubClip"))
                clip = ref(sub.find("./Clip"))
                fonte = ref(clip.find("./Clip/Source"))
                media = ref(fonte.find(".//Media")) if fonte is not None else None
                vel = clip.findtext("./Clip/PlaybackSpeed")
                c = {"t0": int(ct.findtext("./TrackItem/Start") or 0) / TPS, "t1": int(ct.findtext("./TrackItem/End") or 0) / TPS,
                     "in": int(clip.findtext("./Clip/InPoint") or 0) / TPS, "out": int(clip.findtext("./Clip/OutPoint") or 0) / TPS,
                     "arquivo": media is not None and (media.findtext("ActualMediaFilePath") or media.findtext("FilePath")) or None,
                     "nome": sub.findtext("Name"), "vel": float(vel) if vel else 1.0,
                     "mudo": ct.findtext("./IsMuted") == "true"}
                c.update(componentes(it))
                if out["quadro"] is None and it.findtext("FrameRect"):
                    out["quadro"] = [int(v) for v in it.findtext("FrameRect").split(",")[2:4]]
                faixa["clipes"].append(c)
            faixa["clipes"].sort(key=lambda c: c["t0"])
            out["faixas"].append(faixa)
    mo = seq.find("./MarkerOwner/Markers")
    marks = ref(mo) if mo is not None else None
    for mk in (marks.find("./Markers") if marks is not None else []):
        el = next((by.get(c.get("ObjectRef")) for c in mk.iter() if c.get("ObjectRef")), None)
        if el is None or not el.findtext("DVAMarker"):
            continue
        j = json.loads(el.findtext("DVAMarker"))["DVAMarker"]
        out["marcadores"].append({"t": j["mStartTime"]["ticks"] / TPS, "nome": j.get("mName", ""), "comentario": j.get("mComment", "")})
    out["marcadores"].sort(key=lambda m: m["t"])
    return out


if __name__ == "__main__":
    a = sys.argv[1:]
    nome = a[a.index("--sequencia") + 1] if "--sequencia" in a else None
    d = ler(a[0], nome)
    json.dump(d, open(a[1], "w"), ensure_ascii=False, indent=1)
    for f in d["faixas"]:
        c = f["clipes"]
        print(f"{f['tipo']} {f['index'] + 1}: {len(c)} clipes" + (f" · {c[-1]['t1'] / 60:.2f} min" if c else ""))
    print(f"{len(d['marcadores'])} marcadores · {a[1]}")


def ler_linha(caminho, sequencia=None, intro=None, audio=None):
    """A linha do tempo de um projeto do Premiere (.prproj) OU, sem editor nenhum, da pasta de trabalho da skill
    (edl.json): intro (se houver) + os clipes da gravação, no mesmo formato do ler(). É o que permite rodar
    enquadrar_tela / nivelar_voz / trilha_corpo / renderizar 100% no Claude, sem Premiere nem CapCut."""
    import os
    if os.path.isdir(caminho) and os.path.exists(os.path.join(caminho, "edl.json")):
        E = json.load(open(os.path.join(caminho, "edl.json")))
        F = E["fps"]
        cl = E["clips"]
        base = cl[0]["tl0"] if cl else 0
        D0 = 0.0
        v1, a1 = [], []
        if intro:
            import subprocess
            D0 = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", intro],
                                      capture_output=True, text=True).stdout)
            D0 = int(round(D0 * F)) / F
            ci = {"t0": 0.0, "t1": D0, "in": 0.0, "out": D0, "arquivo": os.path.abspath(intro), "nome": os.path.basename(intro),
                  "vel": 1.0, "mudo": False, "escala": None, "nivel_db": 0.0, "keyframes": False}
            v1.append(dict(ci))
            a1.append(dict(ci))
        for c in cl:
            t0 = D0 + (c["tl0"] - base) / F
            t1 = D0 + (c["tl1"] - base) / F
            i0 = c["src0"] / F
            d = {"t0": t0, "t1": t1, "in": i0, "out": i0 + (t1 - t0), "arquivo": E["video"], "nome": os.path.basename(E["video"]),
                 "vel": 1.0, "mudo": False, "escala": None, "nivel_db": 0.0, "keyframes": False}
            v1.append(d)
            a1.append(dict(d, arquivo=os.path.abspath(audio) if audio else E["video"],
                           nome=os.path.basename(audio) if audio else os.path.basename(E["video"])))
        return {"sequencia": "edl", "faixas": [{"tipo": "video", "index": 0, "clipes": v1}, {"tipo": "audio", "index": 0, "clipes": a1}],
                "marcadores": [], "quadro": None}
    return ler(caminho, sequencia)
