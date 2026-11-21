# Modo caprichado (Higgsfield): o resultado das páginas virais

As páginas de palitinho que estouram (Nobody Gets In, 3,6 mi; Ami, 1,1 mi) têm cenários **ilustrados e cheios de detalhe**, com cara de desenho à mão. Isso só sai gerando a imagem de cada cena numa plataforma de imagem por IA. Recomendamos o **Higgsfield**, com o GPT Image 2.6 em qualidade média 2k, a 1 crédito por cena. Com a animação (Seedance, 5 créditos por cena), um Short de 40 a 60 s com 6 a 8 cenas gasta **de 40 a 50 créditos**.

**Sem Higgsfield ou sem crédito:** o **modo simples** faz tudo em código, só com o Claude e a skill. Não custa nada por cena, mas o cenário é desenhado de forma simples e fica com cara de explicação, não de página viral. Diga isso à pessoa com essas palavras antes de começar.

**Quem ainda não tem conta:** https://higgsfield.ai?fpr=lucas-28cba0 (no painel do Edição com IA, o Higgsfield se conecta pelo MCP; veja a aula de conectar o Higgsfield).

## Passo a passo
1. **Folha de estilo:** ela garante que o vídeo inteiro sai com o mesmo personagem e o mesmo traço.
   - **Personagem padrão:** copie `assets/estilo-padrao.png` para `<pasta>/ref/estilo.png`. É um rapaz de palito com camiseta azul numa sala, aprovado em 08/11.
   - **Personagem próprio:** gere uma imagem 9:16 com o personagem de corpo inteiro, de frente, num cenário do tema, no prompt do `gerar_cenas.py`, passando como referência 1 ou 2 quadros de uma página de palitinho que a pessoa goste. Confira e salve como `ref/estilo.png`.
2. **No roteiro,** cada cena ilustrada tem `"tipo": "ilustracao"`, `"imagem": "cenas/bN.jpg"` (N = o número do bloco) e `"prompt"`:
   - **prompt:** o que acontece na cena, em inglês, com "our character" para o personagem da folha de estilo;
   - **texto_na_imagem:** a lista do que vai escrito no desenho (placas, títulos), em português, conferido depois letra por letra;
   - **camera:** `{de: {x, y, z}, para: {x, y, z}}`, a câmera andando devagar (o padrão é aproximar 10%).
   - **Por cima, se precisar:**
     - `rotulos` [{texto, x, y, em, seta: [x, y]}];
     - `circulos` [{x, y, r, em}], o círculo vermelho desenhado à mão;
     - `numero` {valor, sufixo, em, y}, o número contando;
     - `selo` ("DIA 3", fixo no canto);
     - até bonecos animados de código.
   - **Outras cenas:** `numero`, `comparacao`, `titulo` e `cta` também aceitam `"imagem"` + `"prompt"` como fundo.
   - **Composição:** peça o importante entre 8% e 62% da altura. A faixa de 64% a 80% fica para a legenda, e o `gerar_cenas.py` já põe isso no prompt.
3. **Gerar:**
   - Rode `python3 S/gerar_cenas.py <pasta> --custo` para ver os créditos e mostrar à pessoa.
   - Depois rode `python3 S/gerar_cenas.py <pasta>`, com a CLI logada.
   - **Pelo MCP:** `--mcp` escreve `cenas/pedido.json`; o Claude gera cada uma com o `generate_image` e depois roda `--resultados cenas/resultados.json`.
4. **Animar:**
   - No roteiro, cada cena ganha `"animar"`: o que se mexe, em inglês ("the man sleeps and breathes, the clock hands spin fast, calendar pages fly"). O desenho, as cores e o texto ficam iguais, e a câmera fica parada.
   - Rode `python3 S/animar_cenas.py <pasta> --custo` e depois `python3 S/animar_cenas.py <pasta>`. Isso usa o Seedance 2.0 Mini, 720p e 5 s, a 5 créditos por clipe, e gera `clipes/bN.mp4`.
   - **Pelo MCP:** `--mcp` e depois `--resultados`.
   - O `montar.py` encaixa cada clipe no tempo do bloco (acelera ou desacelera até 30%, depois segura o último quadro) e põe o desenho do código por cima.
5. **Conferir:**
   - Olhe a folha das cenas: o mesmo personagem, o texto do desenho e a faixa da legenda limpa.
   - Se uma errou, rode `--so N` (1 crédito).
6. Siga o fluxo normal: voz, `montar.py`, render e som.

**Exemplo pronto:** `~/Movies/REELS-CLAUDE/cortes/33-palitinho-caprichado/` ("1 real por segundo", 7 cenas, 7 créditos). Compare com a versão só em código, em `32-palitinho-teste/`.


## Como os tutoriais gringos fazem (08/11/2026)
**Com IA de imagem e vídeo** (desenho rico e boneco animado, gastando crédito):
- **Mark Ai Guy** (563 mil e 331 mil views): um prompt mestre no ChatGPT, o personagem e as cenas no Google Flow (Nano Banana), a animação de cada cena no Flow (Veo, com créditos do Google) e a montagem no CapCut. Ele mesmo diz: "em vez de slides de imagem parada, vamos animar as cenas".
- **The AI Blueprint** (226 mil views): o Claude controla o Google Vids pelo navegador. A conta grátis do Google dá pouca geração de vídeo por mês, e vídeo mais longo precisa de mais.

**Só com código** (grátis, desenho mais simples):
- **Baptiste** (217 mil views, 50 vezes o canal): "por US$ 0". Usa o OpenCode com um modelo grátis (ou o Claude) e cartoon branco feito em código; só a voz usa crédito do ElevenLabs.
- **Jacksons AI** (226 mil views): o Claude Code com um plugin de animação 2D e voz no ElevenLabs.
- **Mr omi** (794 mil views): o Claude desenha e anima tudo em código, até texturas.

Ou seja, os dois modos desta skill: o simples (só Claude) e o caprichado (Higgsfield, com uma assinatura só em vez de Google Flow + ChatGPT + CapCut).
