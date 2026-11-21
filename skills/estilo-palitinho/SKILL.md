---
name: estilo-palitinho
description: Cria vídeos verticais animados (Reels, Shorts, TikTok) inteiramente em código, no formato dos canais que fazem milhões de views com animação de bonequinho - por padrão, personagens de desenho animado 2D (olhos grandes, expressões, 7 poses, boné, uniforme, sombra) dentro de um cenário 3D, com objetos que entram na palavra falada, balão de fala, legenda palavra a palavra, som feito em código e master em -14 LUFS; também o modo caprichado (cenas desenhadas e animadas pelo Higgsfield) e o palito clássico. Use quando pedirem vídeo de palitinho, stickman, stick figure, boneco de palito, desenho animado, animação de personagem contando uma história ou explicando um assunto, "você ficou trancado em…", ou escolherem o estilo Palitinho no painel do Edição com IA.
---

# Estilo Palitinho

**O que é:** um vídeo vertical 1080x1920 que conta uma história curta ou explica um assunto com personagens de desenho
animado. Tudo em código dentro do HyperFrames: não há imagem gerada e não há custo por cena; só a voz de IA custa, se a
pessoa não gravar a própria.

## Três jeitos: diga à pessoa antes de começar
> "O padrão é o **animado**: personagens de desenho animado (olhos grandes, expressões, 7 poses) num cenário 3D, com
> objetos que entram na palavra falada, legenda e som. É grátis, feito só com o Claude e esta skill. Se você quiser cada
> cena desenhada e animada por IA, dá para fazer o **caprichado** com o Higgsfield (uns 40 créditos por Short)."

- **Animado (padrão, grátis):** `animado/` desta skill. Exemplo aprovado: `animado/exemplo/` ("Trancado no shopping",
  43 s). Passo a passo logo abaixo.
- **Caprichado (Higgsfield):** ilustração de cada cena (`gerar_cenas.py`, 1 crédito) animada num clipe de 5 s
  (`animar_cenas.py`, 5 créditos), com legenda, número e "comenta" por cima em código. Um Short de 7 cenas sai por
  uns 42 créditos. Passo a passo: `references/modo-caprichado.md`. Sem conta: https://higgsfield.ai?fpr=lucas-28cba0.
- **Palito clássico** (bonequinho de traço simples, o formato antigo): só se a pessoa pedir esse visual. Está no fim
  deste arquivo ("Modo palito clássico").

**Pelo painel do Edição com IA:** siga `references/processo-no-painel.md`. A voz de IA: `references/voz-ia.md`.

## Modo animado (padrão)
Personagens 2D (`menino` e `seguranca`, mesmo esqueleto, 7 poses: parado, acenando, apontando, pensando, assustado,
comemorando, correndo) dentro de um cenário 3D (corredor de shopping à noite, Three.js), objetos que entram na palavra
falada (relógio, cama, geladeira, porta, alerta, balão de fala…), legenda palavra a palavra e som feito em código.
`A` = a pasta `animado/` desta skill; `PY` = o Python da pasta de trabalho (com faster-whisper).

**Regras de ouro**
1. **O objeto entra na palavra falada, nunca antes.** Sempre por `Objetos.naPalavra(...)`, que dá erro se adiantar.
   O som do objeto começa na mesma palavra.
2. **Capricho:** tem que parecer desenho animado de canal grande. Antes de mostrar qualquer prévia, olhe os quadros e
   melhore o que estiver pobre.
3. **Pare para aprovar** em cada etapa: roteiro, depois tempos da narração, depois quadros parados. Só renderize depois
   do "pode renderizar".
4. Nada de `requestAnimationFrame` nem `Math.random()` (quebra o render); 3D só com materiais Lambert ou Phong.

**Passo a passo** (os detalhes de cada parte estão em `A/referencia/`; leia a da etapa antes de mexer nela)
1. **Roteiro ⛔** (`A/referencia/roteiro.md`): blocos numerados com fala e cena; marque a palavra em que cada objeto entra.
   Personagens, poses e objetos que existem: `A/referencia/personagens-e-poses.md` e `A/referencia/objetos.md`.
