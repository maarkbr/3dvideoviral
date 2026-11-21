# O formato da cena.js · versão 2.0

A `cena.js` é JSON puro atribuído a `window.CENA` (sem funções: a mixagem lê o mesmo arquivo). Tudo em segundos, tirado do `voz/palavras.json` (`palavras.py` mostra).

```js
window.CENA = {
 "dur": 36.4,                                  // o fim da fala + ~0,8 s de fecho (o montar.py avisa)
 "abre": true, "fecha": true,                   // false nos capítulos do meio de um vídeo longo (sem escurecer na emenda)
 "lugares": { "paris": [2.35, 48.86, "Paris"] }, // longitude, latitude, o nome escrito no mapa (opcional 4º: {"dx", "dy", "tamanho"})
 "objetos": [ ... ],                           // um por destaque, NA ORDEM do tempo
 "tipos": { "titulo1": [[11.34, 12.00, "INTELIGÊNCIA"], [12.02, 12.66, "\nARTIFICIAL"]] },  // textos datilografados: [início, fim, texto]
 "escuro": [ { "de": 29.14, "desde": 26.6, "ate": 36.4 } ],   // opcional: a luz morre até "de" e volta em "ate"
 "luzes": [ { "objeto": "hinton", "t": 30.52 } ],             // opcional: uma luminária acende sobre o objeto
 "final": null,                                 // opcional: { "tipo": "cabeca", "t": 36.4, "centro": [-40, 46], "origem": "toronto", "pensamento": 44.34 }
 "rotas": [ { "de": "southampton", "para": "naufragio", "veiculo": "navio", "mar": "Oceano Atlântico" } ],  // opcional: a rota entre dois lugares sai sozinha; aqui só se quiser navio/avião na ponta ("veiculo": "navio" | "aviao") ou outro nome de mar ("mar": null tira). "rotas": false desliga
 "fio": true,                                   // fio vermelho entre as fotos de lugares diferentes
 "cta": { "texto": "Esse vídeo foi feito\n100% com IA.", "t0": 36.6, "passo": 0.034, "comenta": 37.9, "palavra": "DOC", "fim": 40.6 }  // só no 9:16
};
```

## Os objetos
Comum a todos: `id`, `tipo`, `lugar`, `t` (o instante em que encosta no mapa = a palavra que o chama). Opcionais: `dx`, `dy` (deslocamento em unidades do mapa: 100 = 1 grau de longitude), `giro`, `zoom` (multiplica o zoom da câmera nele), `ocupa` (fração da altura da tela, padrão 0,56 no 16:9), `entra: "desliza"` (sai de baixo do anterior), `fica: true` (continua apagado no mapa quando o próximo entra; o padrão é sair de vez, para nunca ficar atrás do destaque novo).
Sem `dx`, os objetos do mesmo lugar ficam lado a lado, da esquerda para a direita.

| tipo | campos | uso |
|---|---|---|
| `ano` | `texto` ("1826"), `tempos` (um por algarismo, nas palavras "mil", "oitocentos", "vinte", "seis"), `tamanho` (90), `dx`/`dy` | o ano escrito a tinta no mapa |
| `foto` | `img` (o nome do arquivo em `fotos/`, sem extensão), `tamanho` (72), `circulo` opcional `{x, y, r, achatado, t, zoom}` (x, y e r em fração da foto; `zoom` faz a câmera mergulhar no círculo) | cópia impressa em P&B |
| `folha` | `texto` (chave em `tipos`), `letra` (10,2) | papel datilografado |
| `doc` | `titulo` (chave em `tipos`), `assinaturas` (0 a 4) | documento com título datilografado e linhas cinzas |
| `recorte` | `jornal`, `manchete` [linhas], `frase` [linhas da matéria real], `circulo` `{linha, palavra, t}`, `manchete_apaga` (tempo), `carimbo` `{texto, t}` | recorte de jornal real (manchete e frase traduzidas, nunca inventadas) |
| `ficha` | `texto` (chave em `tipos`, a palavra riscada), `riscar` (tempo), `novo` (chave em `tipos`, em vermelho) | ficha com uma palavra trocada por outra |

Qualquer objeto aceita `carimbo: {texto, t}` (bate na palavra, com tranco de câmera).

## O que o motor faz sozinho
- A câmera chega a cada destaque ~0,3 s antes da palavra e assenta, com ele ocupando ~56% da altura (42% no 9:16) e no centro; na pausa, aproxima devagar no destaque, sem vaguear de lado; entre dois lugares longe, abre até caber os dois e a rota, segura um instante e mergulha no lugar novo. Tudo passa por uma suavização no tempo: nenhuma partida ou parada seca.
- Cada objeto cai no mapa (ou desliza) e encosta exatamente em `t`; quando o próximo entra, ele apaga (um destaque por vez).
- O nome de cada lugar é escrito a tinta no mapa, acima do primeiro objeto dele, com o ponto da cidade; perto do chão aparece uma grade fina de graus. Assim o quadro nunca fica só papel liso (`"rotulos": false` desliga).
- Na viagem entre dois lugares, uma rota tracejada a tinta avança junto com a câmera, com a ponta (ou o navio/avião) e o nome do mar no meio do quadro: a travessia nunca fica só papel. O mar sai sozinho do lugar mais perto da rota (Atlântico, Pacífico, Índico, Mediterrâneo, Caribe...). **Confira o fato:** o navio só vai na rota que ele fez de verdade (o Titanic nunca chegou a Nova York).
- Nenhum texto do mapa (nome de lugar, ano, nome do mar) corta na borda: perto dela, ele some suave.
- O fio vermelho é puxado entre fotos de lugares diferentes durante a viagem.
- Tremor de mão, desfoque de movimento nas viagens, névoa nos voos longos, luz de luminária com o resto no escuro.
