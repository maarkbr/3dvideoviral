# O estilo Colagem quando o pedido vem pelo painel · versão 1.0

A pessoa não vê o terminal: vê o chat, os cartões e a coluna de etapas. Marque cada etapa (o `painel.py` está em `~/.claude/skills/painel-edicao-com-ia/scripts/`; `<projeto>` é a pasta do projeto, e o vídeo fica dentro dela):
- marcar etapa: `python3 painel.py etapa "<projeto>" <etapa> <andando|esperando|feito> "frase curta" [--arquivo <arquivo>]`
- perguntar com botões: `python3 painel.py pergunta "<projeto>" "A pergunta" "Opção 1" "Opção 2" ...` (até 5; a primeira é a recomendada). Depois de perguntar, **termine a resposta e pare**: a escolha chega como a próxima mensagem.

| Etapa | O que fazer (os passos do SKILL.md) | Marca como | Para? |
|---|---|---|---|
| **briefing** | Passos 0 e 1 (modelo; ferramentas; **a pergunta do pack**, com botões "Tenho o Pack Edit Pro" / "Tenho outro pack" / "Não tenho"). Junte o tema, as fotos e o @ da pessoa. Sem tema: sugira 3. | `andando` → `feito` | ⛔ pack (só na 1ª vez) |
| **roteiro** | Passos 2 e 3: duas fontes por fato e o roteiro numerado, cada frase com a peça que vai ter. | `esperando` → `feito` | ⛔ "Aprova o roteiro?" |
| **narracao** | Passo 4: a voz dela ou voz de IA (`voz-ia.md`, custo antes). Mande o áudio. | `esperando` → `feito` | ⛔ voz e áudio |
| **storyboard** | Passo 5 (fotos próprias? fotos com licença com `buscar_fotos.py`; mapa com `mapa.py`) e passo 6 (`BEATS.md`, `cena.js`, `montar.py`, quadros) com a folha em `--arquivo`. | `esperando` → `feito` | ⛔ fotos e ⛔ quadros |
| **cenas** | Consertos que a `regua.md` apontar. | `andando` → `feito` | não |
| **render** | Passo 7: gerar o vídeo (em segundo plano, ~3 min para 15 s), `mixar.py`, `finalizar.py`. | `andando` → `feito` | não |
| **entrega** | Passo 8: `conferir.py` até APROVADO e a régua inteira; o vídeo com `--arquivo` e, em até 4 linhas, o que ficou pronto, o veredito e os créditos das fotos e da trilha para a descrição. | `feito` | ⛔ "Como ficou?" |

Regras:
- Ajuste: mude, tire os quadros de novo, gere e entregue como `-v2` (nunca apague a anterior). Mostre a v1 e a v2 lado a lado antes de dizer que melhorou.
- Nunca invente número, ano, citação ou fato. Nada de foto sem licença. Nenhum emoji no vídeo.
- Uma mensagem curta por etapa, em português simples (render → gerar o vídeo; LUFS → volume no padrão das redes; frames → imagens).
