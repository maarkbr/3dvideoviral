#!/usr/bin/env python3
"""Confere a cena.js e prepara as páginas para o render.
uso: python montar.py <pasta do vídeo>
- põe a duração (cena.dur; no 9:16, cta.fim) no data-duration de index.html e index-9x16.html;
- confere a cena: lugar que não existe, foto sem arquivo, texto datilografado que não está em "tipos", objeto fora da
  ordem do tempo, destaque grudado no anterior (menos de 0,8 s), ano sem os tempos, tempo depois do fim.
Sai com código 1 se achar erro (aviso não para)."""
import json, os, re, sys
P = os.path.abspath(sys.argv[1])
def le_js(nome):
    t = open(os.path.join(P, nome), encoding='utf-8').read().strip()
    return json.loads(re.sub(r'^window\.\w+\s*=\s*|;\s*$', '', t))
C = le_js('cena.js'); erros, avisos = [], []
lug = C.get('lugares', {}); tipos = C.get('tipos', {}); dur = C.get('dur', 0)
fotos = le_js(os.path.join('assets', 'fotos.js')) if os.path.exists(os.path.join(P, 'assets', 'fotos.js')) else {}
ultimo, lugar_ant = -1, None
for i, o in enumerate(C.get('objetos', [])):
    nome = o.get('id', f'objeto {i + 1}')
    if o.get('lugar') not in lug: erros.append(f'{nome}: lugar "{o.get("lugar")}" não está em "lugares"')
    t = o['tempos'][0] if o.get('tipo') == 'ano' else o.get('t')
    if t is None: erros.append(f'{nome}: falta o tempo ("t", ou "tempos" no ano)'); continue
    if o.get('tipo') == 'ano' and len(o.get('tempos', [])) < len(str(o.get('texto', ''))): avisos.append(f'{nome}: o ano tem menos tempos que algarismos (os últimos repetem o último tempo)')
    if t < ultimo: erros.append(f'{nome}: está antes do objeto anterior no tempo ({t} < {ultimo}); ponha os objetos na ordem em que aparecem')
    elif t - ultimo < 0.8 and ultimo >= 0: avisos.append(f'{nome}: entra {t - ultimo:.2f} s depois do anterior; dois destaques quase juntos ficam difíceis de ler')
    elif ultimo >= 0 and o.get('lugar') != lugar_ant and t - ultimo < 3.5:
        avisos.append(f'{nome}: chega {t - ultimo:.2f} s depois do anterior, em outro lugar; a câmera gasta até 2,6 s na viagem e o '
                      f'destaque anterior fica 1 s ou menos parado. Ancore um dos dois numa palavra que deixe 3,5 s ou mais entre eles')
    ultimo, lugar_ant = t, o.get('lugar')
    if t > dur: erros.append(f'{nome}: tempo {t} depois do fim ({dur})')
    if o.get('tipo') == 'foto':
        if not os.path.exists(os.path.join(P, 'assets', o.get('img', '') + '-p.jpg')): erros.append(f'{nome}: falta assets/{o.get("img")}-p.jpg (rode o preparar.py com a foto em fotos/)')
    for campo in (('titulo', 'novo') if o.get('tipo') == 'ano' else ('texto', 'titulo', 'novo')):
        if o.get(campo) and o[campo] not in tipos: erros.append(f'{nome}: "{campo}": "{o[campo]}" não está em "tipos"')
    if o.get('tipo') == 'recorte' and o.get('circulo'):
        ci = o['circulo']; fr = o.get('frase', [])
        if ci.get('linha', 99) >= len(fr) or ci.get('palavra', '') not in fr[ci['linha']]: erros.append(f'{nome}: a palavra do círculo não está na linha {ci.get("linha")} da frase')
for k, segs in tipos.items():
    for t0, t1, s in segs:
        if t1 <= t0: erros.append(f'tipos.{k}: trecho "{s.strip()}" termina antes de começar')
