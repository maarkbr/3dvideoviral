#!/usr/bin/env python3
"""Busca fotos e documentos COM LICENÇA CLARA no Wikimedia Commons (API pública, sem chave) e baixa para a pasta do vídeo.
Só aceita domínio público, CC0, CC BY e CC BY-SA. Anota fonte, autor e licença em fotos/creditos.md e fotos/fotos.json.

  listar candidatos (e uma folha com as miniaturas em work/candidatos/<nome>.jpg, para olhar antes de escolher):
    python buscar_fotos.py <pasta> --nome turing --listar "Alan Turing 1951" [--n 12]
  baixar o escolhido (o título do arquivo que a listagem mostrou):
    python buscar_fotos.py <pasta> --nome turing --pegar "File:Alan Turing (1951).jpg"

Dica: busque em inglês e com o ano ("Dartmouth Hall 1950s", "New York Times 1958 front page"). Para documento
(jornal, carta, patente), procure também pelo nome do documento. Foto de pessoa viva: prefira as de evento público."""
import argparse, io, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request
from html import unescape

API = 'https://commons.wikimedia.org/w/api.php'
UA = 'estilo-colagem/1.0 (skill do Edicao com IA; uso educacional)'
OK = re.compile(r'^(public domain|pd\b|pd-|cc0|cc[- ]by(-sa)?[- ]?\d|cc[- ]by(-sa)?$|no restrictions)', re.I)

ap = argparse.ArgumentParser()
ap.add_argument('pasta'); ap.add_argument('--nome', required=True, help='nome curto do arquivo final (ex.: turing)')
ap.add_argument('--listar'); ap.add_argument('--pegar'); ap.add_argument('--n', type=int, default=12)
ap.add_argument('--largura', type=int, default=1280, help='largura baixada (tamanhos padrão do Commons: 960, 1280, 1920)')
a = ap.parse_args()
P = os.path.abspath(a.pasta); F = os.path.join(P, 'fotos'); os.makedirs(F, exist_ok=True)


def get(params):
    url = API + '?' + urllib.parse.urlencode(dict(params, format='json', formatversion=2))
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=30) as r: return json.load(r)


def baixa(url, tentativas=4):
    for k in range(tentativas):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=60) as r: return r.read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or k == tentativas - 1: raise
            time.sleep(3 * (k + 1))  # o Commons limita pedidos seguidos: espera e tenta de novo


def limpa(h): return unescape(re.sub(r'<[^>]+>', '', h or '')).strip()


def info(titulos, largura=None):
    d = get({'action': 'query', 'titles': '|'.join(titulos), 'prop': 'imageinfo', 'iiprop': 'url|size|extmetadata|mime', 'iiurlwidth': largura or a.largura})
    out = []
    for p in d['query']['pages']:
        if 'imageinfo' not in p: continue
        ii = p['imageinfo'][0]; m = ii.get('extmetadata', {})
        lic = limpa(m.get('LicenseShortName', {}).get('value'))
        out.append({'titulo': p['title'], 'licenca': lic, 'livre': bool(OK.match(lic)), 'autor': limpa(m.get('Artist', {}).get('value'))[:120],
                    'data': re.sub(r'date QS:.*', '', limpa(m.get('DateTimeOriginal', {}).get('value')))[:40], 'largura': ii.get('width'), 'altura': ii.get('height'),
                    'mime': ii.get('mime'), 'url': ii.get('thumburl') or ii['url'], 'pagina': ii.get('descriptionurl')})
    return out


if a.listar:
    d = get({'action': 'query', 'list': 'search', 'srsearch': a.listar + ' filetype:bitmap', 'srnamespace': 6, 'srlimit': max(a.n * 2, 20)})
    titulos = [s['title'] for s in d['query']['search']]
    cands = [c for c in info(titulos[:50], 330) if c['mime'] in ('image/jpeg', 'image/png', 'image/tiff')]
    livres = [c for c in cands if c['livre']][:a.n]
    print(f'{len(livres)} com licença livre (de {len(cands)} achadas) para "{a.listar}":')
    for i, c in enumerate(livres, 1):
        print(f'{i:2d}. {c["titulo"]}\n    {c["licenca"]} · {c["largura"]}x{c["altura"]} · {c["data"]} · {c["autor"][:60]}')
    try:  # folha de miniaturas para escolher olhando
        from PIL import Image, ImageDraw
        os.makedirs(os.path.join(P, 'work', 'candidatos'), exist_ok=True)
        cw, ch = 300, 300; cols = 4; rows = (len(livres) + cols - 1) // cols or 1
        folha = Image.new('RGB', (cols * cw, rows * (ch + 24)), (25, 25, 25)); dr = ImageDraw.Draw(folha)
        for i, c in enumerate(livres):
            time.sleep(0.4); im = Image.open(io.BytesIO(baixa(c['url']))).convert('RGB'); im.thumbnail((cw - 8, ch - 8))
            x, y = (i % cols) * cw, (i // cols) * (ch + 24); folha.paste(im, (x + 4, y + 24)); dr.text((x + 6, y + 5), f'{i + 1}. {c["licenca"][:28]}', fill=(255, 220, 0))
        arq = os.path.join(P, 'work', 'candidatos', a.nome + '.jpg'); folha.save(arq, quality=82); print('folha:', arq)
    except Exception as e:
        print('(sem folha de miniaturas:', e, ')')
    sys.exit(0)

if a.pegar:
    c = info([a.pegar if a.pegar.startswith('File:') else 'File:' + a.pegar])
    if not c: sys.exit('Arquivo não encontrado no Commons.')
    c = c[0]
    if not c['livre']: sys.exit(f'Licença "{c["licenca"]}" não é livre o bastante. Escolha outra (domínio público, CC0, CC BY ou CC BY-SA).')
    ext = '.png' if c['mime'] == 'image/png' else '.jpg'
    dados = baixa(c['url']); destino = os.path.join(F, a.nome + ext)
    if ext == '.jpg' and c['mime'] != 'image/jpeg':
        from PIL import Image
        Image.open(io.BytesIO(dados)).convert('RGB').save(destino, quality=92)
    else:
        open(destino, 'wb').write(dados)
    js = os.path.join(F, 'fotos.json'); reg = json.load(open(js, encoding='utf-8')) if os.path.exists(js) else {}
    reg[a.nome] = {'titulo': c['titulo'], 'pagina': c['pagina'], 'licenca': c['licenca'], 'autor': c['autor'], 'data': c['data']}
    json.dump(reg, open(js, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    linhas = ['# Créditos das fotos (Wikimedia Commons)', '', 'Licença CC BY ou CC BY-SA: ponha o crédito (título, autor, licença e link) na descrição do vídeo.', '']
    for k, v in reg.items(): linhas.append(f'- {k}: {v["titulo"].replace("File:", "")} · {v["licenca"]} · autor: {v["autor"] or "desconhecido"} · {v["pagina"]}')
    cm = os.path.join(F, 'creditos.md'); proprias = ''
    if os.path.exists(cm):  # a seção das fotos próprias do aluno é mantida
        t = open(cm, encoding='utf-8').read(); i = t.find('## Fotos próprias')
        if i >= 0: proprias = '\n' + t[i:]
    open(cm, 'w', encoding='utf-8').write('\n'.join(linhas) + '\n' + proprias)
    print(f'ok: {destino} ({c["licenca"]}), anotado em fotos/creditos.md')
