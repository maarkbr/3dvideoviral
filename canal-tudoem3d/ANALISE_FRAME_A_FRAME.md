# Análise quadro a quadro: Rick's Clips 3000 (engenharia reversa da execução)

Versão 2 (24/11/2026): **quatro vídeos**. Objetivo: entender **como** a imagem e o som são construídos, para criarmos
a nossa execução com identidade própria. Não copiamos personagens, cenários, roteiros, falas nem elementos exclusivos
do canal. Este documento substitui os números do estudo anterior (`LINGUAGEM-AUDIOVISUAL.md`, 22/11); o que mudou
está na seção 9.

---

## 1. Material, método e limites (leia antes)

### 1.1 Material analisado
| Cód. | Vídeo | Resolução | Quadros | Duração | Estilo do cenário [O] |
|---|---|---|---|---|---|
| A | "Why Drivers Started Filming The Road" | 1080x1920 | 1.867 | 62,33 s | 3D estilizado com luz física, desfoque de movimento, céu realista |
| B | "Why Perfect Railroads Don't Work" | **720x1280** | 1.955 | 65,26 s | igual ao A |
| C | "The Job Nobody Wants in Japan" | 1080x1920 | 1.815 | 60,59 s | **3D "desenhado"**: contorno preto nas formas 3D, cores chapadas, sombras simples (toon) |
| D | "Your Brain's Secret Idea Zone" | 1080x1920 | 1.172 | 39,16 s | **palco escuro de lâmpada única**, pintado e suave, com recursos de infográfico |

Todos a 30 fps, áudio AAC 44,1 kHz estéreo. Quatro vídeos ainda é uma amostra pequena; a seção 5 diz quantos dos
quatro mostram cada padrão.

### 1.2 O que foi medido em TODOS os quadros (6.809 quadros, por script)
Scripts em `analise/scripts/`; dados em `analise/dados/` (só números, sem o texto do roteiro dele).
- **Cor e luz por quadro:** luminância média e desvio (contraste), saturação média, diferença R−B (calor), matiz
  dominante, % de pixels muito escuros e muito claros, nitidez (variância do Laplaciano).
- **Mudança entre quadros:** diferença de luminância, correlação de histograma de cor e distância de cor numa grade
  3x6, quadro a quadro (lag 1) e em janela de 6 quadros (lag 6, pega fusões).
- **Movimento global de câmera entre cada par de quadros:** pontos ORB + transformação de similaridade (RANSAC):
  escala (aproximar/afastar), rotação e deslocamento X/Y.
- **Fala:** tempo de cada palavra (faster-whisper small, inglês).
- **Áudio:** loudness integrada, LRA, pico e nível nas pausas entre palavras.

### 1.3 O que foi OLHADO (inspeção visual)
- Folhas de contato com **1 quadro a cada 0,5 s** (455 quadros), com o tempo gravado em cada um.
- **Todos os quadros** (12 seguidos) em volta de cada um dos **108 candidatos a transição**. Cada fronteira de plano
  foi confirmada ou descartada olhando.
- Recortes em resolução cheia para legenda, personagens, contorno, sombra e luz.

### 1.4 Limites (o que NÃO foi feito, para não inventar)
- **Não olhei os 6.809 quadros um por um.** Olhei 1 a cada 15, mais todos os quadros em volta das transições. Entre
  duas amostras pode haver um gesto ou efeito de menos de 0,5 s que não vi. Os números da seção 1.2 cobrem todos os
  quadros.
- **Movimento de câmera é estimado em 2D.** Em travelling com paralaxe ou com personagem grande em quadro, os totais
  em % são ordem de grandeza. O **perfil** (acelera, desacelera, rápido, lento) é confiável.
- **Áudio: não ouço.** Meço volume, pausas e nível de fundo; não identifico trilha nem efeitos pelo nome.
- **Ferramenta de produção: desconhecida** (seção 7).
- O vídeo B chegou em 720p: detalhe fino de textura menos confiável.

Legenda: **[M]** medido por script · **[O]** observado nas imagens · **[I]** inferido · **[?]** a verificar.

