#!/usr/bin/env python3
"""Cria a pasta de um documentário novo.
uso: python novo_projeto.py <pasta nova>"""
import os, shutil, sys
SK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.abspath(sys.argv[1])
if os.path.exists(os.path.join(D, 'cena.js')): sys.exit('Essa pasta já tem um documentário (cena.js). Escolha outra.')
os.makedirs(os.path.join(D, 'assets', 'fontes'), exist_ok=True)
for f in os.listdir(os.path.join(SK, 'kit')):
    o = os.path.join(SK, 'kit', f)
    if os.path.isfile(o): shutil.copy(o, os.path.join(D, 'assets', f))
for f in os.listdir(os.path.join(SK, 'kit', 'fontes')): shutil.copy(os.path.join(SK, 'kit', 'fontes', f), os.path.join(D, 'assets', 'fontes', f))
for f in ['index.html', 'index-9x16.html', 'cena.js', 'som.json', 'roteiro.json', 'hyperframes.json', 'package.json']:
    if os.path.exists(os.path.join(SK, 'modelo', f)) and not os.path.exists(os.path.join(D, f)): shutil.copy(os.path.join(SK, 'modelo', f), os.path.join(D, f))
for sub in ['fotos', 'voz', 'referencias', 'som', 'work']: os.makedirs(os.path.join(D, sub), exist_ok=True)
print('pronto:', D)
