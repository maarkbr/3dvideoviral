"""Modo lote: vários cortes do mesmo podcast, uma etapa de cada vez para todos.

uso: lote.py <pasta_dos_cortes> status
     lote.py <pasta_dos_cortes> brutos      [--refazer]   cortar.py --render em cada corte que tem edl.json
     lote.py <pasta_dos_cortes> qa                        qa_corte.py em cada corte bruto (emendas)
     lote.py <pasta_dos_cortes> preparar    [--refazer]   transcreve cada corte bruto + enquadramento do rosto
     lote.py <pasta_dos_cortes> montar      [--refazer]   montar_vertical.py em cada corte que tem plano.json
     lote.py <pasta_dos_cortes> render      [--refazer]   render do HyperFrames + master (−14 LUFS) de cada projeto
     lote.py <pasta_dos_cortes> tudo                      brutos → preparar → montar → render (pula o que já existe)

Cada corte é uma subpasta (ex.: cortes/01-nome-do-corte/) com: edl.json, decupagem.md, corte_bruto.mp4,
work/transcricao_corte.json, work/enquadramento.json, plano.json, vertical/ (projeto), entrega/ (final).
Roda um corte por vez (CPU), mostra o andamento e continua nos outros se um falhar.
Use o Python do ambiente virtual do projeto (.venv) para rodar este script.
"""
import json
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
PY = sys.executable


def sh(cmd, cwd=None, log=None):
    t = time.time()
    with open(log, "w", encoding="utf-8") if log else open(os.devnull, "w") as f:
        r = subprocess.run(cmd, cwd=cwd, stdout=f, stderr=subprocess.STDOUT)
    return r.returncode, time.time() - t


def dur(path):
    try:
        out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                             capture_output=True, text=True, timeout=60).stdout.strip()
        return float(out)
    except Exception:  # noqa: BLE001
        return None


def cortes(root):
    return sorted(os.path.join(root, d) for d in os.listdir(root)
                  if os.path.isdir(os.path.join(root, d)) and os.path.exists(os.path.join(root, d, "edl.json")))


def projeto(c):
    p = os.path.join(c, "plano.json")
    if os.path.exists(p):
        s = json.load(open(p, encoding="utf-8")).get("saida", "vertical")
        return os.path.normpath(os.path.join(c, s))
    return os.path.join(c, "vertical")


def entrega(c):
    d = os.path.join(c, "entrega")
    if os.path.isdir(d):
        for f in os.listdir(d):
            if f.endswith(".mp4"):
                return os.path.join(d, f)
    return None


def status(root):
    print(f"{'corte':28s} {'bruto':>8s} {'transc.':>8s} {'enquadr.':>9s} {'plano':>6s} {'projeto':>8s} {'render':>7s} {'entrega':>8s}")
    for c in cortes(root):
        b = os.path.join(c, "corte_bruto.mp4")
        d = dur(b) if os.path.exists(b) else None
        ok = lambda p: "✓" if os.path.exists(p) else "·"  # noqa: E731
        pj = projeto(c)
        ent = entrega(c)
        pp = os.path.join(c, "plano.json")
        tr = json.load(open(pp, encoding="utf-8")).get("transcricao", "work/transcricao_corte.json") if os.path.exists(pp) else "work/transcricao_corte.json"
        print(f"{os.path.basename(c)[:28]:28s} {(f'{d:.1f}s' if d else '·'):>8s} {ok(os.path.join(c, tr)):>8s} "
              f"{ok(os.path.join(c, 'work', 'enquadramento.json')):>9s} {ok(os.path.join(c, 'plano.json')):>6s} {ok(os.path.join(pj, 'index.html')):>8s} "
              f"{ok(os.path.join(c, 'work', 'vertical_raw.mp4')):>7s} {('✓' if ent else '·'):>8s}")