pv = os.path.join(P, 'voz', 'palavras.json')
if os.path.exists(pv):
    fim_fala = json.load(open(pv, encoding='utf-8'))[-1]['e']
    # o fim que o Whisper dá costuma vir cedo: mede onde o som da voz acaba de verdade
    import re as _re, subprocess as _sp
    _sd = _sp.run(['ffmpeg', '-hide_banner', '-i', os.path.join(P, 'voz', 'voz.wav'), '-af', 'silencedetect=n=-35dB:d=0.05', '-f', 'null', '-'], capture_output=True, text=True).stderr
    _ini = [float(x) for x in _re.findall(r'silence_start: ([\d.]+)', _sd)]
    _fim = [float(x) for x in _re.findall(r'silence_end: ([\d.]+)', _sd)]
    if len(_ini) > len(_fim): fim_fala = max(fim_fala, _ini[-1])   # o último silêncio vai até o fim do arquivo: a voz acaba onde ele começa
    else:   # o arquivo acaba colado no som: a voz vai até o fim dele
        _d = _re.search(r'Duration: (\d+):(\d+):([\d.]+)', _sd)
        if _d: fim_fala = max(fim_fala, int(_d.group(1)) * 3600 + int(_d.group(2)) * 60 + float(_d.group(3)))
    if dur - fim_fala < 0.6 and not C.get('fecha') is False: avisos.append(f'a fala termina em {fim_fala:.2f} s e o vídeo em {dur} s: deixe ~0,8 s de folga para o fecho (dur = {fim_fala + 0.8:.2f})')
fim9 = C.get('cta', {}).get('fim', dur)
for nome, d in [('index.html', dur), ('index-9x16.html', fim9)]:
    p = os.path.join(P, nome)
    if os.path.exists(p):
        h = open(p, encoding='utf-8').read(); h = re.sub(r'data-duration="[^"]*"', f'data-duration="{d}"', h, count=1); open(p, 'w', encoding='utf-8').write(h)
# a assinatura do estilo: mesmo num vídeo de 15 s aparecem o recorte de jornal, o círculo de caneta e o carimbo na palavra falada
objs = C.get('objetos', [])
falta = []
if not any(o.get('tipo') == 'recorte' for o in objs): falta.append('um recorte de jornal real ("tipo": "recorte", manchete traduzida, nunca inventada)')
if not any(o.get('circulo') for o in objs): falta.append('um círculo de caneta na palavra (na foto ou no recorte)')
if not any(o.get('carimbo') for o in objs): falta.append('um carimbo na palavra falada ("carimbo": {"texto", "t"})')
capitulo = C.get('abre') is False or C.get('fecha') is False
for f in falta: (avisos if capitulo else erros).append('falta a assinatura do estilo: ' + f + (' (num vídeo longo, basta em algum capítulo)' if capitulo else ''))
# mapa vazio: perto do chão só o nome do lugar segura o quadro
sem_nome = [k for k, v in lug.items() if len(v) < 3 or not v[2]]
if sem_nome and C.get('rotulos') is not False: avisos.append('lugares sem nome escrito no mapa (' + ', '.join(sem_nome) + '): ponha o nome como 3º item, ex. "paris": [2.35, 48.86, "Paris"], senão o mapa fica vazio perto da cidade')
usados = {o.get('lugar') for o in objs if o.get('tipo') != 'ano'}
if len(usados) < 2 and not capitulo: avisos.append('a história tem um lugar só: a câmera não viaja e o mapa aparece pouco; se der, conte com 2 ou mais lugares (de onde veio, para onde foi)')
for a in avisos: print('aviso:', a)
for e in erros: print('ERRO:', e)
print(f'{len(C.get("objetos", []))} objetos, {len(lug)} lugares, {dur} s' + (' · cena OK' if not erros else f' · {len(erros)} erro(s)'))
sys.exit(1 if erros else 0)
