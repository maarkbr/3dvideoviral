"""Segundo motor do painel: o Codex do ChatGPT, para quem não usa o Claude.

O painel chama `codex exec --json` (com `resume` para continuar a mesma conversa), igual faz com o `claude -p`.
O que muda por baixo, e como cada peça do Claude foi trocada:

- Área isolada: um perfil de permissão do Codex ("painel"), passado por `-c` a cada vez (nada é gravado em ~/.codex).
  Grava só na pasta de trabalho e nas temporárias; não lê as pastas de chaves (NAO_LER), o login do Codex nem o do
  Higgsfield. A internet só abre depois que a pessoa libera uma vez no painel (cartão), e aí abre inteira: o Codex
  ainda não filtra domínio sem um recurso experimental (veja CODEX.md).
- Cartões de permissão: um gancho (hook PreToolUse) roda antes de cada comando, edição de arquivo ou ferramenta e
  pergunta ao painel pela mesma rota do aprovador do Claude (/api/v2/aprovar). As regras são as mesmas: o que é comum
  passa direto, o arriscado vira cartão Permitir/Negar, sem resposta é negado.
- Higgsfield: o Codex não tem o conector do claude.ai. Os comandos `higgsfield` passam por uma ponte do painel
  (codex_bin/higgsfield -> /api/v2/higgsfield): o painel roda o CLI dele fora da área isolada e só depois de um
  cartão quando a ação gasta crédito. O login do Higgsfield fica fora do alcance do Codex.
- Skills: o Codex lê ~/.agents/skills (mesmo formato SKILL.md); o instalador copia as skills para lá também.
"""
import hashlib, json, os, re, secrets, shlex, shutil, subprocess, sys, threading, time, urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
BIN_PONTE = os.path.join(AQUI, "codex_bin")         # o "higgsfield" que o Codex enxerga (a ponte)
GANCHO = os.path.join(AQUI, "gancho_codex.py")
WIN = os.name == "nt"
ESPERA_GANCHO = 31 * 60                              # um pouco mais que ESPERA_PERMISSAO do central


# ---------------- achar o Codex e a conta ----------------
def acha_codex():
    """O Codex de terminal: o que vem dentro do app do ChatGPT (Mac), o do app do Codex, ou um instalado à parte."""
    cands = [os.environ.get("PAINEL_CODEX"), shutil.which("codex")]
    if WIN:
        la = os.environ.get("LOCALAPPDATA", "")
        cands += [shutil.which("codex.cmd"), os.path.join(os.environ.get("APPDATA", ""), "npm", "codex.cmd"),
                  os.path.join(la, "Programs", "ChatGPT", "resources", "codex-cli", "bin", "codex.exe"),
                  os.path.join(la, "OpenAI", "Codex", "bin", "codex.exe")]
    else:
        cands += ["/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex",
                  os.path.expanduser("~/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex"),
                  "/Applications/Codex.app/Contents/Resources/codex",
                  os.path.expanduser("~/.local/bin/codex"), "/opt/homebrew/bin/codex", "/usr/local/bin/codex"]
    for c in cands:
        if c and os.path.isfile(c) and os.access(c, os.X_OK):
            return c
    return None


def login(central):
    """(tem_codex, logado). Confere a cada 60 s, como o do Claude."""
    if not central.codex:
        return False, False
    t, ok = central._login_codex
    if time.time() - t > 60 or ok is None:
        try:
            r = subprocess.run([central.codex, "login", "status"], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=20)
            ok = r.returncode == 0 and "logged in" in (r.stdout + r.stderr).lower()
        except Exception:
            ok = False
        central._login_codex = (time.time(), ok)
    return True, ok