---

## 2. Números-chave [M]

| Medida | A motoristas | B ferrovias | C Japão | D cérebro | Nosso vídeo 4 |
|---|---|---|---|---|---|
| Planos (fronteiras confirmadas olhando) | 19 | 17 | 21 | 9 | 41 eventos |
| Duração média / **mediana** do plano | 3,27 / **2,80 s** | 3,83 / **2,73 s** | 2,88 / **2,37 s** | 4,34 / **3,97 s** | ~1,5 s |
| Plano mais curto / mais longo | 1,23 / 9,13 s | 0,37 / 11,83 s | **0,13** / **12,93 s** | 1,77 / 8,23 s | |
| Primeira troca de plano | 1,23 s | 2,13 s | **1,20 s** (4 planos nos primeiros 2,3 s) | 3,97 s | 2,2 s |
| Fusão curta (4–8 quadros) | 8 de 18 | 12 de 16 | 17 de 20 | 7 de 8 | 0 |
| Corte seco | 8 | 1 | 3 (todos no gancho) | 0 | ~todos |
| Transições especiais | dinheiro, limpador | chicote, poste, flash | — | íris do olho | desfoque + clarão |
| Planos que desaceleram / aceleram no fim | 12 / 6 de 19 | 11 / 3 de 17 | 11 / 5 de 21 | 5 / 3 de 9 | lineares |
| Luminância média (0–255) | 101 | 117 | **131** | **66** | 135 |
| Saturação média (0–255) | 116 | 124 | 112 | 127 | **85** |
| Saturação no plano mais saturado | 175 | 172 | 195 | 189 | |
| Contraste | 58 | 51 | 53 | 50 | 65 |
| Palavras / palavras por segundo | 238 / 3,84 | 218 / 3,36 | 224 / 3,72 | 145 / 3,75 | 159 / 2,6 (pt-BR) |
| Maior pausa entre palavras | 0,32 s | 0,40 s | 0,44 s | 0,38 s | |
| Fala começa / termina | 0,00 / 61,9 | 0,00 / 64,9 | 0,00 / 60,2 | 0,00 / 38,6 | 0,0 / 61,4 |
| Loudness / LRA | −14,1 / 2,2 | −14,1 / 3,2 | −14,1 / 1,8 | **−15,6** / 3,5 | −14,2 |
| Fundo nas pausas (abaixo da voz) | 6,6 dB | 9 dB | 6,3 dB | 7,9 dB | trilha a −21 |

**Totais dos quatro [M]:** 66 planos; **71% das transições são fusões curtas** (44 de 62); 59% dos planos
desaceleram (chegam e assentam); mediana do plano entre 2,4 e 4,0 s; saturação média sempre ≥112.

**Leitura rápida [I]:** eles **cortam pouco, fundem quase sempre e mexem a câmera o tempo todo.** A sensação de
velocidade vem do movimento contínuo, das fusões curtíssimas e da fala sem pausa. O corte seco rápido aparece
concentrado no gancho (C: 4 planos em 2,3 s) e em impactos. A luz e o estilo mudam com o tema; a **saturação alta**
fica em todos.

---

## 3. Linha do tempo: vídeo A, "Why Drivers Started Filming The Road" (62,3 s)

Velocidade de câmera [M] por quarto do plano (Q1→Q4; 0 = parado, >5 = rápido). Descrição [O]. Função [I].

