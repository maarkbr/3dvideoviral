# Análise quadro a quadro: Rick's Clips 3000 (engenharia reversa da execução)

Data: 24/11/2026. Objetivo: entender **como** a imagem e o som são construídos, para criarmos a nossa execução
com identidade própria. Não copiamos personagens, cenários, roteiros, falas nem elementos exclusivos do canal.
Este documento **substitui os números** do estudo anterior (`LINGUAGEM-AUDIOVISUAL.md`, 22/11), que estavam errados.
O que mudou está na seção 8.

---

## 1. Material, método e limites (leia antes)

### 1.1 Material analisado
| Vídeo | Arquivo recebido | Resolução | fps | Quadros | Duração | Áudio |
|---|---|---|---|---|---|---|
| A: "Why Drivers Started Filming The Road" | MP4 h264 | 1080x1920 | 30 | 1.867 | 62,33 s | AAC 44,1 kHz estéreo |
| B: "Why Perfect Railroads Don't Work" | MP4 h264 | **720x1280** | 30 | 1.955 | 65,26 s | AAC 44,1 kHz estéreo |

O canal tem outros vídeos. Esta análise cobre **só esses dois**. Afirmações sobre "o canal" são padrões observados em
2 vídeos, não regras do canal. Para generalizar, precisamos de 5 a 10 vídeos a mais (ver seção 9).

### 1.2 O que foi medido em TODOS os quadros (3.822 quadros, por script)
Scripts em `analise/scripts/`; dados em `analise/dados/` (só números, sem o texto do roteiro deles).
- **Cor e luz por quadro:** luminância média e desvio (contraste), saturação média (HSV), diferença R−B (calor),
  matiz dominante, % de pixels muito escuros (<40) e muito claros (>220), nitidez (variância do Laplaciano).
- **Mudança entre quadros:** diferença média de luminância, correlação de histograma de cor e distância de cor numa
  grade 3x6, quadro a quadro (lag 1) e em janela de 6 quadros (lag 6, pega fusões).
- **Movimento global de câmera entre cada par de quadros:** pontos ORB + transformação de similaridade (RANSAC),
  que dá escala (aproximar/afastar), rotação (roll) e deslocamento X/Y.
- **Fala:** transcrição com tempo de cada palavra (faster-whisper small, inglês).
- **Áudio:** loudness integrada, LRA, pico, loudness momentânea (400 ms) e nível nas pausas entre palavras.

### 1.3 O que foi OLHADO (inspeção visual)
- Folhas de contato com **1 quadro a cada 0,5 s** (255 quadros), com o tempo gravado em cada um.
- **Todos os quadros** (12 seguidos, quadro a quadro) em volta de cada um dos 59 candidatos a corte que o script
  apontou. Cada fronteira foi confirmada ou descartada olhando.
- Recortes em resolução cheia para legenda, personagens, contorno, sombra e luz.

### 1.4 Limites (o que NÃO foi feito, para não inventar)
- **Não olhei os 3.822 quadros um por um.** Olhei 1 a cada 15 quadros, mais todos os quadros em volta das
  transições. Entre duas amostras pode haver um gesto ou um efeito de menos de 0,5 s que não vi. Os números da
  seção 1.2, ao contrário, cobrem todos os quadros.
- **Movimento de câmera é estimado em 2D.** Em travelling com paralaxe (primeiro plano andando mais rápido que o
  fundo) ou com personagem grande em quadro, a "escala" e o "deslocamento" são aproximados. Uso o perfil (acelera ou
  desacelera, rápido ou lento) com segurança; os totais em % são ordem de grandeza.
- **Áudio: não ouço.** Meço volume, pausas e nível de fundo. Não sei dizer qual trilha é, nem identificar cada efeito
  sonoro pelo nome.
- **Ferramenta de produção do Rick: desconhecida.** Ver seção 6.4 (só indícios, não confirmado).
- **O vídeo B chegou em 720p.** Os detalhes finos de textura dele são menos confiáveis que os do A.

Legenda usada abaixo: **[M]** medido por script · **[O]** observado nas imagens · **[I]** inferido (interpretação) ·
**[?]** precisa de verificação.

---

## 2. Números-chave [M]

