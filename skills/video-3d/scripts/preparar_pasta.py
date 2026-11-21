"""Prepara (ou confere) a PASTA DE TRABALHO dos vídeos 3D: tudo o que os vídeos usam fica dentro dela.
uso:
  python preparar_pasta.py "<pasta>"                       cria a estrutura, confere o que está instalado e escreve o CLAUDE.md (não instala nada)
  python preparar_pasta.py "<pasta>" --instalar            instala o que falta dentro de <pasta>/_ferramentas (Python com Whisper, peças 3D, SFX Kit)
  python preparar_pasta.py "<pasta>" --voz voicestudio:<perfil> | elevenlabs:<voice_id> | higgsfield:<nome da voz> | propria     anota a voz escolhida
Estrutura:
  <pasta>/CLAUDE.md            o Claude lê sozinho quando a pasta é aberta: o que tem aqui e como criar um vídeo
  <pasta>/_ferramentas/        .venv (Python + faster-whisper), pecas-3d (Kenney, CC0), sfx-kit (CC0), earshot (opcional), estado.json
  <pasta>/Prontos/             os vídeos finais
  <pasta>/<nome-do-video>/     um projeto por vídeo (criado pelo novo_projeto_3d.py)
Node, FFmpeg e Python são programas do computador: o script só confere e diz como instalar (o Claude pergunta antes)."""
import ast, datetime, json, os, platform, shutil, subprocess, sys, urllib.request, zipfile, io

SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WIN = platform.system() == "Windows"
a = sys.argv[1:]
if not a or a[0].startswith("-"): print(__doc__); sys.exit(1)
P = os.path.abspath(os.path.expanduser(a[0])); F = os.path.join(P, "_ferramentas"); EST = os.path.join(F, "estado.json")
INSTALAR = "--instalar" in a
for d in (P, F, os.path.join(P, "Prontos")): os.makedirs(d, exist_ok=True)
est = json.load(open(EST)) if os.path.exists(EST) else {"versao": 1, "criada": datetime.date.today().isoformat(), "voz": None}
if "--voz" in a:
    v = a[a.index("--voz") + 1]; motor, _, vid = v.partition(":")
    est["voz"] = {"motor": motor, "id": vid or None}
VPY = os.path.join(F, ".venv", "Scripts" if WIN else "bin", "python.exe" if WIN else "python")

def roda(cmd, **k):
    try: return subprocess.run(cmd, capture_output=True, text=True, timeout=k.get("timeout", 30))
    except Exception: return None
def versao(cmd):
    r = roda(cmd); return (r.stdout or r.stderr).strip().splitlines()[0] if r and r.returncode == 0 else None

# ---------- programas do computador (só confere) ----------
node = versao(["node", "-v"]); nmaj = int(node.lstrip("v").split(".")[0]) if node else 0
ff = versao(["ffmpeg", "-version"])
def acha_python():
    cands = (["py", "-3.12"], ["py", "-3.13"], ["py", "-3.11"], ["py", "-3.10"]) if WIN else \
            (["python3.12"], ["python3.13"], ["python3.11"], ["python3.10"], ["python3"])
    for c in cands:
        r = roda(c + ["-c", "import sys;print(sys.version_info[:2])"])
        if r and r.returncode == 0:
            mj, mn = ast.literal_eval(r.stdout.strip())
            if mj == 3 and 10 <= mn <= 13: return c, f"{mj}.{mn}"
    return None, None
pycmd, pyver = acha_python()
git = shutil.which("git")
dica = ("winget install OpenJS.NodeJS.LTS / Gyan.FFmpeg / Python.Python.3.12" if WIN else "brew install node ffmpeg python@3.12")

# ---------- ferramentas dentro da pasta ----------
def tem_venv():
    r = roda([VPY, "-c", "import faster_whisper, numpy; print('ok')"]) if os.path.exists(VPY) else None
    return bool(r and r.returncode == 0)
def n_pecas():
    c = os.path.join(F, "pecas-3d", "catalogo.json")
    return sum(len(v) for v in json.load(open(c)).values()) if os.path.exists(c) else 0
tem_sfx = lambda: os.path.exists(os.path.join(F, "sfx-kit", "sounds.json"))
tem_earshot = lambda: os.path.isdir(os.path.join(F, "earshot", ".venv"))

if INSTALAR:
    if not tem_venv():
        if not pycmd: print(f"FALTA Python 3.10–3.13 no computador ({dica}). Instale e rode de novo.")
        else:
            print("instalando Python + faster-whisper em _ferramentas/.venv ...", flush=True)
            subprocess.run(pycmd + ["-m", "venv", os.path.join(F, ".venv")], check=True)
            subprocess.run([VPY, "-m", "pip", "install", "-q", "--upgrade", "pip"], check=False)
            subprocess.run([VPY, "-m", "pip", "install", "-q", "faster-whisper", "numpy", "scipy"], check=True)
    if n_pecas() == 0:
        print("baixando as peças 3D (Kenney, CC0, ~40 MB) ...", flush=True)
        subprocess.run([sys.executable, os.path.join(SKILL, "scripts", "pecas_3d.py"), "baixar"], check=True,
                       env={**os.environ, "PECAS_3D": os.path.join(F, "pecas-3d")})
    if not tem_sfx():
        print("baixando o SFX Kit (320 sons CC0) ...", flush=True)
        dest = os.path.join(F, "sfx-kit")
        if git: subprocess.run([git, "clone", "-q", "--depth", "1", "https://github.com/wyzowl/sfx-kit", dest], check=True)
        else:
            z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen("https://github.com/wyzowl/sfx-kit/archive/refs/heads/main.zip", timeout=300).read()))
            raiz = z.namelist()[0].split("/")[0]
            for n in z.namelist():
                if ".." in n or n.endswith("/"): continue
                alvo = os.path.join(dest, n[len(raiz) + 1:]); os.makedirs(os.path.dirname(alvo), exist_ok=True); open(alvo, "wb").write(z.read(n))

