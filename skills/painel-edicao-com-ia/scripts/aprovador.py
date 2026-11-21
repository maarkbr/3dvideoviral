#!/usr/bin/env python3
"""Aprovador do painel: a ponte entre o Claude em segundo plano e a pessoa na frente do painel (protocolo MCP, stdin/stdout).
O Claude chama a ferramenta "aprovar" sempre que quer fazer algo que precisa de permissão. Este processo NÃO decide nada:
repassa o pedido ao servidor do painel (que aplica as regras ou mostra Permitir/Negar) e devolve a resposta.
Sem resposta do painel (fora do ar, tempo esgotado), a resposta é sempre negar.
Recebe PAINEL_PORTA, PAINEL_CHAVE e PAINEL_PROJETO pelo ambiente (definidos pelo motor que abriu a sessão)."""
import json, os, sys, urllib.request

# o Claude fala JSON em UTF-8; no Windows o padrão do Python é cp1252, que quebra acento e derruba a leitura
for _f in (sys.stdin, sys.stdout):
    try:
        _f.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
PORTA, CHAVE, PROJ = os.environ.get("PAINEL_PORTA", ""), os.environ.get("PAINEL_CHAVE", ""), os.environ.get("PAINEL_PROJETO", "")


def negar(motivo):
    return {"behavior": "deny", "message": motivo}


def pergunta(ferramenta, entrada):
    corpo = json.dumps({"projeto": PROJ, "ferramenta": ferramenta, "entrada": entrada}).encode()
    req = urllib.request.Request(f"http://127.0.0.1:{PORTA}/api/v2/aprovar", data=corpo, method="POST",
                                 headers={"Content-Type": "application/json", "X-Painel-Chave": CHAVE, "Host": f"127.0.0.1:{PORTA}"})
    try:
        r = json.loads(urllib.request.urlopen(req, timeout=60 * 60).read())
        if r.get("behavior") in ("allow", "deny"):
            return r
    except Exception:
        pass
    return negar("O painel não respondeu ao pedido de permissão; nada foi permitido.")


def responde(i, result):
    sys.stdout.write(json.dumps({"jsonrpc": "2.0", "id": i, "result": result}) + "\n")
    sys.stdout.flush()


for linha in sys.stdin:
    try:
        m = json.loads(linha)
    except ValueError:
        continue
    if "id" not in m:
        continue  # notificação
    met = m.get("method")
    if met == "initialize":
        responde(m["id"], {"protocolVersion": (m.get("params") or {}).get("protocolVersion", "2024-11-05"),
                           "capabilities": {"tools": {}}, "serverInfo": {"name": "painel", "version": "0.1.0"}})
    elif met == "ping":
        responde(m["id"], {})
    elif met == "tools/list":
        responde(m["id"], {"tools": [{"name": "aprovar", "description": "Pede à pessoa no painel permissão para uma ação.",
                                      "inputSchema": {"type": "object", "properties": {"tool_name": {"type": "string"},
                                                      "input": {"type": "object"}, "tool_use_id": {"type": "string"}},
                                                      "required": ["tool_name", "input"]}}]})
    elif met == "tools/call":
        a = (m.get("params") or {}).get("arguments") or {}
        r = pergunta(str(a.get("tool_name", "")), a.get("input") or {})
        # quando permite, a entrada volta igual: o aprovador nunca altera o que o Claude pediu
        saida = {"behavior": "allow", "updatedInput": a.get("input") or {}} if r["behavior"] == "allow" \
            else {"behavior": "deny", "message": r.get("message") or "Negado no painel."}
        responde(m["id"], {"content": [{"type": "text", "text": json.dumps(saida)}]})
    else:
        sys.stdout.write(json.dumps({"jsonrpc": "2.0", "id": m["id"], "error": {"code": -32601, "message": "método não suportado"}}) + "\n")
        sys.stdout.flush()