2. **Pasta do vídeo:** `PY A/scripts/novo.py "<pasta de trabalho>/palitinho/<nome-do-video>"` (cria o projeto, copia a
   biblioteca e os modelos). Escreva o roteiro aprovado em `<pasta-do-video>/roteiro.md`.
3. **Narração ⛔:** a pessoa grava (um arquivo só, sem erros: corte antes com a skill editor-ia se precisar) ou a voz de
   IA (`references/voz-ia.md`; no Higgsfield, gere o roteiro inteiro numa fala só, para soar natural). Depois:
   `PY A/scripts/transcrever.py <pasta-do-video> <narracao.mp3>` e
   `PY A/scripts/casar_palavras.py <pasta-do-video>/roteiro.md <pasta-do-video>`. Mostre o tempo de cada bloco e de cada
   palavra de objeto.
4. **Cenas** (`A/referencia/cenario-3d.md`, `personagens-e-poses.md`, `objetos.md`, `legenda.md`): no `index.html`,
   preencha câmera, personagens, objetos (sempre com `naPalavra`), poses e legenda, tudo preso às palavras
   (`t('palavra')`, `B(bloco)`). Use o `A/exemplo/index.html` como referência. Duração = fim da fala + 1,8 s, nos 3
   `data-duration`, em `Montagem.criar` e em `som/deixas.mjs`.
5. **Som** (`A/referencia/som.md`): preencha `som/deixas.mjs` e rode `node A/scripts/som.mjs <pasta-do-video>` (perto
   de −14 LUFS). Com o pack de edições da pessoa, a trilha pode vir dele (veja "Pack de edições" abaixo).
6. **Conferir ⛔** (`A/referencia/conferencia.md`): `npx --yes hyperframes@0.9.58 check` na pasta do vídeo até dar
   `Check passed`; depois `PY A/scripts/quadros.py <pasta-do-video> "<tempos>" "<legendas>"`, abra o `quadros/folha.jpg`,
   corrija e tire de novo. Mostre os quadros e espere o "pode renderizar".
7. **Render** (em segundo plano), na pasta do vídeo:
   `npx --yes hyperframes@0.9.58 render -o renders/<nome>.mp4 --fps 30 --quality looks`.
8. **Conferir o MP4:** `PY A/scripts/conferir.py <pasta-do-video>/renders/<nome>.mp4 "<tempos>"`, olhe a folha e diga
   que o som foi medido, não ouvido.

**Cenário novo, personagem novo, objeto novo:** dá, no mesmo traço (contorno preto grosso, sombra de um lado, cores
chapadas). As receitas estão em `A/referencia/cenario-3d.md`, `personagens-e-poses.md` e `objetos.md`. Hoje a biblioteca
tem um cenário (o shopping à noite) e dois personagens: história em outro lugar pede um cenário novo antes (avise a
pessoa que essa parte leva mais tempo).

**Pack de edições:** pergunte uma vez se a pessoa tem um (o Pack Edit Pro ou outro). Os efeitos do modo animado são
feitos em código e combinam com o traço; a trilha pode sair do pack (baixinha, sem voz cantada, escolhida ouvindo).

## Temas que funcionam (pesquisa de 08/11/2026)
- **Conta que surpreende:** "1 real por segundo", "quanto tempo até o bilhão".
- **Sobrevivência e desafio:** "30 dias trancado num supermercado".
- **História curta com um porquê:** "por que temos medo do escuro".
- **Como era a vida de alguém em outra época.**
- **Explicação de um fato com números.**

Sempre um "porquê" ou um número que surpreende no bloco 1. Fato que não se confirma sai do roteiro.

## Modo palito clássico
Só quando a pessoa pede o bonequinho de traço simples. O fluxo é o mesmo do estilo Mapas: tema ⛔, roteiro ⛔
(`roteiro.json` com blocos de "fala" e "cena"), voz ⛔, `montar.py`, fotos, render, som e entrega. `S` é a pasta
`scripts/` desta skill.

