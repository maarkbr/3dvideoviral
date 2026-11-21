#!/usr/bin/env python3
"""Modo caprichado, passo 2: anima cada ilustração (cenas/bN.jpg) num clipe curto no Higgsfield (Seedance 2.0 Mini).

uso: python3 animar_cenas.py <pasta do vídeo> [--so 2,4] [--custo] [--modelo seedance_2_0_mini] [--mcp] [--resultados arq.json]
Anima as cenas que têm "imagem" e "animar" (o que se mexe na cena, em inglês). Saída: clipes/bN.mp4 (720x1280, 5 s, sem som).
O montar.py encaixa cada clipe no tempo do bloco (acelera ou desacelera até 30%) e o código desenha por cima: legenda,
número, setas, selo e o "comenta".
Por que o Higgsfield: as páginas de palitinho que estouram têm os bonecos se mexendo de verdade. O Claude sozinho não anima
uma ilustração assim; é o modelo de vídeo (imagem para vídeo) que faz. Custo: 5 créditos por clipe (Seedance 2.0 Mini, 720p).
--mcp: escreve clipes/pedido.json para o Claude gerar pelo conector (generate_video, start_image = a cena) e depois
--resultados clipes/resultados.json {"N": "result_url"} baixa os clipes.
"""
import argparse, json, os, subprocess, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor

CUSTO = {"seedance_2_0_mini": 5, "grok_video_v15_lite": 5, "minimax_hailuo": 6}
BASE = ("Hand-drawn 2D cartoon animation. Keep the exact drawing style, colors, characters and any written text unchanged. "
        "Static camera: no zoom, no pan, no camera movement. Gentle, simple cartoon motion, like a stick figure explainer channel. Motion: ")


def baixa(url, saida):
    if not url.startswith("https://"):
        raise SystemExit("link inválido: use o result_url do Higgsfield")
    req = urllib.request.Request(url, headers={"User-Agent": "edicao-com-ia/1.0"})
    open(saida, "wb").write(urllib.request.urlopen(req, timeout=300).read())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pasta"); ap.add_argument("--so"); ap.add_argument("--custo", action="store_true")
    ap.add_argument("--modelo", default="seedance_2_0_mini", choices=list(CUSTO)); ap.add_argument("--mcp", action="store_true")
    ap.add_argument("--resultados")
    a = ap.parse_args()
    P = os.path.abspath(a.pasta); os.chdir(P); os.makedirs("clipes", exist_ok=True)
    blocos = json.load(open("roteiro.json", encoding="utf-8"))["blocos"]
    quais = [int(x) for x in a.so.split(",")] if a.so else [i for i, b in enumerate(blocos, 1) if b["cena"].get("animar") and b["cena"].get("imagem")]
    faltam = [i for i in quais if not os.path.exists(blocos[i - 1]["cena"].get("imagem", ""))]
    if faltam:
        sys.exit(f"Falta a ilustração dos blocos {faltam}: rode o gerar_cenas.py antes.")
    print(f"{len(quais)} clipe(s) x {CUSTO[a.modelo]} = {len(quais) * CUSTO[a.modelo]} créditos ({a.modelo}, 720p, 5 s)")
    if a.custo or not quais:
        return
    if a.resultados:
        res = json.load(open(a.resultados, encoding="utf-8"))
        for i in quais:
            u = res.get(str(i))
            if u: baixa(u, f"clipes/b{i}.mp4"); print(f"b{i}: ok")
            else: print(f"b{i}: sem resultado")
        return
    if a.mcp:
        pedido = [{"bloco": i, "model": a.modelo, "prompt": BASE + blocos[i - 1]["cena"]["animar"], "start_image": blocos[i - 1]["cena"]["imagem"],
                   "aspect_ratio": "9:16", "duration": 5, "resolution": "720p", "generate_audio": False, "saida": f"clipes/b{i}.mp4"} for i in quais]
        json.dump(pedido, open("clipes/pedido.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print("clipes/pedido.json pronto: gere cada um no conector do Higgsfield, espere (jobs_wait), grave clipes/resultados.json"
              " {\"N\": \"result_url\"} e rode de novo com --resultados clipes/resultados.json")
        return

    def anima(i):
        c = blocos[i - 1]["cena"]
        cmd = ["higgsfield", "generate", "create", a.modelo, "--prompt", BASE + c["animar"], "--start-image", c["imagem"],
               "--aspect_ratio", "9:16", "--duration", "5", "--resolution", "720p", "--wait", "--wait-timeout", "15m", "--json"]
        if a.modelo == "seedance_2_0_mini":
            cmd += ["--generate_audio", "false"]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=1200)
        try:
            d = json.loads(r.stdout); d = d[0] if isinstance(d, list) else d
            url = d.get("result_url") or ((d.get("results") or [{}])[0].get("url", ""))
        except ValueError:
            url = ""
        open(f"clipes/b{i}.job.json", "w").write(r.stdout)
        if not url.startswith("https://"):
            return f"b{i}: a animação falhou ({(r.stderr or r.stdout)[-200:].strip()})"
        baixa(url, f"clipes/b{i}.mp4")
        return f"b{i}: ok"

    with ThreadPoolExecutor(3) as ex:
        for msg in ex.map(anima, quais):
            print(msg)
    print("Confira cada clipe (o desenho não pode mudar, o texto da placa continua igual). Errou: --so N.")


if __name__ == "__main__":
    main()
