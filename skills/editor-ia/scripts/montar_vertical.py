"""Monta a edição vertical 9:16 (um projeto HyperFrames completo) de um corte de podcast a partir de um plano.json.

uso: montar_vertical.py <plano.json> [--saida <pasta>] [--sem-som] [--sem-carve] [--sem-check] [--fotos auto|t1,t2,...]

O plano diz O QUE aparece e QUANDO (cenas, textos, ícones, palavras de destaque); este script resolve o COMO:
  - tempos por palavra: "~frase" (início da frase falada), "~frase>" (fim), "~frase#2" (2ª vez), "~frase+0.2", "@58.3" (tempo do corte);
    dentro de params, números são segundos DESDE O INÍCIO DA CENA;
  - câmera: rosto (enquadramento.json) por trecho, modo dividido sob os cards, punch-in alternado nas emendas, push final;
  - entradas/saídas dos cards (desce, wipe entre cards seguidos, corte sob tela cheia) e a faixa da legenda acompanhando;
  - legendas palavra a palavra (legendas.py), SFX automáticos por tipo de cena + extras, trilha com drops, carve sob a voz;
  - index.html, compositions/<cena>.html, BRIEF.md, STORYBOARD.md, frame.md, package.json; depois lint + check do HyperFrames.
Formato completo do plano e catálogo de cenas: references/edicao-vertical.md e references/catalogo-de-cenas.md.
"""
import datetime
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.dirname(HERE)
TPL = os.path.join(SKILL, "template")
HF = os.path.join(HERE, "hf.mjs")
sys.path.insert(0, HERE)
import audio_core as A  # noqa: E402
import legendas as LEG  # noqa: E402
import sons as SONS  # noqa: E402

arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d  # noqa: E731
OUT_W, OUT_H = 1080, 1920

# tipo de cena → layout (dividido = card na metade de cima + falante embaixo; cheio = cobre a tela; sobre = por cima do vídeo)
CENAS = {
    "gancho": {"layout": "cheio", "legenda": False}, "card-icone": {"layout": "dividido"}, "troca": {"layout": "dividido"},
    "adesivos": {"layout": "sobre"}, "chat": {"layout": "dividido"}, "glitch": {"layout": "cheio", "legenda": False, "drop": True},
    "cartaz": {"layout": "cheio"}, "busca": {"layout": "dividido"}, "versus": {"layout": "cheio"}, "degraus": {"layout": "dividido"},
    "grade": {"layout": "dividido"}, "contador": {"layout": "cheio"}, "alerta": {"layout": "dividido"}, "rota": {"layout": "cheio"},
    "baloes": {"layout": "dividido"}, "palavra": {"layout": "sobre", "legenda": False}, "cartao": {"layout": "param"},
    "faixa": {"layout": "sobre"}, "imagem": {"layout": "param"}, "colagem": {"layout": "sobre"},
}
RESERVADOS = {"main", "root", "cam", "aroll", "sfx", "music", "legendas", "captions"}
FONTES = """@font-face { font-family: "LT Anton"; font-weight: 400; font-style: normal; src: url("lib/fonts/Anton-Regular.woff2") format("woff2"); }
        @font-face { font-family: "LT Garamond"; font-weight: 400 800; font-style: normal; src: url("lib/fonts/EBGaramond-VF.woff2") format("woff2"); }
        @font-face { font-family: "LT Garamond"; font-weight: 400 800; font-style: italic; src: url("lib/fonts/EBGaramond-Italic-VF.woff2") format("woff2"); }
        @font-face { font-family: "LT Montserrat"; font-weight: 100 900; font-style: normal; src: url("lib/fonts/Montserrat-VF.woff2") format("woff2"); }
        @font-face { font-family: "LT Montserrat"; font-weight: 100 900; font-style: italic; src: url("lib/fonts/Montserrat-Italic-VF.woff2") format("woff2"); }"""
PARADAS = set("""entendeu realmente simplesmente exatamente basicamente qualquer ninguem alguem sempre depois quando aquele aquela aquilo
estava estavam tinha tenho falou falei assim entao agora muito outro outra sobre dessa desse nessa nesse pessoal coisa coisas porque
tambem enquanto naquele naquela daquele daquela comigo contigo ninguém alguém também então""".split())
avisos = []


def aviso(msg):
    avisos.append(msg)
    print("  ! " + msg)


def norm(s):
    s = unicodedata.normalize("NFKD", str(s).lower())
    return "".join(c for c in s if c.isalnum())


def run(cmd, cwd=None, timeout=1800, quiet=False):
    exe = cmd[0]
    if os.name == "nt" and exe in ("npm", "npx"):
        exe += ".cmd"
    r = subprocess.run([exe] + cmd[1:], cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout,
                       shell=os.name == "nt" and exe.endswith(".cmd"))
    if not quiet and r.returncode != 0:
        print((r.stdout or "")[-1500:] + (r.stderr or "")[-1500:])
    return r


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate:format=duration",
                          "-of", "json", path], capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    n, m = d["streams"][0]["r_frame_rate"].split("/")
    return d["streams"][0]["width"], d["streams"][0]["height"], float(n) / float(m), float(d["format"]["duration"])


# ---------------------------------------------------------------- tempos por palavra
class Fala:
    def __init__(self, words):
        self.w = [(norm(x["text"]), float(x["start"]), float(x["end"])) for x in words]
        self.w = [x for x in self.w if x[0]]

    def acha(self, frase, depois=0.0, n=1):
        toks = [norm(t) for t in frase.split() if norm(t)]
        if not toks:
            raise ValueError(f"frase vazia: '{frase}'")

        def ok(i, exato):
            for k, tk in enumerate(toks):
                if i + k >= len(self.w):
                    return False
                w = self.w[i + k][0]
                if exato and w != tk:
                    return False
                if not exato and not (w.startswith(tk) or (len(w) >= 4 and tk.startswith(w))):
                    return False
            return True

        for exato in (True, False):
            hits = 0
            for i in range(len(self.w)):
                if self.w[i][1] < depois - 0.3:
                    continue
                if ok(i, exato):
                    hits += 1
                    if hits == n:
                        return self.w[i][1], self.w[i + len(toks) - 1][2]
        raise ValueError(f"não achei a fala '{frase}' depois de {depois:.2f}s — confira a grafia na transcrição do corte")


REF = re.compile(r"^~(?P<frase>.+?)(?:#(?P<n>\d+))?(?P<fim>>)?(?P<off>[+-]\d+(?:\.\d+)?)?$")


def tempo(v, fala, depois):
    """→ (segundos, é_global). Números são locais; '@x' e '~frase' são tempos do corte (globais)."""
    if isinstance(v, (int, float)):
        return float(v), False
    s = str(v).strip()
    if s.startswith("@"):
        return float(s[1:]), True
    m = REF.match(s)
    if m:
        a, b = fala.acha(m["frase"], depois, int(m["n"] or 1))
        return (b if m["fim"] else a) + float(m["off"] or 0), True
    return float(s), False


