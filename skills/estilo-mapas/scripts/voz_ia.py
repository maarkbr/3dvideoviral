"""Gera as falas da narração com voz de IA, uma por arquivo: voz/b1.txt → voz/f1.wav, e assim por diante.
uso (na pasta do projeto):
  python voz_ia.py --motor voicestudio --voz <profile_id> 1 2 3 4 5 6     (VoiceStudio aberto; motor VoxCPM2, licença comercial)
  python voz_ia.py --motor elevenlabs --voz <voice_id> 1 2 3 4 5 6        (precisa de ELEVENLABS_API_KEY no ambiente)
  python voz_ia.py --motor higgsfield --voz Marcus 1 2 3 4 5 6            (Higgsfield pelo MCP, o conector do app do Claude; Eleven v4,
        ~0,5 crédito por fala e por tentativa). Em dois passos, porque quem gera é o Claude, pela ferramenta do MCP:
        1) sem --resultados: grava voz/higgsfield-pedido.json com o pedido de preço (generate_audio com get_cost) e os lotes
           para o generate_audio_batch (até 12 falas por lote). --voz aceita Marcus, Andre ou um voice_id do list_voices
           (--tipo element para uma voz da própria pessoa).
        2) depois do jobs_wait, grave {"<fala>": "<result_url>"} em voz/higgsfield-resultados.json e rode de novo com
           --resultados voz/higgsfield-resultados.json: baixa, confere e diz quais falas REFAZER (sai com código 3).
  python voz_ia.py --motor higgsfield-cli --voz Marcus 1 2 3 4 5 6        (o jeito antigo: CLI higgsfield instalado e logado)
Se existir voz/bN.tts.txt, ele é o texto falado (pronúncia); voz/bN.txt continua sendo o da legenda.
Põe "Bom." na frente e corta depois (alguns modelos engolem a primeira palavra). Depois transcreve a fala cortada inteira
(Whisper medium) e só aceita se ela começar na palavra certa e bater pelo menos 90% com o texto; senão tenta até 3 vezes
e fica com a melhor, avisando para conferir."""
import argparse, difflib, http.client, ipaddress, json, os, re, shutil, subprocess, sys, time, unicodedata, urllib.error, urllib.request
from urllib.parse import urlparse

ap = argparse.ArgumentParser(); ap.add_argument("falas", nargs="+", type=int)
ap.add_argument("--avaliar", action="store_true", help="só confere os b{i}.wav que já existem (não gera nem gasta crédito)")
ap.add_argument("--motor", choices=["voicestudio", "elevenlabs", "higgsfield", "higgsfield-cli"], required=True); ap.add_argument("--voz", required=True)
ap.add_argument("--tipo", choices=["preset", "element"], default="preset", help="Higgsfield: voz pronta (preset) ou uma voz da pessoa (element)")
ap.add_argument("--resultados", help="Higgsfield: JSON {fala: result_url} com o que o jobs_wait devolveu")
ap.add_argument("--pasta", default="voz"); ap.add_argument("--modelo", default="voxcpm2")
ap.add_argument("--whisper", default="medium", help="modelo do Whisper que confere a fala (small é mais rápido, medium erra menos)")
a = ap.parse_args()
if a.resultados:
    a.resultados = os.path.abspath(a.resultados)
os.chdir(a.pasta)


def textos(i):
    txt = open(f"b{i}.txt").read().strip()
    return txt, (open(f"b{i}.tts.txt").read().strip() if os.path.exists(f"b{i}.tts.txt") else txt)


