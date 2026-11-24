# Biblioteca de assets do Tudo em 3D (arquitetura e inventário)

**Status: arquitetura proposta. Nenhum asset novo foi criado ainda.** Os assets existentes hoje estão espalhados nos
projetos de cada vídeo; esta biblioteca junta, nomeia e documenta, para que um vídeo novo seja **montado** e não
reconstruído. Tudo é original nosso ou CC0 (Kenney, SFX Kit).

## 1. Estrutura de pastas
```
canal-tudoem3d/biblioteca/
  personagens/     PER-  visuais SVG (personagens-extra.js) + poses + folha de expressões
  cenarios/        CEN-  palcos Three.js (uma função por palco: cria(g, P) → handles animáveis)
  objetos/         OBJ-  objetos 2D (objetos-extra.js) e 3D (cofre, máquina, pilha de dinheiro…)
  materiais/       MAT-  materiais Three.js e texturas de canvas (mármore, asfalto, vidro, ouro, gelo)
  paletas/         PAL-  paletas e "horários de cor" (céu, sol, hemisfério, névoa, exposição)
  luz/             LUZ-  rigs de luz por clima (dia, entardecer, noite prática, chuva, estúdio)
  cameras/         CAM-  movimentos com curva (chega e assenta, empurra e segura…)
  animacoes/       ANI-  animações de objeto e personagem (entrar na palavra, cair, tremer…)
  vfx/             VFX-  partículas e efeitos (faíscas, dinheiro, fumaça, chuva, calor, explosão)
  transicoes/      TRN-  fusão curta, desfoque+clarão, chicote, limpeza diegética, temática
  graficos/        GRA-  etiqueta, carimbo, overlays (dashcam, REC), cartão final, marca d'água
  edicao/          EDI-  presets de som (deixas), master −14 LUFS, render, conferência (métricas)
  _modelos/              modelo de ficha de asset + modelo de projeto de vídeo
```
Cada pasta tem um `README.md` com o catálogo daquela categoria.

## 2. Identificação e ficha de cada asset
**ID:** `CATEGORIA-NN-nome-curto` (ex.: `CAM-01-chega-e-assenta`, `CEN-07-cobertura`). O ID nunca muda; versões
ficam em `versao`.

Ficha (no README da categoria e no cabeçalho do arquivo):
```
ID / nome:
Tipo e arquivo:            (ex.: função JS em biblioteca/cenarios/cobertura.js)
Finalidade:                (que tipo de frase ou momento ele atende)
Características visuais:   (cores, escala em metros, luz esperada)
Parâmetros:                (o que pode mudar: cor, texto, tamanho, duração, curva)
Handles animáveis:         (o que o vídeo anima: porta.dob.rotation.y, painel.set(txt)…)
Como usar:                 (3–6 linhas de código de exemplo)
Dependências:              (peças Kenney, texturas, outros assets)
Origem e licença:          (original nosso / Kenney CC0 / SFX Kit CC0)
Usado em:                  (vídeos)
Versão / data:
```

## 3. Inventário: o que já existe (a migrar para a biblioteca)

### Personagens (PER) [existentes]
| ID proposto | Visual no código | Papel | Vídeos |
|---|---|---|---|
| PER-01-mascote | `mascote` | narrador visual do canal | todos (cartão final) |
| PER-02-engenheiro | `engenheiro` | herói técnico (moletom verde-água, fone) | 3 |
| PER-03-chefe / PER-03b-chefe-ceo | `chefe`, `chefeCeo` | vilão (gola roxa, óculos) / disfarce | 3 |
| PER-04-comparsa | `comparsa` | coadjuvante cômico (boné vermelho) | 3 |
| PER-05-magnata | `otavio` | rico (terno creme, bigode grisalho) | 4 |
| PER-06-porteiro | `juninho` | trabalhador (uniforme azul, quepe) | 4 |
| PER-07-banqueiro | `banqueiro` | banqueiro clássico | 2, 4 |
| PER-08-policial | `policial` | polícia | 1, 2 |
| PER-09-figurantes | `cliente1`–`cliente3` | figurantes por cor | 1, 2 |
| PER-10..12 | `narrador` (aposentado), `capone`, `vorcaro` | uso restrito | 1, 2 |
Poses [existentes]: parado, acenando, apontando, pensando, assustado, comemorando, correndo, segredo, desconfiado,
negando, rindo, convencido, sorriso. **Faltam:** bravo (rosto muda de cor + vapor), envergonhado, caído, chorando,
falando ao telefone, segurando objeto, apontando para a câmera.

### Cenários (CEN) [existentes, hoje presos em cada vídeo]
| ID proposto | Origem | Palco |
|---|---|---|
| CEN-01-cidade-dia | `cidade3d.js` (vídeo 1) | rua com prédios |
| CEN-02-torre-banco … CEN-06-aeroporto-noite | `master3d.js` (vídeo 2) | torre, cofre do FGC, BRB, Banco Central, aeroporto |
| CEN-07-apartamento-noite … CEN-12-estudio | `binance3d.js` (vídeo 3) | apartamento, cidade ao entardecer, esconderijo, labirinto digital, cofre com canos, estúdio |
| CEN-13-cobertura … CEN-18-estudio-graficos | `ricos3d.js` (vídeo 4) | cobertura, portaria, bolsa, marina, banco, estúdio com gráfico e mapa do Brasil |

