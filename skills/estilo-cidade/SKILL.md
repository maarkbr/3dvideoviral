---
name: estilo-cidade
description: Faz Shorts, Reels e TikToks verticais "Nesta cidade" (uma criança conta a vida numa cidadezinha 3D com uma regra absurda e uma virada no fim, com bonecos cabeçudos de bloco no estilo dos jogos de montar) inteiramente em código, sem crédito por cena - 10 ideias e o roteiro na fórmula do formato, a cidade 3D e os bonecos com rostos e poses em Three.js dentro do HyperFrames, a narração (a voz da pessoa ou de IA), o tempo de cada palavra, legenda de uma palavra, trilha e efeitos feitos em código (ou a trilha do pack de edições), quadros parados para aprovar, render e master em -14 LUFS. Use quando pedirem vídeo "nesta cidade", cidade 3D, cidadezinha com regra absurda, bonecos de bloco, estilo Roblox, ideias de regra, ou escolherem o estilo Cidade 3D no painel do Edição com IA.
---

# Cidade 3D: vídeos "Nesta cidade"

Uma criança conta, em primeira pessoa, como é viver numa cidade com **uma regra absurda**. Ela é diferente dos outros,
acha a brecha da regra e, no fim, uma **virada** muda o sentido de tudo. Tudo em código: a cidade e os bonecos em
Three.js dentro do HyperFrames, o som em Python. O exemplo completo que vem no modelo é o episódio **"Cem Palavras"**
(a Vila do Sossego, onde cada morador só pode falar cem palavras por dia).

`S` = a pasta desta skill; `PY` = o Python da pasta de trabalho (`<pasta de trabalho>/_ferramentas/.venv`, com o
faster-whisper); os vídeos ficam em `<pasta de trabalho>/cidade/<nome-do-video>`.

## Regras que valem sempre
- **Nada pago por cena.** Nenhuma IA de imagem ou vídeo. A voz é a da pessoa ou de IA (`referencias/voz-ia.md`); a
  transcrição é o Whisper local.
- **A referência é só para estudar o estilo.** História, regra, virada, bonecos e cidade são nossos. Nunca usar
  avatar, chapéu, roupa ou visual de jogo, filme ou marca (nada de "Roblox" na tela).
- **Capricho de canal grande.** Antes de mostrar qualquer coisa, olhe os quadros e corrija o que estiver pobre.
- Responda curto, em português simples.
- **Pare para a pessoa aprovar** em quatro pontos: as ideias, o roteiro, os quadros parados e o "pode renderizar".
- A prévia do HyperFrames sempre com `--no-open` (sem isso ele abre o navegador sozinho no meio do trabalho).

## O passo a passo
1. **Ideias ⛔.** Dê 10 ideias, uma por linha: "Nesta cidade, [regra]. **Virada:** [...]". Fórmula em
   `referencias/roteiro.md`. A pessoa escolhe uma.
2. **Roteiro em blocos ⛔.** Cada bloco tem uma frase de fala e a cena dela; a primeira frase já diz a regra. Conta de
   duração: umas 4 palavras por segundo (curto: 30 a 60 s). Mostre o roteiro legível; depois de aprovado, passe a fala
   para o `roteiro.txt` do projeto (formato na referência).
3. **Projeto novo.** `PY S/scripts/novo_video.py "<pasta de trabalho>/cidade" <nome-do-video>`. Na primeira vez ele
   instala (com o npm) o HyperFrames, o three.js e as fontes na pasta `cidade/`; depois copia o motor, os bonecos, as
   ferramentas e o exemplo "Cem Palavras".
4. **Pack de edições (uma vez por computador).** Pergunte: "Você tem um pack de edições (efeitos e trilhas sem
   copyright)? O do estilo do Lucas Editor é o **Pack Edit Pro**; pode ser outro." Os efeitos deste estilo são feitos em
   código e combinam com a cidade; a **trilha** pode vir do pack (no passo 7, `--musica`), escolhida ouvindo (com o
   earshot, se tiver; senão, a pessoa ouve 2 ou 3 candidatas), baixinha e sem voz cantada. Sem pack, a música também
   sai em código. Não invente preço nem link do pack.
5. **Voz ⛔.** A pessoa grava (um arquivo só, sem erros: corte antes com a skill editor-ia se precisar) ou voz de IA
   (`referencias/voz-ia.md`: no Higgsfield, o roteiro inteiro numa fala só, com o custo mostrado antes). Depois:
   `PY <projeto>/ferramentas/voz.py <projeto> <arquivo> [velocidade]`. Diga a duração e as palavras por minuto: a
   referência fala uns 250 por minuto; se ficar lenta, ofereça 1,25 (não muda o tom). Sem o Whisper do HyperFrames,
   ele usa sozinho o faster-whisper do `PY`.
