# 3D: represa gigante

Estilo: `video-3d` · Vídeos 3D · obras, engenharia, curiosidade. 86 s, 10 falas (versão longa, para o TikTok). Feito pelo painel.

## O que copiar deste modelo
- O roteiro problema → solução em 10 blocos: gancho (fechar um rio que transborda + "a correnteza leva o concreto"), 8 problemas resolvidos na ordem da obra (desviar o rio por túneis → barragens provisórias e leito seco → pedra solta nos paredões → concreto que racharia → blocos com água gelada → pressão maior embaixo → infiltração pela rocha → cheia maior que o lago) e o fechamento com o resultado e o CTA.
- A obra que cresce no mesmo cenário (o cânion), com vista em corte para mostrar o que está dentro (túneis, canos, pressão) e uma etiqueta amarela por ideia, presa no objeto.
- Números só com fonte (o `roteiro.json` traz as `fontes` de cada fato).

## Como usar
1. `codigo/roteiro.json` é o formato (blocos com `fala`, `etapa`, `etiquetas` e as `fontes`): escreva o novo **do zero**, com fatos pesquisados e fonte. Nada de reaproveitar as falas da represa num tema diferente.
2. `codigo/cena.js` é o motor + o mundo da represa. Mantenha o MOTOR (câmera, etiquetas, legenda, `renderAt`), troque o MUNDO (os objetos) e escreva as TOMADAS do tema novo. Veículos, casas, árvores e postes vêm da biblioteca de peças (`pecas_3d.py buscar`): só desenhe a obra que muda.
3. Versão curta (Reels e Shorts): 6 blocos, com 4 problemas.
