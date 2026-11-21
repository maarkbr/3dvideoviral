# Som

Tudo feito em código: sem banco de sons, sem IA paga. São duas partes:
- **o motor** (`<skill>/animado/scripts/som.mjs`): os efeitos, a trilha e a mixagem. Serve para todo vídeo.
- **a lista do vídeo** (`<pasta>/som/deixas.mjs`): quais sons tocam e em que palavra.

Gerar (na pasta palitinho):
```
node <skill>/animado/scripts/som.mjs <pasta-do-video>
```
Sai `audio/mix.wav` (voz + efeitos + trilha), que a página do vídeo já usa. Também saem as partes separadas em `audio/partes/` e a lista do que tocou em `audio/partes/marcas.json`.

## A lista do vídeo (deixas.mjs)
```js
export const config = {
  duracao: 43.6,                                   // igual ao data-duration
  narracao: 'audio/narracao.mp3',
  trilha: { bpm: 100, acordes: [...], tensao: { de: ['passos'], ate: ['segurança', 6] }, acordeFinal: [57, 64, 69], volume: -16 },
};
export function deixas({ W, B, poe, efeito }) {
  poe('cama: pop', W('cama', 1), 0.55, efeito.pop());   // nome, tempo, volume, som
}
```
**Regra:** o som de um objeto começa na mesma palavra em que ele entra, nunca antes.

## Efeitos prontos
| efeito | soa como | usado em |
|---|---|---|
| `pop()` | estalinho que sobe | objeto entrando |
| `saida()` | assobio curto descendo | objeto saindo |
| `whoosh(dur, f0, f1)` | vento passando | câmera virando, alguém chegando |
| `tranca()` | trinco de metal + porta de enrolar | "trancado" |
| `tique(alto)` | tic ou tac | relógio |
| `dong()` | badalada de sino | "meia-noite" |
| `zumbido(dur)` | geladeira ligada | "ligada" |
| `ding()` | brilhinho | coisa boa, "comenta" |
| `rangido(dur)` | porta rangendo | "rangido", "aberta" |
| `sustoForte()` | pancada de orquestra + tímpano | o ponto de exclamação |
| `passo()` | passo no piso | passos chegando |
| `clique()` | clique de lanterna | "aponta" |
| `plim()` | brilho fino | olhinhos no escuro |
| `boing()` | mola | acordar, levantar as mãos |

Para criar um efeito novo, acrescente no objeto `efeito` do motor (seno, ruído, filtro e envelope).

## Trilha
- Mistério em lá menor, 100 batidas por minuto: fundo de teclado, pizzicato nas colcheias e baixo.
- **Trecho de tensão** (`tensao`): o pizzicato para, entra um coração acelerando e um som subindo até o fim do trecho.
- A trilha **abaixa sozinha enquanto a voz fala**.
- `volume: -16` = trilha 16 dB abaixo da voz.

## Mixagem
- Volume final: **-14 LUFS**, com um limitador para o pico não passar de -1,5 dBTP.
- O motor mostra no final: `mix final: -14.1 LUFS, pico -4.2 dBTP`.

## Importante
Quem faz o vídeo aqui **não ouve o som**: só mede. Depois de gerar, peça para quem pediu ouvir na prévia (no painel do app) e dizer se algum efeito está alto, baixo ou fora de lugar.
