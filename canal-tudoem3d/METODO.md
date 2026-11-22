# Método oficial de produção — Tudo em 3D (@_tudoem3d)

Versão 2 (custo zero). Substitui a v1 deste arquivo, preservando o estudo do formato (seções 9 a 12).
Documentos irmãos: `ROTEIRO-PADRAO.md` (modelo de roteiro e direção de voz), `PADRAO.md` (identidade e postagem),
`roteiros/` (roteiros prontos), `motor-v2/` (código do motor de cenas).

---

## 1. Decisão de pipeline (fase atual: investimento zero)

**Escolha: motor próprio v2 (código) como espinha de toda a produção.** Sem IA de vídeo paga nem gratuita no fluxo.

| Opção avaliada | Qualidade | Consistência | Custo real | Veredito |
|---|---|---|---|---|
| **Motor próprio v2** (Three.js + peças 3D Kenney CC0 + personagens 2D vetoriais + pós-processamento) | Boa e subindo; cenário 3D real com luz física e fundo desfocado | **Total** (o personagem é o mesmo desenho em todo vídeo) | **R$ 0**, sem limite de quantidade | **Escolhido** |
| Google Flow grátis (Veo 3.1) | Muito alta | Fraca (personagem muda entre planos) | 50 créditos/dia ≈ 5 clipes "Lite"; marca d'água visível "Veo" nos planos grátis (segundo várias fontes) | Fora do fluxo; teste futuro |
| Kling / Hailuo grátis | Alta | Fraca | Marca d'água + **sem licença comercial** no grátis | Descartado |
| Blender (grátis) | Altíssima | Total | Grátis, mas exige computador com placa de vídeo e muitas horas de modelagem/animação por vídeo | Futuro, quando houver máquina e tempo |
| CapCut | — | — | Recursos Pro geram marca d'água; termos de uso dão licença ampla do conteúdo à ByteDance | Não usar |
| DaVinci Resolve grátis | — | — | Grátis de verdade (exporta até 4K/60, sem marca d'água) | Opcional para ajustes manuais; não é necessário |

Por quê: o motor próprio é o único caminho que entrega **consistência total, quantidade ilimitada e direito comercial
limpo** a custo zero. A distância de qualidade para a referência (que usa IA de vídeo) é reduzida com o motor v2:
peças 3D reais, luz PBR, profundidade de campo, câmera cinematográfica e edição dinâmica.

## 2. Ferramentas (verificadas em 22/11/2026)

| Etapa | Ferramenta | Situação gratuita |
|---|---|---|
| Cenários 3D | Three.js r147 (MIT) + **741 peças Kenney CC0** já baixadas (cidade, subúrbio, comércio, estradas, carros, natureza, trem, barcos) | Grátis, uso comercial liberado, sem crédito obrigatório |
| Personagens | Rig 2D em SVG próprio (`personagem.js` + `personagens-extra.js`), 10 poses | Nosso código |
| Objetos 2D, etiquetas, gráficos, cartelas | `objetos.js` / `objetos-extra.js` + HTML/CSS + GSAP | Grátis |
| Legenda palavra a palavra | Montagem própria + Whisper local (faster-whisper) | Grátis |
| Efeitos sonoros | SFX Kit (320 efeitos CC0) | Grátis, comercial |
| Trilha embutida | Trilha original gerada em código (`som.mjs`) | Nossa |
| Música em alta | Biblioteca de sons **dentro de cada app** (TikTok, Reels, Shorts) | Licenciada pela plataforma; nunca embutir no arquivo |
| Render | Chromium headless (Playwright) + ffmpeg, 3 processos em paralelo | Grátis |
| Voz | Ver seção 3 | — |

Registradas como **possibilidades futuras** (nunca dependência): ElevenLabs Starter (US$ 6/mês, licença comercial),
Google AI Pro/Flow (planos de destaque em IA), Blender + máquina com GPU, Higgsfield.

## 3. Voz (decisão importante)

Fato verificado: **o plano grátis da ElevenLabs não tem licença comercial** e exige atribuição ao publicar
(central de ajuda oficial: "The free plan does not include a commercial license and cannot be used for any commercial
purpose"). Como o objetivo do canal é monetizar, narração feita no plano grátis não serve para vídeo monetizado.

Decisão:
1. **Agora (R$ 0): a narração é gravada com a voz do dono do canal**, seguindo a direção de voz do roteiro
   (celular perto da boca, ambiente quieto; eu limpo, corto silêncios e nivelo). É grátis, 100% comercial e conta
   como conteúdo original para as políticas de monetização.
2. **Primeiro investimento quando entrar receita: ElevenLabs Starter (US$ 6/mês)** com o modelo **Eleven v3** (ou v4),
   que entende as tags de emoção. O roteiro já sai pronto para isso.
3. Alternativa grátis com licença comercial a avaliar: **Kokoro-82M** (Apache-2.0, tem vozes pt-BR, sem tags de emoção).
4. Os dois vídeos já publicados: se a narração foi gerada no plano grátis, colocar o crédito exigido pela ElevenLabs e
   não contá-los para monetização.

O roteiro oficial tem **duas camadas**: as tags do ElevenLabs v3 (para a voz de IA) e a direção de atuação
(para quem grava a própria voz). As duas descrevem a mesma interpretação.

## 4. Identidade visual

- **Mascote do canal** (novo, identidade própria): cabeça redonda branca, **boné amarelo com "3D"** (aba para a direita),
  **jaqueta laranja** com zíper, camiseta branca, calça azul-marinho, tênis branco. Substitui o narrador antigo
  (boina listrada + colete), que lembrava demais um personagem da referência.
- Personagens: desenho 2D chapado, contorno preto grosso (10), sombra de um lado só, olhos grandes expressivos,
  **uma cor que identifica cada personagem**. Elenco fixo do canal em `motor-v2/personagens-extra.js`.
- Cenários: 3D estilizado com peças Kenney, luz de dia quente (sol com sombra suave + céu azul com nuvens),
  fundo desfocado nos planos fechados, noite/chuva/pôr do sol quando a história pede.
- Paleta da marca: azul #2350D8 (raios), amarelo #FFD93D (etiquetas, contorno preto), vermelho #FF4B3E (alerta),
  verde #7CFF9A (dinheiro/sucesso).
- Assinatura: marca "@_tudoem3d" transparente (50%) centralizada embaixo; cartão final ≤ 1,5 s.

## 5. Garantia de consistência visual

1. Personagens são **código**, não geração: o mesmo desenho em todo plano e em todo vídeo.
2. Cada personagem tem uma **ficha** (seção "Elenco" do `ROTEIRO-PADRAO.md`) com a frase fixa de aparência.
3. Cenários reutilizáveis por "palco" (rua do subúrbio, centro comercial, estrada, interior), sempre com a mesma luz base.
4. Pós-processamento fixo (cor, vinheta, grão, desfoque) igual em todos os vídeos.
5. Conferência de quadros antes de todo render: nada cortado na borda, nada fora de hora, rostos visíveis.

## 6. Processo de produção (cada vídeo)

1. **Pauta**: fato verdadeiro com fonte; tipo de história (seção 10). Eu proponho 3 ideias; o dono escolhe.
2. **Roteiro oficial** (`ROTEIRO-PADRAO.md`): narração com tags + direção de voz + storyboard + especificação de cena
   + direção de edição. Aprovação do dono.
3. **Narração**: o dono grava (ou ElevenLabs v3 na fase paga). Arquivo único.
4. **Transcrição e tempos** (Whisper local) → cada palavra com seu tempo.
5. **Montagem das cenas** no motor v2, presas às palavras; poses, objetos, etiquetas, câmera.
6. **Conferência** com quadros parados (folha de contato).
7. **Som**: efeitos do SFX Kit em cada deixa; trilha original baixa (ou nenhuma, se a música entrar pelo app); −14 LUFS.
8. **Render** 1080x1920, 30 fps, H.264 CRF 17, AAC 192 kbps, `+faststart`.
9. **Kit de postagem**: capa 1080x1920, legenda por plataforma, 3–5 hashtags, comentário fixado.
10. **Arquivar** a base do vídeo no repositório.

## 7. Padrões de edição

- Um plano por frase (4 a 6 s); corte seco ou chicote com desfoque nas mudanças de lugar; zoom de 4–8% nas ênfases.
- Legenda: 1 a 2 palavras, branca, contorno preto 16, Baloo 2 800, 86 px, topo em y=1350 (área segura).
- Etiquetas amarelas só para números e nomes; entram na palavra dita, saem antes da próxima ideia.
- Efeito sonoro só onde a imagem pede (objeto entrando, corte, impacto, número); silêncio de 0,3–0,6 s antes da revelação.
- Câmera sempre em movimento leve; nada parado por mais de 2 s.

## 8. Exportação

| Item | Valor |
|---|---|
| Vídeo | 1080x1920, 30 fps, H.264 High, CRF 17, yuv420p, `-movflags +faststart` |
| Áudio | AAC 192 kbps estéreo, −14 LUFS integrado, pico ≤ −1,5 dBTP |
| Capa | PNG 1080x1920, título no centro (área 4:5) |
| Duração | Shorts/TikTok/Reels: 45–75 s (TikTok paga só acima de 60 s; Shorts até 3 min) |

---
(Estudo do formato de referência — v1, preservado)

## 9. O formato estudado
- História **verdadeira** contada como mini-filme, 45–60 s, narrador rápido; personagens 2D chapados em cenários 3D ricos.
- **Um plano por frase**; a imagem atua literalmente a frase; toda frase tem algo visível (pessoa, objeto, lugar, número).
- A referência produz cada plano com IA de vídeo (Google Flow/Veo) a partir de uma imagem de referência dos personagens
  (fonte: documento "Rick's Clips Master Prompt v3").

## 10. A fórmula do roteiro
- **Gancho**: 5 a 18 palavras, afirmação (nunca pergunta), no meio da ação, pessoa pelo papel e **um número estranho**.
  Nunca começar com Como, O que, Por que, Você sabia, Imagine.
- Tempo presente depois do gancho. Frase 2: os dois lados e o prêmio.
- Batidas: GANCHO → PREPARO → DÚVIDA (zombaria de até 14 palavras; o herói não explica) → ESCALADA (2–3 passos; rival
  parece ganhar; pista visível) → VIRADA → REVELAÇÃO ("Acontece que…" + mecanismo numa frase) → FECHO (imagem final:
  quem duvidou recebe o que zombou).
- Pelo menos duas piadas (ditas por quem duvida) e dois números específicos. Frases de 10 a 17 palavras com uma
  punchline de 3 a 6. Sem introdução, nome do canal, moral, pergunta ou chamada para ação na narração.
- Tipos de história (ordem de força): A) herói azarão provado certo por um princípio físico real; B) experimento ou
  instituição real esquisita; C) esquema esperto ou brecha, com virada. Rivais e duvidadores podem ser inventados;
  fatos, nunca.
- Tamanhos **em português** (ritmo medido nas nossas narrações ≈ 2,5 palavras/s): 45 s ≈ 115 palavras (10–12 planos);
  60 s ≈ 150 palavras (13–15 planos); 75 s ≈ 185 palavras.

## 11. Estratégias de retenção
1. Começar no meio da ação com número estranho. 2. Imagem nova a cada ~4 s. 3. Tudo visível. 4. Zombaria cria torcida.
5. Escalada com pista. 6. Humor nas falas dos outros. 7. Revelação curta e fecho em imagem (favorece o replay).

## 12. Diferenças documento x vídeos e decisões
| Ponto | Documento | Vídeos | Decisão |
|---|---|---|---|
| Texto na tela | Nenhum (só número em objeto) | Legenda 1–2 palavras + sobreposições | Legenda e sobreposições entram na edição |
| Anos | Proibidos | Datas em objetos | Histórias atemporais: sem anos; notícia: só se essencial |
| Chamada para ação | Proibida | Não há | Narração termina no fecho; cartão "Segue" ≤ 1,5 s, separado |
| Moral | Proibida | Não há | Nada de moral na narração |
