#!/usr/bin/env python3
"""Biblioteca de modelos do painel: cada modelo é uma pasta com o vídeo de exemplo, a ficha e, se tiver, o código-base.

  python modelos.py lista --pasta "<pasta de trabalho>"
  python modelos.py adicionar <video.mp4> --pasta "<pasta de trabalho>" --nome "Barbearia: agendamento" --estilo motion
                    [--nicho barbearia] [--descricao "..."] [--codigo <pasta com os arquivos-base>] [--inicio 4] [--url <vídeo completo online>]
  python modelos.py importar <pasta ou .zip> --pasta "<pasta de trabalho>" [--estilo motion]
                    cada .mp4 vira um modelo; se existir um modelos.json na pasta ([{"arquivo","nome","estilo","nicho","descricao","codigo"}]),
                    ele manda; uma subpasta com o mesmo nome do vídeo vira o código do modelo.

Estrutura de um modelo (em <pasta de trabalho>/modelos/<id>/ ou, nos que vêm com o painel, <skill>/modelos/<id>/):
  modelo.json   ficha: id, nome, estilo (id do estilos.json), nicho, descricao, duracao, url, origem. A categoria da galeria
                é o estilo (Cortes de podcast, Motion design, Vídeos 3D...): estilo novo no estilos.json ganha a categoria sozinho.
  capa.jpg      432x768          previa.mp4   10 s, sem som, 432x768 (toca na galeria)      exemplo.mp4  o vídeo inteiro (720x1280, leve), gerado pelo adicionar
  MODELO.md     o que o Claude faz com este modelo (o que copiar, o que trocar, o que nunca deixar do original)
  codigo/       opcional: arquivos-base do projeto (roteiro, cena, index) que o Claude reaproveita trocando marca, textos e mídias
Só entram vídeos seus ou com licença para o produto. Precisa de ffmpeg."""
import argparse, datetime, json, os, re, shutil, subprocess, sys, unicodedata, zipfile

SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Categorias da galeria: uma por estilo, nesta ordem. Estilo que não está aqui usa o nome do estilos.json (ex.: Mapas).
CATEGORIAS = {"cortes-podcast": "Cortes de podcast", "youtube": "YouTube (estilo Lucas Editor)", "motion": "Motion design", "video-3d": "Vídeos 3D", "estilo-bit": "Estilo Bit",
              "video-falado": "Vídeo falado"}
ANTIGAS = {"editar", "sem-rosto", "clientes"}  # --categoria antigo: ainda aceito, mas a categoria agora vem do estilo


def estilos_catalogo():
    try:
        return json.load(open(os.path.join(SKILL, "estilos.json"), encoding="utf-8"))["estilos"]
    except (OSError, ValueError, KeyError):
        return []


def categorias(modelos):
    """{id: nome} das categorias que têm pelo menos um modelo, na ordem de CATEGORIAS e depois na do estilos.json."""
    cat = estilos_catalogo()
    nomes = {**{e["id"]: e.get("nome") or e["id"] for e in cat}, **CATEGORIAS}
    ordem = list(CATEGORIAS) + [e["id"] for e in cat if e["id"] not in CATEGORIAS]
    usadas = {m.get("categoria") for m in modelos if m.get("categoria")}
    ordem += sorted(usadas - set(ordem))
    return {k: nomes.get(k) or k.replace("-", " ").capitalize() for k in ordem if k in usadas}


def slug(s):
    s = unicodedata.normalize("NFD", str(s).lower()).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:40] or "modelo"


def estilos_validos():
    try:
        return {e["id"] for e in json.load(open(os.path.join(SKILL, "estilos.json"), encoding="utf-8"))["estilos"]}
    except (OSError, ValueError):
        return set()


def duracao(v):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", v], capture_output=True, text=True)
    try:
        return round(float(r.stdout.strip()), 1)
    except ValueError:
        return None


def previa(video, dest, inicio):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(inicio), "-t", "10", "-i", video, "-an",
                    "-vf", "scale=432:768:force_original_aspect_ratio=increase,crop=432:768,fps=30", "-c:v", "libx264", "-crf", "28",
                    "-preset", "fast", "-pix_fmt", "yuv420p", "-movflags", "+faststart", os.path.join(dest, "previa.mp4")], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(inicio + 1.5), "-i", video, "-frames:v", "1",
                    "-vf", "scale=432:768:force_original_aspect_ratio=increase,crop=432:768", "-q:v", "5", os.path.join(dest, "capa.jpg")], check=True)


