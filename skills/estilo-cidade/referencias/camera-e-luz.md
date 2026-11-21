# Câmera e luz

## Planos de câmera (`episodio.js` → `motor.definirPlanos([...])`)

Cada plano começa numa frase ou palavra da narração e anda devagar do ponto `de` até o ponto `para`, olhando de `olharDe` até `olharPara`:

```js
{ ini: aos(8, 5), fov: 40, sombra: 10, de: V(-10.3, 2.3, 5.4), para: V(-10.6, 2.25, 5.0), olharDe: V(-12.85, 2.05, 3.5), olharPara: V(-12.85, 2.05, 3.5) }
```

- `ini`: o segundo em que o plano começa. Use `aos(bloco)` ou `aos(bloco, palavra)`. O plano vai até o próximo.
- `fov`: a abertura vertical da lente. Como o vídeo é em pé, a abertura horizontal é bem menor: só uns 56% da vertical.
- `sombra`: o raio da área com sombra nítida. Aéreo 78; plano médio 14 a 24; close 8 a 12.
- `raios: true`: raios de sol (só em plano aéreo de dia).

### Distâncias que funcionaram (boneco de ~2,6 m)

| Plano | Distância até o rosto | Lente (fov) | Observação |
|---|---|---|---|
| Close (cabeça e ombros) | 3,0 a 3,5 m | 38 a 40 | menos de 2,5 m vira só um olho |
| Close dramático ("Fui eu") | ~2 m | 34 | só em momento-chave |
| De baixo para cima (susto, autoridade) | 3 a 4 m, câmera a 1,5 m de altura | 44 a 54 | cabe o braço para cima |
| Plano médio (corpo inteiro) | 5 a 6 m | 44 a 48 | |
| Dois personagens lado a lado (3 m entre eles) | ~8 m, câmera alta | 54 | |
| Por cima do ombro | atrás e 0,5 m acima do ombro, 1 m de lado | 36 a 38 | rente ao ombro, a cabeça tampa tudo |
| Insert (objeto, mão, número) | 1 a 2,5 m | 40 a 44 | |
| Placa de 3 m de largura | 7 m ou mais | 50 | |
| Placa de bronze (1,1 m) | ~3 m | 40 a 42 | |
| Aéreo da cidade com céu | ~85 m de distância, 28 a 35 m de altura | 50 | olhar para (0, 3, 0); mais alto que isso o céu some |
| Multidão vista de cima | câmera a 6 m ou mais de altura | 50 a 56 | passa por cima das cabeças |

- **Movimento:** aproximar devagar, de 0,3 a 1 m por plano. Pode deslizar de lado ou subir no aéreo final. Sem tremida.
- **Ritmo:** um plano novo a cada 1 a 1,5 s; frase longa vira 2 ou 3 planos (corte na palavra).
- **A imagem mostra a palavra:** "sino", corta para o sino; "1.460.000", corta para o número na mesa.

### Armadilhas de câmera

- **Alguém entre a câmera e o alvo** vira um borrão escuro na frente. Mude o boneco de lugar naquele período (é mais fácil que brigar com a câmera) ou suba a câmera.
- **A legenda ocupa ~59 a 65% da altura.** Se a cena tem texto (placa, giz, número), aponte a câmera um pouco mais para baixo, para o texto subir no quadro.
- **A abertura horizontal é estreita:** confira se dois personagens cabem.

## Luz (`motor.js` → `LUZES`, `episodio.js` → `periodo`)

Cada episódio diz quando é cada período:

```js
function periodo(t) {
  if (t < B(9).ini) return "dia";
  if (t < B(14).ini) return "noite";
  if (t < B(18).ini) return "entardecer";
  if (t < B(20).ini) return "sepia";       // lembrança do passado
  ...
}
const motor = criarMotor({ periodo, luzDoPeriodo: (p) => ..., filmeAntigo: (p) => p === "sepia" });
```

- **Os quatro períodos prontos:**
  - **dia:** fim de tarde dourado, céu azul com nuvens e lâmpadas fracas.
  - **noite:** azul escuro, estrelas, janelas e lâmpadas acesas, poças de luz dos postes.
  - **entardecer:** laranja e rosa, sol baixo, sombras longas, lâmpadas começando a acender.
  - **sepia:** dia claro; o motor põe por cima o filtro sépia, o granulado e a imagem tremendo de filme antigo.
- **Postes:** `motor.posteExtra(x, z, força, alcance)` põe um poste com luz de verdade, para iluminar uma cena noturna (como a mesa do dominó).
- **O que cada valor de `LUZES` faz:**
  - `hemi`: luz do céu; pouca luz dá mais contraste.
  - `sol`: cor, força e direção.
  - `lamp`: brilho das lâmpadas.
  - `janela`: janelas acesas.
  - `bloom`: brilho em volta das luzes.
  - `exp`: exposição.
  - `pontos`: postes extras.
  - `estrelas`.
- **Nunca deixe a noite clara:** noite boa é escura, com luz quente só onde tem poste.