def eh_tempo(k):
    return k in ("em", "t", "ate", "saida", "batidas") or k.endswith("_em")


def resolve_params(obj, fala, a, dur, cid):
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if eh_tempo(k) and v is not None:
                vals = v if isinstance(v, list) else [v]
                res = []
                for x in vals:
                    t, glob = tempo(x, fala, a)
                    loc = t - a if glob else t
                    if loc < -0.05 or loc > dur + 0.05:
                        aviso(f"{cid}: '{k}' = {x} cai fora da cena (local {loc:.2f}s de {dur:.2f}s)")
                    res.append(round(min(max(loc, 0.0), dur), 3))
                out[k] = res if isinstance(v, list) else res[0]
            else:
                out[k] = resolve_params(v, fala, a, dur, cid)
        return out
    if isinstance(obj, list):
        return [resolve_params(x, fala, a, dur, cid) for x in obj]
    return obj


# ---------------------------------------------------------------- câmera
class Camera:
    """pose do vídeo-fonte (W x H) dentro da tela 1080x1920 (regra viewport-change: T = -offset * S)."""

    def __init__(self, W, H, cfg):
        self.W, self.H = W, H
        self.base = max(OUT_W / W, OUT_H / H)
        self.split = max(OUT_W / W, (OUT_H / 2) / H, self.base * 0.703)
        self.zoom_full = [1.0, cfg.get("punch", 1.10), cfg.get("push", 1.17)]
        self.zoom_split = [1.0, cfg.get("punch_dividido", 1.08), 1.12]
        self.face_y = cfg.get("rosto_y", 800)

    def pose(self, modo, zoom, fx, fy):
        W, H = self.W, self.H
        cx, cy = fx * W, fy * H
        if modo == "split":
            S = self.split * self.zoom_split[zoom]
            x = min(0, max(OUT_W - W * S, OUT_W / 2 - cx * S))
            y = min(OUT_H / 2, max(OUT_H - H * S, 1440 - cy * S))
        else:
            S = self.base * self.zoom_full[zoom]
            x = min(0, max(OUT_W - W * S, OUT_W / 2 - cx * S))
            y = min(0, max(OUT_H - H * S, self.face_y - cy * S))
        return round(S, 5), round(x, 2), round(y, 2)


def cobertura(t, covers, antes=0.0, depois=0.05):
    for c in covers:
        if c[0] - antes <= t <= c[1] + depois:
            return c
    return None


def planeja_layout(cenas, covers):
    """agrupa cards divididos seguidos em 'corridas'; define entrada/saída automáticas; devolve as corridas."""
    divs = [s for s in cenas if s["layout"] == "dividido"]
    runs = []
    for s in divs:
        if runs and s["a"] <= runs[-1]["b"] + 0.15:
            runs[-1]["cenas"].append(s)
            runs[-1]["b"] = max(runs[-1]["b"], s["a"] + s["dur"])
        else:
            runs.append({"a": s["a"], "b": s["a"] + s["dur"], "cenas": [s]})
    for r in runs:
        r["cov_in"] = cobertura(r["a"], covers)
        r["cov_out"] = cobertura(r["b"], covers, antes=0.05, depois=0.0)
        if r["cov_in"] and r["cov_out"] is r["cov_in"]:
            aviso(f"corrida de cards {r['a']:.2f}–{r['b']:.2f}s fica inteira por baixo de uma cena de tela cheia")
        wipe = ["wipe-esq", "wipe-dir"]
        for k, s in enumerate(r["cenas"]):
            P = s["P"]
            if "entrada" not in s["P0"]:
                P["entrada"] = ("corte" if r["cov_in"] else "desce") if k == 0 else wipe[(k - 1) % 2]
            last = k == len(r["cenas"]) - 1
            if "saida" not in s["P0"]:
                P["saida"] = round(max(0.3, (r["b"] - 0.3) - s["a"]), 3) if (last and not r["cov_out"]) else None
            if not last:  # o card de baixo fica até o wipe do próximo terminar
                nxt = r["cenas"][k + 1]
                need = nxt["a"] + 0.3 - s["a"]
                if s["dur"] < need:
                    s["dur"] = round(need, 3)
    return runs


def chaves_camera(runs, covers, joins, trechos, cfg, DUR, fala):
    """lista de (t, modo, zoom, dur_mov, ease) — o modo/zoom que vale a partir de t."""
    base_keys = []  # (t, modo, d)
    for r in runs:
        if r["cov_in"]:
            base_keys.append((r["cov_in"][0] + 0.04, "split", 0.0))
        else:
            base_keys.append((r["a"], "split", 0.36))
        if r["cov_out"]:
            base_keys.append((r["cov_out"][0] + 0.04, "full", 0.0))
        else:
            base_keys.append((r["b"] - 0.3, "full", 0.3))
    base_keys.sort(key=lambda k: k[0])

    def base_em(t):
        m = "full"
        for k in base_keys:
            if k[0] <= t + 1e-6:
                m = k[1]
        return m

    def movendo(t):
        return any(k[2] > 0 and k[0] - 0.05 <= t <= k[0] + k[2] + 0.4 for k in base_keys)

    tom = []
    for item in cfg.get("tomadas", []):
        t, glob = tempo(item[0], fala, 0.0)
        tom.append((t, item[1] if len(item) > 1 else "punch"))
    final = None
    if cfg.get("final"):
        final, _ = tempo(cfg["final"], fala, 0.0)
    keys = [(k[0], "base", k[1], k[2]) for k in base_keys]
    keys += [(t, "tomada", m, 0) for t, m in tom]
    cortes = sorted(set([round(j, 3) for j in joins if 0.05 < j < DUR - 0.05] + [round(t["t0"], 3) for t in trechos if 0.05 < t["t0"] < DUR - 0.05]))
    keys += [(t, "emenda", None, 0) for t in cortes]
    keys.sort(key=lambda k: (k[0], {"base": 0, "tomada": 2, "emenda": 1}[k[1]]))
    out = [(0.0, base_em(0.0), 0, 0.0, None)]
    zoom, last_toggle = 0, -9.0
    auto = cfg.get("auto_punch", True)
    gap = cfg.get("intervalo_min", 1.5)
    for t, kind, val, d in keys:
        if final is not None and t >= final:
            break
        cov = cobertura(t, covers, antes=0.0, depois=0.0)
        if kind == "base":
            zoom = 0
            out.append((t, val, 0, d, None))
            last_toggle = t
        elif kind == "tomada":
            zoom = {"punch": 1, "push": 2, "normal": 0, "cheio": 0}.get(val, 1)
            if base_em(t) == "split":
                zoom = min(zoom, 1)
            out.append((t, base_em(t), zoom, 0.0, None))
            last_toggle = t
        else:  # emenda ou troca de câmera: corte seco — muda o zoom (esconde o jump cut) ou só reenquadra
            if not cov and not movendo(t) and auto and t - last_toggle >= gap:
                zoom = 0 if zoom else 1
                last_toggle = t
            out.append((t, base_em(t), zoom, 0.0, None))
    if final is not None:
        out.append((final + 0.001, base_em(final), 2, max(0.5, DUR - final), "power1.out"))
    return out


