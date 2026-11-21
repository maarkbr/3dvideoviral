---
name: edicao-youtube
description: Edita vídeos longos de YouTube (16:9) no estilo Lucas Editor — aulas, tutoriais e gravações de tela, inclusive de canal dark (sem rosto). Tira erros, tentativas repetidas, silêncios, respiração e vícios de linguagem; monta a intro em motion design (lettering, prints e vídeos em perspectiva 3D); enquadra a tela sem a barra do sistema e o Dock, com zoom suave onde a pessoa aponta o mouse; sobe as falas baixas, põe trilha baixinha no vídeo inteiro e entrega em −14 LUFS. Entrega o vídeo pronto 100% no Claude (ajustes pedidos em palavras) ou, se a pessoa quiser mexer à mão, exporta o projeto para o Premiere ou o CapCut e aprende com o que ela mudou. Use quando pedirem para editar um vídeo do YouTube, vídeo longo, aula, tutorial, gravação de tela ou do OBS, canal dark, intro de YouTube, "tira os erros e os silêncios", "edita no CapCut/Premiere", ou escolherem o estilo YouTube no painel do Edição com IA. Para Reels, Shorts e cortes verticais use editor-ia.
---

# Edição de YouTube — estilo Lucas Editor

Vídeo horizontal (16:9), de 5 a 60 min, gravado pela pessoa (tela + voz, com ou sem câmera). O Claude decupa,
monta a intro em motion design, enquadra, cuida do som e entrega. O padrão de corte, intro e som está em
`references/padroes.md` (**leia antes**); o estilo das intros do canal, em `references/estilo-do-canal.md`.

## Antes de tudo
- **Pasta de trabalho** do Edição com IA (a que tem `marca.json` e `_ferramentas/`). `PY=<pasta de
  trabalho>/_ferramentas/.venv/bin/python` (rode com `$PY -I`); precisa de faster-whisper, numpy, scipy,
  opencv-python-headless e pillow (`$PY -m pip install pillow opencv-python-headless` se faltar). FFmpeg; Node e o
  HyperFrames para a intro (`node $S/hf.mjs` — acha o HyperFrames instalado ou usa o `npx hyperframes`). `S=~/.claude/skills/edicao-youtube/scripts`.
- **Sem o painel** (skill instalada sozinha): pergunte onde criar a pasta de trabalho (padrão `~/Edicao com IA/`) e
  monte o Python nela uma vez: `python3 -m venv "<pasta>/_ferramentas/.venv"` e `"<pasta>/_ferramentas/.venv/bin/python"
  -m pip install faster-whisper numpy scipy opencv-python-headless pillow` (Windows: `Scripts\python.exe`). FFmpeg
  (Mac: `brew install ffmpeg`; Windows: `winget install Gyan.FFmpeg`) e Node (só para a intro). Veja `INSTALAR.md`.
- **O que é DA PESSOA fica na pasta de trabalho** (atualizar a skill não apaga): `youtube/preferencias.md`
  (o que ela prefere — leia antes, acrescente depois de cada vídeo) e `youtube/config.json` (`"projetos"`: onde ficam
  os vídeos; `"pack"`: onde está o pack; `"resolucao"` e `"entrega"` preferidas; `"modelos_capcut"`). Não existe? Crie.
- **Um vídeo por pasta**: `V=<projetos>/<nn-nome>` (padrão `<pasta de trabalho>/youtube/<nn-nome>`), com
  `trabalho/`, `assets/`, `intro/`, `Prontos/`. Pelo painel, a pasta é `projetos/<id>/` (veja "Pelo painel").
- Gravação longa: os passos pesados (transcrição, enquadramento, render) vão em segundo plano; diga quanto leva.

## As três formas de entregar (explique à pessoa — nada disso é obrigatório)
1. **100% no Claude (padrão)**: o Claude renderiza o vídeo final (`renderizar.py`) e a pessoa pede os ajustes em
   palavras ("tira a parte em que eu falo do preço", "a música mais baixa"). Não precisa de Premiere nem de CapCut.
2. **Exportar para o Premiere**: a sequência inteira (intro + aula, cortes, faixas separadas, marcadores) num XML.
   Ela mexe à mão; o Claude lê o que ela fez pelo auto-save do Premiere, finaliza e aprende com os cortes dela
   (`references/entrega-premiere.md`).
