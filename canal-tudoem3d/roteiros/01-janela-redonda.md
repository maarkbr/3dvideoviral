# Roteiro 01 — "Por que a janela do avião é redonda" (v2, conferido contra o documento)

Status: **piloto**. O tema foi escolhido por mim antes de o fluxo do documento ser aplicado (Passos 1 e 2 não foram
perguntados). Fica como modelo; o próximo roteiro começa pelo Passo 1.

## Passo 3 — O que é verdade e o que é inventado
Verdade: o primeiro jato de passageiros teve janelas quase quadradas e se partiu em pleno voo por fadiga do metal: a
cabine pressurizada infla e desinfla a cada voo e a tensão se acumula nos cantos retos (Fonte:
https://en.wikipedia.org/wiki/De_Havilland_Comet). Inventado: o engenheiro, o chefe, o dono da fábrica vizinha, as falas,
as 32 janelas lixadas, os 300 voos e o "voo 301".

## Narração (bloco limpo para o gerador de voz) — 160 palavras
```
Um engenheiro lixa os cantos de trinta e duas janelas de avião até ficarem redondas.
A fábrica dele e a vizinha disputam quem leva os passageiros do primeiro jato do mundo.
O chefe dele pega uma janela redonda e grita: "Isso é avião ou máquina de lavar?"
Ele não responde.
A fábrica vizinha decola primeiro, com janelas quadradas tão grandes que parecem vitrines de loja.
O dono da fábrica vizinha liga rindo: "Quer que eu mande o sabão em pó?"
Nove meses depois, o jato vizinho fez trezentos voos, e o dele ainda está no hangar.
Só que, no canto de cada janela quadrada, aparece um risco fino como um fio de cabelo.
No voo trezentos e um, a oito mil metros, o jato vizinho se parte no céu.
Veja só: a cabine infla a cada voo, e a força se acumula nos cantos retos.
No dia seguinte, o dono da vizinha encomenda trinta e duas janelas redondas… e sabão em pó.
```

## A mesma narração em planos (1 frase = 1 plano)
| Plano | Frase | Palavras | Duração estimada (2,5 pal/s) | Batida |
|---|---|---|---|---|
| SHOT 1 | Um engenheiro lixa os cantos de trinta e duas janelas de avião até ficarem redondas. | 15 | 6,0 s | GANCHO |
| SHOT 2 | A fábrica dele e a vizinha disputam quem leva os passageiros do primeiro jato do mundo. | 16 | 6,4 s | PREPARO |
| SHOT 3 | O chefe dele pega uma janela redonda e grita: "Isso é avião ou máquina de lavar?" | 15 | 6,0 s | DÚVIDA (piada 1) |
| SHOT 4 | Ele não responde. | 3 | 1,5 s (+0,5 s de pausa) | DÚVIDA (herói não explica; punchline) |
| SHOT 5 | A fábrica vizinha decola primeiro, com janelas quadradas tão grandes que parecem vitrines de loja. | 15 | 6,0 s | ESCALADA 1 (rival ganha) |
| SHOT 6 | O dono da fábrica vizinha liga rindo: "Quer que eu mande o sabão em pó?" | 15 | 6,0 s | ESCALADA 2 (piada 2) |
| SHOT 7 | Nove meses depois, o jato vizinho fez trezentos voos, e o dele ainda está no hangar. | 16 | 6,4 s | ESCALADA 3 (no tempo) |
| SHOT 8 | Só que, no canto de cada janela quadrada, aparece um risco fino como um fio de cabelo. | 17 | 6,8 s | PISTA visível |
| SHOT 9 | No voo trezentos e um, a oito mil metros, o jato vizinho se parte no céu. | 15 | 6,0 s | VIRADA |
| SHOT 10 | Veja só: a cabine infla a cada voo, e a força se acumula nos cantos retos. | 16 | 6,4 s | REVELAÇÃO |
| SHOT 11 | No dia seguinte, o dono da vizinha encomenda trinta e duas janelas redondas… e sabão em pó. | 17 | 6,8 s | FECHO |
Total ≈ 64 s.

## Narração com tags (ElevenLabs Eleven v3/v4, voz Roger, estabilidade Natural)
```
[confident] Um engenheiro lixa os cantos de trinta e duas janelas de avião… até ficarem redondas.
A fábrica dele e a vizinha disputam quem leva os passageiros do primeiro jato do mundo.
O chefe dele pega uma janela redonda e grita: [laughs] "Isso é avião… ou máquina de lavar?"
[calm] Ele não responde.   (tag [calm] a testar; se não funcionar, sem tag)
[excited] A fábrica vizinha decola primeiro, com janelas quadradas tão grandes que parecem vitrines de loja.
O dono da fábrica vizinha liga rindo: [sarcastic] "Quer que eu mande o sabão em pó?"
Nove meses depois, o jato vizinho fez trezentos voos… e o dele ainda está no hangar.
[whispers] Só que, no canto de cada janela quadrada, aparece um risco fino como um fio de cabelo.
[serious] No voo trezentos e um, a oito mil metros… o jato vizinho se parte no céu.
[confident] Veja só: a cabine infla a cada voo, e a força se acumula nos cantos retos.
[mischievously] No dia seguinte, o dono da vizinha encomenda trinta e duas janelas redondas… e sabão em pó.
```
Justificativa das tags: confiança no gancho (afirmação absurda dita com certeza); riso e deboche nas duas falas dos
duvidadores (é a piada e cria torcida); calma no "Ele não responde" (o herói não se explica); empolgação na escalada
(o rival parece ganhar); sussurro na pista (só o público percebe); seriedade na virada (acidente com vítimas reais,
sem humor); confiança na revelação (clareza); malícia no fecho (justiça cômica).

## Direção de voz
| Plano | Emoção | Int. (1–5) | Velocidade | Entonação | Pausas | Ênfase | Intenção |
|---|---|---|---|---|---|---|---|
| 1 | confiança curiosa | 3 | rápida até "avião", freia | afirmativa, cai no fim | 0,3 s antes de "até ficarem" | TRINTA E DUAS, REDONDAS | plantar o absurdo com um número |
| 2 | neutra, urgente | 2 | rápida, contínua | narrativa | — | PRIMEIRO JATO DO MUNDO | dar o prêmio e os lados |
| 3 | narração neutra → fala do chefe em gargalhada | 4 na fala | normal; a fala mais lenta | pergunta exagerada | 0,2 s antes da fala; 0,2 s antes de "ou" | MÁQUINA DE LAVAR | piada 1 |
| 4 | calma seca | 2 | lenta | descendente, final | 0,5 s de silêncio depois | NÃO | o herói não explica |
| 5 | empolgação | 4 | acelera | ascendente em "tão grandes" | — | QUADRADAS, VITRINES | o rival parece ganhar |
| 6 | narração leve → fala com deboche | 4 na fala | normal | fala com sorriso malicioso | 0,2 s antes da fala | SABÃO EM PÓ | piada 2 |
| 7 | pena cômica | 3 | normal; freia no fim | descendente em "hangar" | 0,4 s antes de "e o dele" | NOVE MESES, TREZENTOS, HANGAR | passagem de tempo, herói perdendo |
| 8 | segredo | 2 | lenta | sussurro confidente | 0,3 s antes de "aparece" | RISCO, FIO DE CABELO | a pista |
| 9 | gravidade | 4 | lenta | firme, sem drama | 0,6 s antes de "o jato" | TREZENTOS E UM, OITO MIL, SE PARTE | a virada (respeitosa) |
| 10 | clareza firme | 3 | normal | didática | 0,2 s depois de "Veja só" | INFLA, CANTOS RETOS | o mecanismo real |
| 11 | malícia | 3 | normal; freia no fim | brincalhona | 0,5 s antes de "e sabão em pó" | TRINTA E DUAS, SABÃO EM PÓ | justiça cômica + replay |

## Passo 5 — Folha de estilo (DEFAULT do documento) e personagens
```
Flat 2D cartoon characters with simple round heads, dot eyes, thick clean black outlines and flat colours, animated on a
detailed stylised 3D-rendered background with soft daylight, warm saturated colours, shallow depth of field.
Vertical 9:16. Smooth, expressive cartoon acting. No captions, no subtitles, no logos, no watermarks; the only writing
allowed is a number on a prop.
```
Personagens (frase fixa, igual em todo prompt):
- ENGINEER: "A young engineer with a round white head, round black glasses, a mint-green lab coat over a white shirt and a pencil behind his ear."
- BOSS: "His boss, bald with a round white head, a thin black moustache and a purple three-piece suit."
- RIVAL: "The rival factory owner, round white head, slicked silver hair, a mustard-yellow suit and a red bow tie."

## Passo 6 — Imagem de referência (9:16)
```
Flat 2D cartoon characters with simple round heads, dot eyes, thick clean black outlines and flat colours, animated on a
detailed stylised 3D-rendered background with soft daylight, warm saturated colours, shallow depth of field. Vertical
9:16. Smooth, expressive cartoon acting. No captions, no subtitles, no logos, no watermarks; the only writing allowed is
a number on a prop. A young engineer with a round white head, round black glasses, a mint-green lab coat over a white
shirt and a pencil behind his ear. His boss, bald with a round white head, a thin black moustache and a purple
three-piece suit. The rival factory owner, round white head, slicked silver hair, a mustard-yellow suit and a red bow
tie. All three stand side by side, full body, facing the camera, inside a sunlit 1950s aircraft hangar with an
unfinished silver passenger jet behind them. The engineer holds a round aircraft window, the boss holds a clipboard,
the rival holds a telephone handset. No text in the image.
```
(Na fase grátis, esta imagem é a referência visual que eu sigo no motor; não é gerada por IA.)

## Passo 7 — Um prompt por plano
Cada bloco: 1) referência 2) folha de estilo + personagens do plano 3) cenário e câmera 4) ação literal 5) som.
`[STYLE]` = o bloco da folha de estilo acima, palavra por palavra.

