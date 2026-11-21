#!/usr/bin/env python3
"""Índice do pack de edições da pessoa: varre a pasta uma vez e separa por tipo (efeitos sonoros, sobreposições de vídeo
e trilhas por clima), para escolher o material de cada cena sem varrer de novo.

uso: python indice_pack.py <pasta do pack> [<pasta do pack 2> ...] --saida <pasta de saída (no 3D: <pasta de trabalho>/_ferramentas)>
grava pack-indice.json (os caminhos por tipo) e pack-indice.md (o resumo para ler) na saída, e o caminho do pack em config.json.
Funciona com o pack no computador ou no Google Drive para computador (não baixa nada: lê só os nomes e os tamanhos).
Depois, para cada cena: escolha os candidatos do tipo certo no índice, copie para a pasta do vídeo e ouça com o earshot."""
import json, os, re, sys, time, unicodedata
try:
    sys.stdout.reconfigure(errors='replace')  # no Windows a saída é cp1252: nome de arquivo com emoji derrubava o print final
except Exception:
    pass

arg = sys.argv[1:]
if '--saida' not in arg or arg.index('--saida') == 0: sys.exit(__doc__)
SAIDA = os.path.abspath(os.path.expanduser(arg[arg.index('--saida') + 1])); PACKS = [os.path.expanduser(a) for a in arg[:arg.index('--saida')]]
AUDIO = ('.wav', '.mp3', '.aif', '.aiff', '.m4a', '.ogg', '.flac'); VIDEO = ('.mp4', '.mov', '.webm', '.m4v')

def norm(s):
    s = unicodedata.normalize('NFKD', s.lower()); return ''.join(c for c in s if not unicodedata.combining(c))

# efeitos sonoros: tipo -> palavras do nome (português e inglês)
SFX = {
    'impacto': r'impact|boom|\bhit\b|punch|slam|thud|soco|pancada|bass drop|explos',
    'carimbo_batida_na_mesa': r'stamp|carimbo|golpe.?mesa|desk|table hit|knock',
    'papel': r'paper|papel|page|pagina|folha|flip|rustl|crumpl|tear|rasg',
    'maquina_de_escrever_teclas': r'typewrit|maquina de escrever|datilograf|keyboard|teclado|digita|\bkey\b|enter.?key',
    'caneta_risco': r'\bpen\b|caneta|pencil|lapis|marker|highlighter|scribble|rabisc|writing',
    'agua_mar': r'water|agua|ocean|\bsea\b|\bmar\b|wave|onda|splash|bubble|bolha|underwater|rain|chuva|drip|gota',
    'vento_tempestade': r'\bwind(?!ows)|vento|storm|tempest|thunder|trovao',
    'multidao_ambiente': r'crowd|multidao|people|applause|aplauso|cheer|restaurant|bar agitado|voices|ambien|cidade|city|transito|traffic',
    'interruptor_luz': r'switch|interruptor|lamp',
    'relogio': r'clock|relogio|tick|timer',
    'sino': r'bell|sino',
    'eletricidade_voltagem': r'electric|eletric|\bzap|voltage|voltagem|spark|faisca|\barc|energia|lightning|raio',
    'radio_sonar_bip': r'sonar|beep|\bbip|ping|radar|morse|telegra|radio|static',
    'camera_foto': r'camera|shutter|flash|\bfoto|photo',
    'maquina_engrenagem': r'gear|engrenagem|mechanic|motor|engine|metal',
    'sirene_buzina_apito': r'siren|sirene|horn|buzina|apito|whistle',
    'passos_portas': r'footstep|passo|door|porta',
    'whoosh_transicao': r'whoosh|woosh|swoosh|swish|transition|transicao|swipe',
    'riser_tensao': r'riser|\brise|suspense|tension|tensao|drone|braam',
    'filme_projetor': r'film|projet|projector|8mm|16mm',
}
OVER = {
    'granulado': r'grain|granul|noise|ruido',
    'poeira_riscos_filme_antigo': r'dust|poeira|scratch|risco|old film|filme antigo|8mm|16mm|vintage|retro',
    'queima_de_filme': r'burn|queima',
    'luz_vazamento': r'light leak|leak|flare|luz|light',
    'glitch': r'glitch|vhs|distort',
    'voltagem_eletricidade': r'electric|eletric|voltage|voltagem|lightning|raio|energia|spark',
}
CLIMA = {
    'tensa_suspense': r'suspense|tens|dark|frightmare|horror|thriller|scary|tragedy|trajedy|anxiety|ancestors|summoning|vanish|kidnap',
    'triste_luto': r'sad|triste|melanch|mourning|alone|violin|remember|memory|eternity|emotional|lullaby',
    'epica_trailer': r'epic|trailer|cinematic|war|warzone|throne|annihilation',
    'calma_ambiente': r'lofi|lo-fi|chill|calm|ambient|dream|night|snow|piano|journey|documentary|sunset|lotus|pond',
    'animada': r'trap|hip hop|beat|edm|dance|party|funk|rap|pop|bounce|uplift|motivational|happy',
}
EH_MUSICA = r'trilha|music|musica|song|soundtrack|ncs|no copyright|sem copy|audioblocks|ssm-'

