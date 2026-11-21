#!/usr/bin/env python3
"""Instalador do Edição com IA: cria a pasta de trabalho, instala o painel e, sob demanda, cada estilo de vídeo.

  python instalar.py --pasta "~/Meu Canal" --sim                       base: pasta, painel, atalho e teste
  python instalar.py --pasta "~/Meu Canal" --estilo video-3d --sim     instala um estilo (repita --estilo para vários)
  python instalar.py --pasta "~/Meu Canal" --todos --sim               todos os estilos disponíveis
  python instalar.py --pasta "~/Meu Canal" --conferir                  só confere, não instala nada
  python instalar.py --pasta "~/Meu Canal" --atualizar --sim           baixa a versão nova do pacote e troca só as skills do produto
                                                                       (a anterior fica em _ferramentas/copias-antigas; projetos, modelos,
                                                                       marca, .painel, voz e _lixeira não são tocados); religa o painel

Opções: --sim (não pergunta nada: é assim que o Claude roda), --sem-programas (não instala Node/FFmpeg/Python no computador,
só avisa: é como o painel roda), --sem-teste, --skills DIR (padrão ~/.claude/skills).

Estrutura da pasta de trabalho (a mesma que a skill video-3d usa, para as duas se entenderem):
  CLAUDE.md                 o Claude lê sozinho ao abrir a pasta: o que tem aqui e como trabalhar
  Abrir Painel.command/.bat  dois cliques: liga o painel e abre no navegador
  marca.json, marca/        identidade visual (o painel preenche)
  Bruto/  pedidos/  Prontos/
  _ferramentas/             .venv (Python com Whisper), sfx-kit, pecas-3d, pacote/ (as skills para instalar depois), estado.json
Nunca apaga trabalho seu. Skill que já existia é guardada em _ferramentas/copias-antigas (fora da pasta de skills, para o
Claude não enxergar duas iguais). Só usa a biblioteca padrão do Python (3.9+)."""
import argparse, datetime, filecmp, hashlib, io, json, os, platform, re, shutil, subprocess, sys, tempfile, time
import urllib.error, urllib.parse, urllib.request, zipfile

AQUI = os.path.dirname(os.path.abspath(__file__))
SKILL_PAINEL = os.path.dirname(AQUI)                       # .../painel-edicao-com-ia
WIN = platform.system() == "Windows"
MAC = platform.system() == "Darwin"
OK, FALHA, AVISO = "ok    ", "FALHOU", "aviso "
erros = []


def diz(tag, msg):
    print(f"  {tag} {msg}", flush=True)
    if tag == FALHA:
        erros.append(msg)


def passo(t):
    print(f"\n{t}", flush=True)


def roda(cmd, timeout=60, **k):
    try:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, **k)
    except Exception:
        return None


def primeira_linha(cmd):
    r = roda(cmd)
    return (r.stdout or r.stderr).strip().splitlines()[0] if r and r.returncode == 0 and (r.stdout or r.stderr).strip() else None


def ler_json(c, padrao):
    try:
        return json.load(open(c, encoding="utf-8"))
    except (OSError, ValueError):
        return padrao