def chaves_faixa(runs, covers, y0):
    """faixa da legenda: y0 no modo cheio, 960 (costura) quando o card dividido está visível."""
    keys = []
    for r in runs:
        if r["cov_in"]:
            keys.append((r["cov_in"][1], 960, 0.0))
        else:
            keys.append((r["a"], 960, 0.36))
        for c in covers:  # tela cheia no meio da corrida: legenda volta para y0 enquanto ela cobre
            if r["a"] + 0.05 < c[0] and c[1] < r["b"] - 0.05:
                keys += [(c[0], y0, 0.0), (c[1], 960, 0.0)]
        if r["cov_out"]:
            keys.append((r["cov_out"][0], y0, 0.0))
        else:
            keys.append((r["b"] - 0.3, y0, 0.3))
    return sorted(keys)


# ---------------------------------------------------------------- SFX automáticos por cena
def ev(t, s, db, **k):
    e = {"t": round(t, 3), "s": s, "db": db}
    e.update(k)
    return e


VERDES = {"verde", "ok", "#2dbe60", "#13a05b", "brasil"}


def carimbo(t, cor, db=-9):
    out = [ev(t - 0.04, "impact2", db, len=1.3)]
    if str(cor or "").lower() in VERDES:
        out.append(ev(t, "chime", -19))
    return out


def sfx_cena(s):
    a, P, tipo, d = s["a"], s["P"], s["tipo"], s["dur"]
    E = []
    T = lambda x: a + x  # noqa: E731
    if s["layout"] == "dividido":
        ent = P.get("entrada")
        if ent == "desce":
            E.append(ev(a - 0.04, "whoosh", -13, pan=-0.2))
        elif ent in ("wipe-esq", "wipe-dir"):
            E.append(ev(a, "whoosh", -15, pan=0.4 if ent == "wipe-esq" else -0.4))
        if P.get("saida") is not None:
            E.append(ev(T(P["saida"]), "whoosh", -16, pan=0.2))
    if tipo == "gancho":
        n = len(P.get("linhas", []))
        step = min(0.68, max(0.3, (d - 0.9) / max(1, n)))
        beats = P.get("batidas") or [0.1 + i * step for i in range(n)]
        out = P.get("saida") if P.get("saida") is not None else d - 0.26
        L = min(10.0, out + 0.01)
        E.append(ev(a, "riser", -20, **{"from": round(10.03 - L, 3), "len": round(L, 3)}))
        for i, b in enumerate(beats):
            E.append(ev(T(b), ["impact", "impact2", "impact"][i % 3], [-12, -14, -13][i % 3], len=1.3))
        if len(beats) > 1:
            E.append(ev(T(beats[1]) - 0.02, "whoosh", -14, pan=-0.3))
        E.append(ev(T(out) - 0.02, "whoosh", -10, pan=0.2))
    elif tipo == "card-icone":
        E.append(ev(T(0.14), "pop", -17))
        if P.get("chip"):
            E.append(ev(T(P["chip"].get("em", 0.22)), "pop", -16))
        if P.get("carimbo"):
            E += carimbo(T(P["carimbo"].get("em", d - 0.9)), P["carimbo"].get("cor", "vermelho"))
    elif tipo == "troca":
        if (P.get("a") or {}).get("riscar_em") is not None:
            E.append(ev(T(P["a"]["riscar_em"]), "error", -15))
        if P.get("b"):
            b = P["b"].get("em", d * 0.55)
            E += [ev(T(b), "pop", -14), ev(T(b) + 0.05, "sparkle", -19)]
            if len(P["b"].get("icones") or []) > 1:
                E.append(ev(T(b) + 0.3, "click", -16))
    elif tipo == "adesivos":
        for i, it in enumerate(P.get("itens", [])):
            x = (it.get("x", 60) + it.get("tam", 240) / 2 - 540) / 540
            E.append(ev(T(it.get("em", 0.08 + i * 0.28)), "pop", -15, pan=round(max(-0.5, min(0.5, x * 0.4)), 2)))
            if it.get("riscar_em") is not None:
                E.append(ev(T(it["riscar_em"]), "error", -14))
    elif tipo == "chat":
        for i, m in enumerate(P.get("msgs", [])):
            t = T(m.get("t", 0.3 + i * 1.2))
            if m.get("lado") == "b":
                E.append(ev(t, "pop", -15, pan=0.3))
            else:
                if P.get("digitando", True):
                    E += [ev(t - 0.42, "click", -21, pan=-0.3), ev(t - 0.30, "click", -22, pan=-0.3)]
                E.append(ev(t, "notify", -18, pan=-0.2, len=0.6))
    elif tipo == "glitch":
        E += [ev(a, "glitch", -13, len=round(min(1.0, d), 2)), ev(a, "impact", -14, len=1.3)]
    elif tipo == "cartaz":
        E += [ev(a, "whoosh", -11), ev(T(0.22), "pop", -16)]
        if P.get("promessa"):
            E.append(ev(T(P["promessa"].get("em", d * 0.45)), "whoosh", -16, pan=0.3))
        if P.get("carimbo"):
            E += carimbo(T(P["carimbo"].get("em", d - 0.8)), P["carimbo"].get("cor", "verde"), db=-10)
    elif tipo == "busca":
        q = str(P.get("consulta", ""))
        t0 = P.get("digitar_em", 0.42)
        tend = t0 + len(q) / P.get("cps", 34)
        E += [ev(T(t0), "typing", -20, len=round(min(1.5, tend - t0 + 0.1), 2)), ev(T(tend + 0.8), "ping", -17)]
        if P.get("resposta"):
            E.append(ev(T(P["resposta"].get("em", tend + 0.9)) + 0.05, "impact2", -12, len=1.3))
        if P.get("revelacao"):
            V = P["revelacao"]
            E.append(ev(T(V.get("em", d - 1.5)) + 0.05, "pop", -14))
            for i, x in enumerate(V.get("extras", [])):
                E.append(ev(T(x.get("em", V.get("em", d - 1.5) + 0.9 + i * 0.1)) + 0.05, "pop", -13))
            if V.get("extras"):
                E.append(ev(T(V["extras"][-1].get("em", d - 0.5)) + 0.15, "whoosh", -17))
    elif tipo == "versus":
        E += [ev(a, "impact", -12, len=1.3), ev(T(0.18), "whoosh", -16, pan=-0.5), ev(T(0.34), "whoosh", -16, pan=0.5), ev(T(0.7), "pop", -12)]
        if P.get("destaque"):
            E.append(ev(T(P["destaque"].get("em", d - 0.8)), "click", -16))
    elif tipo == "degraus":
        n = len(P.get("degraus", []))
        for i, g in enumerate(P.get("degraus", [])):
            em = g.get("em", 1.0 + i * ((d - 2) / max(1, n)))
            E.append(ev(T(em) - 0.24, "pop", -14))
            if i:
                E.append(ev(T(em) + 0.15, "click", -17))
        if P.get("fase2"):
            f = P["fase2"].get("em", d - 2)
            E += [ev(T(f) - 0.03, "whoosh", -16), ev(T(f) + 0.15, "sparkle", -20)]
    elif tipo == "grade":
        E.append(ev(T(0.15), "sparkle", -17))
        hit = (P.get("marcar") or {}).get("em", (P.get("carimbo") or {}).get("em", d - 0.9))
        if P.get("marcar"):
            E.append(ev(T(hit) - 0.1, "glitch", -18, len=0.25))
        if P.get("carimbo"):
            E += carimbo(T(P["carimbo"].get("em", hit)), P["carimbo"].get("cor", "vermelho"))
    elif tipo == "contador":
        N = P.get("numero") or {}
        em, nd = N.get("em", 0.22), N.get("dur", 0.7)
        E.append(ev(a, "impact", -12, len=1.3))
        k = 0
        while k * 0.07 < nd and k < 14:
            E.append(ev(T(em + k * 0.07), "click", -22))
            k += 1
        if P.get("rotulo"):
            r = P["rotulo"].get("em", em + nd)
            E += [ev(T(r) - 0.02, "impact2", -12, len=1.3), ev(T(r) + 0.06, "chime", -18)]
        for i, c in enumerate(P.get("chips", [])):
            E.append(ev(T(c.get("em", 2 + i * 0.9)), "pop", -14))
        F = P.get("final")
        if F:
            fe = F.get("em", d - 1.2)
            E.append(ev(T(fe), "whoosh", -14))
            if F.get("icone") == "urna":
                E.append({"t": round(T(F.get("apertar_em", fe + 0.4)), 3), "synth": "urna", "db": -9})
            else:
                E.append(ev(T(fe) + 0.3, "impact2", -10, len=1.3))
    elif tipo == "alerta":
        if P.get("fita", True):
            E.append(ev(T(0.25), "whoosh", -16, pan=-0.4))
        w = (P.get("palavra") or {}).get("em", 0.86)
        E.append(ev(T(w), "impact", -11, len=1.3))
        if P.get("alerta"):
            E.append(ev(T(P["alerta"].get("em", w + 0.72)), "error", -14))
        if P.get("troca"):
            E.append(ev(T(P["troca"].get("em", w + 2.2)), "sparkle", -15))
    elif tipo == "rota":
        em = P.get("em", 0.4)
        E += [ev(a, "whoosh", -12), ev(T(0.08), "pop", -17, pan=0.3), ev(T(0.24), "pop", -17, pan=-0.3),
              ev(T(em), "whooshBig", -15, len=round(min(2.6, P.get("dur_voo", 2.2) + 0.4), 2))]
    elif tipo == "baloes":
        if P.get("titulo"):
            E.append(ev(T(P["titulo"].get("em", 0.3)), "impact2", -14, len=1.3))
        if P.get("multidao"):
            m = P["multidao"].get("em", d * 0.35)
            E += [ev(T(m) + 0.1 + k * 0.12, "pop", -19, pan=0.4 if k % 2 == 0 else -0.4) for k in range(6)]
        if P.get("final"):
            f = P["final"].get("em", d - 1)
            E += [ev(T(f) + 0.1, "ping", -13), ev(T(f) + 0.18, "sparkle", -18)]
    elif tipo == "palavra":
        E.append(ev(T(P.get("em", 0.04)), "impact2", -12, len=1.3))
    elif tipo == "cartao":
        if s["layout"] == "cheio":
            E.append(ev(a, "whoosh", -12))
        E.append(ev(T(P.get("em", 0.1)) + 0.06, "pop", -15))
    elif tipo == "faixa":
        em = P.get("em", 0.05)
        E.append(ev(T(em), "whoosh", -14))
        if P.get("icone"):
            E.append(ev(T(em) + 0.2, "pop", -16))
    elif tipo == "imagem":
        if s["layout"] == "cheio":
            E.append(ev(a, "whoosh", -12))
        if P.get("titulo"):
            E.append(ev(T(P.get("em", 0.25)), "pop", -16))
    return E


