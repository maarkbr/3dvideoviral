"""Aprende com os ajustes do Lucas: compara o que a Claude entregou (entregue.json) com o projeto como ficou
depois que ele mexeu no CapCut, e escreve um relatório das diferenças.

uso: python3 aprender.py PASTA_TRABALHO "<nome do projeto>"     (com o CapCut FECHADO)
grava PASTA/aprendizado.md. Depois, a Claude resume o que é preferência (não acidente) em
~/.claude/skills/edicao-youtube/references/preferencias.md, com data e o vídeo de origem.

O que compara:
- cortes: trechos do bruto que ele tirou a mais ou devolveu (erro que passou, corte que comeu palavra);
- cenas (imagens/vídeos por cima): movidas, esticadas, encurtadas, apagadas ou novas; escala/posição mudadas;
- textos: conteúdo, fonte, tamanho, cor, posição e animação mudados; textos apagados ou novos;
- áudio: volume de música/efeitos mudado, trilha trocada, efeitos novos ou apagados;
- zoom: keyframes mudados na faixa principal.
"""
import json, os, sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(__file__))
import capcut as cc  # noqa: E402

wd, nome = sys.argv[1], sys.argv[2]
if cc.capcut_aberto():
    raise SystemExit("Feche o CapCut (Cmd+Q) antes: ele só grava as mudanças no arquivo quando fecha o projeto.")
A = cc.load(f"{wd}/entregue.json")
PB = cc.ler(cc.achar(nome))
B = PB["draft"]
# ao abrir, o CapCut tira o "path" das fotos e guarda no painel de mídia (draft_meta_info), com o mesmo id
bin_paths = {v.get("id"): v.get("file_Path") for g in PB["meta"].get("draft_materials", []) for v in g.get("value", [])}
for m in B["materials"].get("videos", []):
    if not m.get("path") and bin_paths.get(m["id"]):
        m["path"] = bin_paths[m["id"]]
seg = lambda u: u / 1e6


def faixas(D):
    m = cc.materiais(D)
    out = defaultdict(list)
    for i, tr in enumerate(D["tracks"]):
        for s in tr["segments"]:
            k, mat = m.get(s["material_id"], ("?", {}))
            out[tr["type"]].append({"faixa": i, "s": s, "m": mat, "k": k})
    return out


FA, FB = faixas(A), faixas(B)
L = [f"# Aprendizado — {nome}", ""]

# ---- cortes (faixa principal = faixa 0)
def fontes(D):
    return [(seg(s["source_timerange"]["start"]), seg(s["source_timerange"]["start"] + s["source_timerange"]["duration"]))
            for s in D["tracks"][0]["segments"]]


def uniao(iv):
    iv = sorted(iv)
    out = []
    for a, b in iv:
        if out and a <= out[-1][1] + 0.02:
            out[-1][1] = max(out[-1][1], b)
        else:
            out.append([a, b])
    return out


def menos(x, y):
    out = []
    for a, b in x:
        cur = [[a, b]]
        for c, d in y:
            nxt = []
            for p, q in cur:
                if d <= p or c >= q:
                    nxt.append([p, q])
                else:
                    if c > p:
                        nxt.append([p, c])
                    if d < q:
                        nxt.append([d, q])
            cur = nxt
        out += cur
    return [(a, b) for a, b in out if b - a > 0.08]


ka, kb = uniao(fontes(A)), uniao(fontes(B))
tirou, devolveu = menos(ka, kb), menos(kb, ka)
L.append(f"## Cortes\nDuração: entregue {seg(A['duration']):.1f}s → final {seg(B['duration']):.1f}s")
for a, b in tirou:
    L.append(f"- TIROU a mais do bruto {a:.2f}–{b:.2f}s ({b - a:.2f}s)")
for a, b in devolveu:
    L.append(f"- DEVOLVEU do bruto {a:.2f}–{b:.2f}s ({b - a:.2f}s) — corte da Claude comeu algo")
if not tirou and not devolveu:
    L.append("- nenhum corte mudado")
kfa = sum(len(s["s"].get("common_keyframes") or []) for s in FA["video"] if s["faixa"] == 0)
kfb = sum(len(s["s"].get("common_keyframes") or []) for s in FB["video"] if s["faixa"] == 0)
if kfa != kfb:
    L.append(f"- keyframes de zoom na principal: {kfa} → {kfb}")

# ---- cenas (vídeo/imagem por cima)
def cenas(F):
    return {(x["m"].get("path"), round(seg(x["s"]["target_timerange"]["start"]), 1)): x for x in F["video"] if x["faixa"] != 0}


def por_path(F):
    d = defaultdict(list)
    for x in F["video"]:
        if x["faixa"] != 0:
            d[x["m"].get("path")].append(x)
    return d


REAIS = {"material_animations", "transitions", "effects", "video_effects", "filters", "common_mask", "hsl", "color_curves",
         "chromas", "audio_effects", "beats"}   # o resto (loudnesses, canvases…) o CapCut completa sozinho ao abrir


def tipos_refs(D, sg):
    m = cc.materiais(D)
    return {m[r][0] for r in sg.get("extra_material_refs", []) if r in m and m[r][0] in REAIS}


