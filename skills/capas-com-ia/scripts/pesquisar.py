#!/usr/bin/env python3
"""Pesquisa de capas e títulos: busca vídeos do tema no YouTube, compara cada um com a mediana do próprio canal
(multiplicador) e baixa as capas dos melhores para estudar.

uso: python pesquisar.py <pasta de saída> "busca 1" "busca 2" ... [--dias 60] [--min-seg 180] [--top 12] [--shorts]
saída: <pasta>/ranking.md (multiplicador, views, idade, canal, título, link), <pasta>/capas/<id>.jpg e <pasta>/capas.jpg
(folha com as capas dos melhores, na ordem do ranking). --shorts: só vídeos de até 60 s (capas de Shorts).
Só leitura pública (yt-dlp, o da pasta de trabalho), sem login. As views da busca vêm aproximadas; o multiplicador
(views do vídeo ÷ mediana dos últimos vídeos do mesmo canal) é o que importa: mostra o que superou o normal daquele canal.
--min-views (padrão 5000) tira os canais minúsculos, em que 4 mil views já viram "100x".
"""
import argparse, json, os, statistics, subprocess, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor


def ytdlp(url, n=None):
    a = [sys.executable, "-m", "yt_dlp", "--flat-playlist", "-J", "--extractor-args", "youtube:lang=pt"]
    if n:
        a += ["--playlist-end", str(n)]
    r = subprocess.run(a + [url], capture_output=True, text=True, timeout=180)
    try:
        return json.loads(r.stdout).get("entries") or []
    except ValueError:
        return []


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("saida"); ap.add_argument("buscas", nargs="+")
    ap.add_argument("--dias", type=int, default=60); ap.add_argument("--min-seg", type=int, default=180); ap.add_argument("--top", type=int, default=12)
    ap.add_argument("--shorts", action="store_true")
    ap.add_argument("--min-views", type=int, default=5000, help="ignora vídeo com menos views que isso (canal minúsculo dá multiplicador enganoso)")
    a = ap.parse_args()
    os.makedirs(os.path.join(a.saida, "capas"), exist_ok=True)
    with ThreadPoolExecutor(6) as ex:
        res = list(ex.map(lambda q: ytdlp("ytsearch30:" + q), a.buscas))
    agora, vids = time.time(), {}
    for es in res:
        for e in es:
            dur = e.get("duration") or 0 if e else 0
            if not e or e["id"] in vids or (dur > 60 if a.shorts else dur < a.min_seg) or (e.get("view_count") or 0) < a.min_views:
                continue
            idade = (agora - e["timestamp"]) / 86400 if e.get("timestamp") else None
            if idade is not None and idade > a.dias:
                continue
            vids[e["id"]] = {"id": e["id"], "v": e.get("view_count") or 0, "idade": idade, "canal": e.get("channel"), "cid": e.get("channel_id"), "titulo": e.get("title")}
    cand = sorted(vids.values(), key=lambda x: -x["v"])[:40]
    canais = {c["cid"] for c in cand if c["cid"]}
    with ThreadPoolExecutor(6) as ex:
        meds = dict(zip(canais, ex.map(lambda c: ytdlp(f"https://www.youtube.com/channel/{c}/videos", 20), canais)))
    for c in cand:
        es = [e.get("view_count") for e in meds.get(c["cid"], []) if e and e.get("view_count")]
        c["med"] = statistics.median(es) if len(es) >= 4 else None
        # a busca e a lista do canal podem vir em escalas diferentes (mil x unidade): usa a da lista do canal
        mine = next((e.get("view_count") for e in meds.get(c["cid"], []) if e and e.get("id") == c["id"]), None)
        base = mine or c["v"]
        m = base / c["med"] if c["med"] else None
        if m and mine is None and m > 200:  # a lista do canal veio em milhares e a busca em unidades
            m = m / 1000
        c["mult"] = round(m, 1) if m else None
    cand.sort(key=lambda x: -(x["mult"] or 0))
    linhas = ["| Mult. | Views | Dias | Canal | Título |", "|---|---|---|---|---|"]
    for c in cand[: a.top]:
        dias = f"{c['idade']:.0f}" if c["idade"] is not None else "?"
        views = f"{c['v']:,}".replace(",", ".")
        linhas.append(f"| {c['mult'] or '?'}x | {views} | {dias} | {c['canal']} | [{c['titulo']}](https://youtu.be/{c['id']}) |")
        try:
            urllib.request.urlretrieve(f"https://i.ytimg.com/vi/{c['id']}/hqdefault.jpg", os.path.join(a.saida, "capas", c["id"] + ".jpg"))
        except Exception:
            pass
    open(os.path.join(a.saida, "ranking.md"), "w", encoding="utf-8").write("\n".join(linhas) + "\n")
    try:  # folha com as capas, para olhar de uma vez
        from PIL import Image
        imgs = [os.path.join(a.saida, "capas", c["id"] + ".jpg") for c in cand[: a.top]]
        imgs = [i for i in imgs if os.path.exists(i)]
        if imgs:
            cols = 4; lw, lh = 320, 180
            folha = Image.new("RGB", (cols * lw, ((len(imgs) + cols - 1) // cols) * lh), (17, 17, 20))
            for k, i in enumerate(imgs):
                folha.paste(Image.open(i).convert("RGB").resize((lw, lh)), ((k % cols) * lw, (k // cols) * lh))
            folha.save(os.path.join(a.saida, "capas.jpg"), quality=85)
    except Exception:
        pass
    print("\n".join(linhas))


if __name__ == "__main__":
    main()
