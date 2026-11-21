# Palitinho caprichado: 1 real por segundo

Estilo: `palitinho` (skill `estilo-palitinho`) · Palitinho · curiosidades, dinheiro, números. 40 s, 7 blocos narrados, voz Marcus, **modo caprichado**: cada cena desenhada no Higgsfield (GPT Image 2.6, 1 crédito) com o mesmo personagem e animada no Seedance 2.0 Mini (5 s, 5 créditos), com o número contando, a legenda e o comenta feitos em código por cima. Por volta de 40 créditos no total.

## O que copiar deste modelo
- **O mesmo roteiro do modelo simples**, com as cenas trocadas por `"tipo": "ilustracao"` (`imagem`, `prompt` em inglês com "our character", `animar`, `texto_na_imagem`, `camera`) e números/CTA com imagem de fundo.
- **O personagem fixo:** a folha de estilo (`ref/estilo.png`; o padrão da skill é `assets/estilo-padrao.png`, rapaz de palito com camiseta azul). É ela que deixa o vídeo inteiro com o mesmo boneco e o mesmo traço.
- **A composição:** o importante entre 8% e 62% da altura; de 64% a 80% fica livre para a legenda.
- **O que vai por cima em código:** o número contando, rótulos com seta, círculo vermelho, selo e o comenta.

## Como usar
1. `codigo/roteiro.json` é o formato. Siga `references/modo-caprichado.md` da skill: mostre o custo antes (`gerar_cenas.py --custo` e `animar_cenas.py --custo`, ou o `get_cost` do MCP) e só gere depois que a pessoa aprovar.
2. No painel, o Higgsfield entra pelo conector do app do Claude (`--mcp` e `--resultados` nos dois scripts). Cada geração vira um cartão de permissão.
3. Confira a folha das cenas (o mesmo personagem, o texto do desenho letra por letra, a faixa da legenda limpa) antes de animar. Cena errada: `--so N`.
4. **O CTA final é da pessoa:** troque a palavra (PALITO), o selo e a frase. Nada do Lucas Editor pode sobrar, nem no desenho.
