# Personagens e poses

Arquivo: `biblioteca/personagem.js`. Os dois personagens usam o mesmo esqueleto, então toda pose funciona nos dois.

## O estilo (vale para tudo que for desenhado)
- Desenho animado 2D, cabeça grande e redonda, olhos grandes com sobrancelha.
- **Contorno preto grosso**: espessura 10 (constante `T`).
- **Sombra só de um lado** (o direito da tela), num tom mais escuro da mesma cor.
- Escala: **586 unidades = 1 metro**. O menino tem uns 850 de altura (1,45 m).

## Os personagens (visuais)
| visual | como é |
|---|---|
| `menino` | cabelo castanho espetado, moletom laranja com raio amarelo, calça azul, tênis branco |
| `seguranca` | boné azul-marinho escrito SEGURANÇA, bigode, uniforme azul-marinho com distintivo dourado, sapato preto, lanterna na mão direita da tela |

Detalhes do segurança: a mão da lanterna fica sempre fechada; a lanterna acende sozinha nas poses parado, apontando e assustado; no susto o boné pula e aparece a careca.

## As 7 poses
| pose | o que faz |
|---|---|
| `parado` | respira, mexe a cabeça, pisca |
| `acenando` | acena com a mão direita da tela, boca aberta sorrindo |
| `apontando` | aponta **para a direita da tela**, mão esquerda na cintura |
| `pensando` | mão no queixo, olha para cima |
| `assustado` | mãos para cima, olhos arregalados, treme, cabelo (ou boné) sobe |
| `comemorando` | pula com os braços para cima, olhos fechados de felicidade |
| `correndo` | corre no lugar virado para a direita da tela |

Na montagem: `M.pose(personagem, 'nome', inicio, fim)`. Use os tempos das palavras: `M.pose(menino, 'assustado', t('trancado'), B(2))`.

**Atenção:** quem aponta só aponta para a direita da tela. Se um personagem precisa apontar para o outro, coloque quem aponta à esquerda. Não espelhe o personagem: o texto do boné fica de trás para frente.

## Ajustes finos sem criar pose
Cada parte do corpo é uma variável. Dá para animar direto na linha do tempo:
```js
tl.to(menino.el, { '--lid': 26, duration: 0.25 }, 0.32);     // pálpebra caída (cochilando)
tl.to(menino.el, { '--lid': -64, duration: 0.18 }, t('acordou')); // abre os olhos
```
Variáveis mais úteis:
- `--lid` pálpebra (-64 aberta, 64 fechada) · `--happy` olhos felizes (0 ou 1) · `--px`, `--py` para onde olha
- `--bEy`, `--bDy` altura das sobrancelhas · `--bEa`, `--bDa` inclinação
- `--armE`, `--elbowE`, `--handE` braço da esquerda da tela (graus) · `--armD`, `--elbowD`, `--handD` da direita
- `--legE`, `--kneeE`, `--legD`, `--kneeD` pernas · `--lean` inclina o corpo · `--by` pulo (negativo sobe)
- `--hair` cabelo/boné subindo · `--feixe` luz da lanterna (0 a 1) · `--lanA` ângulo da lanterna
- Mãos: `--hEo/f/p/r`, `--hDo/f/p/r` (aberta, punho, apontando, relaxada; uma delas em 1)

## Criar uma pose nova
Em `POSES` (personagem.js), copie uma pose parecida e mude:
- `boca`: sorriso, risada, grito, hum, determinado ou confiante
- `base`: os valores das variáveis na pose
- `loop(q)`: o movimento que se repete. Ferramentas: `q.osc` (vai e volta), `q.ciclo` (quadros-chave repetidos), `q.em` (um movimento num tempo), `q.piscar`

## Criar um personagem novo
Em `personagem.js`, copie o bloco `SEGURANCA` e mude:
- `C`: as cores (pele, roupa, calça, sapato...)
- `tronco`: a roupa (desenho em SVG)
- `antesRosto` / `depoisRosto`: cabelo, chapéu, boné
- `depoisBoca`: bigode, barba
- `calcado`: o sapato
- `neutro` e `ajustes`: jeito de cada pose (ex.: pálpebra mais baixa)
Depois registre em `VISUAIS` e use `M.ator('id', 'nome-do-visual', escala, ...)`.
Antes de mostrar, faça uma prévia com ele em todas as poses (como `personagem/` e `dupla/`).

## Prévias já prontas
- `personagem/`: o menino nas 7 poses.
- `dupla/`: menino e segurança lado a lado nas 7 poses.