def unicos(v, n):
    vistos, out = set(), []
    for x in v:
        b = os.path.basename(x)
        if b not in vistos: vistos.add(b); out.append(b)
        if len(out) == n: break
    return out

def tipo(nome, regras):
    n = norm(nome)
    return [k for k, r in regras.items() if re.search(r, n)]

idx = {'packs': PACKS, 'criado': time.strftime('%Y-%m-%d %H:%M'), 'efeitos': {k: [] for k in SFX}, 'sobreposicoes': {k: [] for k in OVER},
       'trilhas': {k: [] for k in CLIMA}, 'trilhas_sem_clima': [], 'efeitos_sem_tipo': 0, 'total_audio': 0, 'total_video': 0}
for pack in PACKS:
    if not os.path.isdir(pack): sys.exit(f'Não achei a pasta do pack: {pack}')
    for raiz, _, arqs in os.walk(pack):
        for a in arqs:
            c = os.path.join(raiz, a); ext = os.path.splitext(a)[1].lower(); rel = os.path.relpath(c, pack)
            if ext in AUDIO:
                idx['total_audio'] += 1
                try: tam = os.stat(c).st_size
                except OSError: tam = 0
                musica = re.search(EH_MUSICA, norm(rel)) or tam > 2_500_000
                if musica:
                    ks = tipo(a, CLIMA)
                    if ks:
                        for k in ks: idx['trilhas'][k].append(c)
                    else: idx['trilhas_sem_clima'].append(c)
                else:
                    ks = tipo(a, SFX)
                    if not ks: ks = tipo(os.path.basename(raiz), SFX)   # a pasta ajuda quando o nome do arquivo é número
                    for k in ks: idx['efeitos'][k].append(c)
                    if not ks: idx['efeitos_sem_tipo'] += 1
            elif ext in VIDEO:
                idx['total_video'] += 1
                ks = tipo(rel, OVER) if re.search(r'overlay|sobrepos|textur|film|grain|granul|dust|poeira|leak|glitch|light|luz|burn|queima', norm(rel)) else []
                for k in ks: idx['sobreposicoes'][k].append(c)

os.makedirs(SAIDA, exist_ok=True)
json.dump(idx, open(os.path.join(SAIDA, 'pack-indice.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
cfg_p = os.path.join(SAIDA, 'config.json'); cfg = json.load(open(cfg_p, encoding='utf-8')) if os.path.exists(cfg_p) else {}
cfg['pack'] = PACKS; cfg['pack_indice'] = os.path.join(SAIDA, 'pack-indice.json'); json.dump(cfg, open(cfg_p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

linhas = [f'# Índice do pack ({idx["criado"]})', '', 'Pastas: ' + ', '.join(PACKS), f'{idx["total_audio"]} áudios e {idx["total_video"]} vídeos.', '',
          '## Efeitos sonoros por tipo', '']
for k, v in idx['efeitos'].items(): linhas.append(f'- **{k}**: {len(v)}' + (' · ex.: ' + ', '.join(unicos(v, 4)) if v else ' (faltou: a cena fica só com a trilha, avise a pessoa)'))
linhas += ['', '## Sobreposições de vídeo', '']
for k, v in idx['sobreposicoes'].items(): linhas.append(f'- **{k}**: {len(v)}' + (' · ex.: ' + ', '.join(unicos(v, 3)) if v else ''))
linhas += ['', '## Trilhas por clima', '']
for k, v in idx['trilhas'].items(): linhas.append(f'- **{k}**: {len(v)}' + (' · ex.: ' + ', '.join(unicos(v, 4)) if v else ''))
linhas += ['', f'Trilhas sem clima no nome: {len(idx["trilhas_sem_clima"])}. Efeitos sem tipo no nome: {idx["efeitos_sem_tipo"]}.',
           'O nome engana: antes de usar, copie os candidatos para a pasta do vídeo e ouça (com o earshot, se tiver; senão, a pessoa ouve) (references/pack.md).']
open(os.path.join(SAIDA, 'pack-indice.md'), 'w', encoding='utf-8').write('\n'.join(linhas) + '\n')
print('\n'.join(linhas))
