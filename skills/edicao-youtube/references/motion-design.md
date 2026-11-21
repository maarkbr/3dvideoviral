# Motion design na identidade do canal

Três níveis, do mais simples (e mais editável pelo Lucas) ao mais trabalhado. Escolha o mais simples que
resolve a cena.

## 1. Texto nativo do CapCut (editável por ele)
`"textos"` no plano, clonando um estilo dele (`modelos.json` → `apelidos`: `titulo` = Creato Display com
"Aumentar zoom", `palavra` = "Revelar para baixo", `legenda` = branca com contorno). Bom para: palavra-chave,
número, nome de ferramenta. O Lucas troca fonte/animação no CapCut em segundos. Se ele criar presets novos
(ex.: Montserrat 900 com o amarelo), colha de novo e aponte o apelido.

## 2. Gráfico estático + animação do CapCut (`scripts/grafico.py`)
PNG 1920x1080 na identidade (Montserrat, `#FFC400`, `#0A0A0B`, creme com grade), posto como `cenas` com
`"modo": "cheia"`. O `montar.py` dá o pop de entrada (0,92 → 1 em 0,22 s) e o respiro (zoom lento). Tipos:
`cartao` (tópico/passo, escuro ou claro), `nome` (nome gigante + pílula), `pilula`, `palavra` (gigante por cima
da tela, transparente), `anel` (contorno amarelo em volta de um botão — use junto com o zoom na mesma área),
`escurecer` (por baixo da `palavra`), `logo` (logo do app/site em cartão com o nome).
Gera em segundos, custo zero, e o Lucas troca a imagem se não gostar.

## 3. Animação de verdade (HyperFrames → MP4)
Para a intro e para cenas que contam algo (grade de miniaturas com anel passando, seta antes → depois, contador,
lista com checks, barra de progresso). Base: `template/intro-kling/` (a intro publicada do vídeo do Kling 4.0:
tokens de cor, Montserrat, grade, pílulas, legenda, film burn, tudo com GSAP).
1. Copie o modelo para `NN-nome/mg/<nome>/` e troque as cenas (mantenha `:root`, fontes e classes).
2. **Sem narração e sem legenda dentro do MP4**: a voz e a legenda ficam no CapCut (editáveis). Tire
   `narracao.wav` e as `.leg` do HTML; deixe os vídeos internos `muted`.
3. Duração = a janela da cena na edição (pegue de `palavras_tl.json` as palavras onde ela entra e sai).
4. Render: `node ~/.claude/skills/edicao-youtube/scripts/hf.mjs render "<pasta>" --fps 30 -o "<pasta>/../<nome>.mp4"`.
   Confira 3 quadros (início, meio, fim) antes de usar.
5. No plano: `{"arquivo": ".../mg/<nome>.mp4", "frase": "...", "modo": "cheia", "pop": false, "respiro": false}`.
6. Mostre o **primeiro** gráfico ao Lucas antes de fazer os outros (como no vídeo do Matt: aprova o primeiro,
   depois a Claude faz o resto no mesmo padrão). Quando ele aprovar um estilo novo, registre em `preferencias.md`.

Higgsfield (conector) também gera motion graphics por código sem custo de crédito (o "motion editor" do vídeo do
Matt); use só se o Lucas pedir — o HyperFrames local já cobre e não depende de assinatura.

## Ritmo
- Intro: troca a cada 1,5–2 s. Corpo: um elemento a cada 20–40 s (padrão "média").
- Toda entrada de cena tem um som (whoosh/click/pop), ~8–10 dB abaixo da voz.
- Nada de texto em cima do que ele está mostrando na tela: cartão em tela cheia cobre a tela por 1,5–2,5 s e sai;
  palavra/pílula vai na metade de cima ou de baixo, onde a interface estiver vazia (olhe o quadro).

