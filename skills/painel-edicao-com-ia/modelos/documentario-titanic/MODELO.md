# Documentário: o navio que não podia afundar

Estilo: `documentario` (feito 100% com IA pela skill `estilo-documentario` 2.0) · história, tragédias, curiosidades. 51 s no 9:16 (47 s de história + o "Comenta DOC"), narração com voz de IA (ElevenLabs, voz Marcus), fotos reais em domínio público.

## O que copiar deste modelo
- A viagem entre lugares: Southampton → Atlântico Norte → Nova York → de volta ao fundo do mar. A rota tracejada anda com a câmera, com o navio na ponta e o nome do mar embaixo, e o nome de cada lugar fica escrito a tinta no mapa.
- A assinatura inteira, mesmo num vídeo curto: o ano a tinta (1912, 1985), a citação datilografada ("praticamente inafundável"), o aviso de gelo real do rádio, a foto com o círculo de caneta (o iceberg), o recorte de jornal real traduzido com o carimbo AFUNDOU na palavra e a ficha que risca o número errado do jornal (1.250) e escreve o certo (mais de 1.500).
- A virada no escuro: a luz apaga no "onze e quarenta da noite" e a luminária acende sobre o iceberg.
- O fecho que volta ao começo: "o navio que não podia afundar continua lá embaixo".

## As etapas que a skill seguiu (portões 0 a 9)
1. Modelo e esforço (Opus, esforço alto), formato 9:16 e duração de até 60 s.
2. Pesquisa com fontes (Britannica, NOAA, The Shipbuilder 1911, a capa real do NYT de 16/4/1912) e roteiro em 4 blocos, uma ideia por frase.
3. Voz: ElevenLabs pelo Higgsfield, com o custo mostrado antes (2,99 créditos), gerada uma vez; o Whisper conferiu as 113 palavras.
4. Fotos com licença (Wikimedia Commons: Titanic em Southampton, iceberg e bote de Louis Ogden, destroço da NOAA) e quadros parados de cada beat, conferidos pela régua antes de gerar.
5. Edição: render no HyperFrames, efeitos automáticos, trilha em três trechos (morre no apagão e cresce no fim), filme antigo e master em -14 LUFS.
6. Ciclo de conferir e consertar (`conferir.py` e o conferidor oficial) até APROVADO; consertos feitos no caminho: folha do aviso mais larga, ficha que cortava na borda, círculo escondido sob o carimbo, apagão longo demais, pausas da voz acima de 0,6 s encurtadas (sem gerar voz nova).

## Como usar
1. A base do projeto é o `modelo/` da skill (`novo_projeto.py` copia). Escreva a história na `cena.js` seguindo `references/cena.md` (este exemplo, em versão curta, está em `references/exemplo-titanic/`).
2. Nada desta história pode sobrar (Titanic, Southampton, os anos, o jornal e os números) a não ser que o tema da pessoa seja o mesmo.
3. Fotos só com licença (domínio público ou Creative Commons, com o crédito em `fotos/creditos.md`); jornal, citação e números só reais e com fonte; nunca invente data, número ou citação.
4. Navio ou avião na rota só onde ele foi de verdade (o Titanic nunca chegou a Nova York).
5. O "Comenta DOC" no fim é do Lucas Editor: use a palavra do pedido da pessoa ou tire.
