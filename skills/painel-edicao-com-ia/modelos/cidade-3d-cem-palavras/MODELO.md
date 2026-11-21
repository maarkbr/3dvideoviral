# Cidade 3D: cem palavras por dia

Estilo: `cidade` (skill `estilo-cidade`) · Cidade 3D · histórias "nesta cidade". 62 s. Tudo em código (cidade e bonecos
em Three.js no HyperFrames, som em Python), sem custo por cena.

## O que copiar deste modelo
- **A fórmula:** a primeira frase já diz a regra absurda ("nesta cidade, cada morador só pode falar cem palavras por
  dia"); a criança é diferente dos outros, acha a brecha e, no fim, uma virada muda o sentido de tudo.
- **A cidade viva:** a praça com calçadão, coreto, padaria e igreja, os moradores fazendo coisas ao fundo, a luz que
  muda por período (dia, noite, flashback em sépia).
- **Os bonecos:** cabeçudos de bloco, com rosto desenhado, acessório (boné, chapéu, gorro) e poses; close no rosto
  quando a fala pede emoção.
- **Legenda de uma palavra**, trilha e efeitos presos às palavras.

## Como usar
1. `codigo/roteiro.txt` é o formato da fala (um bloco por linha). Escreva uma regra e uma história novas.
2. `codigo/episodio.js` são os períodos, o elenco e os planos de câmera deste episódio, e `codigo/trilha.py` a música
   e os efeitos: use como referência no projeto novo (criado pelo `scripts/novo_video.py` da skill, que já traz o
   motor, a cidade e os bonecos).
