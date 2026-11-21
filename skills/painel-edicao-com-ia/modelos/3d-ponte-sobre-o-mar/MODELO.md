# 3D: ponte sobre o mar

Estilo: `video-3d` · Vídeos 3D · engenharia, curiosidade. 39 s, 6 falas.

## O que copiar deste modelo
- Obra grande em água: fundações afundando, torres subindo, cabos entrando um a um, tabuleiro avançando dos dois lados. Cada fala é uma etapa visível.
- Uso das **peças prontas** (Kenney, CC0): navios, carros e árvores da biblioteca `_ferramentas/pecas-3d` (`carregaPecas([...])` no começo do `cena.js`; as peças são copiadas com `pecas_3d.py usar`).
- A câmera baixa, na altura da água, nas tomadas de impacto.

## Como usar
1. Roteiro novo do zero em `roteiro.json` (fatos com fonte). Mantenha o formato de `codigo/roteiro.json`.
2. `codigo/cena.js`: mantenha o MOTOR, troque o MUNDO e as TOMADAS. Antes de montar, copie as peças que o novo mundo usa: `python scripts/pecas_3d.py usar <pasta> car-kit/sedan watercraft-kit/ship-cargo-a …` (confira o tamanho no snapshot: carro ≈ 1,3 m quando a pista tem 4,4 m).
3. Conferir nos snapshots: céu aparecendo por baixo do terreno, parede tampando a obra, etiqueta fora da tela.
