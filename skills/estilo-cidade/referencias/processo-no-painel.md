# O estilo Cidade 3D quando o pedido vem pelo painel

A pessoa não vê o terminal: vê o chat, os cartões e a coluna de etapas. Marque cada etapa com o `painel.py` (em
`~/.claude/skills/painel-edicao-com-ia/scripts/`; `<projeto>` é a pasta do projeto do painel):
- marcar etapa: `python3 painel.py etapa "<projeto>" <etapa> <andando|esperando|feito> "frase curta" [--arquivo <arquivo>]`
- perguntar com botões: `python3 painel.py pergunta "<projeto>" "A pergunta" "Opção 1" "Opção 2" ...` (até 5; a
  primeira é a recomendada). Depois de perguntar, **termine a resposta e pare**: a escolha chega como a próxima mensagem.
- `esperando` já cria o cartão com os botões (roteiro e storyboard: "Aprovado" / "Quero mudar algo"; narração: as vozes;
  entrega como `feito`: "Aprovado" / "Quero um ajuste"). Para o ok de um gasto (voz do Higgsfield), use `pergunta`.

**O painel só mostra o que você escreve na resposta.** Antes de marcar `roteiro esperando`, escreva o roteiro inteiro na
mensagem: cada bloco numerado com a fala completa e, embaixo, o que a cena mostra.

O formulário manda: `regra` (a regra absurda; vazia = dê as 10 ideias), `duracao` ("curto" = 30 a 60 s, "longo" =
65 a 90 s) e a voz escolhida. O vídeo fica em `<projeto>/cidade/<nome>` (crie com o `novo_video.py` passando
`"<projeto>/cidade"`).

| Etapa (no painel) | O que fazer | Marca como | Para? |
|---|---|---|---|
| **briefing** (Pedido) | Juntar o que veio (regra, duração, voz) e perguntar uma vez pelo pack de edições (SKILL, passo 4). | `andando` → `feito` | não |
| **roteiro** (Roteiro) | Sem regra: as 10 ideias, e `pergunta "Qual ideia?"` com as 5 melhores. Pare. Com a ideia: o roteiro em blocos (passo 2), escrito inteiro na mensagem. | `esperando` | **sim** |
| **narracao** (Narração) | Voz da pessoa: peça o arquivo pelo +. Higgsfield: custo antes (`get_cost`) e `pergunta` para o ok; gere numa fala só (`referencias/voz-ia.md`). Depois `voz.py` e `alinhar.py`. | `andando` → `feito` | só no ok do custo |
| **storyboard** (Quadros) | Cena e som (passos 7 e 8), snapshots e `check`; a folha de quadros vai no `--arquivo`. | `esperando` | **sim** |
| **render** (Render) | `npx hyperframes render --fps 60 --output render/<nome>.mp4` em segundo plano (confira o disco antes); avise que leva alguns minutos. | `andando` → `feito` | não |
| **entrega** (Entrega) | `conferir_video.py` até APROVADO; copie o MP4 para `Prontos/` do projeto e marque com `--arquivo`. Diga em até 4 linhas, sem termo técnico, o que ficou pronto. | `feito` | — |
