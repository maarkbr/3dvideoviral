# Exemplo: "Por que o café do mundo é brasileiro" (15 s, 9:16, versão v3)

Feito do zero com a skill, como um aluno: roteiro com fontes, voz de IA (Marcus, ~1,2 crédito), 4 fotos com licença do Wikimedia Commons, um mapa do Sudeste (Natural Earth) e o som do Pack Edit Pro.

- 6 cenas em 15 s (uma a cada ~2,5 s); uma peça nova a cada ~1 s.
- A assinatura inteira: foto com fita e papel atrás, selo "1 em 3", etiqueta, ficha com "37%" digitado, ano que conta até "+150" sobre uma folha, carimbo "líder mundial" e etiqueta "desde o século XIX", mapa que se desenha com pino "Vale do Paraíba", zoom em São Paulo com pinos e a rota Campinas → Santos, foto do trem, foto do porto com círculo de caneta.
- `som.json` aponta para arquivos copiados do pack para `som/pack/` (troque pelos do seu pack; sem pack, apague "sons" e "trilha.arquivo" e o mixar.py usa o SFX Kit).
- As fotos não vêm junto: baixe de novo com `buscar_fotos.py` (títulos em `creditos-fotos.md`).
- O mapa: `mapa.py <pasta> --nome sudeste --pais BRA --caixa=-53.4,-26.2,-40.2,-18.6`.