| Medida | A (motoristas) | B (ferrovias) | Nosso vídeo 4 ("ricos") |
|---|---|---|---|
| Planos (fronteiras confirmadas olhando) | **19** | **17** | 41 eventos de corte |
| Duração média / mediana do plano | 3,27 s / **2,80 s** | 3,83 s / **2,73 s** | ~1,5 s |
| Plano mais curto / mais longo | 1,23 s / 9,13 s | 0,37 s (chicote) / 11,83 s | |
| Primeira troca de plano | **1,23 s** | **2,13 s** | 2,2 s |
| Transições: corte seco | 8 (42%) | 1 (6%) | ~todas |
| Transições: fusão curta | 8 (44%) | 12 (75%) | 9 (desfoque + clarão) |
| Transições: especiais | 2 (chuva de dinheiro, limpador de para-brisa) | 3 (chicote, poste em primeiro plano, flash de explosão) | 0 |
| Duração da fusão | **4 a 8 quadros (0,13–0,27 s)** | **4 a 6 quadros (0,13–0,20 s)** | 0,28 s |
| Planos que **desaceleram** (começam rápidos e assentam) | 12 de 19 | 11 de 17 | quase todos lineares |
| Planos que aceleram no fim (levam o movimento para o corte) | 6 de 19 | 3 de 17 | |
| Planos com câmera quase parada | 2 de 19 | 0 de 17 | |
| Aproxima (zoom/dolly in) x afasta | 11 x 5 | 12 x 5 | |
| Mudança média entre quadros (mediana d1) | 0,40 | 0,79 | **0,24** (nossa câmera mexe menos) |
| Luminância média (0–255) | 101 | 117 | **135** (mais clara, mais chapada) |
| Saturação média (0–255) | 116 | 124 | **85** (≈30% menos cor) |
| Contraste (desvio da luminância) | 58 | 51 | 65 |
| Nitidez (mediana, Laplaciano) | 2.033 | 1.558 (720p) | 1.226 (menos textura) |
| Palavras | 238 (3,84 palavras/s) | 218 (3,36 palavras/s) | 159 (2,6 palavras/s, pt-BR) |
| Fala começa / termina | 0,00 s / 61,9 s | 0,00 s / 64,9 s | 0,0 s / 61,4 s |
| Maior pausa entre palavras | **0,32 s** | **0,40 s** | |
| Frases: palavras / duração (mediana) | 16 palavras / 4,1 s | 9 palavras / 2,5 s | |
| Palavras por plano (mediana) | 10 | 8 | |
| Loudness / LRA / pico | −14,1 LUFS / 2,2 LU / −1,9 dBFS | −14,1 LUFS / 3,2 LU / −2,2 dBFS | −14,2 LUFS |
| Fundo nas pausas da fala | **6,6 dB abaixo da voz** (nunca silêncio) | **9 dB abaixo** | |
| Corte → início de palavra (mediana) | +0,03 s (9 de 12 cortes a ≤0,15 s de uma palavra) | +0,03 s (6 de 6) | |

**Leitura rápida [I]:** eles **cortam menos e mexem mais.** O plano dura cerca de 2,8 s, mas dentro dele a câmera
quase nunca para: aproxima, orbita, desce, persegue. A sensação de "muito rápido" vem do movimento contínuo, das
fusões curtíssimas e da fala sem pausa, não de cortes a cada 1,5 s. A imagem é mais escura, mais saturada e mais
detalhada que a nossa.

---

## 3. Linha do tempo: vídeo A, "Why Drivers Started Filming The Road" (62,3 s)

Movimento de câmera [M] vem de `analise/dados/drivers-planos.json`. Velocidade é medida por quarto do plano (Q1→Q4;
0 = parado, >5 = rápido). Descrição [O] vem das folhas de 0,5 s e das tiras quadro a quadro. Função de retenção [I].

