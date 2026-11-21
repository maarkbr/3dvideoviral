# A régua do estilo Colagem (confira item por item, nos quadros e no vídeo)

Feita a partir da análise quadro a quadro de 5 Reels de colagem que viralizaram (30 quadros por segundo, cada quadro comparado ao anterior). Um item que falhar volta para a `cena.js`.

## Imagem
1. **Cada frase tem uma peça nova, na palavra.** A foto, a etiqueta, o número ou o pino entra no quadro em que a voz fala a palavra (até 3 quadros de diferença).
2. **Ritmo:** corte de cena a cada 2,5 a 4 s; nunca mais de ~2 s sem nada novo entrando. A câmera empurra devagar sempre (nada fica 100% parado).
3. **Foto parece colada à mão:** borda branca, 2 fitas lilás translúcidas, sombra, giro de 1° a 4° (nunca reto), papel colorido atrás em parte das fotos. Foto pequena demais (menos de 40% da largura) só como segunda peça.
4. **Uma ideia por vez:** no máximo 3 peças na tela; a nova não cobre o rosto/assunto da foto; nada importante embaixo de 1640 px nem em cima de 330 px.
5. **A assinatura do estilo em todo vídeo, mesmo de 15 s:** foto colada com fita + um traço à mão (seta, círculo, fio ou contorno do mapa) ou carimbo + um número (selo, ficha com número, ano, lista). Se a história tem lugares, **um mapa**.
6. **Cores:** fundo cinza de papel na maior parte; uma cena colorida (amarelo, laranja, azul ou vermelho) a cada 3 ou 4 para respirar; vermelho só para o que é marcação (seta, círculo, carimbo, número).
7. **Nada de emoji, nada de ícone de banco de imagem, nada de foto sem licença.**

## Legenda
8. **No topo, em serifa:** a palavra-chave grande, as ligações ("de", "no", "o") pequenas; a frase com a palavra da `enfase` em itálico. Ligações do começo ("é a", "para o") sobem para a linha pequena de cima.
9. **Palavra por palavra:** cada palavra aparece com desfoque em ~4 quadros no instante em que é falada; a frase some rápido antes da próxima.
10. **Legível no celular:** sobre fundo claro (mapa, folha amarela) a legenda fica escura ou vira etiqueta preta; nunca branco sobre creme.
11. Até 3 palavras principais por frase. Nome próprio e número sempre certos (corrija com `preparar.py --corrigir`).

## Som
12. Voz clara na frente; trilha de batida leve ~16 dB abaixo; efeitos curtos e baixos só onde uma peça entra (papel, pop, carimbo, caneta). Sem whoosh em toda troca, sem efeito de videogame.
13. −14 LUFS, pico até −1 dBTP; o efeito cai no quadro da peça (earshot timeline).

## Fim
14. Se tem CTA: celular com o perfil e o "Seguir" sendo tocado, ou "Comenta PALAVRA" em letras de papel. Folga de ~0,6 s depois da última palavra.

## Como olhar
- `work/conferencia/entradas.jpg`: cada peça logo depois de entrar (itens 1, 3, 4, 5, 10).
- `work/conferencia/folha.jpg`: 2 quadros por segundo (itens 2, 6).
- Movimento: tire 30 quadros seguidos de uma entrada (`ffmpeg -ss <t> -t 1 -i <vídeo> -vf "fps=30,scale=216:-2,tile=6x5" -frames:v 1 entrada.jpg`) e compare com a mesma peça na referência: a peça deve chegar em 4 a 7 quadros, rápida no começo.
- Lado a lado: `PY scripts/lado_a_lado.py <referência.mp4> <seu vídeo.mp4> <saída.mp4> [--inicio-ref 13]`.
