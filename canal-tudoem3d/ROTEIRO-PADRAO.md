# Padrão oficial de roteiro — Tudo em 3D

**Regra-mãe:** todo roteiro segue RIGOROSAMENTE o documento "Rick's Clips Master Prompt (v3)" (fluxo de 8 passos e
regras de narração). Nenhuma regra do documento é alterada, simplificada ou ignorada sem consultar o dono do canal.
Antes de considerar um roteiro pronto, ele passa pela tabela "Conferência contra o documento" (modelo no roteiro 01),
regra por regra. Fluxo: Passo 1 (perguntar duração) → Passo 2 (tema ou 10 ideias classificadas por tipo A/B/C) →
Passo 3 (história; dizer o que é verdade e o que é inventado) → espera "GO" → Passo 4 (imagens de estilo ou DEFAULT) →
Passo 5 (folha de estilo + frase fixa por personagem) → Passo 6 (imagem de referência) → Passo 7 (um prompt por plano)
→ Passo 8 (títulos e descrição). Uma pergunta por vez, com opções numeradas.
Referência de execução audiovisual: `LINGUAGEM-AUDIOVISUAL.md`.
Crescimento e postagem: `CRESCIMENTO.md`.

## Adaptações para vídeos em português (22/11/2026)
Decididas por mim (Claude) com base na delegação do dono ("faça o que tenha que fazer para os meus vídeos se tornarem
virais"), depois de apresentar a recomendação. O documento continua valendo em todo o resto; o dono pode reverter.
1. **Palavras por duração (pt-BR ≈ 2,5 palavras/s):** 30 s ≈ 75 palavras (7–8 cenas), 45 s ≈ 115 (10–12 cenas),
   60 s ≈ 150 (13–15 cenas); tolerância ±10. (O documento usa 100/150/205, calculadas para inglês.)
2. **Cortes:** 1 frase = 1 cena (mesmo lugar e ação, como no documento), mas a edição troca de ângulo a cada 1,5–2,5 s,
   na ordem estabelecer → reação → detalhe (ritmo medido nos vídeos de referência). Prompt de IA: 1 por frase.
3. **Texto na imagem:** além de números em objetos, vale texto curto dentro da cena (manchete, placa, faixa, tela) e as
   etiquetas amarelas de números do canal, além da legenda. Nos prompts de IA o texto segue restrito a números.

Todo roteiro do canal tem 6 partes, nesta ordem. Exemplo completo: `roteiros/01-janela-redonda.md`.

1. **Ficha** (fato real e fonte; o que é inventado; tipo de história; duração; palavras)
2. **Narração com tags** (bloco único para colar no ElevenLabs v3/v4)
3. **Direção de voz** (por trecho; serve para a voz de IA e para quem grava a própria voz)
4. **Storyboard** (uma cena por frase)
5. **Especificação de cena** (o "prompt" do motor v2) e prompt de IA opcional (futuro)
6. **Direção de edição** (legenda, efeitos, música, zoom, cortes, silêncios, destaques)
+ **Kit de postagem** (títulos, legendas por plataforma, hashtags, comentário fixado)

---

## Parte 1 — Ficha
```
Título: (4 a 8 palavras; "Por que [coisa normal] [é secretamente estranha]" ou "O [objeto] que [coisa impossível]")
Fato verdadeiro: (uma frase) — Fonte: (link)
Inventado para a história: (personagens, rivais, falas)
Tipo: A herói azarão | B experimento/instituição | C esquema com virada
Duração-alvo: 60 s ≈ 150 palavras (pt-BR ≈ 2,5 palavras/s) — Contagem: N palavras — Cenas: N
```

## Parte 2 — Narração com tags (ElevenLabs)

Regras de compatibilidade (verificadas na documentação oficial da ElevenLabs):
- Tags de áudio funcionam no **Eleven v3** (e no v4). **Não funcionam no Multilingual v2** (o modelo é lido em voz alta
  ou ignorado). Gerar sempre com v3/v4.
- Tags em **inglês, minúsculas, entre colchetes**, antes do trecho que afetam. O texto pode ser em português.
- Tags confirmadas pela documentação/blog oficial: `[excited]` `[curious]` `[sarcastic]` `[whispers]` `[shouts]`
  `[laughs]` `[sighs]` `[sad]` `[angry]` `[happily]` `[clears throat]`. Use também, com teste: `[serious]`
  `[confident]` `[shocked]` `[mischievously]` `[dramatic]`.
- Pausas: reticências (…) e travessão (—). O v3 não usa a marcação `<break>`. Ênfase: palavra em MAIÚSCULAS com
  moderação (no máximo 1 por frase) ou reticência antes dela.
- No máximo **uma tag de emoção por frase**; troca de emoção só quando a história muda (ver tabela abaixo).
- Voz padrão do canal: **Roger** (masculina, casual, ressonante). Estabilidade em "Natural" (≈ 50%).
- Números por extenso no texto falado ("nove mil metros"), a etiqueta na tela mostra o algarismo.

Mapa de emoção por batida (justificativa narrativa):
| Batida | Tag base | Por quê |
|---|---|---|
| Gancho | `[confident]` ou `[curious]` | Afirma algo estranho com segurança: o público confia e fica |
| Preparo | sem tag (neutro, rápido) | Informação; a voz não pode roubar a cena |
| Dúvida (fala do zombador) | `[sarcastic]` / `[laughs]` | É a piada; o tom de deboche cria torcida pelo herói |
| Escalada | `[excited]` crescendo | Ritmo sobe a cada passo |
| Pista | `[whispers]` | Segredo compartilhado com o público: "só você percebeu" |
| Virada | `[serious]` ou `[shocked]` | Mudança brusca; menos velocidade |
| Revelação | `[serious]` → `[confident]` | Clareza; frase lenta e firme |
| Fecho | `[mischievously]` / `[laughs]` | Justiça cômica; deixa o público sorrindo (replay) |

## Parte 3 — Direção de voz (tabela por trecho)
| # | Trecho | Emoção | Intensidade (1–5) | Velocidade | Entonação | Pausa | Ênfase | Intenção |
|---|---|---|---|---|---|---|---|---|
| 1 | "…" | Confiança | 3 | rápida | afirmativa, cai no fim | 0,3 s antes do número | NÚMERO | prender com o absurdo |

## Parte 4 — Storyboard (uma linha por cena)
| Cena | Trecho exato | Duração | Ambiente | Personagens | Expressão | Corpo/ação | Enquadramento | Ângulo | Movimento | Luz | Elementos-chave | Transição |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

Vocabulário de câmera: geral (GE), plano médio (PM), plano americano (PA), close (CL), detalhe (DT); ângulos: nível
dos olhos, contra-plongée (de baixo), plongée (de cima), POV, sobre o ombro; movimentos: empurra (dolly in), afasta,
travelling lateral, órbita, chicote (whip), tremida de impacto.

## Parte 5 — Especificação de cena (motor v2)

O "prompt" de cada cena para o nosso motor é um bloco fixo, no formato abaixo (eu transformo direto em código):
```
CENA N — [0,0 s → 0,0 s] (palavra de entrada: "...")
PALCO: (palco/cenário e hora do dia)
PEÇAS 3D: (peças Kenney e posição relativa; ex.: avião no hangar ao fundo, 2 carros à esquerda)
PERSONAGENS: (quem, onde, pose do motor, expressão; ex.: mascote em x=-0,3, pose apontando)
CÂMERA: pos [x,y,z] → alvo [x,y,z], lente (fov), foco (m), movimento até a próxima chave
OBJETOS/ETIQUETAS: (objeto 2D ou etiqueta e a palavra exata em que entra)
LUZ/CLIMA: (sol, noite, chuva, cor do céu)
CONTINUIDADE: (o que precisa bater com a cena anterior: roupa, posição, objeto na mão)
```
Prompt de IA (opcional, para uma fase futura com Google Flow/Veo), sempre neste molde:
```
Use the attached images as the character and style reference. Vertical 9:16. Flat 2D cartoon characters with round
white heads, thick clean black outlines and flat colours, acting on a detailed stylised 3D-rendered background with
soft daylight, warm saturated colours and shallow depth of field. [frase fixa de cada personagem]. [Cenário, posição e
ângulo da câmera]. [Ação literal, com direções: em direção à câmera, para a esquerda…]. [Número escrito num objeto,
se houver]. No captions, no subtitles, no logos. Sound: ambient sound effects only. No dialogue, no narration, no music.
```

## Parte 6 — Direção de edição (tabela)
| Tempo | Evento | Legenda | Efeito sonoro (SFX Kit) | Música | Zoom/corte | Efeito visual | Destaque |
|---|---|---|---|---|---|---|---|

## Kit de postagem
- 5 títulos (padrões da Parte 1).
- TikTok: 2–3 linhas + 3–4 hashtags. Instagram: 4–6 linhas + "Salva…" + 4–5 hashtags. Shorts: título forte (até 100
  caracteres) + descrição com o fato real + 3 hashtags. Comentário fixado com uma curiosidade extra.
- Descrição sempre diz o que é real e o que é ilustrativo.

---

## Elenco fixo (frases de aparência — usar idênticas em todo roteiro)
- **Mascote (narrador visual do canal)**: personagem 2D de cabeça redonda branca, boné amarelo com "3D" azul e aba
  para a direita, jaqueta laranja com zíper sobre camiseta branca, calça azul-marinho, tênis branco.
- **Herói/heroína da história**: definido por roteiro; sempre com UMA cor que o identifica (ex.: jaleco verde-água).
- **Chefe/rival zombador**: definido por roteiro; cor oposta à do herói (ex.: terno roxo).
- **Figurantes**: `cliente1` (laranja), `cliente2` (roxo), `cliente3` (verde).
- Poses do motor: parado, acenando, apontando, pensando, assustado, comemorando, correndo, segredo, desconfiado,
  negando. (A criar quando o roteiro pedir: rindo, bravo, envergonhado.)