# ---------- Higgsfield pelo MCP, passo 1: o pedido (o Claude manda para o generate_audio_batch) ----------
HF_VOZES = {"marcus": "6f98d3dd-324f-4845-8c28-c1d1647a06cd", "andre": "f1e8226e-2248-4d5f-b43c-0a79e9949dbf"}  # presets testados pelo Lucas
UUID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)
if a.motor == "higgsfield" and not a.resultados:
    voz = HF_VOZES.get(a.voz.strip().lower(), a.voz.strip())
    if not UUID.match(voz):
        sys.exit(f"Não conheço a voz '{a.voz}'. Ache o voice_id com a ferramenta list_voices do Higgsfield e passe o id em --voz.")
    item = lambda t: {"model": "elevenlabs_v4", "prompt": t, "dialogue": [{"text": t, "voice_type": a.tipo, "voice_id": voz}]}
    falas = [(i, "Bom. " + textos(i)[1]) for i in a.falas]
    tudo = " ".join(t for _, t in falas)
    pedido = {"preco": {**item(tudo[:9900]), "get_cost": True},
              "lotes": [[{"index": i, "params": item(t)} for i, t in falas[k:k + 12]] for k in range(0, len(falas), 12)]}
    json.dump(pedido, open("higgsfield-pedido.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"Pedido de {len(falas)} falas ({len(tudo)} letras) em {os.path.abspath('higgsfield-pedido.json')}.\n"
          "1. Preço (não gasta): generate_audio com params = o \"preco\" do arquivo. Diga o valor à pessoa antes de gerar.\n"
          "2. Gerar: generate_audio_batch com requests = cada lote de \"lotes\" (até 12 por vez); depois jobs_wait com os job_id.\n"
          "3. Grave {\"<fala>\": \"<result_url>\"} em voz/higgsfield-resultados.json e rode este script de novo com\n"
          "   --resultados voz/higgsfield-resultados.json e os mesmos números de fala.")
    sys.exit(0)

from faster_whisper import WhisperModel
import numpy as np
W = WhisperModel(a.whisper, compute_type="int8")
norm = lambda s: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode())

UN = "zero um dois três quatro cinco seis sete oito nove dez onze doze treze quatorze quinze dezesseis dezessete dezoito dezenove".split()
DZ = "_ _ vinte trinta quarenta cinquenta sessenta setenta oitenta noventa".split()
CT = "_ cento duzentos trezentos quatrocentos quinhentos seiscentos setecentos oitocentos novecentos".split()
def extenso(n):  # o Whisper escreve números com dígitos; o roteiro, por extenso
    if n < 20: return UN[n]
    if n < 100: return DZ[n // 10] + ("" if n % 10 == 0 else " e " + UN[n % 10])
    if n == 100: return "cem"
    if n < 1000: return CT[n // 100] + ("" if n % 100 == 0 else " e " + extenso(n % 100))
    if n < 1000000:
        m, r = divmod(n, 1000); txt = ("mil" if m == 1 else extenso(m) + " mil")
        return txt if r == 0 else txt + (" e " if r < 100 or r % 100 == 0 else " ") + extenso(r)
    return str(n)
def palavras(txt):
    txt = re.sub(r"(\d)\.(\d{3})", r"\1\2", txt)
    txt = re.sub(r"\d+", lambda m: " " + extenso(int(m.group())) + " ", txt)
    return [w for w in (norm(x) for x in txt.split()) if w]
parecido = lambda a, b: difflib.SequenceMatcher(None, palavras(a), palavras(b)).ratio()
ALIAS = {"pra": "para", "pro": "para", "ta": "esta", "tao": "tao", "ce": "voce"}  # o Whisper escreve "para" e "1" onde o roteiro tem "pra" e "um"
def n2(w):
    x = palavras(w); x = x[0] if x else norm(w)
    return ALIAS.get(x, x)
def ouve(arq):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", arq, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True, check=True).stdout
    segs, _ = W.transcribe(np.frombuffer(raw, np.int16).astype(np.float32) / 32768, language="pt", word_timestamps=True)
    return [w for s in segs for w in s.words]


def avalia(i, fala, tent):
    """voz/b{i}.wav (a fala com "Bom." na frente) → corta o "Bom." e dá a nota. Devolve (nota, arquivo, ouvido) ou None."""
    alvo = [n2(w) for w in fala.split()[:2]]
    ws = ouve(f"b{i}.wav")
    k = next((j for j in range(min(5, len(ws) - 1)) if n2(ws[j].word) == alvo[0] and (len(alvo) < 2 or n2(ws[j + 1].word) == alvo[1])), None)
    if k is None:
        print(f"fala {i} tentativa {tent} falhou (não achei o começo) | {' '.join(w.word.strip() for w in ws)}"); return None
    tmp = f"f{i}.t{tent}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{max(0, ws[k].start - .06):.3f}", "-i", f"b{i}.wav", tmp], check=True)
    ws2 = ouve(tmp); ouvido = " ".join(w.word.strip() for w in ws2)
    comeca = bool(ws2) and n2(ws2[0].word) == alvo[0]
    nota = parecido(ouvido, fala) - (0 if comeca else .2)
    print(f"fala {i} tentativa {tent}: {nota:.2f}{'' if comeca else ' (sobrou som antes da 1ª palavra)'} | {ouvido}")
    return nota, tmp, ouvido