| # | Tempo | Entrada | O que aparece [O] | Enquadramento / câmera [O]+[M] | Luz e cor [M]+[O] | Relação com a fala e função [I] |
|---|---|---|---|---|---|---|
| 1 | 0,00–1,23 | início | Motorista (camisa amarela) no banco, interior do carro, sol batendo, painel e celular em primeiro plano | Plano médio lateral de dentro do carro. Câmera recua e gira levemente (roll ≈7°), **acelera no fim** (Q1 2,8 → Q4 9,8) e "joga" o movimento no corte | Quente, contraluz de sol, flare | A ação (frear) já acontece no quadro 0, junto com a 1ª palavra. **Gancho sem introdução** |
| 2 | 1,23–3,30 | corte seco em movimento (borrão) | Rodovia de dia; carro vermelho vem na direção da câmera; o SUV branco bate na traseira | Câmera baixa na pista. Entra rápida e **assenta** (Q1 5,9 → Q4 0,4). Aproxima ≈12% | Céu azul saturado, asfalto claro (luma 137) | Mostra literalmente o verbo da frase. O movimento do corte anterior continua aqui (**corte em movimento**) |
| 3 | 3,30–4,80 | corte seco (aproxima no mesmo assunto) | Close do para-choque sendo amassado, faíscas e pedaços voando | Close quase **parado** (vel ≤0,3) | Vermelho x branco | **Impacto: a câmera para para o golpe pesar.** Contraste de ritmo depois de um plano em movimento |
| 4 | 4,80–6,97 | fusão 5 quadros | Visão do motorista pelo para-brisa: o outro sai do carro segurando o pescoço e mancando | POV interno, painel em primeiro plano. Aproxima ≈10% desacelerando | Dessaturado (sat 77) | Mostra a encenação do golpista pelo ponto de vista da vítima |
| 5 | 6,97–10,33 | corte seco | Dois personagens no asfalto junto ao carro: um caído "com dor", outro explicando; um carro entra pela esquerda em ≈9,5 s | Plano médio em dupla. Câmera recua e gira (afasta ≈22%), desacelerando | Dia claro | Explica a lógica do golpe. **Elemento novo entrando em quadro** renova a atenção no meio do plano |
| 6 | 10,33–12,90 | fusão 8 quadros | Gramado de subúrbio: o golpista ao lado do carro, o "seguro" chega com placa "PAID" | Câmera baixa na grama; recua e assenta | **Saturação máxima do vídeo (175)**: verde de grama + azul | Recompensa do golpe = cor mais "feliz" do vídeo |
| 7 | 12,90–15,30 | corte seco | Mesmo gramado: cama de hospital, médico, cheque gordo | Aproxima ≈23%, acelera no meio | Dia | Cada item da lista da frase vira um objeto em cena (**prova visual**) |
| 8 | 15,30–18,60 | transição "chuva de dinheiro" (≈0,8 s de notas cobrindo a tela) e fusão | Notas explodem e cobrem a imagem; sai num carro vermelho na rodovia, de lado | Lateral, travelling acompanhando o carro | Dia | **Transição temática**: o efeito é o assunto (dinheiro) e liga as duas ideias |
| 9 | 18,60–27,73 | fusão "mesmo assunto" (o carro vermelho continua no centro) | Rodovia ao entardecer, trânsito; o golpista escolhe a vítima, depois aparece o comparsa | **Plano mais longo (9,1 s)**: frontal → órbita até ficar de lado, sem corte; vel média alta no 2º quarto (4,7) | **Muda o horário de cor**: céu roxo/rosa, faróis acesos (luma 89, sat 147) | Escalada do golpe (37 palavras). Mantém o fio pelo **carro vermelho no centro** enquanto a cor muda |
| 10 | 27,73–29,47 | fusão 8 quadros | Garagem com montanha de dinheiro; personagem dançando | Recua ≈10% e assenta | Interior neutro | Resultado da escalada (fartura) |
| 11 | 29,47–32,27 | corte seco | Noite: carro esportivo verde com laço cai do céu na entrada da casa, depois bate num utilitário (fumaça) | **Aproximação forte e rápida no meio** (Q2 11,1); é o pico de energia do vídeo | **Noite** (luma 70, sat 157) | Piada visual + 2º "acidente". **Virada para a noite** marca a fase de exagero |
| 12 | 32,27–36,70 | fusão 6 quadros | Escritório da seguradora, arranha-céu na janela; a placa "dias desde o último acidente" troca de número | Aproxima ≈33% e **termina parado** (Q3–Q4 = 0): **chegada e segura** | Dia frio de escritório | Antagonista entra. **Gag de placa** com número que muda dentro do plano |
| 13 | 36,70–38,70 | corte seco | Golpista na piscina à noite, ao telefone, com boia de patinho | Aproxima ≈16% | Noite com varal de lâmpadas (bokeh quente) | Reação/deboche. Plano curto de 2 s |
| 14 | 38,70–43,63 | corte seco | Garagem à noite: policial + golpista; um 3º personagem entra com lanterna | Afasta ≈52% (revela gente nova) | Noite azul, foco de lanterna no chão | **Revelação por afastamento**: a câmera abre e mostra quem estava fora de quadro |
| 15 | 43,63–46,67 | **limpador de para-brisa** (o limpador passa e troca a cena, 6 quadros) | Manhã de chuva; perua antiga, motorista calmo | Lateral externa; aproxima ≈39% e acelera no fim | **Chuva: dessaturado, azul-acinzentado** (luma 67) | **Virada da história = virada de clima.** Transição "dentro do mundo" (diegética) |
| 16 | 46,67–50,00 | fusão 5 quadros | POV pela chuva: carro freia na frente, golpista sai segurando o pescoço | POV interno; panorâmica | Chuva | Repete a cena do começo (**eco do gancho**) |
| 17 | 50,00–55,23 | fusão 6 quadros | Interior: motorista impassível; o golpista no vidro descobre a caixinha colada no para-brisa | Parado no início (Q1–Q2 ≈0) e depois se move | Chuva | **Suspense com câmera parada**; o movimento volta na revelação |
| 18 | 55,23–60,13 | corte seco | **Visão da dashcam**: overlay "REC", data, hora e mph contando (0→54→0); rosto do golpista colado na lente; depois a estrada e o carro freando do nada | **Câmera fixa** (é a "câmera do carro"); o limpador passa duas vezes dentro do plano | Chuva, frio | **Revelação/prova.** O overlay transforma a imagem em evidência; o velocímetro contando segura o olho |
| 19 | 60,13–62,23 | fusão 4 quadros | Interior mostrando a dashcam com luz vermelha; motorista com olhar de canto, satisfeito | Aproxima ≈17% e **para na expressão** | Frio | **Fecho em reação.** A última palavra cai no plano e o vídeo termina (sem tela final) |

