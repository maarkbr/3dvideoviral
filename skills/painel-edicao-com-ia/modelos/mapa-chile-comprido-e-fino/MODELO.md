# Mapas: por que o Chile é tão comprido

Estilo: `mapas` (skill `estilo-mapas`) · Mapas e história · geografia, história, curiosidades. 80 s, 11 blocos narrados, voz ElevenLabs (Marcus), trilha orquestral baixa e efeitos em cada entrada. Tema do Short "Why Chile Is So Long & So Thin" (GeoGlobeTales, 34 milhões de views), com roteiro novo, escrito a partir dos fatos.

## O que copiar deste modelo
- **A estrutura do roteiro:** pergunta-gancho com o número que surpreende (4.270 km) → comparação com o Brasil (país deslizando por cima do outro) → 3 ou 4 causas, uma por bloco (Andes, Pacífico, o pedaço de 1818, o deserto, a guerra, o acordo do sul) → resultado → CTA dizendo que foi feito com IA no Claude.
- **Um fato que explica, por bloco.** Nada de frase genérica: cada bloco tem um ano, um lugar ou um número, e a cena mostra exatamente aquilo (o ano grande, a faixa que muda de cor, o vizinho aceso).
- **O ritmo:** 6 a 8 s por bloco; a câmera se mexe a cada bloco; rótulo ou emoji entra junto com a palavra falada.
- **A legenda:** 1 a 2 palavras, com os nomes de países e os números em laranja (lista `destaques`).

## Como usar
1. `codigo/roteiro.json` é o formato (blocos com `fala` e `cena`, `fontes`, `destaques`, `trilha`). Para outro tema, escreva os blocos novos e escolha, para cada um, a cena do kit mais parecida (lista no `SKILL.md` da `estilo-mapas`).
2. Confira cada número e cada ano na web antes da voz, e liste em `fontes`. Exemplo do que já pegamos: "do Oiapoque ao Chuí" é mito; o Brasil tem 4.394 km de norte a sul, do Monte Caburaí ao Chuí.
3. Números por extenso na `fala` ("mil oitocentos e dezoito"), na tela com algarismo (o `selo` e o `ano`).
4. O CTA final é da pessoa: troque a palavra (`palavra`) e a frase pelo que ela entrega. Nada do Lucas Editor (nome, palavra MAPA, link) pode sobrar.