est.update({"python": VPY if tem_venv() else None, "pecas": n_pecas(), "sfx_kit": tem_sfx(), "earshot": tem_earshot(),
            "atualizado": datetime.datetime.now().isoformat(timespec="minutes")})
json.dump(est, open(EST, "w"), indent=1, ensure_ascii=False)

# ---------- relatório ----------
ok = lambda b: "ok" if b else "FALTA"
linhas = [
    ("Node 22+ (HyperFrames)", node if nmaj >= 22 else None, dica),
    ("FFmpeg", ff and "instalado", dica),
    ("Python 3.10–3.13", pyver, dica),
    ("Python da pasta com Whisper (_ferramentas/.venv)", est["python"] and "instalado", "--instalar"),
    ("Peças 3D (_ferramentas/pecas-3d)", est["pecas"] and f"{est['pecas']} peças", "--instalar"),
    ("SFX Kit (_ferramentas/sfx-kit)", est["sfx_kit"] and "instalado", "--instalar"),
    ("Earshot (_ferramentas/earshot, opcional)", est["earshot"] and "instalado", "references/som-profissional.md, com a pasta _ferramentas"),
    ("Voz escolhida", est["voz"] and (est["voz"]["motor"] + (f" ({est['voz']['id']})" if est["voz"].get("id") else "")), "--voz (veja references/voz-ia.md)"),
]
falta = [(n, c) for n, v, c in linhas if not v and c in ("--instalar", dica)]
for n, v, c in linhas: print(f"{ok(v) if v or c in ('--instalar', dica) else 'opc.':5} {n}: {v or '→ ' + c}")

py = est["python"] or "python3"
voz = est["voz"]
if voz and voz["motor"] in ("voicestudio", "elevenlabs", "higgsfield"):
    cmd_voz = f'`"{py}" "{SKILL}/scripts/voz_ia.py" --motor {voz["motor"]} --voz {voz["id"] or "<id>"} 1 2 3 4 5 6` (na pasta do vídeo)'
elif voz: cmd_voz = "a pessoa grava as falas em `Bruto/` (voz própria)"
else: cmd_voz = "ainda não escolhida: pergunte (references/voz-ia.md) e anote com `preparar_pasta.py --voz`"
md = f"""# Pasta de vídeos 3D

Preparada pela skill **video-3d**. Tudo o que os vídeos usam já está aqui dentro: **não instale de novo**.
Este arquivo é refeito pelo `preparar_pasta.py`; as preferências da pessoa ficam em `NOTAS.md`: **leia o `NOTAS.md` antes de começar**, se ele existir.
Se a pasta mudar de lugar (ou de computador), rode `python "{SKILL}/scripts/preparar_pasta.py" "<novo caminho>"` para refazer os caminhos.

## Para criar um vídeo
Quando a pessoa pedir um vídeo 3D (um tema ou um link de referência), siga a skill video-3d **a partir do passo 1 (tema)**:
- cada vídeo numa subpasta nova: `"{py}" "{SKILL}/scripts/novo_projeto_3d.py" "{P}/<nome-do-video>"`;
- rode os scripts da skill com o Python desta pasta: `"{py}"` (ele tem o Whisper);
- voz: {cmd_voz};
- o vídeo final vai em `{P}/Prontos/<nome>.mp4`.

## Onde está cada coisa
| O quê | Onde |
|---|---|
| Scripts da skill | `{SKILL}/scripts/` |
| Python com Whisper | `{py}` |
| Peças 3D (Kenney, CC0) e catálogo | `_ferramentas/pecas-3d/catalogo.md` (use `pecas_3d.py buscar/usar`) |
| Efeitos sonoros (SFX Kit, CC0) | `_ferramentas/sfx-kit/` (`GUIDE.md`, `catalogue.md`) |
| Earshot (ouvir o vídeo) | {"`_ferramentas/earshot/`" if est["earshot"] else "não instalado (opcional)"} |
| Vídeos prontos | `Prontos/` |

## Estado da instalação ({est["atualizado"]})
""" + "\n".join(f"- {ok(v) if v or c in ('--instalar', dica) else 'pendente'}: {n}" + (f" ({v})" if v and v not in ('instalado',) else "") for n, v, c in linhas) + (
f"""

**Falta instalar:** {", ".join(n for n, c in falta)}. Pergunte à pessoa antes e rode `python "{SKILL}/scripts/preparar_pasta.py" "{P}" --instalar` (programas do computador: `{dica}`).
""" if falta else "\n\nTudo instalado.\n")
open(os.path.join(P, "CLAUDE.md"), "w", encoding="utf-8").write(md)
print(f"\nCLAUDE.md escrito em {P}" + ("" if not falta else f" | falta: {len(falta)} item(ns)"))