def fecha(i, melhor):
    if melhor:
        shutil.move(melhor[1], f"f{i}.wav")
        if melhor[0] < .9: print(f"ATENÇÃO fala {i}: nenhuma tentativa bateu 90% com o roteiro ({melhor[0]:.2f}). Escute f{i}.wav antes de seguir.")
        else: print(f"fala {i} ok")
    else: print(f"ATENÇÃO fala {i}: não saiu nenhuma versão aproveitável.")


# ---------- Higgsfield pelo MCP, passo 2: baixa o que o jobs_wait devolveu e confere ----------
def endereco_ok(url):
    u = urlparse(url); host = (u.hostname or "").lower()
    if u.scheme != "https" or not host or host == "localhost" or host.endswith((".local", ".localhost", ".internal")): return False
    try: return ipaddress.ip_address(host).is_global
    except ValueError: return "." in host
def baixa(url, saida):
    """Baixa o áudio inteiro (confere com o Content-Length; tenta 3 vezes) e converte para wav 44,1 kHz mono."""
    if not endereco_ok(url): raise RuntimeError("o link não é um https da internet; use o result_url do jobs_wait")
    motivo = ""
    for _ in range(3):
        try:
            # User-Agent próprio: o padrão do Python é barrado pela proteção do Higgsfield
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "edicao-com-ia/1.0"}), timeout=180) as r:
                esperado, partes = int(r.headers.get("Content-Length") or 0), []
                while True:
                    bloco = r.read(1024 * 1024)
                    if not bloco: break
                    partes.append(bloco)
                    if sum(map(len, partes)) > 80 * 1024 ** 2: raise RuntimeError("arquivo grande demais para uma fala")
            dados = b"".join(partes)
            if esperado and len(dados) != esperado: motivo = f"veio {len(dados)} de {esperado} bytes"; continue
            open(saida + ".baixado", "wb").write(dados)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", saida + ".baixado", "-ar", "44100", "-ac", "1", saida], check=True)
            os.remove(saida + ".baixado"); return
        except (urllib.error.URLError, OSError, http.client.HTTPException) as e:
            motivo = str(getattr(e, "reason", e))
    raise RuntimeError(f"não consegui baixar ({motivo})")

if a.motor == "higgsfield":
    res = {str(k): v for k, v in json.load(open(a.resultados, encoding="utf-8")).items()}
    est_arq = "higgsfield-tentativas.json"
    est = json.load(open(est_arq)) if os.path.exists(est_arq) else {}
    refazer = []
    for i in a.falas:
        st = est.get(str(i)) or {"n": 0, "nota": None, "arquivo": None}
        url = res.get(str(i))
        if not url:
            print(f"fala {i}: não tem result_url no {os.path.basename(a.resultados)}"); refazer.append(i); continue
        st["n"] += 1
        try:
            baixa(url, f"b{i}.wav")
            r = avalia(i, textos(i)[1], st["n"])
        except RuntimeError as e:
            print(f"fala {i} tentativa {st['n']}: {e}"); r = None
        if r:
            if st["nota"] is None or r[0] > st["nota"]:
                if st["arquivo"] and os.path.exists(st["arquivo"]): os.remove(st["arquivo"])
                st.update(nota=r[0], arquivo=r[1])
            else: os.remove(r[1])
        if (st["nota"] is not None and st["nota"] >= .9) or st["n"] >= 3:
            fecha(i, (st["nota"], st["arquivo"], "") if st["arquivo"] else None); est.pop(str(i), None)
        else:
            est[str(i)] = st; refazer.append(i)
    json.dump(est, open(est_arq, "w"), indent=1)
    if refazer:
        print("REFAZER: " + " ".join(map(str, refazer)))
        print("Gere de novo só essas falas: rode este script sem --resultados com esses números (sai o pedido delas), "
              "mande no generate_audio_batch, espere com jobs_wait e rode com --resultados de novo. Cada tentativa gasta créditos.")
        sys.exit(3)
    print("Todas as falas prontas.")
    sys.exit(0)


