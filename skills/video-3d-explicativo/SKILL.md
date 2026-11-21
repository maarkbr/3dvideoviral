---
name: video-3d-explicativo
description: Cria Reels, Shorts e TikToks verticais 3D que EXPLICAM uma notícia, um conceito ou uma história (60 a 90 s), no estilo dos perfis que viralizam com cenário 3D e câmera sempre em movimento (auditório, palco, cortina, plateia, notas de dinheiro, linha do tempo, letras, quadro, celular, prédios, cartões). Cada frase do roteiro vira uma cena própria, o fundo muda de cor a cada ideia e as etiquetas amarelas mostram os números. Use quando pedirem "vídeo 3D explicando X", "explicar uma notícia em 3D", "animação 3D de história", "por que custou tanto", ou escolherem o estilo 3D explicativo no painel do Edição com IA. Para "como é construído" (uma obra low poly que avança por etapas), use a skill video-3d. Precisa da skill video-3d instalada (usa os scripts dela).
---

# Vídeo 3D explicativo

Um palco 3D em código (Three.js dentro do HyperFrames) onde **cada frase da narração vira uma cena**: o dinheiro sobe em pilha, a cortina abre, a linha do tempo cresce, as letras mudam, o celular junta os aplicativos, os prédios trocam a placa, um número grande aparece. A câmera nunca para e voa de uma cena para a outra.

Diferença para a skill `video-3d`: lá, **uma obra** avança por etapas num mundo só ("como é construído um túnel"). Aqui, **uma história** é contada cena por cena ("por que um logo custou 3,5 milhões"). Os scripts são os da `video-3d` (`novo_projeto_3d.py`, `voz_3d.py`, `montar_3d.py`, `finalizar_3d.py`); o motor e as cenas estão em `modelo/cena.js`.

Leia antes: `references/analise-referencia.md` (o que um vídeo desse estilo faz, quadro a quadro, e como reproduzir em código).

## Fluxo (pare para a pessoa aprovar onde está ⛔)
1. **Pesquisa e roteiro ⛔.**
   - 60 a 90 s (170 a 250 palavras): é história, precisa de contexto. Uma promessa só.
   - Gancho contraintuitivo nos 3 primeiros segundos ("3,5 milhões por um logo… sendo que a IA faz um por quase nada"), frases curtas, curiosidade aberta até o fim, um "comenta PALAVRA" com uma recompensa que exista.
   - **Cada fato com 2 fontes.** O que tiver só uma sai, ou entra como "segundo o jornal X". Conta feita por você (divisão, comparação) aparece como "conta nossa".
   - No `roteiro.json` (formato do `modelo/roteiro.json`): um bloco por frase, com `fala`, `etapa` (o que aparece) e `etiquetas` (`txt` curto em caixa alta, `p` = posição 3D, `de`/`ate` em segundos numa escala de 0 a 10 do bloco). Números por extenso na fala.
2. **Projeto.** `python3 ~/.claude/skills/video-3d/scripts/novo_projeto_3d.py <pasta>` e copie o `modelo/cena.js` desta skill por cima do `cena.js` criado. Ponha o `roteiro.json` aprovado na pasta.
3. **Voz.** A voz escolhida na instalação (a própria pessoa ou voz de IA; veja `references/voz-ia.md` da `video-3d`).
   - Voz gravada: decupe fala por fala (seção "Decupagem da voz gravada" da skill estilo-bit), fique com a última tentativa completa de cada frase e rode `voz_3d.py <pasta> --gravacao <voz-limpa.wav>`.
   - Voz de IA: uma fala por bloco e `voz_3d.py <pasta> --falas voz/f1.wav … voz/fN.wav`.
   - Confira a transcrição do áudio final: sem palavra repetida nem pedaço de outra tentativa.
