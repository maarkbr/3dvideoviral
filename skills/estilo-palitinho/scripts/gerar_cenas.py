#!/usr/bin/env python3
"""Modo caprichado: gera as ilustrações das cenas no Higgsfield (GPT Image 2.6), no estilo das páginas virais de palitinho.

uso: python3 gerar_cenas.py <pasta do vídeo> [--so 2,4] [--custo] [--qualidade medium|high] [--mcp] [--resultados arq.json]
Gera uma imagem para cada bloco do roteiro cuja cena tem "prompt" (tipo "ilustracao", ou qualquer cena com "imagem" + "prompt").
Toda imagem leva ref/estilo.png (a folha de estilo do personagem) como Image 1, para o vídeo inteiro sair igual.
Saída: cenas/bN.png (original) e cenas/bN.jpg (1080x1920, o que o kit usa).

Dois jeitos de gerar:
- CLI do Higgsfield instalado e logado (computador do Lucas): gera direto.
- --mcp (aluno, com o Higgsfield conectado por MCP no Claude): escreve cenas/pedido.json com o prompt, as referências e a
  saída de cada cena. O Claude chama o generate_image do Higgsfield para cada uma (model gpt_image_2_6, 9:16, os mesmos
  media_ids das referências), espera com jobs_wait, grava {"N": "<result_url>"} em cenas/resultados.json e roda de novo
  com --resultados cenas/resultados.json para baixar e converter.
Custo: medium 2k = 1 crédito por imagem; high 2k = 2,75. Sem crédito ou sem Higgsfield: use o modo simples (só código).
"""
import argparse, json, os, re, subprocess, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor

CUSTO = {"medium": 1.0, "high": 2.75}
ESTILO = (
    "Vertical 9:16 hand-drawn 2D cartoon illustration for a short video, in the style of viral stick figure explainer channels. "
    "Image 1 is the style and character reference: copy its drawing style exactly (clean black marker outlines, flat warm colors with "
    "a light watercolor and paper texture, rich storytelling details) and keep the main character identical (big white round head, "
    "big round eyes, spiky black hair, blue t-shirt, dark pants, thin black stick limbs). Other people are simple stick figures in the "
    "same style. Keep every important element between 8% and 62% of the height; the band between 64% and 80% of the height must stay "
    "plain and calm (subtitles go there). No watermark, no logos, no extra text besides the exact text given."
)


def prompt_da(c):
    p = ESTILO + " Scene: " + c["prompt"]
    if c.get("texto_na_imagem"):
        p += " Text written in the image, exactly, Brazilian Portuguese with correct accents: " + "; ".join(f'"{t}"' for t in c["texto_na_imagem"]) + "."
    return p


def converte(png, jpg):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", png, "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
                    "-q:v", "2", jpg], check=True)


def baixa(url, saida):
    if not url.startswith("https://"):
        raise SystemExit("link inválido: use o result_url do Higgsfield")
    req = urllib.request.Request(url, headers={"User-Agent": "edicao-com-ia/1.0"})
    open(saida, "wb").write(urllib.request.urlopen(req, timeout=180).read())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pasta"); ap.add_argument("--so"); ap.add_argument("--custo", action="store_true")
    ap.add_argument("--qualidade", default="medium", choices=list(CUSTO)); ap.add_argument("--mcp", action="store_true")
    ap.add_argument("--resultados")
    a = ap.parse_args()
    P = os.path.abspath(a.pasta); os.chdir(P); os.makedirs("cenas", exist_ok=True)
    blocos = json.load(open("roteiro.json", encoding="utf-8"))["blocos"]
    quais = [int(x) for x in a.so.split(",")] if a.so else [i for i, b in enumerate(blocos, 1) if b["cena"].get("prompt")]
    if not quais:
        sys.exit("Nenhuma cena com \"prompt\" no roteiro.")
    if not os.path.exists("ref/estilo.png"):
        sys.exit("Falta ref/estilo.png (a folha de estilo do personagem). Gere uma antes (veja references/modo-caprichado.md).")
    q = a.qualidade
    print(f"{len(quais)} imagem(ns) x {CUSTO[q]} = {len(quais) * CUSTO[q]:.2f} créditos ({q}, 2k)")
    if a.custo:
        return

    if a.resultados:  # passo 2 do MCP: baixa e converte
        res = json.load(open(a.resultados, encoding="utf-8"))
        for i in quais:
            u = res.get(str(i))
            if not u: print(f"b{i}: sem resultado"); continue
            baixa(u, f"cenas/b{i}.png"); converte(f"cenas/b{i}.png", f"cenas/b{i}.jpg"); print(f"b{i}: ok")
        return

    if a.mcp:  # passo 1 do MCP: o pedido para o Claude executar no conector
        pedido = [{"bloco": i, "prompt": prompt_da(blocos[i - 1]["cena"]), "aspect_ratio": "9:16", "quality": q, "resolution": "2k",
                   "model": "gpt_image_2_6", "referencias": ["ref/estilo.png"] + blocos[i - 1]["cena"].get("refs", []),
                   "saida": f"cenas/b{i}.png"} for i in quais]
        json.dump(pedido, open("cenas/pedido.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print("cenas/pedido.json pronto: suba as referências (media_upload), gere cada uma com o generate_image, espere (jobs_wait),"
              " grave cenas/resultados.json {\"N\": \"result_url\"} e rode de novo com --resultados cenas/resultados.json")
        return

    def gera(i):
        c = blocos[i - 1]["cena"]
        cmd = ["higgsfield", "generate", "create", "gpt_image_2_6", "--prompt", prompt_da(c), "--aspect_ratio", "9:16",
               "--quality", q, "--resolution", "2k", "--wait", "--json", "--image", "ref/estilo.png"]
        for r in c.get("refs", []):
            cmd += ["--image", r]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=900)
        try:  # o JSON traz também o link das imagens de referência: o resultado é o result_url (ou results[0].url)
            d = json.loads(r.stdout); d = d[0] if isinstance(d, list) else d
            url = d.get("result_url") or ((d.get("results") or [{}])[0].get("url", ""))
        except ValueError:
            url = ""
        open(f"cenas/b{i}.job.json", "w").write(r.stdout)
        if not url.startswith("https://"):
            return f"b{i}: a geração falhou ({(r.stderr or r.stdout)[-200:].strip()})"
        baixa(url, f"cenas/b{i}.png"); converte(f"cenas/b{i}.png", f"cenas/b{i}.jpg")
        open(f"cenas/b{i}.prompt.txt", "w", encoding="utf-8").write(prompt_da(c) + "\n")
        return f"b{i}: ok"

    with ThreadPoolExecutor(4) as ex:
        for msg in ex.map(gera, quais):
            print(msg)
    print("Confira cada imagem (o texto escrito nela, letra por letra, e se a área da legenda ficou limpa). Errou: --so N.")


if __name__ == "__main__":
    main()