| # | Tempo | Entrada | O que aparece [O] | Câmera [O]+[M] | Luz e cor | Função [I] |
|---|---|---|---|---|---|---|
| 1 | 0,00–1,23 | início | Motorista no banco, sol batendo, painel em primeiro plano | Recua e gira (roll ≈7°), **acelera no fim** (Q1 2,8 → Q4 9,8) | quente, flare | Ação no quadro 0 com a 1ª palavra |
| 2 | 1,23–3,30 | corte em movimento | Rodovia; o carro de trás bate | Baixa na pista; entra rápida e assenta (5,9 → 0,4) | céu saturado | O verbo da frase, literal |
| 3 | 3,30–4,80 | corte seco (aproxima) | Close do para-choque amassando, pedaços voando | **Parada** (≤0,3) | vermelho x branco | Impacto: a câmera para para o golpe pesar |
| 4 | 4,80–6,97 | fusão 5q | POV pelo para-brisa: o outro sai segurando o pescoço | Aproxima ≈10%, desacelera | dessaturado (77) | Ponto de vista da vítima |
| 5 | 6,97–10,33 | corte seco | Dupla no asfalto; um carro entra pela esquerda em ≈9,5 s | Recua e gira, desacelera | dia | Elemento novo entra no meio do plano |
| 6 | 10,33–12,90 | fusão 8q | Gramado; o "seguro" chega com placa "PAID" | Baixa na grama; recua e assenta | **saturação 175** | Recompensa = cor mais feliz |
| 7 | 12,90–15,30 | corte seco | Cama de hospital, médico, cheque | Aproxima ≈23% | dia | Cada item da frase vira objeto |
| 8 | 15,30–18,60 | **chuva de dinheiro** (~0,8 s) + fusão | Notas cobrem a tela; carro vermelho de lado | Travelling lateral | dia | Transição temática |
| 9 | 18,60–27,73 | fusão "mesmo assunto" | Rodovia ao entardecer; escolha da vítima; comparsa | **9,1 s**: frontal → órbita até ficar de lado | **entardecer roxo** | Escalada; o carro vermelho no centro segura o fio |
| 10 | 27,73–29,47 | fusão 8q | Garagem com montanha de dinheiro | Recua e assenta | neutro | Fartura |
| 11 | 29,47–32,27 | corte seco | Carro esportivo cai do céu e bate | **Aproximação mais rápida do vídeo** (Q2 11,1) | **noite** | Pico de energia no meio |
| 12 | 32,27–36,70 | fusão 6q | Seguradora; placa "dias desde…" troca de número | Aproxima e **termina parado** | escritório frio | Antagonista + gag de número |
| 13 | 36,70–38,70 | corte seco | Piscina à noite, boia de patinho | Aproxima ≈16% | lâmpadas de varal | Deboche |
| 14 | 38,70–43,63 | corte seco | Garagem: policial; um 3º entra com lanterna | **Afasta ≈52%** | noite azul | Revelação por afastamento |
| 15 | 43,63–46,67 | **limpador de para-brisa** | Manhã de chuva; motorista calmo | Aproxima e acelera | **chuva dessaturada** | Virada = mudança de clima |
| 16 | 46,67–50,00 | fusão 5q | POV na chuva: o golpista repete o golpe | Panorâmica | chuva | Eco do gancho |
| 17 | 50,00–55,23 | fusão 6q | Motorista impassível; o golpista descobre a caixinha no vidro | Parado, depois move | chuva | Suspense |
| 18 | 55,23–60,13 | corte seco | **Visão da dashcam**: REC, data, mph contando | **Câmera fixa**; o limpador passa | frio | Prova (overlay = documento) |
| 19 | 60,13–62,23 | fusão 4q | Dashcam com luz vermelha; olhar satisfeito | Aproxima e para no rosto | frio | Fecho em reação |

Arco de cor: dia saturado → entardecer roxo → noite → chuva dessaturada → frio na prova.

## 4. Linha do tempo: vídeo B, "Why Perfect Railroads Don't Work" (65,3 s)

