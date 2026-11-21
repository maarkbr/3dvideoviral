# YouTube: intro com prints 3D

Estilo: `youtube` (skill `edicao-youtube`) · Editar meus vídeos · tutorial, aula, canal dark. 59 s, 15 cenas, 16:9.
Intro do vídeo "Vídeos 3D sem aparecer" do canal Lucas Editor (nov/2026), feita pelo Claude a partir da gravação
crua: a fala sem erros, tentativas repetidas e silêncios, acelerada em 1,15x, e a intro inteira em motion design.

## O que copiar deste modelo
- A estrutura de gancho de canal dark: prova social com números reais (seguidores, posts, views) → a promessa
  ("100% com inteligência artificial") → o que a pessoa vai aprender → por que este vídeo é diferente → o que precisa
  → "bora começar".
- Prints reais em perspectiva 3D (palco com `perspective`, entrada de longe, câmera que vai até o número), destaque
  amarelo MEDIDO no próprio print (nunca chutado), @ e bio de terceiros borrados; o vídeo viral num celular em 3D.
- Lettering do canal: rótulo pequeno em serifa itálica sobre a palavra gigante, letra a letra com desfoque, brilho.
- Contador (741 peças, R$ 500), cartões, MacBook 3D (`template/componentes/notebook-3d.html`).
- Som: efeitos de interface do pack, trilha com ducking pela voz e EQ em 2,5 kHz, master −14 LUFS.

## Como usar
1. A fala e a tela da intro vêm da gravação da pessoa (`trecho_intro.py`), nunca deste modelo.
2. `codigo/index.html` é a composição do HyperFrames (1920x1080; render em 4K para 2K/4K). Mantenha o MOTOR (palco 3D,
   lettering, contador, anéis), troque as cenas pelo conteúdo do vídeo novo e os tempos pelas palavras da nova fala.
   Os arquivos de mídia (prints, reels, sons) NÃO vêm com o modelo: pegue os do vídeo novo (prints na hora, com o @
   borrado) e os sons do pack de edições da pessoa.
3. Números na tela só os que a pessoa disse ou que estão no print (avise se o print mostrar outro número).