**SHOT 1 — 6 s**
```
Use the attached images as the character and style reference. [STYLE] A young engineer with a round white head, round
black glasses, a mint-green lab coat over a white shirt and a pencil behind his ear. Inside a sunlit aircraft hangar,
a workbench with a stack of square aircraft windows; camera low at bench height, slowly pushing in. The engineer sands
the corner of a square window until it becomes round, blows the dust towards the camera and places it on a pile of
round windows; a small tag on the pile reads "32". Sound: ambient sound effects only. No dialogue, no narration, no music.
```
**SHOT 2 — 6 s**
```
Use the attached images as the character and style reference. [STYLE] Aerial view of two hangars side by side on a
sunny airfield, a big silver passenger jet being pushed out of each one; drone camera flies forward between them. Tiny
workers run around both jets; a runway stretches to the horizon towards the sea. Sound: ambient sound effects only. No
dialogue, no narration, no music.
```
**SHOT 3 — 6 s**
```
Use the attached images as the character and style reference. [STYLE] His boss, bald with a round white head, a thin
black moustache and a purple three-piece suit. A young engineer with a round white head, round black glasses, a
mint-green lab coat over a white shirt and a pencil behind his ear. At the hangar workbench; over-the-shoulder shot from
behind the engineer, then the camera pushes in on the boss. The boss picks up a round window, holds it in front of his
face like a porthole and bursts out laughing, his body shaking. Sound: ambient sound effects only. No dialogue, no
narration, no music.
```
**SHOT 4 — 4 s**
```
Use the attached images as the character and style reference. [STYLE] A young engineer with a round white head, round
black glasses, a mint-green lab coat over a white shirt and a pencil behind his ear. Close-up at eye level at the
workbench, static camera. The engineer says nothing, calmly picks up the next square window and keeps sanding its
corner. Sound: ambient sound effects only. No dialogue, no narration, no music.
```
**SHOT 5 — 6 s**
```
Use the attached images as the character and style reference. [STYLE] On the sunny airfield behind a cheering crowd,
camera at ground level. A shiny passenger jet with very large square windows takes off from the left and climbs away
from the camera into a blue sky; the crowd waves flags. Sound: ambient sound effects only. No dialogue, no narration,
no music.
```
**SHOT 6 — 6 s**
```
Use the attached images as the character and style reference. [STYLE] The rival factory owner, round white head,
slicked silver hair, a mustard-yellow suit and a red bow tie. In a fancy office with a window showing the airfield,
medium shot, slow push-in. The rival leans back in a leather chair with his feet on the desk, laughing into a
telephone; a box of washing powder sits on the desk next to him. Sound: ambient sound effects only. No dialogue, no
narration, no music.
```
**SHOT 7 — 6 s**
```
Use the attached images as the character and style reference. [STYLE] A young engineer with a round white head, round
black glasses, a mint-green lab coat over a white shirt and a pencil behind his ear. Inside the quiet hangar at dusk,
wide shot from the doorway. His unfinished jet sits covered with dust; the engineer works alone under a lamp. Through
the open door, the rival jet flies past again and again in the sky; a wall counter changes from "9" to "300". Sound:
ambient sound effects only. No dialogue, no narration, no music.
```
**SHOT 8 — 6 s**
```
Use the attached images as the character and style reference. [STYLE] Extreme close-up of the corner of a large square
aircraft window on a jet flying above the clouds, cold blue light, very slow push-in. A crack as thin as a hair slowly
grows from the sharp corner across the silver metal. Sound: ambient sound effects only. No dialogue, no narration, no
music.
```
**SHOT 9 — 6 s**
```
Use the attached images as the character and style reference. [STYLE] Wide shot of the sky high above the clouds, the
rival jet with square windows flying from left to right; the camera shakes once. A small tag on the tail reads "301".
The jet breaks apart into pieces that fall away below the clouds; no people are visible. Sound: ambient sound effects
only. No dialogue, no narration, no music.
```
**SHOT 10 — 6 s**
```
Use the attached images as the character and style reference. [STYLE] A clean studio cutaway model of a passenger jet
cabin on a grey background, camera slowly orbiting. The cabin swells and shrinks like a balloon several times; glowing
red arrows gather at the sharp corners of a square window, while on a round window blue arrows slide smoothly around
the edge. Sound: ambient sound effects only. No dialogue, no narration, no music.
```
**SHOT 11 — 6 s**
```
Use the attached images as the character and style reference. [STYLE] The rival factory owner, round white head,
slicked silver hair, a mustard-yellow suit and a red bow tie. A young engineer with a round white head, round black
glasses, a mint-green lab coat over a white shirt and a pencil behind his ear. At the hangar door at golden hour,
medium shot, camera slowly pulls back. The rival, embarrassed and sweating, hands over an order form and a box of
washing powder; the engineer calmly passes him a stack of round windows with a tag that reads "32". Sound: ambient
sound effects only. No dialogue, no narration, no music.
```

