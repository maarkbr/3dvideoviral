# Próximo vídeo: o que sobe de nível

Pedido depois do filme "O Salário que Já Chega Gasto" (renderizado no PC em cerca de 4 min): câmera, qualidade de imagem, caminhada, gráficos e rostos melhores.

## 1. Câmera
- Usar a gramática completa do kit (`story.ts`): **2 a 4 keys por cena**, não um push só. Os deslizes são de 18 a 40 quadros, centrados na palavra; há rolagens de 4 a 5° nos pontos de ênfase e tremores de 7 quadros nos impactos (`KICKS`).
- Movimentos curvos com pontos de passagem (curva de Bézier, como o `S15c` da ponte), em vez de linha reta.
- Rack focus de verdade (rampa no `DOF` entre dois focos) e objetos de primeiro plano (`FOREGROUND`) em cerca de 1/3 das cenas.
- Planos mais variados: over-the-shoulder, plongée, contra-plongée, plano-detalhe de objeto 3D (não só de cartão).

## 2. Qualidade de imagem
- Render final em 2K (`--scale 1.3333`, 1440 × 2560), como o kit foi calibrado; o PC aguenta.
- Um preset de luz **interior noite** em `lights.ts` (lâmpada quente, sombra azul), em vez de escurecer com a camada 2D.
- Texturas pintadas em HD para os cenários novos (`paint.ts`), com rejunte e desgaste, no padrão das casas do kit.
- Rodada de comparação lado a lado com os quadros de referência (`references/frames`) antes do render.

## 3. Caminhada e corpo
- Usar a vista de lado do kit (`bodySide`: passo plantado, balanço de 5%, inclinação de 1 a 7°) sempre que alguém anda, e não o boneco de frente deslizando.
- Personagens que entram e saem de quadro, sentam, levantam e se viram (troca frente → lado no meio do movimento).
- Poses de braço por cena (apontar, mão na testa, braços cruzados) e um objeto preso à mão em vez de flutuando.

## 4. Rosto
- Ampliar a biblioteca do `toon.ts`: desconfiada (uma sobrancelha), riso cansado, choro contido, determinada, aliviada de olhos fechados.
- Direção do olhar (`look`) mudando dentro da cena, piscada em cada troca de expressão e cabeça que acompanha as palavras fortes.
- Sincronização labial quando um personagem falar (bocas por sílaba a partir dos tempos do Whisper).

## 5. Gráficos
- Dados também dentro do mundo 3D (placas, telas e objetos com o número), não só na camada por cima.
- Gráficos animados de verdade: linha que se desenha, barras com mola, comparação lado a lado, sempre com fonte e período.
- Uma grade de área segura para Reels, TikTok e Shorts, para nada ficar embaixo dos botões.

## 6. Processo
- Quadros de teste para aprovação antes do render, com uma revisão crítica com nota por área (cor, luz, traço, texturas, personagens, profundidade, composição), como o kit faz.
- Controle de qualidade do MP4 final com `scripts/short_qa.py` (quadros pretos, congelados, saltos, volume).