def grava_json(c, d):
    tmp = c + ".tmp"
    json.dump(d, open(tmp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    os.replace(tmp, c)


# ---------------- programas do computador ----------------
def acha_python_venv():
    """Python 3.10–3.13 para o ambiente com Whisper (o faster-whisper ainda não roda em versões mais novas)."""
    cands = ([["py", f"-3.{m}"] for m in (12, 13, 11, 10)] if WIN else
             [[f"python3.{m}"] for m in (12, 13, 11, 10)] + [["python3"]])
    if MAC:
        cands += [[f"/opt/homebrew/bin/python3.{m}"] for m in (12, 13, 11, 10)]
    for c in cands:
        r = roda(c + ["-c", "import sys;print('%d.%d' % sys.version_info[:2])"])
        if r and r.returncode == 0:
            mj, mn = map(int, r.stdout.strip().split("."))
            if mj == 3 and 10 <= mn <= 13:
                return c, f"{mj}.{mn}"
    return None, None


def confere_programas():
    falta = []
    node = primeira_linha(["node", "-v"])
    nmaj = int(node.lstrip("v").split(".")[0]) if node else 0
    if nmaj >= 22:
        diz(OK, f"Node {node}")
    else:
        diz(AVISO, f"Node 22 ou mais novo não encontrado ({node or 'nenhum'}): é ele que monta as animações"); falta.append("node")
    ff = primeira_linha(["ffmpeg", "-version"])
    if ff and shutil.which("ffprobe"):
        diz(OK, "FFmpeg " + ff.split()[2])
    else:
        diz(AVISO, "FFmpeg não encontrado: corta, mixa e junta o vídeo"); falta.append("ffmpeg")
    py, ver = acha_python_venv()
    if py:
        diz(OK, f"Python {ver} (para o ambiente com Whisper)")
    else:
        diz(AVISO, "Python 3.10–3.13 não encontrado: transcreve a voz e alinha a legenda"); falta.append("python")
    return falta


def instala_programas(falta, a):
    if not falta:
        return
    if a.sem_programas:
        diz(FALHA, f"faltam programas no computador: {', '.join(falta)}. Peça ao Claude no chat: \"instala o que falta do Edição com IA\"")
        return
    pacotes_brew = {"node": "node", "ffmpeg": "ffmpeg", "python": "python@3.12"}
    pacotes_win = {"node": "OpenJS.NodeJS.LTS", "ffmpeg": "Gyan.FFmpeg", "python": "Python.Python.3.12"}
    if MAC and shutil.which("brew"):
        cmd = ["brew", "install"] + [pacotes_brew[f] for f in falta]
    elif WIN and shutil.which("winget"):
        cmd = None  # winget, um por vez
    else:
        diz(FALHA, f"instale {', '.join(falta)} e rode de novo. No Mac, o jeito mais simples é o Homebrew (https://brew.sh): "
                   f"brew install {' '.join(pacotes_brew[f] for f in falta)}")
        return
    if not a.sim:
        resp = input(f"  Instalar agora: {', '.join(falta)}? [S/n] ").strip().lower()
        if resp in ("n", "nao", "não"):
            diz(FALHA, f"faltam: {', '.join(falta)}"); return
    print(f"  instalando {', '.join(falta)} (pode levar alguns minutos)…", flush=True)
    if cmd:
        subprocess.run(cmd)
    else:
        for f in falta:
            subprocess.run(["winget", "install", "-e", "--id", pacotes_win[f], "--accept-source-agreements", "--accept-package-agreements"])
    print()
    resto = confere_programas()
    if resto:
        diz(FALHA, f"ainda faltam: {', '.join(resto)}. Feche e abra o Claude (programas novos) e rode de novo.")


# ---------------- pasta de trabalho ----------------
class Pasta:
    def __init__(self, caminho, skills):
        self.dir = os.path.abspath(os.path.expanduser(caminho))
        self.f = os.path.join(self.dir, "_ferramentas")
        self.estado_json = os.path.join(self.f, "estado.json")
        self.pacote = os.path.join(self.f, "pacote", "skills")
        self.skills = os.path.abspath(os.path.expanduser(skills))
        self.skills_codex = os.path.abspath(os.path.expanduser(os.environ.get("CODEX_SKILLS_DIR") or "~/.agents/skills"))  # o que o Codex lê
        self.vpy = os.path.join(self.f, ".venv", "Scripts" if WIN else "bin", "python.exe" if WIN else "python")

    def estado(self):
        e = ler_json(self.estado_json, {})
        e.setdefault("versao", 1); e.setdefault("criada", datetime.date.today().isoformat()); e.setdefault("voz", None)
        e.setdefault("estilos", {})
        return e

    def salva_estado(self, e):
        e["atualizado"] = datetime.datetime.now().isoformat(timespec="minutes")
        grava_json(self.estado_json, e)


def fonte_das_skills(P):
    """De onde copiar as skills: o pacote que a pessoa baixou (Edicao-com-IA/skills/...), se o instalador está rodando de lá.
    Rodando da skill já instalada, usa a cópia guardada em _ferramentas/pacote."""
    pai = os.path.dirname(SKILL_PAINEL)
    if os.path.basename(pai) == "skills" and os.path.realpath(pai) != os.path.realpath(P.skills) \
            and os.path.realpath(pai) != os.path.realpath(P.pacote):
        return pai
    return None


def copia_skill(nome, P):
    """Copia uma skill do pacote para a pasta de skills. Se já existia diferente, guarda a antiga fora da pasta de skills."""
    origem = os.path.join(P.pacote, nome)
    destino = os.path.join(P.skills, nome)
    if not os.path.isfile(os.path.join(origem, "SKILL.md")):
        if os.path.isfile(os.path.join(destino, "SKILL.md")):
            diz(OK, f"skill {nome} já estava instalada"); return True
        diz(FALHA, f"a skill {nome} não veio no pacote ({origem})"); return False
    if os.path.isdir(destino):
        if not _difere(origem, destino):
            diz(OK, f"skill {nome} já estava instalada"); return True
        # nunca troca uma versão mais nova por uma mais velha (ex.: a cópia em _ferramentas/pacote ficou para trás)
        vo = versao_tupla(ler_json(os.path.join(origem, "versao.json"), {}).get("versao"))
        vd = versao_tupla(ler_json(os.path.join(destino, "versao.json"), {}).get("versao"))
        if vo and vd and vo < vd:
            diz(OK, f"skill {nome} já está numa versão mais nova ({'.'.join(map(str, vd))})"); return True
        guarda = os.path.join(P.f, "copias-antigas", f"{nome}-{datetime.datetime.now():%Y%m%d-%H%M%S}")
        os.makedirs(os.path.dirname(guarda), exist_ok=True)
        shutil.move(destino, guarda)
        diz(AVISO, f"a skill {nome} anterior foi guardada em {guarda}")
    shutil.copytree(origem, destino, ignore=shutil.ignore_patterns("__pycache__", "*.bak*", ".DS_Store"))
    diz(OK, f"skill {nome} instalada")
    return True


def acha_codex():
    """O Codex do ChatGPT (o segundo motor do painel), se estiver neste computador."""
    try:
        sys.path.insert(0, AQUI)
        import motor_codex
        return motor_codex.acha_codex()
    except Exception:
        return None


def espelha_no_codex(P, cat=None):
    """Com o Codex no computador, copia as skills do produto que estão instaladas para ~/.agents/skills (a pasta que o Codex
    lê, mesmo formato SKILL.md). Só as do Edição com IA; uma cópia diferente que já estava lá vai para _ferramentas/copias-antigas."""
    if not acha_codex():
        return
    nomes = {"painel-edicao-com-ia"}
    for e in (cat or catalogo()).get("estilos", []):
        nomes.update((e.get("instalar") or {}).get("skills", []))
    feitas = []
    for nome in sorted(nomes):
        origem, destino = os.path.join(P.skills, nome), os.path.join(P.skills_codex, nome)
        if not os.path.isfile(os.path.join(origem, "SKILL.md")) or os.path.realpath(origem) == os.path.realpath(destino):
            continue
        if os.path.isdir(destino):
            if not _difere(origem, destino):
                continue
            guarda = os.path.join(P.f, "copias-antigas", f"codex-{nome}-{datetime.datetime.now():%Y%m%d-%H%M%S}")
            os.makedirs(os.path.dirname(guarda), exist_ok=True)
            shutil.move(destino, guarda)
        os.makedirs(P.skills_codex, exist_ok=True)
        shutil.copytree(origem, destino, ignore=shutil.ignore_patterns("__pycache__", "*.bak*", ".DS_Store"))
        feitas.append(nome)
    if feitas:
        diz(OK, f"estilos também prontos para o ChatGPT (Codex): {', '.join(feitas)}")


def _difere(a, b):
    c = filecmp.dircmp(a, b, ignore=["__pycache__", ".DS_Store"])
    if c.left_only or c.right_only or c.diff_files:
        return True
    return any(_difere(os.path.join(a, d), os.path.join(b, d)) for d in c.common_dirs)


def garante_claude_terminal(a):
    """O Claude Code de terminal é quem responde dentro do painel. Instala em ~/.local (sem senha de administrador)."""
    for c in (shutil.which("claude"), os.path.expanduser("~/.local/bin/claude"), "/opt/homebrew/bin/claude", "/usr/local/bin/claude"):
        if c and os.path.exists(c):
            diz(OK, "Claude Code de terminal (responde dentro do painel)"); return True
    if a.sem_programas or not shutil.which("npm"):
        diz(AVISO, "Claude Code de terminal não encontrado: sem ele o painel funciona só no modo recado. Peça ao Claude: \"instala o Claude Code de terminal\""); return False
    print("  instalando o Claude Code de terminal em ~/.local (alguns minutos)…", flush=True)
    prefixo = os.path.expanduser("~/.local")
    r = roda(["npm", "install", "-g", "--prefix", prefixo, "--no-audit", "--no-fund", "@anthropic-ai/claude-code"], timeout=900)
    if not r or r.returncode != 0 or not os.path.exists(os.path.join(prefixo, "bin", "claude")):
        diz(AVISO, "não consegui instalar o Claude Code de terminal; o painel fica no modo recado. Peça ao Claude no chat."); return False
    # as próximas janelas de terminal e o Claude precisam achar ~/.local/bin
    linha = 'export PATH="$HOME/.local/bin:$PATH"  # Edição com IA'
    for f in ("~/.zprofile", "~/.zshrc"):
        f = os.path.expanduser(f)
        try:
            if "Edição com IA" not in (open(f, encoding="utf-8").read() if os.path.exists(f) else ""):
                open(f, "a", encoding="utf-8").write("\n" + linha + "\n")
        except OSError:
            pass
    diz(OK, "Claude Code de terminal instalado em ~/.local/bin (no painel, clique em Conectar minha conta uma vez)")
    return True


def prepara_pasta(P, a):
    for d in ("", "Bruto", "Prontos", "pedidos", "marca", "_ferramentas"):
        os.makedirs(os.path.join(P.dir, d), exist_ok=True)
    diz(OK, f"pasta de trabalho: {P.dir}")
    fonte = fonte_das_skills(P)
    if fonte:  # rodando do pacote baixado: guarda as skills na pasta para instalar estilos depois, pelo painel
        if os.path.isdir(P.pacote):
            shutil.rmtree(P.pacote)
        shutil.copytree(fonte, P.pacote, ignore=shutil.ignore_patterns("__pycache__", "*.bak*", ".DS_Store"))
        diz(OK, "pacote das skills guardado em _ferramentas/pacote")
    elif not os.path.isdir(P.pacote):
        diz(AVISO, "sem o pacote das skills nesta pasta: só dá para instalar estilos cujas skills já estão no Claude")
    os.makedirs(P.skills, exist_ok=True)
    copia_skill("painel-edicao-com-ia", P)
    atalho(P)
    e = P.estado(); P.salva_estado(e)


def atalho(P):
    painel = os.path.join(P.skills, "painel-edicao-com-ia", "scripts", "painel.py")
    if WIN:
        c = os.path.join(P.dir, "Abrir Painel.bat")
        open(c, "w", encoding="utf-8").write(f'@echo off\r\nstart "" /min py -3 "{painel}" abrir "{P.dir}"\r\n')
    else:
        c = os.path.join(P.dir, "Abrir Painel.command")
        py = shutil.which("python3") or "/usr/bin/python3"
        open(c, "w", encoding="utf-8").write(
            "#!/bin/bash\n# Dois cliques: liga o painel do Edição com IA (se ainda não estiver no ar) e abre no navegador.\n"
            f'nohup "{py}" "{painel}" abrir "{P.dir}" >/dev/null 2>&1 &\ndisown\nsleep 1\n'
            f'echo "Painel aberto no navegador. Pode fechar esta janela."\n')
        os.chmod(c, 0o755)
        if MAC and shutil.which("xattr"):
            roda(["xattr", "-d", "com.apple.quarantine", c])
    diz(OK, f"atalho: {os.path.basename(c)} (dois cliques abrem o painel)")


# ---------------- estilos ----------------
def catalogo():
    return json.load(open(os.path.join(SKILL_PAINEL, "estilos.json"), encoding="utf-8"))


def garante_venv(P, pacotes):
    py, ver = acha_python_venv()
    if not os.path.exists(P.vpy):
        if not py:
            diz(FALHA, "falta Python 3.10–3.13 para criar o ambiente com Whisper"); return False
        print(f"  criando o ambiente Python {ver} em _ferramentas/.venv…", flush=True)
        r = roda(py + ["-m", "venv", os.path.join(P.f, ".venv")], timeout=300)
        if not r or r.returncode != 0:
            diz(FALHA, "não consegui criar o ambiente Python"); return False
        roda([P.vpy, "-m", "pip", "install", "-q", "--upgrade", "pip"], timeout=600)
    # só instala o que falta
    teste = {"faster-whisper": "import faster_whisper", "numpy": "import numpy", "scipy": "import scipy", "yt-dlp": "import yt_dlp",
             "pillow": "import PIL",
             # o OpenCV 5 importa, mas vem sem os detectores de rosto: conta como faltando e volta para o 4
             "opencv-python-headless": "import cv2, os; assert os.path.exists(os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml'))"}
    nome = lambda p: re.split(r"[<>=!~ ;\[]", p, 1)[0]
    falta = [p for p in pacotes if (r := roda([P.vpy, "-c", teste.get(nome(p), f"import {nome(p)}")])) is None or r.returncode != 0]
    if falta:
        print(f"  instalando no Python da pasta: {', '.join(falta)} (alguns minutos na primeira vez)…", flush=True)
        r = roda([P.vpy, "-m", "pip", "install", "-q"] + falta, timeout=1800)
        if not r or r.returncode != 0:
            diz(FALHA, f"pip install {' '.join(falta)}: {(r.stderr if r else '')[-300:]}"); return False
    diz(OK, "Python da pasta com " + ", ".join(pacotes))
    # a skill editor-ia procura o .venv na pasta do projeto: um atalho para o mesmo ambiente
    link = os.path.join(P.dir, ".venv")
    if not WIN and not os.path.exists(link):
        os.symlink(os.path.join("_ferramentas", ".venv"), link)
    return True


def garante_sfx(P):
    dest = os.path.join(P.f, "sfx-kit")
    if os.path.exists(os.path.join(dest, "sounds.json")):
        diz(OK, "SFX Kit (320 efeitos sonoros CC0)"); return True
    print("  baixando o SFX Kit (320 efeitos sonoros CC0, ~120 MB)…", flush=True)
    try:
        if shutil.which("git"):
            r = roda(["git", "clone", "-q", "--depth", "1", "https://github.com/wyzowl/sfx-kit", dest], timeout=900)
            if not r or r.returncode != 0:
                raise RuntimeError((r.stderr if r else "")[-200:])
        else:
            z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen("https://github.com/wyzowl/sfx-kit/archive/refs/heads/main.zip", timeout=900).read()))
            raiz = z.namelist()[0].split("/")[0]
            for n in z.namelist():
                if ".." in n or n.startswith("/") or n.endswith("/"):
                    continue
                alvo = os.path.join(dest, n[len(raiz) + 1:])
                os.makedirs(os.path.dirname(alvo), exist_ok=True)
                open(alvo, "wb").write(z.read(n))
        diz(OK, "SFX Kit baixado"); return True
    except Exception as e:
        diz(FALHA, f"não consegui baixar o SFX Kit ({e})"); return False