**Arco de cor [M]:** dia saturado (planos 1–8, sat 77–175) → **entardecer roxo** na escalada (9) → **noite** no
exagero (11, 13, 14) → **chuva dessaturada** na virada (15–17, sat 72–129) → frio na prova (18–19).

---

## 4. Linha do tempo: vídeo B, "Why Perfect Railroads Don't Work" (65,3 s)

| # | Tempo | Entrada | O que aparece [O] | Enquadramento / câmera [O]+[M] | Luz e cor [M]+[O] | Relação com a fala e função [I] |
|---|---|---|---|---|---|---|
| 1 | 0,00–2,13 | início | Operário (boina listrada) serrando o trilho, faíscas; locomotiva com farol aceso vindo ao fundo | Close baixo com o trilho em diagonal até o trem (**linha de fuga até a ameaça**); aproxima ≈39%, rápido no início e no fim | Paredão vermelho/laranja (calor +32) | Ação no quadro 0 + **perigo no fundo** (o trem) = tensão imediata |
| 2 | 2,13–3,73 | fusão 4 quadros | Operário de pé, depois a ferrovia ao longo do paredão do cânion | Recua e sobe revelando a linha (afasta ≈27%) | Laranja + céu azul (complementares) | Revela o lugar e a escala. O número da frase aparece **escrito a giz no dormente** |
| 3 | 3,73–9,17 | corte seco em movimento (o trem passa e a câmera "cai" no cânion) | Cânion azul profundo, duas pontes em obra, operários minúsculos numa viga; a câmera desce até o "sem fundo" e sobe | **Grua/drone de 5,4 s**: desce, inclina, sobe (vel alta no começo e no fim) | **Azul profundo** (calor −78): contraste com o laranja anterior | Mostra a corrida das duas empresas e a escala absurda. **Vertigem como gancho visual** |
| 4 | 9,17–11,67 | fusão 4 quadros | Voo rasante sobre o deserto até uma estação; faixa "FIRST LINE IN GETS IT ALL!"; ricaço sobre monte dourado | **Rampa de velocidade**: lento → muito rápido (Q2 28,8, o maior do vídeo) → freia na faixa | Desfoque de movimento forte | "Quem terminar primeiro leva tudo" vira **viagem até o prêmio** |
| 5 | 11,67–13,53 | fusão 6 quadros | Operários rindo sentados numa viga sobre o cânion + o herói | Quase parado (vel ≤1,8) | Cânion em listras quentes | **Coro de deboche** (plateia) |
| 6 | 13,53–21,40 | fusão 5 quadros | Chefe de chapéu-coco nos trilhos; close no vão do trilho; o rosto do chefe fica roxo e solta vapor (≈17,1 s) | Plano longo (7,9 s) com várias posições: frontal → rente ao chão no vão → close do chefe | **Efeito de cor no personagem** (rosto roxo) | Conflito. A emoção vira **cor e partícula** (vapor) |
| 7 | 21,40–21,77 | chicote (5 quadros de borrão) | Giro rápido de câmera | Chicote de 0,37 s | Borrão | **Mudança de lugar com energia** ("a outra empresa") |
| 8 | 21,77–26,33 | fusão 6 quadros | Obra da empresa rival: guindaste, ricaço de cartola, soldagem com faíscas | Câmera rente aos trilhos; avança | Céu limpo | Apresenta o rival. **Faíscas na palavra-chave** |
| 9 | 26,33–28,50 | poste em primeiro plano passa e troca a cena | Vagão de luxo; o ricaço toma chá na janela | Empurra para dentro da janela (aproxima ≈156%, rápido e assenta) | Interior vermelho quente (sat 172) | "Trem desliza sem barulho" = **luxo e calma** com câmera que assenta |
| 10 | 28,50–31,23 | fusão 5 quadros | Trem passando na ponte → empurra até a janela do herói: o chefe chacoalha, café derrama | **Aproximação muito rápida** (Q1 34,7) e para | Madeira escura (luma 71) | Contraste: o trem "deles" sacode. **Comparação pela mesma composição** (janela de vagão) |
| 11 | 31,23–36,10 | fusão 5 quadros | Estação: jornal com manchete, multidão troca de lado; placa "ALL ABOARD!" | Recua ≈47% para mostrar a multidão | Estação clara | Virada social (todos trocam). **Texto dentro da cena** (jornal, placa) |
| 12 | 36,10–47,93 | fusão 6 quadros | Calendário "MAY 1880" + termômetro → câmera desce ao trilho → macro do vão com paquímetro; o trilho muda de cor (rosa → laranja → amarelo); moeda, depois papel no vão; o chefe e o herói em dupla | **Plano mais longo (11,8 s)**, contínuo, com 5 ou 6 enquadramentos encadeados por movimento | Laranja dominante (calor +93, o maior do vídeo) | **Grandeza invisível (calor) vira cor**; objetos de escala (moeda, papel) provam a mudança |
| 13 | 47,93–54,47 | fusão 6 quadros | Ferrovia "perfeita" do rival, rente ao chão; os trilhos brilham rosa/laranja, faíscas; avança até o ricaço no guarda-sol, que se assusta (cartola voa) | Travelling para a frente, acelerando no fim (Q4 8,1) | Fim de tarde | **Escalada para o desastre**: o movimento acelera rumo à reação |
| 14 | 54,47–59,40 | fusão 5 quadros | Herói sorrindo no calor (vapor), o vão fecha com brilho | Close → recua; o herói passa pela frente da câmera | Quente, luminoso (luma 143) | **Justiça**: o herói estava certo |
| 15 | 59,40–62,97 | fusão 6 quadros | Ponte ao pôr do sol; o trem vem; os trilhos entortam em "S" | Aéreo amplo → frontal | **Hora dourada rosada** | Clímax anunciado |
| 16 | 62,97–64,23 | fusão "estourada" (clareia) | O trem descarrila e cai da ponte | Amplo | Luma 171 (o mais claro) | Desastre |
| 17 | 64,23–65,17 | flash de explosão (branco → fogo) | Explosão; o herói em primeiro plano, de boca aberta | Reação em primeiro plano com a explosão ao fundo | Fogo laranja | **Fecho em reação de menos de 1 s.** Corta no auge (convite ao replay) |

