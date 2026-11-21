---
name: estilo-mapas
description: Cria vídeos verticais de mapa e história (o formato dos canais de geografia que fazem milhões de views - "por que o Chile é tão comprido", "e se a Rússia e os EUA trocassem de lugar", "como os EUA compraram a Louisiana") inteiramente em código - globo que gira e dá zoom, países reais acendendo, país levado para cima de outro no tamanho real, troca de lugar, fronteira e cordilheira desenhadas, pedaços históricos de território, rotas com navio andando, emojis 3D, legenda de 1 a 2 palavras com destaque e CTA com teclas - sincronizados com a narração, com efeitos sonoros e master em -14 LUFS. Também busca os temas de mapa que estão viralizando lá fora (Shorts com 3 milhões de views ou mais) para a pessoa escolher e adaptar para o português. Use quando pedirem vídeo de mapa, geografia, história, "e se", fronteira, país, guerra histórica, "traduzir um vídeo gringo de mapa", ou escolherem o estilo Mapas no painel do Edição com IA.
---

# Estilo Mapas (geografia e história)

O formato do canal GeoGlobeTales (mediana de 3,3 milhões de views por Short; "Why Chile Is So Long & So Thin" passou de 34 milhões). A gente faz **o mesmo tema e o mesmo formato, com roteiro próprio em português**, escrito a partir dos fatos. "Traduzir" um vídeo gringo aqui quer dizer trazer o assunto e os fatos para o português, com outra narração, outras frases e as nossas animações: história é livre, a narração e o vídeo de outro criador não são.

O modelo pronto é o do Chile (`modelo/roteiro.json`; na galeria do painel, "Mapas: por que o Chile é tão comprido").

## O que precisa (uma vez)
- **Node** (para o `npx hyperframes`), **FFmpeg** e o **Python da pasta de trabalho** com `faster-whisper`, `numpy` e `yt-dlp`. O painel instala tudo em `<pasta de trabalho>/_ferramentas/.venv` (o `CLAUDE.md` da pasta mostra o caminho). Abaixo, `PY` é esse Python e `scripts/` é a pasta de scripts desta skill. No computador do Lucas: `~/Lucas Editor/_ferramentas/.venv/bin/python`.
- **Efeitos sonoros:** o SFX Kit (CC0) que o painel instala em `_ferramentas/sfx-kit`. O `mixar.py` acha sozinho. Pergunte uma vez se a pessoa tem um pack de edições (`references/pack.md`): com ele, a trilha sai do pack (`--trilha`) e os efeitos podem trocar os do dicionário `KIT` do `mixar.py`.
- **Música (opcional):** uma trilha livre para uso comercial (Biblioteca de Áudio do YouTube, Pixabay Music). Orquestral ou cinemática, de documentário, combina com mapa. Sem trilha o vídeo sai só com voz e efeitos.
- **Voz:** uma das 5 opções do passo 4.

Cada vídeo fica numa pasta própria: `<pasta de trabalho>/mapas/<tema-curto>/`, com o `roteiro.json`. O resto os scripts criam.

## O fluxo (pare onde está ⛔)
Se o pedido veio pelo painel, siga também `references/processo-no-painel.md` (as etapas que aparecem para a pessoa).

### 1. Tema ⛔ (se a pessoa ainda não deu)
Pergunte como ela quer escolher, com estas opções:
- **"Busca os temas em alta pra mim"** (recomendado). Rode `PY scripts/buscar_temas.py --min 3000000 --top 15 --saida <pasta de trabalho>/mapas/temas.md` (1 a 3 minutos; lê só o que é público: os Shorts dos canais de `scripts/canais.json` e uma busca no YouTube). Mostre de 5 a 8 temas **em português**, um por linha: as views, o tema traduzido, a pergunta que o vídeo responde e quais cenas do kit ele usaria. Exemplo: "34 mi · Por que o Chile é tão comprido e fino · abertura, mover para cima do Brasil, fronteira dos Andes, faixa de 1818". Deixe a pessoa escolher. Os mesmos temas costumam estar no Reels e no TikTok: o que bomba no Shorts gringo ainda é novidade em português. Se nada passar de 3 milhões, rode de novo com `--min 1000000`. Para pesquisar outros canais, acrescente no `canais.json` (nome e id do canal).
- **"Tenho o link de um vídeo para adaptar"**. Dentro da pasta do vídeo, rode `PY scripts/buscar_temas.py --texto <link>`: ele salva o texto do vídeo em `referencia.txt` (legenda do YouTube ou, se não tiver, o áudio transcrito). TikTok funciona; o Instagram costuma pedir login, e aí peça para a pessoa colar o texto do vídeo ou mandar o mesmo vídeo no YouTube ou no TikTok.
- **"Eu já tenho o tema"**. Confira se ele tem um "por quê" que se explica no mapa. Se não tiver (ex.: "a culinária do Peru"), diga e sugira um ângulo de mapa.

