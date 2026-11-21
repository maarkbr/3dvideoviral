"""Biblioteca de peças 3D prontas (Kenney, licença CC0: uso comercial, sem crédito) para as cenas em Three.js.
uso:
  python pecas_3d.py baixar                      baixa os pacotes do kenney.nl, guarda só os .glb + texturas + licença e gera o catálogo
  python pecas_3d.py catalogo                    refaz catalogo.json e catalogo.md (nome e tamanho de cada peça)
  python pecas_3d.py buscar navio carro          lista peças cujo nome tem as palavras (em inglês: ship, car, tree, house...)
  python pecas_3d.py usar <projeto> car-kit/sedan watercraft-kit/ship-cargo-a ...
                                                 copia as peças (e as texturas) para <projeto>/assets/pecas/<pacote>/
Pasta da biblioteca: variável PECAS_3D, senão _ferramentas/pecas-3d da pasta de trabalho (preparar_pasta.py), senão ~/ferramentas/pecas-3d.
Se a biblioteca ainda não existir, o "usar" e o "buscar" baixam antes. Só lê sites públicos; não entra em conta nenhuma."""
import glob, json, os, shutil, struct, subprocess, sys, tempfile, zipfile, http.cookiejar, urllib.request

def achar_pasta(inicio="."):
    """PECAS_3D, senão a pasta de trabalho (sobe as pastas procurando _ferramentas/estado.json), senão ~/ferramentas/pecas-3d."""
    if os.environ.get("PECAS_3D"): return os.path.expanduser(os.environ["PECAS_3D"])
    d = os.path.abspath(inicio)
    while True:
        if os.path.exists(os.path.join(d, "_ferramentas", "estado.json")): return os.path.join(d, "_ferramentas", "pecas-3d")
        nd = os.path.dirname(d)
        if nd == d: return os.path.expanduser("~/ferramentas/pecas-3d")
        d = nd
PASTA = achar_pasta()
PACOTES = ["car-kit", "watercraft-kit", "city-kit-roads", "city-kit-suburban", "city-kit-commercial", "city-kit-industrial", "nature-kit", "train-kit"]
TRAD = {"navio": "ship", "barco": "boat", "carro": "sedan", "caminhao": "truck", "caminhão": "truck", "arvore": "tree", "árvore": "tree",
        "casa": "building-type", "predio": "building", "prédio": "building", "trem": "train", "pedra": "rock", "ponte": "bridge", "poste": "light"}

def baixar():
    os.makedirs(PASTA, exist_ok=True)
    cj = http.cookiejar.CookieJar(); op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    op.addheaders = [("User-Agent", "Mozilla/5.0")]
    for p in PACOTES:
        if os.path.isdir(os.path.join(PASTA, p)) and glob.glob(os.path.join(PASTA, p, "*.glb")):
            print(f"{p}: já existe"); continue
        html = op.open(f"https://kenney.nl/assets/{p}", timeout=30).read().decode("utf-8", "ignore")
        i = html.find("data-download-id='"); did = html[i + 18:html.find("'", i + 18)]
        req = urllib.request.Request(f"https://kenney.nl/download-link/{did}", headers={"Referer": f"https://kenney.nl/assets/{p}"})
        url = json.loads(op.open(req, timeout=30).read())["url"]
        with tempfile.TemporaryDirectory() as t:
            z = os.path.join(t, "p.zip"); open(z, "wb").write(op.open(url, timeout=300).read())
            dest = os.path.join(PASTA, p); os.makedirs(dest, exist_ok=True)
            with zipfile.ZipFile(z) as zf:
                for n in zf.namelist():
                    if ".." in n or n.startswith("/"): continue  # nunca extrair fora da pasta
                    for pref in ("Models/GLB format/", "Models/GLTF format/"):
                        if n.startswith(pref) and not n.endswith("/"):
                            alvo = os.path.join(dest, n[len(pref):]); os.makedirs(os.path.dirname(alvo), exist_ok=True)
                            open(alvo, "wb").write(zf.read(n))
                    if n == "License.txt": open(os.path.join(dest, "License.txt"), "wb").write(zf.read(n))
        print(f"{p}: {len(glob.glob(os.path.join(PASTA, p, '*.glb')))} peças")
    catalogo()

