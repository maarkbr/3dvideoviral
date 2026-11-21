#!/usr/bin/env python3
"""Busca temas de mapa e história que já viralizaram lá fora (Shorts com milhões de views) para a pessoa escolher.

  python3 buscar_temas.py [--min 3000000] [--top 20] [--saida temas.md]
        olha os Shorts dos canais de referência (canais.json, ao lado deste script) e uma busca por palavras no YouTube,
        e lista os vídeos acima do mínimo de views: views, título, canal, link.
  python3 buscar_temas.py --texto <link>
        baixa a legenda automática (YouTube) ou o áudio (TikTok, Instagram público) do vídeo escolhido e salva o texto
        em referencia.txt, para o Claude escrever o roteiro em português a partir dos FATOS (nunca copiando a narração).

Só leitura pública com o yt-dlp; nada de login. O Instagram costuma pedir login: aí a pessoa cola o texto ou outro link.
"""
import argparse, json, os, re, shutil, subprocess, sys, statistics
from concurrent.futures import ThreadPoolExecutor

AQUI = os.path.dirname(os.path.abspath(__file__))
# o yt-dlp do sistema ou o que o painel instala no Python da pasta (pip install yt-dlp)
YTDLP = [shutil.which("yt-dlp")] if shutil.which("yt-dlp") else [sys.executable, "-m", "yt_dlp"]
BUSCAS = ["why is this country shaped like this #shorts", "what if countries swapped places #shorts", "history map animation #shorts",
          "strangest border in the world #shorts", "how did this country get its shape #shorts", "geography facts map #shorts"]


def ytdlp_json(url, n=40):
    r = subprocess.run(YTDLP + ["--flat-playlist", "-J", "--playlist-end", str(n), url], capture_output=True, text=True, timeout=240)
    try:
        return json.loads(r.stdout) or {}
    except ValueError:
        return {}


def busca(minimo, top):
    canais = json.load(open(os.path.join(AQUI, "canais.json"), encoding="utf-8"))
    urls = [f"https://www.youtube.com/channel/{c['id']}/shorts" for c in canais] + ["ytsearch40:" + q for q in BUSCAS]
    with ThreadPoolExecutor(6) as ex:
        res = list(ex.map(ytdlp_json, urls))
    vistos, lista = set(), []
    for d in res:
        canal = d.get("channel") or d.get("uploader")
        es = [e for e in (d.get("entries") or []) if e and e.get("view_count")]
        med = statistics.median([e["view_count"] for e in es]) if len(es) >= 4 and "/shorts" in (d.get("webpage_url") or "") else None
        for e in es:
            if e["id"] in vistos or e["view_count"] < minimo:
                continue
            if (e.get("duration") or 60) > 180:
                continue
            vistos.add(e["id"])
            lista.append({"views": e["view_count"], "titulo": e.get("title", ""), "canal": e.get("channel") or canal,
                          "mult": round(e["view_count"] / med, 1) if med else None, "link": f"https://youtube.com/shorts/{e['id']}"})
    lista.sort(key=lambda x: -x["views"])
    return lista[:top]


def texto(link):
    pasta = os.getcwd()
    if "youtu" in link:
        subprocess.run(YTDLP + ["--skip-download", "--write-auto-subs", "--sub-langs", "en.*,pt.*", "--sub-format", "vtt", "-o", "referencia", link],
                       capture_output=True, timeout=240)
        vtts = [f for f in os.listdir(pasta) if f.startswith("referencia") and f.endswith(".vtt")]
        if vtts:
            linhas, ult = [], ""
            for l in open(vtts[0], encoding="utf-8"):
                l = re.sub(r"<[^>]+>", "", l).strip()
                if not l or "-->" in l or l.startswith(("WEBVTT", "Kind:", "Language:")) or l == ult:
                    continue
                linhas.append(l); ult = l
            open("referencia.txt", "w", encoding="utf-8").write(" ".join(linhas))
            return "referencia.txt (legenda do YouTube)"
    # TikTok / Instagram / sem legenda: baixa o áudio e transcreve com o faster-whisper
    subprocess.run(YTDLP + ["-x", "--audio-format", "wav", "-o", "referencia.%(ext)s", link], capture_output=True, timeout=600)
    if not os.path.exists("referencia.wav"):
        sys.exit("não consegui baixar esse link (o Instagram costuma pedir login). Peça outro link ou o texto do vídeo.")
    import numpy as np, wave
    from faster_whisper import WhisperModel
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "referencia.wav", "-ar", "16000", "-ac", "1", "ref16.wav"], check=True)
    w = wave.open("ref16.wav"); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    seg, _ = WhisperModel("small", compute_type="int8").transcribe(x)
    open("referencia.txt", "w", encoding="utf-8").write(" ".join(s.text.strip() for s in seg))
    return "referencia.txt (transcrito do áudio)"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--min", type=int, default=3_000_000); ap.add_argument("--top", type=int, default=20)
    ap.add_argument("--saida", default="temas.md"); ap.add_argument("--texto")
    a = ap.parse_args()
    if a.texto:
        return print("ok:", texto(a.texto))
    lista = busca(a.min, a.top)
    linhas = [f"# Temas em alta (Shorts de mapa e história, {a.min:,}+ views)".replace(",", "."), "",
              "| Views | Título original | Canal | Link |", "|---|---|---|---|"]
    for x in lista:
        linhas.append(f"| {x['views']:,} | {x['titulo']} | {x['canal']} | {x['link']} |".replace(",", "."))
    open(a.saida, "w", encoding="utf-8").write("\n".join(linhas) + "\n")
    print("\n".join(linhas))
    if not lista:
        print("\nNada acima do mínimo agora. Rode de novo com --min 1000000.")


if __name__ == "__main__":
    main()