def garante_pecas(P):
    cat = os.path.join(P.f, "pecas-3d", "catalogo.json")
    if os.path.exists(cat):
        n = sum(len(v) for v in json.load(open(cat)).values())
        diz(OK, f"peças 3D ({n})"); return True
    script = os.path.join(P.skills, "video-3d", "scripts", "pecas_3d.py")
    if not os.path.exists(script):
        diz(FALHA, "a skill video-3d não tem o pecas_3d.py"); return False
    print("  baixando as peças 3D (Kenney, CC0, ~40 MB)…", flush=True)
    r = subprocess.run([sys.executable, script, "baixar"], env={**os.environ, "PECAS_3D": os.path.join(P.f, "pecas-3d")},
                       capture_output=True, text=True, timeout=1800)
    if r.returncode != 0:
        diz(FALHA, f"peças 3D: {r.stderr[-300:]}"); return False
    diz(OK, "peças 3D baixadas"); return True


def instala_estilo(eid, P, cat):
    est = {e["id"]: e for e in cat["estilos"]}.get(eid)
    if not est or est.get("em_breve") or "instalar" not in est:
        diz(FALHA, f"estilo desconhecido ou ainda não disponível: {eid}"); return
    passo(f"Estilo: {est['nome']}")
    inst = est["instalar"]
    ok = all([copia_skill(s, P) for s in inst.get("skills", [])])
    itens = inst.get("itens", [])
    if "python" in itens:
        ok = garante_venv(P, inst.get("pip", ["faster-whisper", "numpy", "scipy"])) and ok
    if "sfx" in itens:
        ok = garante_sfx(P) and ok
    if "pecas" in itens:
        ok = garante_pecas(P) and ok
    e = P.estado()
    if ok:
        e["estilos"][eid] = {"instalado": datetime.datetime.now().isoformat(timespec="minutes")}
        diz(OK, f"{est['nome']} pronto para usar")
    # campos que a skill video-3d também lê
    e["python"] = P.vpy if os.path.exists(P.vpy) else None
    e["sfx_kit"] = os.path.exists(os.path.join(P.f, "sfx-kit", "sounds.json"))
    cj = os.path.join(P.f, "pecas-3d", "catalogo.json")
    e["pecas"] = sum(len(v) for v in json.load(open(cj)).values()) if os.path.exists(cj) else 0
    P.salva_estado(e)


