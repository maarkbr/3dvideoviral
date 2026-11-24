# Manual audiovisual do Tudo em 3D (como produzir com qualidade e consistência)

Regras de execução para todo vídeo do canal, derivadas da análise medida de quatro vídeos (`ANALISE_FRAME_A_FRAME.md`, versão 2) e adaptadas ao
nosso motor de custo zero (Three.js + personagens 2D + GSAP + Playwright + FFmpeg). Movimentos e transições têm IDs
em `PADROES_DE_ANIMACAO.md`; assets em `BIBLIOTECA_DE_ASSETS.md`; identidade em `IDENTIDADE_VISUAL.md`. O roteiro
segue `ROTEIRO-PADRAO.md` (documento do Rick's Clips Master Prompt v3).

## 1. Metas medíveis (conferir em todo vídeo antes de publicar)
Medidas com `analise/scripts/quadros.py` e `cortes2.py` (as mesmas da análise).

| Medida | Meta | Referência | Nosso vídeo 4 |
|---|---|---|---|
| Duração | 60–70 s | 62–65 s | 63,4 s |
| Fala do quadro 0 até o fim, maior pausa | ≤0,4 s | 0,32–0,40 s | ok |
| Mediana do plano (entre transições) | 2,4–4,0 s | 2,4–4,0 s (4 vídeos) | ~1,5 s (cortamos demais) |
| Enquadramentos por plano | 1 a 6 (por movimento) | | |
| Mudança média entre quadros (mediana d1) | ≥0,35 | 0,40–0,79 | 0,24 |
| Planos quase parados | ≤10% (e só para impacto ou prova) | 0–10% | |
| Planos com ease-out (chegam e assentam) | ≥50% | 52–65% | |
| Fusões curtas (4–8 quadros) | ≥60% das transições | 44–88% (71% no total) | 0% |
| Luminância média (0–255) | **depende do estilo**: realista 100–120; toon claro 120–135; palco escuro 55–70 | 66–131 | 135 |
| Saturação média (0–255) | ≥110 (em qualquer estilo) | 112–127 | 85 |
| Saturação no plano mais saturado | ≥170 | 172–195 | |
| Mudança de luz ou de "horário de cor" | ≥2 por vídeo (pode ser dentro do plano, VFX-14) | 3–4 em A, B, C | 2 |
| Pico de energia (efeito, clima, velocidade) | 1 a cada 10–15 s | | |
| Loudness / LRA / pico | −14 LUFS / 2–4 LU / ≤ −1,5 dBTP | igual | ok |
| Fundo sob a voz | 7–9 dB abaixo, nunca silêncio | igual | ok (trilha −21) |
| Plano longo contínuo (vários enquadramentos) | ≥1 de 8–13 s | 1 a 2 por vídeo | 0 |
| Fim | reação de 0,9–2,1 s após a última palavra, de preferência ecoando a 1ª imagem (loop); cartão "Segue" ≤1,5 s | sem cartão | ok |

## 2. Gramática de cada frase
1. **Uma frase (ou meia frase longa) = um plano** de 2–4 s, com fusão curta para o próximo.
2. Dentro do plano, a câmera passa por **1 a 3 enquadramentos** por movimento contínuo, nesta ordem quando couber:
   **estabelecer → reação → detalhe-prova**.
3. O plano **começa com CAM-01 (chega e assenta)**, salvo:
   - impacto → CAM-04 (parado + tremida) depois de corte seco;
   - fala de personagem ou revelação → CAM-02 (empurra e segura);
   - fim de ideia que leva a outra → CAM-03 (acelera para o corte) + TRN-03.
4. **Objeto ou efeito entra na palavra** que o nomeia (±0,1 s).
5. A cada 15 s, pelo menos **um personagem entra ou sai de quadro** no meio do plano (CHR-07).

## 3. Estrutura do vídeo (60–65 s)
| Trecho | Tempo | Imagem | Câmera e montagem |
|---|---|---|---|
| Gancho | 0–3 s | ação no quadro 0 + objeto absurdo ou perigo visível | 1ª troca até 1,2–2,2 s; pode ter 3–4 cortes-relâmpago (TRN-13); CAM-03 → TRN-03 |
| Preparo | 3–15 s | lugar e regras do mundo | CAM-01/CAM-06; fusões |
| Escalada | 15–40 s | cada passo maior que o anterior; pico de energia no meio (≈30 s) | órbitas (CAM-05), rampa (CAM-08), TRN-05 |
| Virada | 40–50 s | **muda o clima** (noite/chuva/frio) | TRN-06 ou fusão; menos saturação |
| Revelação | 50–58 s | prova (objeto, overlay, número) | CAM-02 ou CAM-09 parado; o número se mexe |
| Fecho | 58–62 s | reação de personagem | CAM-02 termina parado; corta no auge |
| Cartão | +1,5 s | "Segue o @_tudoem3d" | TRN-10 |

## 4. Composição
- Vertical 1080x1920. Zonas: **topo (0–14%)** = etiquetas; **terço médio** = rostos e ação; **70%** = legenda;
  **79%** = marca d'água. Nenhum rosto entre 64% e 82% da altura.
- **Linha de fuga central** (estrada, trilho, corredor, fileira de prédios) em pelo menos 1 de cada 3 planos.
- **Câmera baixa** (0,3–0,8 m) em metade dos exteriores; primeiro plano real (objeto, chão texturizado) no terço de baixo.
- Duplas com alturas diferentes; o protagonista do lado da luz.

## 5. Luz e cor
- **Escolha um estilo por vídeo** (ver `IDENTIDADE_VISUAL.md` §5): realista estilizado (mundo físico), toon com
  contorno (sátira, escritório, cotidiano) ou palco escuro de luz única (mente, ciência, mistério).
- **Roteiro de cor obrigatório** por trecho (ver `IDENTIDADE_VISUAL.md` §3): dia saturado → entardecer quente →
  noite com luzes práticas → frio/chuva na virada → dourado no fecho.
- Dia: sol baixo (elevação 20–35°), sombra longa e suave, céu saturado; exposição para luminância média 100–120.
- Noite: 2–4 luzes práticas visíveis (lâmpadas, postes, faróis) com bloom; luz de recorte colorida nos personagens.
- Grade final (`grade` no pós do motor): saturação ×1,25–1,35 (hoje ×1,16), contraste ×1,06, vinheta leve.
- Mecanismo invisível (corpo, sono, dinheiro, juros): explicar por **diagrama dentro do mundo** (VFX-11, VFX-16).

## 6. Personagens
CHR-01 a CHR-10 de `PADROES_DE_ANIMACAO.md`. Prioridade de construção: rim light colorido (CHR-02), grade de cor no
2D (CHR-04) e oclusão simples (CHR-08).

## 7. Texto na tela
- Etiqueta amarela de número (assinatura): no máximo 2 visíveis ao mesmo tempo; entra na palavra; sai antes da troca de
  ideia.
- **Pelo menos 1 texto dentro do mundo por vídeo** (placa, tela, jornal, calendário, overlay de aparelho).
- Aviso "DRAMATIZAÇÃO COM FATOS REAIS" no 1º segundo, quando houver personagens inventados.

## 8. Som
- Voz ElevenLabs (v3/v4) ou a voz do dono; o roteiro elimina pausas maiores que 0,4 s.
- Colchão contínuo 7–9 dB abaixo da voz (trilha própria em código, ou trilha pelo app).
- SFX do SFX Kit (CC0) em toda ação, toda troca de plano (whoosh/swipe leve) e todo número (pop).
- Master −14 LUFS, LRA 2–4 LU, pico ≤ −1,5 dBTP (`som.mjs`).

## 9. Checklist antes do render
1. Folha de contato a cada 1 s (`quadros2.js`): nenhum quadro vazio, nenhum rosto cortado, nenhuma etiqueta saindo da
   tela, nenhum objeto 3D tapando o assunto.
2. Metas da seção 1 conferidas numa prévia em baixa resolução.
3. Fatos: valores e fontes batem com a ficha do roteiro.
4. Fim: a última imagem conversa com a primeira (loop).
