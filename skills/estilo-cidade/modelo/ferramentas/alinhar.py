# Alinha o texto do roteiro com os tempos da narração (Whisper) e grava cena/tempos.js.
#
# Uso: PY ferramentas/alinhar.py <pasta do projeto> [audio] [transcricao]
#   audio e transcricao ficam em assets/audio/ (padrão: narracao.mp3 e transcript.json)
#
# O roteiro vem de <pasta>/roteiro.txt: um bloco por linha, # é comentário,
# {mostra|fala} = o que aparece na legenda | o que a voz diz.
import json, os, re, subprocess, sys, difflib

PASTA = sys.argv[1]
AUDIO = os.path.join(PASTA, "assets/audio", sys.argv[2] if len(sys.argv) > 2 else "narracao.wav")
TRANS = os.path.join(PASTA, "assets/audio", sys.argv[3] if len(sys.argv) > 3 else "transcript.json")
BLOCOS = [l.strip() for l in open(os.path.join(PASTA, "roteiro.txt"), encoding="utf-8") if l.strip() and not l.lstrip().startswith("#")]


# ---------- números por extenso (o Whisper às vezes escreve "1958" em vez das palavras) ----------
UNI = "zero um dois três quatro cinco seis sete oito nove dez onze doze treze quatorze quinze dezesseis dezessete dezoito dezenove".split()
DEZ = "_ _ vinte trinta quarenta cinquenta sessenta setenta oitenta noventa".split()
CEN = "_ cento duzentos trezentos quatrocentos quinhentos seiscentos setecentos oitocentos novecentos".split()


def ate_mil(n):
    if n == 100:
        return ["cem"]
    p = []
    c, r = divmod(n, 100)
    if c:
        p.append(CEN[c])
    if r:
        if p:
            p.append("e")
        if r < 20:
            p.append(UNI[r])
        else:
            d, u = divmod(r, 10)
            p.append(DEZ[d])
            if u:
                p += ["e", UNI[u]]
    return p


def por_extenso(n):
    if n < 1000:
        return ate_mil(n) if n else ["zero"]
    p = []
    mi, resto = divmod(n, 1_000_000)
    mil, r = divmod(resto, 1000)
    if mi:
        p += (["um", "milhão"] if mi == 1 else ate_mil(mi) + ["milhões"])
    if mil:
        if p and not r and (mil < 100 or mil % 100 == 0):
            p.append("e")
        p += (["mil"] if mil == 1 else ate_mil(mil) + ["mil"])
    if r:
        if p and (r < 100 or r % 100 == 0):
            p.append("e")
        p += ate_mil(r)
    return p


def norm(p):
    return re.sub(r"[^\wà-ú-]", "", p.lower())


# 1) roteiro -> grupos da legenda e lista das palavras faladas
grupos, falado = [], []
for b, texto in enumerate(BLOCOS):
    inicio_de_frase = True
    for parte in re.findall(r"\{[^}]+\}[.,:;!?]*|[^\s]+", texto):
        fim_de_frase = bool(re.search(r"[.!?:]$", parte))
        if parte.startswith("{"):
            m = re.match(r"\{([^|]+)\|([^}]+)\}", parte)
            mostra, fala = m.group(1), m.group(2).split()
        else:
            limpa = re.sub(r"[.,:;!?\"“”]", "", parte)
            if not limpa:
                continue
            mostra, fala = limpa, [limpa]
        idx = []
        for f in fala:
            idx.append(len(falado))
            falado.append({"txt": norm(f), "bloco": b})
        # minúscula como na fala; maiúscula só em nome (palavra com maiúscula no meio da frase)
        if not (mostra[0].isdigit() or (mostra[0].isupper() and not inicio_de_frase)):
            mostra = mostra.lower()
        grupos.append({"mostra": mostra, "idx": idx, "bloco": b})
        inicio_de_frase = fim_de_frase

# 2) Whisper -> lista plana (números viram palavras; o tempo é dividido entre elas)
ouvido = []
for x in json.load(open(TRANS, encoding="utf-8")):
    t = norm(x["text"])
    digitos = t.replace(".", "")
    partes = por_extenso(int(digitos)) if digitos.isdigit() else [t]
    d = (x["end"] - x["start"]) / len(partes)
    for i, p in enumerate(partes):
        ouvido.append({"txt": p, "ini": x["start"] + i * d, "fim": x["start"] + (i + 1) * d})

