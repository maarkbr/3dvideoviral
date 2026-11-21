"""Áudio da fala para o Adobe Podcast (Enhance Speech), que não tem API, e de volta para a edição.

uso:
  audio_adobe.py exportar PASTA_TRABALHO saida.wav
      → a fala da gravação JÁ CORTADA (os trechos do edl.json, na ordem), mono 48 kHz 16 bits.
  audio_adobe.py voltar PASTA_TRABALHO melhorado.wav saida_bruto.wav [--extra 2 | --alvo LUFS | --igual voz_intro.wav] [--limitar] [--sem-ganho]
      → remonta um áudio do tamanho do BRUTO: nos trechos do edl entra o áudio melhorado; fora deles fica o áudio
        original (as sobras dos cortes continuam no lugar, sem melhoria, para quem alongar um corte no Premiere).
        Sai estéreo (mono duplicado), como o bruto. Depois: premiere_xml.py ... --audio saida_bruto.wav
  audio_adobe.py igualar original.wav melhorado.wav saida.wav [--extra 2] [--estereo]
      → a voz da intro: o melhorado no volume do original (+ extra), para trocar o assets/voz.wav.
  audio_adobe.py conferir PASTA_TRABALHO melhorado_bruto.wav
      → acha onde o Adobe mexeu em algo que não era a voz: "som inventado" (o original quase mudo e o melhorado alto —
        ele amplifica o pouco que vazou do som do computador e "melhora" em fala estragada), "som apagado" e "alterado".
        Em 07/11 foram as demos tocando na tela (o OBS quase não gravou o som interno: −61 dB).
  audio_adobe.py tela melhorado_bruto.wav saida.wav --demo fonte.mp4@INICIO_NO_BRUTO[@FIM_NO_BRUTO] ... [--alvo -23.7]
      → põe o som LIMPO do vídeo que tocou na tela (o arquivo original) no lugar, sincronizado: INICIO = segundo do bruto
        em que a fonte está no 0 (ache pela imagem: quadros da área do vídeo × quadros da fonte; ou pelo áudio se vazou).
        No volume da voz (--alvo, LUFS mono); onde ele fala por cima (original com voz) a voz melhorada continua.
        No Premiere: botão direito no áudio no painel Projeto → Substituir gravação → o arquivo novo (os cortes ficam).

VOLUME: o Enhance Speech devolve a voz mais baixa e mais comprimida (intro do vídeo 3D: −0,4 LU no integrado, picos
−2,3 dB) e o Lucas sente a voz "baixando". Por isso `voltar` e `igualar` medem o LUFS do original e do melhorado,
igualam e somam --extra dB (padrão +2: a voz fica um pouco à frente dos efeitos e da trilha, pedido de 07/11).
O ganho para antes de o pico passar de −1 dBFS (sem limitador, para não mexer no alinhamento) e avisa.
--igual assets/voz.wav (a voz da intro já igualada) põe a gravação no MESMO nível da intro, para a voz não
pular de volume na emenda intro → aula no Premiere; --alvo dá o LUFS (mono) direto.

Por que exportar CORTADO: o plano grátis do Adobe Podcast aceita até 30 min e 500 MB por arquivo (1 h por dia,
podcast.adobe.com/en/plans); o bruto de uma aula passa disso, a fala editada não.
Intro: mande a voz da intro já pronta (assets/voz.wav da pasta HyperFrames, mono) e, quando voltar, troque a voz e
refaça só a mixagem (o vídeo e os efeitos renderizados não mudam).
O Enhance Speech devolve o mesmo comprimento; se vier diferente em mais de 0,1 s, o script avisa e para.
"""
import json, os, subprocess, sys, wave

import numpy as np

SR = 48000


def ler(caminho, canais=1):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", caminho, "-map", "0:a:0", "-ac", str(canais), "-ar", str(SR),
                          "-f", "s16le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.int16).reshape(-1, canais).copy()


def gravar(caminho, x):
    x = x if x.ndim == 2 else x[:, None]
    with wave.open(caminho, "wb") as w:
        w.setnchannels(x.shape[1]); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(np.ascontiguousarray(x).tobytes())


def lufs(x):
    """LUFS integrado de um array int16 (n, canais) a 48 kHz."""
    r = subprocess.run(["ffmpeg", "-hide_banner", "-f", "s16le", "-ar", str(SR), "-ac", str(x.shape[1]), "-i", "-",
                        "-af", "ebur128", "-f", "null", "-"], input=np.ascontiguousarray(x).tobytes(), capture_output=True)
    linhas = [l for l in r.stderr.decode().splitlines() if l.strip().startswith("I:")]
    return float(linhas[-1].split()[1])


def defasagem(a, b):
    """Atraso (amostras) de b em relação a a, por correlação em 5 janelas de 2 s."""
    a, b = a.astype(np.float64).ravel(), b.astype(np.float64).ravel()
    L, out = len(a), []
    for f in (0.15, 0.3, 0.5, 0.7, 0.85):
        c = int(L * f)
        w = a[c:c + 2 * SR]
        if np.dot(w, w) < 1e3:
            continue
        lags = range(-960, 961, 4)
        out.append(max(lags, key=lambda l: np.dot(w, b[c + l:c + l + len(w)]) if c + l >= 0 else -1e30))
    return out


