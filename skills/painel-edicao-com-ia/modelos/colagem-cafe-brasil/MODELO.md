# Colagem: o café do Brasil

Estilo: `colagem` (skill `estilo-colagem`) · Colagem · economia, história, notícia, curiosidade. 15 s, vertical 9:16.
Tudo em código (HTML + GSAP no HyperFrames), com fotos de licença livre (Wikimedia) e o mapa desenhado.

## O que copiar deste modelo
- **Uma peça por frase, na palavra falada:** foto com fita, selo "1 em 3", etiqueta, ficha com o número digitado,
  carimbo, mapa com pino e etiqueta, círculo de caneta na foto.
- **Corte seco a cada ~3 s** e, dentro da cena, algo novo a cada ~1 s; a câmera empurra devagar.
- **Legenda em serifa** palavra por palavra, com a palavra-chave em itálico.
- **Número que conta** (+102 → +150 anos na liderança) e o mapa que acende o estado.

## Como usar
1. `codigo/roteiro.json` é o formato da fala, `codigo/cena.js` as peças e os tempos deste vídeo, `codigo/som.json` os
   sons e `codigo/creditos-fotos.md` como anotar as fotos. Use como referência num vídeo novo (criado pelo
   `scripts/novo_projeto.py` da skill), com fatos e fotos do tema novo.
2. Fotos só da própria pessoa ou com licença livre (`scripts/buscar_fotos.py`); fato só com duas fontes.
