# Corte de podcast: entrevista

Estilo: `cortes-podcast` (skill `editor-ia`, parte de cortes) · Cortes de podcast · podcast, videocast, entrevista. 82 s, vertical 9:16.
Um corte de verdade, editado pelo Claude a partir de um episódio inteiro: abre com o título do gancho, segue com o rosto reenquadrado na metade de baixo e b-rolls animados na de cima, legenda palavra a palavra com destaque, punch-ins nas emendas, efeitos discretos e trilha baixa.

## O que copiar deste modelo
- O corte: começa na frase mais forte do trecho (o título do gancho repete essa frase), sem silêncio, erro ou tangente, e termina num fecho que dá vontade de ver o episódio.
- A tela dividida: b-roll animado em cima (um por ideia: bandeira, urna, número contando, chat, troféu) e o rosto embaixo, sempre centralizado; nas falas sem b-roll, o rosto ocupa a tela inteira.
- A legenda de 1 a 3 palavras com a palavra-chave em destaque e os punch-ins para esconder cada emenda.
- O som: voz na frente, efeitos bem abaixo, trilha baixinha que abaixa sozinha na fala, master em −14 LUFS.

## Como usar
1. Siga a skill `editor-ia` no modo cortes: a pessoa manda o episódio (ou o trecho com o tempo de início) e o Claude acha os melhores momentos.
2. `codigo/index.html` é a montagem deste corte no HyperFrames e `codigo/compositions/` traz os b-rolls animados (um arquivo por ideia). Use como base: troque o vídeo, a fala, a legenda e os b-rolls pelos do episódio da pessoa. O `lib/` (fontes e kit de b-roll) vem do template da skill.
3. O podcast do exemplo é de outro criador (Raul Sena): nada dele (rosto, nome, fala, tema) pode ir para o vídeo da pessoa.
