# Modo Reels gravado

A pessoa gravou o próprio vídeo falando para a câmera (celular ou câmera, quase sempre já em pé) e quer a edição pronta. Não há escolha de trecho: o vídeo inteiro é o corte. As fases são as mesmas; mudam os pontos abaixo.

## Pastas
Se o projeto tiver as pastas do passo a passo, use: `Bruto/` (o vídeo gravado), `Referencias/` (vídeos com o estilo que a pessoa quer) e `Imagens/` (logo, prints e fotos da pessoa para usar nas cenas, com `imagem` do catálogo). Crie `Prontos/` se não existir e entregue lá o arquivo final, além de `cortes/<nome>/entrega/`.

## Referências de estilo
Se houver vídeos em `Referencias/` (ou links: baixe com `yt-dlp` para essa pasta, só para estudar), olhe antes da Fase 6: tire uma folha de contato de cada um (`ffmpeg -i ref.mp4 -vf "fps=1/2,scale=270:-1,tile=6x3" ref.jpg`) e descreva em 4 linhas o que define o estilo: legenda (fonte, caixa, cor, quantas palavras), ritmo de cortes, zoom, b-rolls, som. Leve isso para o `plano.json` (estilo da legenda, densidade de cenas, cor de destaque). Inspire-se; não copie marca, logo ou texto de ninguém.

## Fase 4: o corte bruto
Quem grava sozinho erra e repete. A regra é **ficar com a última tentativa completa** de cada frase:
- frase começada e abandonada ("então, o primeiro... não, peraí") → sai tudo até o recomeço;
- a mesma frase dita duas ou três vezes → fica a última que saiu inteira e sem tropeço;
- silêncio antes de recomeçar, "corta", "de novo", estalo de língua, risada nervosa → sai;
- pausa dramática curta que a pessoa claramente quis → fica.
Na `decupagem.md`, liste cada tentativa removida com o tempo, para a pessoa conferir. Nenhuma palavra da versão final pode ser comida.

## Transcrição para decupar
Para quem grava sozinho, transcreva com o modelo `small` (não o `large`): o grande junta tentativas repetidas numa frase só e estica o tempo das palavras, e aí a repetição some da transcrição. Depois do corte, confira com `qa_corte.py`. Se o `cortar.py` avisar "pedaço descartado", o override daquele trecho caiu numa palavra esticada: ajuste o tempo no `edl.json`.

## Voz limpa (opcional)
Se a pessoa quiser a voz com som de estúdio, ela sobe o áudio **do corte bruto** no Adobe Podcast (Enhance Speech, grátis no site), baixa o tratado e põe na pasta do corte. O arquivo tratado tem a mesma duração: use ele no lugar do áudio do corte (`ffmpeg -i corte_bruto.mp4 -i voz_limpa.wav -map 0:v -map 1:a -c:v copy corte_limpo.mp4`). O Adobe não tem API: esse passo é sempre manual, da pessoa.

## Velocidade (opcional)
Quem fala devagar pode acelerar o corte sem mudar o tom da voz: `scripts/velocidade.py corte_bruto.mp4 corte_rapido.mp4 --fator 1.2`. Faça isso **depois** do corte e da voz limpa e **antes** da transcrição do corte (os tempos da legenda têm que ser os do vídeo acelerado).

## Só voz (sem rosto)
A pessoa pode gravar só o áudio (celular perto da boca, lugar quieto). Aí:
1. Transforme o áudio em vídeo com fundo: `scripts/so_voz.py Bruto/voz.m4a Bruto/voz.mp4` (fundo escuro; `--fundo imagem.png` para outro).
2. Siga o fluxo normal (corte, voz limpa, velocidade, transcrição). Pule o enquadramento: não há rosto.
3. Na edição, as cenas cobrem a tela inteira o tempo todo. O estilo pronto para isso é o **Bit** (`estilo-bit.md`); a `colagem` também serve.

## Fase 5: enquadramento
Vídeo já vertical (9:16): o rosto já está no quadro. Rode `enquadramento.py` mesmo assim, para os punch-ins nas emendas terem o centro certo. Vídeo horizontal: reenquadre como no podcast.

## Fase 6: plano
- **Gancho**: os 3 primeiros segundos precisam prender. Se a frase mais forte estiver no meio, sugira à pessoa (não faça sem perguntar) abrir com ela.
- **Cenas**: menos card dividido que no podcast, porque o rosto da pessoa é o centro. Prefira palavra e adesivos por cima, tela cheia nas viradas, e um card dividido quando ela explica um passo ou um número.
- **Zoom**: alterne aberto e fechado nas emendas, para disfarçar o corte.
- **Legenda**: a do estilo escolhido em `marca.json`; com referência, use a mais parecida.
- **CTA**: se a pessoa falar "comenta X" ou "link na bio" no fim, destaque a palavra em tela cheia.

## Entrega
Copie o vídeo final também para `Prontos/`. Feche dizendo que qualquer ajuste é uma frase ("deixa os 3 primeiros segundos mais fortes").