def conectar(central):
    if not central.codex:
        raise ValueError("O Codex não foi encontrado. Instale o app do ChatGPT para Mac (ele já traz o Codex) e abra o painel de novo.")
    # abre o navegador na página da OpenAI; o login fica em ~/.codex/auth.json (o Codex do painel não lê esse arquivo)
    subprocess.Popen([central.codex, "login"], stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    central._login_codex = (0, None)


# ---------------- configuração passada por -c (TOML em linha) ----------------
def toml(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, str):
        return json.dumps(v)  # string básica do TOML (mesmos escapes do JSON)
    if isinstance(v, (list, tuple)):
        return "[" + ", ".join(toml(x) for x in v) + "]"
    if isinstance(v, dict):
        return "{" + ", ".join(f"{json.dumps(str(k))} = {toml(x)}" for k, x in v.items()) + "}"
    raise TypeError(type(v))


def perfil(raiz, oculto, rede, nao_ler):
    """O perfil de permissão "painel": a área isolada do Codex."""
    fs = {":minimal": "read",
          "~/.cache": "write", "~/Library/Caches": "write", "~/.npm": "write",
          "~/.local/state/hyperframes": "write"}  # registro da prévia do HyperFrames
    for x in list(nao_ler) + ["~/.codex/auth.json", "~/.config/higgsfield", oculto]:
        fs[x] = "deny"
    return {"description": "Painel do Edição com IA: grava só na pasta de trabalho, sem chaves nem logins.",
            "extends": ":workspace", "workspace_roots": {raiz: True}, "filesystem": fs, "network": {"enabled": bool(rede)}}


def path_da_ponte():
    """PATH dos comandos do Codex: a ponte do Higgsfield na frente, depois o PATH do painel e os lugares de sempre."""
    extra = [] if WIN else ["/opt/homebrew/bin", "/usr/local/bin", os.path.expanduser("~/.local/bin"), "/usr/bin", "/bin", "/usr/sbin", "/sbin"]
    vistos, out = set(), []
    for p in [BIN_PONTE] + os.environ.get("PATH", "").split(os.pathsep) + extra:
        if p and p not in vistos:
            vistos.add(p); out.append(p)
    return os.pathsep.join(out)


def modelos_codex():
    """Os modelos que o Codex instalado lista (cache dele em ~/.codex); vazio se não houver."""
    try:
        d = json.load(open(os.path.join(os.environ.get("CODEX_HOME") or os.path.expanduser("~/.codex"), "models_cache.json"), encoding="utf-8"))
        return [[str(m["slug"]), str(m.get("display_name") or m["slug"])] for m in d.get("models") or []
                if m.get("slug") and m.get("visibility", "list") == "list"][:12]
    except Exception:
        return []


def comando(codex, *, raiz, oculto, conf_gancho, sistema, sessao, rede, ambiente, nao_ler, modelo=""):
    partes = (sys.executable, GANCHO, conf_gancho)
    gancho = subprocess.list2cmdline(partes) if WIN else " ".join(shlex.quote(x) for x in partes)
    ganchos = [{"matcher": ".*", "hooks": [{"type": "command", "command": gancho, "timeout": ESPERA_GANCHO,
                                             "statusMessage": "Conferindo com o painel"}]}]
    cfg = {
        "default_permissions": "painel",
        "permissions.painel": perfil(raiz, oculto, rede, nao_ler),
        "approval_policy": "never",           # o exec não tem tela de aprovação: quem aprova é o gancho (cartões do painel)
        "allow_login_shell": False,           # sem o shell de login, o PATH da ponte vale (o path_helper do Mac o reordenaria)
        "shell_environment_policy.set": ambiente,
        "hooks.PreToolUse": ganchos,
        "hooks.PermissionRequest": ganchos,
        "developer_instructions": sistema,
    }
    cmd = [codex, "exec"] + (["resume"] if sessao else [])
    if modelo:
        cmd += ["-m", modelo]
    # --ignore-user-config: sem os plugins e MCP da pessoa (navegador, computer use…), como o Claude do painel.
    # --dangerously-bypass-hook-trust: o único gancho que carrega é o do painel (a config da pessoa fica de fora).
    cmd += ["--json", "--skip-git-repo-check", "--ignore-user-config", "--dangerously-bypass-hook-trust"]
    for k, v in cfg.items():
        cmd += ["-c", f"{k}={toml(v)}"]
    cmd += ([sessao] if sessao else []) + ["-"]  # o pedido vai pelo stdin (pode ser longo e começar com "-")
    return cmd


# ---------------- o que aparece no chat ----------------
_DESCR = [
    (r"hyperframes\b[^\n]*\brender\b|\brender\.(mjs|js|py)\b", "Gerando o vídeo"),
    (r"\bhyperframes\b", "Montando as cenas"),
    (r"\bvoz_ia\.py\b|voicestudio|elevenlabs", "Gerando a narração"),
    (r"\bhiggsfield\b[^\n]*\b(generate\s+create|workflow)\b", "Usando o Higgsfield"),
    (r"\bhiggsfield\b[^\n]*\bupload\b", "Enviando as imagens de modelo para o Higgsfield"),
    (r"\bhiggsfield\b[^\n]*\b(account|cost)\b", "Conferindo os créditos do Higgsfield"),
    (r"whisper|transcrev", "Transcrevendo a fala"),
    (r"\bffprobe\b", "Conferindo o vídeo"),
    (r"\bffmpeg\b", "Ajustando o vídeo e o som"),
    (r"\byt-dlp\b", "Baixando a referência"),
    (r"\b(pip3?|npm)\s+install\b|\bnpx\s+-y\b", "Instalando uma ferramenta do estilo"),
    (r"\bcurl\b|\bwget\b", "Baixando um arquivo"),
    (r"\bpainel\.py\b", None),   # etapa e pergunta: o próprio painel mostra
]
_SILENCIO = re.compile(r"^\s*(cd\s+\S+\s*&&\s*)?(ls|cat|sed|head|tail|rg|grep|find|wc|pwd|echo|test|stat|file|which|nl|tree|jq)\b")


def descreve(cmd):
    """Uma frase em português para o comando (o Codex não manda descrição). None = não mostra no chat."""
    c = str(cmd or "")
    for padrao, frase in _DESCR:
        if re.search(padrao, c, re.I):
            return frase
    if _SILENCIO.match(c):
        return None
    if re.search(r"\bpython3?\b|\.py\b|\bnode\b", c):
        return "Rodando uma etapa do estilo"
    return "Trabalhando no vídeo"


# ---------------- tradução das ferramentas do Codex para as regras do painel ----------------
def caminhos_do_patch(texto, cwd):
    """Os arquivos que um apply_patch cria, muda ou apaga."""
    out = []
    for m in re.finditer(r"^\*\*\* (Add File|Update File|Delete File|Move to): (.+)$", str(texto or ""), re.M):
        p = m.group(2).strip()
        out.append((m.group(1), os.path.normpath(p if os.path.isabs(p) else os.path.join(cwd or ".", p))))
    return out


SEM_PERGUNTA = {"update_plan", "request_user_input", "list_mcp_resources", "list_mcp_resource_templates", "read_mcp_resource",
                "web_search", "tool_search", "load_skill"}


def traduz(evento):
    """Do pedido do Codex (stdin do gancho) para a lista de (ferramenta, entrada) no vocabulário do aprovador do painel.
    Devolve ("negar", motivo) quando nem precisa perguntar."""
    nome = str(evento.get("tool_name") or "")
    e = evento.get("tool_input")
    e = e if isinstance(e, dict) else {"command": e} if isinstance(e, str) else {}
    cwd = str(evento.get("cwd") or "")
    fora = evento.get("hook_event_name") == "PermissionRequest" or e.get("sandbox_permissions") in ("require_escalated", "with_additional_permissions")
    if nome in ("Bash", "shell", "exec_command", "local_shell", "unified_exec"):
        cmd = e.get("command") or e.get("cmd") or ""
        cmd = " ".join(cmd) if isinstance(cmd, list) else str(cmd)
        if re.search(r"\bhiggsfield\s+auth\b|\.config/higgsfield|\.codex/auth\.json|\bauth\.json\b", cmd):
            return ("negar", "O login do Higgsfield e o do ChatGPT ficam com o painel: o Codex não mexe neles.")
        entrada = {"command": cmd, "description": descreve(cmd) or "Conferindo os arquivos"}
        if fora:
            entrada["dangerouslyDisableSandbox"] = True
        return [("Bash", entrada)]
    if nome == "apply_patch":
        alvos = caminhos_do_patch(e.get("command") or e.get("input") or e.get("patch") or "", cwd)
        if not alvos:
            return [("Edit", {"file_path": ""})]  # patch que não deu para ler: vira cartão
        out = []
        for tipo, p in alvos:
            if tipo == "Delete File":
                out.append(("Bash", {"command": "rm " + shlex.quote(p), "description": "Apagando um arquivo do projeto"}))
            else:
                out.append(("Write" if tipo == "Add File" else "Edit", {"file_path": p}))
        return out
    if nome == "view_image":
        return [("Read", {"file_path": str(e.get("path") or "")})]
    if nome in SEM_PERGUNTA:
        return []
    return [(nome, e)]  # MCP e o resto: o aprovador decide (o que ele não conhece vira cartão)


def pergunta_ao_painel(conf, ferramenta, entrada, timeout=ESPERA_GANCHO):
    corpo = json.dumps({"projeto": conf["projeto"], "ferramenta": ferramenta, "entrada": entrada}).encode()
    req = urllib.request.Request(f"http://127.0.0.1:{conf['porta']}/api/v2/aprovar", data=corpo, method="POST",
                                 headers={"Content-Type": "application/json", "X-Painel-Chave": conf["chave"],
                                          "Host": f"127.0.0.1:{conf['porta']}"})
    try:
        r = json.loads(urllib.request.urlopen(req, timeout=timeout).read())
        if r.get("behavior") in ("allow", "deny"):
            return r
    except Exception:
        pass
    return {"behavior": "deny", "message": "O painel não respondeu ao pedido de permissão; nada foi permitido."}


def decide_gancho(evento, conf, cache=None):
    """O gancho inteiro, sem E/S de processo: devolve ("allow"|"deny", motivo)."""
    t = traduz(evento)
    if isinstance(t, tuple):
        return "deny", t[1]
    chave = hashlib.sha256(json.dumps([evento.get("hook_event_name"), t], sort_keys=True).encode()).hexdigest()
    if cache is not None:
        v = cache.get(chave)
        if v and time.time() - v[0] < 20:   # o Codex às vezes pergunta duas vezes pelo mesmo comando: um cartão só
            return v[1], v[2]
    dec, motivo = "allow", ""
    for ferramenta, entrada in t:
        r = pergunta_ao_painel(conf, ferramenta, entrada)
        if r.get("behavior") != "allow":
            dec, motivo = "deny", r.get("message") or "Negado no painel."
            break
    if cache is not None:
        cache[chave] = (time.time(), dec, motivo)
    return dec, motivo


def saida_gancho(evento_nome, dec, motivo):
    if evento_nome == "PermissionRequest":
        d = {"behavior": "allow"} if dec == "allow" else {"behavior": "deny", "message": motivo}
        return {"hookSpecificOutput": {"hookEventName": "PermissionRequest", "decision": d}}
    if dec == "allow":
        return None  # sem saída = segue
    return {"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny",
                                   "permissionDecisionReason": motivo + " Não tente contornar: diga à pessoa, em uma frase, o que faltou."}}


