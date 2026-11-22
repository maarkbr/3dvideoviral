# Roteiro 02 — "A entrevista de emprego que abriu a Binance"

Fluxo do documento: Passo 1 = 60 s (escolha do dono) · Passo 2 = tema escolhido pelo dono (ataque à Binance) ·
Passo 4 = DEFAULT (delegado ao Claude) · tipo de história **C** (esquema esperto com virada que revela como funcionou).
Adaptação pt-BR em vigor: 60 s ≈ 150 palavras (±10); troca de ângulo a cada 1,5–2,5 s; texto curto em cena permitido.

## Passo 3 — O que é verdade e o que é inventado
**Verdade (fontes no fim):** em 29/10/2026 (uma quinta-feira, à noite), carteiras quentes da corretora Binance foram
esvaziadas em cerca de 10 blockchains, a maior parte em ~20 minutos; ~US$ 6,34 bilhões foram afetados (número oficial do
CEO Richard Teng). Segundo o relatório preliminar da Binance (03/11), foi uma campanha de meses contra computadores de
engenheiros; em setembro, um deles fez uma entrevista de emprego falsa (RH falso e um "CEO" falso) e rodou uma tarefa de
programação que instalou código malicioso sem ser detectado; os invasores avançaram por outras máquinas e por uma
ferramenta interna até o serviço que assina os saques, e fizeram o próprio sistema da Binance autorizar as retiradas.
Em cerca de uma hora, Tether e Circle congelaram quase US$ 1,8 bilhão em stablecoins; o total congelado ou interceptado
chegou a ~US$ 2,85 bilhões (Teng, 04/11). A Binance cobriu as perdas com dinheiro próprio ("nenhum usuário arca com a
perda") e reabriu os saques em fases a partir de 01/11.
**Inventado (dramatização):** o "chefe dos hackers", o "comparsa", o esconderijo, as duas falas de deboche, o sorriso do
chefe, a "luzinha" que acende (representa o código malicioso). Nenhuma fala é atribuída a pessoa real. O engenheiro é
retratado como vítima, sem nome. A autoria (a Binance diz que informações do FBI apontam para a Coreia do Norte, que
nega) fica fora da narração e entra só na descrição.
**Fora do vídeo (para não virar tutorial):** nenhum detalhe técnico de como reproduzir o ataque.

## Narração (bloco limpo para o gerador de voz) — 160 palavras
```
Um engenheiro da Binance faz um teste de emprego falso e abre a porta pra seis bilhões.
A maior corretora do mundo contra hackers que querem o cofre ligado na internet.
O chefe dos hackers monta uma empresa falsa, com RH falso e até CEO falso.
Um comparsa ri: "Entrevista de emprego? A gente vai roubar ou contratar estagiário?"
O chefe só sorri.
Ele recebe uma tarefa de casa, roda o código e uma luzinha acende escondida.
Por semanas, eles pulam de computador em computador até a máquina que assina os saques.
Numa quinta à noite, em vinte minutos, seis bilhões saem por dez blockchains.
No esconderijo, o comparsa debocha: "Relaxa, ninguém no mundo congela blockchain."
Em uma hora, Tether e Circle congelam quase dois bilhões em moedas digitais.
Veja só: eles nunca arrombaram o cofre, fizeram a Binance assinar os próprios saques.
No fim, dois bilhões e oitocentos milhões viram gelo na frente do comparsa que riu.
```

## A mesma narração em planos (1 frase = 1 cena)
| Plano | Frase | Palavras | Duração (2,5 pal/s) | Batida |
|---|---|---|---|---|
| SHOT 1 | Um engenheiro da Binance faz um teste de emprego falso e abre a porta pra seis bilhões. | 17 | 6,4 s | GANCHO |
| SHOT 2 | A maior corretora do mundo contra hackers que querem o cofre ligado na internet. | 14 | 5,6 s | PREPARO (lados e prêmio) |
| SHOT 3 | O chefe dos hackers monta uma empresa falsa, com RH falso e até CEO falso. | 15 | 6,0 s | PREPARO (o plano) |
| SHOT 4 | Um comparsa ri: "Entrevista de emprego? A gente vai roubar ou contratar estagiário?" | 13 | 5,2 s | DÚVIDA (piada 1) |
| SHOT 5 | O chefe só sorri. | 4 | 1,6 s | DÚVIDA (o herói não explica; punchline) |
| SHOT 6 | Ele recebe uma tarefa de casa, roda o código e uma luzinha acende escondida. | 14 | 5,6 s | ESCALADA 1 (pista visível) |
| SHOT 7 | Por semanas, eles pulam de computador em computador até a máquina que assina os saques. | 15 | 6,0 s | ESCALADA 2 (no tempo) |
| SHOT 8 | Numa quinta à noite, em vinte minutos, seis bilhões saem por dez blockchains. | 13 | 5,2 s | ESCALADA 3 (o esquema "ganha") |
| SHOT 9 | No esconderijo, o comparsa debocha: "Relaxa, ninguém no mundo congela blockchain." | 13 | 5,2 s | ESCALADA (piada 2) |
| SHOT 10 | Em uma hora, Tether e Circle congelam quase dois bilhões em moedas digitais. | 13 | 5,2 s | VIRADA |
| SHOT 11 | Veja só: eles nunca arrombaram o cofre, fizeram a Binance assinar os próprios saques. | 14 | 5,6 s | REVELAÇÃO |
| SHOT 12 | No fim, dois bilhões e oitocentos milhões viram gelo na frente do comparsa que riu. | 15 | 6,0 s | FECHO |
Total ≈ 64 s (+1,5 s de cartão final).

## Narração com tags — ElevenLabs (modelo Eleven v3 ou v4; voz Roger; estabilidade "Creative" ou "Natural")
Colar exatamente assim. Sem reticências de pausa: o ritmo é rápido do começo ao fim; o único respiro é a punchline.
```
[confident] Um engenheiro da Binance faz um teste de emprego falso e abre a porta pra seis bilhões.
[excited] A maior corretora do mundo contra hackers que querem o cofre ligado na internet.
[mischievously] O chefe dos hackers monta uma empresa falsa, com RH falso e até CEO falso.
Um comparsa ri: [laughs] "Entrevista de emprego? A gente vai roubar ou contratar estagiário?"
[whispers] O chefe só sorri.
[curious] Ele recebe uma tarefa de casa, roda o código e uma luzinha acende escondida.
[excited] Por semanas, eles pulam de computador em computador até a máquina que assina os saques.
[shouts] Numa quinta à noite, em vinte minutos, seis bilhões saem por dez blockchains!
No esconderijo, o comparsa debocha: [sarcastic] "Relaxa, ninguém no mundo congela blockchain."
[serious] Em uma hora, Tether e Circle congelam quase dois bilhões em moedas digitais.
[confident] Veja só: eles nunca arrombaram o cofre, fizeram a Binance assinar os próprios saques.
[laughs] No fim, dois bilhões e oitocentos milhões viram gelo na frente do comparsa que riu.
```
Por que cada tag (nenhuma é aleatória):
| Tag | Onde | Justificativa narrativa |
|---|---|---|
| `[confident]` | gancho | afirmação absurda dita com certeza: o público acredita e quer saber "como?" |
| `[excited]` | preparo | é um duelo gigante (a maior corretora x hackers); energia de trailer |
| `[mischievously]` | o plano | a empresa falsa é uma travessura: o narrador "entra no golpe" |
| `[laughs]` | piada 1 | é o deboche do comparsa; o riso dá a piada e cria o duvidador |
| `[whispers]` | "O chefe só sorri." | o herói não explica; o sussurro cria mistério e é a punchline |
| `[curious]` | a tarefa de casa | a pista: algo acende e ninguém vê |
| `[excited]` | semanas pulando | a escalada acelera |
| `[shouts]` | 20 minutos | o auge do roubo; o maior número do vídeo |
| `[sarcastic]` | piada 2 | a arrogância que será punida |
| `[serious]` | a virada | quebra o clima: a ameaça chegou |
| `[confident]` | revelação | clareza, mecanismo em uma frase |
| `[laughs]` | fecho | justiça cômica; fecha sorrindo (favorece o replay) |
Se uma tag sair estranha no teste, troque por: `[shouts]` → `[excited]`; `[mischievously]` → `[curious]`.

## Direção de voz
| Plano | Emoção | Int. (1–5) | Velocidade | Entonação | Respiro | Ênfase | Intenção |
|---|---|---|---|---|---|---|---|
| 1 | confiança | 4 | rápida, firme | afirmativa, sobe em "porta" | nenhum | FALSO, SEIS BILHÕES | prender com absurdo + número |
| 2 | empolgação | 4 | rápida | de trailer, sobe em "cofre" | nenhum | MAIOR, COFRE | duelo e prêmio |
| 3 | travessura | 3 | rápida | brincalhona, sobe a cada "falso" | nenhum | FALSO, FALSO, CEO FALSO | a piada visual do plano |
| 4 | deboche | 4 | normal na fala | pergunta exagerada | 0,1 s antes da fala | ESTAGIÁRIO | piada 1 |
| 5 | mistério | 2 | lenta (é o único respiro) | cai | 0,3 s depois | SORRI | o herói não explica |
| 6 | curiosidade | 3 | rápida | sobe em "luzinha" | nenhum | LUZINHA, ESCONDIDA | pista |
| 7 | empolgação | 4 | acelerando | sobe | nenhum | COMPUTADOR EM COMPUTADOR, ASSINA | escalada |
| 8 | explosão | 5 | rápida | grito controlado | nenhum | VINTE MINUTOS, SEIS BILHÕES | auge |
| 9 | sarcasmo | 4 | normal | arrogante, arrastado em "relaxa" | nenhum | NINGUÉM, CONGELA | piada 2 |
| 10 | seriedade | 4 | normal, seca | firme, cai | nenhum | UMA HORA, CONGELAM | virada |
| 11 | confiança | 3 | normal | didática, contraste "arrombaram x assinar" | nenhum | NUNCA, ASSINAR | revelação |
| 12 | riso | 4 | normal | brincalhona, ri no fim | nenhum | GELO, QUE RIU | fecho |

## Passo 5 — Folha de estilo (DEFAULT) e personagens
```
Flat 2D cartoon characters with simple round heads, dot eyes, thick clean black outlines and flat colours, animated on a
detailed stylised 3D-rendered background with soft daylight, warm saturated colours, shallow depth of field.
Vertical 9:16. Smooth, expressive cartoon acting. No captions, no subtitles, no logos, no watermarks; the only writing
allowed is a number on a prop.
```
- ENGINEER: "A young engineer with a round white head, messy brown hair, a teal hoodie and big over-ear headphones."
- BOSS: "The hacker boss, round white head, slicked-back black hair, a purple turtleneck and tiny round sunglasses."
- SIDEKICK: "His sidekick, round white head, a red cap worn backwards and an oversized grey tracksuit."
(No disfarce de "CEO falso", o BOSS usa um terno azul e um bigode postiço torto: a piada visual.)

## Passo 6 — Imagem de referência
```
Flat 2D cartoon characters with simple round heads, dot eyes, thick clean black outlines and flat colours, animated on a
detailed stylised 3D-rendered background with soft daylight, warm saturated colours, shallow depth of field. Vertical
9:16. Smooth, expressive cartoon acting. No captions, no subtitles, no logos, no watermarks; the only writing allowed is
a number on a prop. A young engineer with a round white head, messy brown hair, a teal hoodie and big over-ear
headphones. The hacker boss, round white head, slicked-back black hair, a purple turtleneck and tiny round sunglasses.
His sidekick, round white head, a red cap worn backwards and an oversized grey tracksuit. All three stand side by side,
full body, facing the camera, in a dim hideout full of glowing computer screens; the engineer holds a laptop, the boss
holds a fake moustache, the sidekick holds a slice of pizza. No text in the image.
```

## Passo 7 — Um prompt por plano (`[STYLE]` = folha de estilo acima, palavra por palavra)
**SHOT 1 — 6 s**
```
Use the attached images as the character and style reference. [STYLE] A young engineer with a round white head, messy
brown hair, a teal hoodie and big over-ear headphones. At night in a cosy apartment, the engineer sits at a kitchen
table in front of a laptop on a video call; camera starts close on the laptop screen and pulls back over his shoulder.
He presses Enter; the kitchen lights flicker and a huge steel vault door at the end of the hallway behind him slowly
swings open with golden light spilling out. A sticky note on the fridge reads "6". Sound: ambient sound effects only.
No dialogue, no narration, no music.
```
**SHOT 2 — 6 s**
```
Use the attached images as the character and style reference. [STYLE] Aerial drone shot at dusk of a gleaming glass
tower full of coins behind its windows, a giant glowing vault on its top floor connected to the city by bright cables;
on a dark rooftop across the street, tiny hooded figures watch with binoculars. The camera flies from the rooftop
towards the tower. Sound: ambient sound effects only. No dialogue, no narration, no music.
```
**SHOT 3 — 6 s**
```
Use the attached images as the character and style reference. [STYLE] The hacker boss, round white head, slicked-back
black hair, a purple turtleneck and tiny round sunglasses. In a dim hideout lit by green screens, medium shot slowly
pushing in. The boss hangs a fake company sign on a fake office wall, puts on a blue suit jacket and sticks on a crooked
fake moustache, then sits in a big leather chair facing a webcam. Sound: ambient sound effects only. No dialogue, no
narration, no music.
```
**SHOT 4 — 5 s**
```
Use the attached images as the character and style reference. [STYLE] His sidekick, round white head, a red cap worn
backwards and an oversized grey tracksuit. In the hideout, close-up at eye level. The sidekick laughs so hard he falls
off a rolling chair, pointing at the boss off-screen, pizza in hand. Sound: ambient sound effects only. No dialogue, no
narration, no music.
```
**SHOT 5 — 4 s**
```
Use the attached images as the character and style reference. [STYLE] The hacker boss, round white head, slicked-back
black hair, a purple turtleneck and tiny round sunglasses, still wearing the crooked fake moustache. Extreme close-up,
static camera, screens reflected in his sunglasses. He says nothing and slowly smiles. Sound: ambient sound effects
only. No dialogue, no narration, no music.
```
**SHOT 6 — 6 s**
```
Use the attached images as the character and style reference. [STYLE] A young engineer with a round white head, messy
brown hair, a teal hoodie and big over-ear headphones. Over-the-shoulder shot at his kitchen table, slow push-in into
the laptop. He opens an email with a homework file and runs it; deep inside the laptop, behind the screen, a tiny red
light quietly switches on while the engineer, unaware, sips his coffee. Sound: ambient sound effects only. No dialogue,
no narration, no music.
```
**SHOT 7 — 6 s**
```
Use the attached images as the character and style reference. [STYLE] Inside a stylised 3D maze of giant office
computers seen from above, camera gliding fast through it. A small red glowing dot hops from one computer to the next
like a frog, leaving a red trail, until it reaches a huge golden machine with a giant rubber stamp arm. Sound: ambient
sound effects only. No dialogue, no narration, no music.
```
**SHOT 8 — 5 s**
```
Use the attached images as the character and style reference. [STYLE] At night, the glass tower's vault seen from a
low angle; ten glowing pipes leave the vault in ten directions and millions of golden coins rush out through all of them
at once, the camera shaking; a big digital clock on the wall counts "20" minutes. Sound: ambient sound effects only. No
dialogue, no narration, no music.
```
**SHOT 9 — 5 s**
```
Use the attached images as the character and style reference. [STYLE] His sidekick, round white head, a red cap worn
backwards and an oversized grey tracksuit. In the hideout, medium shot, slow orbit. Golden coins pile up around the
sidekick, who leans back with his feet on the desk, lazily waving his hand at the screens with a smug grin. Sound:
ambient sound effects only. No dialogue, no narration, no music.
```
**SHOT 10 — 5 s**
```
Use the attached images as the character and style reference. [STYLE] Wide shot of the ten glowing pipes over the city
at night; suddenly a wave of frost runs along two of the pipes and the coins inside freeze into solid blocks of blue
ice, cracking loudly; snow starts to fall. Sound: ambient sound effects only. No dialogue, no narration, no music.
```
**SHOT 11 — 6 s**
```
Use the attached images as the character and style reference. [STYLE] Clean explainer set: a huge intact steel vault
door with no scratches, camera orbiting slowly. Beside it, the giant golden machine stamps one withdrawal slip after
another with an official golden seal while a tiny red dot sits on its control button. Sound: ambient sound effects
only. No dialogue, no narration, no music.
```
**SHOT 12 — 6 s**
```
Use the attached images as the character and style reference. [STYLE] His sidekick, round white head, a red cap worn
backwards and an oversized grey tracksuit. In the hideout, close-up, camera slowly pulling back. The pile of golden coins
around the sidekick turns into blocks of ice, frost climbs up his tracksuit until he is frozen in a block of ice
mid-laugh, a tiny label on the ice reads "2.85". Sound: ambient sound effects only. No dialogue, no narration, no music.
```

## Storyboard técnico (motor v2) — ângulos a cada 1,5–2,5 s
| Plano | Cortes internos (estabelecer → reação → detalhe) | Ambiente e luz (roteiro de cor) | Personagens / expressão | Câmera | Etiqueta / texto em cena | Transição |
|---|---|---|---|---|---|---|
| 1 | tela do laptop (CL) → rosto do engenheiro iluminado pela tela → porta do cofre abrindo no fundo do corredor | apartamento à noite, luz fria da tela + luz dourada saindo do cofre | engenheiro concentrado → assustado | empurra → recua sobre o ombro | etiqueta **"US$ 6,34 BI"** em "seis bilhões" | corte seco |
| 2 | drone sobre a cidade → torre de vidro com cofre → silhuetas no telhado | entardecer laranja-roxo | hackers pequenos de binóculo | drone avançando | placa da torre **"MAIOR CORRETORA DO MUNDO"**; etiqueta **"HOT WALLET"** no cofre | chicote |
| 3 | placa falsa na parede → chefe vestindo terno → bigode torto colando | esconderijo, luz verde de telas | chefe malicioso | empurra | placas **"RH"** e **"CEO"** nas portas falsas | corte |
| 4 | comparsa gargalhando → cai da cadeira → pizza no chão | igual | comparsa rindo (pose rindo, a criar) | close → tremida | — | corte seco |
| 5 | close do sorriso com telas refletidas nos óculos | igual, mais escuro | chefe sorrindo | parada | — | corte seco |
| 6 | sobre o ombro → e-mail "tarefa" → luzinha vermelha acendendo dentro do laptop | apartamento, frio | engenheiro tomando café, sem perceber | empurra até dentro do laptop | e-mail com assunto **"Tarefa técnica"** | mergulho na tela |
| 7 | labirinto de computadores (plongée) → ponto vermelho pulando → máquina dourada de carimbo | interior "digital" azul-escuro | — | voo rápido | etiqueta **"SERVIÇO QUE ASSINA OS SAQUES"** | corte |
| 8 | cofre em contra-plongée → 10 canos de moedas → relógio "20:00" | noite, dourado intenso | — | tremida | etiquetas **"20 MINUTOS"** e **"10 BLOCKCHAINS"** | corte |
| 9 | comparsa com pés na mesa → gesto de "relaxa" → telas | esconderijo dourado de moedas | comparsa convencido | órbita | — | corte |
| 10 | canos sobre a cidade → gelo correndo → moedas virando gelo | **virada fria: azul, neve** | — | geral → detalhe | logos NÃO; placas **"USDT"** e **"USDC"** nos canos; etiqueta **"QUASE US$ 1,8 BI CONGELADOS"** | corte seco |
| 11 | porta do cofre intacta → máquina carimbando saques | estúdio claro | — | órbita | etiqueta **"NINGUÉM ARROMBOU O COFRE"** | corte |
| 12 | comparsa rindo → gelo subindo → bloco de gelo com ele dentro | esconderijo azul gelado | comparsa congelado no meio da risada | recua | etiqueta **"US$ 2,85 BI CONGELADOS OU INTERCEPTADOS"** | fim na reação congelada (1 s) → cartão "Segue" 1,5 s |

## Direção de edição (som e efeitos)
| Momento | Efeito sonoro (SFX Kit) | Colchão sonoro | Visual | Destaque |
|---|---|---|---|---|
| 0,0 "Um engenheiro" | keyboard (clique do Enter) | zumbido de geladeira + trilha tensa baixa (contínua) | — | — |
| "seis bilhões" | cinematic-metal-big (porta do cofre) | sobe | zoom 6% | etiqueta |
| "maior corretora" | whoosh-medium-medium | — | chicote | — |
| "CEO falso" | pop-medium-in ×3 (um por "falso") | — | — | — |
| "estagiário?" | celebration-applause-small (risada) + impact-medium-soft (queda da cadeira) | — | tremida | — |
| "O chefe só sorri." | — | colchão cai a 40% por 0,4 s (nunca silêncio) | parada | — |
| "luzinha" | notification-attention-soft (bip baixinho) | grave | brilho vermelho | — |
| "computador em computador" | swipe-fast-firm ×4 (pulos) | acelera | trilha vermelha | — |
| "vinte minutos" | money-coins-pour + bass-rumble-medium + time-clock-fast | no máximo | tremida | etiquetas |
| "congela blockchain" | — | — | — | — |
| "congelam" | transform-fill invertido + impact-deep-hard (gelo estalando) | muda para grave frio | flash azul 0,15 s | etiqueta |
| "Veja só" | riser-1s-soft | volta suave | órbita | — |
| "viram gelo" | impact-heavy-hard (bloco de gelo) + pop-large-bubble | acorde final | recua | etiqueta |
| fim | whoosh + sting-bright-short | — | cartão "Segue o @_tudoem3d" 1,5 s | — |
Volume −14 LUFS, compressão forte (LRA ≤ 4 LU), voz sempre na frente. Música em alta só pelo app (10–15%).

## Passo 8 — Títulos e descrição
1. A entrevista de emprego que abriu a Binance
2. O teste de emprego de seis bilhões
3. O CEO falso que esvaziou a Binance
4. Seis bilhões em vinte minutos
5. Por que ninguém arrombou o cofre da Binance

Descrição: "Em 29/10/2026, cerca de US$ 6,34 bilhões saíram das carteiras quentes da Binance; segundo o relatório preliminar
da corretora, a invasão começou meses antes com uma entrevista de emprego falsa. Cerca de US$ 2,85 bilhões foram
congelados ou interceptados e a Binance diz que nenhum usuário arca com a perda. Os hackers e as falas são uma
dramatização. #binance #cripto #golpe"

## Conferência contra o documento (regra por regra)
| Regra | Situação |
|---|---|
| Gancho 5–18 palavras, afirmação, pessoa pelo papel, ação estranha, número específico | ✅ 17; "Um engenheiro da Binance faz um teste de emprego falso… seis bilhões" |
| Não abre com Como/O que/Por que/Você sabia/Imagine/Já, nem com Então/Mas/Aí | ✅ |
| Tempo presente | ✅ |
| Frase 2: os dois lados e o prêmio | ✅ a maior corretora x hackers; o cofre ligado na internet |
| Batidas na ordem | ✅ gancho 1 / preparo 2–3 / dúvida 4–5 / escalada 6–9 / virada 10 / revelação 11 / fecho 12 |
| Dúvida: fala de deboche ≤ 14 palavras; o herói não explica | ✅ 10 palavras; "O chefe só sorri." |
| Escalada: 2–3 passos no tempo; o lado do herói parece ganhar; pista visível | ✅ tarefa → semanas → quinta à noite; a luzinha |
| Virada: a grande ameaça chega | ✅ Tether e Circle congelam |
| Revelação: "Veja só" (= "You see") + mecanismo em uma frase; o herói nunca explica | ✅ |
| Fecho: quem riu recebe exatamente o que zombou (≤ 25 palavras) | ✅ o comparsa que disse "ninguém congela" vira gelo; 15 palavras |
| Toda frase nomeia algo visível | ✅ |
| Conectores só onde a ligação é real | ✅ nenhuma frase abre com Então/Mas/Aí |
| ≥ 2 piadas ditas pelos duvidadores | ✅ "estagiário" e "ninguém congela blockchain" |
| ≥ 2 números específicos e o público sabe o que contam | ✅ 6 bilhões (dólares levados), 20 minutos, 10 blockchains, 2,8 bilhões congelados |
| Sem anos | ✅ ("numa quinta à noite") |
| Frases de 10–17 palavras + 1 punchline de 3–6 | ✅ 13–17; punchline "O chefe só sorri." (4) |
| Sem introdução, canal, moral, pergunta ao público, chamada para ação | ✅ |
| Contagem (60 s, adaptação pt-BR 150 ±10) | ✅ 160 |
| Passo 3 (verdade x inventado), 5, 6, 7, 8 | ✅ |
Adaptação específica do tipo C: o "herói" é o lado do esquema (como no vídeo de referência da dashcam, em que o golpista é
o protagonista); a virada é a ameaça que chega contra o esquema.

## Fontes
CNBC 31/10/2026 (saques retomados; 90% coberto) · CoinDesk 30/10/2026 (múltiplos pontos de invasão) · Richard Teng no X
(~US$ 6,34 bi; "No user bears the loss") · The Daily Hodl 04/11/2026 (~US$ 2,85 bi congelados ou interceptados) ·
SecurityWeek, The Hacker News, Security Affairs, Pindrop (relatório preliminar de 03/11: entrevista falsa, tarefa de
programação, ferramenta de IA interna, serviço de assinatura) · StealthEX/Crystal Intelligence (horários dos congelamentos
da Tether e da Circle; fontes secundárias).