def ganhar(m, alvo_lufs, extra, limitar=False):
    """Ganho para o melhorado chegar no LUFS alvo + extra. Sem --limitar, o ganho para no pico de −1 dBFS; com ele,
    passa disso e um limitador (alimiter com compensação de atraso, conferida por correlação) segura os picos."""
    atual = lufs(m)
    g = alvo_lufs + extra - atual
    pico = 20 * np.log10(max(1, int(np.abs(m.astype(np.int32)).max())) / 32768)
    teto = -1.0 - pico
    if g > teto and limitar:
        r = subprocess.run(["ffmpeg", "-v", "error", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af",
                            f"volume={g:.2f}dB,alimiter=limit={10 ** (-1.5 / 20):.4f}:attack=5:release=60:level=0:latency=1",
                            "-f", "s16le", "-"], input=np.ascontiguousarray(m[:, 0]).tobytes(), capture_output=True, check=True)
        y = np.frombuffer(r.stdout, np.int16)[:len(m)]
        y = np.concatenate([y, np.zeros(len(m) - len(y), np.int16)])[:, None]
        lag = defasagem(m, y)
        if any(lag):
            sys.exit(f"o limitador deslocou o áudio ({lag} amostras): rode sem --limitar")
        print(f"volume: alvo {alvo_lufs + extra:.1f} LUFS · melhorado {atual:.1f} · ganho {g:+.1f} dB com limitador "
              f"(picos acima de −1,5 dBFS seguram até {g - teto:.1f} dB) · alinhamento conferido · final {lufs(y):.1f} LUFS")
        return y
    if g > teto:
        print(f"aviso: ganho {g:+.1f} dB limitado a {teto:+.1f} dB pelo pico (−1 dBFS); use --limitar para ir até o alvo")
        g = teto
    y = np.clip(np.round(m.astype(np.float64) * 10 ** (g / 20)), -32768, 32767).astype(np.int16)
    print(f"volume: alvo {alvo_lufs + extra:.1f} LUFS · melhorado {atual:.1f} · ganho {g:+.1f} dB (extra {extra:+.1f})")
    return y


def opt(k, d=None):
    return a[a.index(k) + 1] if k in a else d


def trechos(wd):
    E = json.load(open(os.path.join(wd, "edl.json")))
    spf = SR / E["fps"]
    # mesmo critério do premiere_xml.py: início no src0, comprimento pela linha do tempo
    return E["video"], [(int(round(c["src0"] * spf)), int(round((c["tl1"] - c["tl0"]) * spf))) for c in E["clips"]]


def achar_wav(p):
    """O Adobe devolve o arquivo com outro nome ("<nome>-esv2-70p-bg-20p-music-m.wav"). Aceita a pasta melhorado/
    ou um caminho que não existe: usa o .wav mais novo da pasta (de preferência o que começa com o mesmo nome)."""
    if os.path.isfile(p):
        return p
    pasta = p if os.path.isdir(p) else os.path.dirname(p)
    if not os.path.isdir(pasta):
        return p
    base = os.path.splitext(os.path.basename(p))[0] if not os.path.isdir(p) else ""
    ws = [os.path.join(pasta, f) for f in os.listdir(pasta) if f.lower().endswith(".wav")]
    mesmos = [w for w in ws if base and os.path.basename(w).startswith(base)]
    ws = sorted(mesmos or ws, key=os.path.getmtime)
    if not ws:
        return p
    print(f"melhorado: {os.path.basename(ws[-1])}", file=sys.stderr)
    return ws[-1]


a = sys.argv[1:]
if len(a) >= 3 and a[0] in ("voltar", "igualar", "conferir"):
    a[2] = achar_wav(a[2])
if len(a) >= 2 and a[0] == "tela":
    a[1] = achar_wav(a[1])
if len(a) < 3 or a[0] not in ("exportar", "voltar", "igualar", "conferir", "tela"):
    sys.exit(__doc__)
modo = a[0]
extra = float(opt("--extra", 2.0))

if modo == "igualar":
    o, m = ler(a[1]), ler(a[2])
    if abs(len(o) - len(m)) / SR > 0.1:
        sys.exit(f"comprimentos diferentes: original {len(o) / SR:.2f} s, melhorado {len(m) / SR:.2f} s")
    y = ganhar(m, lufs(o), extra)[:, 0]
    gravar(a[3], np.stack([y, y], 1) if "--estereo" in a else y)
    print(a[3])
    sys.exit(0)

