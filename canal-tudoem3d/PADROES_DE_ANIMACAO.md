# Padrões de animação: câmera, transições, personagens e efeitos

Base: medições de `ANALISE_FRAME_A_FRAME.md` (dois vídeos de referência, todos os quadros). Cada padrão tem um ID
para virar asset na biblioteca (`BIBLIOTECA_DE_ASSETS.md`). Valores em segundos a 30 fps. "Velocidade" é a escala
usada na análise (0 = parado, 1 = deriva lenta, 5 = rápido, >15 = chicote).

## 1. Princípios medidos
1. **A câmera quase nunca para** (só 2 de 36 planos ficaram quase parados), mas **para quando o golpe precisa pesar**
   (close de impacto, revelação com prova).
2. **65% dos planos começam rápidos e assentam** (ease-out forte); 25% aceleram no fim e "entregam" o movimento ao
   próximo plano. Movimento linear do começo ao fim quase não aparece.
3. **Aproximar é 2x mais comum que afastar** (23 x 10). Afastar é usado para **revelar** algo que estava fora de quadro.
4. Os planos longos (5–12 s) são **um único movimento contínuo** que passa por vários enquadramentos.
5. **A fusão de 4–8 quadros é a transição padrão**; o corte seco fica para impacto e mudança brusca.

## 2. Movimentos de câmera (presets)

| ID | Nome | Quando usar | Duração típica | Curva | Intensidade | Como termina | Efeito na percepção |
|---|---|---|---|---|---|---|---|
| CAM-01 | **Chega e assenta** | Padrão para abrir qualquer plano | 1,5–3 s | ease-out forte (expo.out / power3.out): 70% do caminho no 1º terço | aproxima 8–25% ou translada 10–30% do quadro | velocidade ≈0 nos últimos 25% | Energia na entrada, imagem legível no fim |
| CAM-02 | **Empurra e segura** | Fala de personagem, revelação, placa com número | 2–4,5 s | power2.out até parar em 60–75% do plano | aproxima 15–35% | parado (hold) no rosto ou objeto | Foco total; "olha isto" |
| CAM-03 | **Acelera para o corte** | Último plano de uma ideia que leva para outra | 1–2 s | ease-in (power2.in) | 10–20%, às vezes com roll de 3–8° | corta no pico de velocidade | Continuidade de energia entre planos (corte em movimento) |
| CAM-04 | **Impacto parado** | Logo depois de um plano rápido, no golpe (batida, explosão, gag) | 1–1,5 s | parado (só tremida de impacto 0,3–0,5 s) | 0 | corte seco | Contraste de ritmo: o golpe pesa |
| CAM-05 | **Órbita/acompanhamento** | Veículo ou personagem andando; frases longas | 4–9 s | velocidade quase constante com ease nas pontas | 30–90° em volta do assunto | assenta de lado ou de frente | Mantém o assunto no centro enquanto o fundo muda |
| CAM-06 | **Grua de revelação** | Mostrar escala (cânion, cidade, multidão) | 3–5,5 s | ease-in-out; pode descer e subir | 5–20 m de altura | assenta no plano geral | Vertigem/escala |
| CAM-07 | **Afasta e revela** | Quem estava fora de quadro, multidão, "olha o tamanho disso" | 2–5 s | ease-out | afasta 25–55% | assenta aberto | Surpresa por inclusão |
| CAM-08 | **Rampa de velocidade (voo)** | Viagem até o prêmio/destino | 2–2,5 s | lento → muito rápido → freia (curva em S com pico no meio) | grande (atravessa o cenário) | freia no destino | Euforia, "chegamos" |
| CAM-09 | **POV/câmera fixa de dispositivo** | Dashcam, câmera de segurança, celular | 3–5 s | parada (a câmera "é" o aparelho) | 0 | corte | Prova/documento |
| CAM-10 | **Rente ao chão em perspectiva** | Trilho, estrada, linha de fuga até o assunto | 2–5 s | avança devagar (power1) | 5–15% | assenta | Profundidade e direção do olhar |
| CAM-11 | **Tremida de impacto** | Batida, explosão, número grande | 0,3–0,5 s | decai linear | 0,02–0,35 m (mais forte em plano aberto) | some | Peso físico |
| CAM-12 | **Deriva viva** | Por baixo de todo plano "parado" | contínua | senoide lenta | ≤0,012 m | — | Imagem nunca congela |

Já existem no motor: CAM-11 e CAM-12 (`cena.cam.quadro` nos vídeos 3 e 4). As chaves de câmera atuais (`K`/`C`) usam
uma curva ease-in-out simétrica (`eio`); para CAM-01/02/03 a interpolação precisa aceitar **curva por trecho**
(expo.out, power2.out, power2.in). Isso fica registrado como asset a construir (`CAM-CORE-EASE`).

## 3. Transições (presets)