# ---------------- a ponte do Higgsfield ----------------
_TIPO_MODELO = {}


def tipo_modelo(hf, modelo):
    """image | video | audio | 3d, pela lista de modelos do CLI (guardada na memória)."""
    if not _TIPO_MODELO:
        try:
            r = subprocess.run([hf, "model", "list"], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=60)
            for linha in r.stdout.splitlines():
                p = linha.split()
                if len(p) >= 2 and p[-1] in ("image", "video", "audio", "3d", "text"):
                    _TIPO_MODELO[p[0]] = p[-1]
        except Exception:
            pass
    t = _TIPO_MODELO.get(modelo)
    if t:
        return t
    m = modelo.lower()
    if re.search(r"eleven|tts|speech|audio|music|voice", m):
        return "audio"
    if re.search(r"seedance|kling|veo|wan|hailuo|sora|video|minimax|grok", m):
        return "video"
    return "image"


def parametros(args):
    p, i = {}, 0
    while i < len(args):
        a = args[i]
        if a.startswith("--"):
            k = a[2:].split("=", 1)
            if len(k) == 2:
                p.setdefault(k[0].replace("-", "_"), k[1]); i += 1; continue
            v = args[i + 1] if i + 1 < len(args) and not args[i + 1].startswith("--") else True
            nome = k[0].replace("-", "_")
            if nome in ("image", "image_references", "video", "video_references", "audio", "audio_references", "start_image", "end_image"):
                p.setdefault("medias", []).append(v)
            else:
                p.setdefault(nome, v)
            i += 2 if v is not True else 1
        else:
            i += 1
    return p


