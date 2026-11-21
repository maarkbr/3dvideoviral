# Instalar a skill edicao-youtube (sem o painel)

Edição de vídeos longos de YouTube no estilo Lucas Editor: tira erros, repetições, silêncios e vícios, faz a intro em
motion design, enquadra a tela com zoom suave, põe trilha e entrega pronto — ou exporta para o Premiere/CapCut.

## Jeito mais fácil
Abra o Claude (Claude Code ou o app do Claude, aba Code) numa pasta qualquer e mande:
> Instala a skill que está neste zip (edicao-youtube.zip) e prepara o que ela precisa.
O Claude descompacta em `~/.claude/skills/edicao-youtube/` e monta o resto (abaixo).

## Na mão
1. Descompacte para `~/.claude/skills/edicao-youtube/` (Windows: `C:\Users\<você>\.claude\skills\edicao-youtube\`).
2. Instale o FFmpeg (Mac: `brew install ffmpeg` · Windows: `winget install Gyan.FFmpeg`) e o Node 18+ (nodejs.org) —
   o Node só é usado na intro em motion design (HyperFrames, baixado sozinho na 1ª vez).
3. Crie a pasta de trabalho e o Python dela (uma vez):
   ```bash
   mkdir -p ~/"Edicao com IA/_ferramentas" && python3 -m venv ~/"Edicao com IA/_ferramentas/.venv"
   ~/"Edicao com IA/_ferramentas/.venv/bin/python" -m pip install faster-whisper numpy scipy opencv-python-headless pillow
   ```
4. Reinicie o Claude e peça: "edita meu vídeo do YouTube" (mande o caminho da gravação).

Na 1ª transcrição o Claude baixa o modelo de fala (~460 MB). Para o acabamento, tenha um pack de edições (efeitos
sonoros, músicas sem direitos autorais, transições, backgrounds) — o do estilo é o Pack Edit Pro — e ligue o Google
Drive ao Claude para ele achar o pack sozinho (`references/pack-de-edicoes.md`).
