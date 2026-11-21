# Legenda

Feita pela montagem: `M.legenda()`.

## Como ela é
- Palavra por palavra: cada palavra aparece no segundo em que é falada, com um pulinho.
- A palavra que está sendo falada fica **amarela** (`#FFD93D`); as outras, brancas.
- Letra Baloo 2 bem grossa, com contorno preto grosso e sombra embaixo.
- Pedaços de no máximo 4 palavras, cortados na pontuação e divididos em tamanhos parecidos (nunca sobra uma palavra sozinha no fim).

## Onde fica
- Topo da legenda em `y = 1350` (no CSS `.legenda`), embaixo dos pés dos personagens.
- Não desça mais: a faixa de baixo é onde o TikTok, o Reels e o Shorts põem os botões (a checagem do HyperFrames avisa com `outside_safe_zone`).

## Fala de personagem
Se a fala está num balão, tire da legenda para não repetir:
```js
M.legenda({ pular: (p) => p.bloco === 6 && p.inicio >= t('tem') });
```

## Final
A última frase precisa ficar pelo menos 2 s na tela. Por isso a duração do vídeo é o fim da fala + 1,8 s (a checagem avisa com `line_unread`).
