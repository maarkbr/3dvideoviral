#!/usr/bin/env python3
"""Painel "Edição com IA": uma página local onde o aluno escolhe o estilo, cadastra a marca e manda o pedido para o Claude.

Uso (sempre com a pasta do projeto):
  python painel.py abrir   <projeto> [--sem-navegador]  liga o painel (deixe rodando em segundo plano) e abre no navegador
  python painel.py esperar <projeto> [--max 3600]       espera o aluno mandar algo (pedido, ajuste ou aprovação), mostra e sai
  python painel.py status  <projeto> <id> "mensagem" [--pct 40]   mostra o andamento no painel
  python painel.py pronto  <projeto> <id> <arquivo.mp4> [--msg "..."]  entrega o vídeo no painel
  python painel.py link    <projeto>                    mostra o endereço do painel (para abrir de novo)
  python painel.py fechar  <projeto>                    desliga o painel

Segurança: só escuta em 127.0.0.1, exige uma chave aleatória por sessão em toda chamada, confere o endereço (Host/Origin),
limita o tamanho dos envios e só grava dentro da pasta do projeto. Só roda dois comandos fixos (o scripts/instalar.py desta
skill, para instalar um estilo ou atualizar o pacote) e só acessa a internet para conferir a versão nova (uma vez por dia)
e baixar a atualização quando a pessoa clica em Atualizar agora. Só usa a biblioteca padrão do Python (3.9+)."""
import argparse, json, os, re, secrets, subprocess, sys, threading, time, urllib.request, webbrowser
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import central as CEN  # noqa: E402
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, unquote, urlparse

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(RAIZ, "web")
CATALOGO = json.load(open(os.path.join(RAIZ, "estilos.json"), encoding="utf-8"))
ESTILOS = {e["id"]: e for e in CATALOGO["estilos"]}
EXT_VIDEO = {".mp4", ".mov", ".m4v", ".mkv", ".webm", ".mp3", ".wav", ".m4a", ".aac"}
EXT_LOGO = {".png", ".jpg", ".jpeg", ".webp"}  # sem SVG: SVG pode carregar script
MAX_LOGO = 5 * 1024 ** 2
MAX_ARQUIVO = 20 * 1024 ** 3
MAX_JSON = 64 * 1024
OCIOSO = 6 * 3600  # desliga sozinho depois de 6 h sem uso
TIPOS = {".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
         ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
         ".woff2": "font/woff2", ".mp4": "video/mp4", ".mov": "video/quicktime", ".m4v": "video/mp4", ".webm": "video/webm",
         ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8", ".md": "text/plain; charset=utf-8"}
_TRAVA_THREAD = threading.Lock()


class trava:
    """Trava entre processos (o painel e os comandos do Claude gravam os mesmos pedidos)."""
    def __init__(self, proj):
        self.proj = proj

    def __enter__(self):
        _TRAVA_THREAD.acquire()
        os.makedirs(self.proj.oculto, exist_ok=True)
        self.f = open(os.path.join(self.proj.oculto, "trava"), "a+")
        try:
            import fcntl
            fcntl.flock(self.f, fcntl.LOCK_EX)
        except ImportError:  # Windows
            import msvcrt
            self.f.seek(0)
            while True:
                try:
                    msvcrt.locking(self.f.fileno(), msvcrt.LK_LOCK, 1)
                    break
                except OSError:
                    time.sleep(0.05)
        return self

    def __exit__(self, *a):
        try:
            try:
                import fcntl
                fcntl.flock(self.f, fcntl.LOCK_UN)
            except ImportError:
                import msvcrt
                self.f.seek(0)
                msvcrt.locking(self.f.fileno(), msvcrt.LK_UNLCK, 1)
        finally:
            self.f.close()
            _TRAVA_THREAD.release()


# ---------- pasta do projeto ----------
class Projeto:
    def __init__(self, pasta):
        self.dir = os.path.realpath(pasta)
        if not os.path.isdir(self.dir):
            sys.exit(f"Pasta do projeto não existe: {pasta}")
        self.bruto = os.path.join(self.dir, "Bruto")
        self.pedidos = os.path.join(self.dir, "pedidos")
        self.oculto = os.path.join(self.dir, ".painel")
        self.marca_json = os.path.join(self.dir, "marca.json")
        self.marca_dir = os.path.join(self.dir, "marca")
        self.servidor_json = os.path.join(self.oculto, "servidor.json")

    def dentro(self, caminho):
        """Caminho real dentro da pasta do projeto? (bloqueia ../ e links para fora)"""
        real = os.path.realpath(caminho)
        return real == self.dir or real.startswith(self.dir + os.sep)

    def ler_marca(self):
        try:
            return json.load(open(self.marca_json, encoding="utf-8"))
        except (OSError, ValueError):
            return {}

    def arquivos(self):
        if not os.path.isdir(self.bruto):
            return []
        itens = []
        for n in sorted(os.listdir(self.bruto)):
            c = os.path.join(self.bruto, n)
            if os.path.isfile(c) and os.path.splitext(n)[1].lower() in EXT_VIDEO and not n.startswith("."):
                itens.append({"nome": n, "tamanho": os.path.getsize(c), "data": int(os.path.getmtime(c))})
        return itens

    def lista_pedidos(self):
        if not os.path.isdir(self.pedidos):
            return []
        out = []
        for n in sorted(os.listdir(self.pedidos)):
            if re.fullmatch(r"\d{4}\.json", n):
                try:
                    out.append(json.load(open(os.path.join(self.pedidos, n), encoding="utf-8")))
                except (OSError, ValueError):
                    pass
        return out

    def pedido(self, pid):
        if not re.fullmatch(r"\d{4}", pid or ""):
            return None
        c = os.path.join(self.pedidos, pid + ".json")
        try:
            return json.load(open(c, encoding="utf-8"))
        except (OSError, ValueError):
            return None

    def salvar_pedido(self, p):
        os.makedirs(self.pedidos, exist_ok=True)
        grava_json(os.path.join(self.pedidos, p["id"] + ".json"), p)

    def instalados(self):
        """Estilos prontos para usar. Pasta sem instalador (antiga): considera instalado o estilo cujas skills já estão no Claude."""
        est = os.path.join(self.dir, "_ferramentas", "estado.json")
        if os.path.exists(est):
            try:
                return sorted(json.load(open(est, encoding="utf-8")).get("estilos", {}).keys())
            except (OSError, ValueError):
                return []
        sk = os.path.expanduser("~/.claude/skills")
        return [e["id"] for e in CATALOGO["estilos"] if e.get("instalar")
                and all(os.path.isfile(os.path.join(sk, s, "SKILL.md")) for s in e["instalar"].get("skills", []))]

    def proximo_id(self):
        ids = [int(p["id"]) for p in self.lista_pedidos() if str(p.get("id", "")).isdigit()]
        return f"{(max(ids) if ids else 0) + 1:04d}"


def grava_json(caminho, dados):
    tmp = caminho + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)
    os.replace(tmp, caminho)


def agora():
    return datetime.now().isoformat(timespec="seconds")


