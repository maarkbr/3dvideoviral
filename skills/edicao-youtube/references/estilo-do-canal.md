# Estilo do canal Lucas Editor (YouTube)

Análise das intros e do começo do corpo dos vídeos recentes do canal (@lucasbceditor), feita em 06/11/2026:
primeiros 150 s de cada vídeo, com detecção de corte de cena, transcrição e folhas de quadros. Vídeos: Kling 4.0 em 1 geração, 8 IAs de vídeo
com o mesmo prompt, influenciadora de IA para TikTok Shop, vídeo viral clonado com IA, organizar clientes de edição,
animações de texto no CapCut, 7 truques do CapCut, histórias com IA, entre outros.

## O diagnóstico (o que o próprio Lucas disse e os números confirmam)

| trecho | trocas de imagem a cada 10 s | o que tem |
|---|---|---|
| 0–15 s | **2 a 8** (mediana ~4) | cartões de tipografia, b-roll, logo, palavra gigante, film burn |
| 15–30 s | 1 a 9 | ainda intro: promessa, patrocínio, "link na descrição" |
| 30–60 s | 0 a 1 | entra a tela |
| 60–150 s | **~0,1** (quase nada) | gravação de tela crua, sem legenda, sem zoom |

A intro é trabalhada; o corpo fica cru. **O objetivo desta skill é levar edição para o corpo** sem que o Lucas
gaste tempo: zoom no que ele mostra, logo/print do que ele cita, cartão de tópico em cada passo, legenda curta
com destaque, b-roll quando ele fala de algo fora da tela.

## Roteiro da intro (o que ele fala, quase sempre nesta ordem)
1. **Gancho com prova ou resultado** (0–5 s): "Esse vídeo inteiro foi feito com IA, 30 segundos…",
   "Eu peguei o mesmo prompt e coloquei em 8 IAs…", "Vídeos assim estão fazendo páginas novas viralizarem…",
   "eu já alcancei o nível 6 diamante… e já ganhei mais de 80 dólares". Nos tutoriais de edição, o gancho é
   **o resultado pronto passando primeiro** ("como fazer essa edição aqui" + a edição final rodando) ou a
   dor do público ("Suas legendas parecem amadoras?"). Na intro, mostre o resultado do vídeo cedo.
2. **Promessa**: "E nesse vídeo eu vou te mostrar, do zero / do básico ao avançado / de forma simples…".
3. **Retenção**: "fica comigo até o final que eu garanto que você não vai se arrepender".
4. **Parceiro e link** (quando há): "tudo isso eu fiz dentro da Higgsfield, parceira do canal… o link tá na
   descrição e no primeiro comentário fixado".
5. **Virada para a tela**: "Bom, gente…", "Então vamos lá", "Então o primeiro truque…". **Aqui acaba a intro.**
Duração: 15 a 48 s (mediana ~30 s).

## Identidade visual (tokens)
Tirados do projeto da intro do Kling 4.0 (`template/intro-kling/index.html`), que o Lucas aprovou e publicou:

| token | valor | uso |
|---|---|---|
| preto | `#0A0A0B` | fundo dos cartões escuros (com grade sutil 96 px a 5% e vinheta) |
| creme | `#F1F0EC` / `#F5F3EE` | fundo dos cartões claros (grade a 7%), texto claro |
| amarelo | `#FFC400` | palavra-chave, pílula, anel/realce, barra de progresso |
| card | `#16161A` | pílulas e cartões escuros com borda branca 20% |
| fonte | **Montserrat** 800–900 (títulos), 600 (legenda) | `template/intro-kling/assets/fonts/Montserrat-VF.woff2` |

Em vídeos mais antigos aparecem também: laranja/amarelo com serifa itálica ("7 *truques*… *edição*"), fundo
escuro quente com vinheta e pílula amarela de rótulo ("AULA"), grade de pontos. O padrão atual é o do Kling.

## Repertório de cenas da intro (o que se repete)
- **Número/nome gigante** centralizado: "30s", "KLING **4.0**" (a parte importante em amarelo), entra com escala
  2,2 → 1 em 0,22 s (power4.out); subtítulo em branco entra por baixo com mola.
- **Pílula amarela** com texto preto ("a nova IA de vídeo", "link na descrição"), girada −2°, entra com mola.
- **Cartão claro com grade**: frase em preto com a palavra-chave numa caixa amarela ("eu planejei **todas as
  cenas**"), fileira de miniaturas numeradas com anel amarelo passando de uma em uma e barra de progresso.
- **Comparação/processo**: grade de imagens → seta → resultado ("storyboard → vídeo final"); "?" em cartões;
  troféu "qual ganhou?".
- **Palavra gigante sobre a tela escurecida** ("eu vou", "de forma **simples**"), uma palavra por vez.
- **B-roll em tela cheia** cortado a cada 0,6–2 s (resultados de IA, banco de imagens, o próprio Lucas na mesa),
  com leve zoom-out 1,08 → 1.
- **Zoom forte na interface** (2,5x) com anel amarelo arredondado em volta do botão/área citada.
- **Logo do app/site** citado (CapCut, Higgsfield, ícone de app) em cartão preto com o nome embaixo.
- **Film burn / light leak** (Pack Lucas → Transições: `Burn Transtion 25`, `Film Burn 1/2`) nas viradas
  grandes, em modo tela, ~0,6 s, com o som baixo.
- **"publi"** discreto no canto quando é parceria.
- **Legenda da intro**: pequena (40 px em 1080p), minúscula, branca com sombra, centrada embaixo (y≈948),
  palavra-chave em amarelo e negrito; em cartão claro, texto preto com a palavra numa caixa amarela.

## Ritmo e som
- Troca visual a cada **1,5–2 s** na intro; nada parado mais de 3 s.
- A fala da intro do Kling foi acelerada em **1,15x** (pergunte se acelera).
- Efeitos: whoosh, click, button, impact, riser (os do Pack Lucas/SFX), discretos; trilha baixa só na intro.

## Corpo do vídeo (o que esta skill acrescenta)
Padrão "média" (ajuste pelo `preferencias.md`):
- **Zoom** suave (1,4–1,8x, rampa 0,45 s) no botão/campo/resultado que ele está mostrando, a cada 15–40 s.
- **Logo/print** do site ou app quando ele o cita pela primeira vez (2–3 s, modo `centro` sobre o fundo escuro
  ou `pip` no canto, com pop de entrada e whoosh).
- **Cartão de tópico** em cada passo ("PASSO 1 · gerar as cenas"), no estilo da intro, 1,5–2,5 s.
- **Palavra-chave** em texto nativo do CapCut nos momentos fortes (resultado, número, alerta).
- **Legenda** de 1 a 3 palavras, maiúsculas, branca com contorno preto, palavra-chave em `#FFC400`, embaixo
  (y = −0,72), no vídeo todo (ou só na intro, se ele preferir — pergunte na primeira vez).
- **B-roll do Pexels** só quando ele fala de algo concreto que não está na tela (dinheiro, celular, cliente…),
  2–4 s, tela cheia, sem som.
- Sem trilha no corpo, ou trilha bem baixa (−24 dB da voz).
