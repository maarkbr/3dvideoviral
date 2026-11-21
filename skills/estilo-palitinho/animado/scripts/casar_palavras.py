#!/usr/bin/env python3
"""
Casa as palavras do ROTEIRO com os tempos da TRANSCRIÇÃO e mostra o tempo de cada bloco.

Uso:  PY <skill>/animado/scripts/casar_palavras.py <roteiro.md> <pasta-do-video>

Lê:    <roteiro.md>  (blocos "## N. (...)" com a linha "**Fala:** ...")
       <pasta>/audio/transcript.json  (saída do transcrever.py)
Grava: <pasta>/audio/palavras.json  e  <pasta>/audio/palavras.js  (usado pelo index.html)

As palavras ficam escritas como no roteiro (ex.: "tá"), com o tempo que a voz falou.
"""
import json, re, sys, difflib, unicodedata, os

if len(sys.argv) < 3:
    sys.exit(__doc__)
roteiro, pasta = sys.argv[1], sys.argv[2]
norm = lambda s: re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode())

texto = open(roteiro, encoding='utf-8').read()
blocos = re.findall(r'## (\d+)\.[^\n]*\n+\*\*Fala:\*\*\s*(.+)', texto)
if not blocos:
    sys.exit('Não achei blocos no roteiro. Cada bloco precisa de "## N. (...)" e, logo abaixo, "**Fala:** ...".')
ditas = [(int(n), w) for n, fala in blocos for w in fala.split()]
tr = json.load(open(os.path.join(pasta, 'audio', 'transcript.json'), encoding='utf-8'))

a = [norm(w) for _, w in ditas]
b = [norm(w['text']) for w in tr]
sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
tempos = [None] * len(a)
diferencas = []
for op, i1, i2, j1, j2 in sm.get_opcodes():
    if op == 'equal':
        for k in range(i2 - i1): tempos[i1 + k] = (tr[j1 + k]['start'], tr[j1 + k]['end'])
        continue
    diferencas.append((' '.join(w for _, w in ditas[i1:i2]), ' '.join(w['text'] for w in tr[j1:j2])))
    if op == 'replace' and i2 - i1 == j2 - j1:
        for k in range(i2 - i1): tempos[i1 + k] = (tr[j1 + k]['start'], tr[j1 + k]['end'])
    elif op == 'replace':  # várias palavras numa só (ou o contrário): divide o tempo
        s, e = tr[j1]['start'], tr[j2 - 1]['end']; n = i2 - i1
        for k in range(n): tempos[i1 + k] = (s + (e - s) * k / n, s + (e - s) * (k + 1) / n)

# palavra que a voz pulou: pega o tempo da vizinha
for i, tm in enumerate(tempos):
    if tm is None:
        ant = next((tempos[k] for k in range(i - 1, -1, -1) if tempos[k]), (0, 0))
        tempos[i] = (ant[1], ant[1] + 0.2)
        diferencas.append((ditas[i][1], '(não ouvida — tempo estimado)'))

saida = [{'bloco': bl, 'texto': w, 'inicio': round(s, 3), 'fim': round(e, 3)} for (bl, w), (s, e) in zip(ditas, tempos)]
json.dump(saida, open(os.path.join(pasta, 'audio', 'palavras.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
with open(os.path.join(pasta, 'audio', 'palavras.js'), 'w', encoding='utf-8') as f:
    f.write('// gerado por casar-palavras.py (tempos reais da narração)\nwindow.PALAVRAS = ' + json.dumps(saida, ensure_ascii=False) + ';\n')

print(f'{sum(1 for x in sm.get_opcodes() if x[0] == "equal" for _ in range(x[2] - x[1]))} de {len(a)} palavras bateram direto.')
for r, o in diferencas:
    print(f'  roteiro "{r}"  x  áudio "{o}"')
print('\nBLOCO | começa | termina | duração | regra 5-8 s')
for n, _ in blocos:
    ws = [p for p in saida if p['bloco'] == int(n)]
    i, f = ws[0]['inicio'], ws[-1]['fim']
    print(f'{n:>5} | {i:6.2f} | {f:7.2f} | {f - i:6.2f}s | {"ok" if 5 <= f - i <= 8 else "FORA"}')
print(f'\nFim da fala: {saida[-1]["fim"]:.2f} s  ->  duração sugerida do vídeo: {saida[-1]["fim"] + 1.8:.1f} s')