def tamanho(path):
    b = open(path, "rb").read(); n = struct.unpack_from("<I", b, 12)[0]; j = json.loads(b[20:20 + n])
    mn, mx = [1e9] * 3, [-1e9] * 3
    for m in j.get("meshes", []):
        for pr in m["primitives"]:
            a = j["accessors"][pr["attributes"]["POSITION"]]
            if "min" in a: mn = [min(x, y) for x, y in zip(mn, a["min"])]; mx = [max(x, y) for x, y in zip(mx, a["max"])]
    return [round(mx[i] - mn[i], 2) for i in range(3)]

def catalogo():
    cat = {}
    for p in sorted(d for d in os.listdir(PASTA) if os.path.isdir(os.path.join(PASTA, d))):
        cat[p] = {}
        for f in sorted(glob.glob(os.path.join(PASTA, p, "*.glb"))):
            try: cat[p][os.path.basename(f)[:-4]] = tamanho(f)
            except Exception: cat[p][os.path.basename(f)[:-4]] = None
    json.dump(cat, open(os.path.join(PASTA, "catalogo.json"), "w"), indent=0)
    with open(os.path.join(PASTA, "catalogo.md"), "w") as o:
        o.write("# Peças 3D (Kenney, CC0: uso comercial, sem crédito)\n\nTamanho = largura x altura x comprimento (x, y, z). "
                "Veículos e navios apontam para +z. Na cena, use peca(nome, {comp|alt|larg: metros}, x, y, z, rotY).\n\n")
        for p, it in cat.items():
            o.write(f"## {p} ({len(it)})\n" + ", ".join(f"`{k}` {'x'.join(map(str, v))}" if v else f"`{k}`" for k, v in it.items()) + "\n\n")
    print(sum(len(v) for v in cat.values()), "peças no catálogo:", os.path.join(PASTA, "catalogo.md"))

def buscar(palavras):
    if not os.path.exists(os.path.join(PASTA, "catalogo.json")): print("biblioteca não encontrada: baixando primeiro"); baixar()
    cat = json.load(open(os.path.join(PASTA, "catalogo.json")))
    ps = [TRAD.get(w.lower(), w.lower()) for w in palavras]
    for p, it in cat.items():
        ach = [f"{k} {v}" for k, v in it.items() if any(k.lower().startswith(w) or ("-" + w) in k.lower() or ("_" + w) in k.lower() for w in ps)]
        if ach: print(f"{p}: " + ", ".join(ach))

def usar(proj, itens):
    global PASTA
    PASTA = achar_pasta(proj)
    if not os.path.exists(os.path.join(PASTA, "catalogo.json")): print("biblioteca não encontrada: baixando primeiro"); baixar()
    for it in itens:
        p, nome = it.split("/", 1); src = os.path.join(PASTA, p, nome + ".glb")
        if not os.path.exists(src): print("não achei:", it); continue
        dest = os.path.join(proj, "assets", "pecas", p); os.makedirs(dest, exist_ok=True); shutil.copy(src, dest)
        tx = os.path.join(PASTA, p, "Textures")
        if os.path.isdir(tx) and not os.path.isdir(os.path.join(dest, "Textures")): shutil.copytree(tx, os.path.join(dest, "Textures"))
        print("ok:", f"assets/pecas/{p}/{nome}.glb")

if __name__ == "__main__":
    a = sys.argv[1:] or ["-h"]
    if a[0] == "baixar": baixar()
    elif a[0] == "catalogo": catalogo()
    elif a[0] == "buscar": buscar(a[1:])
    elif a[0] == "usar" and len(a) > 2: usar(a[1], a[2:])
    else: print(__doc__)