| # | Tempo | Entrada | O que aparece [O] | Câmera [O]+[M] | Luz e cor | Função [I] |
|---|---|---|---|---|---|---|
| 1 | 0,00–2,13 | início | Operário serrando o trilho, faíscas; trem vindo ao fundo | Close baixo, trilho em diagonal até o trem | paredão laranja | Perigo no quadro 0 |
| 2 | 2,13–3,73 | fusão 4q | Operário de pé; a linha ao longo do cânion | Recua e sobe | laranja + azul | Escala; número a giz no dormente |
| 3 | 3,73–9,17 | corte em movimento | Cânion azul profundo, pontes em obra | **Grua 5,4 s** desce e sobe | **azul profundo** | Vertigem |
| 4 | 9,17–11,67 | fusão 4q | Voo até a estação; faixa do prêmio | **Rampa de velocidade** (Q2 28,8) | borrão | Viagem até o prêmio |
| 5 | 11,67–13,53 | fusão 6q | Operários rindo numa viga | Quase parada | listras quentes | Coro de deboche |
| 6 | 13,53–21,40 | fusão 5q | Chefe nos trilhos; rosto fica roxo com vapor (17,1 s) | 7,9 s, várias posições | efeito de cor | Emoção como cor e partícula |
| 7 | 21,40–21,77 | **chicote** 5q | Giro rápido | 0,37 s | borrão | Troca de lugar com energia |
| 8 | 21,77–26,33 | fusão 6q | Obra rival; soldagem com faíscas | Rente aos trilhos | céu limpo | Apresenta o rival |
| 9 | 26,33–28,50 | **poste em primeiro plano** | Vagão de luxo; chá na janela | Empurra para a janela e assenta | vermelho quente | Luxo e calma |
| 10 | 28,50–31,23 | fusão 5q | Trem na ponte → janela do chefe; café derrama | Aproximação muito rápida | madeira escura | Comparação pela mesma composição |
| 11 | 31,23–36,10 | fusão 5q | Estação; manchete; multidão troca de lado | Recua ≈47% | claro | Virada social; texto no mundo |
| 12 | 36,10–47,93 | fusão 6q | Calendário + termômetro → macro do vão; trilho muda de cor; moeda, papel; dupla | **11,8 s** contínuos, 5–6 enquadramentos | laranja máximo | Grandeza invisível vira cor |
| 13 | 47,93–54,47 | fusão 6q | Trilhos rivais brilhando; o ricaço se assusta | Travelling que acelera | fim de tarde | Escalada para o desastre |
| 14 | 54,47–59,40 | fusão 5q | Herói sorri no calor; o vão fecha | Close → recua | luminoso | Justiça |
| 15 | 59,40–62,97 | fusão 6q | Ponte ao pôr do sol; trilhos entortam | Aéreo → frontal | **hora dourada** | Clímax anunciado |
| 16 | 62,97–64,23 | fusão **estourada** | O trem cai da ponte | Amplo | luma 171 | Desastre |
| 17 | 64,23–65,17 | **flash de explosão** | Explosão + herói de boca aberta | Reação em primeiro plano | fogo | Corta no auge |

## 5. Linha do tempo: vídeo C, "The Job Nobody Wants in Japan" (60,6 s)