def classifica_hf(args):
    """O que um comando do CLI do Higgsfield faz, no vocabulário do MCP que o aprovador já conhece.
    (None, motivo) = recusado; ("", {}) = roda sem perguntar (ajuda, versão)."""
    a = [x for x in args if x not in ("--json", "--no-color")]
    if not a or a[0] in ("-h", "--help", "help", "version") or "--help" in a or "-h" in a:
        return "", {}
    g = a[0]
    if g == "auth":
        return None, "O login do Higgsfield fica com o painel: peça à pessoa para conferir no painel ou no terminal dela."
    if g == "account":
        return ("transactions" if a[1:2] == ["transactions"] else "balance"), {}
    if g in ("model", "models"):
        return "models_get", {}
    if g == "voices":
        return "list_voices", {}
    if g == "upload":
        return ("show_generations" if a[1:2] == ["list"] else "media_upload"), {}
    if g in ("generate", "gen"):
        sub = a[1] if len(a) > 1 else ""
        if sub in ("wait", "get"):
            return "jobs_wait", {}
        if sub == "list":
            return "show_generations", {}
        if sub in ("cost", "create") and len(a) > 2:
            if a[2] == "workflow":
                p = parametros(a[4:]); p["model"] = "workflow " + (a[3] if len(a) > 3 else "")
                tipo = "video"
            else:
                p = parametros(a[3:]); p["model"] = a[2]
                tipo = None
            if "dialogue" in p and "prompt" not in p:
                p["prompt"] = str(p["dialogue"])[:400]
            p["get_cost"] = sub == "cost"
            return f"generate_{tipo or '?'}", {"params": p}
    # o resto (marketing-studio, soul-id, product-photoshoot, project, preset…) pode gastar crédito ou criar coisas: cartão
    return "usar_" + g.replace("-", "_"), {"params": {"model": " ".join(a[:3]), "prompt": " ".join(a[3:])[:300]}}


