#!/usr/bin/env python3
"""Gancho (hook) do Codex no painel: roda antes de cada comando, edição de arquivo ou ferramenta do Codex.
Não decide nada sozinho: traduz o pedido para o vocabulário do aprovador e pergunta ao painel (/api/v2/aprovar), que aplica
as regras de sempre ou mostra o cartão Permitir/Negar. Sem resposta do painel, nega.
Recebe o caminho do arquivo .painel/codex-<projeto>.json (porta, chave do aprovador, projeto), que o Codex não consegue ler."""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import motor_codex as M  # noqa: E402


def main():
    try:
        evento = json.load(sys.stdin)
        conf = json.load(open(sys.argv[1], encoding="utf-8"))
    except Exception:
        print(json.dumps(M.saida_gancho("PreToolUse", "deny", "O painel não conseguiu conferir este pedido.")))
        return
    arq_cache = sys.argv[1][:-5] + "-gancho.json"
    try:
        cache = {k: tuple(v) for k, v in json.load(open(arq_cache, encoding="utf-8")).items()}
    except Exception:
        cache = {}
    nome = evento.get("hook_event_name") or "PreToolUse"
    if nome not in ("PreToolUse", "PermissionRequest"):
        return
    dec, motivo = M.decide_gancho(evento, conf, cache)
    try:
        import time
        cache = {k: v for k, v in cache.items() if time.time() - v[0] < 60}
        tmp = arq_cache + ".tmp"
        json.dump(cache, open(tmp, "w", encoding="utf-8"))
        os.chmod(tmp, 0o600)
        os.replace(tmp, arq_cache)
    except Exception:
        pass
    s = M.saida_gancho(nome, dec, motivo)
    if s:
        print(json.dumps(s, ensure_ascii=False))


if __name__ == "__main__":
    main()
