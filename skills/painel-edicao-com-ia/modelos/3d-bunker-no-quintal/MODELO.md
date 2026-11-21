# 3D: bunker no quintal

Estilo: `video-3d` · Vídeos 3D · construção, curiosidade. 39 s, 6 falas, voz do Lucas.

## O que copiar deste modelo
- O roteiro problema → solução: gancho (a situação + "só cavar um buraco não te salva"), 4 problemas resolvidos (chuva → concreto; radiação → terra por cima; onda de choque → entrada em curva; ar → duto com filtro), fechamento com CTA.
- A câmera: troca a cada 3–4 s (aérea, lateral baixa, corte com a parede da frente como mureta, planta, close) e se afasta no fim.
- As etiquetas amarelas presas nos objetos e a legenda de uma palavra.

## Como usar
1. `codigo/roteiro.json` é o formato do roteiro (blocos com `fala`, `etapa`, `etiquetas`, `fontes`): escreva o novo **do zero**, com fatos pesquisados e fonte. Nada de reaproveitar as falas do bunker num tema diferente.
2. `codigo/cena.js` é o motor + o mundo do bunker. Mantenha o MOTOR (câmera, `bt()`, etiquetas, legenda, `renderAt`), troque o MUNDO (os objetos) e escreva as TOMADAS do tema novo. Peças prontas da biblioteca (`pecas_3d.py buscar`) para veículos, casas e árvores.
3. Vídeo longo (TikTok): 10 blocos em vez de 6, com 8 problemas.
