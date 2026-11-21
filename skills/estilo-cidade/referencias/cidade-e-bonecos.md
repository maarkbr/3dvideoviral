# A cidade e os bonecos

Unidade: 1 = 1 metro. O boneco tem ~2,6 m (cabeção incluso), a porta 3 m, o andar de uma casa 4,2 m.
O chão da praça e das calçadas fica a 0,15 m (`CHAO`). Tudo é sorteado com semente, então a cidade sai igual em todo render.

## A Vila do Sossego (318 habitantes)

| O quê | Onde (x, z) | Observação |
|---|---|---|
| Praça | de −21 a 21 | calçada de pedra portuguesa em ondas |
| Coreto | (0, 0) | lâmpadas na borda; a escada fica virada para +z (sul) |
| Ruas | entre 21 e 33 | paralelepípedo; calçadas de 29,6 a 33 |
| Fileiras de casas | fachadas em ±33 | casas coloniais coloridas; as esquinas ficam abertas |
| Igreja matriz | (2, −32,6), virada para o sul | torre à esquerda com sino e relógio parado às 5h15 em (−7,1; 14,55; −32,1) |
| Padaria Pão Quente | fachada em x = 33, virada para o oeste | vitrines, toldo listrado, letreiro, quadro-negro, mesinha |
| Canteiros | (±13,5; ±13,5) | ipê amarelo, ipê rosa e árvore verde |
| Bancos | raio 10,5 em volta do coreto | `bancos[0..3]` trazem x, z e a rotação (virados para o coreto) |
| Mesa de dominó | (−11,5; 3,5) | banquinhos em ±1,35 em x; tampo e chão cobertos de risquinhos |
| Placa da cidade | (16,2; 19,8) | "BEM-VINDO À VILA DO SOSSEGO · 318 HABITANTES" + plaquinha da regra |
| Placa de bronze da lei | (−2,7; 8,3) | ao lado da escada do coreto; tem espaço vazio embaixo |
| Rabisco de giz | muro da igreja, à direita da porta | "QUEM INVENTOU? = 1.000.000" (azul) |
| Pipoqueiro | (−4,6; 14,6) | carrinho com guarda-sol listrado |
| Fundo | raio 55 a 140 | casas simples, árvores, morros e nuvens; as diagonais ficam livres para a câmera aérea |

**Para outro episódio:**
- Coisas que só aquele episódio usa (placas, rabiscos, objetos da regra) entram em `cidade.js`.
- Peças novas entram em `predios.js`, seguindo o mesmo padrão: uma função que devolve um `THREE.Group` virado para +z.
- Ao trocar a regra, troque os textos das placas em `cena/placas.js` (o nome da vila, os habitantes, a plaquinha da regra, a placa de bronze da lei e o rabisco de giz): é o único arquivo dos letreiros.

## Peças prontas (`kit.js` e `predios.js`)

- **Básicas:**
  - `caixa(l, a, p, material, metros)`: caixa com a textura em metros (não estica).
  - `bloco`, `cilindro`, `bola`, `piso`.
  - `em(objeto, x, y, z, giro)`: posiciona.
- **Materiais:** `cor(hex)` e `MT.reboco(cor)`, `MT.tijolo()`, `MT.madeira(cor)`, `MT.pedra()`, `MT.rua()`, `MT.calcada()`, `MT.grama()`, `MT.telha()`, `MT.vidro()`, `MT.branco()`, `MT.ferro()`.
- **Para luz própria:** `luz(cor, força)` faz o objeto brilhar, e o brilho acompanha a noite.
- **Construções:**
  - `casa({ w, andares, corParede, corDet, sacada, vasos })`, `casaFundo`, `janela`, `porta`, `telhado`;
  - `padaria()`, `coreto()`, `igreja()`, `placaCidade()`, `placaLei()`.
- **Praça e rua:**
  - `arvore({ tipo: "verde" | "ipe" | "rosa" })`, `poste()`, `banco()`, `canteiro()`, `bandeirinhas(a, b)`;
  - `carrinhoPipoca()`, `rabiscoGiz()`, `texRisquinhos()`.
