# O estilo Mapas quando o pedido vem pelo painel

A pessoa não vê o terminal: vê o chat, os cartões e a coluna de etapas. Marque cada etapa (o `painel.py` está em `~/.claude/skills/painel-edicao-com-ia/scripts/`; `<projeto>` é a pasta do projeto, e o vídeo fica dentro dela):
- marcar etapa: `python3 painel.py etapa "<projeto>" <etapa> <andando|esperando|feito> "frase curta" [--arquivo <arquivo>]`
- perguntar com botões: `python3 painel.py pergunta "<projeto>" "A pergunta" "Opção 1" "Opção 2" ...` (até 5; a primeira é a recomendada). Depois de perguntar, **termine a resposta e pare**: a escolha chega como a próxima mensagem.
- Marcar uma etapa como `esperando` já cria o cartão com os botões (roteiro e storyboard: "Aprovado" / "Quero mudar algo"; narração: as vozes; entrega como `feito`: "Aprovado" / "Quero um ajuste").

O formulário do estilo Mapas manda: `tema` (pode vir vazio), `referencia` (link, opcional), `escolha` ("buscar" ou "meu") e `duracao` ("curto" ~60 s ou "longo" ~80 s).

| Etapa | O que fazer no estilo Mapas | Marca como | Para? |
|---|---|---|---|
| **briefing** | Juntar o que veio: tema, link, escolha e duração. Com link: `PY scripts/buscar_temas.py --texto <link>` dentro da pasta do vídeo. | `andando` → `feito` | não |
| **roteiro** | **Sem tema** (ou escolha "buscar"): `buscar_temas.py`, e `pergunta "Qual tema?"` com os 5 melhores, cada botão com as views e o tema em português ("34 mi · Por que o Chile é tão comprido"). Pare. Com o tema escolhido: pesquisa dos fatos na web, roteiro, e o roteiro numerado no chat com a cena de cada bloco em uma linha. | `esperando` → `feito` | ⛔ "Aprova o roteiro?" |
| **storyboard** | `montar.py --rascunho` e as fotos do meio de cada bloco; a folha de fotos vai no `--arquivo`. | `esperando` → `feito` | ⛔ "Aprova as cenas?" (no modo automático, siga) |
| **narracao** | Voz anotada em `voz/escolha.txt` da pasta de trabalho? Use. Senão, pergunte: `"Minha voz (gravo e mando o áudio)"`, `"Áudio pronto (mando o arquivo)"`, `"VoiceStudio (grátis)"`, `"ElevenLabs (minha chave)"`, `"Higgsfield (créditos)"`. Higgsfield: é o conector do app do Claude, o mesmo da capa, sem instalar nada (sem ele, explique como ligar: `references/voz-ia.md`, seção 4); mostre o custo antes (`get_cost`) e peça o ok com `pergunta` (não marque `narracao esperando` para isso: esse cartão é o da escolha da voz), e gerar vira cartão de permissão no painel; os áudios finais são `voz/fN.wav` (os `bN.wav` ainda têm o "Bom." na frente); quem não tem conta cria pelo link https://higgsfield.ai?fpr=lucas-28cba0. Gravação da pessoa: `montar_voz.py --gravacao`. | `andando` → `feito` | ⛔ se não houver voz |
| **cenas** | `montar.py` com a voz e as fotos de conferência (`--arquivo` com a folha). | `andando` → `feito` | não |
| **render** | Render em segundo plano; avise que leva alguns minutos. | `andando` → `feito` | não |
| **entrega** | `tirar_sons.py` e `mixar.py` para `Prontos/` do projeto, marcar com `--arquivo`. Dizer em até 4 linhas, sem termo técnico, o que ficou pronto (duração e para onde serve) e pedir para ouvir a música e os nomes dos lugares; volume, voz e créditos gastos vão depois de uma linha "Detalhes:". | `feito` | ⛔ "Como ficou?" |

Regras:
- Ajuste é a pessoa dizendo em palavras o que mudar: mude, renderize de novo e entregue como `-v2`, `-v3` (nunca apague a anterior).
- Modo automático ("faz tudo direto"): escolha o tema mais visto que dê para fazer com as cenas do kit, não pare no roteiro nem no storyboard; pare só na voz (se não houver) e em erro.
- Uma mensagem curta por etapa, em português simples, sem jargão de código.
- Nunca invente número, ano ou fato: o que não se confirma em duas fontes sai do roteiro.

## Como falar com a pessoa
Ela não é editora nem programadora. Frases curtas, em português, sem termo técnico (render → gerar o vídeo; LUFS → volume no padrão das redes; frames → imagens; b-roll → imagens de apoio; copy → texto do vídeo; storyboard → desenho das cenas). Nada de nome de arquivo, pasta, comando ou erro técnico, a não ser que ela peça. A description de cada comando aparece no chat: escreva em português ("Conferindo o volume"), nunca em inglês. O técnico que valer a pena contar vai depois de uma linha "Detalhes:". Antes de cada pergunta (roteiro, desenho das cenas, entrega), escreva primeiro a mensagem que ela resume: o cartão da pergunta aparece no chat na hora em que você roda o comando, então ele vem por último.