def acha_higgsfield():
    for p in os.environ.get("PATH", "").split(os.pathsep) + ["/usr/local/bin", "/opt/homebrew/bin", os.path.expanduser("~/.local/bin")]:
        if not p or os.path.realpath(p) == os.path.realpath(BIN_PONTE):
            continue
        for n in (("higgsfield.cmd", "higgsfield.exe", "higgsfield") if WIN else ("higgsfield",)):
            c = os.path.join(p, n)
            if os.path.isfile(c) and os.access(c, os.X_OK):
                return c
    return None


def ponte_higgsfield(central, pid, args, cwd):
    """Roda o CLI do Higgsfield para o Codex do projeto pid: confere os caminhos, pede o cartão quando gasta crédito
    e devolve {"codigo", "saida", "erro"}."""
    hf = acha_higgsfield()
    if not hf:
        return {"codigo": 127, "saida": "", "erro": "O CLI do Higgsfield não está instalado neste computador (veja a aula de instalação do Higgsfield)."}
    args = [str(x) for x in (args or [])][:200]
    cwd = os.path.realpath(str(cwd or central.raiz))
    if not central.dentro(cwd) or central.proibido(cwd):
        cwd = central.caminho(pid) or central.raiz
    # arquivo local que o CLI envia (imagem de modelo, áudio): só de dentro da pasta de trabalho
    for x in args:
        v = x.split("=", 1)[1] if x.startswith("--") and "=" in x else x
        if v.startswith("-") or len(v) > 1000:
            continue
        cand = v if os.path.isabs(v) else os.path.join(cwd, v)
        if (os.path.sep in v or v.startswith("~")) and os.path.exists(os.path.expanduser(cand)):
            if central.proibido(os.path.expanduser(cand)) or not central.dentro(os.path.expanduser(cand)):
                return {"codigo": 2, "saida": "", "erro": "O Higgsfield só recebe arquivos da pasta de trabalho do painel."}
    nome, entrada = classifica_hf(args)
    if nome is None:
        return {"codigo": 2, "saida": "", "erro": entrada}
    if nome.startswith("generate_?"):
        tipo = tipo_modelo(hf, str(entrada["params"].get("model", "")))
        # só o preço (generate cost) nunca gasta: usa um nome que o aprovador já libera sem cartão
        nome = "generate_" + (tipo if tipo in ("image", "video", "audio") or not entrada["params"].get("get_cost") else "image")
    if nome:
        r = central.aprovar(pid, "mcp__higgsfield_cli__" + nome, entrada)
        if r.get("behavior") != "allow":
            return {"codigo": 3, "saida": "", "erro": (r.get("message") or "Negado no painel.") + " Nada foi gerado nem cobrado."}
    try:
        p = subprocess.run([hf] + args, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=40 * 60, stdin=subprocess.DEVNULL)
    except subprocess.TimeoutExpired:
        return {"codigo": 124, "saida": "", "erro": "O Higgsfield demorou demais. Confira o job com 'higgsfield generate list' antes de gerar de novo (gera em dobro e cobra em dobro)."}
    return {"codigo": p.returncode, "saida": p.stdout[-400000:], "erro": p.stderr[-20000:]}