### Objetos (OBJ) [existentes]
2D: etiqueta, carimbo, jornal, grade, casa, carro, prédio, nota, maço, brilho, celular, contrato, fiado, presente, sos,
pizza, gelo, e-mail, luz vermelha, holerite, certificado, café, relógio, geladeira, cama, porta, exclamação.
3D: porta de cofre redonda, máquina de carimbar, moedas instanciadas, pilha de dinheiro, painel digital (contador),
placa 3D com texto, mapa do Brasil extrudado, gráfico de linha que cresce, barras 3D.

### Outros [existentes]
- Peças 3D Kenney (CC0): city-kit (commercial, suburban, industrial, roads), car-kit, watercraft-kit, train-kit,
  nature-kit. Catálogo de tamanhos: `pecas/catalogo.json`.
- SFX Kit (CC0): 375 sons em 30 categorias + `deixas.mjs` por vídeo + `som.mjs` (trilha em código e master).
- Motor v2: luz PBR, sombras, céu com nuvens, profundidade de campo, bloom, grade de cor, FXAA (`motor2.js`).
- Montagem: atores 2D projetados no 3D, sombra, legenda palavra a palavra, objetos na palavra (`montagem.js`).

## 4. O que construir (priorizado pela análise)
| Prioridade | ID | Asset | Por quê (medição) |
|---|---|---|---|
| 1 | CAM-CORE-EASE | Chaves de câmera com curva por trecho (expo.out, power2.out/in) | 65% dos planos de referência são "chega e assenta"; os nossos são simétricos |
| 1 | CAM-01..CAM-10 | Presets de movimento (funções que geram chaves) | Câmera nossa mexe 40–70% menos por quadro |
| 1 | TRN-01 | Fusão curta de 4–8 quadros (dois renders sobrepostos) | Transição padrão na referência; não temos |
| 1 | PAL-01..05 + LUZ-01..05 | Horários de cor (dia, entardecer, noite prática, chuva, dourado) | Saturação nossa ≈30% menor (85 x 112–127 nos 4 vídeos) |
| 1 | MAT-TOON + POS-CONTORNO | Materiais toon de 2–3 tons + passe de contorno (estilo "3D desenhado") | Estilo do vídeo C; o mais próximo do nosso traço e mais leve de renderizar |
| 2 | LUZ-PALCO | Palco escuro de lâmpada única (cone visível, vinheta forte) | Estilo do vídeo D, para temas de mente e ciência |
| 2 | CHR-02 / CHR-04 | Rim light colorido e grade de cor nos personagens 2D | É o que "cola" o 2D no 3D |
| 2 | VFX-01, 02, 04, 05, 06, 07 | Faíscas, chuva de dinheiro, fumaça/vapor, chuva, explosão, calor | Picos de energia a cada 8–15 s |
| 2 | TRN-05, TRN-06, TRN-11..14 | Temática, limpeza diegética, mergulho na íris/tela, fusão do branco, corte-relâmpago, volta ao início | Transições com significado; loop |
| 2 | CAM-13 + GRA-ui | Mergulho em tela com interfaces prontas (celular: banco, e-mail, mensagem, notícia) | Inserto de prova sem corte (A, C) |
| 2 | VFX-11..17 | Scanner de raio-X, arcos de som, calendário de destacar, luz que apaga, feixe chapado, rótulos de diagrama, contorno de ausência | Explicar mecanismo e passagem de tempo (C, D) |
| 3 | GRA-overlay | Overlay de aparelho (REC, data, contador) | Prova/documento |
| 3 | PER (poses novas) | bravo, envergonhado, caído, telefone, segurando objeto | Expressão nova a cada plano |
| 3 | CHR-08 | Oclusão simples (o 2D atrás de objeto 3D por máscara de profundidade) | Limitação atual do motor |
| 3 | EDI-metricas | Script que mede o vídeo final contra as metas do `MANUAL_AUDIOVISUAL.md` | Controle de qualidade objetivo |
| 4 | CEN (migração) | Palcos dos vídeos 1–4 viram funções reutilizáveis com handles documentados | Reuso |

**Personagens novos só depois da decisão de identidade** (`IDENTIDADE_VISUAL.md` §2).

## 5. Como um vídeo novo usará a biblioteca (alvo)
```js
// index.html de um vídeo novo (alvo da arquitetura; ainda não existe)
const B = Biblioteca;                                  // carrega biblioteca/*.js
const cena = B.motor({ palcos: [B.cenarios.cobertura, B.cenarios.portaria], paleta: B.paletas.entardecer });
B.cameras.chegaEAssenta(cam, { de: [..], para: [..], t0: T.b2, dur: 2.4 });
B.transicoes.fusao(tl, T.b3, { quadros: 6 });
B.vfx.chuvaDeDinheiro(cena, { t0: T.bilhoes, dur: 1.2 });
B.graficos.etiqueta(M, 'US$ 401 BI', W('ricos', 9));
```