Temas que mais passam da média nesses canais: o formato estranho de um país, fronteiras esquisitas, "e se X e Y trocassem de lugar", compras e guerras que mudaram o mapa, "o país que quase não existiu", "diferença entre X e Y".

### 2. Pesquisa dos fatos
O `referencia.txt` serve só para saber o assunto e a ordem das ideias. Os fatos vêm da web: cada número e cada ano com duas fontes (a Wikipédia e mais uma), listadas no campo `fontes`. Traga para o Brasil: compare com o Brasil, use km e nomes em português. Desconfie do que "todo mundo sabe" (ex.: "do Oiapoque ao Chuí" é mito: o ponto mais ao norte do Brasil é o Monte Caburaí, e o Brasil tem 4.394 km de norte a sul). Fato que não se confirma sai do roteiro.

### 3. Roteiro ⛔
Escreva o `roteiro.json` (formato no `modelo/roteiro.json`):
```json
{"titulo": "...", "fontes": "...", "destaques": ["Chile", "Andes", "1818"], "trilha": {"arquivo": "musica.mp3", "inicio": 0},
 "blocos": [{"fala": "o que a voz diz", "cena": {"tipo": "abertura", "pais": "Chile", "itens": [...]}}, ...]}
```
- **8 a 12 blocos**, de 5 a 8 segundos cada (13 a 20 palavras): o vídeo fica entre 60 e 80 segundos.
- **Bloco 1:** a pergunta do tema e o número que surpreende ("São mais de quatro mil quilômetros de norte a sul"). **Bloco 2:** a comparação com o Brasil (cena `mover`). **Depois:** 3 ou 4 causas, uma por bloco, cada uma com um ano, um lugar ou um número. **Fecho:** o resultado em uma frase. **Último bloco:** o CTA.
- Cada bloco ganha uma cena: escolha em `references/cenas.md` e diga em `palavra` em que palavra cada coisa entra.
- Na `fala`: números por extenso ("mil oitocentos e dezoito"), nada em CAIXA ALTA (a voz soletra), nome estrangeiro do jeito que se fala. Na tela (selos, anos): algarismos.
- `destaques`: as palavras que ficam laranja na legenda (países, números, nomes).
- **CTA:** pergunte à pessoa a palavra do comentário e o que ela entrega. No canal do Lucas o CTA deixa claro que é IA ("Esse vídeo foi feito inteiro com inteligência artificial, no Claude. Se você quer criar vídeos assim, comenta mapa que eu te mando a skill.", com `selo` "Feito 100% com IA no Claude" e `logo` "claude"); para outra pessoa, nada do Lucas pode sobrar.
- Mostre o roteiro numerado no chat, com a cena de cada bloco em uma linha simples ("2. O Chile sai do lugar e cobre o Brasil de norte a sul").

**Rascunho das cenas (recomendado antes de gastar com voz):** `python3 scripts/montar.py <pasta> --rascunho` (tempos estimados) e as fotos do passo 5. Mostre a folha de fotos e ajuste o que estiver fora do lugar. No painel, essa é a etapa do storyboard.

### 4. Voz ⛔ (pergunte, se a pasta de trabalho ainda não tem uma voz anotada em `voz/escolha.txt`)
| Opção | Custo | Como |
|---|---|---|
| **Minha voz** | zero | A pessoa grava a narração inteira lendo o roteiro, celular perto da boca, lugar quieto. Errou, repete a frase: corte os erros antes com a skill `editor-ia` (ou grave de novo). Depois `PY scripts/montar_voz.py <pasta> --gravacao <arquivo>` |
| **Áudio pronto** | zero | O mesmo `--gravacao` com o arquivo que ela mandar |
| **VoiceStudio** | zero, roda no computador | Instalação e clonagem em `references/voz-ia.md` |
| **ElevenLabs** | plano pago (licença comercial) | Chave da própria pessoa no ambiente (`ELEVENLABS_API_KEY`), nunca no chat |
| **Higgsfield** | créditos (ElevenLabs v4, ~0,5 por fala curta) | o Higgsfield conectado no app do Claude (MCP, sem instalar nada; passo a passo em `references/voz-ia.md`, seção 4). **Mostre o custo antes** (`get_cost`). Quem ainda não tem conta: https://higgsfield.ai?fpr=lucas-28cba0. A voz Marcus foi a aprovada pelo Lucas |

