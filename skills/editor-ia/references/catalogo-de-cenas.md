# Catálogo de cenas (b-rolls em motion design)

19 modelos em `template/compositions/cenas/`. Cada cena do `plano.json` escolhe um `tipo` e preenche `params`. Tempos dentro de `params` são **segundos desde o início da cena** (ou `"~frase"` / `"@t"`). Texto aceita `*ênfase*` (pinta na cor de destaque) e `\n` (quebra de linha). Cores aceitam hex ou nome: `acento`, `branco`, `preto`, `vermelho`, `verde`, `azul`, `amarelo`, `laranja`, `roxo`, `rosa`, `cinza`. Fundos de tela cheia: `escuro`, `vermelho`, `verde`, `azul`, `amarelo`, `roxo`, `laranja`.

**Layouts:** `dividido` = card em 0–960 e o falante embaixo (a câmera e a legenda se ajustam sozinhas; `entrada`/`saida` são automáticas) · `cheio` = cobre a tela inteira · `sobre` = por cima do vídeo, sem mexer na câmera.

Índice: [gancho](#gancho) · [faixa](#faixa) · [card-icone](#card-icone) · [troca](#troca) · [adesivos](#adesivos) · [palavra](#palavra) · [chat](#chat) · [busca](#busca) · [glitch](#glitch) · [cartaz](#cartaz) · [versus](#versus) · [degraus](#degraus) · [grade](#grade) · [contador](#contador) · [alerta](#alerta) · [rota](#rota) · [baloes](#baloes) · [cartao](#cartao) · [imagem](#imagem) · [ícones](#ícones)

---

## gancho
**cheio · sem legenda** — título de abertura (0–3 s): 2–3 linhas batendo no ritmo, partículas, saída "atravessando" para o vídeo. Cobre o começo (inclusive plano aberto).
```json
{"tipo": "gancho", "inicio": 0, "dur": 3.0, "params": {
  "rotulo": "NOME DO PODCAST · CONVIDADO", "icone": "bandeira-china",
  "linhas": [{"texto": "O chinês"}, {"texto": "não acreditou"}, {"texto": "na nossa democracia"}],
  "fundo": "vermelho", "particulas": "estrelas", "estilo": "condensada"}}
```
`linhas[].cor` (padrão: 2ª linha na cor de destaque), `linhas[].tam` (150 / última 94), `regua` (barra entre as linhas, true), `batidas` (tempos de cada linha; padrão a cada 0,68 s), `estilo: "serifa"` (fundo preto + Garamond, o estilo "Serifa"), `particulas`: `estrelas` · `pontos` · `nenhuma`, `icone_tam` (210), `topo` (470), `saida` (dur − 0,26).
SFX: riser até a saída, impacto em cada linha, whoosh na 2ª linha e na saída.

## faixa
**sobre** — faixa de título fixa no alto, por cima do falante (o gancho do r38tao). Boa para abrir sem cobrir o rosto, ou como título do corte inteiro.
```json
{"tipo": "faixa", "inicio": 0, "dur": 4.0, "params": {"texto": "você tem *duas opções*", "icone": "alvo", "y": 150}}
```
`sub` (linha pequena), `cor` (acento), `cor_texto` (preto), `enfase`, `em` (0,05), `saida` (dur − 0,3). SFX: whoosh + pop do ícone.

## card-icone
**dividido** — um ícone grande, um chip de texto e, opcional, um carimbo. O curinga para "o assunto é X".
```json
{"tipo": "card-icone", "inicio": 5.8, "dur": 3.6, "params": {
  "rotulo": "A lacrada", "icone": "bandeira-china", "icone_tam": 540, "fantasma": "中国", "brilho": "#D7261E",
  "chip": {"texto": "sem democracia", "em": "~sem democracia"},
  "carimbo": {"texto": "atraso", "cor": "vermelho", "em": "~atraso-0.08"}}}
```
`icone_tam` (420), `fantasma` (texto gigante translúcido no fundo), `brilho` (cor do halo), `chip.cor`/`chip.fundo`/`chip.tam`, `carimbo.rot`/`carimbo.tam`, `apagar_no_carimbo` (ícone fica cinza no carimbo, true). SFX: pop no ícone e no chip, impacto no carimbo (+ sino se o carimbo for verde).

## troca
**dividido** — fase A: ícone + frase (um X vermelho pode se desenhar por cima); fase B: A sai de lado, B chega com outra frase. Para "isso não… mas sim aquilo", "antes/depois".
```json
{"tipo": "troca", "inicio": 9.05, "dur": 3.75, "params": {"rotulo": "O argumento",
  "a": {"icone": "urna", "tam": 640, "titulo": "vocês *não* votam", "riscar_em": "~votar"},
  "b": {"icones": ["coroa", "cadeado"], "titulo": "quem *manda?*", "em": "~escolhe"}}}
```
`a.titulo_em` (0,6), `a.enfase` (vermelho), `b.icones` (1º grande, 2º pequeno embaixo), `b.tam` (240), `b.enfase`. SFX: erro no X, pop + brilho na fase B.

## adesivos
**sobre** — ícones/palavras que pulam por cima do vídeo, balançam e saem. Para falas curtas e engraçadas ("tô bêbado", "?", "HIC!").
```json
{"tipo": "adesivos", "inicio": 55.1, "dur": 2.2, "params": {"saida": 2.0, "itens": [
  {"icone": "cerveja", "x": 770, "y": 70, "tam": 250, "em": "~tô bêbado"},
  {"texto": "HIC!", "x": 640, "y": 60, "tam": 230, "rot": -8, "em": 0.9, "sai_em": 1.55, "balancar": false}]}}
```
Itens: `icone` **ou** `texto`, `x`/`y` (canto superior esquerdo, px da tela), `tam`, `rot`, `em`, `cor`, `balancar` (true), `riscar_em` (desenha um X por cima), `sai_em`. Posições seguras: cantos de cima (y < 450) e laterais; longe da boca e da faixa da legenda. SFX: pop por item (com pan pela posição), erro no X.

## palavra
**sobre · sem legenda** — a palavra-chave **gigante por cima do rosto** (o "NÃO É BOM" da Luana). Use 1–3 palavras no auge de uma frase.
```json
{"tipo": "palavra", "inicio": "~não é bom-0.05", "dur": 1.4, "params": {"texto": "não é *bom*", "tam": 230, "y": 620}}
```
`estilo` (`condensada` · `serifa`), `cor` (branco), `escurecer` (vinheta escura atrás, true), `intervalo` entre palavras (0,12), `saida`. SFX: impacto.

## chat
**dividido** — conversa em mensagens: lado `a` pergunta (com "digitando…"), lado `b` responde. Para diálogos contados ("ele falou… eu falei…").
```json
{"tipo": "chat", "inicio": 15.4, "dur": 9.0, "params": {"rotulo": "O interrogatório",
  "lados": {"a": {"icone": "bandeira-china", "cor": "#3B1513", "borda": "#D7261E", "texto": "#FBE9E7"},
            "b": {"icone": "bandeira-brasil", "cor": "#13A05B", "texto": "#FFFFFF"}},
  "msgs": [{"t": "~como é que funciona", "lado": "a", "texto": "Como funciona no Brasil?"},
           {"t": "~sim", "lado": "b", "texto": "Sim."}]}}
```
Mensagens curtas (até ~32 letras). Mais de 6 → a lista rola. `digitando` (true), `maiusculas` (true). SFX: cliques de digitação + notificação no lado a, pop no lado b.

## busca
**dividido** — janela de IA/buscador: a pergunta é digitada, a barra carrega; depois a resposta em destaque e uma revelação com ícone (e acessórios que caem nele).
```json
{"tipo": "busca", "inicio": 32.05, "dur": 5.75, "params": {"rotulo": "Pesquisando no IA deles",
  "janela": {"icone": "bandeira-china", "nome": "IA", "sub": "CHAT · 中文 / PT"},
  "consulta": "Eleição no Brasil: qualquer um pode ser candidato?",
  "resposta": {"texto": "você tá falando *sério?*", "autor": "— O CHINÊS", "em": "~você tá falando sério", "ate": 4.05},
  "revelacao": {"icone": "urna", "titulo": "a gente tem *tiririca*", "em": "~a gente tem",
    "extras": [{"icone": "nariz-palhaco", "x": 460, "y": 148, "tam": 150, "em": "~palhaço"}]}}}
```
`digitar_em` (0,42), `cps` (letras por segundo, 34), `status`, `resposta.enfase`, `revelacao.tam` (620), `extras[].x/y` relativos à área da revelação (topo do card + 130). SFX: digitação, ping no fim da busca, impacto na resposta, pops na revelação.

## glitch
**cheio · sem legenda · derruba a trilha** — frase de impacto com separação RGB e fatias (0,8–1,2 s). No máximo 1–2 por corte, nas frases mais fortes.
```json
{"tipo": "glitch", "inicio": "~vocês são malucos-0.05", "dur": 0.9, "params": {
  "linhas": [{"texto": "vocês são", "tam": 170}, {"texto": "malucos", "tam": 300, "cor": "acento"}],
  "sub": "— O CHINÊS", "fundo": "vermelho"}}
```
`quente`/`frio` (cores da separação), `flash` (cor do clarão inicial), `segundo_pulso` (0,56), `topo` (560). SFX: glitch + impacto; a trilha fica muda durante a cena.

## cartaz
**cheio** — um "santinho"/cartaz/ficha: cabeçalho, ícone na foto, número, nome, faixa de destaque e carimbo. Para "imagina um candidato…", produto, ficha de alguém (sem desenhar a pessoa: o ícone representa).
```json
{"tipo": "cartaz", "inicio": 24.4, "dur": 3.8, "params": {"cabecalho": "VOTE", "cor": "#1E3F8F", "icone": "garrafa",
  "numero": "00", "numero_rotulo": "CANDIDATO Nº", "sub": "PARA PRESIDENTE", "nome": "bebadozinho de rua",
  "promessa": {"rotulo": "PROMESSA", "texto": "tapioca pra todo mundo", "em": "~tapioca"},
  "carimbo": {"texto": "pode!", "cor": "verde", "em": "~pode"}, "fantasma": "VOTE 00"}}
```
`cor_cabecalho`, `faixa` (cores da listra), `icone_tam` (440). O papel termina em y 1220 (legenda livre). SFX: whoosh, pop, whoosh na faixa, carimbo.

## versus
**cheio** — dois cards inclinados frente a frente + selo VS; um lado ganha destaque. Para comparações ("o nosso vs o deles", "antes vs agora").
```json
{"tipo": "versus", "inicio": 37.8, "dur": 3.9, "params": {"titulo": "qual é melhor?", "rodape": "você quer me convencer?",
  "esq": {"faixa": "BRASIL", "cor": "#13A05B", "icone": "bandeira-brasil", "sobre": "ESSE MODELO", "titulo": "qualquer um se candidata", "icone2": "urna"},
  "dir": {"faixa": "CHINA", "cor": "#D7261E", "icone": "bandeira-china", "sobre": "O NOSSO", "titulo": "?", "icone2": "interrogacao"},
  "destaque": {"lado": "dir", "em": 3.1}}}
```
`inclinacao` (14°), `icone_tam` (240), `icone2_tam` (260). SFX: impacto, whoosh de cada lado, pop no VS, clique no destaque.

## degraus
**dividido** — etapas que crescem a cada fala e uma ficha que sobe pulando; opcional: vira um organograma. Para "passo a passo", "carreira", "como funciona".
```json
{"tipo": "degraus", "inicio": 41.7, "dur": 8.9, "params": {"rotulo": "O modelo deles",
  "degraus": [{"texto": "notas boas", "em": "~umas notinhas"}, {"texto": "cargo pequeno", "em": "~pequeno cargo"}, {"texto": "promovido", "em": "~promovido"}],
  "fase2": {"em": "~e você vai ter uma", "titulo": "hierarquia de *empresa*", "titulo_em": "~hierarquia"}}}
```
2–5 degraus. `cor` (vermelho), `ficha` (ícone que pula; padrão uma ficha com estrela). SFX: pop em cada degrau, clique em cada pulo, whoosh + brilho na fase 2.

## grade
**dividido** — dezenas de ícones iguais se espalham do centro; num tempo todos ganham X (ou check) e um carimbo bate. Para "todo mundo", "a maioria", "milhões de pessoas" (pessoas viram cédulas, pinos, balões).
```json
{"tipo": "grade", "inicio": 50.6, "dur": 3.9, "params": {"rotulo": "Se a população chinesa votasse", "icone": "cedula",
  "colunas": 11, "linhas": 6, "marcar": {"em": "~num louco", "icone": "x"}, "carimbo": {"texto": "num louco", "em": "~num louco"}}}
```
SFX: brilho na entrada, glitch curto na marcação, impacto no carimbo.

## contador
**cheio** — número que conta crescendo + rótulo, chuva de ícones, chips e um final opcional (se o ícone final for `urna`, aperta CONFIRMA e a tela troca). Para valores, preços, estatísticas **ditos na fala**.
```json
{"tipo": "contador", "inicio": 57.4, "dur": 4.8, "params": {"fundo": "verde",
  "numero": {"de": 0, "valor": 500, "em": 0.22, "dur": 0.7, "prefixo": "", "sufixo": ""},
  "rotulo": {"texto": "dinheiros", "em": "~dinheiros"}, "chuva": {"icone": "dinheiro", "qtd": 26, "em": 0.9},
  "chips": [{"texto": "pra beber mais", "icone": "cerveja", "em": "~pra beber"}, {"texto": "e não fazer nada", "escuro": true, "em": "~e não fazer nada"}],
  "final": {"icone": "urna", "em": "~eu voto-0.22", "apertar_em": "~voto", "de": "00", "para": "FIM"}}}
```
`numero.valor` é o número final (≥ 10 000 ganha ponto de milhar), `prefixo` ("R$ "), `sufixo` ("%", " mil"). `chuva.icone`: `dinheiro`, `moeda`, `estrela`, `coracao`… `final.titulo` (texto embaixo do ícone). SFX: impacto, cliques contando, impacto + sino no rótulo, pops nos chips, whoosh + bipe da urna no final.

## alerta
**dividido** — fitas de perigo, palavra grande + aviso em vermelho; opcional: troca o aviso por outro ícone e uma frase. Para "perigoso", "cuidado", "o erro", viradas de opinião.
```json
{"tipo": "alerta", "inicio": 64.0, "dur": 5.3, "params": {"rotulo": "A virada", "palavra": {"texto": "democracia", "em": "~democracia"},
  "alerta": {"texto": "perigosa", "em": "~perigosa-0.1"},
  "troca": {"icone": "trofeu", "sobre": "EU ACHAVA QUE ERA", "titulo": "o *melhor regime* do mundo", "em": "~achava a democracia+0.12"}}}
```
`fita` (true). SFX: whoosh das fitas, impacto na palavra, erro no aviso, brilho na troca.

## rota
**cheio** — mapa de pontos: origem e destino com pinos (e bandeiras), a rota se desenha enquanto o veículo segue. Para viagens, mudanças, "saí de X e fui para Y".
```json
{"tipo": "rota", "inicio": 69.3, "dur": 3.0, "params": {"rotulo": "CHINA → BRASIL", "veiculo": "aviao",
  "origem": {"nome": "CHINA", "icone": "bandeira-china", "cor": "#D7261E", "x": 790, "y": 345},
  "destino": {"nome": "BRASIL", "icone": "bandeira-brasil", "cor": "#13A05B", "x": 225, "y": 1005}}}
```
`x`/`y` = ponta do pino (y < 1250). `icone: "pino"` = só o pino. `veiculo`: `aviao` ou `foguete` (ícones que apontam para cima; o veículo gira seguindo a rota). `em` (0,4), `dur_voo` (2,2), `fundo` (azul). SFX: whoosh, pops nos pinos, whoosh longo no voo.

## baloes
**dividido** — pergunta grande; uma multidão de balões de opinião se espalha; no fim tudo se recolhe num ícone final. Para "a opinião das pessoas", "todo mundo fala", "a internet".
```json
{"tipo": "baloes", "inicio": 75.1, "dur": 6.18, "params": {"rotulo": "A pergunta",
  "titulo": {"texto": "quem *decidiu?*", "em": 0.3, "ate": 2.3},
  "multidao": {"em": "~opinião", "texto": "a opinião da *maioria*", "qtd": 34},
  "final": {"icone": "lampada", "texto": "boa ideia?", "em": "~seria uma boa ideia"}}}
```
`multidao.cores`, `multidao.marcas` (`?`, `!`, `…`). SFX: impacto no título, pops na multidão, ping + brilho no final.

## cartao
**dividido ou cheio** (`layout`) — cartão tipográfico: branco ou preto com grade e uma palavra serifada, ou vermelho chapado com uma palavra (estilos "Serifa", "Cartões e P&B" e "Faixa de título"). Para frases-tese, conceitos, "EXISTE".
```json
{"tipo": "cartao", "inicio": "~existe-0.05", "dur": 1.8, "params": {"texto": "*existe*", "fundo": "vermelho", "estilo": "condensada", "layout": "cheio"}}
```
`fundo`: `branco` · `preto` · `vermelho` · `acento` · hex. `grade` (true), `estilo` (`serifa` · `condensada`), `sub` (rótulo pequeno em cima), `tam`, `em`, `intervalo`, `saida` (só no cheio). SFX: whoosh (cheio) + pop.

## imagem
**dividido ou cheio** (`layout`) — uma imagem **do usuário** (print de notícia, foto de produto, gráfico, logo) num card com Ken Burns e um título. O montador copia o arquivo para `assets/imagens/`.
```json
{"tipo": "imagem", "inicio": "~saiu na notícia", "dur": 3.0, "params": {"arquivo": "imagens/manchete.jpg", "titulo": "saiu no *jornal*", "fonte": "Fonte: G1 · 2024"}}
```
`moldura` (true: card com margem; false: sangra), `ajuste` (`cover` · `contain`), `ken_burns` (true), `pb` (preto e branco), `em`. Só use imagem que o usuário tem direito de usar; não gere nem baixe imagem de pessoas.

---

## ícones

Nomes em português (ou o nome interno em inglês). Todos SVG chapados, sem pessoas.

- **Países:** `bandeira-brasil`, `bandeira-china`, `bandeira-<código>` (us, pt, ar, fr, it, de, es, jp, ru, mx, co, ie, be, ng, nl, ua, pl)
- **Política/justiça:** `urna`, `cedula`, `balanca`, `martelo`, `megafone`, `coroa`, `cadeado`, `escudo`, `chave`
- **Dinheiro/negócios:** `dinheiro` (nota), `moeda`, `saco-dinheiro`, `grafico-subindo`, `grafico-caindo`, `grafico` (barras), `porcentagem`, `maleta`, `predio`, `carrinho`, `presente`
- **Sinais:** `x`, `check`, `interrogacao`, `exclamacao`, `alerta`, `seta-cima`, `seta-baixo`, `estrela`, `brilho`, `fogo`, `raio`, `alvo`, `trofeu`, `medalha`, `coracao`, `ficha`
- **Objetos:** `lampada`, `lampada-apagada`, `garrafa`, `cerveja`, `remedio`, `haltere`, `livro`, `formatura`, `microfone`, `celular`, `notebook`, `play`, `email`, `relogio`, `despertador`, `calendario`, `ampulheta`, `bateria-cheia`, `bateria-fraca`, `lupa`, `balao`, `pino`
- **Lugares/transporte:** `casa`, `predio`, `globo`, `aviao`, `carro`, `foguete`
- **Humor:** `nariz-palhaco`, `chapeu-festa`

Ícone que não existe vira um "?" cinza e um aviso no console. Precisa de um ícone novo? Desenhe em `template/lib/br-kit.js` (`I.nome = (w) => svg`) e registre o apelido em `ALIAS` — formas chapadas, nunca figura humana.
