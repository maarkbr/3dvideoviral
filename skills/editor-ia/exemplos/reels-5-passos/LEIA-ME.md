# Exemplo: Reels "5 passos" (gravado só com voz)

O Lucas gravou a voz no celular, errando e repetindo frases. A skill fez:

1. **Áudio virou vídeo** com fundo (`so_voz.py`).
2. **Decupagem** com o Whisper `small`. O `edl.json` guarda só a última tentativa completa de cada frase; o campo `note` diz qual tentativa ficou.
3. **Voz limpa** no Adobe Podcast (passo manual) e **velocidade 1,2x** (`velocidade.py`), antes da transcrição do corte.
4. **Edição** com o `plano.json`: 13 cenas de `colagem` (papel, fita, polaroide, checklist, número), legenda `topo` e correções do Whisper em `legenda.corrigir`.

Use como referência de densidade (uma cena a cada 3–5 s) e de como amarrar cada cena na fala (`"~frase"`).
O mesmo áudio editado no estilo Bit está na skill `estilo-bit` (`modelo/index.html`).
- As imagens das cenas (fotos geradas pelo Lucas e o fundo de papel) não vêm junto: troque pelas suas na pasta Imagens.