Para as vozes de IA: `PY scripts/falas.py <pasta>` (escreve cada fala em `voz/b1.txt`...) e depois `PY scripts/voz_ia.py --pasta <pasta>/voz --motor <voicestudio|elevenlabs|higgsfield> --voz <id> 1 2 3 ...` (ele põe "Bom." na frente, corta depois, confere com o Whisper e tenta de novo até 3 vezes; no Higgsfield são 2 passos, com você gerando pelo MCP no meio: `references/voz-ia.md`, seção 4). Depois junte: `PY scripts/montar_voz.py <pasta>`.

O `montar_voz.py` imprime o que o Whisper ouviu e **as palavras do roteiro que ele não achou na voz**. A legenda usa sempre o texto do roteiro, então erro do Whisper ("Clod", "as Q" no lugar de "a skill") não aparece no vídeo; mas palavra não achada também pode ser a voz pronunciando errado ou pulando um trecho: peça para a pessoa ouvir esses pontos. Para corrigir a pronúncia, ponha no bloco um `"tts"` com a grafia do som (ex.: "Clóde"), rode o `falas.py` e gere só aquele bloco de novo.

### 5. Montar e conferir
`python3 scripts/montar.py <pasta>` (copia o kit, copia os ícones 3D usados da pasta `icones3d/` e escreve `index.html` e `dados.js`). Fotos: dentro da pasta, `npx --yes hyperframes@0.9.13 snapshot --at <tempos separados por vírgula> --no-end --output work/snap`, com um tempo no meio de cada bloco (os inícios estão em `voz/blocos.json`). Veja a `contact-sheet-*.jpg` (por um servidor local no navegador). Confira: o país certo acende; a faixa acende o pedaço certo; o que entra, entra na palavra; nenhum texto em cima da legenda; nada cortado na borda.

### 6. Render
Dentro da pasta: `npx --yes hyperframes@0.9.13 render . --fps 30 --crf 16 --browser-timeout 240 -o work/video.mp4`. Leva de 1 a 2 minutos por minuto de vídeo: rode em segundo plano e avise.

### 7. Som e entrega
`python3 scripts/tirar_sons.py <pasta>` (lê do kit o momento de cada efeito) e `PY scripts/mixar.py <pasta> <pasta de trabalho>/Prontos/<nome>.mp4 [--trilha musica.mp3 --inicio-trilha 0]`. Ele põe whoosh nos movimentos de câmera, pop nos emojis, ping nos rótulos, impacto nos números grandes e teclas no CTA; abaixa a trilha quando a voz fala e entrega em -14 LUFS. Você não ouve o áudio: diga isso e peça para a pessoa escutar (a música, principalmente). Para escolher entre várias músicas, use o Earshot (`rank` com "cinematic orchestral documentary music"), se estiver instalado.

## Regras (aprendidas no primeiro vídeo)
- O kit desenha o mapa **uma vez por quadro**. Cena nova vai num `cenas.js` na pasta do vídeo, nunca no `kit/` (veja `references/cenas.md`).
- Legenda entre y 1240 e 1440 (área segura do Reels e do TikTok): nada de rótulo ali, nem embaixo dela (descrição e botões do app).
- Faixa histórica: confira na foto que acendeu o pedaço certo (o kit já desenha o contorno no sentido certo; se aparecer invertido, é o contorno que está ao contrário).
- O Whisper só dá os tempos; o texto da legenda é o do roteiro.
- Nada de imagem, trecho ou narração do vídeo de referência. Só o tema e os fatos.

## Arquivos
- `scripts/buscar_temas.py` temas em alta e texto de um link · `scripts/canais.json` canais pesquisados
- `scripts/falas.py`, `scripts/voz_ia.py`, `scripts/montar_voz.py` voz · `scripts/montar.py` projeto · `scripts/tirar_sons.py` e `scripts/mixar.py` som
- `kit/` o mapa (d3-geo, topojson, `mapa.js`, `mapa.css`, fonte) · `dados/countries-50m.json` os países · `dados/paises.txt` os nomes · `icones3d/` biblioteca de ícones 3D (INDEX.md) · `scripts/gerar_icone.sh` gera um ícone novo
- `modelo/roteiro.json` o vídeo do Chile · `references/cenas.md` todas as cenas · `references/voz-ia.md` as vozes · `references/processo-no-painel.md` as etapas no painel

## Créditos e licenças
Países: Natural Earth via world-atlas (domínio público). d3-geo e topojson-client (ISC/BSD). Ícones 3D: gerados por nós, ver `icones3d/LICENCA.txt`. Fonte Montserrat (OFL). Efeitos: SFX Kit (CC0) ou o pack da própria pessoa. No computador do Lucas, efeitos e trilha vêm do Pack Lucas no Drive (uso dele, não vai no produto).

