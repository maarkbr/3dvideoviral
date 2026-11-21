# Motion: anúncio de produto

Estilo: `motion` (skill `estilo-motion`) · Motion design · SaaS, infoproduto, serviço. 28 s, 8 cenas, narração (ElevenLabs).

## O que copiar deste modelo
- A estrutura: dor (frase com palavra-chave) → agravante → a marca entra (logo, com o círculo de transição) → o que faz (recursos em volta do nome) → benefícios (lista com checks) → como funciona (celular com conversa) → preço ou prova (número no anel) → chamada final (botão com cursor clicando).
- Uma informação por tela, texto entra e fica parado, a cor da marca só na palavra-chave, nos checks e no botão.

## Como usar
1. `codigo/roteiro.json` é o roteiro deste anúncio: use-o como **formato** e troque todas as falas, cenas, textos e o botão pelo produto do cliente. Nenhum texto do Edição com IA pode sobrar.
2. A marca (cor, logo, nome, tema claro ou escuro) vem do `marca.json` do projeto: o `montar_motion.py` aplica sozinho.
3. Material do cliente: prints do app em `assets/` viram a tela do `celular` (campo `imagem`); fotos boas viram cenas `foto` (vitrine). Com 6 ou mais fotos, use mais `foto` e menos tipografia.
4. Número, preço e prova só se o cliente deu. Senão, a cena vira `lista` ou `frase`.
