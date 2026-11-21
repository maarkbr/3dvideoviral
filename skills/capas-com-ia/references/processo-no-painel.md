# Capa e título quando o trabalho vem pelo painel

O `painel.py` está em `~/.claude/skills/painel-edicao-com-ia/scripts/`. `<projeto>` é a pasta do projeto (`<pasta de trabalho>/projetos/<id>/`). A pessoa não vê o terminal: ela vê o chat, os cartões e a coluna de etapas.

**Duas regras que valem para tudo abaixo:**
- **Marcar uma etapa como `esperando` já cria o cartão com os botões.** Não chame o `pergunta` de novo para a mesma decisão (sai cartão repetido).
- **O painel só mostra o que você escreve na sua resposta.** Tudo o que a pessoa precisa ler para decidir (os títulos, o texto das capas, o custo) vai escrito por inteiro na sua mensagem, antes de você parar. Nunca diga "estão acima" sem ter escrito.

## 1. Capa no fim de um vídeo vertical (Reels, Shorts, TikTok)
Quando a pessoa clicar **Aprovado** na entrega de um vídeo vertical:
1. Marque `python3 painel.py etapa "<projeto>" capa esperando "Quer uma capa para este vídeo?"`. O painel mostra sozinho o cartão com 3 botões: **"Capa caprichada (Higgsfield, ~3 créditos)"**, **"Capa simples (grátis)"** e **"Não precisa"**. Pare e espere a escolha.
   - Vídeo deitado (YouTube): em vez disso, ofereça com `pergunta` as 3 capas e os 3 títulos do teste A/B (passo 2).
2. **"Não precisa":** `etapa capa feito "Sem capa desta vez"` (sem `--arquivo`) e encerre como de costume.
3. **"Capa caprichada":**
   - Confira o Higgsfield: procure com o ToolSearch as ferramentas do Higgsfield (`higgsfield generate image`) e chame `balance`. **Respondeu o saldo? Está conectado: siga para o próximo item** (não marque nada de "falta conectar").
   - **Só se o ToolSearch não achar nenhuma `generate_image` do Higgsfield, nem depois de esperar 10 s (`sleep 10`) e procurar de novo** (a pessoa não conectou, ou ligou o "Higgsfield AI" da lista pronta, que não gera imagem): marque a etapa capa como esperando com a mensagem "Falta conectar o Higgsfield", escreva no chat como conectar (app do Claude → Configurações → Conectores → Adicionar conector personalizado → nome `Higgsfield`, URL `https://mcp.higgsfield.ai/mcp` → Conectar → autorizar; a aula do módulo Capa e título mostra) e, se ela não tiver conta, o link https://higgsfield.ai?fpr=lucas-28cba0 (é o link de parceiro do Lucas Editor). O cartão das 3 opções volta sozinho: diga que, depois de conectar, é só clicar de novo em "Capa caprichada", ou em "Capa simples" para sair grátis agora. Pare.
   - `etapa capa andando "Escolhendo o quadro e escrevendo a capa"`; quadros (`quadros.py`), prompt, e o passo a passo da caprichada do `SKILL.md` (imagens de modelo → preço → gerar → `salvar_capa.py`). Consultar, ver o preço e enviar as imagens de modelo passam direto; **gerar vira o cartão "Desenhar no Higgsfield (gasta créditos da sua conta)"** e você espera a pessoa permitir. Confira letra por letra.
4. **"Capa simples":** `etapa capa andando ...`; quadros e `capa_simples.py` com a cor do `marca.json` (`acento`).
5. Salve em `Prontos/<nome do vídeo>-capa.jpg` e marque `etapa capa feito "Capa pronta" --arquivo "Prontos/<nome>-capa.jpg"`. O painel mostra a capa e o cartão **"Aprovada" / "Quero outra"**.
6. **"Quero outra":** pergunte em uma frase o que mudar (o texto, o quadro, as cores) se a pessoa não disse; faça de novo (`-capa-v2.jpg`, nunca apague a anterior) e marque `capa feito` com o arquivo novo. Na caprichada, cada tentativa gasta ~2,75 créditos: diga isso antes.

## 2. Pedido "Capa e título" (o cartão do Novo vídeo)
Chega com o estilo `capa-e-titulo` e os campos: `formato` (`youtube` = 3 capas 16:9 + 3 títulos; `vertical` = 1 capa 9:16), `ideia`, `video` (opcional), `imagens` (fotos ou prints, opcional) e `gerador` (`higgsfield` ou `simples`). A coluna de etapas fica curta: Pedido → Títulos → Capas → Entrega.

| Etapa | O que fazer | Marca como | Para? |
|---|---|---|---|
| **briefing** | Ler a ideia, transcrever o vídeo (se veio: `<Python da pasta>/_ferramentas/.venv/bin/python scripts/transcrever.py <video> <pasta do vídeo>/capa/transcricao.txt`), tirar os quadros (`quadros.py`; olhe a folha `quadros.jpg`, não os quadros um por um), juntar as capas da pessoa (`marca.json` → `capas`) e as imagens. Sem nenhuma capa dela, avise em uma frase que dá para subir em Marca → Capas que deram certo (deixa com a cara do perfil) e siga com o modelo do kit. | `andando` → `feito` | só se faltar a ideia |
| **roteiro** (aparece como "Títulos") | YouTube: pesquisa (`pesquisar.py`) e os 3 pares título + texto da capa, com a promessa de cada um. Vertical: o texto da capa (2 opções no máximo). Grave em `<pasta do vídeo>/capa/titulos.md` e **escreva os pares por inteiro na sua mensagem**, numerados (ex.: "1. Título: … · Capa: …"), com o custo das capas. Depois marque `etapa roteiro esperando "3 títulos para aprovar" --arquivo <pasta do vídeo>/capa/titulos.md` e pare. | `esperando` | ⛔ o cartão "Aprova os títulos e o texto das capas?" (o painel cria; não chame `pergunta`) |
| **capa** | Gerar uma capa por vez e conferir. Caprichada: envie as imagens de modelo uma vez só e use os mesmos `media_id` nas 3; diga o custo total antes (3 capas ≈ 8,25 créditos). Cada geração vira um cartão de permissão (a pessoa pode clicar "Sempre neste projeto"). Se o `balance` do Higgsfield respondeu no briefing ou nos títulos, ele está conectado: só marque `capa andando`. **Só se não houver nenhuma `generate_image` do Higgsfield**: explique como conectar (seção 1) e pergunte com `painel.py pergunta "<projeto>" "O Higgsfield ainda não está conectado. Como quer seguir?" "Já conectei" "Fazer as capas simples (grátis)"`, e pare (aqui não use `etapa capa esperando`: esse cartão é o da capa depois de um vídeo). | `andando` → `feito` com `--arquivo` da última | não (a entrega pergunta) |
| **entrega** | Salvar em `Prontos/` (capas e `-titulos.md`) e marcar `entrega feito --arquivo Prontos/<nome>-capa-A.jpg`. Dizer em até 4 linhas o que ficou pronto e onde usar cada coisa (Studio → Testar e comparar). | `feito` | ⛔ o cartão "Como ficaram as capas e os títulos?" |

## Regras
- Uma mensagem curta por etapa, em português simples. Sem jargão ("prompt", "referência", "render") com a pessoa: diga "a capa", "o modelo", "o quadro do vídeo".
- Nunca gaste crédito sem a pessoa ter escolhido a capa caprichada (no cartão ou no pedido).
- Os créditos e o saldo saem no fim da mensagem, depois de "Detalhes:".