| ID | Nome | Duração | Quando usar | Observado em |
|---|---|---|---|---|
| TRN-01 | **Fusão curta** (crossfade) | 4–8 quadros (0,13–0,27 s) | Padrão entre planos da mesma ideia ou lugar diferente | A: 8x · B: 12x |
| TRN-02 | **Corte seco** | 0 | Impacto, mudança brusca, "punch-in" no mesmo assunto | A: 8x · B: 1x |
| TRN-03 | **Corte em movimento** | 0, com desfoque de movimento nos 2–4 quadros de cada lado | Plano que acelera (CAM-03) e o próximo entra rápido (CAM-01) | A1→A2, B2→B3 |
| TRN-04 | **Chicote** | 5 quadros (0,17 s) de borrão + fusão | Trocar de lugar com energia | B6→B7 |
| TRN-05 | **Transição temática** (partículas do assunto cobrem a tela) | 0,6–0,8 s | Quando o assunto tem um "material" (dinheiro, gelo, fogo, papel) | A8 (notas) |
| TRN-06 | **Limpeza diegética** | 4–6 quadros | Um objeto do mundo passa e troca a cena (limpador, poste, porta, carro) | A15 (limpador), B9 (poste) |
| TRN-07 | **Fusão estourada** | 6 quadros, clareando até quase branco | Antes de clímax ou de cena muito clara | B16 |
| TRN-08 | **Flash de explosão** | 3–4 quadros brancos → fogo | Desastre/fecho | B17 |
| TRN-09 | **Fusão "mesmo assunto"** | 5 quadros | O assunto continua no mesmo lugar da tela e o mundo muda (hora, clima) | A9 (carro vermelho, dia → entardecer) |

Hoje o nosso padrão é desfoque de 14 px + clarão de 0,28 s **em toda troca de lugar**. Vira TRN-10 ("desfoque e
clarão", assinatura nossa) e passa a ser usado **só em mudança de lugar**; dentro do mesmo lugar, TRN-01.

## 4. Personagens 2D no 3D

| ID | Padrão | Regra prática |
|---|---|---|
| CHR-01 | **Sombra de contato** | Elipse escura sob os pés em todo plano com chão visível (já existe: `cena.sombra`) |
| CHR-02 | **Rim light colorido** | Borda de 6–10 px na cor da luz principal do plano, do lado da luz (laranja em luz de lâmpada, azul na noite) |
| CHR-03 | **Lado sombreado** | Metade oposta à luz até 15–25% mais escura (já existe parcialmente: `sombraLado`) |
| CHR-04 | **Grade de cor do plano** | O personagem recebe a mesma temperatura e brilho do cenário (já existe: `filtro` + `luz2d`; ampliar para cor) |
| CHR-05 | **Pose a pose** | Uma pose clara por plano; troca na palavra; entre poses, 3–5 quadros de transição com overshoot leve |
| CHR-06 | **Expressão nova a cada plano** | Nunca o mesmo rosto em dois planos seguidos |
| CHR-07 | **Entrar/sair de quadro no meio do plano** | Para renovar a atenção sem cortar (≥1 vez a cada 15 s) |
| CHR-08 | **Oclusão** | O personagem passa atrás de objetos 3D quando a cena pede (hoje o 2D fica sempre por cima: limitação conhecida) |
| CHR-09 | **Escala por distância** | Já existe (projeção do motor) |
| CHR-10 | **Emoção como efeito** | Suor (gota), raiva (vapor + rosto que muda de cor), choque (olhos grandes + tremida), alegria (brilhos) |

## 5. Efeitos visuais (VFX)

| ID | Efeito | Duração | Gatilho | Observação |
|---|---|---|---|---|
| VFX-01 | Faíscas de metal | 0,4–1 s | palavra de ação (serrar, soldar, bater) | partículas amarelas com bloom |
| VFX-02 | Chuva de dinheiro (partículas) | 0,6–1,5 s | ganho, prêmio | pode virar TRN-05 |
| VFX-03 | Montanha de dinheiro/moedas | estática | riqueza | já temos moedas instanciadas (vídeo 3) |
| VFX-04 | Fumaça/vapor | contínuo | batida, motor, raiva | sprites com crescimento e dissipação |
| VFX-05 | Chuva + gotas no vidro + limpador | contínuo | virada triste/fria | o limpador vira TRN-06 |
| VFX-06 | Explosão (flash → bola de fogo) | 1–1,5 s | desastre | |
| VFX-07 | Calor visível (cor que muda + ar tremulando) | 2–6 s | temperatura, pressão, tempo | trilho rosa → laranja → amarelo |
| VFX-08 | Overlay de dispositivo (REC, data, velocidade) | plano inteiro | prova/documento | número que conta |
| VFX-09 | Placa com número que muda | 0,2 s por troca | gag/contagem | ex.: "dias desde…" |
| VFX-10 | Gelo/congelar | 0,9 s | congelamento | já existe (vídeo 3) |

## 6. Gráficos e legenda
- Na referência, **todo texto informativo está dentro do mundo** (jornal, faixa, placa, calendário, overlay).
  A nossa **etiqueta amarela de número** é assinatura do canal e continua; mas o manual passa a pedir **pelo menos
  1 texto dentro do mundo por vídeo** (placa, tela, jornal), além das etiquetas.
- Legenda: ver `IDENTIDADE_VISUAL.md` (a nossa especificação, diferente da referência).

## 7. Tempos de reação
- Fala → imagem: a troca de plano cai a **±0,15 s do início de uma palavra** (75% dos cortes do A, 100% do B).
- Objeto ou efeito ligado a uma palavra entra **na palavra** (o nosso `Objetos.naPalavra` já faz isso).
- Reação final: **0,9–2,1 s** depois da última palavra, e acabou.
