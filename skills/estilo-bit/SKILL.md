---
name: estilo-bit
description: Edita Reels, Shorts e TikToks sem rosto no estilo Bit — fundo escuro vivo, janelas estilo Mac que "funcionam" na tela, o personagem Bit reagindo a cada frase, fichas numeradas, trilho de passos, legenda de 1 a 3 palavras com destaque amarelo, efeitos sonoros discretos e o CTA-assinatura com teclas ("comenta PALAVRA"). Use quando a pessoa pedir edição no estilo Bit, vídeo sem aparecer com animação de interface, tutorial em passos animado, ou mandar uma gravação só de voz para virar Reels. Precisa da skill editor-ia instalada (corte, transcrição e voz).
---

# Estilo Bit

Vídeo vertical 1080x1920, sem rosto, em que a tela inteira é animação amarrada à fala. A pessoa grava só a voz (ou um vídeo falando, que vira só o áudio) e você monta as cenas com o kit.

Leia antes de montar: `references/componentes.md` (o que cada peça faz e quando usar) e `references/regras.md` (ritmo, layout, som, CTA).

## Antes de tudo: a pasta do projeto
Trabalhe sempre dentro de **uma pasta só do projeto**, aberta no Claude (ex.: `Editor IA/`). Tudo o que o vídeo usa fica nela: `Bruto/` (gravações), `Referencias/`, `Imagens/`, `voz/` e `Prontos/` (o vídeo final). Se o Claude foi aberto fora de uma pasta assim (na pasta pessoal, na Área de Trabalho ou sem pasta), **pare e explique**: "crie uma pasta pro projeto, coloque nela os materiais e abra essa pasta aqui no Claude: assim eu enxergo tudo e nada se mistura com os seus outros arquivos". Um vídeo por subpasta dentro de `cortes/` (ex.: `cortes/reels-skill/`).

## Fluxo

0. **Voz (na instalação).** Pergunte se a pessoa vai narrar com a própria voz, com o ElevenLabs ou com o VoiceStudio + VoxCPM2 (grátis, clona a voz dela), seguindo `references/voz-ia.md`. Instale só a escolhida. Com voz de IA, gere as falas com `python scripts/voz_ia.py` e junte num arquivo só em `Bruto/` antes do passo 1.
1. **Corte e voz (com a skill editor-ia).** Use o modo Reels gravado (`references/reels-gravado.md` da editor-ia):
   - só áudio: `so_voz.py Bruto/voz.m4a Bruto/voz.mp4`;
   - corte bruto com `cortar.py` (transcrição `small` para decupar), voz limpa se a pessoa quiser;
   - velocidade (`velocidade.py --fator 1.2`) se ela fala devagar;
   - transcrição do **corte final** (`transcrever.py ... --modelo small`). É ela que dá os tempos de tudo.
2. **Projeto.** `python scripts/novo_projeto_bit.py cortes/<nome>`. Isso cria o `index.html` (esqueleto), o kit e a configuração do HyperFrames.
   Com `--exemplo`, vem o Reels completo de 56 s de referência: abra e copie os padrões.
3. **Roteiro de cenas.** Leia a transcrição do corte com os tempos e, para cada frase, escolha uma peça do kit. A regra é uma imagem nova a cada 2–4 s, sempre ligada ao que está sendo dito. Monte num rascunho (frase → peça → tempo) e só então escreva o `index.html`.
4. **Escrever o `index.html`.**
   - Troque `__DUR__` pelo fim da voz + ~1,3 s.
   - Use `K.terminal`, `K.janela`, `K.fichas`, `K.trilho`, `K.teclas`, o Bit etc. com os tempos da transcrição.
   - Cena específica do vídeo (ex.: uma janela mostrando um resultado) você escreve com `K.janela` + GSAP, no mesmo padrão do exemplo.
5. **Legendas.** `python scripts/legendas_bit.py work/transcricao_corte.json index.html --chaves chaves.txt --corrigir corrigir.json --fim <DUR>`
   - `chaves.txt`: as palavras que podem ganhar destaque.
   - `corrigir.json`: os erros do Whisper, pelo tempo da palavra.
6. **Som.** Pergunte uma vez se a pessoa tem um pack de edições (`references/pack.md`): com ele, a trilha (`--trilha`) e os efeitos saem do pack. Siga `references/som-profissional.md`: escolha os efeitos no SFX Kit (ou no Openverse) pelo ponto de sincronia de cada um. Para os efeitos internos do kit, escreva `sons.json`: um efeito por movimento importante, nunca em toda entrada. Depois:
   `python scripts/sons_bit.py sons.json corte_final.mp4 assets/trilha.wav --dur <DUR> [--trilha musica.wav --trilha-db -14]`
7. **Verificar e renderizar.**
   - `npx --yes hyperframes@0.9.13 check` precisa dar 0 erros. Sobreposição proposital, como uma janela sobre outra, pode ficar.
   - `npx --yes hyperframes@0.9.13 render . --fps 30 --crf 14 -o work/raw.mp4`
8. **Conferir e entregar.**
   - Tire quadros em 8 a 10 momentos e olhe: texto cortado, peça em cima da legenda, Bit em cima de janela, tela vazia.
   - Master: `ffmpeg -i work/raw.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 256k Prontos/<nome>.mp4`.
   - Entregue em `Prontos/` e diga que qualquer ajuste é uma frase.

**Ouvido antes de entregar:** passe o vídeo final pelo Earshot e corrija o som fora do tempo ou alto demais (veja `references/som-profissional.md`).

**Boca do Bit:** `python scripts/boca_bit.py <voz.wav> work/boca.js`, `<script src="work/boca.js">` no index e `bit.fala(window.BOCA)` depois de criar o Bit.

## Quando o pedido vem pelo painel
Se a mensagem chegou pelo chat do painel do Edição com IA (a pasta é `projetos/<id>/` dentro da pasta de trabalho), siga `references/processo-no-painel.md`: as mesmas paradas desta skill, mas marcadas na coluna de etapas e perguntadas com botões (`painel.py pergunta`). A pessoa não vê o terminal.

## O que nunca fazer

- Whoosh ou efeito alto em toda entrada (o som é discreto e ligado ao que aparece).
- Número, preço ou resultado inventado na tela como se fosse real. Se for ilustração, avise a pessoa.
- Logo ou interface de marca de terceiros copiada. As janelas são genéricas, desenhadas pelo kit.
- Editar à mão o que os scripts geram (`/*LEG*/`, `assets/trilha.wav`): rode o script de novo.

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