L.append("\n## Cenas por cima")
PA, PB = por_path(FA), por_path(FB)
for p in sorted(set(PA) | set(PB), key=str):
    xa, xb = PA.get(p, []), PB.get(p, [])
    nm = os.path.basename(p or "?")
    if xa and not xb:
        L.append(f"- APAGOU {nm} (estava em {seg(xa[0]['s']['target_timerange']['start']):.1f}s)")
        continue
    if xb and not xa:
        L.append(f"- ACRESCENTOU {nm} em {seg(xb[0]['s']['target_timerange']['start']):.1f}s "
                 f"({seg(xb[0]['s']['target_timerange']['duration']):.1f}s)")
        continue
    for a, b in zip(sorted(xa, key=lambda x: x["s"]["target_timerange"]["start"]),
                    sorted(xb, key=lambda x: x["s"]["target_timerange"]["start"])):
        ta, tb = a["s"]["target_timerange"], b["s"]["target_timerange"]
        d0 = seg(tb["start"] - ta["start"])
        d1 = seg(tb["start"] + tb["duration"] - ta["start"] - ta["duration"])
        ca, cb = a["s"]["clip"], b["s"]["clip"]
        mud = []
        if abs(d0) > 0.05 or abs(d1) > 0.05:
            mud.append(f"início {d0:+.2f}s, fim {d1:+.2f}s")
        if abs(ca["scale"]["x"] - cb["scale"]["x"]) > 0.01:
            mud.append(f"escala {ca['scale']['x']:.2f}→{cb['scale']['x']:.2f}")
        if abs(ca["transform"]["x"] - cb["transform"]["x"]) > 0.01 or abs(ca["transform"]["y"] - cb["transform"]["y"]) > 0.01:
            mud.append(f"posição ({ca['transform']['x']:.2f},{ca['transform']['y']:.2f})→({cb['transform']['x']:.2f},{cb['transform']['y']:.2f})")
        ka, kb = tipos_refs(A, a["s"]), tipos_refs(B, b["s"])
        if ka != kb:
            mud.append(f"efeitos {sorted(ka)} → {sorted(kb)}")
        if mud:
            L.append(f"- {nm} em {seg(ta['start']):.1f}s: " + "; ".join(mud))

# ---- textos
def textos(F):
    out = []
    for x in F["text"]:
        try:
            c = json.loads(x["m"]["content"])
        except Exception:
            c = {}
        st = (c.get("styles") or [{}])[0]
        out.append({"t": c.get("text", ""), "a": seg(x["s"]["target_timerange"]["start"]),
                    "b": seg(x["s"]["target_timerange"]["start"] + x["s"]["target_timerange"]["duration"]),
                    "fonte": os.path.basename(st.get("font", {}).get("path", "")), "tam": st.get("size"),
                    "cores": [s.get("fill", {}).get("content", {}).get("solid", {}).get("color") for s in c.get("styles", [])],
                    "pos": (round(x["s"]["clip"]["transform"]["x"], 2), round(x["s"]["clip"]["transform"]["y"], 2)),
                    "esc": round(x["s"]["clip"]["scale"]["x"], 2), "nrefs": len(x["s"].get("extra_material_refs", []))})
    return out


ta, tb = textos(FA), textos(FB)
L.append(f"\n## Textos\n{len(ta)} entregues → {len(tb)} no final")
usados = set()
mud_tipo = defaultdict(int)
exemplos = []
for x in ta:
    par = min((y for k, y in enumerate(tb) if k not in usados and abs(y["a"] - x["a"]) < 0.6),
              key=lambda y: abs(y["a"] - x["a"]), default=None)
    if not par:
        mud_tipo["apagado"] += 1
        exemplos.append(f"- APAGOU texto '{x['t']}' em {x['a']:.1f}s")
        continue
    usados.add(tb.index(par))
    for campo in ("t", "fonte", "tam", "cores", "pos", "esc", "nrefs"):
        if x[campo] != par[campo]:
            mud_tipo[campo] += 1
            if mud_tipo[campo] <= 4:
                exemplos.append(f"- '{x['t']}' {x['a']:.1f}s: {campo} {x[campo]} → {par[campo]}")
for k, y in enumerate(tb):
    if k not in usados:
        mud_tipo["novo"] += 1
        if mud_tipo["novo"] <= 6:
            exemplos.append(f"- ACRESCENTOU texto '{y['t']}' em {y['a']:.1f}s (fonte {y['fonte']}, tam {y['tam']}, pos {y['pos']})")
L.append("Contagem de mudanças: " + (", ".join(f"{k}: {v}" for k, v in mud_tipo.items()) or "nenhuma"))
L += exemplos

# ---- áudio
L.append("\n## Áudio")
def auds(F):
    return {(x["m"].get("path"), round(seg(x["s"]["target_timerange"]["start"]) * 4) / 4): x for x in F["audio"]}


AA, AB = auds(FA), auds(FB)
for ka in list(AA):              # mesmo arquivo a menos de 0,3 s = o mesmo clipe (o CapCut arredonda tempos)
    for kb in list(AB):
        if ka != kb and ka[0] == kb[0] and abs(ka[1] - kb[1]) <= 0.3 and ka not in AB and kb not in AA:
            AB[ka] = AB.pop(kb)
            break
for k in sorted(set(AA) | set(AB), key=str):
    a, b = AA.get(k), AB.get(k)
    nm = os.path.basename(k[0] or "?")
    if a and not b:
        L.append(f"- APAGOU áudio {nm} em {k[1]}s")
    elif b and not a:
        L.append(f"- ACRESCENTOU áudio {nm} em {k[1]}s (volume {b['s']['volume']:.2f})")
    else:
        import math
        db = 20 * math.log10(max(1e-5, b["s"]["volume"]) / max(1e-5, a["s"]["volume"]))
        if abs(db) >= 1.0:
            L.append(f"- volume de {nm} em {k[1]}s: {db:+.1f} dB")

open(f"{wd}/aprendizado.md", "w").write("\n".join(L) + "\n")
print("\n".join(L))
