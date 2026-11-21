# Voz e tempo de cada palavra

## A narração
- Vem pronta de quem pediu o vídeo (gravada ou feita numa voz de IA por conta própria). **Aqui não se gera voz nem se gasta crédito.**
- Formato: mp3 ou wav.

## 1. Transcrever no computador
```
PY <skill>/animado/scripts/transcrever.py <pasta-do-video> <arquivo-da-narracao>
```
- Copia a narração para `<pasta>/audio/`.
- Usa o Whisper local (modelo `small`, português), com `--engine whisper` (o motor `heygen` é pago e não é usado).
- Gera `audio/transcript.json` com o tempo de cada palavra que a voz falou.

## 2. Casar com o roteiro
```
PY <skill>/animado/scripts/casar_palavras.py <pasta-do-video>/roteiro.md <pasta-do-video>
```
- Junta as palavras do roteiro com os tempos da transcrição.
- As palavras ficam escritas como no roteiro (ex.: "tá"), com o segundo em que a voz falou.
- Grava `audio/palavras.json` e `audio/palavras.js` (é este que a página do vídeo lê).
- Mostra:
  - quantas palavras bateram direto e as diferenças (ex.: o roteiro diz "tá" e a transcrição ouviu "está"; pode ser a voz ou o Whisper; não muda o tempo);
  - a tabela de cada bloco (começa, termina, duração) e se está dentro dos 5 a 8 s;
  - a duração sugerida do vídeo: fim da fala + 1,8 s.

## Como conferir se os tempos estão certos
Procure as pausas do áudio:
```
ffmpeg -i <narracao> -af silencedetect=noise=-35dB:d=0.25 -f null - 2>&1 | grep silence_
```
Onde há pausa, a palavra seguinte deve começar logo depois do fim da pausa (no vídeo do shopping, até 0,03 s depois). O fim de uma palavra o Whisper às vezes estica para dentro da pausa: o que importa para a regra é o **início**.

## Mostrar para quem pediu
Uma tabela com o tempo de cada bloco e outra com as palavras dos objetos (palavra, segundo, o que acontece).
