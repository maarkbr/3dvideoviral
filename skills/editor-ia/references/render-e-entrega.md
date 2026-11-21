# Prévia, render e entrega (Fases 7 e 8)

## Prévia no Studio (antes do render, sempre)

```
cd cortes/01-x/vertical
node <skill>/scripts/hf.mjs preview --background
node <skill>/scripts/hf.mjs preview --status
```

Mande o link (localhost) para o usuário e diga em uma linha que dá para editar ali mesmo: clicar num texto, arrastar um clipe na linha do tempo. Avise que mudanças de conteúdo feitas pelo plano (`montar_vertical.py`) sobrescrevem edições manuais do Studio. Se o `preview` imprimir a linha sobre o app desktop do HyperFrames (Framey), repasse em uma frase.

## ⛔ GATE: render

Uma pergunta clicável: **"Renderizar agora (Recomendado)"** · "Quero ajustar algo antes". No modo lote: "Renderizar os N cortes (Recomendado)" · "Revisar um por um". Se o usuário pediu para não perguntar nada, abra a prévia mesmo assim e renderize.

## Render

```
cd cortes/01-x/vertical
node <skill>/scripts/hf.mjs render . --fps 30 --crf 14 --browser-timeout 180 -o ../work/vertical_raw.mp4
```

- Leva ~5–8x a duração do vídeo numa máquina comum (82 s → 7–10 min). Avise antes, rode em segundo plano e não fique perguntando.
- `--fps 30` é o padrão das redes; `--crf 14` deixa o arquivo bonito para o master. Pare o preview (`preview --stop`) antes de renderizar se a máquina for fraca.

## Master e entrega

```
python <skill>/scripts/masterizar.py cortes/01-x/work/vertical_raw.mp4 cortes/01-x/entrega --name corte_vertical_01-x \
  --voice cortes/01-x/vertical/assets/aroll.mp4 --sfx cortes/01-x/vertical/assets/sfx.wav --music cortes/01-x/vertical/assets/music_raw.wav
```

Pasta `entrega/`:
- `corte_vertical_<nome>.mp4` — 1080x1920, 30 fps, −14 LUFS, ≤ −1 dBTP
- `stems/` — voz, sfx, trilha, master
- `relatorio.md` — você escreve (modelo abaixo)

## Verifique antes de entregar (você, não o usuário)

1. `ffprobe` no final: 1080x1920, 30 fps, duração igual à do corte bruto (±1 quadro), áudio 48 kHz.
2. O resumo do `ebur128` impresso pelo master: integrado ~−14,0 LUFS, true peak ≤ −1,0 dBTP.
3. Uma folha de contato do final (`ffmpeg -i final.mp4 -vf "fps=1,scale=270:-2,tile=8x6" -frames:v 1 folha.jpg`) e olhe: legenda legível, nada cortado, cenas no lugar.

## relatorio.md (modelo)

```
# Corte vertical · <título>
- arquivo: entrega/corte_vertical_<nome>.mp4 — 1080x1920, 30 fps, <duração> s, −14,0 LUFS, −1,1 dBTP
- origem: <podcast> · trecho <mm:ss>–<mm:ss> · corte bruto de <n> trechos
- cenas (<n>): 0,0 gancho "…" · 5,8 card China "sem democracia / atraso" · …
- legenda: <estilo>, <n> grupos, palavras-chave na cor do canal; correções de transcrição: …
- som: <n> efeitos (biblioteca do HyperFrames), trilha <clima> com carve, master −14 LUFS
- para mudar: edite cortes/<nome>/plano.json e rode montar_vertical.py; depois render + master
```

Depois de entregar: diga em uma linha que qualquer ajuste está a uma frase de distância ("troca o texto do card 3", "tira o glitch", "trilha mais tensa").