# ---------- os outros motores geram aqui mesmo ----------
HF_VOZ = None
def hf_voz():
    global HF_VOZ
    if HF_VOZ is None:
        v = json.loads(subprocess.run(["higgsfield", "voices", "list", "--json"], capture_output=True, text=True, check=True).stdout)
        it = v if isinstance(v, list) else v.get("items") or v.get("voices") or []
        ach = [x for x in it if a.voz in (x["id"], x["name"])]
        if not ach: raise SystemExit(f"voz '{a.voz}' não existe no Higgsfield (veja: higgsfield voices list)")
        HF_VOZ = ach[0]
    return HF_VOZ
def gera_hf(texto, saida):
    v = hf_voz()
    url = []
    for tent in range(3):  # a fila do Higgsfield às vezes demora: espera e tenta de novo (só cobra quando gera)
        r = subprocess.run(["higgsfield", "generate", "create", "elevenlabs_v4", "--dialogue",
                            json.dumps([{"text": texto, "voice_id": v["id"], "voice_type": v.get("voice_type", "preset")}]),
                            "--wait", "--wait-timeout", "10m", "--json"], capture_output=True, text=True)
        url = re.findall(r'"result_url":\s*"(https://[^"]+)"', r.stdout + r.stderr)  # não confundir com o "source" (amostra da voz)
        if url: break
        print(f"  Higgsfield sem resposta (tentativa {tent + 1}): {(r.stdout + r.stderr)[-160:].strip()}", flush=True); time.sleep(30)
    if not url: raise RuntimeError("Higgsfield não devolveu o áudio depois de 3 tentativas")
    tmp = saida + ".baixado"
    subprocess.run(["curl", "-sL", "-A", "Mozilla/5.0", "-o", tmp, url[-1]], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-ar", "44100", "-ac", "1", saida], check=True); os.remove(tmp)
def gera(texto, saida):
    if a.motor == "higgsfield-cli": return gera_hf(texto, saida)
    if a.motor == "voicestudio":
        if a.modelo == "omnivoice": raise SystemExit("OmniVoice é só não comercial: use voxcpm2.")
        body = json.dumps({"model": a.modelo, "input": texto, "voice": a.voz, "response_format": "wav", "language": "Portuguese"}).encode()
        req = urllib.request.Request("http://127.0.0.1:3900/v1/audio/speech", data=body, headers={"Content-Type": "application/json"})
    else:
        key = os.environ.get("ELEVENLABS_API_KEY") or exit("Defina ELEVENLABS_API_KEY no ambiente.")
        body = json.dumps({"text": texto, "model_id": "eleven_multilingual_v2"}).encode()
        req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{a.voz}?output_format=pcm_44100", data=body,
                                     headers={"Content-Type": "application/json", "xi-api-key": key})
    for espera in range(12):  # VoiceStudio ocupado (429/503): espera e tenta de novo
        try:
            dados = urllib.request.urlopen(req, timeout=1800).read(); break
        except urllib.error.HTTPError as e:
            if e.code not in (429, 503) or espera == 11: raise
            msg = e.read().decode(errors="ignore"); m = re.search(r"in about (\d+)s", msg)
            s = min(int(m.group(1)) if m else 60, 240); print(f"  VoiceStudio ocupado, tentando de novo em {s}s…"); time.sleep(s)
    if a.motor == "elevenlabs":  # pcm cru → wav
        open(saida + ".pcm", "wb").write(dados)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", "44100", "-ac", "1", "-i", saida + ".pcm", saida], check=True); os.remove(saida + ".pcm")
    else:
        open(saida, "wb").write(dados)

for i in a.falas:
    txt, fala = textos(i)
    melhor = None  # (nota, arquivo, texto ouvido)
    for tent in range(1, 4):
        if a.avaliar and os.path.exists(f"b{i}.wav") and tent == 1: pass  # --avaliar: confere o b{i}.wav que já existe, sem gerar de novo
        elif a.avaliar: break
        else: gera("Bom. " + fala, f"b{i}.wav")
        r = avalia(i, fala, tent)
        if r is None: continue
        if melhor is None or r[0] > melhor[0]:
            if melhor: os.remove(melhor[1])
            melhor = r
        else: os.remove(r[1])
        if r[0] >= .9: break
    fecha(i, melhor)
