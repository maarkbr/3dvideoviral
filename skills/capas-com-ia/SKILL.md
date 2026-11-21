---
name: capas-com-ia
description: Faz a capa (thumbnail) e o título dos vídeos - a capa vertical do Reels, Shorts e TikTok no fim de cada vídeo editado e, para o YouTube, 3 capas 16:9 e 3 títulos para o teste A/B, com descrição e capítulos. A capa caprichada é gerada no Higgsfield (GPT Image 2.6, créditos) com as capas da própria pessoa como modelo e quadros reais do vídeo; a capa simples é grátis e feita no computador. Use quando a pessoa pedir capa, thumbnail, thumb, miniatura, título, "teste A/B", "embalagem do vídeo", ou aprovar um vídeo no painel do Edição com IA (o painel oferece a capa).
---

# Capas com IA

A capa e o título são uma peça só: **a capa mostra o resultado e abre a pergunta; o título dá o contexto sem repetir as palavras da capa; o vídeo entrega o que os dois prometeram.** Capa que promete o que o vídeo não mostra derruba o vídeo (as redes medem quem sai logo).

Leia antes: `references/guia.md` (o método, o modelo de prompt e o que deixa a capa com cara de IA). Se o pedido veio pelo painel, siga também `references/processo-no-painel.md`.

## Por que tem um gerador de imagem no meio
O Claude escreve, pesquisa e monta, mas **não desenha uma imagem bonita sozinho**. Na primeira vez, diga isso à pessoa em uma frase e mostre as duas opções:

| | Capa caprichada | Capa simples |
|---|---|---|
| Como fica | gerada inteira no GPT Image 2.6 pelo Higgsfield: celulares ou tela com quadros reais do vídeo, ícones em 3D, luz, texto com destaque | um quadro do vídeo em destaque, o fundo desfocado e o título grande na cor da marca |
| Custo | ~2,75 créditos do Higgsfield por capa (veja o preço antes, sem gastar: `get_cost`) | zero |
| Precisa | conta no Higgsfield com plano pago (quem não tem cria em https://higgsfield.ai?fpr=lucas-28cba0) e o **Higgsfield conectado no app do Claude** (MCP) | só o Python da pasta de trabalho (com Pillow) |

## O Higgsfield pelo MCP (nada para instalar)
A pessoa liga o Higgsfield uma vez no app do Claude: **Configurações → Conectores → Adicionar conector personalizado**, nome `Higgsfield`, URL `https://mcp.higgsfield.ai/mcp`, **Conectar** e autorizar na janela do Higgsfield (a aula "Como conectar o Higgsfield no Claude", do módulo Capa e título, mostra). O Claude de terminal recebe esse conector sozinho, com a mesma conta. As ferramentas têm `higgsfield` no nome (ex.: `mcp__claude_ai_Higgsfield__generate_image`) e chegam uns segundos depois do início da conversa: procure com o ToolSearch (`higgsfield generate image`, `higgsfield media upload`).
- **Não achou nenhuma `generate_image` do Higgsfield?** Antes de concluir, espere 10 s (`sleep 10`) e procure de novo: os conectores do app podem chegar uns segundos depois de cada mensagem. Se ainda não achar, a pessoa ainda não conectou, ou ligou o **"Higgsfield AI" da lista pronta de conectores** (endereço `claude-mcp.higgsfield.ai`): esse só mostra créditos e histórico, **não gera imagem**. Explique em até 3 frases como conectar o certo (os passos acima), mande o link da conta se ela não tiver, e ofereça a capa simples enquanto isso. Nunca peça senha, token nem chave no chat.
- **Uma capa caprichada, passo a passo** (gere uma por vez e confira antes da próxima):
  1. `balance` → o saldo de créditos.
  2. **Imagens de modelo** (até 8, na ordem do prompt: Image 1 = o modelo de arte, depois os quadros, a foto ou print da pessoa, a logo): `media_upload` com `files=[{"filename": "<nome>.jpg", "content_type": "image/jpeg"}, …]` → para cada uma vem um `media_id` e um `upload_url`. Envie com `python scripts/enviar_referencias.py <arquivo1> "<upload_url1>" <arquivo2> "<upload_url2>" …` e depois `media_confirm` com `media_ids=[…]` e `type: "image"` (só os que saíram "ok"). Não use `curl` nem `media_upload_widget` (o painel não tem a janela de envio).
  3. **Preço sem gastar:** `generate_image` com `params={"model": "gpt_image_2_6", "prompt": <o prompt>, "aspect_ratio": "9:16" ou "16:9", "quality": "high", "resolution": "2k", "medias": [{"value": <media_id>, "role": "image_references"}, …], "get_cost": true}`. Diga o preço à pessoa se ela ainda não viu.
  4. **Gerar:** os mesmos `params` sem `get_cost`. Não passe `use_unlim`: se a conta tiver gerações liberadas, o Higgsfield devolve uma pergunta (`unlim_choice`) em vez de gerar; aí pergunte à pessoa e chame de novo com a resposta. Sem pasta nem projeto no Higgsfield (não crie projeto).
  5. **Esperar:** se a resposta não trouxe o link da imagem, `jobs_wait` com `jobs=[{"index": 0, "job_id": <job_id>}]` (espera até 15 s; repita até terminar). Se a chamada de gerar der tempo esgotado, **não gere de novo**: confira o job antes (gera em dobro e gasta em dobro).
  6. **Salvar:** `python scripts/salvar_capa.py "<link https do resultado>" "<Prontos>/<nome>-capa.jpg" --formato 9:16 --original "<pasta do vídeo>/capa/<nome>-capa-original.png"`.

## O que juntar antes
1. **O vídeo** (pronto ou bruto) ou, se ainda não gravou, a ideia em uma frase. Se o vídeo existe, a transcrição da edição serve; senão: `<pasta de trabalho>/_ferramentas/.venv/bin/python scripts/transcrever.py <video> <pasta do vídeo>/capa/transcricao.txt` (no Windows, `_ferramentas\.venv\Scripts\python.exe`). Anote a promessa real e os números que aparecem de verdade.
2. **As capas da pessoa que deram certo** (até 3): ficam em `marca/capas/` e o `marca.json` lista em `capas`. São o **modelo de arte** (Image 1 do prompt): é isso que faz a capa ter a cara do perfil dela e não a de todo mundo. Sem nenhuma, use as do kit (`arte/modelo-vertical.jpg`, `arte/modelo-youtube.jpg`) e sugira que ela suba as dela no painel (Marca → Capas que deram certo).
3. **A marca:** `marca.json` (cor de destaque em `acento`, `nome`, `handle`) e `marca/logo.*`.
4. **Os quadros:** `python scripts/quadros.py <video> <pasta do vídeo>/capa/quadros --n 12` → `q01.jpg`… e a folha `quadros.jpg`. Olhe só a folha `quadros.jpg` (não precisa abrir os quadros um por um) e escolha 2 ou 3 quadros que mostram o resultado, sem legenda tapando o principal.

## Capa vertical (Reels, Shorts, TikTok)
- **Texto:** até ~6 palavras em 2 linhas, com 1 a 3 palavras de destaque. Escreva o texto da capa diferente da primeira frase do vídeo, quando der.
- **Área segura:** tudo o que importa entre 14% e 84% da altura. O perfil do Instagram corta a capa em 3:4 e o app tapa o pé com a legenda e os botões.
- **Caprichada:** escreva o prompt em `<pasta do vídeo>/capa/prompt.txt` (modelo em `references/guia.md`) e siga "Uma capa caprichada, passo a passo" com `aspect_ratio` `9:16`. Imagens de modelo: o modelo de arte, 1 ou 2 quadros e, se tiver, a logo.
- **Simples:** `python scripts/capa_simples.py "<Prontos>/<nome>-capa.jpg" --formato 9:16 --texto "FIZ ESSE VÍDEO *3D* SEM SABER ANIMAR" --quadro <quadro> --cor <acento>` (as palavras entre `*` ficam na cor da marca).

## YouTube: 3 capas e 3 títulos (teste A/B)
1. **Pesquisa:** `python scripts/pesquisar.py "<pasta do vídeo>/capa/pesquisa" "busca 1" "busca 2" "busca 3"` (2 a 4 buscas do jeito que as pessoas digitam). Sai o `ranking.md` (multiplicador = views ÷ mediana do próprio canal) e a folha `capas.jpg`. Anote o padrão de título que mais superou o normal e o que as capas vencedoras mostram. Só dados públicos, sem login.
2. **Três promessas bem diferentes**, cada uma com o seu par título + texto da capa (variações pequenas deixam o teste do YouTube sem resposta). Ex.: o resultado ("SEM SABER ANIMAR"), o atalho ("NO AUTOMÁTICO"), a prova ("1 PEDIDO").
3. **Títulos:** até ~60 letras, com o assunto nas primeiras ~40 (é o que aparece no celular). Um de busca ("Como Fazer … com IA (Passo a Passo)") e dois de feed (curiosidade, prova). Número só se for real. **O título não repete as palavras da capa.**
4. **Capas 16:9:** até 3 ou 4 palavras grandes, legíveis no celular; o canto de baixo à direita fica livre (a duração aparece ali). Caprichada: `aspect_ratio` `16:9` e `salvar_capa.py --formato 16:9` (envie as imagens de modelo uma vez só e use os mesmos `media_id` nas 3 capas). Simples: `capa_simples.py --formato 16:9`.
5. **Descrição:** primeira linha = a promessa; o link que a pessoa quiser divulgar (pergunte; nunca invente); o que o vídeo mostra; capítulos tirados da transcrição (00:00 primeiro, pelo menos 3, cada um com 10 s ou mais); 3 a 5 hashtags. **Tags:** as buscas do tema, até ~500 letras.
6. Entregue `<Prontos>/<nome>-capa-A.jpg`, `-capa-B.jpg`, `-capa-C.jpg` e `<Prontos>/<nome>-titulos.md` (os 3 pares, a descrição, as tags e o comentário para fixar). Explique que no YouTube Studio as 3 capas vão em "Testar e comparar".

**Antes de pedir aprovação, escreva tudo na mensagem:** os 3 títulos, o texto de cada capa e o custo. Grave também em `<pasta do vídeo>/capa/titulos.md`. A pessoa só vê o que você escreve.

## Conferir (sempre, antes de entregar)
Abra cada capa e confira **letra por letra**: o texto, os acentos (Ç, Ã, É, Í, Ú), os números, que não apareceu texto inventado nos celulares e que nada importante saiu da área segura. O gerador às vezes erra uma letra: aí gere de novo só aquela capa (avise que gasta mais ~2,75 créditos) ou ajuste o prompt. Uma capa por vez: confira antes de gerar a próxima.

## Nunca
- Número, views, preço, depoimento ou resultado inventado.
- Logo de marca desenhado à mão; neon, feixes de luz, brilho exagerado, robô genérico (cara de IA).
- Rosto de uma pessoa real gerado do nada, nem o da própria pessoa sem foto dela (use a foto que ela mandar, como referência).
- Gastar crédito sem a pessoa ter escolhido a capa caprichada.
- Capa ou título de outro criador copiado: a pesquisa serve para entender o padrão, não para copiar.
