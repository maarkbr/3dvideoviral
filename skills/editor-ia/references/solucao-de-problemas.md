# Solução de problemas (sintoma → causa → conserto)

Cada entrada aconteceu de verdade construindo o corte-modelo.

## Instalação e ambiente

- **`ffmpeg`/`node` "não encontrado" logo depois do winget** → o terminal atual não recarregou o PATH. Feche e abra o terminal do app (ou rode pelo caminho completo, ex.: `C:\Program Files\nodejs\node.exe`).
- **`pip` instala no Python do sistema** → você rodou `python -m pip` fora do `.venv`. Use sempre `.venv/Scripts/python` (Windows) ou `.venv/bin/python` (Mac).
- **OpenCV instalado mas o enquadramento diz "sem os classificadores Haar"** → veio a versão 5, que tirou os arquivos. `pip install "opencv-python-headless>=4.9,<5"`.
- **OpenCV não abre arquivo numa pasta com acento (Windows)** → o `enquadramento.py` já copia os classificadores para a pasta temporária; se aparecer em outro lugar, use caminhos sem acento ou a pasta temporária.
- **Primeira transcrição parada por minutos** → está baixando o modelo do Whisper (~0,5 GB) para `.models`. Precisa de internet só nessa vez.

## Corte bruto

- **FFmpeg recusa `-filter_complex_script`** → nas versões novas é `-/filter_complex <arquivo>` (o `render_corte.py` já usa).
- **Palavra comida no fim da frase ("porra toda" virou "porta")** → o Whisper marca o fim das palavras cedo. O `cortar.py` procura o vale de energia depois da estimativa; se ainda comer, ponha `overrides: {"<i>": {"out": <segundos da fonte>}}` com o tempo certo (ache com `sondar_emenda.py`).
- **Sobra meia sílaba de uma palavra removida** → a palavra mantida está grudada na removida (sem pausa). Remova as duas juntas ou ajuste o `in` com `overrides`.
- **Uma palavra derrubada voltou no corte** → dois trechos vizinhos foram juntados. O `cortar.py` só junta pedaços com índices de palavra seguidos; confira se o `drop` está no trecho certo.
- **Áudio e vídeo desalinham um pouco no fim** → ss fora da grade de quadros. O `cortar.py` corta no quadro exato; não recorte o `corte_bruto.mp4` com outra ferramenta.

## Montagem (HyperFrames)

- **Erro "não achei a fala '…'"** → a frase do `~` não está na transcrição do corte do jeito que você escreveu (o Whisper pode ter escrito diferente, ou uma correção mudou a palavra). Abra `work/transcricao_corte.json`, copie as palavras como estão, ou use `@segundos`.
- **Aviso "'em' cai fora da cena"** → um tempo de `params` está antes do início ou depois do fim da cena (lembre: números em `params` são locais). Ajuste a cena ou o tempo.
- **Uma chave de parâmetro virou tempo sem querer** → `em`, `t`, `ate`, `saida`, `batidas` e `*_em` são sempre tempos. Para o valor final do contador use `numero.valor` (não `ate`).
- **Card some ou fica vazio** → um id interno igual ao id da cena apaga o card. Os modelos usam `<id>-algo`; se escrever cena nova à mão, nunca repita o id do host dentro dela.
- **Texto estourando a largura** → frase longa demais para o tamanho. Os modelos encolhem a fonte por estimativa (`BK.cabe`), mas mantenha títulos até ~22 letras por linha e use `\n`.
- **Legenda em cima da boca** → abaixe `legenda.y` (padrão 1360) ou suba o rosto com `camera.rosto_y` (padrão 800, menor = rosto mais alto). Em plano muito fechado, use 1400–1450.
- **Avisos de contraste no check** → texto claro em fundo claro (ou SVG com `<text>` dentro). Mude a cor do texto/fundo; nos ícones, desenhe marcas como formas, não como texto.
- **Avisos de sobreposição (content_overlap)** → elementos que se cruzam de propósito precisam de `data-layout-allow-overlap` (os modelos já põem nos carimbos, partículas e adesivos). Se for sem querer, reposicione.
- **`lint` reclama de fonte** → só use as famílias declaradas: "LT Anton", "LT Garamond", "LT Montserrat" e "JetBrains Mono" (embutida). Nada de nome de fonte de reserva não declarado.
- **Dados JSON num `<script type="application/json">` dentro de uma cena somem** → o HyperFrames só monta o conteúdo do `<template>` e esse tipo de script não sobrevive. Os modelos recebem os dados inline (`/*PARAMS*/`).
- **Legenda fora da faixa/desalinhada no Studio** → a legenda é uma sub-composição própria (`data-track-kind="captions"`); não a coloque dentro de outra cena.
- **O Studio acrescentou `data-hf-id` no index.html** → é normal (é como ele rastreia elementos). O montador regrava o index a cada execução.
- **Animação "pula" ao voltar no tempo** → nada de tween relativo (`"+=40"`), `gsap.from` ou easing aleatório (`rough`) nas cenas: use `fromTo` com valores absolutos (os modelos já seguem isso).
- **`Math.random`/`Date.now`** → proibidos (o render precisa repetir quadro a quadro). Use `BK.hash(n)`.

## Som

- **Carve falhou** → precisa do `@hyperframes/core` da mesma versão do plugin na pasta do projeto (o montador instala). Sem rede/npm, ele usa a trilha já abaixada (`music_duck.wav`) e segue.
- **Trilha de efeitos estourando** → golpes empilhados (vários impactos no mesmo instante). Abaixe o `db` ou corte o `len` dos impactos (o montador já usa 1,3 s).
- **Efeito sintetizado em vez do arquivo** → o plugin do HyperFrames não foi achado (`node hf.mjs --where`). Instale o plugin ou aceite os sintetizados.

## Render e master

- **Render demora demais ou trava em "capturing"** → máquina fraca ou preview aberto. Pare o preview, feche abas pesadas, use `--browser-timeout 180`. O render reporta o andamento: andando devagar está tudo bem.
- **Erro do limitador no master** → o `audio_core.limiter` devolve `(sinal, redução)`; ao mexer no `masterizar.py`, desempacote os dois.
- **LUFS final fora de −14** → o master faz uma passada de correção; se o render tiver silêncio longo no fim, corte o corte bruto antes.
