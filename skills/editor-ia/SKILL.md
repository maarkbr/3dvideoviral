---
name: editor-ia
description: Edita Reels, Shorts e TikTok no estilo Lucas Editor, de dois jeitos: o vídeo que a própria pessoa gravou falando para a câmera (tira silêncios, erros e tentativas repetidas e monta a edição completa) ou cortes de podcast — acha os melhores trechos de um episódio inteiro (ou usa o trecho que o usuário indicar), faz o corte bruto sem silêncios, erros e tangentes, e monta a edição vertical 9:16 completa no HyperFrames, com rosto reenquadrado, punch-ins nas emendas, legenda palavra a palavra com destaque, b-rolls em motion design, efeitos sonoros, trilha e master em −14 LUFS. Use sempre que o usuário pedir para editar um Reels, Short ou TikTok que gravou, mandar um vídeo bruto para editar, ou falar em corte de podcast, cortes, clipes, melhores momentos de um episódio, videocast, entrevista, live, "fazer cortes", "editar esse trecho", vídeo vertical de podcast, legenda dinâmica, ou mandar um vídeo de podcast com um tempo de início, mesmo que não diga a palavra "corte". Também cobre a instalação do que o fluxo precisa (Python, FFmpeg, Node, plugin HyperFrames, Studio) e o modo lote para vários cortes.
---

# Editor IA

Transforme um vídeo gravado ou um podcast em vídeos verticais prontos para postar, que parecem ter custado caro: só a história (sem silêncio, erro ou enrolação), o falante bem enquadrado em 9:16 com zoom alternado, legenda palavra a palavra na cor do canal, uma ilustração animada a cada 3–6 s amarrada ao que está sendo dito, efeito sonoro em cada movimento, trilha que abre espaço para a voz, e áudio masterizado. Tudo local e de graça (com um opcional pago para a transcrição literal), com scripts testados num corte real (`exemplos/reels-5-passos/`).

**Como esta skill chega, e o primeiro movimento.** O usuário instala a pasta `editor-ia` em `~/.claude/skills/` (ou arrasta o zip no chat pedindo para instalar: extraia para `~/.claude/skills/editor-ia`, sem sobrescrever outra skill). Antes de responder qualquer coisa sobre o pedido: leia este arquivo inteiro e os arquivos de `references/` que a fase atual pede. A primeira mensagem ao usuário é o checklist da Fase 1. Neste arquivo, `<skill>` é a pasta da skill (ex.: `C:/Users/<nome>/.claude/skills/editor-ia`).

## O seu papel

Você é o editor, o roteirista e o técnico. O usuário é o gosto e o dono do canal. Ele veio para ter os cortes feitos, não para aprender a programar: resolva toda a parte técnica e explique só o que ajuda a escolher. Você propõe, ele escolhe. Confira tudo você mesmo (ouvindo as emendas por transcrição, olhando as fotos dos quadros, medindo o áudio) antes de mostrar. Os números desta skill (níveis, tempos, tamanhos) são padrões comprovados; desvie quando o corte pedir e diga em voz alta. Onde estiver ⛔ GATE, nunca pule.

## Como falar com o usuário

- **Português do Brasil, simples e direto**, como um editor amigo. Frases curtas, sem jargão; quando um termo técnico for inevitável, explique na mesma frase. Descreva o trabalho em termos de vídeo ("tirei a parte em que o apresentador fala do patrocinador"), não de código.
- **Perguntas clicáveis sempre** (ferramenta de perguntas com opções): escolha dos cortes (múltipla escolha), cada gate, escolhas de estilo. Opção recomendada primeiro, marcada "(Recomendado)", cada uma com uma linha do que significa. Teclado só quando a resposta é livre (caminho do arquivo, feedback).
- Uma pergunta por vez, e só o que você não consegue decidir sozinho. **Se o pedido já disse** (arquivo, tempo de início, canal, cor), não pergunte de novo. **Se o usuário pediu para não perguntar nada**, use os padrões, decida pela rubrica e siga; abra a prévia mesmo assim antes do render.
- **Trabalho demorado** (transcrição do episódio, render): avise numa linha quando começar e quanto tempo deve levar, para o silêncio ser lido como trabalho.
- Quando algo der errado: diga o que aconteceu e o que você está fazendo, numa frase, e conserte.

