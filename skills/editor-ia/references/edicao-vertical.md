# Edição vertical: o plano.json (Fases 5 e 6)

Você escreve **um arquivo** — `cortes/<corte>/plano.json` — e o `montar_vertical.py` gera o projeto HyperFrames inteiro: câmera, cenas, legendas, sons, trilha, documentos, e roda lint + check.

## Antes do plano (preparação)

1. **Transcrição do corte final** (tempos do corte, não do podcast): `transcrever.py cortes/01-x/corte_bruto.mp4 cortes/01-x/work/transcricao_corte.json --modelo small --prompt "<mesmo prompt>"`.
2. **Enquadramento do rosto**: `enquadramento.py cortes/01-x/corte_bruto.mp4 cortes/01-x/work/enquadramento.json --segments cortes/01-x/corte_bruto.mp4.segments.json --folha cortes/01-x/work/enquadramento.jpg`. Olhe a folha: caixa verde = rosto achado, linhas amarelas = janela 9:16 sugerida. Trechos `aberto: true` (plano aberto, rosto pequeno) pedem uma cena de tela cheia por cima. Se o rosto escolhido estiver errado (duas pessoas no quadro), corrija com `camera.trechos`.
3. **Leia a transcrição do corte com os índices** e anote: palavras que o Whisper errou (viram `legenda.corrigir`), palavrões (censura automática), e os momentos ilustráveis (substantivos concretos, números, comparações, perguntas, viradas).

## Roteiro de cenas (pense assim)

- Abertura: `gancho` (0–3 s) ou `faixa` por cima do falante.
- Depois, **uma cena a cada 3–6 s**, sempre amarrada a uma fala. Alterne layouts para o vídeo respirar: card **dividido** (metade de cima, falante embaixo) na maior parte, **tela cheia** nos momentos de virada, **adesivos/palavra** por cima do rosto nas falas curtas e engraçadas.
- **Glitch** (0,8–1,2 s) só nas 1–2 frases mais fortes ("vocês são malucos").
- Fecho: um último elemento na frase final (`adesivos`, `palavra`) e o `camera.final` (push lento).
- Escolha o tipo pelo conteúdo — o catálogo (`catalogo-de-cenas.md`) diz quando usar cada um.

## Formato do plano

```json
{
  "titulo": "Papo de bêbado na China",
  "mensagem": "uma frase com a ideia do corte",
  "corte": "corte_bruto.mp4",
  "transcricao": "work/transcricao_corte.json",
  "enquadramento": "work/enquadramento.json",
  "saida": "vertical",
  "canal": {"handle": "@seucanal", "acento": "#RRGGBB"},   # opcional: sem isto, vale o marca.json do projeto
  "camera": {"punch": 1.10, "push": 1.17, "auto_punch": true, "intervalo_min": 1.5,
             "tomadas": [["~frase de ênfase", "punch"]], "final": "~última frase", "pb": [["~início do flashback", "~fim>"]]},
  "legenda": {"estilo": "anton", "y": 1360, "palavras_chave": ["CHINA", "500"],
              "corrigir": [{"i": 121, "j": 122, "texto": "tapioca"}], "substituir": {"Tiririca,": "Tiririca"},
              "censura": {"porra": "p*rra"}, "esconder": [["@40.0", "@41.2"]]},
  "cenas": [
    {"id": "b01-gancho", "tipo": "gancho", "inicio": 0, "dur": 3.0, "params": {"linhas": [{"texto": "O chinês"}, {"texto": "não acreditou"}]}},
    {"id": "b02-china", "tipo": "card-icone", "inicio": "~sem democracia-0.2", "fim": "~atraso+0.8", "params": {"icone": "bandeira-china"}}
  ],
  "som": {"clima": "curioso", "bpm": 92, "musica": null, "musica_lufs": -30, "extra": [{"t": "~voto", "s": "ping", "db": -16}], "sem_auto": []},
  "render": {"fps": 30, "crf": 14}
}
```

Todos os caminhos são relativos à pasta do plano. Só `cenas` é obrigatório; o resto tem padrão.

## Tempos: amarre na fala, não no número