3. **Exportar para o CapCut**: a linha do tempo escrita direto no projeto do CapCut (`references/entrega-capcut.md`).
Diga isso **no começo** ("posso te entregar pronto aqui, ou, se você quiser cortar alguma coisa à mão, exporto o
projeto para o Premiere ou o CapCut"), **depois dos cortes** (na prévia: "se achar um erro que eu deixei, me fala o
trecho — ou exporto para você cortar") e **na entrega**. Anote a escolha no `config.json` (`"entrega"`).

## Pack de edições (recomendado)
Trilha sem copyright, efeitos sonoros, transições e backgrounds fazem a diferença no acabamento. Leia
`references/pack-de-edicoes.md`: pergunte no primeiro vídeo se a pessoa tem um pack (o do estilo é o **Pack Edit
Pro**); se não tem, explique que dá para editar sem, mas que fica melhor com ele, e onde adquirir; explique como
ligar o Google Drive ao Claude (conector ou app do Drive) para o Claude achar o pack sozinho.

## Regras duras
1. **Fica a última tentativa completa** de cada frase. Nenhuma palavra da versão final pode ser comida.
2. **Fidelidade**: nenhum número, nome ou afirmação na tela que a pessoa não disse. Print/logo de terceiro só do que
   ela está mostrando; @ e bio de perfis de terceiros borrados.
3. **Material com caminho real**: copie o que vem do Drive/internet para a pasta do vídeo antes de usar.
4. **O que a pessoa editou à mão vale mais**: nunca refaça do zero por cima (leia, preserve, refaça a partir dela).
5. **Nunca toque no bruto** (a gravação original). Tudo sai em arquivos novos (`-v2`, `-v3`; nunca apague versão).
6. **Direitos**: música e efeito só do pack ou da Biblioteca de Áudio do YouTube; banco pago só com licença dela.
7. **Voz melhorada antes do render final (trava)**: o vídeo inteiro só é renderizado com a voz já passada no Adobe
   Podcast e de volta no lugar (`audio_adobe.py voltar` + `nivelar_voz.py`), com as gravações no mesmo nível. Única
   exceção: o áudio já veio tratado (arquivo com `esv2` no nome, que é o que o Adobe devolve, ou a pessoa disse que já
   tratou). Sem isso, pare antes do render: monte a pasta do Adobe (`references/adobe-podcast.md`), entregue e espere a
   volta. Prévia curta (`--ate`) pode sair antes, avisando que a voz ainda não foi tratada. Duas gravações com voz
   diferente (microfone ou programa diferente) passam juntas pelo Adobe e pelo `nivelar_voz.py`.

## Passo a passo (faça uma lista de tarefas com estes passos)

### 1. Perguntas (uma vez, juntas; pelo painel com `pergunta`)
Leia `youtube/preferencias.md` e `config.json` e pergunte só o que faltar:
- a gravação (e se há mais de uma: intro gravada à parte? câmera?) e o tema/título do vídeo;
- **a intro**: até onde vai (padrão: do começo até entrar no assunto, ~30–60 s) e se quer a intro em motion design;
- **resolução** (`scripts/resolucao.py`; grave em `trabalho/job.json` → `"resolucao"`): **Full HD** (mais leve, o
  mínimo — nunca HD 720p), **2K** (o YouTube comprime melhor a partir de 1440p) ou **4K** (o mais pesado; amplia se a
  gravação for menor). Diga o tamanho da gravação. O fps segue a gravação;
- **como quer receber** (as três formas acima);
- **o áudio já foi tratado?** (Adobe Podcast ou outro): se o arquivo tem `esv2` no nome ou ela diz que sim, segue; se
  não, a voz passa pelo Adobe antes do render final (regra dura 7, `references/adobe-podcast.md`). Pergunte também se
  todas as falas foram gravadas no mesmo microfone;
- o pack (se ainda não está no `config.json`).
Sem resposta: padrões (`padroes.md`), entrega 100% no Claude, Full HD; diga quais usou.

### 2. Transcrever FALA POR FALA e decupar
```bash
$PY -I $S/transcrever_falas.py "<bruto>" "$V/trabalho/transcricao.json" --prompt "<nomes do vídeo: apps, sites, termos>"
echo '{"video": "<bruto>", "fps": 30, "tipo": "tela", "ritmo": "dinamico", "resolucao": "<escolhida>"}' > "$V/trabalho/job.json"
$PY -I $S/decupar.py "$V/trabalho"          # frases.txt (uma linha por fala, ✂/◐ = retake/muleta) + suspeitas.txt + retakes.json
```
**Nunca decupe com a transcrição do arquivo inteiro**: o Whisper junta as tentativas repetidas numa só e some com os
falsos começos. O `transcrever_falas.py` corta o áudio em falas pelo volume e transcreve cada uma sozinha (1 h de
bruto ≈ 10 min; o modelo `small`, ~460 MB, baixa na 1ª vez para `~/.cache/edicao-youtube/whisper`).
O `decupar.py` roda o detector (`retakes.py`): fala refeita (do começo ou do meio), mesma frase dita de novo, começo
gaguejado, palavra dobrada, bloco repetido e **muletas** ("Então/E/Aí/Daí/Bom" abrindo frase após pausa; "tá?/né?"
antes de pausa). Fica a ÚLTIMA tentativa; tudo vai para `retakes.json` e o `cortes.py` aplica sozinho.

### 3. Cortes
Leia `frases.txt` inteiro (✂ = sai, ◐ = sai em parte, `[palavra]` = o que sai) e `suspeitas.txt`:
- detector errou? `"manter_retakes": [i0, ...]` no job.json (muletas: `"muletas": false` desliga todas);
- faltou tirar: `remover` (índices) / `remover_tempo` (segundos) — frase abandonada, "corta", "peraí", comentário
  fora do roteiro. Emenda dentro de palavra colada: olhe o envelope de 10 ms (`*.db10ms.npy`) e corte no começo do
  "f"/"s" (−35 a −43 dB);
- `manter_tempo`: silêncio em que algo importante acontece na tela (o resultado aparecendo).
```bash
$PY -I $S/cortes.py "$V/trabalho"               # edl.json: ritmo "dinamico" — pausa ≥ 0,12 s sai, emenda ≤ 0,08 s, sem respiração
$PY -I $S/conferir.py "$V/trabalho"             # transcreve o áudio JÁ cortado, quebrando em cada emenda → qa_transcricao.txt
```
**Caça-retakes, obrigatório antes de qualquer render** (o Whisper comum junta "sim sim" num "sim" e esconde a sobra da 1ª
tentativa e a palavra comida na emenda):
```bash
$PY -I $S/aparar_emendas.py "$V/trabalho"        # leva cada emenda ao quadro mais silencioso (os cortes andam de 33 em 33 ms)
$PY -I $S/conferir_retakes.py "$V/trabalho" [--roteiro "<roteiro.md>"]   # → trabalho/retakes_v2.md (1ª vez baixa ~1,6 GB)
$PY -I $S/achar_repeticoes.py "$V/trabalho" --limiar 2.13                # repetição curta ("as as", "do… do") → trabalho/repeticoes.md
```
Abra os dois relatórios. Cada item tem o tempo na edição e no bruto: ouça o trecho, e se for retake ou palavra cortada, ajuste
o job.json (como abaixo) e rode `cortes.py` e os três de novo. "Emenda no meio de som" nem sempre é erro (pode ser respiração):
ouça antes de mexer. Não entregue com item de retake aberto.
Leia **todo** o `qa_transcricao.txt` (✂/◐ = retake que sobrou; `PAUSA` = silêncio > 0,4 s) e repita até não sobrar
nada. O Whisper erra palavra no áudio cortado: isso não é erro de corte. Escreva `$V/decupagem.md` com cada trecho
tirado (tempo no bruto e motivo) e mostre um resumo à pessoa — é aqui que ela aprova os cortes ou pede para exportar.

### 4. Intro em motion design (se ela quiser)
Siga `references/motion-design.md` e `estilo-do-canal.md`; modelos em `template/intro-lettering/` e o modelo do
painel "YouTube: intro com prints 3D". Fala e tela da intro já cortadas:
`$PY -I $S/trecho_intro.py "$V/trabalho" <índice da última palavra> "$V/intro/hf/assets" --vel 1.15 --resolucao <a escolhida>`.
Escreva as cenas, tire snapshots (`hf.mjs snapshot`), mostre os quadros e só então renderize:
Full HD → `hf.mjs render . --fps <fps> -q delivery --crf 12 --resolution landscape`; 2K/4K → `--resolution landscape-4k`.
Som: `$PY -I $S/mixar_intro.py "$V/intro/hf" "$V" --versao v1 --video render/<render>.mp4` (efeitos sem a voz —
conferido —, trilha do pack com ducking, master; gera `render/intro_v1_mix.mov`, sem master, para o vídeo final).
O nome do arquivo da intro precisa ter "intro" (os scripts acham o fim da intro por ele).
A decupagem da intro mudou depois de animada? `remapear_intro.py PASTA_HF --ancoras ancoras.json`.

### 5. Corpo: enquadramento, volume e trilha
```bash
$PY -I $S/enquadrar_tela.py "$V/trabalho" "$V/trabalho/enquadramento.json" --intro "$V/intro/hf/render/intro_v1_mix.mov"
$PY -I $S/nivelar_voz.py   "$V/trabalho" "$V/trabalho/ganhos.json" --audio <áudio da gravação> --intro <a mesma intro>
$PY -I $S/trilha_corpo.py  "$V/trabalho" "$V/assets/trilha-corpo.wav" --voz <áudio da gravação> --intro <a mesma intro> \
     --musicas "<5–7 instrumentais calmas do pack, separadas por vírgula>"
```
- Enquadramento: base FIXA sem a barra do sistema e sem o Dock; zoom só onde o cursor fica apontando numa área
  pequena, com folga, entrando e saindo com keyframes (0,8 s). Nunca troque o quadro no corte.
- `<áudio da gravação>` = o próprio bruto, ou o melhorado do Adobe já remontado (`adobe-podcast.md`).
- Gravação que não é de tela (câmera): pule o `enquadrar_tela.py`.
- Gravação no navegador: antes de enquadrar, olhe um quadro do bruto. Se aparecem abas, endereço ou favoritos, rode o
  `enquadrar_tela.py` com `--sem-navegador` (abas mostram e-mail, código de verificação, banco) e confira um quadro do
  resultado. Nos prints da intro, recorte só a página, nunca a barra do navegador.

### 6. Entregar
**100% no Claude** — prévia curta primeiro, depois o vídeo inteiro em segundo plano:
```bash
$PY -I $S/renderizar.py "$V/trabalho" "$V/Prontos/<nome>-previa.mp4" --intro <intro_mix.mov> --audio <áudio> \
    --enquadrar "$V/trabalho/enquadramento.json" --ganhos "$V/trabalho/ganhos.json" --trilha "$V/assets/trilha-corpo.wav" --ate 120
$PY -I $S/renderizar.py "$V/trabalho" "$V/Prontos/<nome>-v1.mp4" ...as mesmas opções, sem --ate
```
Confira (quadros da intro, de um zoom e do fim; −14 LUFS) e entregue dizendo onde está, que **qualquer ajuste é uma
frase** e que, se ela quiser mexer à mão, você exporta para o Premiere ou o CapCut. Ajuste = mude o job.json /
enquadramento / trilha e renderize de novo como `-v2`.
**Premiere** → `references/entrega-premiere.md` · **CapCut** → `references/entrega-capcut.md`.

### 7. Aprender
Depois de cada vídeo, separe **preferência** (vale para os próximos) de **acidente do vídeo** e acrescente em
`<pasta de trabalho>/youtube/preferencias.md` (data, vídeo, a regra, o porquê): o que ela pediu para mudar, o que
cortou à mão no Premiere (`premiere_aprender.py`) ou no CapCut (`aprender.py`). Se uma preferência dela contradiz
`padroes.md`, a dela vale para ela.

### 8. Relatório
Duração bruta → editada, quantos cortes (retakes, muletas, silêncios), o que foi tirado de duvidoso para ela
conferir, zooms, trilha usada, resolução, onde está o arquivo e as versões.

## Tutorial ou patrocínio com a narração gravada à parte
Quando a pessoa narra depois e a tela foi gravada antes (ou pelo Claude): decupe a narração como sempre (passos 2–3),
escreva um `gerar_blocos.py` que liga cada palavra da fala ao trecho da gravação (fonte, `ss`, `vel`, `zoom`,
`rotulos`, `recorte`, `desfocar`) e monte com `scripts/montar_tutorial.py <pasta do vídeo>`. Regras (`padroes.md`):
intro em motion (`template/intro-tutorial/`: resultados em celulares 3D sem som, letreiros, páginas do produto em
perspectiva, "as 3 coisas" em cartões), enumerações/dicas/recap em cena de motion (`template/cena-lista/`), zoom no
botão citado, letreiro quando a fala cita algo que a tela não mostra, deriva lenta em toda tela, e os resultados
tocando inteiros com o som deles depois de cada "olha o resultado".

## Pelo painel
Se o pedido chegou pelo chat do painel do Edição com IA (a pasta é `projetos/<id>/`), siga
`references/processo-no-painel.md` com estas etapas: **briefing** (as perguntas do passo 1, com `pergunta`; a
gravação vem em `anexos/` ou no caminho que ela der) → **roteiro** = a decupagem (resumo dos cortes; `esperando` →
"Aprovado"/"Quero mudar algo", a menos que ela peça "faz tudo direto") → **storyboard** = os quadros da intro (se
houver intro) → **cenas** (intro, enquadramento, volume, trilha; `andando` → `feito`) → **render** (segundo plano) →
**entrega** (`Prontos/`, `--arquivo`, "Aprovado"/"Quero um ajuste"). A etapa **narracao** não se aplica (a voz é a
dela). Exportar para o Premiere/CapCut: ofereça na entrega com `pergunta`. A pessoa não vê o terminal: uma frase curta
por etapa, sem jargão.

## Onde está cada coisa
| O quê | Onde |
|---|---|
| Transcrição fala por fala · detector de retakes e muletas | `scripts/transcrever_falas.py` · `scripts/retakes.py` |
| Decupar · cortes · conferir | `scripts/decupar.py` · `scripts/cortes.py` · `scripts/conferir.py` |
| Resolução de entrega (Full HD mínimo, 2K, 4K) | `scripts/resolucao.py` |
| Intro: fala/tela cortada · mixagem e stems · reajuste de tempos | `scripts/trecho_intro.py` · `scripts/mixar_intro.py` · `scripts/remapear_intro.py` |
| Enquadramento + zoom suave · falas baixas · trilha do corpo | `scripts/enquadrar_tela.py` (+ `zoom_suave.py`) · `scripts/nivelar_voz.py` · `scripts/trilha_corpo.py` |
| Vídeo final 100% no Claude | `scripts/renderizar.py` |
| Tutorial/patrocínio com narração à parte (zoom, letreiros, deriva) · modelos de intro e de cena-lista | `scripts/montar_tutorial.py` · `template/intro-tutorial/` · `template/cena-lista/` |
| Premiere: XML · ler o auto-save · refazer sem perder a edição · aprender | `premiere_xml.py` · `premiere_ler.py` · `premiere_refazer.py` · `premiere_aprender.py` |
| CapCut: projetos, colher modelos, montar, prévia, aprender | `capcut.py` · `novo_projeto.py` · `montar.py` · `previa.py` · `aprender.py` |
| Adobe Podcast (ida e volta, som da tela) | `scripts/audio_adobe.py` · `references/adobe-podcast.md` |
| Prints do Instagram para a intro (opcional; puppeteer-core + Chrome) | `scripts/print_instagram.mjs` · `scripts/reels_instagram.mjs` |
| Logos, prints de site, b-roll | `references/imagens-e-broll.md` · `scripts/imagem_web.py` · `scripts/pexels.py` (chave só por `.env`/ambiente) |
| Componentes de motion (MacBook 3D) · modelos de intro | `template/componentes/` · `template/intro-lettering/` · `template/intro-kling/` |
| Modelo do cursor do Mac (zoom no mouse) | `references/cursor-mac.png` (+ máscara) |

## Problemas
- **Retake ou silêncio que sobrou**: está no `qa_transcricao.txt`; ajuste o job.json e rode `cortes.py` de novo.
- **Corte comeu palavra**: `manter_retakes` com o índice, ou um `remover_tempo` mais curto no envelope de 10 ms.
- **Tela pulando**: o enquadramento tem que ser o do `enquadrar_tela.py` (base fixa); nunca desloque por clipe.
- **Zoom no lugar errado**: o cursor não é a seta do Mac (Windows/outro cursor): diminua `--zoom-max` ou não use zoom;
  a base sem a barra de tarefas continua valendo (confira `topo`/`fundo` no json).
- **Som do vídeo que tocou na tela estragado/mudo** depois do Adobe: `references/adobe-podcast.md`.
- **Render lento**: `--rapido` (codificador do Mac) ou Full HD; a prévia com `--ate` antes do inteiro.
