# O formato da cena (`cena.js`) · Estilo Colagem 1.0

A tela é 1080 x 1920. `x` e `y` são o **centro** da peça em pixels; `w` é a largura. Área segura do Reels: `y` entre 330 e 1640 (a legenda mora no topo, de 170 a 300; embaixo ficam os botões do app). Todo tempo é em segundos, tirado do `palavras.py` (a peça entra **na palavra** que a chama).

```js
window.CENA = {
 "dur": 14.7,                 // fim da fala + ~0,6 s (sem o CTA)
 "fundo": "cinza",            // cinza (padrão das referências) | escuro | papel | creme | amarelo | laranja | azul | vermelho
 "marca": {"arroba": "@canal", "nome": "Nome", "bio": "uma linha", "foto": "perfil.jpg"},   // @ embaixo das fotos e no celular do CTA
 "enfase": ["palavra", ...],  // frase da legenda com uma destas palavras fica em itálico (a palavra-chave)
 "palavras_por_frase": 3,     // legenda: até 3 palavras principais por frase (as ligações "de", "no", "o" ficam pequenas)
 "legenda": "topo",           // ou "etiqueta" (texto branco em etiqueta preta). Cena com mapa usa etiqueta sozinha.
 "barra": true,               // a barrinha de progresso embaixo (as referências têm)
 "cenas": [ {"t": 0, "fundo": "amarelo", "empurra": 0.055, "objetos": [ ... ]} ],
 "cta": {"t": 15.0, "fim": 17.4, "tipo": "seguir", "fundo": "laranja", "clique": 16.0}
        // ou {"tipo": "comenta", "palavra": "CAFE", "texto1": "Comenta", "texto2": "que eu te mando no direct"}
};
```

**Cena** = um fundo e as peças até a próxima cena (corte seco, como nas referências: troque a cada ~3 s). A câmera empurra a cena inteira devagar o tempo todo (`empurra`, padrão 5,5%; `0` desliga; `deriva: [dx, dy]` muda a direção).

## As peças (todas aceitam `t`, `x`, `y`, `w`, `rot`, `z`, `entra`, `de`, `sai`, `foco`)
`entra`: `corte` (aparece seca), `lado` (desliza 90 px com desfoque, 7 quadros; `de`: direita, esquerda, baixo, cima), `sobe` (sobe 54 px com desfoque, 6 quadros), `cai` (encolhe de 116% como papel caindo), `bate` (de 210% para 100% em 4 quadros, com tremida: selo e carimbo). Sem `entra`, cada tipo usa o seu (o 1º papel/foto da cena entra no corte). `sai`: tempo em que some. `foco: true` (ou 1.4): a câmera chega perto da peça.

| tipo | campos | o que é |
|---|---|---|
| `foto` | `img` (nome em assets/fotos, sem .jpg), `prop` (altura/largura, 0.72), `papel` (cor do papel atrás ou `false`), `papel_dx/dy/rot`, `fitas` (0 a 4), `pb` (preto e branco), `pos` (enquadramento, ex. "50% 30%"), `assinatura: false`, `fonte` (texto pequeno embaixo) | foto com borda branca, fita lilás nos cantos, papel colorido atrás e o @ embaixo |
| `tv` | `imgs: [{img, t}]` | TV antiga com a foto na tela; troca a foto no tempo |
| `cartao` | `rot_txt` (rótulo em caixa alta), `titulo`, `numero` (digitado letra a letra em vermelho), `tnum`, `passo`, `texto` (máquina de escrever), `linha` | ficha de papel (patrimônio, ranking, salário) |
| `etiqueta` | `texto`, `estilo`: branca (sans grosso, logo de marca) / serifa / preta | etiqueta que entra de lado |
| `folha` | `cor`, `w`, `h` | folha colorida grande atrás das peças |
| `selo` | `texto` (grande), `sub`, `cor` | selo redondo amarelo ("3º", "1 em 3") |
| `carimbo` | `texto`, `tam` | carimbo vermelho batendo na palavra falada |
| `lista` | `titulo`, `itens: [{texto, t}]` | lista; cada item com `t` ganha o ✓ vermelho desenhado na hora |
| `pilha` | `itens: [{texto, t, dx, dy}]` | papeizinhos caindo um sobre o outro (impostos, taxas) |
| `ano` | `texto` ou `de`/`ate` (conta), `prefixo`, `sufixo`, `dconta`, `sub`, `marcas` | número grande com régua |
| `nota` | `texto` | bilhete de máquina de escrever |
| `seta` | `de_xy`, `para_xy`, `curva`, `nota`, `nota_xy`, `cor`, `dt` | seta vermelha desenhada à mão + bilhete |
| `circulo` | `x`, `y`, `w`, `h`, `dt` | círculo de caneta em volta de algo |
| `fio` | `de_xy`, `para_xy` | dois pinos vermelhos e o fio entre eles (quadro de investigação) |
| `mapa` | `mapa` (nome do `mapa.py`), `regiao` (UFs claras), `cor_regiao`, `base`, `fora` (cor dos outros países), `desenha: false`, `destaques: [{uf: [...], t, cor}]`, `pinos: [{lon, lat, texto, t, lado}]`, `rotas: [{de: [lon,lat], para, t, dur, curva}]`, `zoom: [{t, centro: [lon,lat], escala, dur}]` | o contorno se desenha em vermelho e enche; estados acendem; pino com etiqueta preta; rota; zoom |

## Mapa
`PY scripts/mapa.py <pasta> --nome sudeste --pais BRA --caixa=-53.4,-26.2,-40.2,-18.6` (lon e lat mínimos e máximos; use `=` porque começa com menos). Mostra as UFs que ficaram no recorte. Para outro país, `--pais` com o código de 3 letras (ARG, USA, PRT...). Para mostrar a mesma região com zoom na cena seguinte, repita o mapa com `"entra": "corte", "desenha": false` e um `zoom`. Use `w` maior que 1080 para o mapa sangrar pelas bordas, como nas referências.

## Densidade (o que as referências fazem, medido quadro a quadro)
- Corte de cena a cada ~3 s; dentro da cena, algo novo entra a cada ~1 s (etiqueta, seta, número, segunda foto, pino).
- Cada entrada dura 4 a 7 quadros e freia no fim; a legenda troca a cada ~0,5 s, palavra por palavra.
- Uma ideia por vez: no máximo 3 peças na tela, a mais nova é a que a voz está dizendo.
