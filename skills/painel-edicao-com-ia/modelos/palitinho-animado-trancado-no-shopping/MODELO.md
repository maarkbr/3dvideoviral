# Palitinho animado: trancado no shopping

Estilo: `palitinho` (skill `estilo-palitinho`, **modo animado**, o padrão) · Palitinho · histórias curtas e "você ficou
trancado em…". 43 s, 8 blocos. Tudo em código, sem custo por cena: só a voz de IA custa, se a pessoa não gravar a dela.

## O que copiar deste modelo
- **O roteiro em 3 regras:** a primeira frase já põe a pessoa numa situação ("você cochilou numa cama da loja de
  móveis… e acordou com o shopping trancado"); depois um momento curto por bloco; termina numa pergunta A ou B.
- **O objeto entra na palavra falada, nunca antes** (cama, relógio, geladeira, porta, alerta, balão, cartões A/B), com
  o som na mesma palavra.
- **Os personagens reagem a cada frase:** pensando, apontando, assustado, comemorando, correndo, acenando.
- **A câmera anda pelo corredor** e o efeito da história (a lanterna vindo) é feito no 3D.

## Como usar
1. `codigo/roteiro.md` mostra o formato dos blocos (fala + cena, com a palavra de cada objeto). Escreva uma história
   nova do zero.
2. `codigo/index.html` são as cenas deste vídeo e `codigo/deixas.mjs` os sons: use como referência no
   `index.html` do vídeo novo (criado pelo `animado/scripts/novo.py` da skill), trocando os tempos pelas palavras
   da nova narração.
3. A biblioteca (personagens, objetos, cenário, montagem) vem da skill (`animado/biblioteca/`), não deste modelo.