## Storyboard técnico para o motor v2 (execução)
| Plano | Palavra que abre | Ambiente / luz | Personagens e expressão | Câmera | Elementos | Transição |
|---|---|---|---|---|---|---|
| 1 | "Um" | hangar, manhã, sol pela porta (quente) | engenheiro concentrado → satisfeito | baixa, empurra | pilha de janelas, etiqueta "32" na palavra "trinta" | corte seco |
| 2 | "A" | aeródromo aéreo, sol alto | figurantes | drone avançando | 2 hangares, 2 jatos | corte |
| 3 | "O" | hangar | chefe gargalhando (pose rindo, a criar) | sobre o ombro → empurra | janela redonda na frente do rosto | corte |
| 4 | "Ele" | hangar | engenheiro sereno | close parado | lixa | silêncio 0,5 s, corte seco |
| 5 | "A" | pista, céu azul | multidão comemorando | chão, segue o jato | janelas quadradas grandes | corte |
| 6 | "O" | escritório luxuoso | rival rindo ao telefone | plano médio, empurra | caixa de sabão em pó | corte |
| 7 | "Nove" | hangar ao entardecer (cor quente → roxa) | engenheiro sozinho | geral pela porta | contador 9 → 300 | dissolve 0,4 s (passagem de tempo) |
| 8 | "Só" | céu frio acima das nuvens (cor fria) | — | macro, empurra lento | trinca crescendo | corte seco |
| 9 | "No" | céu alto, luz dura | — | geral, tremida | etiqueta "301" e "8.000 m" | corte para branco 0,2 s |
| 10 | "Veja" | estúdio cinza | mascote do canal pode apontar (opcional) | órbita | setas vermelhas x azuis | corte |
| 11 | "No" | porta do hangar, hora dourada | rival suando, engenheiro tranquilo | plano médio, afasta | pedido + sabão + "32" | fim em reação (1 s) |