# ---------------------------------------------------------------- arquivos do projeto
def escreve(path, txt):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(txt)


def js(obj):
    return json.dumps(obj, ensure_ascii=False).replace("</", "<\\/")


def palavras_enfase(obj, acc):
    if isinstance(obj, dict):
        for v in obj.values():
            palavras_enfase(v, acc)
    elif isinstance(obj, list):
        for v in obj:
            palavras_enfase(v, acc)
    elif isinstance(obj, str):
        for m in re.findall(r"\*([^*]+)\*", obj):
            acc.update(w for w in m.split() if len(norm(w)) >= 3)
    return acc


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    plano_path = os.path.abspath(sys.argv[1])
    base = os.path.dirname(plano_path)
    PL = json.load(open(plano_path, encoding="utf-8"))
    MARCA = {}  # identidade do cliente: marca.json na pasta do corte ou acima (a pasta do projeto)
    d = base
    while True:
        if os.path.exists(os.path.join(d, "marca.json")):
            MARCA = json.load(open(os.path.join(d, "marca.json"), encoding="utf-8"))
            break
        if os.path.dirname(d) == d:
            break
        d = os.path.dirname(d)
    rel = lambda p: p if os.path.isabs(p) else os.path.normpath(os.path.join(base, p))  # noqa: E731
    corte = rel(PL.get("corte", "corte_bruto.mp4"))
    proj = rel(arg("--saida", PL.get("saida", "vertical")))
    W, H, FPS, DUR = probe(corte)
    DUR = round(float(PL.get("duracao", DUR)), 3)
    print(f"corte: {corte}\n  {W}x{H} {FPS:.2f} fps, {DUR:.2f}s → projeto {proj}")

    # transcrição do corte final (tempos do corte) — de preferência transcrita de novo a partir do corte_bruto.mp4
    tp = rel(PL.get("transcricao", "work/transcricao_corte.json"))
    if not os.path.exists(tp):
        alt = corte + ".words.json"
        if os.path.exists(alt):
            aviso(f"transcrição do corte não encontrada ({tp}); usando {os.path.basename(alt)} (tempos re-calculados do corte)")
            tp = alt
        else:
            sys.exit(f"falta a transcrição do corte: rode transcrever.py {corte} {tp}")
    wd = json.load(open(tp, encoding="utf-8"))
    words = wd["words"] if isinstance(wd, dict) else wd
    LEGCFG = {**({"estilo": MARCA["legenda"]} if MARCA.get("legenda") else {}), **PL.get("legenda", {})}
    # correções de transcrição valem para tudo: legenda e referências "~frase" (ex.: "hipi -oca" → "tapioca")
    fix = [{"i": f["i"], "j": f.get("j", f["i"]), "text": f.get("texto", f.get("text", ""))} for f in LEGCFG.get("corrigir", LEGCFG.get("fix", []))]
    words = LEG.corrigir(words, fix)
    for de, para in (LEGCFG.get("substituir") or {}).items():
        for w in words:
            if norm(w["text"]) == norm(de):
                core = re.sub(r"[^\w]", "", w["text"])
                w["text"] = w["text"].replace(core, para) if core else para
    fala = Fala(words)
    segp = rel(PL.get("segmentos", corte + ".segments.json"))
    joins = [s["at"] for s in json.load(open(segp, encoding="utf-8"))["segments"]][1:] if os.path.exists(segp) else []
    enq = rel(PL.get("enquadramento", "work/enquadramento.json"))
    if not os.path.exists(enq):
        print("  enquadramento.json não existe — rodando enquadramento.py…")
        r = subprocess.run([sys.executable, os.path.join(HERE, "enquadramento.py"), corte, enq] + (["--segments", segp] if os.path.exists(segp) else []),
                           capture_output=True, text=True, encoding="utf-8", errors="replace")
        print("  " + (r.stdout or r.stderr).strip().replace("\n", "\n  "))
    EQ = json.load(open(enq, encoding="utf-8")) if os.path.exists(enq) else {"fy": 0.42, "face_w": 0.2, "trechos": [], "cortes_camera": []}
    CAMCFG = PL.get("camera", {})
    trechos = EQ.get("trechos", [])
    if CAMCFG.get("trechos"):  # correção manual: [[t, fx], [t, fx, fy], ...]
        man = sorted(CAMCFG["trechos"], key=lambda r: r[0])
        trechos = [{"t0": r[0], "t1": (man[i + 1][0] if i + 1 < len(man) else DUR), "fx": r[1], "fy": r[2] if len(r) > 2 else None}
                   for i, r in enumerate(man)]
    gfx, gfy = CAMCFG.get("fx", 0.5), CAMCFG.get("fy", EQ.get("fy", 0.42))

    def rosto(t):
        tr = None
        for x in trechos:
            if x["t0"] <= t + 1e-6:
                tr = x
        fx = tr["fx"] if tr and tr.get("fx") is not None else gfx
        fy = tr["fy"] if tr and tr.get("fy") is not None else gfy
        return fx, fy

    # ---- cenas
    cenas, ids, prev = [], set(), 0.0
    for k, c in enumerate(PL.get("cenas", [])):
        tipo = c.get("tipo")
        if tipo not in CENAS:
            sys.exit(f"cena {k + 1}: tipo desconhecido '{tipo}'. Tipos: {', '.join(CENAS)}")
        cid = re.sub(r"[^a-z0-9-]", "-", (c.get("id") or f"c{k + 1:02d}-{tipo}").lower()).strip("-")
        if cid in RESERVADOS or cid in ids or not re.match(r"^[a-z]", cid):
            cid = f"c{k + 1:02d}-{cid}"
        ids.add(cid)
        a, _ = tempo(c.get("inicio", 0), fala, prev)
        if "fim" in c:
            f = c["fim"]
            if isinstance(f, str) and f.strip().startswith("~") and ">" not in f:  # "fim" numa frase = quando ela termina
                m = re.match(r"^(.*?)([+-]\d+(?:\.\d+)?)?$", f.strip())
                f = m.group(1) + ">" + (m.group(2) or "")
            b, _ = tempo(f, fala, a)
            dur = b - a
        else:
            dur = float(c.get("dur", 3.0))
        if a < 0 or a >= DUR:
            sys.exit(f"{cid}: início {a:.2f}s fora do corte (0–{DUR:.2f}s)")
        if a + dur > DUR:
            dur = DUR - a
        if dur < 0.4:
            sys.exit(f"{cid}: duração {dur:.2f}s curta demais")
        a, dur = round(a, 3), round(dur, 3)
        P0 = c.get("params", {}) or {}
        try:
            P = resolve_params(P0, fala, a, dur, cid)
        except ValueError as e:
            sys.exit(f"{cid}: {e}")
        lay = CENAS[tipo]["layout"]
        if lay == "param":
            lay = "cheio" if P.get("layout") == "cheio" else "dividido"
        leg = c.get("legenda", CENAS[tipo].get("legenda", True))
        cenas.append({"id": cid, "tipo": tipo, "a": a, "dur": dur, "P0": P0, "P": P, "layout": lay, "legenda": leg, "c": c})
        prev = a
    if any(x["a"] > y["a"] for x, y in zip(cenas, cenas[1:])):
        aviso("as cenas não estão em ordem de tempo no plano — reordenei por início")
        cenas.sort(key=lambda s: s["a"])
    covers = [(s["a"], s["a"] + s["dur"]) for s in cenas if s["layout"] == "cheio"]
    runs = planeja_layout(cenas, covers)
    for s in cenas:
        s["P"]["dur"] = s["dur"]
    # planos abertos sem cobertura
    for tr in trechos:
        if tr.get("aberto") and not any(c[0] <= tr["t0"] + 0.1 and tr["t1"] - 0.1 <= c[1] for c in covers):
            aviso(f"plano aberto (rosto pequeno) em {tr['t0']:.2f}–{tr['t1']:.2f}s sem cena de tela cheia por cima")

    # ---- câmera e faixa da legenda
    cam = Camera(W, H, CAMCFG)
    y0 = LEGCFG.get("y", 1360)
    keys = chaves_camera(runs, covers, joins, trechos, CAMCFG, DUR, fala)
    shots = []
    for t, modo, zoom, d, ease in keys:
        fx, fy = rosto(t + 0.02 if d == 0 else t + d)
        S, x, y = cam.pose(modo, zoom, fx, fy)
        if shots and shots[-1][1:4] == [S, x, y] and d == 0:
            continue
        shots.append([round(t, 3), S, x, y, round(d, 3)] + ([ease] if ease else []))
    band = chaves_faixa(runs, covers, y0)
    pb = [[tempo(p[0], fala, 0)[0], tempo(p[1], fala, 0)[0]] for p in CAMCFG.get("pb", [])]

    # ---- pasta do projeto
    os.makedirs(proj, exist_ok=True)
    for sub in ("lib/fonts", "compositions", "assets", "work"):
        os.makedirs(os.path.join(proj, sub), exist_ok=True)
    for f in os.listdir(os.path.join(TPL, "lib")):
        p = os.path.join(TPL, "lib", f)
        if os.path.isfile(p):
            shutil.copyfile(p, os.path.join(proj, "lib", f))
    for f in os.listdir(os.path.join(TPL, "lib", "fonts")):
        shutil.copyfile(os.path.join(TPL, "lib", "fonts", f), os.path.join(proj, "lib", "fonts", f))
    aroll = os.path.join(proj, "assets", "aroll.mp4")
    if not (os.path.exists(aroll) and os.path.getsize(aroll) == os.path.getsize(corte)):
        try:
            if os.path.exists(aroll):
                os.remove(aroll)
            os.link(corte, aroll)
        except OSError:
            shutil.copyfile(corte, aroll)
    for f in os.listdir(os.path.join(proj, "compositions")):  # cenas de uma montagem anterior
        if f.endswith(".html") and f != "legendas.html" and f[:-5] not in ids:
            os.remove(os.path.join(proj, "compositions", f))

    # ---- cenas → compositions/<id>.html
    for s in cenas:
        P = s["P"]
        if s["tipo"] == "imagem" and P.get("arquivo"):
            src = rel(P["arquivo"])
            if not os.path.exists(src):
                sys.exit(f"{s['id']}: imagem não encontrada: {src}")
            os.makedirs(os.path.join(proj, "assets", "imagens"), exist_ok=True)
            dst = os.path.join(proj, "assets", "imagens", os.path.basename(src))
            shutil.copyfile(src, dst)
            P["arquivo"] = "assets/imagens/" + os.path.basename(src)
        if s["tipo"] == "colagem":
            # imagens das polaroides e fotos da colagem vão para assets/imagens, como na cena `imagem`
            for it in P.get("itens", []):
                if it.get("arquivo"):
                    src = rel(it["arquivo"])
                    if not os.path.exists(src):
                        sys.exit(f"{s['id']}: imagem não encontrada: {src}")
                    os.makedirs(os.path.join(proj, "assets", "imagens"), exist_ok=True)
                    shutil.copyfile(src, os.path.join(proj, "assets", "imagens", os.path.basename(src)))
                    it["arquivo"] = "assets/imagens/" + os.path.basename(src)
        tpl = open(os.path.join(TPL, "compositions", "cenas", s["tipo"] + ".html"), encoding="utf-8").read()
        html = tpl.replace("/*PARAMS*/{}/*/PARAMS*/", "/*PARAMS*/" + js(P) + "/*/PARAMS*/").replace("/*FONTES*/", FONTES).replace("__ID__", s["id"])
        escreve(os.path.join(proj, "compositions", s["id"] + ".html"), html)

    # ---- legendas
    estilo = LEGCFG.get("estilo", "anton")
    hide = [[s["a"], round(s["a"] + s["dur"], 3)] for s in cenas if not s["legenda"]]
    for h in LEGCFG.get("esconder", []):
        hide.append([tempo(h[0], fala, 0)[0], tempo(h[1], fala, 0)[0]])
    kws = LEGCFG.get("palavras_chave", LEGCFG.get("keywords"))
    if kws is None:  # automático: palavras com *ênfase* nas cenas, números e palavras longas
        acc = palavras_enfase([s["P0"] for s in cenas], set())
        for w in words:
            n = norm(w["text"])
            if n.isdigit() or (len(n) >= 7 and n not in PARADAS):
                acc.add(w["text"])
        kws = sorted({re.sub(r"[^\w]", "", k).upper() for k in acc if re.sub(r"[^\w]", "", k)})
    wl = words
    spec = {"fix": [], "censor": LEGCFG.get("censura", LEGCFG.get("censor", {"porra": "p*rra", "puta": "p*ta", "caralho": "c*ralho", "merda": "m*rda"})),
            "keywords": kws, "hide": hide, "max_words": LEGCFG.get("max_palavras", 1 if estilo == "palavra" else 3),
            "max_chars": LEGCFG.get("max_letras", 14 if estilo == "palavra" else 15), "lead": 0.04, "hold": 0.45, "duration": DUR,
            "caixa": LEGCFG.get("caixa", "normal" if estilo in ("serifa", "montserrat", "papel", "topo") else "alta")}
    caps = LEG.gerar(wl, spec)
    canal = {**{k: MARCA[k] for k in ("handle", "acento") if MARCA.get(k)}, **PL.get("canal", {})}
    acento = canal.get("acento", "#38BDF8")  # sem marca do cliente: azul neutro (o amarelo #FFB800 é a marca do Lucas Editor)
    cfg = {"offset": 0, "len": DUR, "y0": y0, "band": band, "ocultar": hide, "estilo": estilo, "acento": acento, "handle": canal.get("handle", ""),
           "ativa": LEGCFG.get("ativa", 1.08)}
    tplc = open(os.path.join(TPL, "compositions", "legendas.html"), encoding="utf-8").read()
    escreve(os.path.join(proj, "compositions", "legendas.html"),
            tplc.replace("/*CAPS*/[]/*/CAPS*/", "/*CAPS*/" + js(caps) + "/*/CAPS*/").replace("/*CFG*/{}/*/CFG*/", "/*CFG*/" + js(cfg) + "/*/CFG*/")
            .replace("/*FONTES*/", FONTES))
    json.dump(caps, open(os.path.join(proj, "work", "legendas.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)

    # ---- som
    SOM = PL.get("som", {})
    eventos = []
    sem = set(SOM.get("sem_auto", []))
    for s in cenas:
        if s["id"] not in sem and s["c"].get("sfx", True):
            eventos += sfx_cena(s)
    for e in SOM.get("extra", []):
        e = dict(e)
        e["t"] = round(tempo(e["t"], fala, 0)[0], 3)
        eventos.append(e)
    eventos = sorted([e for e in eventos if 0 <= e["t"] < DUR], key=lambda e: e["t"])
    drops = [(s["a"], s["dur"]) for s in cenas if CENAS[s["tipo"]].get("drop")]
    drops += [tuple(tempo(x, fala, 0)[0] for x in d) for d in SOM.get("drops", [])]
    lib, libdir = SONS.resolver_biblioteca([e.get("s") for e in eventos if e.get("s")], os.path.join(proj, "assets", "sfx"))
    libr = {k: os.path.relpath(v, proj).replace("\\", "/") for k, v in lib.items()}
    json.dump({"library": libr, "events": eventos}, open(os.path.join(proj, "work", "sfx_events.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    musica_ok = False
    if "--sem-som" not in sys.argv:
        print(f"  som: {len(eventos)} efeitos ({'biblioteca do HyperFrames' if libdir else 'sintetizados'}), trilha "
              f"{'do arquivo ' + SOM['musica'] if SOM.get('musica') else SOM.get('clima', 'curioso')}, drops {[(round(a, 2), round(b, 2)) for a, b in drops]}")
        sfx = SONS.build_sfx({"library": libr, "events": eventos}, DUR, proj)
        A.write24(os.path.join(proj, "assets", "sfx.wav"), sfx)
        lufs = SOM.get("musica_lufs", -30.0)
        if SOM.get("musica"):
            mus = SONS.musica_arquivo(rel(SOM["musica"]), DUR, drops, lufs)
        else:
            mus = SONS.build_music(DUR, SOM.get("bpm"), drops, SOM.get("clima", "curioso"), lufs)
        A.write24(os.path.join(proj, "assets", "music_raw.wav"), mus)
        A.write24(os.path.join(proj, "assets", "music_duck.wav"), SONS.duck(mus, corte))
        if SONS.pk(sfx) > -1.0:
            aviso(f"trilha de efeitos com pico {SONS.pk(sfx):.1f} dBFS (golpes empilhados) — abaixe 'db' de algum efeito")
        musica_ok = True

    # ---- index.html
    tracks = {}
    slots = []
    for s in cenas:
        a, b = s["a"], s["a"] + s["dur"]
        tr = 2
        while any(not (b <= x0 or a >= x1) for x0, x1 in tracks.get(tr, [])):
            tr += 1
            if tr == 5:
                tr = 8
        tracks.setdefault(tr, []).append((a, b))
        slots.append(f'      <div id="{s["id"]}" class="slot" data-composition-id="{s["id"]}" data-composition-src="compositions/{s["id"]}.html" '
                     f'data-start="{a}" data-duration="{s["dur"]}" data-track-index="{tr}" data-width="1080" data-height="1920"></div>')
    index = f"""<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1080, height=1920">
    <script src="lib/gsap.min.js"></script>
    <script src="lib/br-kit.js"></script>
    <script>BK.tema({js({"acento": acento, "handle": canal.get("handle", "")})});</script>
    <link rel="stylesheet" href="lib/br-kit.css">
    <style>
      {FONTES}
      :root {{ --acento: {acento}; }}
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #0b0b0d; }}
      #root {{ position: relative; width: 100%; height: 100%; overflow: hidden; background: #0b0b0d; }}
      #cam {{ position: absolute; left: 0; top: 0; width: {W}px; height: {H}px; transform-origin: 0 0; will-change: transform; z-index: 0; }}
      #aroll {{ position: absolute; left: 0; top: 0; width: {W}px; height: {H}px; object-fit: cover; }}
      .slot {{ position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; z-index: 10; }}
      #legendas {{ z-index: 20; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="1080" data-height="1920">
      <div id="cam">
        <video id="aroll" class="clip" src="assets/aroll.mp4" playsinline data-has-audio="true" data-start="0" data-duration="{DUR}" data-track-index="0" data-volume="1"></video>
      </div>

{chr(10).join(slots)}
      <audio id="sfx" src="assets/sfx.wav" data-start="0" data-duration="{DUR}" data-track-index="6" data-volume="1"></audio>
      <audio id="music" src="assets/music.wav" data-start="0" data-duration="{DUR}" data-track-index="7" data-volume="1"></audio>
      <div id="legendas" class="slot" data-track-kind="captions" data-composition-id="legendas" data-composition-src="compositions/legendas.html" data-start="0" data-duration="{DUR}" data-track-index="5" data-width="1080" data-height="1920"></div>
    </div>
    <script>
      const DUR = {DUR};
      const tl = gsap.timeline({{ paused: true }});
      // câmera (regra viewport-change): um único wrapper; [t, escala, x, y, duração do movimento (0 = corte seco), ease]
      // gerado pelo montar_vertical.py a partir do rosto (enquadramento.json), das corridas de cards e das emendas do corte
      const cam = document.getElementById("cam");
      const SHOTS = {js(shots)};
      gsap.set(cam, {{ scale: SHOTS[0][1], x: SHOTS[0][2], y: SHOTS[0][3] }});
      SHOTS.slice(1).forEach(([t, scale, x, y, d, ease]) => {{
        if (d > 0) tl.to(cam, {{ scale, x, y, duration: d, ease: ease || "power3.inOut" }}, t);
        else tl.set(cam, {{ scale, x, y }}, t);
      }});
      // trechos em preto e branco
      {js(pb)}.forEach(([a, b]) => {{ tl.set(cam, {{ filter: "grayscale(1) contrast(1.08)" }}, a); tl.set(cam, {{ filter: "none" }}, b); }});
      tl.set({{}}, {{}}, DUR);
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
"""
    escreve(os.path.join(proj, "index.html"), index)

    # ---- arquivos de projeto do HyperFrames
    ver = run(["node", HF, "--version"], quiet=True).stdout.strip()
    ver = ver if re.match(r"^\d+\.\d+", ver or "") else ""
    slug = re.sub(r"[^a-z0-9-]", "-", os.path.basename(base).lower()).strip("-") or "corte"
    if not os.path.exists(os.path.join(proj, "hyperframes.json")):
        escreve(os.path.join(proj, "hyperframes.json"), json.dumps({
            "$schema": "https://hyperframes.heygen.com/schema/hyperframes.json",
            "registry": "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
            "paths": {"blocks": "compositions", "components": "compositions/components", "assets": "assets"},
            "media": {"autoProxy": True}, "authoringSkill": "general-video"}, indent=2) + "\n")
    pin = f"hyperframes@{ver}" if ver else "hyperframes@latest"
    pkg = {"name": slug + "-vertical", "private": True, "type": "module",
           "scripts": {"dev": f"npx --yes {pin} preview", "check": f"npx --yes {pin} check", "render": f"npx --yes {pin} render"}}
    if ver:
        pkg["devDependencies"] = {"@hyperframes/core": f"^{ver}"}
    pkgp = os.path.join(proj, "package.json")
    if os.path.exists(pkgp):
        old = json.load(open(pkgp, encoding="utf-8"))
        old.update({k: v for k, v in pkg.items() if k != "devDependencies"})
        old.setdefault("devDependencies", {}).update(pkg.get("devDependencies", {}))
        pkg = old
    escreve(pkgp, json.dumps(pkg, indent=2, ensure_ascii=False) + "\n")
    if not os.path.exists(os.path.join(proj, "meta.json")):
        escreve(os.path.join(proj, "meta.json"), json.dumps({"id": slug, "name": PL.get("titulo", slug),
                                                              "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat()}, indent=2) + "\n")
    titulo = PL.get("titulo", slug)
    msg = PL.get("mensagem", titulo).replace('"', "'")
    escreve(os.path.join(proj, "BRIEF.md"), f"""---
workflow: general-video
flow: automation
storyboard: no
message: "{msg}"
destination: reels-shorts-tiktok
aspect: 1080x1920
language: pt-BR
audience: público de cortes de podcast no Instagram, YouTube Shorts e TikTok
length: {DUR:.1f}s
angle: story-cut
---

## Intent

Edição vertical de um corte de podcast feita pela skill editor-ia: falante reenquadrado em 9:16 com punch-ins nas emendas,
legenda palavra a palavra com destaque na cor do canal, b-rolls em motion design ilustrando o que é dito, SFX sincronizados e
trilha discreta sob a voz. Projeto gerado por `montar_vertical.py` a partir de `{os.path.relpath(plano_path, proj)}` — para mudar, edite o plano e rode de novo.

## Assets

- assets/aroll.mp4 — o corte aprovado ({W}x{H}, {FPS:.2f} fps, com som): imagem e voz.
- assets/sfx.wav — {len(eventos)} efeitos; assets/music.wav — trilha ({SOM.get('clima', 'curioso') if not SOM.get('musica') else 'arquivo do usuário'}).
- compositions/*.html — {len(cenas)} cenas + legendas.

## Notes

- Nenhuma figura humana desenhada nos b-rolls (rosto, mãos, corpo, avatar): pessoas viram ícones, balões, pinos ou fichas.
- Ilustrar só o que foi dito: nada de dado, número ou afirmação que a pessoa não falou.
""")
    fr = []
    for i, s in enumerate(cenas):
        resumo = ", ".join(f"{k}: {v}" for k, v in s["P0"].items() if isinstance(v, str))[:160]
        fr.append(f"## Frame {i + 1} — {s['tipo']} ({s['id']})\n- status: animated\n- src: compositions/{s['id']}.html\n- duration: {s['dur']}s\n"
                  f"- at: {s['a']:.2f}\n- layout: {s['layout']}\n\n{resumo}\n")
    escreve(os.path.join(proj, "STORYBOARD.md"), f"""---
format: 1080x1920
message: "{msg}"
mode: autonomous
duration: {DUR:.2f}s
music: {SOM.get('clima', 'curioso') if not SOM.get('musica') else 'arquivo do usuário'} (carve sob a voz)
---

Base: assets/aroll.mp4 em #cam (câmera gerada: {len(shots)} chaves). Legenda: compositions/legendas.html (estilo {estilo}, {len(caps)} grupos).

""" + "\n".join(fr))
    escreve(os.path.join(proj, "frame.md"), f"""# Design truth — {titulo}

## Palette
- bg `#0B0B0D` · panel `#16161A` · line `#2A2A30` · fg `#F5F3EE` · muted `#A9A6A0`
- acento do canal `{acento}` (palavra-chave da legenda, destaques, bordas dos cards)
- alerta/carimbo `#E5202A` · ok `#2DBE60`

## Type
- Títulos e legenda: LT Anton (caixa alta). Serifada: LT Garamond. Texto corrido: LT Montserrat. Rótulos e interface: JetBrains Mono 700.

## Layout (1080x1920)
- Cheio: rosto do falante no terço de cima; legenda centrada em y {y0}.
- Dividido: card de b-roll em 0–960, falante em 960–1920, legenda na costura (y 960).
- Tela cheia: deixa a faixa da legenda (1290–1470) livre quando a legenda continua.

## Don't
- Nenhuma figura humana desenhada (rosto, mão, corpo, avatar). Nada de emoji colorido: ícones SVG do kit.
- Nada de afirmação ou dado que não foi falado.
""")
    json.dump({"cenas": [{k: s[k] for k in ("id", "tipo", "a", "dur", "layout", "legenda", "P")} for s in cenas], "camera": shots, "faixa": band,
               "corridas": [{"a": r["a"], "b": r["b"], "cenas": [s["id"] for s in r["cenas"]]} for r in runs], "drops": drops, "avisos": avisos},
              open(os.path.join(proj, "work", "plano_resolvido.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # ---- trilha: carve do HyperFrames (ou trilha já abaixada)
    if musica_ok:
        carved = False
        if ver and "--sem-carve" not in sys.argv:
            if not os.path.isdir(os.path.join(proj, "node_modules", "@hyperframes", "core")):
                print(f"  instalando @hyperframes/core@{ver} na pasta do projeto (para o carve)…")
                run(["npm", "install", "-D", f"@hyperframes/core@{ver}", "--no-audit", "--no-fund"], cwd=proj, timeout=900)
            shutil.copyfile(os.path.join(proj, "assets", "music_raw.wav"), os.path.join(proj, "assets", "music.wav"))
            r = run(["node", HF, "--skill-script", "hyperframes-audio/scripts/carve.mjs", "--comp", "index.html", "--bed", "music", "--voice", "aroll"],
                    cwd=proj, timeout=900)
            carved = r.returncode == 0 and "data-fx-carve" in open(os.path.join(proj, "index.html"), encoding="utf-8").read()
            print("  carve da trilha sob a voz: " + ("ok" if carved else "falhou — usando a trilha já abaixada (music_duck.wav)"))
        if not carved:
            shutil.copyfile(os.path.join(proj, "assets", "music_duck.wav"), os.path.join(proj, "assets", "music.wav"))

    # ---- verificação
    print(f"\n{len(cenas)} cenas, {len(runs)} corridas de cards, {len(shots)} chaves de câmera, {len(caps)} grupos de legenda, {len(eventos)} efeitos")
    if "--sem-check" not in sys.argv:
        for cmd in (["lint"], ["check"]):
            r = run(["node", HF] + cmd, cwd=proj, timeout=1800, quiet=True)
            txt = (r.stdout or "") + (r.stderr or "")
            linhas = [ln for ln in txt.splitlines() if re.search(r"error|warn|✗|✖|issue|passed|ok\b|0 errors", ln, re.I)]
            print(f"  hyperframes {cmd[0]}: {'OK' if r.returncode == 0 else 'PROBLEMAS (código ' + str(r.returncode) + ')'}")
            for ln in linhas[-25:]:
                print("    " + ln.strip()[:220])
    fotos = arg("--fotos")
    if fotos:
        ts = [round(s["a"] + min(s["dur"] * 0.6, s["dur"] - 0.2), 2) for s in cenas] if fotos == "auto" else [float(x) for x in fotos.split(",")]
        r = run(["node", HF, "snapshot", "--at", ",".join(str(t) for t in ts)], cwd=proj, timeout=1800, quiet=True)
        print(f"  fotos em {os.path.join(proj, 'snapshots')}: " + ("ok" if r.returncode == 0 else ((r.stdout or "") + (r.stderr or ""))[-600:]))
    if avisos:
        print(f"\n{len(avisos)} aviso(s) — veja acima e em work/plano_resolvido.json")
    print(f"\npronto: {proj}\n  prévia (Studio):  node {HF} preview   (na pasta do projeto)\n"
          f"  render:          node {HF} render . --fps {PL.get('render', {}).get('fps', 30)} --crf {PL.get('render', {}).get('crf', 14)} --browser-timeout 180 -o ../work/vertical_raw.mp4")


if __name__ == "__main__":
    main()