**Arco de cor [M]:** laranja/azul complementares (1–5) → efeitos de cor no clímax de emoção (6, rosto roxo) →
interiores quentes (9–10) → laranja máximo no "calor" (12) → **hora dourada/rosada** no desfecho (15–16) → explosão.

---

## 5. Elementos transversais (observados nos dois vídeos)

### 5.1 Composição [O]
- **Linhas de fuga centrais:** trilho, estrada, pista, corredor de vagão. Quase sempre convergem para o centro ou o
  terço superior; o assunto fica no fim da linha (o trem, o carro).
- **Câmera baixa** (altura do joelho ou do chão) em mais da metade dos planos de exterior, com o primeiro plano
  ocupando o terço inferior (cascalho, asfalto, grama). Dá escala e profundidade.
- **Personagem no terço médio/superior**; o rosto nunca fica na faixa da legenda (≈70% da altura).
- **Primeiro plano com objeto real** (painel, para-choque, dormente, poste) em ~40% dos planos [O, contagem
  aproximada nas folhas]. Cria camadas de profundidade.
- **Duplas lado a lado** para diálogo (operário + chefe, golpista + comparsa), com alturas diferentes.

### 5.2 Luz [O]
- **Sol baixo e quente com sombras longas e suaves** nos exteriores de dia; céu azul saturado com nuvens grandes.
- **Noite com fontes práticas:** varal de lâmpadas (bokeh), luminária de porta, lanterna (círculo de luz no chão),
  faróis acesos.