6. **Tempo de cada palavra.** `PY <projeto>/ferramentas/alinhar.py <projeto>`: gera `cena/tempos.js` e
   `assets/audio/palavras.json` e ajusta a duração na página. Confira quantas palavras bateram.
7. **A cena.** Reescreva `cena/episodio.js` com os períodos de luz, o elenco (o que cada boneco faz em cada momento) e
   os planos de câmera, presos nos blocos e palavras (`referencias/cidade-e-bonecos.md`, `referencias/camera-e-luz.md`).
   Peças novas em `predios.js` ou `kit.js`, rostos em `rostos.js`, poses em `bonecos.js`.
8. **Som.** Reescreva a música por período e os efeitos nas palavras em `ferramentas/trilha.py`, rode
   `PY <projeto>/ferramentas/trilha.py <projeto>` e depois `PY <projeto>/ferramentas/mixar.py <projeto>`
   (com a trilha do pack: `--musica "<arquivo>"`). Sai em −14 LUFS. Detalhes em `referencias/voz-legenda-som.md`.
9. **Quadros parados ⛔.** No projeto: `npx hyperframes snapshot --at <segundos> --no-end -o .prints/v1`. Olhe as
   folhas, corrija e repita. `npx hyperframes check`: zero erros e nenhum aviso de área segura. Depois
   `PY <projeto>/ferramentas/pagina_quadros.py <projeto> .prints/v1` e mostre à pessoa. Espere o "pode renderizar".
10. **Render** (só com o ok), em segundo plano: `npx hyperframes render --fps 60 --output render/<nome>.mp4`. Confira o
    disco antes (um vídeo de 60 s usa uns 2 a 4 GB de temporário); com pouco disco, `--workers 1`.
11. **Conferir e entregar.** `PY <projeto>/ferramentas/conferir_video.py <projeto>`: precisa terminar em **APROVADO**,
    e a folha de quadros precisa ser olhada. Entregue o `render/<nome>.mp4` (pelo painel: em `Prontos/` do projeto).

O detalhe de cada passo, os números que funcionam e as armadilhas já encontradas estão em `referencias/conferencia.md`.

## O que mexer em cada vídeo
| Arquivo | O que é | Muda a cada vídeo? |
|---|---|---|
| `roteiro.txt` | a fala, um bloco por linha | sim |
| `cena/placas.js` | os textos das placas (nome da vila, a regra, a placa da lei, o rabisco de giz) | **sim** (a regra muda) |
| `cena/episodio.js` | períodos, elenco, planos de câmera | **sim** (é o arquivo do episódio) |
| `ferramentas/trilha.py` | música de cada período e efeitos nas palavras | **sim** |
| `cena/motor.js` | renderizador, luz de cada período, raios, sombra, legenda, filme antigo | não (só para mudar o estilo) |
| `cena/cidade.js`, `predios.js`, `kit.js`, `texturas.js` | a Vila do Sossego e as peças | só para mudar ou acrescentar peças |
| `cena/bonecos.js`, `rostos.js` | bonecos, poses, acessórios, rostos | só para criar boneco, pose ou expressão |
| `ferramentas/som_biblioteca.py` | instrumentos e efeitos feitos em código | só para criar som novo |
| `ferramentas/voz.py`, `alinhar.py`, `mixar.py`, `pagina_quadros.py`, `conferir_video.py` | voz, tempos, mix, páginas, conferência | não |
| `index.html` | a página do vídeo, a legenda e a camada de filme antigo | só o estilo da legenda |

## Pelo painel do Edição com IA
Siga `referencias/processo-no-painel.md` (as etapas e os cartões). O formulário manda `regra` (a regra absurda; vazia =
o Claude dá as 10 ideias), `duracao` ("curto" = 30 a 60 s; "longo" = 65 a 90 s, para o TikTok pagar) e `voz`.

## Referências
- `referencias/biblia-do-estilo.md`: o estudo dos 10 Shorts da referência e os ajustes que a prática ensinou.
- `referencias/roteiro.md`: a fórmula das ideias e do roteiro, o formato do `roteiro.txt` e o exemplo completo.
- `referencias/cidade-e-bonecos.md`: a Vila do Sossego, as peças, os bonecos, os rostos, as poses e o elenco.
- `referencias/camera-e-luz.md`: planos que funcionam (distâncias e lentes), períodos de luz, sombra e raios.
- `referencias/voz-legenda-som.md`: a narração, o alinhamento, a legenda, a trilha e os efeitos.
- `referencias/conferencia.md`: o que olhar nos quadros, as armadilhas já vistas, o render e a prova final.
