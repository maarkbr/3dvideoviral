# Estúdio de desenho 3D

Bonecos 2D de cabeça de feijão, com traço, dentro de um mundo 3D com contorno preto, texturas pintadas, foco raso e câmera deslizando. É o estilo das referências (o vídeo do soldado na ponte e o "Your Brain's Secret Idea Zone").

## O que está instalado
| Peça | Para que serve | Onde |
|---|---|---|
| **cartoon-3d-short** (kit do Mr Omi, MIT) | Passo a passo completo, medidas de estilo de 20 vídeos de referência e o código do vídeo da ponte (mundo, bonecos, traço, foco, cor, câmera, som) | `~/.claude/skills/cartoon-3d-short` |
| **Projeto Remotion** (este) | Onde os vídeos são montados e renderizados | `estudio-cartoon/` |
| **Modelos Kenney** (CC0) | Árvores, arbustos, flores, barracas, moinho, lanterna, carroça | `public/bridge/kenney/` |
| **Claude Design Skills** (4 pacotes) | Consulta de Three.js, GSAP, React Three Fiber, Blender, Rive, Lottie e design moderno | plugins do Claude Code (`.claude/settings.json` do repositório) |
| **cartoon-audio-short** | Fórmula de ideias e roteiro, regras de câmera e movimento, mixagem a 50 % da voz | skill da conta (o `kit/` dela não veio na instalação: use o código deste estúdio) |

Numa sessão nova: `bash estudio-cartoon/instalar-estudio.sh`.

## Teste feito
`node scripts/bridge-stills.mjs out/teste/x_ 60,700,1500 0.5` renderizou o vídeo de exemplo (a ponte) sem erro, na qualidade da referência, em cerca de 13 s por quadro.

## Análise do vídeo de referência ("Your Brain's Secret Idea Zone")
- **Personagem:** cabeça grande de feijão cor creme, cabelo castanho em mecha, olhos de ponto (arregalados em círculo na surpresa), sobrancelhas grossas que fazem quase toda a emoção, bigode como detalhe de personagem, corpo azul arredondado, braços e pernas de palito. O traço é **marrom-escuro**, não preto puro, e mais grosso embaixo.
- **Expressões:** calmo de olhos fechados, desconfiado (uma sobrancelha), sorriso largo com dentes, olhos em espiral ou círculo na surpresa, piscadela. Cada frase muda a expressão.
- **Cenários:** interiores escuros e quentes, lâmpada pendurada com cone de luz, tapete em espiral, banquinhos, pratos, quadro de cortiça com fios vermelhos, laboratório antigo, elevador com porta pantográfica, "corte" embaixo d'água. Muita profundidade, foco raso e vinheta.
- **Luz e cor:** fundo quase preto, um foco quente sobre o personagem, tons de madeira, mostarda e azul-petróleo. Aspecto de pintura digital.
- **Câmera e ritmo:** troca de plano a cada 1,5 a 2,5 s, aproximação lenta constante, close no rosto nas falas fortes e plano aberto na revelação. Inserts de objeto (o quadro, a chave, o carro-ímã).
- **Efeitos:** raio X (o cérebro aparecendo dentro da cabeça), ondas, faíscas, linhas de "escaneamento".
- **Legenda:** uma palavra por vez, branca, grossa, com contorno preto, no meio da tela.

## O que o kit já faz e o que falta para chegar lá
- **Já faz:** o boneco de feijão com traço e 14 expressões, piscada, caminhada, sombra de contato, mundo 3D com traço preto, foco raso, luz de dia e de fim de tarde, câmera que nunca para, som sintetizado.
- **Falta (próximos passos):**
  1. Um preset de luz **interior quente** (lâmpada pendurada, fundo escuro, vinheta), em `lights.ts`.
  2. Os detalhes de personagem do vídeo: cabelo em mecha, bigode, olhos em círculo e sorriso com dentes no `toon.ts`, e o traço marrom.
  3. Cenários de interior (sala do experimento, quadro de cortiça, laboratório) em `build.ts`/`paint.ts`.
  4. A legenda e os textos do nosso estilo (Inter, botão azul, cartão com borda limão), por cima do vídeo.

## Limite desta nuvem
Aqui não há placa de vídeo: cada quadro leva cerca de 13 s, então um vídeo de 70 s leva horas. No seu computador, com placa de vídeo, o kit renderiza a cerca de 4 quadros por segundo. Para vídeos completos, rode lá (ou aceite o tempo aqui).

## Caminho com IA (Higgsfield), se quiser o aspecto de pintura
O "Your Brain's Secret Idea Zone" tem cara de pintura digital, o que sugere imagens geradas por IA e animadas depois. O Higgsfield está conectado a esta conta e faz isso (folha do personagem, cenários, imagem para vídeo), mas gasta créditos. Mostro o custo antes de gerar qualquer coisa.