- **Rim light (luz de recorte) colorido nos personagens 2D:** à noite, as bordas do personagem recebem a cor da
  luz ambiente (laranja da luminária no chapéu do policial). É o que faz o desenho 2D "estar" no 3D [O em recorte
  de resolução cheia].
- **Sombra de contato** dos personagens no chão em todos os exteriores [O].
- Bloom em luzes, faróis e reflexos; flare de sol em contraluz (plano 1 do vídeo A).

### 5.3 Personagens 2D no 3D [O]+[I]
- Recorte 2D chapado com contorno preto grosso; **sombreamento simples de um lado** (o lado oposto à luz fica mais
  escuro); rim light colorido; sombra de contato.
- **Escala e perspectiva corretas**: diminuem com a distância; ficam atrás de objetos 3D quando necessário (oclusão).
- **Atuação de pose em pose**: troca de expressão a cada plano; gesto único e legível (segurar o pescoço, apontar,
  braços cruzados, tomar chá, cair). Poucos quadros intermediários [I].
- **Entram e saem de quadro** durante o plano (A5, A14, B14): renovam a atenção sem cortar.
- Emoção com efeito: gota de suor, vapor de raiva, rosto roxo, olhos esbugalhados, brilho nos óculos.

### 5.4 Efeitos visuais e grafismos [O]
Partículas de dinheiro (chuva e montanha), faíscas de metal, fumaça, vapor, chuva com gotas e limpador, explosão,
calor (trilho que muda de cor, ar tremulando). Texto **dentro da cena** (manchete, faixa, placa, calendário,
placa "dias desde", overlay de dashcam com velocímetro). **Nenhuma etiqueta gráfica por cima da imagem**, além da
legenda. Toda informação escrita fica em objetos do mundo.

### 5.5 Legenda [O]+[M]
- 1 a 3 palavras por vez, branca, fonte sem serifa muito grossa e arredondada, contorno preto fino (~4–6 px a
  1080p), leve sombra. Sem cor de destaque.
- Centro a **≈70% da altura**; altura de caixa-alta ≈60–65 px a 1920 (≈3,3% da altura do quadro) [M em recorte].
- Troca no ritmo da palavra falada (alinhada à transcrição).

### 5.6 Som [M]+[I]
- Voz sempre presente do quadro 0 ao fim, sem pausa maior que 0,4 s.
- Fundo contínuo (trilha e/ou ambiência) 7 a 9 dB abaixo da voz; nunca silêncio.
- Volume final −14 LUFS, LRA 2–3 LU (bem comprimido) e pico perto de −2 dBFS.
- Efeitos diegéticos sincronizados à ação [I: não identificados pelo nome; ver 1.4].

---

## 6. Interpretações (não confirmadas)