def pastas(raiz):
    """(origem, pasta) dos lugares onde há modelos: os que vêm com o painel e os da pessoa."""
    out = [("painel", os.path.join(SKILL, "modelos"))]
    if raiz:
        out.append(("meu", os.path.join(os.path.abspath(os.path.expanduser(raiz)), "modelos")))
    return out


def lista(raiz):
    out = []
    for origem, pasta in pastas(raiz):
        if not os.path.isdir(pasta):
            continue
        base = base_exemplos() if origem == "painel" else ""
        for d in sorted(os.listdir(pasta)):
            c = os.path.join(pasta, d, "modelo.json")
            try:
                m = json.load(open(c, encoding="utf-8"))
            except (OSError, ValueError):
                continue
            m.update(categoria=m.get("estilo") or m.get("categoria") or "outros")  # a categoria é o estilo
            m.update(id=d, origem=origem, pasta=os.path.join(pasta, d), tem_codigo=os.path.isdir(os.path.join(pasta, d, "codigo")),
                     tem_previa=os.path.isfile(os.path.join(pasta, d, "previa.mp4")), tem_exemplo=os.path.isfile(os.path.join(pasta, d, "exemplo.mp4")))
            u = str(m.get("exemplo_url") or "")
            m["exemplo_url"] = u if base and u.startswith(base) and re.fullmatch(r"[a-z0-9-]{1,40}/exemplo-[0-9a-f]{12}\.mp4", u[len(base):]) else ""
            out.append(m)
    return out


def base_exemplos():
    """Onde ficam os vídeos inteiros dos modelos que vêm com o painel (no R2, fora do pacote): <url do atualizacao.json>modelos/."""
    try:
        u = str(json.load(open(os.path.join(SKILL, "atualizacao.json"), encoding="utf-8")).get("url") or "").strip()
    except (OSError, ValueError):
        return ""
    return u.rstrip("/") + "/modelos/" if u.startswith("https://") and "EXEMPLO" not in u else ""


def exemplo(video, pasta):
    """O vídeo inteiro em 720x1280 (ou 1280 de largura se for horizontal), leve, para tocar na galeria. Fica no computador da pessoa."""
    alvo = os.path.join(pasta, "exemplo.mp4")
    try:
        w, h = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", video],
                              capture_output=True, text=True, timeout=20).stdout.strip().split(",")[:2]
        escala = "scale=-2:1280" if int(h) >= int(w) else "scale=1280:-2"
    except Exception:
        escala = "scale=-2:1280"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vf", escala, "-c:v", "libx264", "-preset", "veryfast", "-crf", "27", "-pix_fmt", "yuv420p",
                    "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", alvo], capture_output=True, timeout=600)
    return os.path.isfile(alvo)


