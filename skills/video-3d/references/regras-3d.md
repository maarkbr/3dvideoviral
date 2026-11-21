# Regras do vídeo 3D em código

Tiradas dos perfis que viralizam com 3D sem rosto e do teste do bunker (aprovado pelo Lucas em 05/11/2026).

## Visual
- **Low poly de verdade:** `flatShading: true`, sem textura, cores chapadas e alegres (grama #6DBE45, terra #9B6A3C, concreto #B9BDC2, céu #8FD0F5). Sombras suaves de um sol só.
- **Um mundo só:** o mesmo cenário do começo ao fim (casa, árvores, cerca, rua). Quem assiste precisa reconhecer o lugar a cada corte.
- **A obra avança:** cada fala é uma etapa visível (cavar, armar, concretar, cobrir…). As coisas crescem do chão (`pilar` com `scale.y`), caem no lugar, saltam (`pop`). Nada surge do nada sem animação.
- **Vista em corte:** para mostrar o que está embaixo da terra ou dentro de algo, esconda o bloco de terreno da frente e baixe a parede da frente para uma mureta (`scale.y ≈ .3`). Isso mostra o material sem tampar.
- **Detalhe que vende:** uma escavadeira, um caminhão, um personagem simples, partículas (água, poeira, radiação). Um elemento vivo por tomada.

## Peças prontas (biblioteca Kenney)
- 741 peças low poly CC0 (uso comercial, sem crédito): carros, caminhões, navios, barcos, casas, prédios, indústria, estradas, natureza e trens. Mesmo estilo chapado da cena.
- Use peça pronta para tudo o que é "objeto do mundo" (veículo, casa, árvore). A obra que muda por etapa continua em código.
- Escala: carro com ~1,2–1,4 m de comprimento quando a pista tem 4,4 m, navio grande com 12–15 m. Confira no snapshot.
- O Kenney tem modelos de nome enganoso (o `ship-large` é um galeão com velas): olhe o snapshot antes de aprovar.

## Câmera e ritmo
- Troca de câmera a cada **3–4 s** (umas 14 tomadas em 40 s; umas 22 no vídeo longo de ~75 s), alternando: aérea, lateral baixa, em corte, de cima (planta), close num detalhe e, no fim, a câmera se afastando pra mostrar tudo.
- Dentro de cada tomada, a câmera anda devagar (`io` entre a posição inicial e a final). Nunca fica parada.
- A voz manda: cada etapa acontece enquanto a fala dela toca. Com `bt(bloco, s)`, a escala 0–10 se ajusta à duração real da fala.
- Voz 15% mais rápida, pausas de no máximo ~0,12 s, respiro de 0,2 s entre falas. Sem silêncio.

## Texto na tela
- **Legenda:** uma palavra por vez, branca com contorno preto grosso, no meio da tela (y ≈ 1260), com o texto do roteiro.
- **Etiquetas:** caixa alta, amarelas (#FFD21F) com contorno preto, presas no objeto (posição 3D projetada) e entrando com um pulinho quando a fala cita a coisa. Use número real só se ele estiver nas fontes.

## Antes de entregar, olhe os snapshots e confira
1. Algum quadro com céu aparecendo onde deveria ter chão?
2. Alguma parede, objeto ou vergalhão tampando o que a fala está explicando?
3. Alguma etiqueta saindo da tela, em cima da legenda ou flutuando no ar? A etiqueta não some atrás do terreno: se a tomada
   seguinte esconde o objeto (a frente do terreno volta, a câmera se afasta), termine a etiqueta antes (`ate`).
4. A etapa que a fala cita está visível naquela tomada?
5. O primeiro quadro já mostra o cenário? Ele vira a capa no feed.
6. O último quadro mostra a obra pronta, com a câmera afastada?

## Desempenho
Use `PCFSoftShadowMap` com mapa de 2048 e no máximo umas centenas de objetos. Com isso, um quadro sai em fração de segundo e um vídeo de 40 s renderiza em poucos minutos num computador comum.
