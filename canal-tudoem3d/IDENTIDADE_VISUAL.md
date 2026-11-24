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

## 2. Personagens: ponto de atenção (revisado com 4 vídeos)
Comparação observada [O]:
| Traço | Referência (4 vídeos) | Nosso elenco hoje |
|---|---|---|
| Cabeça | redonda, contorno preto grosso; **branca ou cor de pele** | redonda, contorno preto grosso, branca |
| Olhos | pequenos (ponto, risco) ou grandes só no susto | **grandes, com branco do olho, pálpebra animada e brilho** |
| Bochecha | às vezes | **sempre rosada** |
| Braços e pernas | **uma linha fina** | **tubos grossos com roupa** |
| Mãos | linha, sem luva | **luva branca de desenho animado** |
| Corpo | feijão liso | tronco com roupa detalhada (gola, botões, crachá, gravata) |

Ou seja, o nosso elenco **já é diferente** em olhos, membros, mãos e roupa. A sobreposição está na cabeça redonda
branca com contorno preto. A antiga "opção A" (rosto com cor de pele) **não diferencia**: a referência também usa.

Propostas **[decisão sua]**:
- **Opção 1 (recomendada): reforçar o que já é nosso.** Manter o rig atual e tornar obrigatórios os traços
  exclusivos: olhos grandes com **íris colorida** (cor por papel), bochecha rosada, luvas brancas, membros grossos,
  e **contorno azul-tinta `#1B1F3B`** no lugar do preto. Nunca usar membros de linha fina.
- **Opção 2:** manter exatamente como está (os diferenciais atuais já bastam).
- **Opção 3:** redesenhar o elenco do zero (mais trabalho, risco de perder o que já funciona).

O mascote (boné amarelo "3D", jaqueta laranja) fica em todas as opções.

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

## 5. Estilo de cenário por vídeo **[proposta]**
A referência troca o estilo conforme o tema (ver análise §8). Nós teremos três estilos próprios, todos no motor v2:
| Estilo | Quando | Como no nosso motor | Viabilidade |
|---|---|---|---|
| **3D realista estilizado** | mundo físico: cidade, banco, estrada, natureza | o atual (PBR, sombra, céu, bloom) com +30% de saturação | já existe |
| **3D desenhado (toon com contorno)** | sátira, escritório, cotidiano, golpes | materiais toon (2–3 tons) + passe de contorno por profundidade/normal | **a construir; é o mais próximo do nosso traço 2D e o mais barato de renderizar** |
| **Palco escuro de luz única** | mente, ciência, mistério, explicação de mecanismo | fundo quase preto, 1 luz pontual com cone visível, vinheta forte, diagramas no mundo | fácil com o motor atual |

## 6. Assinatura de câmera e luz **[proposta]**
- **"Chega e assenta"** (CAM-01) como movimento padrão, com **tremida de impacto** nos números grandes.
- **Céu que muda de cor a cada trecho** (seção 3) e **bloom dourado** nos objetos de valor (ouro, dinheiro, placas).
- **Grade:** saturação +25–35%, calor leve, vinheta suave e grão fino (já no `motor2.js`, a subir de ×1,16 para ×1,30).

## 7. Capa **[em uso]**
1080x1920, fundo = quadro do próprio vídeo sem legenda, título em 3 linhas (branco / **amarelo gigante** / branco),
personagem do vídeo grande no canto inferior esquerdo, selo vermelho inclinado e o @ embaixo.

## 8. O que nunca usar
Personagens, chapéus, roupas ou rostos que lembrem os da referência (boina listrada com colete, chapéu-coco com colete
dourado, camisa amarela de cabelo castanho, membros de linha fina, botão "FIRE", sala de "career development"); a fonte e o estilo de legenda dela; as frases dela; os cenários icônicos
(cânion vermelho com trilho, dashcam de chuva) como cópia. Usamos as **técnicas**, não as imagens.