## Intro renderizada fora do CapCut (feita em 06/11/2026, aula "Presets no Mac")
Modelos: `template/intro-lettering/` (cartões de lettering) e o modelo do painel "YouTube: intro com prints 3D"
(prints e vídeos em perspectiva, contador, MacBook 3D). Fluxo que funcionou:
1. Fala da intro: junte os trechos do `edl.json` até a última palavra da intro com ffmpeg (atrim + concat +
   `atempo=1.15`), e a tela do mesmo jeito (trim + concat + `setpts=PTS/1.15`). Transcreva a voz resultante para
   ter o tempo de cada palavra (o Whisper erra palavra: escreva a legenda à mão).
2. Uma cena a cada 1–2,5 s, na fala: palavra gigante, plataforma num cartão com tag amarela, logo, cartão claro com
   miniaturas recortadas da própria gravação (anel amarelo passando + barra), nome gigante com pílula, palavra sobre
   a tela escurecida, comparação lado a lado, mockup de interface (barra de menus do Mac acendendo até o item certo).
3. Recorte da tela: tire um quadro (`tela_quadro.png`), meça com grade e recorte os cartões que ele mostra.
4. Trilha: `earshot rank` nas candidatas, `earshot find` no trecho mais cheio, `measure --music` para a batida;
   comece a música numa batida. Trilha ~14 dB abaixo da voz (volume 0.04 na Positive Fuse).
5. Render: `node ~/.claude/skills/edicao-youtube/scripts/hf.mjs render . --fps 30 -q delivery -o render/x.mp4` (~12 s).
   Depois `loudnorm` em 2 passadas para −14 LUFS / −1 dBTP. Arquivo com espaço/parênteses no nome: renomeie.
   SFX com silêncio no começo: `earshot measure` dá o `attack_at`; use `data-media-start`.

## Pack de edições: o que serve para o YouTube (ver `pack-de-edicoes.md`; os nomes abaixo são os do pack do Lucas — no
## da pessoa, procure pelo conteúdo)
- Ícones 3D animados COM transparência (ProRes 4444 → converta para WebM VP9 `yuva420p` para o HyperFrames):
  `ÍCONES E IMAGENS - PACK 01/3D animated icons/` (094_Download, 068_Packing Box, 095_Favorite, 083_Rocket, 10.AI_Idea…).
- Sons de interface: `Sfx Ui/` (Soft Whoosh, Sweet UI Click, Pop up [som começa em 1,98 s], Riser, Interface Click,
  MA_Equilibrio_InterfaceImpacts_05, Whoosh Deep Light 2). Mais em `PACK 3.0 - VOLTADO PARA YOUTUBE/EFEITOS SONOROS PARA YOUTUBE`.
- Trilhas sem copyright: `PACK 3.0 - VOLTADO PARA YOUTUBE/MAIS MÚSICAS SEM COPY/` (68; "Positive Fuse – French Fuse"
  é a mais "tech/tutorial" pelo earshot).
- Film burn: `CAPCUT ASSETS/FILM BURN/` e `Pack Lucas/Transições/Burn Transtion 25.mp4` (modo tela).
- Fundos: `CAPCUT ASSETS/GRID BACKGROUNDS/GRADIENT GRID OVERLAY/yellow-grid.mp4` (vertical), `Backgrounds/`.
- Banco de vídeos: `06 BANCO DE VÍDEOS/`, `PACK 3.0…/VÍDEOS GRÁTIS ALEATÓRIOS/`. Copie tudo para a pasta do vídeo antes.