## Decupagem da voz gravada (vale para todo vídeo com narração gravada)
O áudio gravado vem com tentativas repetidas, falsos começos e palavras trocadas. **Nunca transcreva o arquivo inteiro para decupar:** o Whisper junta as repetições e elas somem do texto. Faça assim (só precisa do `faster-whisper`, `numpy` e `ffmpeg`, que a instalação já traz):
1. **Fala por fala.** Rode este script no áudio bruto (ele corta em cada pausa de 0,36 s e transcreve cada pedaço sozinho):
```python
import sys, subprocess, numpy as np
from faster_whisper import WhisperModel
a = np.frombuffer(subprocess.run(["ffmpeg","-v","error","-i",sys.argv[1],"-ac","1","-ar","16000","-f","f32le","-"],capture_output=True).stdout, np.float32)
e = np.array([20*np.log10(np.sqrt(np.mean(a[i:i+320]**2))+1e-9) for i in range(0, len(a)-320, 320)])   # 20 ms por quadro
on = e > np.percentile(e, 10) + 14; falas = []; i = 0
while i < len(on):
    if on[i]:
        j = i
        while j < len(on) and (on[j] or on[j:j+18].any()): j += 1     # 18 quadros = 0,36 s de pausa
        falas.append((i*0.02, j*0.02)); i = j
    else: i += 1
W = WhisperModel("medium", compute_type="int8")
for k, (s, f) in enumerate(falas):
    t = " ".join(x.text.strip() for x in W.transcribe(a[int((s-.2)*16000):int((f+.2)*16000)], language="pt")[0])
    print(f"[{k:2d}] {s:7.2f}-{f:7.2f} {t}")
```
2. **Fica a última tentativa completa de cada frase**, sem sobra de palavra da anterior. Se a última vier truncada ou com palavra errada, use a anterior que estiver completa e avise a pessoa.
3. **Cuidado com falso começo dentro da mesma fala:** uma tentativa pode começar, parar e recomeçar sem pausa longa (ex.: "e vai para a fachada… e vai para a fachada e para a sinalização"). Na lista isso parece uma fala só. Se a transcrição de uma fala tiver a mesma expressão duas vezes, ou parar no meio, rode o mesmo script só naquele trecho (com pausa menor, 0,25 s) e fique com a parte completa.
4. **Corte** do começo da fala (menos ~0,08 s) até o fim dela (mais ~0,1 s), com fade de 10 a 50 ms, junte as falas escolhidas com ffmpeg (`atrim` + `concat`) e só então acelere (1,15) e tire pausas longas.
5. **Confira o vídeo final**: rode o mesmo script no áudio do vídeo pronto e leia. Não pode sobrar palavra dobrada, começo falso nem pedaço de outra tentativa. O Whisper erra nomes e termos (ex.: "logo" vira "alogo", "Claude" vira "Cloud"): isso é normal, a legenda do vídeo vem do roteiro. O que ficar duvidoso vira uma lista "ouvir este trecho" para a pessoa conferir ao aprovar.
6. (Opcional, quem tem a skill `edicao-youtube`) o `transcrever_falas.py`, o `retakes.py` e o `conferir.py` dela fazem o mesmo de forma automática.
7. Sem emoji em imagem e sem texto cortado nas bordas (área segura): confira olhando os quadros, não só o código.

## Ícones: NUNCA emoji
Emoji (Unicode, Fluent, qualquer figurinha) passa pouca credibilidade. Os objetos que aparecem presos ao mapa (dinheiro, navio, coroa, prédio, espadas…) são **ícones 3D polidos** da pasta `icones3d/` (veja o `icones3d/INDEX.md`: nome e o que mostra). No roteiro continua o campo `"emoji": "<nome>"` (nome antigo do campo; o conteúdo é o ícone). O `montar.py` copia o ícone pelo nome; se faltar, ele avisa e **não baixa emoji**. Os ícones foram gerados por nós (veja `icones3d/LICENCA.txt`).
- **Antes de gerar, veja se um existente serve** (INDEX.md).
- **Faltou um ícone?** `bash scripts/gerar_icone.sh <nome> "<descrição do objeto em inglês>"` gera no mesmo estilo pelo GPT Image (Higgsfield), tira o fundo verde e guarda em `icones3d/`. Custo ~2,75 créditos (no máximo 30 por peça; nunca reenvie sozinho se der erro: confira o job antes). Sem o CLI, use o conector Higgsfield do Claude com o mesmo prompt (veja o cabeçalho do script) e acrescente a linha no INDEX.md.
- Tamanho e posição: no item, `"tam": 260` e `"tela": [540, 560]` (fixo na tela, dentro da área segura) costumam ficar melhores que `lon/lat` em mapa afastado, onde o ícone vai parar na borda.
- Sem texto cortado: rótulos longos viram `selo` (não `selo grande`) ou encurtam; confira os quadros.
