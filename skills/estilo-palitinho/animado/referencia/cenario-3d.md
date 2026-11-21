# Cenário 3D e câmera

Arquivos: `biblioteca/shopping3d.js` (o cenário) e `biblioteca/montagem.js` (junta tudo). Three.js versão 0.147 (scripts clássicos, carregados no `<head>` do modelo).

## O corredor
- Shopping à noite. Medidas em metros. O chão é `y = 0`. O corredor vai de `x = -3,3` a `x = 3,3` e segue para o fundo no **z negativo**.
- **Lojas acesas:** café (esquerda, z ≈ -9,5), loja de móveis (esquerda, z ≈ -16,5), lanchonete (direita, z ≈ -10,5). As outras estão fechadas, de porta de enrolar baixada, com o nome apagado.
- Piso de azulejo com reflexo, vasos de planta nas laterais, bancos, teto com claraboia e uma vidraça no fundo com lua e cidade.
- **Luz:** azulada no geral (sombra azulada), quente saindo das vitrines e escorrendo no chão, uma luz de palco fraca onde os personagens ficam, brilho (bloom), vinheta.

## Personagens e objetos 2D dentro do 3D
Eles não são 3D: são desenhos por cima, colados num ponto do mundo. A cada quadro a montagem calcula onde aquele ponto aparece na tela e o tamanho certo. Por isso:
- eles andam junto com a câmera e ficam do tamanho certo pela distância;
- têm sombra de verdade no piso 3D;
- quem está mais perto fica na frente;
- levam um filtro noturno e um brilho quente na borda esquerda.

## Câmera
`M.camera([[tempo, [x, y, z] da câmera, [x, y, z] para onde olha], ...])`. Entre uma chave e outra o movimento é suave. Duas chaves iguais seguidas = câmera parada.

O que funcionou no vídeo do shopping:
| plano | câmera | olha para |
|---|---|---|
| personagem sozinho, grande | 3,8 a 4,4 m na frente dele, altura 1,6 | uns 4 m atrás dele, y ≈ -0,25 |
| dois personagens | 4,6 m na frente, altura 1,7 | y ≈ 0,17 |
| olhar o fundo do corredor | altura 1,55 | z ≈ -12, y ≈ 0,27 |
| virar para uma loja | mesma posição | x da loja, z ≈ -9 |

- Mire para baixo o bastante para os pés ficarem lá pelo y 1500 da tela: abaixo disso fica a legenda e, mais abaixo, os botões do TikTok e do Reels.
- Movimentos lentos. Viradas rápidas só presas a uma palavra (ex.: vira para o café na palavra "café").

## Efeito 3D próprio de uma história
Use `M.aCadaQuadro((tempo) => { ... })` para mexer em algo 3D a cada quadro. Exemplo no vídeo do shopping: a lanterna que vem pelo corredor (cone de luz, lente e foco de luz no chão, andando do fundo até perto, entre as palavras "lanterna" e "segurança"). Tudo tem que ser calculado só a partir do tempo (mesmo tempo, mesma imagem).

## Cuidados (já deram problema)
- **Só materiais Lambert ou Phong.** O painel de prévia do app tem um WebGL mais simples: `MeshStandardMaterial` e `flatShading` dão erro de shader e o 3D some. Para planta com cara de facetada, use a função `facetado(geometria)`.
- **Nunca `requestAnimationFrame`.** O desenho é feito no aviso `hf-seek` do HyperFrames e no `onUpdate` da linha do tempo (a montagem já faz isso).
- Nada de `Math.random()`: use o gerador fixo (`rnd`) para dar sempre o mesmo resultado.
- O letreiro das lojas usa a fonte Baloo 2: a montagem espera a fonte carregar antes de desenhar.

## Fazer outro lugar
Copie `shopping3d.js` com outro nome (ex.: `elevador3d.js`), troque as peças (`loja`, `vaso`, `banco`, paredes, luzes) e mantenha as funções `desenhar`, `projetar`, `sombra` e `cam`. Antes de usar num vídeo, faça uma prévia só do lugar com os dois personagens parados e mostre.