# ---------------- CLAUDE.md, conferência e teste ----------------
def escreve_claude_md(P, cat):
    e = P.estado()
    painel = os.path.join(P.skills, "painel-edicao-com-ia", "scripts", "painel.py")
    py = e.get("python") or "python3"
    nomes = {x["id"]: x for x in cat["estilos"]}
    inst = [nomes[i]["nome"] + f" (skill {', '.join(nomes[i]['instalar']['skills'])})" for i in e["estilos"] if i in nomes]
    disp = [x["nome"] for x in cat["estilos"] if not x.get("em_breve") and x["id"] not in e["estilos"]]
    md = f"""# Pasta do Edição com IA

<!-- escrito pelo instalador do Edição com IA (painel-edicao-com-ia/scripts/instalar.py); refeito a cada instalação -->

Tudo o que os vídeos usam está aqui dentro: **não instale nada de novo** sem a pessoa pedir.

## Como trabalhar
- A porta de entrada é o **painel** (a central de trabalho): siga a skill `painel-edicao-com-ia`. Para abrir: `python3 "{painel}" abrir "{P.dir}"` (em segundo plano). Dentro do painel, cada projeto (cliente ou canal) tem o seu chat, e o Claude de terminal trabalha lá dentro; os projetos ficam em `projetos/<id>/`. Se o painel estiver no modo recado (sem o Claude de terminal conectado), rode o `esperar` e trate o pedido aqui.
- A marca está em `marca.json` (o painel preenche): não pergunte de novo.
- Os vídeos brutos ficam em `Bruto/`, os pedidos em `pedidos/` e os vídeos prontos em `Prontos/`.
- Rode os scripts das skills com o Python desta pasta: `"{py}"` (ele tem o Whisper). A skill editor-ia acha o mesmo ambiente em `.venv`.
- Efeitos sonoros: `_ferramentas/sfx-kit/` (`GUIDE.md`, `catalogue.md`). Peças 3D: `_ferramentas/pecas-3d/catalogo.md`.

## Estilos instalados
{chr(10).join('- ' + i for i in inst) or '- nenhum ainda'}

## Estilos que ainda dá para instalar
{', '.join(disp) or 'todos já instalados'}.
Para instalar um (o painel também tem o botão): `python3 "{os.path.join(P.skills, 'painel-edicao-com-ia', 'scripts', 'instalar.py')}" --pasta "{P.dir}" --estilo <id> --sim`
"""
    open(os.path.join(P.dir, "CLAUDE.md"), "w", encoding="utf-8").write(md)
    diz(OK, "CLAUDE.md escrito (o Claude lê ao abrir a pasta)")