# 3) alinhar (palavras iguais copiam o tempo; trechos diferentes dividem o tempo)
sm = difflib.SequenceMatcher(a=[f["txt"] for f in falado], b=[o["txt"] for o in ouvido], autojunk=False)
for op, a0, a1, b0, b1 in sm.get_opcodes():
    if op == "equal":
        for k in range(a1 - a0):
            falado[a0 + k]["ini"], falado[a0 + k]["fim"] = ouvido[b0 + k]["ini"], ouvido[b0 + k]["fim"]
    elif op == "replace":
        ini, fim = ouvido[b0]["ini"], ouvido[b1 - 1]["fim"]
        n = a1 - a0
        for k in range(n):
            falado[a0 + k]["ini"] = ini + (fim - ini) * k / n
            falado[a0 + k]["fim"] = ini + (fim - ini) * (k + 1) / n
for i, f in enumerate(falado):  # palavras do roteiro que a voz pulou: entre as vizinhas
    if "ini" not in f:
        ant = next((falado[j]["fim"] for j in range(i - 1, -1, -1) if "fim" in falado[j]), 0)
        prox = next((falado[j]["ini"] for j in range(i + 1, len(falado)) if "ini" in falado[j]), ant + 0.3)
        f["ini"], f["fim"] = ant, max(ant + 0.05, prox)

# 4) o começo de cada bloco encosta no fim do silêncio mais perto (corte no lugar certo)
saida = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", AUDIO, "-af", "silencedetect=noise=-38dB:d=0.12", "-f", "null", "-"], capture_output=True, text=True).stderr
fins_silencio = [float(v) for v in re.findall(r"silence_end: ([\d.]+)", saida)]
dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", AUDIO]).decode())

blocos = []
for b in range(len(BLOCOS)):
    ini = next(f["ini"] for f in falado if f["bloco"] == b)
    perto = [s for s in fins_silencio if abs(s - ini) < 0.35]
    if perto:
        ini = min(perto, key=lambda s: abs(s - ini))
    blocos.append({"n": b + 1, "ini": round(max(0.0, ini - 0.03), 3)})
blocos[0]["ini"] = 0.0
for i, bl in enumerate(blocos):
    bl["fim"] = blocos[i + 1]["ini"] if i + 1 < len(blocos) else round(dur, 3)

legenda = []
for g in grupos:
    legenda.append({"t0": round(falado[g["idx"][0]]["ini"], 3), "t1": round(falado[g["idx"][-1]]["fim"], 3), "txt": g["mostra"], "bloco": g["bloco"] + 1})
for i in range(len(legenda) - 1):  # a palavra fica até a próxima aparecer (no máximo 0,6 s depois)
    legenda[i]["t1"] = round(min(legenda[i + 1]["t0"], legenda[i]["t1"] + 0.6), 3)

json.dump({"duracao": dur, "blocos": blocos, "legenda": legenda, "frases": BLOCOS}, open(os.path.join(PASTA, "assets/audio/palavras.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
with open(os.path.join(PASTA, "cena/tempos.js"), "w", encoding="utf-8") as f:
    f.write("// Gerado por ferramentas/alinhar.py a partir da narração. Não editar à mão.\n")
    f.write("export const DURACAO = %.3f;\n" % dur)
    f.write("export const BLOCOS = %s;\n" % json.dumps(blocos, ensure_ascii=False))
    f.write("export const LEGENDA = %s;\n" % json.dumps(legenda, ensure_ascii=False))

# a duração do vídeo na página acompanha a da narração
pagina = os.path.join(PASTA, "index.html")
if os.path.exists(pagina):
    h = open(pagina, encoding="utf-8").read()
    h = re.sub(r'data-duration="[\d.]+"', f'data-duration="{dur:.2f}"', h)
    h = re.sub(r"tl\.to\(\{\}, \{ duration: [\d.]+ \}", "tl.to({}, { duration: %.2f }" % dur, h)
    open(pagina, "w", encoding="utf-8").write(h)

iguais = sum(b1 - b0 for op, a0, a1, b0, b1 in sm.get_opcodes() if op == "equal")
print(f"duração {dur:.2f} s | {len(blocos)} blocos | {len(legenda)} legendas | {iguais} de {len(falado)} palavras bateram exatas com o Whisper")
for bl in blocos:
    print(f"bloco {bl['n']:2d}: {bl['ini']:6.2f} -> {bl['fim']:6.2f}  {BLOCOS[bl['n'] - 1][:60]}")
