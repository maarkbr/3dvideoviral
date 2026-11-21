# Seleção dos melhores cortes (Fase 3)

Dois modos de entrada. O pedido do usuário diz qual:

- **Melhores cortes do podcast inteiro** — o usuário entrega o episódio (1–3 h) e quer os trechos com mais chance de viralizar.
- **Trecho específico** — o usuário diz onde começa ("a partir de 13:17", "a parte em que ele fala da China"). Você só acha o fim natural da história.

## Modo trecho específico

1. Transcreva uma janela folgada: do início dado −10 s até +5 min (`transcrever.py <podcast> work/janela.json --inicio 13:07 --fim 18:20 --prompt "<nomes>"`).
2. Leia a janela e ache: a primeira frase que abre a história (às vezes 2–3 s antes do tempo dado), o clímax (a frase de efeito) e o **fechamento** (a conclusão, a lição ou a reação final). O corte termina logo depois do fechamento — nunca no meio da explicação, nunca depois que o apresentador muda de assunto.
3. Diga ao usuário em 2 linhas: "a história vai de 13:17 a 16:05 (2:48 de conversa); depois da limpeza fica com ~1:20". Siga para a decupagem.

## Modo melhores cortes

1. **Transcreva o episódio inteiro** uma vez: `transcrever.py <podcast> cortes/transcricao.json --modelo small --vad --prompt "<nome do podcast, convidado, assuntos>"`. Em CPU leva ~1/4 a 1/6 da duração (um podcast de 2 h ≈ 20–40 min). Avise o usuário antes de começar e mostre o andamento. Para varrer mais rápido use `--modelo base` e refaça só o trecho escolhido com `small`.
2. **Gere o mapa**: `mapa_do_podcast.py cortes/transcricao.json cortes/mapa.md`. Ele quebra em blocos de ~45 s e dá uma nota ★ de pista (marcadores de história, emoção, números, riso, ritmo da fala). A nota só ordena a leitura: **quem escolhe é você, lendo o texto**.
3. **Leia os blocos mais quentes e os vizinhos** (um bom corte costuma juntar 2–4 blocos seguidos) e avalie cada candidato pela rubrica abaixo.
4. **Apresente 5–10 candidatos** numa tabela e peça a escolha com uma pergunta clicável de **múltipla escolha** (o usuário pode marcar vários). Recomende os 3 melhores.

### Rubrica (0–5 cada; corte bom soma 20+ de 30)

| critério | o que procurar |
|---|---|
| **Gancho** | os primeiros 3 s prendem sozinhos? Uma frase de impacto, uma pergunta, uma situação absurda ("Eu tava num papo de bêbado na China…"). Se o gancho está no meio, ele pode virar o título animado de abertura. |
| **História completa** | começo, meio e fim: situação → conflito/virada → conclusão. Fica de pé sem o resto do episódio (sem "como eu falei antes", sem nomes que ninguém conhece). |
| **Emoção** | humor, choque, indignação, vulnerabilidade, polêmica. Risada real do apresentador é sinal forte. |
| **Frase citável** | pelo menos uma frase que dá vontade de mandar para alguém ("Saí da China achando que os malucos somos nós"). |
| **Universalidade** | interessa a quem não conhece o convidado: dinheiro, relacionamento, carreira, saúde, curiosidade, bastidores. |
| **Ilustrável** | dá para ilustrar com cenas (lugares, números, objetos, comparações, conversas)? Quanto mais concreto, mais forte a edição. |

Descarte: trechos que dependem de imagem que não aparece, ataques a pessoas comuns, informação sensível de terceiros, propaganda do patrocinador, e falas que só funcionam com o contexto do episódio.

### Tabela para o usuário

```
| # | trecho | duração bruta → final | título de trabalho | gancho (primeira frase) | por que viraliza | nota |
|---|--------|----------------------|--------------------|--------------------------|------------------|------|
| 1 | 13:17–16:05 | 2:48 → ~1:20 | Papo de bêbado na China | "Eu tava num papo de bêbado…" | choque cultural + punchline forte | 26 |
```

Duração-alvo do corte final: **30–90 s** (o portfólio vai de 11 a 82 s). A limpeza costuma tirar 40–55% do tempo bruto; uma história de 2–3 min de conversa vira ~60–90 s.

### Depois da escolha

Crie uma pasta por corte (`cortes/01-papo-china/`, `cortes/02-…`) e siga a decupagem de cada um. Com vários cortes, siga `varios-cortes.md` (uma etapa para todos, um gate para todos).
