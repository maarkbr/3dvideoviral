#!/usr/bin/env python3
"""Mostra a narração frase por frase com o tempo de cada palavra (de voz/palavras.json), para escrever a cena.js.
uso: python palavras.py <pasta do vídeo>"""
import json, os, sys
P = os.path.abspath(sys.argv[1]); pal = json.load(open(os.path.join(P, 'voz', 'palavras.json'), encoding='utf-8'))
linha, ini = [], None
for w in pal:
    if ini is None: ini = w['s']
    linha.append(f"{w['w']}@{w['s']:.2f}")
    if w['w'].rstrip().endswith(('.', '?', '!', ':')):
        print(f'[{ini:6.2f}] ' + ' '.join(linha)); linha, ini = [], None
if linha: print(f'[{ini:6.2f}] ' + ' '.join(linha))
print(f'fim da fala: {pal[-1]["e"]:.2f} s')
