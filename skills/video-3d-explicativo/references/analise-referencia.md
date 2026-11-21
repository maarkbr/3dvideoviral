# Análise do Reel de referência (logo da Caixa), 10/11/2026

## O que ele faz, em ordem (quadros a cada 1,5 s)
1. **Cenário 3D de cartoon (low poly / voxel), câmera sempre em movimento.** Cada ideia é um "set": auditório com poltronas e mesa com maço de notas verdes (o custo); palco com cortina vermelha que abre e revela o logo num cavalete (a apresentação); fundo branco brilhante com as letras azuis em blocos e o X girando (o desenho); fundo marrom/laranja com cavalete e dezenas de cartõezinhos que voam e se arrumam em grade ("mais de 50 projetos"); caminhão e barco em voxel (o sistema); auditório de novo com "3,9 mil" e as poltronas ganhando adesivo azul e laranja (a troca nas agências).
2. **Elementos que se transformam:** o X se desmonta nas duas hastes e remonta; as letras "correndo" (inclinadas) ficam em pé; o X forma um telhado de casa; celular com dois retângulos azul e laranja (o app). Tudo é geometria simples (caixas, cilindros), sem textura realista.
3. **Camada de texto:** pílula escura no topo com o tempo e etiquetas em caixa amarela ou azul com o número da vez (R$ 3,5 MILHÕES, +DE 50, 3,9 MIL). Legenda na base em pílula escura, com a palavra falada em verde ou branco.
4. **Cor por capítulo:** preto (auditório), azul-royal, branco, marrom, preto. O fundo troca a cada ideia, o que reinicia a atenção.
5. **Ritmo:** uma troca de cena ou de câmera a cada 1,5 a 3 s; nada fica parado.

## Dá para reproduzir em código (sem IA de vídeo)?
**Sim, quase tudo.** É o território da skill `video-3d` (Three.js dentro do HyperFrames, low poly, câmera animada, etiquetas presas nos objetos, legenda de uma palavra).

| Efeito dele | Em código |
|---|---|
| Auditório com poltronas, mesa, notas | Three.js com InstancedMesh (fileiras de poltronas), caixas verdes empilhadas, luz suave |
| Cortina abrindo, cavalete com o logo | Dois planos vermelhos que deslizam (GSAP); cavalete com 3 caixas finas; logo como plano com forma desenhada em canvas ou SVG |
| X girando e se desmontando | Duas barras (BoxGeometry) azul e laranja cruzadas, rotação e "explosão" por GSAP |
| Letras em pé, mesma altura | Letras como blocos que crescem até a mesma altura |
| Cartõezinhos voando e entrando em grade | Muitas caixas finas animadas em lote até posições de grade |
| Caminhão, barco, prédio | Caixas e cilindros agrupados (voxel), 2 a 3 formas por objeto |
| Etiquetas e legenda | Já temos (kit do video-3d e do Bit) |
| Troca de cor de fundo por capítulo | Cor do cenário e da luz por GSAP em cada cena |

## O que precisaria da Higgsfield (até 30 créditos por peça)
- Nada é obrigatório. Só valeria para uma imagem realista de fachada ou do logo: uma peça (GPT Image, cerca de 2,75 créditos) usada como textura. Para o nosso ângulo, código basta.

## Por que parece mais elaborado que os nossos Bit
O Bit é 2D (janelas e personagem). Ele usa profundidade e câmera: o espectador "entra" em cada cena. Padrão para os próximos: gancho já com um objeto 3D grande (notas, X), câmera que se move em toda cena, fundo que muda de cor por ideia e uma animação-assinatura por vídeo (aqui, o X se desmontando).

## Fatos do Reel conferidos em 2 fontes (Agência Brasil, Itatiaia, Portal RBV, Letsmoney/Valor)
- Apresentada na segunda, 9/11/2026; slogan "Vem realizar"; X azul e laranja de 1997 redesenhado (novas proporções e profundidade); tipografia unicase (maiúsculas e minúsculas na mesma altura).
- Custo de R$ 3,5 milhões, de 2024 a 2026, segundo o Valor (Letsmoney e Portal RBV, que cita Valor/InfoMoney). O Portal RBV diz que o valor é só da criação da identidade.
- Troca começa em 11 agências e vai até 2030, aproveitando reformas (Agência Brasil, Itatiaia, RBV, Letsmoney).
- **Não confirmados em 2 fontes (ficam fora do texto):** Tátil Design, "mais de 50 projetos", 3.900 agências, 760 milhões (só 1 fonte, e é verba de marketing), 515 milhões do plano de saúde, "900 reais por agência".
