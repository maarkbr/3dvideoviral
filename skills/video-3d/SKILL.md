---
name: video-3d
description: Cria vídeos verticais 3D low poly "como é feito / você construiu…" (estilo dos perfis sem rosto que viralizam) inteiramente em código — o Claude escreve o roteiro, monta um mundo 3D em Three.js dentro do HyperFrames, anima a obra etapa por etapa sincronizada com a narração, com trocas de câmera, vistas em corte, etiquetas amarelas presas nos objetos e legenda de uma palavra. Sem custo por cena. Use quando a pessoa pedir vídeo 3D, vídeo explicativo em 3D, "como é construído", animação low poly, vídeo sem aparecer em 3D, ou quiser repetir o formato do vídeo do bunker.
---

# Vídeo 3D em código

Vídeo vertical 1080x1920, de 30 a 45 s (Reels e Shorts) ou de 65 a 80 s (TikTok, que só paga vídeo com mais de 1 minuto), todo desenhado por código: um mundo low poly só, onde uma obra (ou processo) avança por etapas enquanto a narração explica. Nada de IA de vídeo: cada quadro é calculado a partir do tempo, então dá pra ajustar qualquer detalhe conversando.

Leia antes de criar a cena: `references/regras-3d.md`. O exemplo completo (bunker) está em `modelo/cena.js` e `modelo/roteiro.json`.

## Antes de tudo: a pasta de trabalho
Tudo vive numa **pasta de trabalho** que a pessoa escolhe onde fica (ex.: `Documentos/Videos 3D`). As ferramentas são instaladas dentro dela, então depois basta abrir essa pasta no Claude e pedir o vídeo.

- **A pasta aberta (ou uma acima dela) tem `_ferramentas/estado.json`?** Então ela já está pronta: leia o `CLAUDE.md` dela (o Claude Code lê sozinho), **não instale nada de novo** e vá direto ao passo 1. Se o `CLAUDE.md` disser que falta algo, siga o passo 0 só para o que falta.
- **Não tem?** Faça o passo 0. Se o Claude foi aberto na pasta pessoal, na Área de Trabalho ou sem pasta, pergunte **onde a pessoa quer criar a pasta de trabalho** antes de qualquer coisa.

Dentro dela: `CLAUDE.md` (o guia que o Claude lê), `_ferramentas/` (Python com Whisper, peças 3D, efeitos sonoros, Earshot), `Prontos/` (vídeos finais) e **uma subpasta por vídeo** (`bunker/`, `ponte/`…), com `Bruto/`, `referencia/`, `voz/` e `assets/`.

## Fluxo (pare para aprovação onde está ⛔)

0. **Preparar a pasta de trabalho (só na primeira vez).**
   - Crie e confira: `python scripts/preparar_pasta.py "<pasta>"`. Ele cria a estrutura, escreve o `CLAUDE.md` e lista o que falta, **sem instalar nada**.
   - Programas do computador que faltarem (Node 22+, FFmpeg, Python 3.10–3.13): mostre o comando que o script sugere e instale só com o ok da pessoa.
   - Com o ok da pessoa, instale o resto dentro da pasta: `python scripts/preparar_pasta.py "<pasta>" --instalar` (Python com Whisper, as 741 peças 3D do Kenney e o SFX Kit, ~100 MB no total).
   - **Pergunte qual voz a pessoa quer** (a própria, ElevenLabs, VoiceStudio com VoxCPM2 ou Higgsfield), seguindo `references/voz-ia.md`. Instale só a escolhida e anote: `python scripts/preparar_pasta.py "<pasta>" --voz voicestudio:<perfil>` (ou `elevenlabs:<voice_id>`, `higgsfield:<nome da voz>`, ou `propria`).
   - **Pergunte uma vez pelo pack de edições** (o Pack Edit Pro ou outro): com ele, os efeitos e a trilha saem do pack, escolhidos ouvindo; sem ele, do SFX Kit. Veja `references/pack.md` (tem o script que indexa a pasta).
   - Opcional: o Earshot (para o Claude "ouvir" o vídeo), em `<pasta>/_ferramentas/earshot`, seguindo `references/som-profissional.md`.
   - Instale o plugin HyperFrames: `claude plugin marketplace add heygen-com/hyperframes` e `claude plugin install hyperframes@hyperframes`.
   - No fim, rode o `preparar_pasta.py "<pasta>"` de novo, para o `CLAUDE.md` mostrar tudo instalado, e diga à pessoa: "sempre que quiser um vídeo, abra a pasta `<pasta>` no Claude e peça".
   - Daqui em diante, rode os scripts da skill com o Python da pasta (`<pasta>/_ferramentas/.venv/bin/python`; no Windows, `.venv\Scripts\python`). Ele tem o Whisper.
