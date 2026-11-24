# Identidade visual do Tudo em 3D

A referência (Rick's Clips 3000) ensina a **execução**: câmera, luz, ritmo, som. A identidade abaixo é nossa.
O que já está em uso fica marcado como **[em uso]**; o que é proposta e depende da sua aprovação, como **[proposta]**.

## 1. O que nos diferencia (e precisa continuar diferente)
| Elemento | Referência | Nós |
|---|---|---|
| Informação na tela | Só texto dentro do mundo | **Etiqueta amarela de número** com contorno grosso **[em uso]** + texto no mundo |
| Final | Corta na reação, sem cartão | Reação + **cartão azul com raios e o mascote, ≤1,5 s** **[em uso]** |
| Marca | Nenhuma visível | **"@_tudoem3d" a 50% de opacidade** a 79% da altura **[em uso]** |
| Transição de lugar | Fusão curta | **Desfoque + clarão** (TRN-10) na troca de lugar **[em uso]**, fusão curta no resto **[proposta]** |
| Abertura | Direto na ação | Direto na ação + selo "DRAMATIZAÇÃO COM FATOS REAIS" no 1º segundo **[em uso]** |
| Assuntos | Curiosidades históricas e golpes | Notícias, dinheiro e crimes reais do Brasil, com fonte e números **[em uso]** |

## 2. Personagens: ponto de atenção
Os nossos personagens hoje têm **cabeça redonda branca, contorno preto grosso e corpo chapado**, o mesmo vocabulário
visual da referência. A técnica (2D dentro do 3D) é genérica e pode continuar. Mas, para a identidade ser
inconfundível, proponho mudar **a cara** do elenco **[proposta, decisão sua]**:

- **Opção A (recomendada): "cabeça com cor".** O rosto ganha tons de pele variados (5 tons) e bochechas fixas. A cor do
  contorno passa a **azul-tinta `#1B1F3B`** em vez de preto. Olhos com íris colorida, e o elenco ganha um acessório-
  assinatura do canal (crachá amarelo "3D" em todo personagem). Mantém tudo o que já funciona no motor.
- **Opção B: "cabeça com formato".** Mantém o branco, mas cada papel ganha um formato de cabeça (oval, quadrada,
  gota) e o contorno azul-tinta. Muda menos, diferencia menos.
- **Opção C:** manter como está.

O mascote já é nosso (boné amarelo "3D", jaqueta laranja) e fica em todas as opções.

## 3. Paleta oficial **[em uso, valores medidos no código]**
| Uso | Cor | Hex |
|---|---|---|
| Tinta (contornos, texto) | quase preto | `#17121D` |
| Etiqueta de número | amarelo-canal | `#FFD93D` |
| Etiqueta de alerta | vermelho | `#FF5A4E` / `#E8402F` |
| Etiqueta de ganho | verde | `#2BE37A` |
| Etiqueta fria/gelo | azul-gelo | `#BFE6FF` |
| Cartão final | azul em degradê | `#4F8DFF` → `#2350D8` → `#142C86` |
| Mascote | jaqueta laranja / sombra / calça / boné | `#FF7A1C` / `#D9560A` / `#2E3A66` / `#FFD23F` |

**Roteiro de cor por trecho [proposta, com base nas medições]:**
| Trecho | Céu | Luz principal | Saturação alvo | Exemplo nosso |
|---|---|---|---|---|
| Gancho/preparo | azul `#2C6CF0` → `#CFE4FF` | sol quente `#FFF1DC`, 25° | 115–130 | cidade de dia |
| Escalada | entardecer `#FF9A7A` / roxo `#7A5BD6` | `#FFB46A` baixo | 140–175 (pico) | cobertura dourada |
| Exagero | noite `#0C1030` | luzes práticas `#FFD9A0` + lua `#8FA8FF` | 130–160 | esconderijo, festa |
| Virada | chuva/frio `#7AA0D0` | `#CFE6FF` difusa | 70–100 | congelamento |
| Fecho | dourado `#FFD27A` ou volta ao azul limpo | quente | 110–140 | reação final |

## 4. Tipografia **[em uso]**
- **Baloo 2 ExtraBold (800)** em tudo: etiquetas, legenda, cartão final, capas (Google Fonts, licença OFL).
- **Legenda [em uso]:** 2 palavras por vez, 86 px, branca, contorno `#17121D` de 16 px + sombra sólida de 8 px para
  baixo, a 70% da altura (top 1350 px). É mais grossa e mais "cartoon" que a da referência, e assim fica.
- Etiqueta: texto 50–140 px conforme o tamanho; caixa `#FFD93D` com contorno de 10 px, raio de 26 px e sombra sólida
  de 16 px.

## 5. Assinatura de câmera e luz **[proposta]**
- **"Chega e assenta"** (CAM-01) como movimento padrão, com **tremida de impacto** nos números grandes.
- **Céu que muda de cor a cada trecho** (seção 3) e **bloom dourado** nos objetos de valor (ouro, dinheiro, placas).
- **Grade:** saturação +25–35%, calor leve, vinheta suave e grão fino (já no `motor2.js`, a subir de ×1,16 para ×1,30).

## 6. Capa **[em uso]**
1080x1920, fundo = quadro do próprio vídeo sem legenda, título em 3 linhas (branco / **amarelo gigante** / branco),
personagem do vídeo grande no canto inferior esquerdo, selo vermelho inclinado e o @ embaixo.

## 7. O que nunca usar
Personagens, chapéus, roupas ou rostos que lembrem os da referência (boina listrada com colete, chapéu-coco com colete
dourado, camisa amarela de cabelo castanho); a fonte e o estilo de legenda dela; as frases dela; os cenários icônicos
(cânion vermelho com trilho, dashcam de chuva) como cópia. Usamos as **técnicas**, não as imagens.