def nome_seguro(nome, exts):
    """Só o nome do arquivo, sem pasta, com letras, números, espaço, ponto, hífen e sublinhado."""
    nome = os.path.basename(unquote(nome or "")).strip()
    base, ext = os.path.splitext(nome)
    ext = ext.lower()
    if ext not in exts:
        return None
    base = re.sub(r"[^\w\- .]", "_", base, flags=re.UNICODE).strip(" .")[:80] or "arquivo"
    return base + ext


def nome_livre(pasta, nome):
    base, ext = os.path.splitext(nome)
    c, i = nome, 2
    while os.path.exists(os.path.join(pasta, c)):
        c = f"{base} ({i}){ext}"
        i += 1
    return c


# ---------- validação ----------
class Invalido(Exception):
    pass


def valida_marca(d, atual):
    if not isinstance(d, dict):
        raise Invalido("Dados da marca inválidos.")
    m = dict(atual)
    if "handle" in d:
        h = str(d["handle"] or "").strip().lstrip("@")
        if h and not re.fullmatch(r"[A-Za-z0-9._]{1,30}", h):
            raise Invalido("O @ só pode ter letras, números, ponto e sublinhado (até 30).")
        m["handle"] = "@" + h if h else ""
    if "nome" in d:
        n = str(d["nome"] or "").strip()
        if len(n) > 60:
            raise Invalido("O nome do canal pode ter até 60 letras.")
        m["nome"] = n
    if "acento" in d:
        a = str(d["acento"] or "").strip()
        if not re.fullmatch(r"#[0-9A-Fa-f]{6}", a):
            raise Invalido("A cor precisa ser no formato #RRGGBB.")
        m["acento"] = a.upper()
    if "legenda" in d:
        if d["legenda"] not in {x["valor"] for x in CATALOGO["legendas"]}:
            raise Invalido("Estilo de legenda desconhecido.")
        m["legenda"] = d["legenda"]
    return m


def valida_pedido(d, proj):
    if not isinstance(d, dict):
        raise Invalido("Pedido inválido.")
    est = ESTILOS.get(d.get("estilo"))
    if not est or est.get("em_breve"):
        raise Invalido("Escolha um estilo disponível.")
    if est["id"] not in proj.instalados():
        raise Invalido("Instale esse estilo antes de mandar o pedido.")
    entrada = d.get("campos") if isinstance(d.get("campos"), dict) else {}
    campos = {}
    for c in est.get("campos", []):
        v = entrada.get(c["id"])
        v = "" if v is None else str(v).strip()
        if not v:
            if c.get("obrigatorio"):
                raise Invalido(f"Falta: {c['rotulo']}")
            continue
        if c["tipo"] == "texto":
            if len(v) > c.get("max", 1000):
                raise Invalido(f"Texto longo demais em: {c['rotulo']}")
        elif c["tipo"] == "link":
            if len(v) > c.get("max", 500) or not re.match(r"https?://[^\s]+$", v):
                raise Invalido(f"Link inválido em: {c['rotulo']}")
        elif c["tipo"] == "escolha":
            if v not in {o["valor"] for o in c["opcoes"]}:
                raise Invalido(f"Opção inválida em: {c['rotulo']}")
        elif c["tipo"] == "arquivo":
            if v not in {a["nome"] for a in proj.arquivos()}:
                raise Invalido(f"Arquivo não encontrado na pasta Bruto: {c['rotulo']}")
            v = "Bruto/" + v
        campos[c["id"]] = v
    modo = d.get("modo")
    if modo not in {m["valor"] for m in CATALOGO["modos"]}:
        raise Invalido("Escolha como o Claude deve trabalhar.")
    voz = None
    if est.get("voz"):
        voz = d.get("voz")
        if voz not in {v["valor"] for v in CATALOGO["vozes"]}:
            raise Invalido("Escolha a voz da narração.")
    marca = proj.ler_marca()
    if not re.fullmatch(r"#[0-9A-Fa-f]{6}", str(marca.get("acento", ""))):
        raise Invalido("Salve a cor da sua marca antes de mandar.")
    return est, campos, modo, voz, marca


# ---------- instalação de estilos pelo painel ----------
class Instalacao:
    """Roda o instalar.py de um estilo em segundo plano. O comando é fixo: o único dado que vem da página é o id do
    estilo, conferido contra o catálogo. Não instala programas do computador (--sem-programas): isso fica com o Claude."""
    def __init__(self):
        self.proc, self.estilo, self.log, self.codigo = None, None, None, None

    def inicia(self, eid, proj):
        with _TRAVA_THREAD:
            if self.proc and self.proc.poll() is None:
                return False
            os.makedirs(proj.oculto, exist_ok=True)
            self.log = os.path.join(proj.oculto, "instalacao.log")
            self.estilo, self.codigo = eid, None
            f = open(self.log, "w", encoding="utf-8")
            self.proc = subprocess.Popen([sys.executable, os.path.join(RAIZ, "scripts", "instalar.py"), "--pasta", proj.dir,
                                          "--estilo", eid, "--skills", os.path.dirname(RAIZ), "--sim", "--sem-programas", "--sem-teste"],
                                         stdout=f, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL, cwd=proj.dir)
            return True

    def resumo(self):
        if not self.proc:
            return None
        rodando = self.proc.poll() is None
        if not rodando and self.codigo is None:
            self.codigo = self.proc.returncode
        linhas = []
        try:
            linhas = [l.rstrip() for l in open(self.log, encoding="utf-8", errors="ignore").read().splitlines() if l.strip()][-6:]
        except OSError:
            pass
        return {"estilo": self.estilo, "rodando": rodando, "ok": (not rodando and self.codigo == 0), "linhas": linhas}


INSTALACAO = Instalacao()


# ---------- atualização do painel ----------
def versao_tupla(v):
    """'2.1.0' -> (2, 1, 0). Inválida -> None."""
    v = str(v or "").strip()
    return tuple(int(x) for x in v.split(".")) if re.fullmatch(r"\d{1,4}(\.\d{1,4}){0,3}", v) else None


def origem_midia():
    """O domínio dos vídeos inteiros dos modelos (o do atualizacao.json): o único de fora que a página pode tocar."""
    u = str(CEN.ler(os.path.join(RAIZ, "atualizacao.json"), {}).get("url") or "")
    p = urlparse(u)
    return f"https://{p.netloc}" if p.scheme == "https" and "EXEMPLO" not in u and re.fullmatch(r"[a-z0-9.-]+", p.netloc or "") else ""


def url_permitida(u):
    """Só https, ou http para o próprio computador (testes)."""
    p = urlparse(u)
    return bool(p.netloc) and (p.scheme == "https" or (p.scheme == "http" and p.hostname in ("127.0.0.1", "localhost")))


MIDIA = origem_midia()

def valida_remoto(d, base):
    """Aceita só um versao.json bem formado: versão numérica, zip no mesmo endereço, sha256 de 64 hex e notas curtas."""
    if not isinstance(d, dict) or not versao_tupla(d.get("versao")):
        return None
    z = str(d.get("zip") or "").strip()
    pb, pz = urlparse(base), urlparse(z)
    if not z or (pz.scheme, pz.netloc) != (pb.scheme, pb.netloc) or not pz.path.endswith(".zip"):
        return None
    sha = str(d.get("sha256") or "").lower()
    if not re.fullmatch(r"[0-9a-f]{64}", sha):
        return None
    return {"versao": str(d["versao"]).strip(), "zip": z, "sha256": sha,
            "notas": re.sub(r"\s+", " ", str(d.get("notas") or "")).strip()[:160]}