1. **A montagem usa a fusão como "corte suave" padrão [I a partir de M].** Com 4 a 8 quadros ela quase não é
   percebida como efeito, mas tira o "pulo" entre planos gerados separadamente.
2. **Planos que começam rápidos e assentam (65% dos planos)** [M] criam um ritmo de "chegar e mostrar": a energia
   fica na entrada e o fim do plano fica legível para a próxima palavra.
3. **Planos longos (9–12 s) só aparecem quando há movimento contínuo e vários enquadramentos encadeados** [O]. Nunca
   há plano longo parado.
4. **Ferramenta:** os cenários têm aparência de render 3D estilizado (luz física, desfoque de movimento, profundidade
   de campo), e há **indícios compatíveis com vídeo gerado por IA**: texturas que "escorrem" em movimento rápido
   (B3–B4), deformações e trilhos que se transformam [O]. **Não é possível confirmar.** Para nós isso não muda nada:
   produzimos em 3D próprio, de custo zero.

---

## 7. Momentos de maior impacto e retenção [M]+[I]
| Vídeo | Tempo | O que acontece | Mecanismo |
|---|---|---|---|
| A | 0,0 | Ação no quadro 0 com a 1ª palavra | Sem introdução |
| A | 3,3 | Close parado do impacto depois de plano em movimento | Contraste de ritmo |
| A | 15,3 | Chuva de dinheiro cobrindo a tela | Transição temática, pico de saturação |
| A | 29,5–32 | Carro cai do céu, aproximação mais rápida do vídeo | Pico de energia no meio (anti-queda de retenção) |
| A | 43,6 | Limpador troca para a chuva | Virada de clima = virada de história |
| A | 55,2 | Overlay de dashcam com velocímetro contando | Revelação com "prova" e número que se mexe |
| B | 0,0 | Faíscas + trem vindo ao fundo | Perigo no quadro 0 |
| B | 3,7–9,2 | Queda no cânion azul | Vertigem/escala |
| B | 9,2–11,7 | Voo em rampa de velocidade | Velocidade máxima do vídeo |
| B | 17,1 | Rosto fica roxo com vapor | Emoção como efeito |
| B | 36–48 | Trilho muda de cor | Grandeza invisível visível |
| B | 62,9–65,2 | Descarrilamento e explosão | Clímax + corte no auge |

Padrão [I]: **um pico de energia a cada 10–15 s** (efeito, mudança de clima ou de velocidade), e **o fim cai na
reação**, sem tela de despedida.

---

## 8. Correções ao estudo anterior (`LINGUAGEM-AUDIOVISUAL.md`, 22/11)
| O que estava escrito | O que a medição mostra | Consequência |
|---|---|---|
| "~42 planos → 1,55 s" e "~35 planos → 1,8 s" | **17 e 19 planos; mediana ≈2,8 s** | O ritmo vem do movimento dentro do plano, não do corte. A regra "trocar de ângulo a cada 1,5–2,5 s" continua útil **como troca de enquadramento**, mas pode ser feita por movimento de câmera, sem corte |
| "Corte seco é a regra" | Fusões curtas são maioria: 44% no A e 75% no B | Adotar a fusão de 4–8 quadros como transição padrão |
| Ferrovias em 1080x1920 | O arquivo recebido é **720x1280** | Só registro |
| "Planos por frase: 2 a 4" | Mediana de 8–10 palavras por plano (≈1 frase curta por plano), com 2 a 6 **enquadramentos** por plano | Adaptação nº 2 do `ROTEIRO-PADRAO.md` foi baseada no número errado; **decisão sua** (ver resumo final) |

O restante do estudo anterior (roteiro de cor, câmera baixa, legenda a 70%, −14 LUFS, colchão contínuo, fim em
reação) foi **confirmado**.

---

## 9. O que ainda precisa ser verificado
1. **Mais vídeos do canal** (5 a 10 MP4 em 1080p) para separar o padrão do canal de decisões de cada vídeo.
   Não baixo vídeos do YouTube por aqui: preciso que você mande os arquivos.
2. **Áudio:** que tipo de trilha e quais efeitos. Precisa de alguém ouvindo, ou dos stems.
3. Fonte exata da legenda (parece uma sans arredondada muito grossa; não identificada).
4. Medição de velocidade de câmera em 3D real (com profundidade), que a estimativa 2D não dá.
