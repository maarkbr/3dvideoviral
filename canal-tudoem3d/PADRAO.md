# Canal Tudo em 3D (@_tudoem3d): padrão dos vídeos

Instruções para o Claude: todo vídeo novo do canal segue este padrão.

## Identidade
- **Nome:** Tudo em 3D · **@:** @_tudoem3d (TikTok, Instagram e YouTube)
- **Bio:** 🎬 Tudo que viraliza, explicado em 3D / 🤯 Dinheiro, crime, ciência e curiosidades em 1 minuto / 👇 Segue que amanhã tem mais
- **Conteúdo:** qualquer assunto viral, explicado em 60 a 90 s.
- **Mascote fixo (desde 22/11/2026):** cabeça branca e redonda, boné amarelo com "3D", jaqueta laranja com zíper, camiseta branca (visual `mascote` em `motor-v2/personagens-extra.js`). O narrador antigo (boina listrada + colete) foi aposentado por lembrar um personagem da referência.
- **Método completo:** `METODO.md` (pipeline de custo zero) e `ROTEIRO-PADRAO.md` (padrão de roteiro com direção de voz).

## Visual
- Estilo do vídeo de referência ("Why Perfect Railroads Don't Work"): personagens de desenho 2D com cabeça branca dentro de um cenário 3D ensolarado e saturado, com a câmera sempre em movimento.
- Corte entre cenas com desfoque e clarão; o céu muda de cor a cada ideia; etiquetas amarelas com os números; legenda palavra a palavra (amarelo na palavra falada).
- Base do motor: skill `estilo-palitinho` (modo animado) com os arquivos de `base-video/`.

## Assinatura (em todo vídeo)
- **Marca d'água:** "@_tudoem3d" transparente (opacidade 0,5), centralizada embaixo, logo abaixo da legenda (top 1515 px, fonte 42 px).
- **Final de 2 s depois da fala:** cartão azul com raios, "TUDO EM 3D", o narrador acenando e "Segue o @_tudoem3d" (som: whoosh + sting).
- O código dos dois está em `base-video/index.html` (classes `.marca` e `#fimCard`).

## Som
- Narração da pessoa (ElevenLabs, voz Roger) + efeitos do SFX Kit em cada palavra (`base-video/som/deixas.mjs`) + trilha. Volume final em −14 LUFS.

## Postagem
- 3 a 5 hashtags específicas (nada de #fyp). Uma pergunta no fim da legenda. Horário: 18h às 22h.
- Capa 1080x1920 com o título no centro (área 4:5) e foto de perfil 1080x1080: `base-video/arte.html` (`arte.js` gera os PNGs).

## Como produzir no computador na nuvem (sem o HyperFrames)
1. Copie `base-video/` para `~/3D Video Viral/palitinho/<nome-do-video>/`.
2. Baixe as bibliotecas pelo npm (o CDN costuma ser bloqueado): `npm pack three@0.147.0 gsap@3.15.0` e extraia em `vendor/three` e `vendor/gsap`.
3. Transcreva a narração (`transcrever.py --local`, com `HF_HUB_DISABLE_XET=1`), case com o roteiro (`casar_palavras.py`) e gere o som (`som.mjs`).
4. Quadros para conferir: `node quadros.js <pasta> <saida> "t1,t2,…"`. Render: `node render.js <pasta> frames 30 <ini> <fim>` em 3 partes paralelas e depois `ffmpeg -framerate 30 -i frames/f%05d.jpg -i audio/mix.wav -c:v libx264 -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart video.mp4`.

## Vídeos publicados
1. Lavagem de dinheiro / Lava Jato (primeiro vídeo; postado sem a assinatura).
2. Banco Master / Daniel Vorcaro (videos/banco-master: 5 palcos — torre, cofre do FGC, BRB, Banco Central, aeroporto à noite; sai sem trilha para a música entrar pelo app).