1. **Tema.** Leia `references/temas-e-roteiro.md`. Rode `python scripts/temas_3d.py --curtos` (ou `--tema "<assunto>"`) para ver o que já viralizou lá fora, e proponha 3 temas que avancem por etapas no mesmo cenário e tenham problema no meio. Quando a pessoa escolher um (ou mandar um link), rode `python scripts/referencia_3d.py <link> <pasta>`: ele baixa o vídeo, transcreve e gera folhas de quadros. Leia `referencia/transcricao.txt` e as folhas `referencia/quadros-*.jpg`, e anote a sequência de problemas e soluções e as etapas da obra. O roteiro e o 3D são feitos do zero, em português, com as suas palavras e fatos pesquisados: nunca traduza o texto ao pé da letra nem copie imagens. Pesquise os fatos na web antes de escrever: não invente número, data nem nome.
2. **Roteiro** ⛔. Escreva o `roteiro.json` no formato do modelo:
   - **a duração manda no número de blocos:** curto (Reels e Shorts, 30 a 45 s) = **6 blocos**; longo (TikTok, 65 a 80 s) = **10 blocos**. Se a pessoa (ou o pedido do painel, `campos.duracao`) não disse, pergunte uma vez. Não peça confirmação de que o longo "é fora do padrão": os dois são o padrão da skill;
   - os blocos no formato **problema → solução** (gancho, problemas resolvidos um a um, fechamento com CTA; no longo, 8 problemas em vez de 4; veja `references/temas-e-roteiro.md`), cada um com uma `fala` de 18 a 26 palavras, na segunda pessoa, com números por extenso;
   - a `etapa`, que diz o que aparece: primeiro a falha (o problema acontecendo) e depois a solução sendo construída;
   - de 1 a 3 `etiquetas` (`txt` curto em caixa alta, `p` = posição 3D, `de`/`ate` = segundos dentro do bloco, numa escala de 0 a 10);
   - as `fontes` da pesquisa.
   Mostre as falas e as etapas e espere a aprovação.
3. **Projeto.** `python scripts/novo_projeto_3d.py "<pasta de trabalho>/<nome-do-video>"` (o `<pasta>` dos passos seguintes é essa subpasta). Ele copia o motor (`cena.js`), a fonte e a configuração. Ponha o `roteiro.json` aprovado na pasta.
4. **Voz.** Use a voz anotada na pasta de trabalho (o `CLAUDE.md` mostra o comando; está também em `_ferramentas/estado.json`). Se não tiver, pergunte, seguindo `references/voz-ia.md`.
   - **Própria voz:** a pessoa grava as falas (6 ou 10) em `Bruto/`. Se tiver erros, corte antes com a skill editor-ia. Depois: `python scripts/voz_3d.py <pasta> --gravacao Bruto/voz.m4a`.
   - **Voz de IA** (VoiceStudio com VoxCPM2, ElevenLabs ou Higgsfield): escreva `voz/b1.txt`, `b2.txt`… (uma por bloco) com as falas e rode `python scripts/voz_ia.py --motor <voicestudio|elevenlabs|higgsfield> --voz <id ou nome> 1 2 3 …` (no Higgsfield são 2 passos, com você gerando pelo MCP no meio: `references/voz-ia.md`, seção 4). Depois: `python scripts/voz_3d.py <pasta> --falas voz/f1.wav voz/f2.wav … (todas, na ordem)`.
   - O `voz_3d.py` acelera 15%, encurta as pausas, transcreve e alinha cada palavra ao roteiro. Se ele avisar que palavras do roteiro não apareceram, refaça essa fala.