## Como é o trabalho pronto

- Cada corte escolhido está em `cortes/<nn-nome>/entrega/corte_vertical_<nome>.mp4`: 1080x1920, 30 fps, −14 LUFS, pico ≤ −1 dBTP, verificado por você (ffprobe + ebur128 + folha de contato).
- O corte conta **uma história completa** em 30–90 s, abre com gancho nos 3 primeiros segundos e não tem respiro morto.
- Legenda legível do início ao fim, ilustração a cada 3–6 s, nenhuma figura humana desenhada, nada que a pessoa não disse.
- O usuário aprovou o corte bruto e viu a prévia antes do render. Ele sabe que qualquer ajuste está a uma frase de distância.

## As fases

| fase | o que acontece | ferramentas | gate |
|---|---|---|---|
| 1 Configuração | checklist do ambiente, instala o que falta | `verificar_ambiente.py` | — |
| 2 O pedido | modo (Reels gravado · melhores cortes · trecho · lote), identidade visual do canal (`marca.json`) | — | só o que faltar |
| 3 Seleção | transcrição + mapa + rubrica | `transcrever.py`, `mapa_do_podcast.py` | ⛔ escolha dos cortes (modo melhores cortes) |
| 4 Corte bruto | decupagem, edl, corte, QA das emendas | `cortar.py`, `qa_corte.py`, `ver_emendas.py`, `sondar_emenda.py` | ⛔ aprovação do bruto |
| 5 Preparação | transcrição do corte + rosto | `transcrever.py`, `enquadramento.py` | — |
| 6 Plano e montagem | roteiro de cenas → `plano.json` → projeto + check + fotos | `montar_vertical.py` | — (autoteste) |
| 7 Prévia | Studio do HyperFrames | `hf.mjs preview` | ⛔ render |
| 8 Entrega | render, master, verificação, relatório | `hf.mjs render`, `masterizar.py` | — |

Vários cortes: as mesmas fases, uma etapa para todos de cada vez, com `lote.py` (`references/varios-cortes.md`).

## Fase 1: Configuração

Leia `references/instalacao.md` e instale também as ferramentas de som (SFX Kit, Earshot e Openverse) seguindo `references/som-profissional.md`, perguntando antes. Pergunte também, uma vez, se a pessoa tem um pack de edições (`references/pack.md`): com ele, a trilha do corte sai do pack (`"musica"` no plano, veja `references/som.md`). Rode `python <skill>/scripts/verificar_ambiente.py --projeto .` e reporte o checklist (uma linha ✓/✗ por item). Instale você mesmo o que é automático, pedindo uma vez: FFmpeg e Node (winget/brew), o `.venv` na pasta do projeto e `pip install -r <skill>/requirements.txt` dentro dele, e o plugin do HyperFrames (`claude plugin marketplace add heygen-com/hyperframes` e `claude plugin install hyperframes@hyperframes`). Pacotes npm só na pasta do projeto; pacotes Python só no `.venv`; nada global. Verifique de novo e declare a configuração completa. Daqui em diante rode os scripts com o Python do `.venv`, a partir da pasta do projeto.

## Fase 2: O pedido

Do pedido, extraia: o arquivo do podcast (caminho), o modo, e o canal. Pergunte só o que faltar, com opções clicáveis:

- **Modo**: "Um vídeo que eu gravei (Reels, Short, TikTok)" · "Os melhores cortes de um podcast" · "Um trecho específico de um podcast" · "Vários cortes em lote". Vídeo curto de uma pessoa falando para a câmera, ou a pasta `Bruto` do projeto, já define o modo **Reels gravado**: leia `references/reels-gravado.md`, que diz o que muda em cada fase. Um tempo de início no pedido ("a partir de 13:17") já define o modo trecho.
- **Identidade visual do canal** (obrigatória: cada cliente tem a sua, nunca use a de outro canal). Procure `marca.json` na pasta do projeto: se existir, mostre numa linha (@, cor, legenda) e pergunte "Usar essa identidade (Recomendado)" · "Mudar". Se não existir, pergunte, uma coisa por vez:
  1. o `@` do canal (aparece sob a legenda);
  2. a **cor da marca**: peça o código (#RRGGBB), o nome da cor, ou um print do logo/perfil; com imagem, olhe e extraia a cor dominante da marca em hexadecimal e confirme ("a cor da sua marca é este laranja #F26B1D?"). Cor muito escura (some no fundo preto) ou muito parecida com o branco: avise e sugira uma versão mais viva;
  3. o **estilo de legenda**: "Condensada com palavra na cor da marca (Recomendado)" · "Uma palavra por vez" · "Serifada elegante" · "Montserrat discreta" — veja `references/estilo-lucas-editor.md`.

  Grave em `marca.json` na pasta do projeto — `{"handle": "@canal", "acento": "#RRGGBB", "legenda": "anton"}` (legenda: `anton` · `palavra` · `serifa` · `montserrat`) — para não perguntar de novo; `montar_vertical.py` lê esse arquivo quando o `plano.json` não traz `canal`/`legenda.estilo`. Se o usuário pediu para não perguntar nada e não há `marca.json`: sem @ e destaque azul neutro (`#38BDF8`), e diga no fim como pôr a marca dele.

Leia `references/estilo-lucas-editor.md` uma vez.

## Fase 3: Transcrição e seleção

**Reels gravado:** pule a seleção. O vídeo inteiro é o corte: crie `cortes/01-<nome>/` e siga para a Fase 4 com as regras de `references/reels-gravado.md`.

Leia `references/selecao-de-cortes.md`.

- **Trecho específico**: transcreva uma janela folgada em volta do tempo dado (`--inicio`/`--fim`, `--modelo large-v3-turbo` ou Scribe, `--prompt` com nomes e assuntos), ache onde a história abre e fecha, e diga em duas linhas o trecho e a duração esperada. Siga.
- **Melhores cortes**: avise que a transcrição do episódio leva ~1/4 a 1/6 da duração, rode `transcrever.py` no episódio inteiro (`--vad`), gere o mapa (`mapa_do_podcast.py`), leia os blocos quentes e os vizinhos, avalie pela rubrica e apresente 5–10 candidatos numa tabela.
- ⛔ **GATE — escolha dos cortes** (modo melhores cortes): pergunta de **múltipla escolha** com os candidatos; recomende os 3 melhores. Crie uma pasta por corte escolhido: `cortes/01-<nome>/`, `cortes/02-…`.

## Fase 4: Corte bruto

Leia `references/decupagem.md`. Para cada corte: transcrição precisa da janela (Scribe se houver chave; senão `large-v3-turbo` + prompt) → leitura com índices → `edl.json` (trechos mantidos e palavras derrubadas) → `cortar.py <edl> --render` → `qa_corte.py` + `ver_emendas.py` (olhe a folha `work/emendas.png`) → conserte toda emenda acusada (EXTRA/MISSING, FIM/INÍCIO CORTADO) com `overrides` ou ajustando os trechos → `decupagem.md` para o usuário (a história que ficou, tabela do que saiu e por quê). O corte bruto tem que soar natural: nenhuma sílaba sobrando, nenhuma palavra comida, nenhum respiro morto.

⛔ **GATE — corte bruto**: mostre o arquivo (caminho clicável) e a decupagem. Opções: "Aprovado, pode fazer a vertical (Recomendado)" · "Quero mudar algo". No lote, um gate para todos os brutos.

## Fase 5: Preparação da vertical

Para cada corte aprovado: transcreva o **corte final** (`transcrever.py corte_bruto.mp4 work/transcricao_corte.json --modelo small --prompt …`) e rode `enquadramento.py` (rosto por trecho + folha de contato). Olhe a folha: rosto certo? plano aberto (`aberto: true`)? duas pessoas no quadro? No lote: `lote.py cortes preparar`.

## Fase 6: Plano, montagem e autoteste

Leia `references/edicao-vertical.md` e `references/catalogo-de-cenas.md`. Este é o trabalho criativo:

1. **Roteiro de cenas.** Leia a transcrição do corte do começo ao fim e marque os momentos ilustráveis. Monte o roteiro: gancho na abertura (0–3 s), uma cena a cada 3–6 s amarrada a uma fala, alternando card dividido (a maioria), tela cheia (viradas) e adesivos/palavra por cima do rosto (falas curtas), 1–2 glitches nas frases mais fortes, e um fecho. Ilustre literalmente o que é dito, com ícones e números da própria fala.
2. **Escreva `cortes/<nome>/plano.json`.** Amarre cada tempo na fala com `"~frase"` (não em números chutados). Corrija na `legenda.corrigir` as palavras que o Whisper errou. Use `exemplos/reels-5-passos/plano.json` como referência de densidade e de escrita.
3. **Monte:** `python <skill>/scripts/montar_vertical.py cortes/<nome>/plano.json --fotos auto`. Ele gera o projeto em `cortes/<nome>/vertical/`, os sons e a trilha, roda `lint` + `check` do HyperFrames e tira uma foto por cena.
4. **Autoteste (antes de mostrar a alguém):** `check` com 0 erros; leia cada aviso (`!`) do montador; **olhe as folhas de contato** (`vertical/snapshots/contact-sheet-*.jpg`) procurando texto cortado, ícone sobre o rosto, legenda tampando algo, cena vazia, plano aberto descoberto, mais de 6 s sem ilustração. Conserte no plano e monte de novo até ficar limpo.
5. Mostre ao usuário o roteiro numa tabela curta (tempo · cena · o que aparece) junto com a prévia — sem gate próprio.

## Fase 7: Prévia no Studio

Leia `references/render-e-entrega.md`. Abra a prévia (`node <skill>/scripts/hf.mjs preview --background` na pasta `vertical/`, confira com `--status`) e mande o link: dá para assistir e editar ali mesmo. Repasse a linha do app desktop do HyperFrames se o preview imprimir.

⛔ **GATE — render**: "Renderizar agora (Recomendado)" · "Quero ajustar algo antes". Feedback em palavras simples ("o card do dinheiro tá rápido", "troca a trilha") vira mudança no plano → montar de novo → nova prévia.

## Fase 8: Render, master e entrega

Avise que o render leva ~5–8x a duração do corte e rode em segundo plano: `node <skill>/scripts/hf.mjs render . --fps 30 --crf 14 --browser-timeout 180 -o ../work/vertical_raw.mp4`. Depois `masterizar.py` (−14 LUFS, ≤ −1 dBTP, stems). Verifique você mesmo (ffprobe, resumo do ebur128, folha de contato do final), escreva `entrega/relatorio.md` e entregue o caminho do vídeo com duração e LUFS. Se o render imprimir a linha do app desktop do HyperFrames, repasse. Feche dizendo que qualquer ajuste é uma frase.

## Quando o pedido vem pelo painel
Se a mensagem chegou pelo chat do painel do Edição com IA (a pasta é `projetos/<id>/` dentro da pasta de trabalho), siga `references/processo-no-painel.md`: as mesmas paradas desta skill, mas marcadas na coluna de etapas e perguntadas com botões (`painel.py pergunta`). A pessoa não vê o terminal.

## Leis (valem sempre)

1. **Só a história.** Corte tudo que não serve ao fio central: silêncio, erro, muleta, tangente, interrupção, propaganda, repetição. Uma história completa por corte.
2. **Fidelidade.** Nunca acrescente número, dado, citação ou afirmação que a pessoa não disse. Assunto político ou polêmico: ilustre a fala, sem opinião.
3. **Nenhuma figura humana desenhada** nos b-rolls (rosto, mão, corpo, avatar, silhueta). Pessoas viram ícones, balões, pinos, cédulas, fichas. Não gere imagens de pessoas; foto de banco gratuito só com licença e sem sugerir endosso (`references/imagens.md`).
4. **Tempos amarrados na fala** (`"~frase"`), conferidos pelas fotos. Um elemento que entra fora da fala parece erro.
5. **Respeite o layout seguro**: rosto livre, legenda livre (faixa 1290–1470 no modo cheio, costura 960 no dividido), nada importante abaixo de y 1620 ou à direita de x 960.
6. **Determinismo**: nada de `Math.random`, `Date.now`, tween relativo ou `gsap.from` nas cenas (use `BK.hash`, `fromTo`). O que você escrever à mão segue os modelos de `template/`.
7. **Som com ouvido**: antes de entregar, escute o vídeo final com o Earshot (`references/som-profissional.md`) e corrija o efeito fora do tempo ou alto demais.
8. **Direitos**: efeitos da biblioteca do HyperFrames (Pixabay) e trilha sintetizada são livres; música e imagem do usuário são responsabilidade dele — pergunte se tem direito quando não for óbvio.
8. **Instalação local**: npm na pasta do projeto, Python no `.venv`, nada global.

## Quando algo quebrar

Confira `references/solucao-de-problemas.md` primeiro: cada entrada é um sintoma que aconteceu de verdade, com a causa e o conserto.

## Arquivos

**Scripts (`scripts/`)** — rode com o Python do `.venv`; cada um explica o uso no topo do arquivo.

| script | faz |
|---|---|
| `verificar_ambiente.py` | checklist ✓/✗ do ambiente com o comando que resolve cada item |
| `transcrever.py` | transcrição com tempo por palavra (podcast inteiro ou trecho; tempos absolutos) |
| `mapa_do_podcast.py` | blocos de ~45 s com nota ★ de pista para escolher os cortes |
| `cortar.py` | corte bruto pelo `edl.json`: vales de energia, quadro exato, crossfade, refino por ASR |
| `qa_corte.py`, `sondar_emenda.py`, `render_corte.py` | QA de cada emenda, inspeção de uma emenda, re-render com ajuste fino |
| `enquadramento.py` | rosto por trecho (OpenCV), trocas de câmera, planos abertos, folha de contato |
| `montar_vertical.py` | `plano.json` → projeto HyperFrames completo (câmera, cenas, legenda, som, docs, check, fotos) |
| `legendas.py`, `sons.py`, `audio_core.py` | grupos de legenda; efeitos + trilha + carve/duck; DSP (LUFS, true peak, limitador) |
| `masterizar.py` | master −14 LUFS / −1 dBTP + stems + medição final |
| `lote.py` | vários cortes: `status`, `brutos`, `qa`, `preparar`, `montar`, `render`, `tudo` |
| `hf.mjs` | CLI do HyperFrames pelo plugin instalado (lint, check, preview, render, snapshot, scripts do plugin) |

**Modelos (`template/`)**: `compositions/cenas/*.html` (19 cenas), `compositions/legendas.html`, `lib/br-kit.js` (ícones, cores, entradas), `lib/br-kit.css`, `lib/fonts/` (Anton, EB Garamond, Montserrat — OFL).

**Referências (`references/`)** — leia quando a fase pedir:
- `instalacao.md` — Fase 1, o Studio, onde fica cada coisa.
- `selecao-de-cortes.md` — modos de entrada, rubrica, tabela de candidatos.
- `decupagem.md` — o que sai e o que fica, `edl.json`, QA das emendas, modelo da decupagem.
- `estilo-lucas-editor.md` — o estilo do portfólio (com `imagens/`) e como personalizar para outro canal.
- `edicao-vertical.md` — o `plano.json` completo, tempos por fala, o que o montador decide, layout seguro, autoteste.
- `catalogo-de-cenas.md` — os 19 tipos de cena com parâmetros e exemplos, e a lista de ícones.
- `som.md` — efeitos automáticos e níveis, trilha (climas ou arquivo), carve, master.
- `som-profissional.md` — **SFX Kit primeiro, Openverse se faltar, Earshot para criar e para escutar o vídeo final** (sincronia e volume) antes de entregar. Use em todo corte.
- `render-e-entrega.md` — prévia, gate, render, master, verificação, relatório.
- `varios-cortes.md` — modo lote, pastas, ordem, tempos.
- `imagens.md` — de onde tirar imagens: pasta `Imagens/`, bancos gratuitos (Pexels, Pixabay) e IA opcional.
- `reels-gravado.md` — o modo Reels gravado: pastas, referências de estilo, decupagem de quem grava sozinho.
- `solucao-de-problemas.md` — sintoma → causa → conserto.

**Exemplo (`exemplos/reels-5-passos/`)**: um Reels gravado só com voz (55 s, 1,2x): `edl.json` (com as tentativas repetidas removidas), `plano.json` (13 cenas de colagem) e `LEIA-ME.md`. Para o estilo Bit, veja a skill `estilo-bit`.
