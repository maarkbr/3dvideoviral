# 3D: túnel debaixo do mar

Estilo: `video-3d` · Vídeos 3D · obras, engenharia, curiosidade. 81 s, 10 falas (versão longa, para o TikTok). Feito pelo painel.

## O que copiar deste modelo
- O roteiro problema → solução em 10 blocos: gancho (ligar a Inglaterra à França por baixo do mar + "se cavar na rocha errada, o mar invade tudo"), 8 problemas resolvidos na ordem da obra (achar a camada certa de rocha → cavar rápido com tuneladoras das duas pontas → rocha rachada e cheia de água → teto que cede atrás da máquina → onde pôr a rocha cavada → as duas pontas se encontrarem no meio → o efeito pistão do trem → incêndio e túnel de serviço) e o fechamento com o resultado e o CTA.
- A vista em corte do fundo do mar como cenário fixo: as camadas de rocha, a rota do túnel desenhada dentro da camada certa e as máquinas avançando por dentro. Uma etiqueta amarela por ideia, presa no objeto.
- Números só com fonte (o `roteiro.json` traz as `fontes` de cada fato).

## Como usar
1. `codigo/roteiro.json` é o formato (blocos com `fala`, `etapa`, `etiquetas` e as `fontes`): escreva o novo **do zero**, com fatos pesquisados e fonte. Nada de reaproveitar as falas do túnel num tema diferente.
2. `codigo/cena.js` é o motor + o mundo do túnel. Mantenha o MOTOR (câmera, etiquetas, legenda, `renderAt`), troque o MUNDO (os objetos) e escreva as TOMADAS do tema novo. Trens, barcos, veículos e pessoas vêm da biblioteca de peças (`pecas_3d.py buscar`): só desenhe a obra que muda.
3. Versão curta (Reels e Shorts): 6 blocos, com 4 problemas.
