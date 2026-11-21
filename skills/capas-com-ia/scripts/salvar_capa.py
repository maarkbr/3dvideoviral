"""Baixa a capa caprichada que o Higgsfield gerou e deixa no tamanho certo do formato.

Fluxo pelo MCP do Higgsfield: generate_image (gpt_image_2_6) devolve o job; jobs_wait devolve o link do resultado
quando a capa fica pronta. Este script baixa esse link, guarda o original e salva a capa em 1080x1920 (9:16) ou 1280x720 (16:9).

uso: python salvar_capa.py <link do resultado ou arquivo já baixado> <saida.jpg> --formato 9:16|16:9 [--original <arquivo>]
  --original: onde guardar o arquivo original em alta (ex.: <pasta do vídeo>/capa/<nome>-original.png). Fica fora de Prontos/.
Só baixa por https, de um endereço da internet.
"""
import argparse
import http.client
import io
import os
import sys
import urllib.error
import urllib.request

from comum import FORMATOS, cobre
from enviar_referencias import endereco_ok

MAX = 60 * 1024 ** 2


def baixa(url, tentativas=3):
    """Baixa o arquivo inteiro: lê até o fim e confere com o Content-Length (uma conexão cortada no meio,
    como pode acontecer na área isolada do painel, devolveria só um pedaço sem avisar). Tenta de novo se vier pela metade."""
    if not endereco_ok(url):
        sys.exit("Esse link não é um https da internet. Use o result_url que o jobs_wait devolveu.")
    motivo = ""
    for _ in range(tentativas):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "capas-com-ia/1.0"}), timeout=180) as r:
                esperado = int(r.headers.get("Content-Length") or 0)
                partes, total = [], 0
                while True:
                    bloco = r.read(1024 * 1024)
                    if not bloco:
                        break
                    partes.append(bloco); total += len(bloco)
                    if total > MAX:
                        sys.exit("O arquivo é grande demais para ser a capa. Confira o link.")
                dados = b"".join(partes)
            if esperado and len(dados) != esperado:
                motivo = f"veio {len(dados)} de {esperado} bytes"
                continue
            return dados
        except (urllib.error.URLError, OSError, http.client.HTTPException) as e:
            motivo = str(getattr(e, "reason", e))
    sys.exit(f"Não consegui baixar a capa inteira ({motivo}). A capa continua no Higgsfield: tente de novo em instantes "
             "ou baixe o result_url para um arquivo e passe o caminho dele no lugar do link.")


def main():
    ap = argparse.ArgumentParser(description="Salva a capa gerada no Higgsfield no tamanho do formato")
    ap.add_argument("url")
    ap.add_argument("saida")
    ap.add_argument("--formato", choices=sorted(FORMATOS), required=True)
    ap.add_argument("--original", help="onde guardar o original em alta (fora de Prontos/)")
    a = ap.parse_args()

    from PIL import Image
    if os.path.isfile(a.url):  # já baixado (ex.: por outro caminho): só abre
        dados = open(a.url, "rb").read()
    else:
        dados = baixa(a.url)
    try:
        img = Image.open(io.BytesIO(dados))
        img.load()
    except Exception as e:
        sys.exit(f"O link não trouxe uma imagem inteira ({len(dados)} bytes, começa com {dados[:12]!r}; {e}). "
                 "Confira se é o result_url do jobs_wait e tente de novo.")

    if a.original:
        orig = os.path.abspath(a.original)
        os.makedirs(os.path.dirname(orig), exist_ok=True)
        open(orig, "wb").write(dados)
    saida = os.path.abspath(a.saida)
    os.makedirs(os.path.dirname(saida), exist_ok=True)
    w, h = FORMATOS[a.formato]
    cobre(img.convert("RGB"), w, h).save(saida, quality=92)
    print(f"ok: {saida} ({w}x{h})" + (f" | original: {orig} ({img.width}x{img.height})" if a.original else ""))
    print("Confira letra por letra o texto e os acentos antes de entregar.")


if __name__ == "__main__":
    main()