# ---------------- o motor ----------------
CODEX_SISTEMA = (
    "VOCÊ É O CODEX (ChatGPT) DENTRO DO PAINEL. Onde as instruções acima ou as skills falarem do Claude, de ToolSearch, de MCP, "
    "do conector do app do Claude ou do campo description dos comandos, siga isto no lugar: "
    "1) Skills: cada estilo é uma skill em ~/.agents/skills/<nome>/SKILL.md (cópia de ~/.claude/skills/<nome>/SKILL.md; se faltar em "
    "um lugar, leia do outro). Leia o SKILL.md do estilo e o references/processo-no-painel.md dele antes de começar; os scripts ficam "
    "na pasta da skill. 2) Área isolada: você grava só na pasta de trabalho e nas temporárias, e não lê pastas de chaves nem logins. "
    "Se um comando falhar com 'operation not permitted', 'sandbox' ou sem internet, NÃO tente contornar: diga à pessoa em uma frase "
    "o que faltou. Cada comando passa pelo painel: o arriscado vira um cartão Permitir/Negar para a pessoa; se ela negar, aceite e "
    "siga sem aquilo. 3) Higgsfield: não há MCP. Use o comando `higgsfield` (ele passa pelo painel, que roda o CLI com a conta da "
    "pessoa e pede licença antes de gastar crédito). Nunca rode `higgsfield auth`. Narração pelo Higgsfield: "
    "`voz_ia.py --motor higgsfield-cli` (não o --motor higgsfield, que é do MCP). Capa caprichada e qualquer imagem: siga {cli_ref}. "
    "Mostre o custo antes (`higgsfield generate cost …`, não gasta) e gere uma peça por vez. Se `generate create` demorar, "
    "confira com `higgsfield generate list` antes de gerar de novo. 4) O cache do npm já está na pasta de trabalho "
    "(npm_config_cache): use `npx` normalmente. 5) Escreva tudo para a pessoa em português do Brasil, simples e curto."
)


def sistema_codex(central, pid, c):
    base = central._sistema(pid, c)
    corte = base.find("Imagem gerada (capa caprichada) sai pelo MCP")  # o trecho do MCP do Claude não vale aqui
    if corte > 0:
        base = base[:corte].rstrip()
    ref = os.path.join(os.path.dirname(AQUI), "references", "higgsfield-cli.md")
    return base + "\n\n" + CODEX_SISTEMA.replace("{cli_ref}", ref)


def resumo_do_chat(c, limite=14):
    """Quando o projeto já conversou com o outro motor, o Codex começa sabendo o que foi dito (o chat é da pessoa)."""
    from central import ler  # noqa
    msgs = [m for m in ler(os.path.join(c, "chat.json"), []) if m.get("quem") in ("eu", "claude") and str(m.get("texto") or "").strip()]
    if not msgs:
        return ""
    linhas = [("Pessoa: " if m["quem"] == "eu" else "Assistente: ") + str(m["texto"]).strip()[:600] for m in msgs[-limite:]]
    return ("Conversa anterior deste projeto (com o outro assistente do painel; só para contexto, o pedido novo vem depois):\n"
            + "\n".join(linhas) + "\n\n---\n\n")


def bilhete(central, pid):
    with central._trava_codex:
        b = central._bilhetes.get(pid)
        if not b:
            b = central._bilhetes[pid] = secrets.token_urlsafe(24)
        return b


def bilhete_ok(central, pid, b):
    v = central._bilhetes.get(str(pid or ""))
    return bool(v and b) and secrets.compare_digest(str(b), v)


def cartao_rede(central, pid):
    """A pessoa libera a internet para o Codex uma vez (vale para a pasta de trabalho). Só o "sim" fica gravado: sem ele
    (nunca respondeu, negou antes ou a pasta veio com "codex_rede": false), o cartão aparece de novo a cada mensagem,
    porque sem internet nenhum estilo gera o vídeo."""
    cfg = central.config()
    if cfg.get("codex_rede") is True:
        return True
    negou_antes = cfg.get("codex_rede") is False
    from central import TRAVA, ESPERA_PERMISSAO, grava  # noqa
    with TRAVA:
        central.n_pedido += 1
        n = central.n_pedido
        ev = threading.Event()
        resumo = "Liberar a internet para o ChatGPT (Codex) trabalhar (uma vez só)"
        detalhe = (("Da outra vez a internet ficou desligada, e sem ela o vídeo não fica pronto. " if negou_antes else "")
                   + "Ele baixa as ferramentas de vídeo (npm, Python), as fontes, as referências e as vozes. "
                   "Sem a internet, os estilos não conseguem gerar o vídeo. Ele continua sem poder ler as suas senhas e chaves.")
        central.pedidos[n] = {"n": n, "projeto": pid, "ferramenta": "CodexRede", "resumo": resumo, "detalhe": detalhe,
                              "sempre": None, "aberto": True, "evento": ev, "decisao": None, "entrada": {}}
    central.anota(pid, quem="permissao", pedido=n, ferramenta="CodexRede", texto=resumo, detalhe=detalhe, sempre=False)
    ev.wait(ESPERA_PERMISSAO)
    with TRAVA:
        p = central.pedidos.get(n)
        p["aberto"] = False
        ok = p["decisao"] in ("permitir", "sempre")
    if p["decisao"]:  # grava o sim e o não (o não só muda o texto do próximo cartão; ele aparece de novo)
        cfg = central.config(); cfg["codex_rede"] = ok
        grava(os.path.join(central.raiz, ".painel", "config.json"), cfg)
    central.anota(pid, quem="sistema", texto=("Permitido" if ok else "Negado") + ": " + resumo)
    if not ok:
        central.anota(pid, quem="sistema", texto="Sem a internet, o ChatGPT não consegue gerar o vídeo (ele precisa baixar as ferramentas "
                      "de vídeo). Ele segue no que der, sem gerar o vídeo final. Quando quiser liberar, mande uma nova mensagem: "
                      "o painel pergunta de novo.")
    return ok


