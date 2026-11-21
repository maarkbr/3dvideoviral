"""Manda as imagens de referência da capa caprichada (o modelo de arte, os quadros do vídeo, a logo) para o Higgsfield.

Fluxo pelo MCP do Higgsfield (conector do app do Claude):
  1. ferramenta media_upload com files=[{filename, content_type}, ...] -> devolve, para cada arquivo, um media_id e um upload_url;
  2. este script envia os arquivos para os upload_url;
  3. ferramenta media_confirm com media_ids=[...] e type="image" (só os que saíram "ok" aqui).

uso: python enviar_referencias.py <arquivo> <upload_url> [<arquivo> <upload_url> ...]
Só envia por https e para um endereço da internet (nunca para o próprio computador ou a rede de casa).
Sai com código 1 se algum envio falhar: não confirme o media_id desse arquivo.
"""
import ipaddress
import mimetypes
import os
import sys
import urllib.error
import urllib.request
from urllib.parse import urlparse

TIPOS = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
MAX = 30 * 1024 ** 2


def endereco_ok(url):
    u = urlparse(url)
    host = (u.hostname or "").lower()
    if u.scheme != "https" or not host or host == "localhost" or host.endswith((".local", ".localhost", ".internal")):
        return False
    try:
        ip = ipaddress.ip_address(host)
        return ip.is_global
    except ValueError:
        return "." in host


def envia(arquivo, url):
    ext = os.path.splitext(arquivo)[1].lower()
    tipo = TIPOS.get(ext) or mimetypes.guess_type(arquivo)[0] or ""
    if not tipo.startswith("image/"):
        return f"não é imagem (use jpg, png ou webp): {arquivo}"
    if not os.path.isfile(arquivo):
        return f"não achei o arquivo: {arquivo}"
    if os.path.getsize(arquivo) > MAX:
        return f"imagem grande demais (mais de 30 MB): {arquivo}"
    if not endereco_ok(url):
        return "o link de envio não é um https da internet; peça outro com media_upload"
    dados = open(arquivo, "rb").read()
    # o User-Agent é obrigatório: o padrão do Python ("Python-urllib") é barrado pela proteção do Higgsfield (erro 1010)
    req = urllib.request.Request(url, data=dados, method="PUT",
                                 headers={"Content-Type": tipo, "Content-Length": str(len(dados)), "User-Agent": "capas-com-ia/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return "ok" if 200 <= r.status < 300 else f"o Higgsfield respondeu {r.status}"
    except urllib.error.HTTPError as e:
        return f"o Higgsfield respondeu {e.code} (o link pode ter vencido: peça outro com media_upload)"
    except (urllib.error.URLError, OSError) as e:
        return f"sem conexão com o Higgsfield ({getattr(e, 'reason', e)})"


def main():
    args = sys.argv[1:]
    if not args or len(args) % 2:
        sys.exit(__doc__)
    falhou = False
    for arquivo, url in zip(args[0::2], args[1::2]):
        res = envia(os.path.abspath(arquivo), url)
        falhou |= res != "ok"
        print(f"{os.path.basename(arquivo)}: {res}")
    if falhou:
        sys.exit(1)
    print("Tudo enviado. Agora confirme com media_confirm (type image) os media_id destes arquivos.")


if __name__ == "__main__":
    main()