| # | Tempo | Entrada | O que aparece [O] | Câmera [O]+[M] | Luz e cor | Função [I] |
|---|---|---|---|---|---|---|
| 1 | 0,00–1,20 | início | Close do botão vermelho "FIRE EMPLOYEE"; um martelo bate nele várias vezes; funcionário desfocado ao fundo | Muito rápida (Q1 31,8) | escritório azul, botão vermelho | **Objeto-gancho** absurdo no quadro 0 |
| 2 | 1,20–2,13 | corte seco | O funcionário é ejetado pelo teto com a cadeira | Rápida | azul | Gag de ação |
| 3 | 2,13–2,27 | corte seco | Flash de 4 quadros do funcionário | — | azul | **Corte-relâmpago** (ritmo de gancho) |
| 4 | 2,27–4,63 | corte seco | Botão → câmera sobe até o chefe sorrindo, com placa caligráfica e chave "STORAGE" | Inclinação para cima, desacelera | madeira quente (calor +42) | Apresenta o vilão por revelação vertical |
| 5 | 4,63–7,87 | fusão 6q | Escritório branco com carpete azul; o chefe leva o funcionário até a porta "CAREER DEVELOPMENT ROOM" | Acompanha e **acelera no fim** (Q4 11,2) | claro (luma 175), pouca cor | Caminhada até o destino |
| 6 | 7,87–9,43 | fusão 5q | Sala minúscula de tijolos verdes: mesa com o contorno do computador em fita amarela, bandeja "TO DO" com teia | Plongée, aproxima | verde + amarelo | Ausência mostrada por objeto (fita no lugar do PC) |
| 7 | 9,43–13,77 | fusão 5q | Relógio tiquetaqueando → desce até um funcionário de pés na mesa no celular, num **feixe de sol chapado amarelo**; colega entra | Inclinação para baixo, depois afasta ≈75% | verde + feixe amarelo | Tédio + personagem que entra |
| 8 | 13,77–16,13 | fusão 4q | O chefe na porta com uma caixa de presente | Aproxima | azul/branco | Ironia (presente = nada) |
| 9 | 16,13–17,47 | fusão 5q | Por cima do ombro do funcionário; chefe na porta; calendário | Quase parada | verde | Ponto de vista |
| 10 | 17,47–19,23 | fusão 4q | Celular na mesa mostrando o salário caindo na conta | **Aproxima forte** (Q3 12,7) | tela azul | Prova numérica na tela |
| 11 | 19,23–20,10 | fusão 5q | Rosto do funcionário sorrindo | Quase parada | — | Reação |
| 12 | 20,10–21,43 | fusão 4q | Vista de cima: dois deitados de óculos escuros no feixe de sol | Plongée total | amarelo | "Paraíso" |
| 13 | 21,43–25,63 | fusão 5q | Escritório: colegas encarando; **empurra até dentro da tela do celular** ("Inbox (0)") e até o ícone, que estoura em branco | Aproximação enorme e acelerada (Q4 16,9) | branco | **Inserto de interface** sem corte |
| 14 | 25,63–28,80 | **fusão do branco** | Porta-retratos na mesa antiga → recua e mostra outra pessoa sentada lá | Afasta e assenta | escritório | Substituição revelada por afastamento |
| 15 | 28,80–33,40 | fusão 5q | **Calendário de destacar**: folhas voam (11 → 18 → 25); panorâmica até a porta; o chefe põe a cabeça para dentro | Pan, desacelera | verde | Passagem de tempo animada |
| 16 | 33,40–36,47 | fusão 5q | Outro funcionário no canto, no feixe de sol, "anos" | Acelera no fim | quente | Contraexemplo |
| 17 | 36,47–39,57 | fusão 5q | **Exterior noturno**: prédio azul com uma única janela acesa e quente | Afasta ≈60% | **saturação 195**, frio (calor −110) | Solidão; respiro visual amplo |
| 18 | 39,57–42,60 | fusão 6q | Dois sentados de pés na mesa com drinks | Aproxima | verde | Dupla feliz |
| 19 | 42,60–45,27 | fusão 6q | Sala vazia; o funcionário entra e sai | Órbita | azul | Tempo passou |
| 20 | 45,27–47,57 | fusão 5q | Mesa limpa (marcas de café), cadeira encostada | Aproxima | azul | Ausência = objeto |
| 21 | 47,57–60,50 | fusão 5q | Corredor branco; colegas olham a porta → empurra até a porta; **as luzes apagam e tudo fica azul** (49,6 s); alarme "FIRE" trancado com cadeado "LABOR LAW"; o chefe entra em close; abre um quadro de disjuntores com etiquetas ("HOPE", "WI-FI", "FRIENDS"); termina empurrando até a janela da porta com o funcionário lá dentro | **12,9 s contínuos**; **mudança de luz dentro do plano** | branco → azul escuro com lâmpada quente | Virada de tom sem corte; fecho em imagem simbólica |

Arco de cor: azul + vermelho no gancho → branco do escritório → verde + amarelo da sala → noite azul com janela
quente → azul escuro no fecho.

## 6. Linha do tempo: vídeo D, "Your Brain's Secret Idea Zone" (39,2 s)

