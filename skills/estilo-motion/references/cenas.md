# As cenas do kit Motion

Cada bloco do `roteiro.json` tem uma `fala` (a narração) e uma `cena`. A cena entra quando a fala começa e sai quando a próxima começa.

**Campos que valem para toda cena:**
- `transicao: "circulo"`: um círculo na cor da marca cresce antes dela. Use 1 ou 2 vezes no vídeo, de preferência na entrada da marca.
- `entrada`: `sobe`, `escala`, `lado` ou `desce`. Se não escolher, o kit varia sozinho e nunca repete a mesma em seguida.
- `em`: em listas, balões, recursos e no `cta`, é a palavra da fala em que aquele item aparece. Sem `em`, os itens entram espaçados.
- **Palavra-chave:** em qualquer texto, `*palavra*` ganha a caixa na cor da marca quando a narração disser essa palavra.

| Cena | Para quê | Campos |
|---|---|---|
| `frase` | Gancho, dor, virada. Uma frase forte, centralizada | `texto` (com `*chave*`), `antes` (linha menor acima, opcional), `tamanho`: `media` para frases longas, `ilustra` (opcional: imagem em `assets/`, como o desenho recortado de um quadro do storyboard, que entra com a palavra-chave e flutua) |
| `logo` | A marca entra | `nome`, `sub` (slogan). O logo vem do `marca.json`; sem logo, aparece a inicial |
| `celular` | Mostrar o app ou o atendimento | `titulo`, e **um** dos dois: `imagem` (print da tela do cliente em `assets/`, em pé) ou `baloes` (`[{de: "eu"\|"ele", txt, em}]`) com `contato` |
| `painel` | Resultado com número (faturamento, agendamentos, alunos) | `titulo`, `rotulo`, `valor` (texto, ex.: `"12.223"`), `prefixo` (ex.: `"R$"`), `sufixo`, `barras` (6 alturas de 0 a 100) |
| `lista` | Benefícios ou passos com check | `titulo`, `itens` (`["texto"]` ou `[{txt, em}]`), de 3 a 5 itens curtos |
| `recursos` | O que o produto faz, em volta do nome | `centro`, `itens` (até 4: `{txt, icone, em}`) |
| `numero` | Um número que importa (dias grátis, preço, anos) | `titulo`, `valor`, `sub`, `progresso` (de 0 a 1, o quanto do anel enche) |
| `foto` | Vitrine com o material do cliente | `imagem` (em `assets/`), `texto` (faixa na cor da marca) |
| `quadro` | O quadro do storyboard da pessoa, inteiro, animado (modo "imagem") | `imagem` (o quadro em `assets/`, saído do `recortar_storyboard.py`), `texto` (faixa opcional; não repita o que já está escrito no quadro) |
| `cta` | Chamada final com botão e cursor | `titulo`, `botao`, `sub`, `em` (a palavra em que o cursor clica) |

**Ícones** (em `recursos`): `check`, `calendario`, `mensagem`, `grafico`, `dinheiro`, `raio`, `estrela`, `usuario`, `sino`, `cadeado`, `relogio`, `foguete`, `carrinho`.

**Tema:** `"tema": "escuro"` (padrão) ou `"claro"`, no `roteiro.json` ou no `marca.json`. O texto em cima da cor da marca fica preto ou branco sozinho, pelo contraste.

**Storyboard da pessoa:** quando ela manda o storyboard pronto (veja `processo-no-painel.md`), recorte os quadros e faça um bloco por quadro, na ordem. No modo **recriar** (padrão), cada quadro vira a cena do kit que tem o mesmo papel (frase com a mesma palavra em `*destaque*` e o desenho do quadro em `ilustra`; preço ou quantidade em `numero`; o último quadro em `cta`). Para tirar o desenho de um quadro, recorte com o ffmpeg (`crop=`) só a área dele e salve em `assets/`. No modo **imagem**, use a cena `quadro` em todos.