def etapa(nome, root, fn):
    lista = cortes(root)
    print(f"== {nome}: {len(lista)} corte(s)")
    falhas = []
    for i, c in enumerate(lista, 1):
        try:
            r = fn(c)
        except Exception as e:  # noqa: BLE001
            r = f"erro: {e}"
        tag = os.path.basename(c)
        if r is None:
            print(f"  [{i}/{len(lista)}] {tag}: já feito (use --refazer)")
        elif isinstance(r, str):
            print(f"  [{i}/{len(lista)}] {tag}: {r}")
            if r.startswith("erro") or r.startswith("falhou"):
                falhas.append(tag)
        sys.stdout.flush()
    if falhas:
        print(f"  ! falharam: {', '.join(falhas)} — veja os logs em <corte>/work/")
    return not falhas


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    root, cmd = os.path.abspath(sys.argv[1]), sys.argv[2]
    refazer = "--refazer" in sys.argv

    def brutos(c):
        out = os.path.join(c, json.load(open(os.path.join(c, "edl.json"), encoding="utf-8")).get("out", "corte_bruto.mp4"))
        if os.path.exists(out) and not refazer:
            return None
        os.makedirs(os.path.join(c, "work"), exist_ok=True)
        code, t = sh([PY, os.path.join(HERE, "cortar.py"), os.path.join(c, "edl.json"), "--render"], log=os.path.join(c, "work", "cortar.log"))
        return f"corte bruto {dur(out) or 0:.1f}s em {t / 60:.1f} min" if code == 0 else f"falhou (work/cortar.log)"

    def qa(c):
        seg = os.path.join(c, "corte_bruto.mp4.segments.json")
        edl = json.load(open(os.path.join(c, "edl.json"), encoding="utf-8"))
        if not os.path.exists(seg):
            return "sem corte bruto ainda"
        code, t = sh([PY, os.path.join(HERE, "qa_corte.py"), seg, os.path.join(c, edl["transcript"])] + (["--prompt", edl["prompt"]] if edl.get("prompt") else []),
                     log=os.path.join(c, "work", "qa.log"))
        txt = open(os.path.join(c, "work", "qa.log"), encoding="utf-8", errors="replace").read()
        n = txt.count("EXTRA") + txt.count("MISSING")
        return f"{'ok' if n == 0 else str(n) + ' emenda(s) para revisar'} (work/qa.log)" if code == 0 else "falhou (work/qa.log)"

    def preparar(c):
        b = os.path.join(c, "corte_bruto.mp4")
        if not os.path.exists(b):
            return "sem corte bruto ainda"
        tr = os.path.join(c, "work", "transcricao_corte.json")
        eq = os.path.join(c, "work", "enquadramento.json")
        if os.path.exists(tr) and os.path.exists(eq) and not refazer:
            return None
        edl = json.load(open(os.path.join(c, "edl.json"), encoding="utf-8"))
        msgs = []
        if refazer or not os.path.exists(tr):
            code, t = sh([PY, os.path.join(HERE, "transcrever.py"), b, tr, "--modelo", edl.get("model", "small")]
                         + (["--prompt", edl["prompt"]] if edl.get("prompt") else []), log=os.path.join(c, "work", "transcrever.log"))
            if code:
                return "falhou na transcrição (work/transcrever.log)"
            msgs.append(f"transcrição {t / 60:.1f} min")
        if refazer or not os.path.exists(eq):
            seg = os.path.join(c, "corte_bruto.mp4.segments.json")
            code, t = sh([PY, os.path.join(HERE, "enquadramento.py"), b, eq, "--segments", seg, "--folha", os.path.join(c, "work", "enquadramento.jpg")],
                         log=os.path.join(c, "work", "enquadramento.log"))
            if code:
                return "falhou no enquadramento (work/enquadramento.log)"
            msgs.append("enquadramento ok")
        return ", ".join(msgs)

    def montar(c):
        p = os.path.join(c, "plano.json")
        if not os.path.exists(p):
            return "sem plano.json ainda (o agente escreve o plano de cada corte)"
        if os.path.exists(os.path.join(projeto(c), "index.html")) and not refazer:
            return None
        code, t = sh([PY, os.path.join(HERE, "montar_vertical.py"), p], log=os.path.join(c, "work", "montar.log"))
        txt = open(os.path.join(c, "work", "montar.log"), encoding="utf-8", errors="replace").read()
        res = "check ok" if "Check passed" in txt else "check com problemas (work/montar.log)"
        return f"montado em {t / 60:.1f} min, {res}" if code == 0 else "falhou (work/montar.log)"

    def render(c):
        pj = projeto(c)
        if not os.path.exists(os.path.join(pj, "index.html")):
            return "sem projeto montado ainda"
        raw = os.path.join(c, "work", "vertical_raw.mp4")
        if entrega(c) and not refazer:
            return None
        pl = json.load(open(os.path.join(c, "plano.json"), encoding="utf-8"))
        R = pl.get("render", {})
        code, t = sh(["node", os.path.join(HERE, "hf.mjs"), "render", ".", "--fps", str(R.get("fps", 30)), "--crf", str(R.get("crf", 14)),
                      "--browser-timeout", "180", "-o", raw], cwd=pj, log=os.path.join(c, "work", "render.log"))
        if code:
            return "falhou no render (work/render.log)"
        nome = "corte_vertical_" + os.path.basename(c)
        code2, t2 = sh([PY, os.path.join(HERE, "masterizar.py"), raw, os.path.join(c, "entrega"), "--name", nome,
                        "--voice", os.path.join(pj, "assets", "aroll.mp4"), "--sfx", os.path.join(pj, "assets", "sfx.wav"),
                        "--music", os.path.join(pj, "assets", "music_raw.wav")], log=os.path.join(c, "work", "master.log"))
        return f"render {t / 60:.1f} min + master → entrega/{nome}.mp4" if code2 == 0 else "falhou no master (work/master.log)"

    if cmd == "status":
        status(root)
    elif cmd in ("brutos", "qa", "preparar", "montar", "render"):
        etapa(cmd, root, {"brutos": brutos, "qa": qa, "preparar": preparar, "montar": montar, "render": render}[cmd])
        status(root)
    elif cmd == "tudo":
        for nome, fn in (("brutos", brutos), ("preparar", preparar), ("montar", montar), ("render", render)):
            etapa(nome, root, fn)
        status(root)
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