4. **Cenas ⛔.** Cada bloco tem uma cena em `renderAt(t)`: `B[i]` é o início da fala do bloco `i`, `bt(i, s)` é o segundo `s` (de 0 a 10) dentro dele, `T` tem as tomadas de câmera (uma ou duas por bloco) e `BG` a cor de fundo de cada bloco. Troque o que muda pelo tema e mantenha as regras abaixo.
5. **Olhar, renderizar, entregar.**
   - `python3 ~/.claude/skills/video-3d/scripts/montar_3d.py <pasta>`.
   - Fotos: `npx --yes hyperframes@0.9.13 snapshot --at <um tempo por cena> --no-end --output work/snap`. Olhe todas: texto cortado na borda, objeto na frente da câmera, parede tampando a cena, cena vazia.
   - **Som.** Pergunte uma vez se a pessoa tem um pack de edições (o Pack Edit Pro ou outro), como no passo do som da skill `video-3d` (`references/pack.md` dela indexa a pasta). Com o pack, a trilha e o whoosh saem dele, escolhidos ouvindo; sem pack, do SFX Kit (`_ferramentas/sfx-kit`). Sem trilha o fim do vídeo fica mudo e o conferidor reprova.
   - `npx --yes hyperframes@0.9.13 render . --fps 30 --crf 16 -o work/video.mp4` e `python3 ~/.claude/skills/video-3d/scripts/finalizar_3d.py <pasta> "<Prontos>/<nome>.mp4" --trilha <trilha> --whoosh <whoosh> --cortes <início de cada fala menos a primeira, separados por vírgula>` (os inícios estão em `voz/blocos.json`; áudio em −14 LUFS).
   - Capa: skill capas-com-ia.

## As cenas prontas do `modelo/cena.js` (cada uma é um bloco e pode ser trocada)
| Cena | O que faz | Serve para |
|---|---|---|
| maço de notas + notas caindo | o valor sobe em pilha na mesa, na frente da plateia | gancho de custo ou dinheiro |
| item barato ao lado do maço | um objeto pequeno, desenhado por nós, contra a pilha de dinheiro | contraste ("a IA faz por quase nada") |
| virada | a cortina abre e o palco aparece | "só que pouca gente sabe…" |
| linha do tempo | barra que cresce entre dois anos | datas, prazos |
| pesquisa | bolhas de resposta sobre a plateia | pesquisa, opinião, público |
| letras | blocos que nascem diferentes e ficam iguais | mudança de desenho, padrão |
| quadro + peças | um símbolo montado por 4 peças que entram girando | o produto, o símbolo, a ideia central |
| placa | texto grande na placa do palco | slogan, frase-chave |
| celular + ícones | ícones voam e viram um app só | digital, aplicativo, unificação |
| prédios/cidade | fachadas com porta, janela, toldo e placa que troca; a rede muda de cor | lojas, agências, escala física |
| conta | número grande + "conta nossa" pequeno embaixo | comparação, escala |
| cartões | cartões com pictogramas voam e formam uma parede | "é um sistema", muitas peças |
| símbolo girando + comenta | o símbolo grande gira com a palavra do comentário | chamada final |

## Regras
- **Câmera sempre em movimento** e voo de 0,9 s entre as tomadas (nada de corte seco). Fundo trocando de cor a cada ideia.
- **Etiquetas** amarelas presas no objeto e travadas dentro da área segura (o código já limita x e y). Legenda de uma palavra com o texto do roteiro.
- **Nunca emoji.** Objetos desenhados em código; ícones 3D da biblioteca da skill estilo-mapas (`icones3d/`), se ela estiver instalada.
- **Imagem real (logo, foto) só de fonte de imprensa ou do próprio dono**, com crédito na tela e a fonte salva num `.txt` na pasta do vídeo. Sem imagem limpa e confiável, use um símbolo desenhado por você e avise a pessoa.
- **Texto nas bordas:** objetos largos (placas) pedem a câmera mais afastada; confira nos quadros.
- **Paredes laterais** somem quando a câmera sai do palco para a cidade (`paredes[…].visible`), senão tampam a cena.
- É uma base com formas simples e luz de palco. Para mais acabamento, gere texturas ou ícones no GPT Image (Higgsfield), até 30 créditos por peça, mostrando o custo antes.

## Quando o pedido vem pelo painel
Se a mensagem chegou pelo chat do painel do Edição com IA, siga as mesmas paradas, marcadas na coluna de etapas e perguntadas com botões (`painel.py pergunta`), como em `references/processo-no-painel.md` da skill `video-3d`. A pessoa não vê o terminal.
