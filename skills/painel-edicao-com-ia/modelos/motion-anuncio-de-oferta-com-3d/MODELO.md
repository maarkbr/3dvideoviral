# Motion: anúncio de oferta com 3D

Estilo: `motion` (skill `estilo-motion`) · Motion design · curso, infoproduto, oferta com bônus. 32 s, 11 falas, narração com voz de IA, 9:16 (e 4:5 para o feed). Feito 100% em código (HyperFrames + GSAP) para o anúncio do próprio Edição com IA.

## O que copiar deste modelo
- **A sequência da oferta:** gancho ("este anúncio foi feito por…", texto entrando letra a letra, caixa na palavra-chave) → o produto num **notebook 3D** com os prints reais → o que vem dentro num **carrossel 3D de celulares** tocando os exemplos, com a pílula do nome de cada um → **prateleira 3D** com as capas dos módulos → **leque** com as capas dos bônus → preço grande → selo de garantia → requisitos → chamada final com **botão e mão clicando**.
- **O acabamento:** fundo vivo (brilho, chão em grade em perspectiva e partículas), legenda de 1 a 3 palavras com a palavra-chave na cor da marca, um efeito sonoro em cada troca (whoosh), impacto nos números, caixa registradora no preço, clique no botão, trilha com ducking e −14 LUFS.
- **O ritmo:** uma informação por fala (6 a 14 palavras), e cada coisa aparece na tela na hora em que a voz fala dela.

## Os arquivos de `codigo/`
- `roteiro.json`: as 11 falas. É o formato: troque todas pelas da pessoa.
- `modelo.tpl`: as cenas e a linha do tempo (HTML + CSS + GSAP). `build.py` monta o `index.html` a partir dele: `python3 build.py 9x16` (Reels/Stories) ou `python3 build.py 4x5` (feed).
- No `build.py`: `W` são os tempos das palavras-chave (tire do Whisper da voz nova, nunca deixe os deste modelo), `ITENS` e `CAR` são os vídeos do carrossel e o nome de cada um, `CAPAS` a prateleira, `LEG` a legenda com a palavra-chave entre `*`.
- `mapa-do-som.json`: onde cada efeito cai e em que volume. Use os efeitos do pack da pessoa (ou do SFX Kit) com a mixagem do `estilo-motion`.
- As mídias (`assets/`: prints, vídeos, capas, fontes Montserrat e Instrument Serif, `gsap.min.js`) **não vêm junto**: são as da pessoa. Montserrat e o GSAP estão no `kit/` da skill; Instrument Serif é grátis (Google Fonts, OFL) ou troque por outra fonte com itálico.

## Como usar
1. Nada do Edição com IA pode sobrar: nome, "oito estilos", "três bônus", "54 temas", R$ 37, "7 dias", "Claude Pro", os prints e as capas. Tudo vem do produto da pessoa (`marca.json` para cor, logo e nome).
2. Preço, garantia, número de módulos ou de bônus só se a pessoa deu. Sem bônus, tire o leque; sem prints do produto, o notebook mostra o site ou uma tela simples da marca; com menos de 4 exemplos, o carrossel vira 3 celulares parados lado a lado.
3. Requisitos (o que a pessoa precisa ter para usar) só se existirem de verdade.
4. Confira a pronúncia da narração ouvindo (nomes de marca, siglas e palavras em inglês saem errados com facilidade; escreva como se fala, ex.: "I.A.", "três D") e refaça só a fala errada.
