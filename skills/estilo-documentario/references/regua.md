# A régua (o que conferir nos quadros antes de gerar e no vídeo final)

Tirada das regras do pedido original e das correções que fizeram o documentário da IA ficar bom.

## Leitura
1. **Uma ideia por frase, um destaque aceso por vez.** Frase com um nome e uma ideia pode ter dois destaques em sequência: quando a ideia entra, a foto apaga.
2. **Cada frase aparece na tela uma vez só:** ou num documento real, ou datilografada; nunca as duas. Sem legenda corrida.
3. **Nada de texto de enchimento.** Corpo de documento é linha cinza.
4. **Letra grande:** se não dá para ler no celular em um segundo, está pequena ou cheia demais.
5. **Menos é mais:** nada de fita, carimbo, bilhete ou etiqueta que não faça parte da história.
6. **O visual cai na palavra falada:** o ano é escrito enquanto é dito, o círculo na palavra, o carimbo na batida.
7. **Tudo escrito em português** (nome próprio, como o de um jornal, fica no original).

## Câmera (o olho vai para onde a voz fala)
1. **Chega antes da palavra e assenta:** o destaque já está parado, grande e no centro quando a palavra é dita (o motor chega ~0,3 s antes).
2. **Na pausa, não vagueia:** aproxima devagar no próprio destaque, com o giro fixo. Câmera que escorrega de lado ou balança tira o olho do que a voz está dizendo.
3. **Viagem com intenção:** entre dois lugares longe, abre até caber os dois e a rota, segura um instante (o espectador entende para onde vai) e mergulha no lugar novo. A rota, o navio e o nome do mar ficam no meio do quadro.
4. **Entradas e saídas suaves:** nenhuma partida ou parada seca, e nenhum borrão longo. Se a viagem ficar curta demais para ler o mapa, afaste os destaques no tempo (ponha o próximo na palavra seguinte), não acelere.
5. **Confira em sequência, não só parado:** tire quadros a cada 0,4 s nas viagens (`quadros.py --at`) e veja se o olho sabe para onde olhar em cada um.

## Som (o que se ouve combina com o que se diz)
1. **Cada efeito é o som real da cena falada** (papel, máquina de escrever, rádio, impacto, água, sonar, sino), do pack da pessoa, escolhido ouvindo (`references/pack.md`).
2. **Nada sintético nem de meme:** bip de interface, pop de chat e som de jogo ficam de fora. Faltou o som real no pack: a cena fica só com a trilha, e você avisa.
3. **Trilha no tom:** tensão que cresce até a virada, corte no golpe, luto ou revelação no fim; sempre baixa sob a voz.
4. **Um som por vez:** efeito em cima de efeito vira barulho.

## Quadros (o que mais deu errado no original, e o conserto)
| Problema | Conserto |
|---|---|
| Tudo claro e chapado, cara de pergaminho | a luz é de luminária: centro quente, bordas escuras (já vem no motor; não aumente o `amb`) |
| Destaque pequeno num canto, mapa vazio em volta | `ocupa` ou `zoom` maior no objeto; centralize (o motor centraliza) |
| Ano chegando atrasado ou cortado na borda | os `tempos` do ano nas palavras certas; `dx`/`dy` para longe de outros objetos |
| Foto antiga aparecendo atrás do destaque novo | o padrão já tira a anterior; não use `fica: true` em objetos vizinhos |
| Viagem rápida demais, um borrão | dê mais tempo entre os destaques de lugares diferentes (a viagem usa o intervalo) |
| Detalhe pequeno numa foto (uma pessoa no meio da rua) | `circulo` com `zoom` (a câmera mergulha no detalhe) |
| Final com milhares de pontinhos virando chuvisco | menos e maiores, mais devagar (`final.espaco` maior) |
| Mapa vazio (só papel liso em volta do destaque) | ponha o nome em cada lugar (`"paris": [2.35, 48.86, "Paris"]`): o motor escreve o nome e o ponto da cidade acima do objeto; e prefira histórias que viajam entre 2 ou mais lugares: a viagem pelo mapa é a alma do estilo |
| Viagem que passa só papel (meio do oceano) | o motor desenha a rota tracejada com o nome do mar; se o lugar for longe e o tempo curto, ponha `"veiculo"` na rota (só se for fato) ou aproxime os destaques no tempo |
| Nome, ano ou texto do mapa cortado na borda | o motor já esmaece perto da borda; se ainda cortar com a imagem parada, `dx`/`dy`/`tamanho` no 4º item do lugar |
| Sem jornal, círculo ou carimbo | a assinatura entra em todo vídeo, mesmo de 15 s: um recorte real com a manchete traduzida, o círculo de caneta numa palavra e o carimbo na palavra falada (o `montar.py` barra a cena sem eles) |
| Voz robótica (voz do sistema) | a própria voz ou uma voz de IA boa (`references/voz-ia.md`); a do sistema é só prévia |
| Final seco, voz colada no fim | 0,8 s de folga depois da última palavra (`dur`) |
| **Ajuste exagerado** (tudo perto demais e rápido demais) | compare com a versão anterior antes de entregar |

## Som
Voz na frente; trilha cerca de 13 dB abaixo, contida no começo e crescendo para o fim; efeitos só onde algo acontece e sempre abaixo da voz (o carimbo é o mais forte e ainda fica abaixo); -14 LUFS e pico -1 dBTP no final.