| forma | significa |
|---|---|
| `"~sem democracia"` | início da 1ª vez que essa frase é dita (procura a partir do início da cena; para `inicio`, a partir da cena anterior) |
| `"~atraso>"` | o fim da frase |
| `"~pode#2"` | a 2ª ocorrência |
| `"~eu voto-0.22"` | com deslocamento (s) |
| `"@58.34"` | tempo do corte em segundos |
| `1.6` (número) | em `inicio`/`fim`: segundos do corte. **Dentro de `params`: segundos desde o começo da cena** |

- A busca ignora acento, maiúscula e pontuação, e aceita prefixo ("dinheiro" acha "dinheiros"). As correções de `legenda.corrigir`/`substituir` valem para a busca também (se o Whisper ouviu "hipi -oca", corrija para "tapioca" e use `"~tapioca"`).
- Chaves de tempo em `params`: `em`, `t`, `ate`, `saida`, `batidas` e qualquer `*_em`. Um tempo fora da cena vira aviso.
- Cena: `inicio` + `dur` (s) **ou** `inicio` + `fim` (uma frase em `fim` = quando ela termina).
- `"legenda": false` numa cena esconde a legenda enquanto ela está na tela (padrão para `gancho`, `glitch` e `palavra`). `"sfx": false` desliga os efeitos automáticos dela.

## O que o montador decide sozinho

- **Corridas de cards**: cards divididos que se encostam (≤ 0,15 s) formam uma corrida. A câmera vai para o modo dividido no início (0,36 s, junto com o card descendo) e volta no fim (0,3 s, junto com o card subindo). Dentro da corrida, cada card novo entra com wipe (esquerda/direita alternando) e o de baixo fica até o wipe terminar. Se a corrida começa/termina embaixo de uma cena de tela cheia, a troca acontece escondida e o card entra "no corte".
- **Câmera**: rosto por trecho (do `enquadramento.json`), zoom alternado 1.0 ↔ `punch` a cada emenda/troca de câmera (no mínimo `intervalo_min` s entre trocas), também no modo dividido (1.08). `tomadas` força um zoom num momento; `final` faz o push lento até o fim; `pb` deixa trechos em preto e branco.
- **Legenda**: grupos de 1–3 palavras (`max_palavras`, `max_letras`), uma palavra-chave por grupo, faixa em `y` (1360) no modo cheio e na costura (960) no dividido, escondida nas cenas sem legenda. Sem `palavras_chave`, o montador usa as palavras com `*ênfase*` das cenas, os números e as palavras longas.
- **Som**: efeitos por tipo de cena (veja `som.md`), drops da trilha nos glitches, carve da trilha sob a voz.
- **Saída**: `vertical/index.html`, `compositions/<id>.html`, `compositions/legendas.html`, `assets/` (aroll, sfx.wav, music.wav), `BRIEF.md`, `STORYBOARD.md`, `frame.md`, `work/plano_resolvido.json` (todos os tempos resolvidos, a câmera e os avisos).

## Layout seguro (1080x1920)

- **Modo cheio**: rosto ~y 600–900; legenda em y 1360 (peito). Adesivos nos cantos de cima (y < 450) ou nas laterais; nunca sobre a boca.
- **Modo dividido**: card em 0–960 (borda de baixo na cor do canal), falante em 960–1920, legenda na costura (y 960).
- **Tela cheia**: deixe a faixa 1290–1470 livre quando a legenda continua por cima (os modelos já respeitam).
- Interface do Reels/TikTok cobre a faixa de baixo (y > 1620) e a lateral direita (x > 960): nada importante ali.

## Rodar, olhar, ajustar

```
python <skill>/scripts/montar_vertical.py cortes/01-x/plano.json --fotos auto
```

- Leia os avisos (`!`) e o resultado do `hyperframes check` (tem que dar 0 erros; avisos de contraste/sobreposição: ajuste posição ou cor).
- `--fotos auto` tira uma foto no meio de cada cena (`vertical/snapshots/contact-sheet-*.jpg`). **Olhe as folhas**: texto cortado, ícone em cima do rosto, legenda tampando algo, card vazio. Ajuste o plano e rode de novo (leva 1–4 min; `--sem-som` pula o áudio, `--sem-check` pula a verificação para iterar mais rápido).
- Nunca edite `vertical/` à mão para mudanças de conteúdo: o próximo `montar` sobrescreve. Mude o `plano.json`. Ajustes finos feitos pelo usuário no Studio valem até a próxima montagem — avise isso.