- **Placa com texto:** `placaPlana(largura, altura, pixelsPorMetro, desenhar)`. A placa é redesenhada quando as fontes chegam.
  - Dentro de `predios.js`, `escrever(ctx, texto, x, y)` diminui a letra se o texto não couber.
  - Fontes livres: **Fredoka** (letreiros), **Pacifico** (cursiva) e **Inter 800** (legenda).

## Os nossos bonecos ("cabeçudos")

Cabeça grande e quadradinha com cantos arredondados, rosto desenhado na frente (olho grande com brilho, bochecha rosada), corpo curto de blocos, joelho e mão para segurar coisas. **Nada copiado de jogo nenhum.**

```js
const b = criarBoneco({
  pele, camisa, calca, canela, sapato, manga, mangaCurta, saia,   // cores (#hex)
  roupa: { listras, gola, avental, botoes, estampa, bolso },      // desenho na frente da camisa
  acessorio: "gorro" | "chef" | "coque" | "cachos" | "bone" | "palha" | "curto" | "rabo" | "careca",
  cabelo, corAcessorio,
  estilo: { bigode, barba, oculos, sardas, sobrancelhaGrossa, corSobrancelha, bochecha },
  expressao: "feliz", fase: 3,                                    // fase desencontra a respiração entre bonecos
});
// devolve: grupo, corpo, cabeca, bracos, pernas, maos[0|1] (para pendurar prego, pedrinha, sacola), mudarRosto(expr), pose(tipo, t)
```

- **Expressões (`rostos.js`):** neutro, feliz, riso, surpreso, espanto, medo, triste, bravo, raiva, determinado, curioso, dormindo, bocejo, mudo (X de esparadrapo), fala, falaBrava.
  - Para a boca mexer enquanto alguém fala: `falando(t, "fala", "neutro")`.
- **Poses (`bonecos.js`):** parado, andar, correr, acenar, apontar, bandeja, segurar, maosNaCintura, maosNaBoca, susto, conversar, sentado, sentadoJogando, jogarMilho, riscar, riscarParado, riscarSentado.
- **Bichos:** `criarCachorro()` (o Caramelo) e `criarPombo()`.

### Elenco fixo

- **Juca:** o protagonista de todo episódio. Gorro **turquesa** com pompom (a única coisa turquesa da cidade, por isso salta na tela), moletom azul-marinho com estrela amarela e tênis vermelhos.
- **Bia:** a amiga, de cabelo cacheado e vestido amarelo.
- **Seu Ademar:** o padeiro, com chapéu de chef, bigode e a bandeja de pães.
- **Dona Cida:** a avó de óculos e coque, que joga milho para os pombos.
- **Seu Zeca:** chapéu de palha e bigode branco, no dominó.
- **Seu Tonico:** o careca de barba, sempre bravo no dominó.
- **Lena:** de rabo de cavalo e sacola.
- **Caramelo:** o vira-lata.
- **Moradores:** sorteados com `morador()`, para encher a praça.

## Como um boneco "atua" (`episodio.js`)

Cada boneco recebe uma **regra**: uma função do tempo `t` e do período `per`. Ela diz onde ele está e o que faz:

```js
ator(juca, (t, per) => {
  if (per === "dia") return { x: 2.5, z: 10.1, ry: 0.25, pose: "parado", expr: "feliz" };
  if (per === "noite") return { x: -19, z: 0, ry: 1.08, pose: "parado", expr: t < aos(11, 3) ? "curioso" : "surpreso" };
  return { vis: false };                     // some nesse período
});
```

- **Campos:**
  - `x, y, z, ry`: lugar e giro;
  - `pose` e `tPose` (para congelar, passe um tempo fixo);
  - `expr`;
  - `cab: { x, y }`: inclinar ou virar a cabeça;
  - `vis: false`: esconder.
- **Atalhos de tempo:**
  - `aos(n)`: começo do bloco n;
  - `aos(n, w)`: começo da palavra w (contando de 0) do bloco n;
  - `B(n).ini` e `B(n).fim`;
  - `dentro(t, a, b)`.
- **Virar para alguém:** `ry: virarPara(x, z, alvo)`.
- **Coisas que não são boneco** (bicho, objeto que aparece, risco que surge): `motor.aCadaQuadro((t, per) => { ... })`.
