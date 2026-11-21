# Peças do kit (bit-kit.js)

Tudo começa com `const K = BIT(tl, DUR);`. Os tempos são segundos do vídeo, tirados da transcrição do corte.

## Fundo e câmera
| Peça | O que faz | Quando |
|---|---|---|
| `K.fundo(trechos)` | Grade de pontos que desce, duas luzes passeando, grão e um zoom lento do palco a cada trecho `[[ini, fim], ...]` | Sempre. Um trecho por bloco do roteiro (gancho, passos, entrega, CTA) |

## Janelas (interface estilo Mac)
| Peça | O que faz | Quando |
|---|---|---|
| `K.janela(id, titulo, x, y, w, h, html)` | Janela escura com os 3 botões e o título | Base de qualquer tela: app, pasta, chat, checkout, timeline |
| `K.terminal(id, titulo, comando, itens, t0, tDigita, tItens, tSai)` | Janela que digita um comando e mostra linhas com ✓ | Gancho ("edita esse reels pra mim"), instalação, "o Claude fez X" |
| `K.ondas(id, titulo, t0, tSai)` | Janela com ondas de áudio pulsando | Falas sobre voz, áudio, narração |
| `K.checkout(rotulo, preco, t0, tRisco, tSai)` | Card de compra com o preço riscado em vermelho, que depois cai | "tem gente cobrando caro", comparação de preço. **Preço é ilustração: avise** |
| `K.linhas(ids, tempos)` | Faz linhas de uma janela entrarem uma a uma | Arquivos aparecendo, passos de instalação |
| `K.digita(el, texto, t0, passo)` | Digita um texto letra por letra | Prompt, pedido no chat |

## Listas e passos
| Peça | O que faz | Quando |
|---|---|---|
| `K.fichas(pref, itens, t0, tSai, comCheck)` | Até 5 fichas numeradas (01–05) entrando em sequência; com `comCheck`, cada uma ganha ✓ | "são 5 passos", listas, recapitulação no fim |
| `K.trilho(tempos, t0, tSai)` | Bolinhas numeradas no topo que acendem em cada passo, com "PASSO N DE M" | Tutorial em passos: deixa visível em que passo está |
| `K.salvar(t0, tCheio, tSai, rotulo)` | Marcador de salvar que se desenha e enche de amarelo | "salva esse vídeo" |
| `K.carimbo(texto, t, tSai, x, y)` | Carimbo vermelho batendo | Aviso, "não é o site", "errado" |

## Entrega e CTA
| Peça | O que faz | Quando |
|---|---|---|
| `K.cartao(icone, titulo, sub, x, t, efeito)` | Card com ícone (`pdf`, `pacote` ou SVG próprio) | O que a pessoa recebe: PDF, skill, lista |
| `K.selo(texto, x, y, t)` | Selo amarelo inclinado | "pronta pra usar", "grátis" |
| `K.teclas(PALAVRA, chamada, t0, tAperta, tDirect)` | A chamada ("comenta"), as teclas caindo e sendo apertadas no momento em que a palavra é falada, e o botão "no direct" | **Sempre no fim.** É a assinatura do estilo |

## O Bit
`const bit = K.bit();` e depois:
| Ação | Uso |
|---|---|
| `bit.chega(t)` | Entra no começo (0,3–0,5 s) |
| `bit.aponta("E" ou "D", ângulo, t, até)` | Aponta para a janela. "E" com ângulo positivo (95 = para cima/esquerda); "D" com negativo |
| `bit.acena(t)` | Concorda com a cabeça: "você não precisa", "é só isso" |
| `bit.pula(t)` | Alegria rápida quando algo aparece (pasta, resultado) |
| `bit.balanca(t)` | Balança no ritmo da voz, com a antena piscando |
| `bit.susto(t, até)` | Olhos arregalados e "!" para preço, erro, surpresa |
| `bit.pisca([t...])` | Piscadas a cada 3–5 s, para ele parecer vivo |
| `bit.some(t)` / `bit.volta(t)` | Sai quando a tela precisa de espaço (fichas ocupam até y 1016) |
| `bit.poe(x, y, escala, t)` / `bit.vaiPara(x, y, escala, t)` | Reposiciona. No CTA: `poe(-660, 30, 0.7)` (canto esquerdo, menor) |
| `bit.comemora(t)` | Braços para cima no "no direct" |

## Legenda
`K.legendas(/*LEG*/[]/*FIM*/)` recebe o que o `legendas_bit.py` gera. Não escreva na mão.

## Fecho obrigatório
```js
K.fim();
window.__timelines = window.__timelines || {};
window.__timelines["main"] = tl;
```