5. **Cena** ⛔. Adapte o `cena.js` ao tema:
   - **peças prontas primeiro:** veículo, navio, casa, prédio, árvore, trem, poste… vêm da biblioteca (`python scripts/pecas_3d.py buscar <palavra>`, catálogo em `_ferramentas/pecas-3d/catalogo.md` da pasta de trabalho). Copie as escolhidas com `python scripts/pecas_3d.py usar <pasta> car-kit/sedan …`, carregue com `await carregaPecas([...])` antes de montar o mundo e posicione com `peca(nome, {comp|alt|larg}, x, y, z, rotY)`. Desenhe com caixa/cil só a obra que muda (paredes, cabos, concreto) e o que não existir na biblioteca;
   - mantenha o MOTOR;
   - troque o MUNDO (os objetos);
   - escreva as TOMADAS (uma troca de câmera a cada 3–4 s, em segundos de bloco);
   - escreva as etapas em `renderAt(t)` com `bt(bloco, s)`.
   Depois rode `python scripts/montar_3d.py <pasta>` e tire snapshots: `npx --yes hyperframes@0.9.13 snapshot --at <um tempo por tomada> --no-end --output work/snap`. Olhe todos os quadros (veja a lista em `regras-3d.md`), corrija e mostre a folha de quadros para a pessoa aprovar. No `hyperframes check`, o erro `missing_timeline_registry` é esperado: a cena 3D é desenhada pelo evento `hf-seek`, não por GSAP. Os outros erros, corrija.
6. **Render.** `npx --yes hyperframes@0.9.13 render . --fps 30 --crf 16 -o work/video.mp4`. Um vídeo de 40 s leva poucos minutos.
7. **Som.** Com o pack da pessoa, os efeitos e a trilha saem dele (`references/pack.md`; se ainda não perguntou se ela tem um, pergunte agora); sem pack, siga `references/som-profissional.md`: um efeito do SFX Kit em cada troca de câmera e em cada etiqueta que importa (passe com `--whoosh` e `--cortes`, ou mixe à parte), e escute o vídeo final com o Earshot.
8. **Finalizar.** `python scripts/finalizar_3d.py <pasta> "<pasta de trabalho>/Prontos/<nome>.mp4" [--trilha musica.mp3] [--whoosh efeito.mp3 --cortes <tempos das trocas>]`. O áudio sai em −14 LUFS. Tire 8 quadros do arquivo final, confira e entregue. Qualquer ajuste é uma frase.

## Quando o pedido vem pelo painel
Se a mensagem chegou pelo chat do painel do Edição com IA (a pasta é `projetos/<id>/` dentro da pasta de trabalho), siga `references/processo-no-painel.md`: as mesmas paradas desta skill, mas marcadas na coluna de etapas e perguntadas com botões (`painel.py pergunta`). A pessoa não vê o terminal.

## O que nunca fazer
- Carregar peça depois do começo do módulo (dentro do `renderAt`, por exemplo): o HyperFrames só espera o que já começou a carregar.
- Usar `Math.random()`, `Date.now()` ou `requestAnimationFrame` como relógio: cada quadro é renderizado fora de ordem. Para aleatório, use o `h(i)` com semente.
- Deixar a parede da frente tampar o interior nas vistas em corte. Ela vira uma mureta (veja o modelo).
- Deixar o céu aparecer por baixo do terreno quando esconder um pedaço do chão. Ponha um piso de obra no lugar.
- Mostrar vergalhão, ferramenta ou objeto de etapa antiga depois que a etapa terminou, a não ser que faça sentido.
- Legenda com o texto do Whisper. A legenda usa sempre o texto do roteiro (o `voz_3d.py` já faz isso).
- Inventar fato no roteiro.