def eventos(linhas):
    """Lê o JSONL do `codex exec --json` e devolve eventos simples: (tipo, dados)."""
    for linha in linhas:
        try:
            d = json.loads(linha)
        except ValueError:
            continue
        t = d.get("type")
        if t == "thread.started" and d.get("thread_id"):
            yield "sessao", d["thread_id"]
        elif t in ("item.started", "item.completed"):
            it = d.get("item") or {}
            k = it.get("type")
            if k == "agent_message" and t == "item.completed" and str(it.get("text") or "").strip():
                yield "texto", str(it["text"]).strip()
            elif k == "command_execution" and t == "item.started":
                yield "comando", str(it.get("command") or "")
            elif k == "file_change" and t == "item.started":
                for ch in it.get("changes") or []:
                    yield "arquivo", str(ch.get("path") or "")
            elif k == "web_search" and t == "item.started":
                yield "busca", str(it.get("query") or "")
            elif k == "error" and "dangerously-bypass-hook-trust" not in str(it.get("message")):
                yield "aviso", str(it.get("message") or "")
        elif t == "turn.failed":
            yield "erro", str((d.get("error") or {}).get("message") or "erro")
        elif t == "error":
            yield "erro", str(d.get("message") or "erro")
        elif t == "turn.completed":
            yield "fim", d.get("usage") or {}


def sem_wrapper(cmd):
    """'/bin/zsh -lc "…"' -> '…' (o que aparece no item do JSON)."""
    m = re.match(r"^\S*(?:ba|z)?sh\s+-l?c\s+(.+)$", cmd, re.S)
    if not m:
        return cmd
    try:
        p = shlex.split(m.group(1))
        return p[0] if len(p) == 1 else m.group(1)
    except ValueError:
        return m.group(1)


def mensagem_de_erro(texto):
    t = texto.lower()
    if any(x in t for x in ("not logged in", "login", "unauthorized", "401", "auth")):
        return "O ChatGPT (Codex) não está conectado à sua conta. Clique em Conectar minha conta no topo."
    if any(x in t for x in ("usage limit", "rate limit", "quota", "429")):
        return "Acabou o limite de uso do seu plano do ChatGPT por agora. Espere o limite voltar e mande a mensagem de novo."
    return texto[:400]


