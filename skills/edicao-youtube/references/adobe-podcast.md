# Melhorar a voz no Adobe Podcast e trazer de volta (obrigatório antes do render final)

Regra dura 7 do `SKILL.md`: sem a voz tratada não sai o vídeo final, exceto se o áudio já veio tratado (`esv2` no
nome ou a pessoa disse que tratou). Entregue a pasta abaixo com um `LEIA.txt` curto (o que subir, onde, onde devolver).

O Enhance Speech do Adobe Podcast não tem API: a pessoa sobe e baixa os arquivos. A skill entrega a fala pronta para
subir e encaixa a melhorada de volta, no lugar exato. `S=~/.claude/skills/edicao-youtube/scripts`.

## Ida
Pasta `$V/audio-adobe-podcast/` com:
- `1-intro-voz.wav`: a voz da intro já pronta (o `assets/voz.wav` da pasta HyperFrames, em mono);
- `2-gravacao-voz-cortada.wav`: `$PY -I $S/audio_adobe.py exportar "$V/trabalho" <saida.wav>` — a fala JÁ CORTADA;
- uma subpasta `melhorado/` para ela devolver.
Mande a fala cortada: o plano grátis aceita até 30 min e 500 MB por arquivo (1 h por dia); o bruto inteiro de uma
aula não passa (confira os limites atuais em podcast.adobe.com/en/plans).

## Volta
O Adobe devolve o arquivo com outro nome (`<nome>-esv2-70p-bg-20p-music-m.wav`). Não peça para renomear: o
`audio_adobe.py` aceita a pasta `melhorado/` (ou o nome original) e usa o `.wav` mais novo que está lá. Quem espera
o arquivo (um vigia) deve olhar qualquer `.wav` dentro de `melhorado/`, não um nome exato. No `LEIA.txt`: "baixe e
salve em `melhorado/` (o nome que o Adobe der serve)".
- Gravação: `audio_adobe.py voltar "$V/trabalho" melhorado.wav "$V/premiere/gravacao-audio-melhorado.wav"
  --igual <pasta HF>/assets/voz.wav --limitar` → no tamanho do bruto (melhorado nos trechos cortados, original nas
  sobras), no mesmo volume da voz da intro (sem pulo na emenda intro → aula). Use como `--audio` no `renderizar.py`,
  no `premiere_xml.py` ou no `premiere_refazer.py`.
- Intro: `audio_adobe.py igualar assets/voz_original.wav melhorado.wav assets/voz.wav --estereo` (o Adobe baixa a
  voz: volta ao nível original +2 dB) e `mixar_intro.py ... --video <render que já existe>` (só o som muda).
- Ida e volta sem mudar nada devolve o bruto idêntico (testado); se o comprimento voltar diferente, o script para.

## Som do computador (vídeo tocando na tela)
Se o OBS gravou o som interno baixo (ou não gravou), o Adobe amplifica o resto e "inventa" fala estragada. Depois do
`voltar`, rode `audio_adobe.py conferir "$V/trabalho" <melhorado_bruto.wav>`: lista os trechos de "som inventado" ou
"apagado". Para cada um, ache o arquivo do vídeo que tocou (olhe o quadro do bruto) e sincronize pela IMAGEM (área do
vídeo na tela × quadros da fonte, o deslocamento de maior correlação) ou pelo áudio se vazou. Então:
- 100% no Claude: `audio_adobe.py tela <melhorado_bruto> <saida> --bruto <gravação> --demo fonte.mp4@INICIO[@FIM]`
  (som limpo no lugar, no volume da voz), ou ponha o próprio vídeo por cima;
- Premiere: prefira o som em faixas embaixo de cada trecho, para ela ajustar (`premiere_refazer.py --demo`).
Dica para a pessoa: no OBS, gravar o som do computador numa faixa separada da do microfone
(Propriedades avançadas de áudio → faixas), para ele não passar pelo Adobe.
