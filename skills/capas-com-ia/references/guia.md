# Guia da capa caprichada (o método que funcionou)

Testado em novembro de 2026 em capas de Reels e de YouTube aprovadas de primeira. O que fez diferença:

1. **Gerar a capa inteira no GPT Image 2.6, com referências**, em vez de montar peças. Qualidade `high`, `2k`, uma imagem por vez.
2. **Image 1 = o modelo de arte**: uma capa da própria pessoa que deu certo (ou a do kit, em `arte/`). O gerador copia o estilo, a luz e o acabamento dela. Sem modelo de arte, sai "cara de IA".
3. **As outras imagens = o que é real**: quadros do vídeo (saídos do `quadros.py`), prints, a foto do produto, o logo oficial. Elas entram **dentro de telas** (celular, notebook) e o prompt pede para manter cada uma sem mudar.
4. **O texto exato entre aspas**, linha por linha, dizendo qual parte vai na cor de destaque. Acentos escritos certinho.
5. **Conferir na imagem final**, letra por letra. Errou: gere de novo só aquela.

## Modelo de prompt (em inglês: o gerador entende melhor)
Troque o que está entre `< >`. Numere as imagens na ordem do `medias` do `generate_image` (a ordem em que você mandou os `media_id`).

```
Vertical 9:16 Instagram Reels cover for a Brazilian content creator. Image 1 is the art reference: copy its style and
finish exactly (<descreva o que vê nela: fundo, luz, tipo de letra, cores>). Ignore any numbers, view counters and
magnifying circles in Image 1. Vertical layout: the text block in the upper part, starting about 15% from the top; the
main visual in the middle; every important element between 14% and 84% of the height, the top 12% and the bottom 15%
only background. Screens show the given images unchanged and fully visible. No other text than the one given, no
watermark, no neon, no light beams, no lens flares.
Images 2 and 3 are real frames of the video: show them on the screens of two smartphones side by side in a slight fan,
Image 2 in front and bigger. <Image 4 is the logo: a glossy 3D app icon of it floating above the phones.>
Text exactly, Brazilian Portuguese with accents: first line "<LINHA 1>" in white, second line "<LINHA 2>" in <a cor de
destaque, ex.: premium gold gradient / the brand color #RRGGBB>.
```

**YouTube (16:9):** comece com `YouTube thumbnail 16:9 for a Brazilian content creator.`, troque o layout por `big text
on the left half, the main visual on the right half, keep the bottom-right corner empty (video duration badge)` e use
até 3 ou 4 palavras.

## Ideias de cena que funcionam (escolha uma por capa)
- **Celulares com o resultado:** 2 ou 3 celulares lado a lado com quadros do vídeo (o mais usado; serve para quase tudo).
- **Antes → depois:** um celular apagado com o "antes" (áudio bruto, vídeo cru) e outro aceso com o "depois", uma seta curva entre eles e etiquetas "ANTES"/"DEPOIS".
- **O jeito velho x o novo:** à esquerda o jeito antigo, menor e sem cor, com um X vermelho; à direita o novo, maior, com um visto na cor de destaque.
- **Mapa/assunto:** o quadro do mapa ou do tema na tela, com um objeto 3D pequeno ligado ao assunto (bandeira em alfinete, ferramenta, produto).
- **Notebook:** um notebook de lado, numa mesa escura com luz quente, com o resultado na tela (bom para YouTube).

## O que deixa com cara de IA (evite)
- Neon, feixes de luz, palco com holofote, brilho dourado exagerado, partículas.
- Robô genérico, cérebro brilhante, mão de robô.
- Texto pequeno demais, mais de 2 linhas grandes no vertical, frase inteira na capa.
- Logo desenhado à mão (peça sempre o logo real como imagem de referência e "glossy 3D app icon").
- Todas as capas do perfil iguais: varie a cena e mantenha a mesma família (fundo, letra, cor).

## Títulos (YouTube)
- Até ~60 letras, assunto nas primeiras ~40.
- 1 de busca: "Como Fazer/Criar … com IA (Passo a Passo / Tutorial Completo)".
- 2 de feed: curiosidade ("Esse Vídeo Não Passou Pelo After Effects") e prova ("Fiz 30 Vídeos em 1 Dia Sem Editar Nenhum"), só com números reais.
- O título dá o contexto; a capa mostra o resultado. Se o título e a capa têm as mesmas palavras, troque uma das duas.
- O padrão que mais supera a média nos canais de criação de conteúdo: "Como Criar Esses Vídeos com <ferramenta>" + a capa mostrando "esses vídeos".
