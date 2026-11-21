# DESIGN.md: Painel "Edição com IA"

O painel é uma página local que o Claude abre no computador do aluno. Ali o aluno:
- escolhe o estilo de edição;
- cadastra a identidade visual do canal dele;
- manda o pedido. O Claude edita e devolve o vídeo no mesmo painel.

A marca do painel é a do produto (área de membros, capas e banners em `area-membros/final/`). A marca **do aluno** aparece só na prévia do vídeo, nunca na interface.

**O que vende e para quem:** "Você grava. O Claude edita." É para quem cria conteúdo e para quem quer uma página sem rosto, e não sabe (ou não tem tempo de) editar.

**3 palavras que o aluno deve sentir:** fácil, profissional, meu.

## 1. Cores
| Uso | Hex |
|---|---|
| Fundo da página | `#0A0B0E` (o mesmo da área de membros) |
| Superfície (cartões, campos) | `#14161B` |
| Superfície ao passar o mouse / selecionada | `#1C1F26` |
| Linha / borda | `#262A33` |
| Texto | `#EDEFF3` |
| Texto secundário | `#9EA3AE` |
| Destaque (amarelo da marca) | `#F2C200` |
| Texto sobre o destaque | `#0A0B0E` |
| Erro | `#FF6B5E` |
| Sucesso | `#3DDC84` |
| Gráfico: barra comum | `#6B7280` (3,7:1 sobre a superfície; `#9EA3AE` com mais contraste ligado) |
| Gráfico: barra em destaque (hoje, o maior projeto) | `#EDEFF3` (o mesmo do texto) |

O destaque ocupa **no máximo 10% da tela**. Ele só aparece:
- no botão principal ("Mandar para o Claude");
- no contorno do estilo selecionado;
- no número da etapa atual;
- na barra de progresso.
Não vai em título, ícone decorativo nem fundo de seção.
No assistente do Novo vídeo e nos primeiros passos do Início, o amarelo segue as mesmas regras: o botão principal (Continuar / Começar o vídeo / o botão do passo atual), o contorno do tipo de vídeo escolhido, o número do passo atual e a barra de progresso. Passo feito é ✓ em branco, passo futuro é número cinza.
Botão que se repete em cada cartão de uma grade ("Usar este modelo", "Assistir" nas entregas) nunca é amarelo: usa o `.btn-forte` (superfície 2 com contorno no texto secundário), para não ter amarelo em vários botões na mesma tela.

**Gráficos** (painel do Início): cinza com uma barra em branco para o que importa (hoje, o maior). O amarelo fica de fora. Barras finas (até 24px), ponta arredondada em 4px só na ponta do dado, sem sombra e sem grade pesada (uma linha fina no topo da escala e a base). Números só na maior barra e na de hoje; o resto aparece ao passar o mouse ou tocar.

## 2. Tipografia
A fonte é **Montserrat** (variável, a mesma das capas e do banner), servida localmente. As fontes de legenda (Anton, EB Garamond) só aparecem na prévia da legenda do aluno.

| Nível | Tamanho | Peso | Entrelinha | Espaço entre letras |
|---|---|---|---|---|
| Título da página | 32px (24px no celular) | 800 | 1.1 | -0.02em |
| Título de etapa | 20px | 700 | 1.2 | -0.01em |
| Nome do estilo | 16px | 700 | 1.25 | -0.005em |
| Texto | 15px | 500 | 1.5 | 0 |
| Texto pequeno / ajuda | 13px | 500 | 1.45 | 0.005em |

São 5 níveis, sem mais. A hierarquia vem do peso e do tamanho juntos, não da cor.

## 3. Espaçamento
Escala em múltiplos de 4: 4, 8, 12, 16, 24, 32, 48, 64.
- **Entre etapas:** 48 (32 no celular).
- **Entre o título da etapa e o conteúdo:** 16.
- **Entre cartões e entre campos:** 12.
- **Dentro do cartão:** 16.
- **Margem lateral:** 16 no celular e 32 no computador. Largura máxima do conteúdo: 1080.

## 4. Cantos
Um arredondamento só: **12px**, para cartão, botão, campo, chip e vídeo. É o mesmo canto suave das janelas e cartões flutuantes das artes da marca. O círculo só aparece em amostra de cor e no número da etapa (é forma, não canto).

## 5. Movimento
- **Botão:** ao pressionar, escala 0.97 em 100 ms; volta em 160 ms.
- **Seleção de estilo:** o contorno amarelo aparece em 160 ms, sem pular.
- **Etapas:** a seguinte aparece com opacidade e 8px de subida em 200 ms (`cubic-bezier(.2,.8,.2,1)`).
- **Barra de progresso:** a largura muda por `transform: scaleX`, em 300 ms.
- **Prévias dos estilos:** tocam sem som, em loop, só quando aparecem na tela. Com menos movimento ligado, ficam paradas na capa.
- **Nunca anima:** layout (largura, altura, margem), texto digitado, cor de fundo da página. Não há quique.

## 6. Proibido
- Degradê roxo ou azul, e brilho (glow) em botão.
- Título em serifa itálica e palavra em itálico no meio do título.
- Selo pequeno em caixa alta acima do título.
- Três cartões iguais com ícone, título e duas linhas. Os estilos aparecem com o **vídeo de exemplo**, que é o conteúdo.
- Emoji como marcador e ícone em quadradinho colorido.
- Sombra em todo elemento: só a janela de prévia tem sombra.
- Amarelo em mais de um botão por tela.
- Nome genérico de botão ("Enviar", "OK"). O botão diz o que acontece ("Mandar para o Claude", "Salvar minha marca").

## 7. Referências
1. **As artes da própria marca** (`area-membros/final/`): copiar o preto profundo com o amarelo como única cor viva, e a Montserrat pesada.
2. **CapCut (tela de modelos):** copiar a galeria de estilos em que o vídeo de exemplo é o próprio botão de escolha.
3. **Apple, a tela de configurar um iPhone novo:** copiar uma decisão por vez, com o botão de seguir sempre no mesmo lugar.

## Linguagem
A pessoa não é editora nem programadora. A tela e o Claude falam português simples: render → gerar o vídeo; LUFS → volume no padrão das redes; b-roll → imagens de apoio; copy → texto do vídeo; storyboard → desenho das cenas; briefing → pedido; skill → estilo; "com código" → "com a montagem". Etapas: Pedido, Roteiro, Desenho das cenas, Narração, Animação, Gerar o vídeo, Entrega. Nada de nome de arquivo, comando ou inglês no chat: os passos saem do servidor em português (`_resume_ferramenta`, `em_portugues`), o técnico das mensagens vai depois de "Detalhes:" (vira "Ver detalhes") e frase em inglês vira "Ver nota técnica". O comando de um pedido de permissão fica em "Ver o comando" (aberto quando mexe fora da pasta de trabalho).