## Lettering (o padrão de texto das intros do Lucas) — `template/intro-lettering/index.html`
Visto nas intros dele ("estilos de **Lettering**", "legendas *profissionais*", "texto viral **Flicker**", "7 *truques*…
*edição*"): nunca texto simples subindo. O kit do modelo:
- `.rot` rótulo pequeno em **Instrument Serif Italic** (do Pack: `FONTES DEZEMBRO/Instrument_Serif.zip`) ou `.rot-sans`
  Montserrat 600, encostado/sobreposto à palavra grande (alinhado à esquerda dela, um pouco acima).
- `.gig` Montserrat 900 com tracking negativo, ou `.gig-serifa` serifa itálica enorme na palavra-chave.
- `.am` amarelo com brilho (`--glow`), `.bw` branco com brilho suave.
- Entradas (funções no script): `letrasSobe` (letra a letra: sobe 90 px, desfoque 14 px→0, escala 1,25→1, stagger 0,04),
  `letrasDigita` (letra a letra da esquerda, desfoque — bom para serifa), `palavrasBlur` (palavra a palavra com
  desfoque e deslize), tracking que fecha com transform (letras espalhadas em x → 0; nunca anime letter-spacing:
  treme), `deriva` (zoom lento depois de entrar), saída com desfoque.
- Sublinhado amarelo que varre (`#s4-risco`), pílula amarela girada −2°.
- Cada palavra entra NO tempo em que ele fala (tempos do `voz.json`).

## Prints e vídeos em perspectiva 3D (intro do vídeo 3D, 06/11/2026) — `youtube/02-video-3d/intro/hf/`
- Contêiner `.palco { perspective: 1700px }` e o card `.p3 { transform-style: preserve-3d }`; GSAP anima `rotationY`,
  `rotationX`, `z`, `x`, `y`. Entrada de longe (z −900, rotY ±38°) → câmera "vai" no número (z +500, rotY ±6°, desloque
  x/y para o ponto ficar no centro) → anel amarelo (`.anel`, % do print) → sai para o fundo desfocado.
- Celular: `.fone` (330x586, borda 9 px) com o reel dentro; carrossel de 3 com `rotationY` em leque.
- Contador (`conta()`: tween de objeto com `onUpdate` mudando o texto) para 741, R$ 500, 100%.
- **Todo `<video>`/`<audio>` precisa de `id`**, senão o render congela/silencia (o `check` acusa `media_missing_id`).
- Prints: o número do vídeo pode não bater com o que ele falou na gravação (seguidores mudam): avise o Lucas.
- **Anel em cima de print: meça, não chute.** Ache os cards no próprio PNG (colunas/linhas escuras entre eles, com
  numpy) e ponha o anel em % do PNG (o `.anel` é border-box). A grade de reels tem uma 2ª fileira cortada embaixo:
  o anel cobre só a 1ª (y 0–80%). Confira com `hf.mjs snapshot . --at t1,t2 --no-end` antes do render. Feedback 07/11:
  anéis chutados (0,3/25,3/50,3/75,2%, altura 98%) saíram tortos e pegando a fileira de baixo.
- **Notebook**: use `template/componentes/notebook-3d.html` (MacBook prata 3D: tampa com notch e reflexo, base deitada
  com teclado, trackpad e sombra), não dois retângulos. Entrada: opacidade no `.palco` (opacity/filter num elemento
  preserve-3d achatam o 3D) e o grupo de rotY −58°/rotX −32°/z −520 até −24°/−16°/0, depois deriva até rotY −19°.
  Feedback 07/11: o notebook simples "dá para melhorar o mockup"; o MacBook 3D entrou na v3.

## Mixagem da intro (trilha com ducking)
Use `scripts/mixar_intro.py` (faz tudo abaixo, gera os stems e confere que o stem de efeitos não tem a voz).
Renderize o HTML **sem** a trilha; depois:
`ffmpeg -i render.mp4 -ss <início na batida> -t <dur> -i trilha.mp3 -i assets/voz.wav -filter_complex
"[1:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.028,equalizer=f=2500:t=q:w=1.2:g=-6,afade=t=in:d=0.3,afade=t=out:st=<dur-0.8>:d=0.8[m];
[2:a]aresample=48000,aformat=channel_layouts=stereo[k];[m][k]sidechaincompress=threshold=0.015:ratio=6:attack=20:release=400[md];
[0:a][md]amix=inputs=2:normalize=0:duration=first[mix]" -map 0:v -map "[mix]" -c:v copy -c:a pcm_s24le mix.mov`
e então `loudnorm` em 2 passadas (−14 LUFS, −1 dBTP). Extração da fala/tela da intro: `scripts/trecho_intro.py`.
