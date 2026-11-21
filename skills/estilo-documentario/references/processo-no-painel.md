# O estilo Documentário quando o pedido vem pelo painel · versão 2.0

A pessoa não vê o terminal: vê o chat, os cartões e a coluna de etapas. Marque cada etapa (o `painel.py` está em `~/.claude/skills/painel-edicao-com-ia/scripts/`; `<projeto>` é a pasta do projeto, e o vídeo fica dentro dela):
- marcar etapa: `python3 painel.py etapa "<projeto>" <etapa> <andando|esperando|feito> "frase curta" [--arquivo <arquivo>]`
- perguntar com botões: `python3 painel.py pergunta "<projeto>" "A pergunta" "Opção 1" "Opção 2" ...` (até 5; a primeira é a recomendada). Depois de perguntar, **termine a resposta e pare**: a escolha chega como a próxima mensagem.
- Marcar uma etapa como `esperando` já cria o cartão com os botões (roteiro e storyboard: "Aprovado" / "Quero mudar algo"; narração: as vozes; entrega como `feito`: "Aprovado" / "Quero um ajuste").

| Etapa | O que fazer no estilo Documentário (os passos do SKILL.md) | Marca como | Para? |
|---|---|---|---|
| **briefing** | Passo 0 (modelo e esforço: diga em uma frase) e passo 1 (`ferramentas.py`; se faltar algo, explique como instalar). Junte o tema, as fotos e as referências que vieram. Sem tema: sugira 3 histórias com datas, pessoas e lugares reais. | `andando` → `feito` | só se faltar ferramenta |
| **roteiro** | Passos 2 e 3: pesquisa (duas fontes por fato) e o roteiro numerado no chat, cada bloco com a imagem que vai ter. | `esperando` → `feito` | ⛔ "Aprova o roteiro?" |
| **narracao** | Passo 4: voz anotada em `voz/escolha.txt` da pasta de trabalho? Use. Senão, pergunte "a sua voz ou voz de IA" e as opções de `voz-ia.md`. Mande o áudio. | `esperando` → `feito` | ⛔ escolha da voz e aprovação do áudio |
| **storyboard** | Passo 5 (o painel não tem uma etapa "materiais": marque `storyboard andando "Buscando os materiais"`, nunca `etapa materiais`): as perguntas das fotos próprias e do Pack (`pergunta`), as referências e as fotos com licença (`buscar_fotos.py`), a folha das escolhidas com `--arquivo`. Depois o passo 6: `BEATS.md`, `cena.js`, `montar.py` e a folha dos quadros de cada beat com `--arquivo`. | `esperando` → `feito` | ⛔ "Aprova as imagens?" e ⛔ "Aprova os quadros?" |
| **cenas** | Consertos que a régua (`regua.md`) apontar nos quadros. | `andando` → `feito` | não |
| **render** | Passo 7: gerar o vídeo em segundo plano (8 a 12 min para 45 s; avise), `mixar.py` e `finalizar.py`. | `andando` → `feito` | não |
| **entrega** | Passo 8: rode o ciclo (`conferir.py` → olhar `destaques.jpg` e `folha.jpg` pela régua → consertar → gerar de novo) até APROVADO, com a etapa `andando "Conferindo e consertando"`; só então marque com `--arquivo` o vídeo e diga em até 4 linhas o que ficou pronto, o veredito e os créditos para a descrição. | `feito` | ⛔ "Como ficou?" |

Regras:
- Ajuste é a pessoa dizendo em palavras o que mudar: mude, tire os quadros de novo, renderize e entregue como `-v2`, `-v3` (nunca apague a anterior). A primeira versão é rascunho: a rodada de ajuste é parte do método.
- Nunca invente número, ano, citação ou fato. Nada de foto sem licença.
- Uma mensagem curta por etapa, em português simples, sem jargão (render → gerar o vídeo; LUFS → volume no padrão das redes; frames → imagens).
