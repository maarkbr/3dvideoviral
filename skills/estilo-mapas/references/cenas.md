# As cenas do kit (o campo `cena` de cada bloco do roteiro.json)

Cada bloco do roteiro tem `fala` (o que a voz diz) e `cena` (o que aparece). A cena começa quando a fala do bloco começa e termina quando a próxima começa. Tudo o que entra na tela (país aceso, rótulo, emoji, linha) entra **na palavra falada** que você indicar em `palavra`: é isso que deixa o vídeo "no ritmo". Se a palavra não for achada na voz, o kit usa um tempo padrão dentro do bloco.

Países: pelo nome em inglês do Natural Earth, exatamente como em `dados/paises.txt` (`Brazil`, `United States of America`, `Russia`, `Dem. Rep. Congo`, `Bosnia and Herz.`...). Coordenadas: `[lon, lat]` em graus (oeste e sul são negativos; São Paulo é `[-46.6, -23.5]`). O zoom da câmera (`zoom`) é o tamanho do globo na tela: 520 mostra o globo inteiro, ~1300 um continente, ~2000 a 2500 um país médio, 5000 ou mais uma região.

## As cenas gerais (servem para qualquer tema)

| tipo | o que faz | campos |
|---|---|---|
| `abertura` | **Sempre o bloco 1.** Globo inteiro girando até o país, que acende com brilho, e zoom até ele caber na tela. | `pais`, `cor`, `itens`, `apagar` (true: apaga no fim do bloco) |
| `pais` | Um ou mais países acendem, cada um com uma cor, e a câmera enquadra todos. | `pais` ou `paises` (lista), `cor` ou `cores`, `palavras` (uma por país, na ordem), `manter` (não apaga no fim), `camera`, `itens` |
| `mover` | Uma cópia do país sai do lugar e vai até outro, **no tamanho real** (gira a esfera, então a Groenlândia não fica gigante). É o "se você colocasse o Chile em cima do Brasil". | `pais`, `para` (país ou `[lon, lat]`), `cor`, `cor_para`, `palavra` (quando começa a andar), `voltar` (true: volta no fim), `camera`, `itens` |
| `trocar` | "E se X e Y trocassem de lugar": os dois andam ao mesmo tempo, os lugares originais ficam apagados. Se estiverem longe um do outro, a câmera visita cada lugar novo. | `paises: [X, Y]`, `cores`, `palavra`, `duracao_movimento`, `itens` |
| `fronteira` | A fronteira entre dois países se desenha (com montanhas, se for cordilheira). | `a`, `b`, `cor`, `montanhas` (true), `pintar` (false: não acende os países), `cor_a`, `cor_b`, `palavra`, `itens` |
| `faixa` | O país fica apagado e só um pedaço acende: o território de uma época, a parte que foi comprada, a que foi perdida. | `pais`, `latN`, `latS`, `lonW`, `lonE` (o retângulo; o que faltar usa o limite do país), `cor`, `palavra`, `camera`, `itens` |
| `rota` | Linha tracejada pelo caminho mais curto do globo, de um lugar a outro, com um emoji andando nela (navio, avião, caravana). | `de`, `para` (país ou `[lon, lat]`), `cor`, `emoji`, `tam`, `palavra`, `duracao_movimento`, `itens` |
| `ano` | Um ano (ou número) grande no alto da tela, com o mapa indo para um país ou lugar. | `ano`, `pais`, `camera`, `altura` (px do topo, padrão 330), `itens` |
| `cta` | Fundo escurece, o globo gira devagar, entram o selo, a frase e as teclas com a palavra do comentário. **Sempre o último bloco.** | `palavra` (as teclas; vazio = sem teclas), `antes` (padrão "Comenta"), `depois` (frase embaixo), `selo` (pílula em cima; vazio = sem), `logo: "claude"` (põe o logo do Claude no selo) |