if modo == "tela":
    base = ler(a[1], 2).astype(np.float64)
    voz = base.copy()
    alvo = float(opt("--alvo", -23.7))
    ramp = lambda n: np.linspace(0, 1, n)  # noqa: E731
    for i, x in enumerate(a):
        if x != "--demo":
            continue
        partes = a[i + 1].split("@")
        fonte, ini = partes[0], float(partes[1])
        src = ler(fonte, 1)[:, 0].astype(np.float64)
        fim = float(partes[2]) if len(partes) > 2 else ini + len(src) / SR
        s0, s1 = int(max(0, ini) * SR), int(min(fim, ini + len(src) / SR) * SR)
        seg = src[s0 - int(ini * SR): s1 - int(ini * SR)]
        g = 10 ** ((alvo - lufs(seg.astype(np.int16)[:, None])) / 20)
        seg = seg * g
        pk = np.abs(seg).max() / 32768
        if pk > 0.89:
            seg *= 0.89 / pk
        # a voz dele por cima: onde o ORIGINAL tem voz (janelas de 50 ms acima de −48 dB), a voz melhorada continua
        orig = ler(opt("--bruto"), 1)[s0:s1, 0].astype(np.float64) if opt("--bruto") else np.zeros(s1 - s0)
        J = int(0.05 * SR)
        nj = (s1 - s0) // J + 1
        db = np.array([10 * np.log10(np.mean((orig[k * J:(k + 1) * J] / 32768) ** 2) + 1e-12) for k in range(nj)])
        porta = np.repeat((db > -48).astype(float), J)[:s1 - s0]
        porta = np.convolve(porta, np.ones(J) / J, mode="same")
        novo = seg[:, None] + voz[s0:s1] * porta[:, None]
        f = int(0.05 * SR)  # 50 ms de transição nas pontas
        w = np.ones(s1 - s0); w[:f] = ramp(f); w[-f:] = ramp(f)[::-1]
        base[s0:s1] = base[s0:s1] * (1 - w[:, None]) + novo * w[:, None]
        print(f"{os.path.basename(fonte)}: bruto {ini:.2f}–{fim:.2f}s · ganho {20 * np.log10(g):+.1f} dB · "
              f"voz por cima em {porta.mean() * 100:.0f}% do trecho")
    gravar(a[2], np.clip(np.round(base), -32768, 32767).astype(np.int16))
    print(a[2])
    sys.exit(0)

wd = a[1]
bruto, T = trechos(wd)

if modo == "conferir":
    o = ler(bruto, 1)[:, 0].astype(np.float32) / 32768
    m = ler(a[2], 1)[:, 0].astype(np.float32) / 32768
    n = min(len(o), len(m)) // (SR // 2)
    db = lambda x: 10 * np.log10((x[:n * (SR // 2)].reshape(n, -1) ** 2).mean(1) + 1e-10)  # noqa: E731
    od, md = db(o), db(m)
    manteve = np.zeros(n, bool)
    for s, k in T:
        manteve[s // (SR // 2): (s + k) // (SR // 2) + 1] = True
    inv = manteve & (od < -52) & (md > -42)
    apag = manteve & (od > -45) & (md - od < -6)
    for nome, mk in (("som inventado", inv), ("som apagado", apag)):
        i = 0
        while i < n:
            if mk[i]:
                j = i
                while j < n and (mk[j] or (j + 1 < n and mk[j + 1]) or (j + 2 < n and mk[j + 2])):
                    j += 1
                if j - i >= 2:
                    print(f"{nome}: bruto {i / 2:.1f}–{j / 2:.1f}s ({(j - i) / 2:.1f} s) · original {np.median(od[i:j]):.0f} dB · melhorado {np.median(md[i:j]):.0f} dB")
                i = j
            else:
                i += 1
    sys.exit(0)

if modo == "exportar":
    x = ler(bruto)[:, 0]
    partes = [x[s:s + n] for s, n in T]
    out = np.concatenate(partes)
    gravar(a[2], out)
    print(f"{len(T)} trechos · {len(out) / SR / 60:.1f} min · {a[2]}")
else:
    melhorado, saida = a[2], a[3]
    m = ler(melhorado)[:, 0]
    esperado = sum(n for _, n in T)
    dif = (len(m) - esperado) / SR
    if abs(dif) > 0.1:
        sys.exit(f"o áudio melhorado tem {len(m) / SR:.2f} s e a fala cortada {esperado / SR:.2f} s ({dif:+.2f} s): "
                 "não é o mesmo arquivo ou o Adobe mudou o comprimento")
    if len(m) < esperado:
        m = np.concatenate([m, np.zeros(esperado - len(m), np.int16)])
    x = ler(bruto)[:, 0]
    if "--sem-ganho" not in a:
        if opt("--igual"):
            alvo, ex = lufs(ler(opt("--igual"))), 0.0
        elif opt("--alvo"):
            alvo, ex = float(opt("--alvo")), 0.0
        else:
            alvo, ex = lufs(np.concatenate([x[s:s + n] for s, n in T])[:, None]), extra
        m = ganhar(m[:, None], alvo, ex, limitar="--limitar" in a)[:, 0]
    pos = 0
    for s, n in T:
        x[s:s + n] = m[pos:pos + n]
        pos += n
    gravar(saida, np.stack([x, x], 1))
    print(f"{len(T)} trechos trocados pelo melhorado · {len(x) / SR / 60:.1f} min (tamanho do bruto) · {saida}")