## Direção de edição
| Momento | Legenda | Efeito sonoro (SFX Kit) | Colchão sonoro | Câmera/corte | Destaque |
|---|---|---|---|---|---|
| "trinta e duas" | 1–2 palavras | writing-pencil-draw (lixa) | ambiente de hangar contínuo | empurra 6% | etiqueta "32" |
| "máquina de lavar" | — | celebration-applause-small (risadas) | — | zoom 8% | — |
| "Ele não responde." | — | — | colchão cai a 40% por 0,5 s | corte seco | — |
| "decola" | — | whoosh-slow-hard | sobe | segue o jato | — |
| "sabão em pó" | — | phone-ring-classic → pop | — | — | — |
| "Nove meses" | — | time-clock-fast | — | dissolve | contador |
| "risco" | — | writing-chalk-tick | fica grave e baixo | empurra lento | — |
| "se parte" | — | impact-deep-hard + bass-rumble-medium | some 0,3 s (nunca silêncio digital) | tremida + branco | "8.000 m" |
| "Veja só" | — | riser-1s-soft | volta suave | órbita | setas |
| "sabão em pó" (fim) | — | pop-large-bubble | acorde final | afasta | — |
Volume final −14 LUFS, compressão forte (LRA ≤ 4 LU).

## Passo 8 — Títulos e descrição
Títulos (4 a 8 palavras, sem emoji):
1. Por que a janela do avião é redonda
2. A janela que salvou os aviões
3. O engenheiro que lixava janelas de avião
4. Por que avião não tem janela quadrada
5. O risco do tamanho de um cabelo