Campos que servem para todas: `camera: {"lon", "lat", "zoom"}` (sem ela, a câmera enquadra sozinha os países da cena), `folga` (1 = justo; 1.3 = mais afastado), `ate_bloco: N` (o efeito fica na tela até o fim do bloco N, em vez de sair no fim deste), `palavra`.

### Os itens (rótulos, selos e emojis presos ao mapa)
`itens` é uma lista. Cada item é um texto **ou** um emoji:
- `{"tipo": "rotulo", "texto": "ANDES", "palavra": "cordilheira"}`. Tipos: `rotulo` (texto branco com contorno), `rotulo grande` (caixa preta e amarela), `rotulo agua` (oceano, itálico azul-claro), `selo` (etiqueta amarela), `selo grande`, `selo vermelho`.
- `{"emoji": "money_bag", "palavra": "salitre", "tam": 170}`: ícone 3D da biblioteca `icones3d/` da skill (nome do arquivo, sem .png; veja o INDEX.md; NUNCA emoji) (`snow-capped_mountain`, `crossed_swords`, `ship`, `airplane`, `crown`). O `montar.py` baixa sozinho os que não estão em `emoji/`.
- Onde fica: `pais` (no meio do país), ou `lon` e `lat`, ou `tela: [x, y]` (fixo na tela, em px de 1080x1920; o centro é `[540, 900]`). Ajuste fino com `dx` e `dy` (px). Emoji sem `dy` fica 170 px acima do ponto, para não cobrir o rótulo.
- Quando entra: `palavra` (a palavra da fala) ou `em` (segundos depois do início do bloco). Quando sai: no fim do bloco, ou `ate_bloco`.

**Não ponha texto em cima da legenda:** a legenda fica entre y 1240 e 1440. Rótulos e selos vão do meio para cima da tela (y < 1150).

### Exemplo (bloco de "e se trocassem de lugar")
```json
{"fala": "Agora troca. A Rússia cai em cima da América do Norte e os Estados Unidos vão parar na Sibéria.",
 "cena": {"tipo": "trocar", "paises": ["Russia", "United States of America"], "cores": ["#D8433B", "#3E7FD8"], "palavra": "troca",
          "itens": [{"emoji": "snowflake", "pais": "Russia", "palavra": "siberia"}]}}
```

## As cenas do Chile (só para o modelo)
`globo`, `comparar`, `andes`, `pacifico`, `colonia`, `independencia`, `atacama`, `guerra`, `patagonia`, `final` têm as coordenadas do Chile escritas no código. Servem para estudar o ritmo do modelo; num tema novo, use as cenas gerais acima.

## Cena que não existe
Se o tema pede algo que nenhuma cena faz (um rio se desenhando, um ponto piscando numa cidade, um gráfico), crie um `cenas.js` **na pasta do vídeo** (nunca edite o `kit/`, ele é copiado de novo a cada `montar.py`):
```js
window.CENAS_EXTRA = (api) => {
  const { tl, CENA, camera, pinta, apaga, entra, sai, prende, div, emoji, quando, vez, itens, lugar, fimEfeito, upd } = api;
  CENA.cidade = (c, i, t0, t1) => {
    camera(t0, 1.0, { lon: c.lon, lat: c.lat, r: c.zoom || 4000 });
    const ponto = prende(div("selo vermelho", c.nome), c.lon, c.lat);
    entra(ponto, vez(i, c, t0 + 0.8)); sai(ponto, fimEfeito(c, t1) - 0.3);
    itens(c, i, t0, t1, null);
  };
};
```
Regras do código: o mapa é desenhado **uma vez por quadro** (nunca desenhe dentro do onUpdate de uma animação: no render o HyperFrames pula para qualquer ponto do vídeo e o desenho sai velho); nada de `Math.random` nem `Date`; anime sempre pela timeline `tl` com `...upd`; tudo que aparece começa invisível e entra com `entra()` (ele já põe o som de pop, ping ou impacto). Câmera com 0,9 s ou mais ganha whoosh sozinha.