def confere(P, cat):
    passo("Conferência")
    e = P.estado()
    sk = lambda n: os.path.isfile(os.path.join(P.skills, n, "SKILL.md"))
    diz(OK if sk("painel-edicao-com-ia") else FALHA, "skill do painel")
    diz(OK if os.path.isdir(P.pacote) else AVISO, "pacote das skills (para instalar estilos depois)")
    nomes = {x["id"]: x for x in cat["estilos"]}
    for eid in e["estilos"]:
        est = nomes.get(eid)
        if not est:
            continue
        faltas = [s for s in est["instalar"].get("skills", []) if not sk(s)]
        itens = est["instalar"].get("itens", [])
        if "python" in itens and not os.path.exists(P.vpy): faltas.append("Python da pasta")
        if "sfx" in itens and not e.get("sfx_kit"): faltas.append("SFX Kit")
        if "pecas" in itens and not e.get("pecas"): faltas.append("peças 3D")
        diz(FALHA if faltas else OK, f"{est['nome']}" + (f": falta {', '.join(faltas)}" if faltas else ""))


def teste(P):
    passo("Teste")
    painel = os.path.join(P.skills, "painel-edicao-com-ia", "scripts", "painel.py")
    proc = subprocess.Popen([sys.executable, painel, "abrir", P.dir, "--sem-navegador"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    try:
        linha = proc.stdout.readline()
        ja = "já está ligado" in linha
        url = linha.strip().split()[-1]
        porta, chave = url.split("127.0.0.1:")[1].split("/")[0], url.split("#t=")[1]
        req = urllib.request.Request(f"http://127.0.0.1:{porta}/api/estado", headers={"X-Painel-Chave": chave})
        d = json.load(urllib.request.urlopen(req, timeout=5))
        diz(OK, f"o painel responde ({len([x for x in d['catalogo']['estilos'] if not x.get('em_breve')])} estilos no catálogo)")
        if not ja:
            subprocess.run([sys.executable, painel, "fechar", P.dir], capture_output=True, timeout=20)
    except Exception as ex:
        diz(FALHA, f"o painel não respondeu ({ex})")
    finally:
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()
    if shutil.which("ffmpeg"):
        saida = os.path.join(P.dir, "Prontos", "Teste-da-instalacao.mp4")
        r = roda(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "color=c=0x0A0B0E:s=1080x1920:d=2", "-f", "lavfi", "-i", "sine=f=660:d=0.15",
                  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", "-movflags", "+faststart", saida], timeout=120)
        diz(OK if r and r.returncode == 0 else FALHA, f"FFmpeg gera vídeo: {saida}" if r and r.returncode == 0 else "FFmpeg não conseguiu gerar o vídeo de teste")


# ---------------- atualização (--atualizar) ----------------
def versao_tupla(v):
    """'2.1.0' -> (2, 1, 0). Inválida -> None."""
    v = str(v or "").strip()
    return tuple(int(x) for x in v.split(".")) if re.fullmatch(r"\d{1,4}(\.\d{1,4}){0,3}", v) else None


def url_permitida(u):
    """Só https, ou http para o próprio computador (testes)."""
    p = urllib.parse.urlparse(u)
    return bool(p.netloc) and (p.scheme == "https" or (p.scheme == "http" and p.hostname in ("127.0.0.1", "localhost")))


def valida_remoto(d, base):
    """Aceita só um versao.json bem formado: versão numérica, zip no mesmo endereço, sha256 de 64 hex e notas curtas."""
    if not isinstance(d, dict) or not versao_tupla(d.get("versao")):
        return None
    z = str(d.get("zip") or "").strip()
    pb, pz = urllib.parse.urlparse(base), urllib.parse.urlparse(z)
    if not z or (pz.scheme, pz.netloc) != (pb.scheme, pb.netloc) or not pz.path.endswith(".zip"):
        return None
    sha = str(d.get("sha256") or "").lower()
    if not re.fullmatch(r"[0-9a-f]{64}", sha):
        return None
    return {"versao": str(d["versao"]).strip(), "zip": z, "sha256": sha,
            "notas": re.sub(r"\s+", " ", str(d.get("notas") or "")).strip()[:160]}


class _MesmoEndereco(urllib.request.HTTPRedirectHandler):
    """Segue redirecionamento só dentro do mesmo endereço (esquema e servidor)."""
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        a, b = urllib.parse.urlparse(req.full_url), urllib.parse.urlparse(newurl)
        if (a.scheme, a.netloc) != (b.scheme, b.netloc):
            raise urllib.error.URLError("redirecionamento para outro endereço")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def baixa(url, destino=None, limite=64 * 1024, timeout=30):
    """Baixa com limite de tamanho. Sem destino, devolve os bytes; com destino, grava e devolve o sha256."""
    req = urllib.request.Request(url, headers={"User-Agent": "Edicao-com-IA-instalador"})
    with urllib.request.build_opener(_MesmoEndereco).open(req, timeout=timeout) as r:
        if destino is None:
            dados = r.read(limite + 1)
            if len(dados) > limite:
                raise ValueError("resposta grande demais")
            return dados
        h, total = hashlib.sha256(), 0
        with open(destino, "wb") as f:
            while True:
                b = r.read(256 * 1024)
                if not b:
                    break
                total += len(b)
                if total > limite:
                    raise ValueError("arquivo grande demais")
                f.write(b); h.update(b)
        return h.hexdigest()


def extrai_seguro(zpath, destino, limite=800 * 1024 ** 2):
    """Descompacta recusando caminhos fora da pasta, links simbólicos e zips grandes demais."""
    raiz = os.path.realpath(destino)
    with zipfile.ZipFile(zpath) as z:
        itens = z.infolist()
        if len(itens) > 20000 or sum(i.file_size for i in itens) > limite:
            raise ValueError("zip grande demais")
        for i in itens:
            n = i.filename.replace("\\", "/")
            alvo = os.path.realpath(os.path.join(raiz, n))
            if n.startswith("/") or ".." in n.split("/") or not alvo.startswith(raiz + os.sep):
                raise ValueError(f"caminho suspeito no zip: {i.filename}")
            if (i.external_attr >> 16) & 0o170000 == 0o120000:  # link simbólico: fora
                continue
            if n.endswith("/"):
                os.makedirs(alvo, exist_ok=True); continue
            os.makedirs(os.path.dirname(alvo), exist_ok=True)
            with z.open(i) as src, open(alvo, "wb") as dst:
                shutil.copyfileobj(src, dst)
            if (i.external_attr >> 16) & 0o111:
                os.chmod(alvo, 0o755)


class Andamento:
    """Escreve o passo atual em .painel/atualizacao-andamento.json: é o que a faixa do Início mostra."""
    def __init__(self, P):
        self.c = os.path.join(P.dir, ".painel", "atualizacao-andamento.json")

    def __call__(self, estado, msg, **extra):
        print(f"  [{estado}] {msg}", flush=True)
        if os.path.isdir(os.path.dirname(self.c)):
            try:
                grava_json(self.c, {"estado": estado, "msg": msg[:200], "ts": time.time(), **extra})
            except OSError:
                pass


def atualiza(P, a):
    """Baixa o pacote novo, confere o sha256 e troca SÓ as skills do produto que estão instaladas (mais a cópia em
    _ferramentas/pacote). A versão anterior fica em _ferramentas/copias-antigas/<nome>.antes-<data>. Não toca em
    projetos/, modelos/, marca.json, .painel/, voz/ nem _lixeira/. No fim, religa o painel na mesma porta e chave."""
    passo("Atualização do painel")
    and_ = Andamento(P)
    if not os.path.isdir(P.dir) or not os.path.isdir(P.f):
        diz(FALHA, f"pasta de trabalho não encontrada: {P.dir}"); return False
    skill = os.path.join(P.skills, "painel-edicao-com-ia")
    conf = ler_json(os.path.join(skill, "atualizacao.json"), {})
    atual = str(ler_json(os.path.join(skill, "versao.json"), {}).get("versao") or conf.get("versao") or "0")
    base = (a.de or str(conf.get("url") or "")).strip()
    if not base or "EXEMPLO" in base or not url_permitida(base):  # "EXEMPLO" (maiúsculo) é a URL de exemplo do atualizacao.json
        and_("erro", "O endereço de atualização ainda não foi configurado.")
        diz(FALHA, f"endereço de atualização inválido ou de exemplo: {base or 'vazio'}"); return False
    base = base if base.endswith("/") else base + "/"
    and_("baixando", "Procurando a versão nova…")
    try:
        r = valida_remoto(json.loads(baixa(base + "versao.json", timeout=15).decode("utf-8")), base)
    except Exception as e:
        and_("erro", "Não consegui falar com o servidor de atualização. Confira a internet e tente de novo.")
        diz(FALHA, f"versao.json: {e}"); return False
    if not r:
        and_("erro", "O arquivo de versão veio inválido.")
        diz(FALHA, "versao.json remoto inválido"); return False
    if versao_tupla(r["versao"]) <= versao_tupla(atual):
        and_("pronto", f"O painel já está na versão mais nova ({atual}).")
        diz(OK, f"já está na versão mais nova ({atual})"); return True
    tmp = tempfile.mkdtemp(prefix="edicao-com-ia-")
    try:
        and_("baixando", f"Baixando a versão {r['versao']}…")
        zp = os.path.join(tmp, "pacote.zip")
        try:
            sha = baixa(r["zip"], zp, limite=600 * 1024 ** 2, timeout=900)
        except Exception as e:
            and_("erro", "O download falhou. Confira a internet e tente de novo.")
            diz(FALHA, f"download: {e}"); return False
        and_("conferindo", "Conferindo o arquivo…")
        if sha != r["sha256"]:
            and_("erro", "O arquivo baixado não bate com a assinatura. Tente de novo mais tarde.")
            diz(FALHA, "sha256 diferente do anunciado"); return False
        ext = os.path.join(tmp, "x")
        try:
            extrai_seguro(zp, ext)
        except Exception as e:
            and_("erro", "O pacote baixado veio estranho e não foi instalado.")
            diz(FALHA, f"zip: {e}"); return False
        pasta_skills = None
        for d, subs, _ in os.walk(ext):
            if "skills" in subs and os.path.isfile(os.path.join(d, "skills", "painel-edicao-com-ia", "SKILL.md")):
                pasta_skills = os.path.join(d, "skills"); break
        vz = ler_json(os.path.join(pasta_skills or ext, "painel-edicao-com-ia", "versao.json"), {}).get("versao")
        if not pasta_skills or versao_tupla(vz) != versao_tupla(r["versao"]):
            and_("erro", "O pacote baixado não é da versão anunciada.")
            diz(FALHA, f"pacote sem skills ou com versão {vz!r} (anunciada {r['versao']})"); return False
        and_("instalando", f"Instalando a versão {r['versao']}…")
        carimbo = f"{datetime.datetime.now():%Y%m%d-%H%M%S}"
        guarda = os.path.join(P.f, "copias-antigas")
        os.makedirs(guarda, exist_ok=True)
        fora = shutil.ignore_patterns("__pycache__", "*.bak*", ".DS_Store")
        trocadas = []
        for nome in sorted(os.listdir(pasta_skills)):
            origem, destino = os.path.join(pasta_skills, nome), os.path.join(P.skills, nome)
            if not re.fullmatch(r"[a-z0-9-]{1,40}", nome) or not os.path.isfile(os.path.join(origem, "SKILL.md")):
                continue
            if not os.path.isdir(destino) and nome != "painel-edicao-com-ia":
                continue  # estilo que a pessoa não instalou: só a cópia do pacote muda
            if os.path.isdir(destino):
                if not _difere(origem, destino):
                    continue
                shutil.move(destino, os.path.join(guarda, f"{nome}.antes-{carimbo}"))
            shutil.copytree(origem, destino, ignore=fora)
            trocadas.append(nome)
        if os.path.isdir(P.pacote):
            shutil.move(P.pacote, os.path.join(guarda, f"pacote.antes-{carimbo}"))
        shutil.copytree(pasta_skills, P.pacote, ignore=fora)
        espelha_no_codex(P)
        e = P.estado()
        e["painel"] = {"versao": r["versao"], "atualizado": datetime.datetime.now().isoformat(timespec="minutes"), "de": atual}
        P.salva_estado(e)
        try:  # o CLAUDE.md é do instalador (refeito a cada instalação), com o catálogo da versão nova
            escreve_claude_md(P, json.load(open(os.path.join(skill, "estilos.json"), encoding="utf-8")))
        except Exception as ex:
            diz(AVISO, f"não consegui refazer o CLAUDE.md ({ex})")
        diz(OK, f"versão {r['versao']} instalada (antes: {atual}); skills trocadas: {', '.join(trocadas) or 'nenhuma precisou'}")
        diz(OK, f"a versão anterior ficou em {guarda} (*.antes-{carimbo})")
        religa_painel(P, a.religar, and_, r["versao"])
        return True
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def religa_painel(P, porta, and_, versao):
    """Desliga o painel antigo e liga o novo na mesma porta, mantendo a chave da aba aberta (arquivo .manter, que o
    servidor novo lê uma vez e apaga). Se o painel estava desligado, não liga nada."""
    oculto = os.path.join(P.dir, ".painel")
    sj = os.path.join(oculto, "servidor.json")
    if not porta:
        porta = ler_json(sj, {}).get("porta") if os.path.exists(sj) else None
    if not porta:
        and_("pronto", f"Painel atualizado para a versão {versao}.", alvo=versao)
        diz(OK, "o painel estava desligado: a próxima abertura já usa a versão nova"); return
    painel = os.path.join(P.skills, "painel-edicao-com-ia", "scripts", "painel.py")
    cn = os.path.join(oculto, "chave-navegador")
    # com projeto trabalhando, não religa (o Claude daquele projeto ficaria órfão): fica para a próxima abertura
    try:
        req = urllib.request.Request(f"http://127.0.0.1:{porta}/api/v2/estado",
                                     headers={"X-Painel-Chave": open(cn, encoding="utf-8").read().strip()})
        ocupados = [p.get("nome") or p.get("id") for p in json.load(urllib.request.urlopen(req, timeout=5)).get("projetos", [])
                    if p.get("estado") != "parado"]
    except Exception:
        ocupados = []
    if ocupados:
        and_("pronto", f"Versão {versao} instalada. O painel usa a versão nova na próxima abertura.", alvo=versao)
        diz(AVISO, f"não religuei o painel: tem projeto trabalhando ({', '.join(map(str, ocupados))}). Feche e abra o painel depois."); return
    and_("religando", f"Religando o painel na versão {versao}…", alvo=versao)
    try:
        shutil.copy2(cn, cn + ".manter"); os.chmod(cn + ".manter", 0o600)
    except OSError:
        pass
    roda([sys.executable, painel, "fechar", P.dir], timeout=30)
    for _ in range(40):  # espera o processo antigo sair de verdade (ele apaga o servidor.json ao fechar)
        if not os.path.exists(sj):
            break
        time.sleep(0.25)
    r = roda([sys.executable, painel, "abrir", P.dir, "--sem-navegador", "--porta", str(porta)], timeout=60)
    if r and r.returncode == 0:
        diz(OK, f"painel religado na porta {porta} (a aba aberta continua valendo)")
    else:
        and_("erro", "O painel não religou sozinho. Dê dois cliques em Abrir Painel na sua pasta de trabalho.")
        diz(FALHA, f"não consegui religar o painel: {((r.stdout or '') + (r.stderr or '') if r else 'sem resposta')[-200:]}")


def main():
    ap = argparse.ArgumentParser(description="Instalador do Edição com IA")
    ap.add_argument("--pasta", default="~/Edicao-com-IA")
    ap.add_argument("--skills", default="~/.claude/skills")
    ap.add_argument("--estilo", action="append", default=[])
    ap.add_argument("--todos", action="store_true")
    ap.add_argument("--sim", action="store_true")
    ap.add_argument("--conferir", action="store_true")
    ap.add_argument("--sem-programas", action="store_true")
    ap.add_argument("--sem-teste", action="store_true")
    ap.add_argument("--atualizar", action="store_true", help="baixa a versão nova do pacote e troca só as skills do produto")
    ap.add_argument("--religar", type=int, default=0, help=argparse.SUPPRESS)  # porta do painel que pediu (uso interno do painel.py)
    ap.add_argument("--de", default="", help=argparse.SUPPRESS)                 # outro endereço base, só para testes
    a = ap.parse_args()
    P = Pasta(a.pasta, a.skills)
    if a.atualizar:
        ok = atualiza(P, a)
        print()
        print("Tudo certo." if ok else "A atualização não terminou. Veja acima o que faltou.")
        sys.exit(0 if ok else 1)
    cat = catalogo()
    estilos = [x["id"] for x in cat["estilos"] if not x.get("em_breve")] if a.todos else a.estilo

    passo("1. Programas do computador")
    falta = confere_programas()
    if a.conferir:
        if falta:
            diz(FALHA, f"faltam: {', '.join(falta)}")
        confere(P, cat)
    else:
        instala_programas(falta, a)
        if not WIN:
            garante_claude_terminal(a)
        else:
            diz(AVISO, "no Windows o painel ainda não roda o Claude por dentro (fica no modo recado): o pedido vai para o chat do Claude")
        passo("2. Pasta de trabalho e painel")
        prepara_pasta(P, a)
        for eid in estilos:
            instala_estilo(eid, P, cat)
        espelha_no_codex(P, cat)
        escreve_claude_md(P, cat)
        confere(P, cat)
        if not a.sem_teste and not erros:
            teste(P)
    print()
    if erros:
        print(f"{len(erros)} item(ns) falharam. Corrija o que está marcado acima e rode de novo com --conferir.")
        sys.exit(1)
    print("Tudo certo.")
    if not a.conferir:
        print(f"Pasta: {P.dir}")
        print(f"Para abrir o painel: dois cliques em \"Abrir Painel\" dentro da pasta, ou diga ao Claude: abre o painel.")


if __name__ == "__main__":
    main()