def versao_atual():
    """A versão instalada desta skill: versao.json (escrito pelo montar_pacote.py) ou, sem ele, a de atualizacao.json."""
    return str(CEN.ler(os.path.join(RAIZ, "versao.json"), {}).get("versao")
               or CEN.ler(os.path.join(RAIZ, "atualizacao.json"), {}).get("versao") or "0")


class Atualizacao:
    """Confere, em segundo plano e no máximo a cada 30 minutos, se saiu uma versão nova do pacote (o versao.json na URL de
    atualizacao.json). Sem internet, silêncio. A troca em si é o instalar.py --atualizar, um processo independente que só
    a rota POST /api/v2/atualizar dispara, com a chave do navegador: o Claude do painel não alcança nem a rota nem .painel."""
    INTERVALO = 30 * 60  # era 1 vez por dia: o aviso de versão nova demorava até 24 h para aparecer depois de publicar
    EM_CURSO = ("baixando", "conferindo", "instalando", "religando")

    def __init__(self):
        self.proj, self.remoto, self.proc, self.recem, self.recem_ts = None, None, None, None, 0

    def _cache(self):
        return os.path.join(self.proj.oculto, "versao-remota.json")

    def _andamento(self):
        return os.path.join(self.proj.oculto, "atualizacao-andamento.json")

    @staticmethod
    def url_base():
        u = str(CEN.ler(os.path.join(RAIZ, "atualizacao.json"), {}).get("url") or "").strip()
        if not u or "EXEMPLO" in u or not url_permitida(u):  # "EXEMPLO" (maiúsculo) é a URL de exemplo que vem no atualizacao.json
            return ""
        return u if u.endswith("/") else u + "/"

    def liga(self, proj):
        """Chamado quando o servidor liga: fecha o andamento de uma atualização que acabou de religar o painel e começa a conferência."""
        self.proj = proj
        a = CEN.ler(self._andamento(), {})
        if a.get("estado") in ("religando", "pronto"):
            if a.get("alvo") and versao_tupla(a["alvo"]) != versao_tupla(versao_atual()):
                grava_json(self._andamento(), {"estado": "erro", "ts": time.time(),
                                               "msg": f"O painel religou, mas continua na versão {versao_atual()}. Tente de novo."})
            else:
                if a.get("alvo"):
                    self.recem, self.recem_ts = versao_atual(), time.time()
                _apaga(self._andamento())
        threading.Thread(target=self.laco, daemon=True).start()

    def laco(self):
        time.sleep(3)
        while True:
            try:
                self.confere()
            except Exception:
                pass
            time.sleep(300)

    def confere(self):
        base = self.url_base()
        if not base:
            return
        c = CEN.ler(self._cache(), {})
        if c.get("url") == base and time.time() - float(c.get("conferido") or 0) < self.INTERVALO:
            self.remoto = c.get("remoto"); return
        req = urllib.request.Request(base + "versao.json", headers={"User-Agent": "Painel-Edicao-com-IA"})
        try:
            dados = urllib.request.urlopen(req, timeout=6).read(64 * 1024 + 1)
            r = valida_remoto(json.loads(dados.decode("utf-8")), base) if len(dados) <= 64 * 1024 else None
        except Exception:
            return  # sem internet ou servidor fora: tenta de novo daqui a 5 minutos, sem barulho
        self.remoto = r
        grava_json(self._cache(), {"url": base, "conferido": time.time(), "remoto": r})

    def estado(self):
        atual = versao_atual()
        d = {"atual": atual}
        r = self.remoto
        if r and versao_tupla(r.get("versao")) and versao_tupla(r["versao"]) > (versao_tupla(atual) or (0,)):
            d["nova"], d["notas"] = r["versao"], r.get("notas", "")
        a = CEN.ler(self._andamento(), {}) if self.proj else {}
        if a.get("estado") in self.EM_CURSO + ("erro",) and time.time() - float(a.get("ts") or 0) < 1800:
            d["andamento"] = {"estado": a["estado"], "msg": str(a.get("msg", ""))[:200]}
        if self.recem and time.time() - self.recem_ts < 600:
            d["recem"] = self.recem
        return d

    def inicia(self, porta):
        """Dispara o instalar.py --atualizar como processo independente (sobrevive ao religar do servidor). Devolve o erro, se houver."""
        with _TRAVA_THREAD:
            a = CEN.ler(self._andamento(), {})
            if (self.proc and self.proc.poll() is None) or \
                    (a.get("estado") in self.EM_CURSO and time.time() - float(a.get("ts") or 0) < 900):
                return "Já tem uma atualização em andamento."
            os.makedirs(self.proj.oculto, exist_ok=True)
            grava_json(self._andamento(), {"estado": "baixando", "msg": "Começando…", "ts": time.time()})
            log = open(os.path.join(self.proj.oculto, "atualizacao.log"), "w", encoding="utf-8")
            cmd = [sys.executable, os.path.join(RAIZ, "scripts", "instalar.py"), "--pasta", self.proj.dir, "--skills", os.path.dirname(RAIZ),
                   "--atualizar", "--religar", str(porta), "--sim"]
            extra = {"creationflags": 0x00000008 | 0x00000200} if os.name == "nt" else {"start_new_session": True}
            self.proc = subprocess.Popen(cmd, stdout=log, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL, cwd=self.proj.dir, **extra)
            return ""


ATUALIZACAO = Atualizacao()


