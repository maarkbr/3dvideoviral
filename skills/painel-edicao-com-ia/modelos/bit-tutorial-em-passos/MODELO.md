# Bit: tutorial em passos

Estilo: `estilo-bit` · Estilo Bit · tutorial, ferramenta. 56 s, voz do Lucas (clonada), 5 passos.

## O que copiar deste modelo
- A estrutura: gancho (uma janela "funcionando" na tela) → o Bit apresenta → passos numerados em fichas → trilho de passos → CTA com as teclas "comenta PALAVRA" e "no direct".
- O ritmo: uma peça nova a cada 2 a 4 s, sempre ligada ao que a voz está dizendo. Efeitos sonoros discretos (não em toda entrada).

## Como usar
1. Crie o projeto com `python scripts/novo_projeto_bit.py <pasta> --exemplo`: o `index.html` de `codigo/` é o mesmo exemplo. Leia-o inteiro e repita os padrões (`K.janela`, `K.fichas`, `K.trilho`, `K.teclas`, o Bit reagindo).
2. Troque **todas** as falas, as palavras-chave (`chaves.txt`) e o conteúdo das janelas pelo assunto do novo vídeo. A palavra do CTA é a do cliente.
3. A cor de destaque vem do `marca.json` do projeto (o kit lê a variável); não deixe o amarelo do original se a marca for outra.
4. `sons.json`: refaça os tempos para a voz nova (o `legendas_bit.py` e o `sons_bit.py` fazem isso a partir da transcrição).