def roda(central, pid, msgs):
    """O _roda do central, para o Codex."""
    from central import TRAVA, NAO_LER, ler, grava  # noqa
    c = central.caminho(pid)
    arq_sessao = os.path.join(c, ".sessao-codex.json")
    sessao = ler(arq_sessao, {}).get("id")
    prompt = "\n\n".join(m["texto"] + ("\n\nArquivos que a pessoa mandou: " + ", ".join(m["anexos"]) if m["anexos"] else "") for m in msgs)
    if not sessao:
        prompt = resumo_do_chat(c) + prompt
    oculto = os.path.join(central.raiz, ".painel")
    rede = cartao_rede(central, pid)
    conf = os.path.join(oculto, f"codex-{pid}.json")
    grava(conf, {"porta": central.porta_fn(), "chave": central.chave_fn(), "projeto": pid, "raiz": central.raiz})
    os.chmod(conf, 0o600)
    ferr = os.path.join(central.raiz, "_ferramentas")
    ambiente = {"PATH": path_da_ponte(), "npm_config_cache": os.path.join(ferr, ".npm-cache"),
                "PAINEL_PORTA": str(central.porta_fn()), "PAINEL_PROJETO": pid, "PAINEL_PONTE": bilhete(central, pid),
                "PYTHONDONTWRITEBYTECODE": "1"}
    sistema = sistema_codex(central, pid, c)
    if not rede:
        sistema += ("\n\nATENÇÃO: nesta mensagem a INTERNET ESTÁ DESLIGADA (a pessoa não liberou no cartão do painel). npx, pip, "
                    "downloads e a geração do vídeo vão falhar. Não tente contornar e não fique tentando: faça só o que não precisa "
                    "de internet e diga à pessoa, em uma frase, que para gerar o vídeo ela precisa liberar a internet, e que o painel "
                    "pergunta de novo na próxima mensagem.")
    cmd = comando(central.codex, raiz=central.raiz, oculto=oculto, conf_gancho=conf, sistema=sistema,
                  sessao=sessao, rede=rede, ambiente=ambiente, nao_ler=NAO_LER, modelo=central.modelos()["escolhido"])
    try:
        proc = subprocess.Popen(cmd, cwd=c, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="replace", bufsize=1)
        proc.stdin.write(prompt); proc.stdin.close()
    except Exception as e:
        central.anota(pid, quem="sistema", texto=f"Não consegui abrir o ChatGPT (Codex): {e}")
        return
    with TRAVA:
        central.vivos[pid] = {"proc": proc, "desde": time.time(),
                              "modelo": dict(central.modelos()["opcoes"]).get(central.modelos()["escolhido"], "Padrão do ChatGPT")}
    erro = []
    threading.Thread(target=lambda: erro.extend(proc.stderr.readlines()[-20:]), daemon=True).start()
    falhou, ultimo, terminou = None, None, False
    from central import encerra  # noqa
    try:
        for tipo, d in eventos(proc.stdout):
            if tipo == "sessao":
                grava(arq_sessao, {"id": d})
            elif tipo == "texto":
                central.anota(pid, quem="claude", texto=d, motor="codex")
            elif tipo in ("comando", "arquivo", "busca"):
                if tipo == "comando":
                    frase = descreve(sem_wrapper(d))
                elif tipo == "arquivo":
                    frase = central._resume_ferramenta("Write", {"file_path": d})
                else:
                    frase = central._resume_ferramenta("WebSearch", {"query": d})
                if frase and frase != ultimo:
                    central.anota(pid, quem="ferramenta", texto=frase)
                ultimo = frase or ultimo
            elif tipo == "erro":
                falhou = d
            elif tipo == "fim":
                terminou = True
    except Exception as e:  # a leitura quebrou: fecha o Codex em vez de deixar o projeto preso
        encerra(proc)
        falhou = f"o painel perdeu a conversa com o ChatGPT ({e.__class__.__name__}). Mande a mensagem de novo."
    proc.wait()
    with TRAVA:
        if (central.vivos.get(pid) or {}).get("proc") is proc:  # o Parar pode ter liberado o projeto para outra conversa
            central.vivos.pop(pid, None)
        parou_a_pessoa = proc in getattr(central, "parados", set())
        getattr(central, "parados", set()).discard(proc)
    if parou_a_pessoa:
        pass  # a pessoa clicou em Parar: o chat já diz "Você parou…"
    elif falhou or (proc.returncode not in (0, None) and not terminou):
        msg = falhou or "".join(erro)[-400:].strip() or f"código {proc.returncode}"
        if sessao and re.search(r"no (rollout|session|thread)|not found|could not find", msg, re.I):
            os.remove(arq_sessao)  # a conversa antiga sumiu: a próxima mensagem começa uma nova
            msg = "Não achei a conversa anterior deste projeto no ChatGPT. Mande a mensagem de novo: eu começo uma conversa nova com o histórico do chat."
        else:
            msg = mensagem_de_erro(msg)
            if "conectado" in msg:
                central._login_codex = (0, None)
        central.anota(pid, quem="sistema", texto="O ChatGPT (Codex) parou: " + msg)
    with TRAVA:
        if central.fila.get(pid):
            central._inicia_ou_espera(pid)
        while central.esperando_vaga and len(central.vivos) < central_simultaneos():
            central._inicia_ou_espera(central.esperando_vaga.pop(0))


def central_simultaneos():
    from central import SIMULTANEOS  # noqa
    return SIMULTANEOS