# ---------- servidor ----------
class Painel(BaseHTTPRequestHandler):
    server_version = "Painel"
    sys_version = ""
    proj: Projeto = None
    token = ""          # chave do navegador (arquivo .painel/chave-navegador, que o Claude do painel não lê)
    token_claude = ""   # chave do aprovador: só serve para /api/v2/aprovar e para as perguntas (fica em servidor.json)
    porta = 0
    ultimo = [time.time()]

    def log_message(self, *a):  # sem log de requisição (não vaza nome de arquivo nem chave)
        pass

    # --- respostas ---
    def responde(self, codigo, corpo=b"", tipo="application/json", extra=None):
        self.send_response(codigo)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(corpo)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Content-Security-Policy",
                         "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:" + (" " + MIDIA if MIDIA else "") + "; style-src 'self'; "
                         "script-src 'self'; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'none'")
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(corpo)

    def json(self, codigo, dados):
        self.responde(codigo, json.dumps(dados, ensure_ascii=False).encode("utf-8"))

    def erro(self, codigo, msg):
        self.json(codigo, {"erro": msg})

    # --- portaria ---
    def host_ok(self):
        h = (self.headers.get("Host") or "").lower()
        if h not in {f"127.0.0.1:{self.porta}", f"localhost:{self.porta}"}:
            return False
        o = self.headers.get("Origin")
        if o and o.lower() not in {f"http://127.0.0.1:{self.porta}", f"http://localhost:{self.porta}"}:
            return False
        return True

    def chave_ok(self, q, claude=False):
        t = self.headers.get("X-Painel-Chave") or (q.get("t") or [""])[0]
        if secrets.compare_digest(t, self.token):
            return True
        return bool(claude) and secrets.compare_digest(t, self.token_claude)

    def le_json(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n <= 0 or n > MAX_JSON:
            raise Invalido("Pedido grande demais ou vazio.")
        try:
            return json.loads(self.rfile.read(n).decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            raise Invalido("Dados inválidos.")

    # --- GET ---
    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        Painel.ultimo[0] = time.time()
        if not self.host_ok():
            return self.erro(403, "Endereço não permitido.")
        u = urlparse(self.path)
        q = parse_qs(u.query)
        caminho = unquote(u.path)
        if caminho.startswith("/api/") or caminho.startswith("/arquivos/"):
            if not self.chave_ok(q):
                return self.erro(401, "Abra o painel pelo link que o Claude mostrou.")
            if caminho.startswith(("/api/v2/", "/arquivos/projeto/", "/arquivos/modelo/", "/arquivos/entrega-capa/")):
                return self.v2_get(caminho, q)
            if caminho == "/api/estado":
                return self.estado()
            if caminho == "/arquivos/logo":
                logo = self.proj.ler_marca().get("logo")
                return self.manda_arquivo(os.path.join(self.proj.dir, logo) if logo else "", EXT_LOGO)
            m = re.fullmatch(r"/arquivos/resultado/(\d{4})", caminho)
            if m:
                p = self.proj.pedido(m.group(1))
                if not p or not p.get("resultado"):
                    return self.erro(404, "Ainda não tem vídeo.")
                return self.manda_arquivo(os.path.join(self.proj.dir, p["resultado"]), EXT_VIDEO)
            return self.erro(404, "Não encontrado.")
        # arquivos da página
        if caminho in ("", "/"):
            caminho = "/central.html"
        alvo = os.path.realpath(os.path.join(WEB, caminho.lstrip("/")))
        if not alvo.startswith(os.path.realpath(WEB) + os.sep) or not os.path.isfile(alvo):
            return self.erro(404, "Não encontrado.")
        ext = os.path.splitext(alvo)[1].lower()
        if ext == ".mp4":
            return self.manda_arquivo(alvo, {".mp4"}, livre=True)
        corpo = open(alvo, "rb").read()
        self.responde(200, corpo, TIPOS.get(ext, "application/octet-stream"))

    def manda_arquivo(self, caminho, exts, livre=False):
        """Manda um arquivo do projeto (ou da página), com suporte a Range para o vídeo poder avançar."""
        if not caminho or not os.path.isfile(caminho):
            return self.erro(404, "Não encontrado.")
        if not livre and not self.proj.dentro(caminho):
            return self.erro(403, "Fora da pasta do projeto.")
        ext = os.path.splitext(caminho)[1].lower()
        if ext not in exts:
            return self.erro(403, "Tipo de arquivo não permitido.")
        tam = os.path.getsize(caminho)
        ini, fim, codigo = 0, tam - 1, 200
        r = re.fullmatch(r"bytes=(\d*)-(\d*)", self.headers.get("Range") or "")
        if r and tam:
            if r.group(1):
                ini = int(r.group(1))
                fim = int(r.group(2)) if r.group(2) else tam - 1
            elif r.group(2):
                ini = max(0, tam - int(r.group(2)))
            fim = min(fim, tam - 1)
            if ini > fim:
                self.send_response(416)
                self.send_header("Content-Range", f"bytes */{tam}")
                self.end_headers()
                return
            codigo = 206
        self.send_response(codigo)
        self.send_header("Content-Type", TIPOS.get(ext, "application/octet-stream"))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(fim - ini + 1))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-store")
        if codigo == 206:
            self.send_header("Content-Range", f"bytes {ini}-{fim}/{tam}")
        self.end_headers()
        if self.command == "HEAD":
            return
        with open(caminho, "rb") as f:
            f.seek(ini)
            falta = fim - ini + 1
            try:
                while falta > 0:
                    bloco = f.read(min(1024 * 1024, falta))
                    if not bloco:
                        break
                    self.wfile.write(bloco)
                    falta -= len(bloco)
            except (BrokenPipeError, ConnectionResetError):
                pass

    def estado(self):
        marca = self.proj.ler_marca()
        voz = ""
        try:
            voz = open(os.path.join(self.proj.dir, "voz", "escolha.txt"), encoding="utf-8").read().split()[0]
        except (OSError, IndexError):
            pass
        pedidos = [{k: p.get(k) for k in ("id", "criado", "estilo", "estado", "progresso", "mensagem", "resultado",
                                           "ajustes", "campos", "modo", "voz", "atualizado")}
                   for p in self.proj.lista_pedidos()]
        self.json(200, {"catalogo": CATALOGO, "marca": marca, "arquivos": self.proj.arquivos(), "pedidos": pedidos,
                        "instalados": self.proj.instalados(), "instalacao": INSTALACAO.resumo(),
                        "voz_padrao": voz if voz in {v["valor"] for v in CATALOGO["vozes"]} else "",
                        "pasta": os.path.basename(self.proj.dir), "claude_ouvindo": self.claude_ouvindo()})

    def claude_ouvindo(self):
        try:
            return time.time() - os.path.getmtime(os.path.join(self.proj.oculto, "esperando")) < 6
        except OSError:
            return False

    # --- POST ---
    def do_POST(self):
        Painel.ultimo[0] = time.time()
        if not self.host_ok():
            return self.erro(403, "Endereço não permitido.")
        u = urlparse(self.path)
        q = parse_qs(u.query)
        if u.path == "/api/v2/higgsfield":  # a ponte do Higgsfield do Codex: só com o bilhete do projeto (não vale para mais nada)
            return self.ponte_higgsfield()
        so_claude = u.path == "/api/v2/aprovar" or bool(re.fullmatch(r"/api/v2/projeto/[a-z0-9-]{1,40}/pergunta", u.path))
        if not self.chave_ok(q, so_claude):
            return self.erro(401, "Abra o painel pelo link que o Claude mostrou.")
        try:
            if u.path.startswith("/api/v2/"):
                return self.v2_post(u.path, q)
            if u.path == "/api/marca":
                with trava(self.proj):
                    m = valida_marca(self.le_json(), self.proj.ler_marca())
                    grava_json(self.proj.marca_json, m)
                return self.json(200, {"marca": m})
            if u.path == "/api/logo":
                return self.recebe_logo(q)
            if u.path == "/api/arquivo":
                return self.recebe_arquivo(q)
            if u.path == "/api/pedido":
                return self.cria_pedido()
            if u.path == "/api/instalar":
                return self.instala()
            m = re.fullmatch(r"/api/pedido/(\d{4})/(ajuste|aprovar)", u.path)
            if m:
                return self.responde_pedido(m.group(1), m.group(2))
            if u.path == "/api/fechar":
                self.json(200, {"ok": True})
                threading.Thread(target=self.server.shutdown, daemon=True).start()
                return
            return self.erro(404, "Não encontrado.")
        except (Invalido, ValueError) as e:
            return self.erro(400, str(e))
        except Exception:
            return self.erro(500, "Algo deu errado no painel. Avise o Claude.")

    def ponte_higgsfield(self):
        try:
            d = self.le_json()
            pid = str(d.get("projeto", ""))
            if not CEN.MOTOR_CODEX.bilhete_ok(self.central, pid, self.headers.get("X-Painel-Ponte") or ""):
                return self.erro(401, "Bilhete da ponte inválido.")
            args = d.get("args") if isinstance(d.get("args"), list) else []
            return self.json(200, CEN.MOTOR_CODEX.ponte_higgsfield(self.central, pid, args, d.get("cwd")))
        except (Invalido, ValueError) as e:
            return self.erro(400, str(e))
        except Exception:
            return self.erro(500, "Algo deu errado na ponte do Higgsfield.")

    # ---------- versão 2: central de trabalho (projetos, chat, o Claude no painel) ----------
    def v2_get(self, caminho, q):
        C = self.central
        if caminho == "/api/v2/estado":
            tem, logado = C.login()
            motores = [m for m, ok in (("claude", C.claude), ("codex", C.codex)) if ok]
            return self.json(200, {"projetos": C.projetos(), "claude": {"tem": tem, "logado": logado, "motor": C.motor(), "motores": motores, "modelos": C.modelos()},
                                   "simultaneos": CEN.SIMULTANEOS,
                                   "autonomo": C.autonomo(), "autonomo_pode": os.name != "nt",
                                   "catalogo": CATALOGO, "instalados": self.proj.instalados(), "pasta": os.path.basename(self.proj.dir),
                                   "atualizacao": ATUALIZACAO.estado()})
        m = re.fullmatch(r"/api/v2/projeto/([a-z0-9-]{1,40})", caminho)
        if m:
            pid = m.group(1); c = C.caminho(pid)
            if not c:
                return self.erro(404, "Projeto não encontrado.")
            desde = int((q.get("desde") or ["0"])[0] or 0)
            v = C.vivos.get(pid)
            return self.json(200, {"projeto": CEN.ler(os.path.join(c, "projeto.json"), {}), "marca": CEN.ler(os.path.join(c, "marca.json"), {}),
                                   "chat": C.chat(pid, desde), "etapas": C.etapas(pid), "pedidos": C.pedidos_abertos(pid),
                                   "estado": C.estado_de(pid), "desde": v["desde"] if v else None,
                                   "modelo": (v or {}).get("modelo")})
        if caminho == "/api/v2/entregas":
            ps = C.projetos()
            return self.json(200, {"entregas": C.entregas(), "numeros": {"projetos": len(ps), "andando": sum(1 for p in ps if p["estado"] in ("trabalhando", "permissao", "na fila"))}})
        m = re.fullmatch(r"/arquivos/entrega-capa/([a-z0-9-]{1,40})/(.+)", caminho)
        if m:
            capa = C.capa_entrega(m.group(1), m.group(2))
            if not capa:
                return self.erro(404, "Sem capa.")
            return self.manda_arquivo(capa, {".jpg"}, livre=True)
        if caminho == "/api/v2/modelos":
            ms = []
            for m in CEN.lista_modelos(self.proj.dir):
                ms.append({k: m.get(k) for k in ("id", "nome", "categoria", "estilo", "nicho", "descricao", "duracao", "url", "origem", "tem_codigo", "tem_previa", "tem_exemplo", "exemplo_url", "formato")})
            cats = CEN.categorias_modelo(ms)  # uma por estilo, só as que têm modelo, na ordem Cortes, Motion, 3D...
            ordem = {k: i for i, k in enumerate(cats)}
            ms.sort(key=lambda m: (ordem.get(m.get("categoria"), len(ordem)), m.get("origem") != "meu", str(m.get("nome") or "").lower()))
            return self.json(200, {"modelos": ms, "categorias": cats})
        m = re.fullmatch(r"/arquivos/modelo/(painel|meu)/([a-z0-9-]{1,40})/(capa\.jpg|previa\.mp4|exemplo\.mp4)", caminho)
        if m:
            base = os.path.join(RAIZ, "modelos") if m.group(1) == "painel" else os.path.join(self.proj.dir, "modelos")
            alvo = os.path.realpath(os.path.join(base, m.group(2), m.group(3)))
            if not alvo.startswith(os.path.realpath(base) + os.sep):
                return self.erro(403, "Fora da pasta de modelos.")
            return self.manda_arquivo(alvo, {".jpg", ".mp4"}, livre=True)
        m = re.fullmatch(r"/arquivos/projeto/([a-z0-9-]{1,40})/(.+)", caminho)
        if m:
            c = C.caminho(m.group(1))
            if not c:
                return self.erro(404, "Projeto não encontrado.")
            alvo = os.path.realpath(os.path.join(c, m.group(2)))
            if not alvo.startswith(os.path.realpath(c) + os.sep):
                return self.erro(403, "Fora da pasta do projeto.")
            return self.manda_arquivo(alvo, EXT_VIDEO | EXT_LOGO | {".gif", ".webm", ".ogg", ".pdf", ".txt", ".md"}, livre=True)  # .txt: o roteiro que a pessoa colou (Ler)
        return self.erro(404, "Não encontrado.")

    def v2_post(self, caminho, q):
        C = self.central
        if caminho == "/api/v2/aprovar":  # chamado pelo aprovador.py (segura a resposta até a pessoa decidir)
            d = self.le_json()
            return self.json(200, C.aprovar(str(d.get("projeto", "")), str(d.get("ferramenta", "")), d.get("entrada") or {}))
        if caminho == "/api/v2/projetos":
            pid = C.novo_projeto(self.le_json().get("nome"))
            return self.json(200, {"id": pid})
        if caminho == "/api/v2/atualizar":  # só com a chave do navegador (so_claude é falso aqui): troca as skills do produto e religa o painel
            if any(p["estado"] != "parado" for p in C.projetos()):
                raise Invalido("Espere os projetos terminarem antes de atualizar.")
            if not ATUALIZACAO.estado().get("nova"):
                raise Invalido("O painel já está na versão mais nova.")
            erro = ATUALIZACAO.inicia(self.porta)
            if erro:
                raise Invalido(erro)
            return self.json(200, {"ok": True, "atualizacao": ATUALIZACAO.estado()})
        if caminho == "/api/v2/autonomo":  # só a chave do navegador: o Claude do painel não liga a própria autonomia
            return self.json(200, {"autonomo": C.define_autonomo(bool(self.le_json().get("ligar")))})
        if caminho == "/api/v2/conectar":
            C.conectar(); return self.json(200, {"ok": True})
        if caminho == "/api/v2/modelo":  # só a chave do navegador: o modelo de IA do assistente ativo
            return self.json(200, {"modelos": C.define_modelo(str(self.le_json().get("modelo", "")))})
        if caminho == "/api/v2/motor":  # só a chave do navegador: quem responde no chat (Claude ou ChatGPT/Codex)
            return self.json(200, {"motor": C.define_motor(str(self.le_json().get("motor", "")))})
        m = re.fullmatch(r"/api/v2/permissao/(\d+)", caminho)
        if m:
            C.decide(int(m.group(1)), str(self.le_json().get("decisao", "")))
            return self.json(200, {"ok": True})
        m = re.fullmatch(r"/api/v2/projeto/([a-z0-9-]{1,40})/(mensagem|parar|anexo|audio|marca|logo|capa-ref|capa-ref-tirar|pergunta|excluir|mostrar)", caminho)
        if not m:
            return self.erro(404, "Não encontrado.")
        pid, acao = m.groups(); c = C.caminho(pid)
        if not c:
            raise Invalido("Projeto não encontrado.")
        if acao == "mensagem":
            d = self.le_json(); C.envia(pid, d.get("texto"), d.get("anexos"), d.get("modelo"), d.get("pronto"))
            return self.json(200, {"ok": True})
        if acao == "pergunta":
            d = self.le_json()
            ops = [str(o)[:80] for o in (d.get("opcoes") or []) if str(o).strip()][:5]
            if not str(d.get("texto") or "").strip() or len(ops) < 2:
                raise Invalido("Pergunta sem texto ou com menos de 2 opções.")
            C.anota(pid, quem="pergunta", texto=str(d["texto"])[:600], opcoes=ops)
            return self.json(200, {"ok": True})
        if acao == "parar":
            C.para(pid); return self.json(200, {"ok": True})
        if acao == "excluir":
            C.exclui(pid); return self.json(200, {"ok": True})
        if acao == "mostrar":
            d = self.le_json(); C.mostra_na_pasta(pid, d.get("arquivo")); return self.json(200, {"ok": True})
        if acao in ("anexo", "audio"):
            if acao == "audio":
                nome = f"audio-{time.strftime('%Y%m%d-%H%M%S')}.webm"
            else:
                nome = nome_seguro((q.get("nome") or [""])[0], CEN.EXT_ANEXO)
                if not nome:
                    raise Invalido("Esse tipo de arquivo não é aceito aqui.")
            pasta = os.path.join(c, "anexos"); os.makedirs(pasta, exist_ok=True)
            nome = nome_livre(pasta, nome)
            self.recebe_corpo(os.path.join(pasta, nome), CEN.MAX_ANEXO if acao == "anexo" else 50 * 1024 ** 2)
            rel = "anexos/" + nome
            if acao == "anexo":
                return self.json(200, {"arquivo": rel})
            texto = self.transcreve(os.path.join(c, rel))
            return self.json(200, {"arquivo": rel, "texto": texto})
        if acao == "marca":
            with CEN.TRAVA:
                mm = valida_marca(self.le_json(), CEN.ler(os.path.join(c, "marca.json"), {}))
                CEN.grava(os.path.join(c, "marca.json"), mm)
            return self.json(200, {"marca": mm})
        if acao == "capa-ref":
            # "Capas que deram certo" (até 3): o modelo de arte das capas que o Claude faz (skill capas-com-ia)
            nome = nome_seguro((q.get("nome") or [""])[0], EXT_LOGO)
            if not nome:
                raise Invalido("A capa precisa ser PNG, JPG ou WEBP.")
            with CEN.TRAVA:
                mm = CEN.ler(os.path.join(c, "marca.json"), {})
                atuais = [x for x in (mm.get("capas") or []) if isinstance(x, str) and os.path.isfile(os.path.join(c, x))]
            if len(atuais) >= 3:
                raise Invalido("Já tem 3 capas. Tire uma antes de pôr outra.")
            rel = f"marca/capas/capa-{time.strftime('%Y%m%d-%H%M%S')}-{os.urandom(3).hex()}{os.path.splitext(nome)[1].lower()}"
            os.makedirs(os.path.join(c, "marca", "capas"), exist_ok=True)
            self.recebe_corpo(os.path.join(c, rel), MAX_LOGO * 2)
            with CEN.TRAVA:
                mm = CEN.ler(os.path.join(c, "marca.json"), {})
                antes = [x for x in (mm.get("capas") or []) if isinstance(x, str) and x != rel and os.path.isfile(os.path.join(c, x))]
                mm["capas"] = list(dict.fromkeys(antes))[:2] + [rel]
                CEN.grava(os.path.join(c, "marca.json"), mm)
            return self.json(200, {"marca": mm})
        if acao == "capa-ref-tirar":
            alvo = str(self.le_json().get("arquivo") or "")
            with CEN.TRAVA:
                mm = CEN.ler(os.path.join(c, "marca.json"), {})
                capas = [x for x in (mm.get("capas") or []) if isinstance(x, str)]
                if alvo not in capas or not re.fullmatch(r"marca/capas/[A-Za-z0-9._-]{1,80}", alvo):
                    raise Invalido("Essa capa não está na marca.")
                mm["capas"] = [x for x in capas if x != alvo]
                CEN.grava(os.path.join(c, "marca.json"), mm)
            origem = os.path.join(c, alvo)
            if os.path.isfile(origem):  # nada some de verdade: vai para marca/capas/tiradas/
                os.makedirs(os.path.join(c, "marca", "capas", "tiradas"), exist_ok=True)
                os.replace(origem, os.path.join(c, "marca", "capas", "tiradas", os.path.basename(alvo)))
            return self.json(200, {"marca": mm})
        if acao == "logo":
            nome = nome_seguro((q.get("nome") or [""])[0], EXT_LOGO)
            if not nome:
                raise Invalido("O logo precisa ser PNG, JPG ou WEBP.")
            ext = os.path.splitext(nome)[1]
            os.makedirs(os.path.join(c, "marca"), exist_ok=True)
            self.recebe_corpo(os.path.join(c, "marca", "logo" + ext), MAX_LOGO)
            with CEN.TRAVA:
                mm = CEN.ler(os.path.join(c, "marca.json"), {}); mm["logo"] = "marca/logo" + ext
                CEN.grava(os.path.join(c, "marca.json"), mm)
            return self.json(200, {"marca": mm})

    def transcreve(self, arquivo):
        vpy = os.path.join(self.proj.dir, "_ferramentas", ".venv", "bin", "python")
        if not os.path.exists(vpy):
            vpy = os.path.join(self.proj.dir, "_ferramentas", ".venv", "Scripts", "python.exe")
        if not os.path.exists(vpy):
            raise Invalido("Para transcrever áudio, instale um estilo primeiro (ele traz o Whisper).")
        r = subprocess.run([vpy, os.path.join(RAIZ, "scripts", "transcrever_audio.py"), arquivo], capture_output=True, text=True, timeout=600)
        if r.returncode != 0:
            raise Invalido("Não consegui transcrever o áudio. Tente de novo ou escreva.")
        return r.stdout.strip()

    def recebe_corpo(self, destino, limite):
        n = int(self.headers.get("Content-Length") or 0)
        if n <= 0:
            raise Invalido("Arquivo vazio.")
        if n > limite:
            raise Invalido(f"Arquivo grande demais (máximo {limite // 1024 ** 2} MB).")
        tmp = destino + ".parcial"
        try:
            with open(tmp, "wb") as f:
                falta = n
                while falta > 0:
                    bloco = self.rfile.read(min(1024 * 1024, falta))
                    if not bloco:
                        raise Invalido("O envio parou no meio. Tente de novo.")
                    f.write(bloco)
                    falta -= len(bloco)
            os.replace(tmp, destino)
        finally:
            if os.path.exists(tmp):
                os.remove(tmp)

    def recebe_logo(self, q):
        nome = nome_seguro((q.get("nome") or [""])[0], EXT_LOGO)
        if not nome:
            raise Invalido("O logo precisa ser PNG, JPG ou WEBP.")
        os.makedirs(self.proj.marca_dir, exist_ok=True)
        ext = os.path.splitext(nome)[1]
        destino = os.path.join(self.proj.marca_dir, "logo" + ext)
        self.recebe_corpo(destino, MAX_LOGO)
        with trava(self.proj):
            for e in EXT_LOGO:  # tira logo antigo de outro formato
                velho = os.path.join(self.proj.marca_dir, "logo" + e)
                if e != ext and os.path.exists(velho):
                    os.remove(velho)
            m = self.proj.ler_marca()
            m["logo"] = "marca/logo" + ext
            grava_json(self.proj.marca_json, m)
        self.json(200, {"marca": m})

    def recebe_arquivo(self, q):
        nome = nome_seguro((q.get("nome") or [""])[0], EXT_VIDEO)
        if not nome:
            raise Invalido("Mande um vídeo ou áudio (MP4, MOV, MKV, WEBM, MP3, WAV ou M4A).")
        os.makedirs(self.proj.bruto, exist_ok=True)
        with trava(self.proj):
            nome = nome_livre(self.proj.bruto, nome)
            open(os.path.join(self.proj.bruto, nome + ".reservado"), "w").close()
        try:
            self.recebe_corpo(os.path.join(self.proj.bruto, nome), MAX_ARQUIVO)
        finally:
            os.remove(os.path.join(self.proj.bruto, nome + ".reservado"))
        self.json(200, {"nome": nome, "arquivos": self.proj.arquivos()})

    def instala(self):
        eid = str(self.le_json().get("estilo") or "")
        est = ESTILOS.get(eid)
        if not est or est.get("em_breve") or not est.get("instalar"):
            raise Invalido("Esse estilo não está disponível para instalar.")
        if eid in self.proj.instalados():
            raise Invalido("Esse estilo já está instalado.")
        if not INSTALACAO.inicia(eid, self.proj):
            raise Invalido("Já tem uma instalação em andamento. Espere terminar.")
        self.json(200, {"instalacao": INSTALACAO.resumo()})

    def cria_pedido(self):
        dados = self.le_json()
        with trava(self.proj):
            est, campos, modo, voz, marca = valida_pedido(dados, self.proj)
            p = {"id": self.proj.proximo_id(), "criado": agora(), "atualizado": agora(), "estado": "novo",
                 "pendente": "pedido", "estilo": est["id"], "nome_estilo": est["nome"], "skill": est["skill"],
                 "modo_skill": est.get("modo_skill"), "campos": campos, "modo": modo, "voz": voz, "marca": marca,
                 "progresso": 0, "mensagem": "Esperando o Claude pegar o pedido.", "resultado": None, "ajustes": []}
            self.proj.salvar_pedido(p)
        self.json(200, {"pedido": p})

    def responde_pedido(self, pid, acao):
        with trava(self.proj):
            p = self.proj.pedido(pid)
            if not p:
                raise Invalido("Pedido não encontrado.")
            if p.get("estado") != "pronto":
                raise Invalido("Esse pedido ainda não tem vídeo para aprovar.")
            if acao == "ajuste":
                texto = str(self.le_json().get("texto") or "").strip()
                if not texto or len(texto) > 2000:
                    raise Invalido("Escreva o ajuste (até 2000 letras).")
                p["ajustes"].append({"quando": agora(), "texto": texto})
                p.update(estado="ajuste", pendente="ajuste", progresso=0, mensagem="Ajuste mandado. Esperando o Claude.")
            else:
                p.update(estado="aprovado", pendente="aprovado", mensagem="Aprovado.")
            p["atualizado"] = agora()
            self.proj.salvar_pedido(p)
        self.json(200, {"pedido": p})


def servidor_vivo(proj):
    try:
        s = json.load(open(proj.servidor_json, encoding="utf-8"))
        cn = os.path.join(proj.oculto, "chave-navegador")
        if os.path.exists(cn):
            s["token"] = open(cn, encoding="utf-8").read().strip()
        s.setdefault("token", "")
        req = urllib.request.Request(f"http://127.0.0.1:{s['porta']}/api/estado", headers={"X-Painel-Chave": s["token"]})
        urllib.request.urlopen(req, timeout=2).read()
        return s
    except Exception:
        return None


def url_de(s):
    return f"http://127.0.0.1:{s['porta']}/#t={s['token']}"


def chave_guardada(proj):
    """A chave do navegador fica guardada em .painel/chave-navegador (0600, fora do alcance do Claude do painel) e vale entre
    religadas: fechar e abrir o painel não invalida a aba aberta. Para trocar, `painel.py chave-nova <pasta>`."""
    c = os.path.join(proj.oculto, "chave-navegador")
    try:
        t = open(c, encoding="utf-8").read().strip()
        return t if re.fullmatch(r"[A-Za-z0-9_-]{24,64}", t) else ""
    except OSError:
        return ""


def chave_mantida(proj):
    """Depois de uma atualização, o painel religa com a mesma chave do navegador (arquivo .manter, que o instalador copia
    segundos antes de fechar o painel antigo), para a aba aberta continuar valendo. O arquivo vale 5 minutos e é apagado aqui."""
    c = os.path.join(proj.oculto, "chave-navegador.manter")
    try:
        if time.time() - os.path.getmtime(c) < 300:
            t = open(c, encoding="utf-8").read().strip()
            if re.fullmatch(r"[A-Za-z0-9_-]{24,64}", t):
                return t
    except OSError:
        pass
    finally:
        _apaga(c)
    return ""


# ---------- comandos ----------
def cmd_abrir(a):
    """Liga o painel como um processo independente (continua ligado mesmo se o Claude ou o terminal fechar) e abre o navegador."""
    proj = Projeto(a.projeto)
    s = servidor_vivo(proj)
    if not s:
        os.makedirs(proj.oculto, exist_ok=True)
        log = open(os.path.join(proj.oculto, "servidor.log"), "a")
        cmd = [sys.executable, os.path.abspath(__file__), "servir", proj.dir, "--porta", str(a.porta)]
        extra = {"creationflags": 0x00000008 | 0x00000200} if os.name == "nt" else {"start_new_session": True}
        subprocess.Popen(cmd, stdin=subprocess.DEVNULL, stdout=log, stderr=subprocess.STDOUT, cwd=proj.dir, **extra)
        for _ in range(60):
            time.sleep(0.25)
            s = servidor_vivo(proj)
            if s:
                break
        if not s:
            sys.exit("O painel não ligou. Veja o registro em " + os.path.join(proj.oculto, "servidor.log"))
        print("Painel ligado:", url_de(s), flush=True)
    else:
        print("O painel já está ligado:", url_de(s), flush=True)
    if not a.sem_navegador:
        webbrowser.open(url_de(s))


def cmd_servir(a):
    proj = Projeto(a.projeto)
    if servidor_vivo(proj):
        return print("O painel já está ligado.")
    os.makedirs(proj.oculto, exist_ok=True)
    Painel.proj, Painel.token, Painel.token_claude = proj, chave_mantida(proj) or chave_guardada(proj) or secrets.token_urlsafe(24), secrets.token_urlsafe(24)
    srv = ThreadingHTTPServer(("127.0.0.1", a.porta), Painel)
    srv.daemon_threads = True
    Painel.porta = srv.server_address[1]
    Painel.central = CEN.Central(proj.dir, lambda: Painel.porta, lambda: Painel.token_claude)
    ATUALIZACAO.liga(proj)
    s = {"porta": Painel.porta, "token_claude": Painel.token_claude, "pid": os.getpid(), "inicio": agora()}
    grava_json(proj.servidor_json, s)
    os.chmod(proj.servidor_json, 0o600)
    chave_nav = os.path.join(proj.oculto, "chave-navegador")
    with open(chave_nav, "w", encoding="utf-8") as f:
        f.write(Painel.token)
    os.chmod(chave_nav, 0o600)
    s["token"] = Painel.token

    def vigia():
        while True:
            time.sleep(60)
            if time.time() - Painel.ultimo[0] > OCIOSO:
                srv.shutdown()
                return
    threading.Thread(target=vigia, daemon=True).start()
    print("Painel ligado:", url_de(s), flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        srv.server_close()
        try:
            os.remove(proj.servidor_json)  # a chave do navegador fica: a aba aberta continua valendo na próxima religada
        except OSError:
            pass
        print("Painel desligado.")


def _apaga(c):
    try:
        os.remove(c)
    except OSError:
        pass


def cmd_esperar(a):
    proj = Projeto(a.projeto)
    fim = time.time() + a.max
    sinal = os.path.join(proj.oculto, "esperando")  # o painel mostra "o Claude está ouvindo" enquanto este arquivo é atualizado
    os.makedirs(proj.oculto, exist_ok=True)
    while time.time() < fim:
        open(sinal, "w").write(agora())
        with trava(proj):
            for p in proj.lista_pedidos():
                if p.get("pendente"):
                    evento = p.pop("pendente")
                    if evento in ("pedido", "ajuste"):
                        p.update(estado="recebido", mensagem="O Claude recebeu e já vai começar.", atualizado=agora())
                    proj.salvar_pedido(p)
                    print(json.dumps({"evento": evento, "pedido": p}, ensure_ascii=False, indent=2))
                    _apaga(sinal)
                    return
        time.sleep(1.5)
    _apaga(sinal)
    print("Ninguém mandou nada pelo painel ainda. Rode o esperar de novo quando a pessoa disser que vai mandar.")
    sys.exit(3)


def cmd_status(a):
    proj = Projeto(a.projeto)
    with trava(proj):
        p = proj.pedido(a.id) or sys.exit("Pedido não encontrado.")
        p.update(estado="trabalhando", mensagem=a.mensagem[:300], atualizado=agora())
        if a.pct is not None:
            p["progresso"] = max(0, min(100, int(a.pct)))
        proj.salvar_pedido(p)
    print("ok")


def cmd_pronto(a):
    proj = Projeto(a.projeto)
    arq = os.path.realpath(a.arquivo)
    if not os.path.isfile(arq) or not proj.dentro(arq) or os.path.splitext(arq)[1].lower() not in EXT_VIDEO:
        sys.exit("O vídeo precisa existir e estar dentro da pasta do projeto.")
    with trava(proj):
        p = proj.pedido(a.id) or sys.exit("Pedido não encontrado.")
        p.update(estado="pronto", progresso=100, resultado=os.path.relpath(arq, proj.dir),
                 mensagem=(a.msg or "Pronto! Assista e aprove ou peça um ajuste.")[:300], atualizado=agora())
        proj.salvar_pedido(p)
    print("ok: o vídeo apareceu no painel. Agora rode o esperar para saber se a pessoa aprovou ou pediu ajuste.")


def cmd_chave_nova(a):
    """Troca a chave do navegador (as abas abertas param de valer) e religa o painel com a chave nova."""
    proj = Projeto(a.projeto)
    if servidor_vivo(proj):
        cmd_fechar(a)
        time.sleep(1)
    _apaga(os.path.join(proj.oculto, "chave-navegador"))
    _apaga(os.path.join(proj.oculto, "chave-navegador.manter"))
    a.sem_navegador = getattr(a, "sem_navegador", False); a.porta = getattr(a, "porta", 0)
    cmd_abrir(a)


def cmd_link(a):
    s = servidor_vivo(Projeto(a.projeto))
    print(url_de(s) if s else "O painel está desligado. Rode: python painel.py abrir <projeto>")


def cmd_fechar(a):
    proj = Projeto(a.projeto)
    s = servidor_vivo(proj)
    if not s:
        # o servidor não responde pela chave, mas o processo pode estar vivo (versão antiga ou chave perdida): encerra pelo PID
        velho = json.load(open(proj.servidor_json, encoding="utf-8")) if os.path.exists(proj.servidor_json) else {}
        pid = velho.get("pid")
        if pid and pid != os.getpid():
            try:
                os.kill(int(pid), 15)
                time.sleep(1)
                if os.path.exists(proj.servidor_json):
                    os.remove(proj.servidor_json)
                return print("Painel desligado (processo antigo encerrado).")
            except (OSError, ValueError):
                pass
        return print("O painel já estava desligado.")
    req = urllib.request.Request(f"http://127.0.0.1:{s['porta']}/api/fechar", data=b"{}", method="POST",
                                 headers={"X-Painel-Chave": s["token"], "Content-Type": "application/json"})
    urllib.request.urlopen(req, timeout=5).read()
    print("Painel desligado.")


def main():
    ap = argparse.ArgumentParser(description="Painel Edição com IA")
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("abrir"); s.add_argument("projeto"); s.add_argument("--sem-navegador", action="store_true")
    s.add_argument("--porta", type=int, default=0); s.set_defaults(f=cmd_abrir)
    s = sub.add_parser("servir"); s.add_argument("projeto"); s.add_argument("--porta", type=int, default=0)
    s.add_argument("--sem-navegador", action="store_true"); s.set_defaults(f=cmd_servir)
    s = sub.add_parser("esperar"); s.add_argument("projeto"); s.add_argument("--max", type=int, default=3600); s.set_defaults(f=cmd_esperar)
    s = sub.add_parser("status"); s.add_argument("projeto"); s.add_argument("id"); s.add_argument("mensagem")
    s.add_argument("--pct", type=int); s.set_defaults(f=cmd_status)
    s = sub.add_parser("pronto"); s.add_argument("projeto"); s.add_argument("id"); s.add_argument("arquivo")
    s.add_argument("--msg"); s.set_defaults(f=cmd_pronto)
    s = sub.add_parser("link"); s.add_argument("projeto"); s.set_defaults(f=cmd_link)
    s = sub.add_parser("fechar"); s.add_argument("projeto"); s.set_defaults(f=cmd_fechar)
    s = sub.add_parser("chave-nova"); s.add_argument("projeto"); s.add_argument("--porta", type=int, default=0); s.set_defaults(f=cmd_chave_nova)
    s = sub.add_parser("pergunta"); s.add_argument("projeto"); s.add_argument("texto"); s.add_argument("opcoes", nargs="+")
    s.set_defaults(f=lambda a: (CEN.faz_pergunta(a.projeto, a.texto, a.opcoes), print("ok: a pergunta está no painel; pare e espere a resposta")))
    s = sub.add_parser("etapa"); s.add_argument("projeto"); s.add_argument("etapa"); s.add_argument("estado"); s.add_argument("mensagem")
    s.add_argument("--arquivo"); s.add_argument("--da-pessoa", action="store_true", help="roteiro/storyboard que a pessoa trouxe pronto: fica feito, sem aprovação")
    s.set_defaults(f=lambda a: (CEN.marca_etapa(a.projeto, a.etapa, a.estado, a.mensagem, a.arquivo, a.da_pessoa), print("ok")))
    a = ap.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
