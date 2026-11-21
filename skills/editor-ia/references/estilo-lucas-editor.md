# Estilo dos cortes (referência: portfólio do Lucas Editor)

Os estilos que o Lucas usa nos cortes, descritos para você escolher o visual de um corte novo:

| estilo | o que define | no plano.json |
|---|---|---|
| **Palavra amarela** | uma palavra por vez, amarela, fonte condensada em caixa alta (Anton/Bebas), legenda em ~62% da altura, @ do canal logo abaixo; b-roll de notícia em tela dividida ou cheia | legenda `palavra` |
| **Serifa** | gancho em tela preta com tipografia serifada animada; legenda serifada branca com sombra, palavra de destaque maior; cartão branco com grade e uma palavra serifada; fim em preto | `gancho` com `estilo: "serifa"`, `cartao` branco com grade, legenda `serifa` |
| **Palavras gigantes** | legenda pequena em Montserrat Bold; palavras-chave gigantes por cima do rosto; ícones animados em fundo chapado | legenda `montserrat`, cena `palavra`, `card-icone` |
| **Faixa de título** | faixa de título + ícone no gancho ("VOCÊ TEM DUAS OPÇÕES"); legenda condensada com a palavra-chave colorida; cartão vermelho de uma palavra | `faixa`, `cartao` vermelho |
| **Cartões e P&B** | legenda serifada; cartões pretos/brancos com grade; ícone animado (despertador); trecho em preto e branco | `cartao`, `adesivos` com `despertador`, `camera.pb` |

E o exemplo desta skill, feito do zero por ela: `exemplos/reels-5-passos/` (Reels gravado só com voz, 55 s, 13 cenas de colagem).

## As regras que se repetem (o "jeito Lucas Editor")

1. **9:16 (1080x1920)**, falante com o rosto no terço de cima, microfone aparecendo. **Zoom alternado (punch-in) nas emendas** para esconder os jump cuts.
2. **Gancho forte nos 2–3 primeiros segundos**: título animado em tela cheia ou faixa de título. Se o melhor gancho da conversa está no meio, ele vira o texto da abertura.
3. **Legenda de 1 a 3 palavras**, palavra a palavra, no centro-baixo; **uma palavra-chave por grupo** na cor da marca do cliente (`marca.json`; o amarelo `#FFB800` dos exemplos é a marca do Lucas Editor, não um padrão).
4. **B-roll a cada 3–6 s** — nunca mais de ~6 s só com a cara falando. Num corte de 80 s, umas 18 cenas.
5. **Ilustre o que está sendo dito, literalmente**: se fala "500 dinheiros", conta até 500 com notas caindo; se fala "votar", aparece a urna; se fala "palhaço", a urna ganha nariz de palhaço. Concreto ganha de abstrato.
6. **Ritmo sem respiro morto**: corte bruto apertado (pausas ≤ 0,16 s), cenas que entram com mola e saem rápido, SFX em cada entrada.
7. **Som**: efeito em cada movimento (whoosh nas entradas, pop nos ícones, impacto nos carimbos e slams), trilha discreta que "abre espaço" para a voz (carve), **−14 LUFS / −1 dBTP** no final (o portfólio variava de −8 a −22 LUFS; agora padroniza).
8. **Paleta escura**: fundo `#0B0B0D`, cards `#16161A`, texto `#F5F3EE`, destaque do canal, vermelho `#E5202A` para alerta/carimbo, verde `#2DBE60` para "certo".
9. **Nada de gente desenhada** nos b-rolls (rosto, mão, corpo, avatar): pessoas viram ícones, balões, pinos, cédulas, fichas. O único rosto é o do próprio falante no vídeo.
10. **Fidelidade**: nada de número, dado ou afirmação que a pessoa não disse. Assunto político/polêmico: ilustre a fala, sem opinião.

## Personalizar para outro canal

A identidade de cada cliente fica em `marca.json` na pasta do projeto (perguntada na Fase 2): `handle`, `acento`, `legenda`. No `plano.json` dá para sobrescrever por corte: `canal.handle` (@ que aparece sob a legenda), `canal.acento` (cor de destaque), `legenda.estilo` (`anton` · `palavra` · `serifa` · `montserrat`). O resto se ajusta sozinho (bordas dos cards, palavras-chave, faixas, botões).