def adicionar(video, destino, nome, categoria=None, estilo="motion", nicho="", descricao="", codigo=None, inicio=0.0, url="", origem="meu"):
    video = os.path.abspath(os.path.expanduser(video))
    if not os.path.isfile(video):
        raise SystemExit(f"vídeo não encontrado: {video}")
    if categoria and categoria not in ANTIGAS and categoria != estilo:
        print(f"aviso: --categoria não é mais usado ({categoria}); a categoria do modelo é o estilo ({estilo})")
    ev = estilos_validos()
    if ev and estilo not in ev:
        raise SystemExit(f"estilo desconhecido: {estilo} (válidos: {', '.join(sorted(ev))})")
    mid, i = slug(nome), 2
    while os.path.exists(os.path.join(destino, mid)):
        mid, i = f"{slug(nome)}-{i}", i + 1
    pasta = os.path.join(destino, mid)
    os.makedirs(pasta)
    previa(video, pasta, float(inicio))
    exemplo(video, pasta)
    if codigo:
        codigo = os.path.abspath(os.path.expanduser(codigo))
        shutil.copytree(codigo, os.path.join(pasta, "codigo"), ignore=shutil.ignore_patterns("__pycache__", ".DS_Store", "node_modules", "work", ".hyperframes", "voz", "Bruto", "*.mp4", "*.wav"))
    ficha = {"nome": nome, "categoria": estilo, "estilo": estilo, "nicho": nicho, "descricao": descricao, "duracao": duracao(video),
             "url": url, "origem": origem, "criado": datetime.date.today().isoformat()}
    json.dump(ficha, open(os.path.join(pasta, "modelo.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    md = os.path.join(pasta, "MODELO.md")
    if not os.path.exists(md):
        open(md, "w", encoding="utf-8").write(f"""# {nome}

Estilo: `{estilo}` · categoria: {CATEGORIAS.get(estilo, estilo)}{(' · nicho: ' + nicho) if nicho else ''}.
{descricao}

## Como usar este modelo
- Assista a prévia (`previa.mp4`) e repita o **ritmo e a estrutura**: a ordem das cenas, a duração de cada uma e onde entra a chamada final.
- {'Use os arquivos de `codigo/` como base do projeto novo e troque **tudo** que é do vídeo original: marca, cores, textos, mídias, nomes e contatos.' if codigo else 'Não tem código-base: monte do zero com a skill do estilo, seguindo o que você viu na prévia.'}
- Nada do vídeo original (logo, nome, telefone, fotos, números) pode sobrar no vídeo do cliente.
""")
    print(f"modelo criado: {pasta}")
    return mid


def importar(origem, destino, categoria=None, estilo=None):
    origem = os.path.abspath(os.path.expanduser(origem))
    tmp = None
    if zipfile.is_zipfile(origem):
        tmp = os.path.join(destino, ".importando")
        shutil.rmtree(tmp, ignore_errors=True)
        with zipfile.ZipFile(origem) as z:
            for n in z.namelist():
                if ".." in n or n.startswith("/"):
                    continue
                z.extract(n, tmp)
        origem = tmp
    fichas = {}
    for raiz, _, arqs in os.walk(origem):
        if "modelos.json" in arqs:
            try:
                for f in json.load(open(os.path.join(raiz, "modelos.json"), encoding="utf-8")):
                    fichas[f.get("arquivo", "")] = (raiz, f)
            except (OSError, ValueError):
                pass
    n = 0
    for raiz, dirs, arqs in os.walk(origem):
        for a in sorted(arqs):
            if not a.lower().endswith(".mp4") or a.startswith("."):
                continue
            base = os.path.splitext(a)[0]
            f = fichas.get(a, (raiz, {}))[1]
            cod = f.get("codigo") or (base if os.path.isdir(os.path.join(raiz, base)) else None)
            adicionar(os.path.join(raiz, a), destino, f.get("nome") or base.replace("-", " ").replace("_", " ").strip(),
                      None, f.get("estilo") or estilo or "motion", f.get("nicho", ""),
                      f.get("descricao", ""), os.path.join(raiz, cod) if cod else None, float(f.get("inicio", 0)), f.get("url", ""))
            n += 1
    if tmp:
        shutil.rmtree(tmp, ignore_errors=True)
    print(f"{n} modelo(s) importado(s)")


def main():
    ap = argparse.ArgumentParser(description="Modelos do painel")
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("lista"); s.add_argument("--pasta")
    s = sub.add_parser("adicionar"); s.add_argument("video"); s.add_argument("--pasta"); s.add_argument("--destino", help="pasta de modelos (padrão: <pasta>/modelos)")
    s.add_argument("--nome", required=True); s.add_argument("--categoria", help="não é mais usado: a categoria é o estilo"); s.add_argument("--estilo", required=True)
    s.add_argument("--nicho", default=""); s.add_argument("--descricao", default=""); s.add_argument("--codigo"); s.add_argument("--inicio", type=float, default=0.0)
    s.add_argument("--url", default=""); s.add_argument("--origem", default="meu")
    s = sub.add_parser("importar"); s.add_argument("origem"); s.add_argument("--pasta", required=True); s.add_argument("--categoria"); s.add_argument("--estilo")
    a = ap.parse_args()
    if a.cmd == "lista":
        for m in lista(a.pasta):
            print(f"[{m['origem']}] {m['id']:34} {m['nome'][:34]:34} {m['categoria']:10} {m['estilo']:14} {m.get('nicho') or '':14} {'código' if m['tem_codigo'] else ''}")
    elif a.cmd == "adicionar":
        dest = a.destino or (os.path.join(os.path.abspath(os.path.expanduser(a.pasta)), "modelos") if a.pasta else None)
        if not dest:
            raise SystemExit("diga --pasta (a pasta de trabalho) ou --destino")
        os.makedirs(dest, exist_ok=True)
        adicionar(a.video, dest, a.nome, a.categoria, a.estilo, a.nicho, a.descricao, a.codigo, a.inicio, a.url, a.origem)
    else:
        dest = os.path.join(os.path.abspath(os.path.expanduser(a.pasta)), "modelos")
        os.makedirs(dest, exist_ok=True)
        importar(a.origem, dest, a.categoria, a.estilo)


if __name__ == "__main__":
    main()