| # | Tempo | Entrada | O que aparece [O] | Câmera [O]+[M] | Luz e cor | Função [I] |
|---|---|---|---|---|---|---|
| 1 | 0,00–3,97 | início | Personagem de olhos fechados num quarto escuro com **uma lâmpada**; recua e revela a cadeira num piso de **anéis concêntricos**, pratos e bolas de aço | Recua, desacelera | luma 65, cone de luz quente | Mistério; motivo visual hipnótico |
| 2 | 3,97–10,63 | fusão 5q | Plano geral explicando os passos; brilho nas bolas | Aproxima ≈57% devagar | escuro | Instrução clara |
| 3 | 10,63–12,40 | fusão 5q | **POV em primeira pessoa**: mãos segurando as bolas sobre os pratos | **Parada** | escuro | Coloca o espectador no lugar |
| 4 | 12,40–20,63 | fusão + **linha de scanner** | Uma linha horizontal varre e transforma o personagem em **corpo de raio-X azul** com cérebro e o caminho do nervo brilhando; as bolas caem; **arcos de onda sonora**; o scanner volta ao normal em "acordado" | Quase parada até cair, depois mexe | azul translúcido | Explica o mecanismo **por dentro do personagem** |
| 5 | 20,63–23,90 | fusão 5q | Inventor histórico de gravata-borboleta num laboratório com lâmpadas; piscadela | Recua | **saturação 189**, quente | Autoridade/curiosidade histórica |
| 6 | 23,90–28,73 | fusão 5q | **Corte do mar como diagrama**: camadas com rótulos (acordado / sono leve / sono profundo), linha de ondas cerebrais; o personagem afunda na cadeira; empurra até o rosto; **título grande na tela** com o nome do fenômeno | Aproxima, desacelera | azul-petróleo | Infográfico dentro do mundo |
| 7 | 28,73–31,50 | **mergulho na íris** (8q) | Zoom no olho → quadro de cortiça com cartões de ideias ligados por barbante vermelho; um cartão destacado | Rápida | cortiça quente | Metáfora visual da mente |
| 8 | 31,50–36,40 | fusão 5q | Elevador antigo com mostrador de andares (acordado / meio-termo / profundo); as bolas caem com arcos de som; ele acorda suando | Lenta | muito escuro (47) | Metáfora do "andar" do sono |
| 9 | 36,40–39,07 | fusão "volta ao início" | O personagem acorda com o desenho da ideia; **volta à composição do primeiro plano** (cadeira, pratos, bolas) | Desacelera | escuro | **Loop explícito** para o replay |

## 7. Padrões entre os vídeos (com frequência)

### 7.1 Recorrentes (4 de 4)
- Fala do quadro 0 até o fim, pausas ≤0,44 s; fundo contínuo 6–9 dB abaixo da voz.
- **Fusão curta de 4–8 quadros como transição principal** (44% a 88% das transições).
- Planos que **chegam e assentam** são maioria ou quase (52% a 65%).
- Pelo menos um **plano longo e contínuo** (8–13 s) com vários enquadramentos encadeados por movimento.
- **Saturação média ≥112** e pelo menos um plano com saturação ≥172.
- **Legenda igual**: 1–3 palavras, branca, sans muito grossa, contorno preto fino, a ≈70% da altura.
- Personagens 2D com contorno preto grosso e atuação de pose em pose; sombra de contato quando há chão.
- **Objeto ou texto no mundo prova a frase** (placa, tela, calendário, cartão, overlay).
- **Fecho curto em reação ou imagem simbólica**, sem tela de despedida.

### 7.2 Frequentes (2 ou 3 de 4)
- Arco de cor por trecho com virada de clima ou de luz (A, B, C; em D a luz é constante e escura).
- Corte seco concentrado no gancho ou no impacto (A, C).
- Personagem que entra ou sai de quadro no meio do plano (A, B, C).
- **Grandeza invisível vira cor ou diagrama**: calor (B), mecanismo do sono (D), tempo (C: calendário).
- **Inserto de tela/interface** sem corte, empurrando a câmera até ele (A: dashcam; C: celular).
- **Loop explícito**: a última imagem repete a primeira (D) ou ecoa o gancho (A, C).

### 7.3 Específicos de um vídeo (não generalizar)
- Estilo toon com contorno no cenário (C); palco escuro pintado (D); 3D realista estilizado (A, B).
- Raio-X por scanner e arcos de onda sonora (D); mergulho na íris (D); título grande sobre a imagem (D).
- Mudança de luz dentro do plano (C); calendário de destacar (C); feixe de sol chapado (C).
- Chuva de dinheiro (A); limpador (A); chicote e poste (B); flash de explosão (B).
- Duração de 39 s e −15,6 LUFS (D).