Descrição (2 a 3 frases + 3 hashtags):
"O primeiro jato de passageiros tinha janelas quase quadradas e se partiu em pleno voo: a cabine infla e desinfla a
cada voo e a força se acumula nos cantos retos. Por isso, hoje toda janela de avião tem cantos redondos. Os
personagens são ilustrativos; o motivo é real. #aviao #curiosidades #engenharia"

## Conferência contra o documento (regra por regra)
| Regra do documento | Situação |
|---|---|
| Gancho: 1ª frase, 5–18 palavras, afirmação | ✅ 15 palavras, afirmação |
| Gancho abre com uma pessoa pelo papel, fazendo a ação estranha, com um número específico | ✅ "Um engenheiro lixa… trinta e duas janelas" |
| Não começar com Como/O que/Por que/Você sabia/Imagine/Já; nem com Então/Mas/Aí | ✅ |
| Depois do gancho, tempo presente | ✅ |
| Frase 2 nomeia os dois lados e o prêmio | ✅ as duas fábricas; os passageiros do primeiro jato |
| Cada frase segue da anterior; sempre se sabe onde, quem e o quê | ✅ |
| Batidas na ordem: gancho, preparo, dúvida, escalada (2–3 passos, rival ganha, pista visível), virada, revelação, fecho | ✅ planos 1 / 2 / 3–4 / 5–8 / 9 / 10 / 11 |
| Dúvida: uma fala de deboche ≤ 14 palavras; o herói se recusa a explicar | ✅ 7 palavras; "Ele não responde." |
| Revelação: o narrador diz "You see" + mecanismo numa frase simples; o herói nunca explica | ✅ "Veja só: …" (tradução de "You see"), uma frase |
| Fecho: imagem final; quem duvidou recebe exatamente o que zombou | ✅ o rival compra as janelas redondas e o sabão |
| Toda frase nomeia algo visível | ✅ |
| Conectores só quando a ligação é real; muitas frases sem conector | ✅ só "Só que" (virada real) |
| Pelo menos 2 piadas ditas pelos duvidadores | ✅ chefe e dono da vizinha |
| Pelo menos 2 números específicos e estranhos, e o público sabe o que contam | ✅ 32 janelas, 300 voos (e 301, 8 mil metros, 9 meses) |
| Sem anos | ✅ ("nove meses depois", "no dia seguinte") |
| Frases de 10 a 17 palavras com uma punchline de 3 a 6 | ✅ 15–17 palavras; punchline "Ele não responde." (3) |
| Sem introdução, nome do canal, moral, pergunta ao público, chamada para ação | ✅ |
| Última frase é a imagem de fecho, ≤ 25 palavras | ✅ 17 |
| Bater a contagem do Passo 1 (±10) | ✅ 160 palavras para 60 s (adaptação pt-BR: 150 ±10) |
| Passo 3: dizer o que é verdade e o que é inventado | ✅ |
| Passo 5: folha de estilo DEFAULT + 1 frase fixa por personagem | ✅ |
| Passo 6: prompt da imagem de referência | ✅ |
| Passo 7: 1 prompt por plano, 5 partes, só o que a câmera vê, direções claras, número escrito num objeto | ✅ |
| Passo 8: 5 títulos de 4–8 palavras sem emoji; descrição de 2–3 frases + 3 hashtags | ✅ |

### Pontos que dependem do dono do canal (regras que eu NÃO mudei sozinho)
1. **Passos 1, 2 e 4 são perguntas ao dono** (duração; tema/10 ideias; imagens de estilo ou DEFAULT). Neste piloto
   não foram feitas; a partir do próximo roteiro, sim.
2. **Velocidade em português**: as contagens do documento (100/150/205 palavras) foram feitas para inglês (~3,3 pal/s).
   Em português (~2,5 pal/s), 160 palavras dão ~64 s. Resolvido: palavras por duração (ver ROTEIRO-PADRAO.md).
3. **Duração do plano**: o documento pede planos de 4–6 s; em português, frases de 15–17 palavras duram 6–7 s, e os
   vídeos de referência trocam de ângulo a cada ~1,6 s dentro da frase.