### Roteiro
- **Tamanho:** de 6 a 10 blocos, de 4 a 8 segundos cada, fechando em 40 a 75 segundos.
- **Fala:** com números por extenso.
- **destaques:** as palavras que ficam vermelhas na legenda.

Cenas (o `tipo` de cada bloco):

| tipo | O que mostra | Campos |
|---|---|---|
| `titulo` | O título no papel, com um boneco | `texto`, `sub`, `pose`, `cabelo`, `camisa` |
| `historia` | Um cenário com bonecos e objetos que entram na palavra certa | `fundo` (papel, campo, noite, cidade, sala, escritorio, floresta), `bonecos` [{x, s, pose, cara, cabelo, camisa, nome}], `objetos` [{nome, x, y, s, texto, em, sai}], `acoes` [{quem, em, pose, cara, anda:{x}, pula, fala, olha, some, aparece}], `camera` {z, x, y, para:{z, x, y, em, dur}} |
| `numero` | Número grande contando, com o boneco reagindo | `rotulo`, `valor`, `prefixo`, `sufixo` ou `texto`, `sub`, `em`, `reacao` (pose), `cara` |
| `grade` | Quadradinhos (365 dias, 100 pessoas…) com destaque | `rotulo`, `total`, `colunas`, `destacar` [índices], `em`, `destaque_em` |
| `comparacao` | Dois lados com título, objeto e boneco | `esquerda`/`direita`: {titulo, objeto, pose, cara, em, cor, camisa} |
| `cta` | "Comenta" + teclas + boneco comemorando | `palavra`, `selo`, `logo` ("claude"), `antes`, `depois` |

**Vocabulário:**
- **poses:** parado, acena, aponta, apontaE, pensa, assusta, comemora, triste, bravo, duvida, mostra, corre;
- **caras:** normal, feliz, triste, bravo, assustado, surpreso, pensando;
- **cabelos:** espetado, baguncado, careca, rabo;
- **objetos:** fogueira, arvore, casa, celular, computador, dinheiro, relogio, placa, interrogacao, exclamacao, coracao, lampada, pensamento, fala, seta, trofeu, caixa, texto.

`em` é a palavra da fala em que a coisa acontece. Também aceita um número de segundos depois do início do bloco.

**Cena própria:** um `cenas.js` na pasta do vídeo com `window.CENAS_EXTRA = (api) => { api.CENA.minha = (c, i, t0, t1) => {...} }`. O `api` traz `boneco`, `objeto`, `age`, `CENARIO`, `camera`, `quando` e o resto do kit.

### Comandos
- Rascunho, sem voz: `python3 S/montar.py <pasta> --rascunho` e depois `npx --yes hyperframes@0.9.13 snapshot --at <meio de cada bloco> --no-end --output work/snap`.
- Voz:
  1. `python3 S/falas.py <pasta>`
  2. `PY S/voz_ia.py --pasta <pasta>/voz --motor higgsfield-cli --voz Marcus 1 2 3 …`. Ele confere com o Whisper; se uma fala falhar só na conferência, rode `--avaliar N`, que não gasta crédito.
  3. `PY S/montar_voz.py <pasta>`. Com a voz da própria pessoa, use `--gravacao arquivo`.
- Montar e renderizar: `python3 S/montar.py <pasta>` e `npx --yes hyperframes@0.9.13 render . --fps 30 --crf 16 -o work/video.mp4`.
- Som: `python3 S/tirar_sons.py <pasta>` e `PY S/mixar.py <pasta> <saida.mp4> [--trilha musica.mp3]`.

### Regras
- **Legenda** entre y 1270 e 1470. Nada importante embaixo dela.
- **Efeito sonoro** só onde a imagem pede: objeto entrando, número, troca de cenário e teclas. Mudança de pose não tem som.
- **Cenário escuro (noite):** o boneco fica com traço claro sozinho.
- **Números e fatos** com fonte no campo `fontes` do roteiro.