### 7.4 Personagens [O]
- **Rostos brancos e rostos com cor de pele** aparecem (C tem os dois; D usa cor de pele com sombreado suave).
- Contorno preto grosso; braços e pernas muito finos (linha); torso em feijão; mãos em linha, sem luva.
- Rim light colorido e lado sombreado quando a luz da cena pede (A à noite, D sob a lâmpada).
- Recursos de emoção: suor, vapor, rosto que muda de cor, olhos grandes de susto, piscadela.

## 8. Interpretações (não confirmadas)
1. **A fusão curta é o "corte" padrão** porque une planos gerados ou renderizados separadamente sem o pulo do corte
   seco [I].
2. **O estilo visual é escolhido pelo tema**: realismo estilizado para o mundo físico (estrada, ferrovia), toon para o
   escritório satírico, palco escuro para o tema mental/abstrato [I].
3. **Ferramenta:** indícios compatíveis com vídeo gerado por IA em A e B (texturas que "escorrem", deformações) e
   com render 3D toon em C; não é possível confirmar. Para nós, o estilo de C (3D com contorno e cor chapada) é
   o **mais viável no nosso motor** de custo zero [I].

## 9. Momentos de maior impacto [M]+[I]
| Vídeo | Tempo | O que acontece | Mecanismo |
|---|---|---|---|
| A | 0,0 / 3,3 / 15,3 / 29,5 / 43,6 / 55,2 | ação no quadro 0 / impacto parado / chuva de dinheiro / carro cai do céu / limpador e chuva / dashcam | variação de ritmo, cor e clima |
| B | 0,0 / 3,7 / 9,2 / 17,1 / 36–48 / 63–65 | perigo / vertigem / rampa / rosto roxo / trilho muda de cor / explosão | escala, velocidade, cor como informação |
| C | 0,0–2,3 / 21,4–25,6 / 28,8 / 36,5 / 49,6 | 4 planos em 2,3 s / mergulho no celular / calendário voando / janela acesa / luzes apagam | ritmo do gancho, inserto, tempo, respiro, mudança de luz |
| D | 12,4 / 23,9 / 28,7 / 36,4 | raio-X / diagrama submerso / mergulho na íris / volta ao início | explicação por dentro, metáfora, loop |
Padrão [I]: um pico de energia a cada 8–15 s e um respiro visual (plano amplo ou quase parado) logo depois.

## 10. Correções ao estudo anterior e à versão 1 desta análise
| O que estava escrito | O que a medição mostra |
|---|---|
| "~42 e ~35 planos → 1,55 e 1,8 s" (estudo de 22/11) | 17 a 21 planos por minuto; **mediana 2,4–4,0 s** |
| "Corte seco é a regra" (22/11) | **71% das transições são fusões curtas** |
| Ferrovias em 1080x1920 (22/11) | O arquivo recebido é 720x1280 |
| "Luminância média 100–120" como meta (versão 1) | Depende do estilo: 66 (palco escuro) a 131 (toon claro). **A meta passa a ser por estilo** |
| "Nenhuma etiqueta gráfica por cima da imagem" (versão 1) | D usa rótulos de diagrama e título grande. Regra: **texto no mundo é o padrão; rótulo de diagrama só para explicar mecanismo** |
| Opção A de identidade "rosto com cor de pele" como diferencial (versão 1) | A referência também usa rosto com cor de pele (C, D). **Não diferencia**; ver `IDENTIDADE_VISUAL.md` |
| "−14 LUFS" como regra da referência | 3 de 4 em −14,1; D em −15,6. Mantemos −14 |

## 11. O que ainda precisa ser verificado
1. Mais vídeos (de preferência de meses diferentes) para ver se o estilo toon de C é tendência ou caso isolado.
2. Áudio por alguém ouvindo: tipo de trilha e efeitos.
3. Fonte exata da legenda.
4. Velocidade de câmera em 3D real (com profundidade).
