"""Cria um projeto novo e vazio no CapCut (16:9, 30 fps), copiando a estrutura de um projeto vazio do próprio
CapCut do Lucas, com ids novos. Faz backup do índice de projetos antes.

uso: python3 novo_projeto.py "Nome do projeto" [--modelo "<projeto vazio para copiar>"]
Com o CapCut FECHADO. Depois de abrir o CapCut, o projeto aparece na lista.
Se der qualquer problema, o caminho manual sempre funciona: no CapCut, Criar projeto → renomear → Cmd+Q.
"""
import glob, json, os, shutil, sys, time

sys.path.insert(0, os.path.dirname(__file__))
import capcut as cc  # noqa: E402

nome = sys.argv[1]
if cc.capcut_aberto():
    raise SystemExit("Feche o CapCut (Cmd+Q) antes de criar o projeto.")
if any((p["nome"] or "").lower() == nome.lower() for p in cc.projetos()):
    raise SystemExit(f"Já existe um projeto '{nome}'.")


def vazio(pasta):
    try:
        d = cc.ler(pasta)["draft"]
        return not any(t["segments"] for t in d["tracks"]) and os.path.isdir(f"{pasta}/Timelines")
    except Exception:
        return False


if "--modelo" in sys.argv:
    src = cc.achar(sys.argv[sys.argv.index("--modelo") + 1])
else:
    cands = [p["pasta"] for p in cc.projetos() if vazio(p["pasta"])]
    if not cands:
        raise SystemExit("Nenhum projeto vazio para copiar: crie um no CapCut (Criar projeto, Cmd+Q) e rode de novo.")
    src = cands[0]

dst = os.path.join(cc.RAIZ, nome)
assert not os.path.exists(dst), f"a pasta já existe: {dst}"
shutil.copytree(src, dst, ignore=shutil.ignore_patterns("_backup_claude", "draft_cover.jpg"))

agora = int(time.time() * 1e6)
tl_novo, proj_novo, draft_novo = cc.U(), cc.U(), cc.U()
pj = cc.load(f"{dst}/Timelines/project.json")
tl_velho = pj["main_timeline_id"]
os.rename(f"{dst}/Timelines/{tl_velho}", f"{dst}/Timelines/{tl_novo}")
pj.update(id=proj_novo, main_timeline_id=tl_novo, create_time=agora, update_time=agora)
pj["timelines"] = [dict(pj["timelines"][0], id=tl_novo, create_time=agora, update_time=agora)]
for n in ("project.json", "project.json.bak"):
    cc.save(f"{dst}/Timelines/{n}", pj, compacto=True)

d = cc.load(f"{dst}/draft_info.json")
d.update(id=tl_novo, duration=0, tracks=[], fps=30.0)
d["canvas_config"] = dict(d.get("canvas_config") or {}, ratio="16:9", width=1920, height=1080)
for k in d["materials"]:
    if isinstance(d["materials"][k], list):
        d["materials"][k] = []
blob = json.dumps(d, ensure_ascii=False, separators=(",", ":"))
for rel in ["draft_info.json", "draft_info.json.bak", "template-2.tmp",
            f"Timelines/{tl_novo}/draft_info.json", f"Timelines/{tl_novo}/draft_info.json.bak", f"Timelines/{tl_novo}/template-2.tmp"]:
    if os.path.exists(f"{dst}/{rel}") or rel == "draft_info.json":
        open(f"{dst}/{rel}", "w", encoding="utf-8").write(blob)

m = cc.load(f"{dst}/draft_meta_info.json")
m.update(draft_id=draft_novo, draft_name=nome, draft_fold_path=dst, draft_root_path=cc.RAIZ, draft_materials=[
    {"type": t, "value": []} for t in (0, 1, 2, 3, 6, 7, 8)] if not m.get("draft_materials") else
    [dict(g, value=[]) for g in m["draft_materials"]], draft_cover="", tm_draft_create=agora, tm_draft_modified=agora,
    tm_duration=0, draft_timeline_materials_size_=0)
cc.save(f"{dst}/draft_meta_info.json", m, compacto=True)

# índice de projetos do CapCut
rp = f"{cc.RAIZ}/root_meta_info.json"
if os.path.exists(rp):
    os.makedirs(f"{cc.RAIZ}/../_backup_claude_root", exist_ok=True)
    shutil.copy2(rp, f"{cc.RAIZ}/../_backup_claude_root/root_meta_info_{time.strftime('%Y%m%d-%H%M%S')}.json")
    r = cc.load(rp)
    base = next((e for e in r.get("all_draft_store", []) if e.get("draft_fold_path") == src), None) or \
        (r.get("all_draft_store") or [{}])[0]
    e = dict(base)
    e.update(draft_id=draft_novo, draft_name=nome, draft_fold_path=dst, draft_cover=f"{dst}/draft_cover.jpg",
             draft_json_file=f"{dst}/draft_info.json", draft_root_path=cc.RAIZ, tm_draft_create=agora,
             tm_draft_modified=agora, tm_duration=0, draft_timeline_materials_size=0, cloud_draft_sync=False)
    for k in list(e):
        if k.startswith("tm_draft_cloud") or k.startswith("draft_cloud"):
            e[k] = base[k] if not isinstance(base[k], (int, float)) else (-1 if "id" in k else 0)
    r.setdefault("all_draft_store", []).insert(0, e)
    if isinstance(r.get("draft_ids"), int):
        r["draft_ids"] += 1
    cc.save(rp, r, compacto=True)
print(f"projeto '{nome}' criado em {dst} (copiado de {os.path.basename(src)})")
