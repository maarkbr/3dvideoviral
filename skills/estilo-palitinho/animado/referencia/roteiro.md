# Roteiro

## As três regras do formato
1. **A primeira frase já coloca a pessoa numa situação.** Fala com "você" e já começa no meio da coisa: "Você cochilou numa cama da loja de móveis… e acordou com o shopping inteiro trancado."
2. **Depois vêm momentos curtos, um por bloco, de 5 a 8 segundos cada.** Cada bloco é uma coisa acontecendo (um som, um objeto, alguém chegando). Nada de explicação.
3. **Termina com uma pergunta para a pessoa comentar.** De preferência com duas opções (A ou B), que viram cartões na tela.

Tamanho: uns 45 segundos no total, em 7 blocos.

## Formato do arquivo
Fica em `<pasta-do-video>/roteiro.md` (o `novo.py` cria a partir do modelo). Cada bloco precisa exatamente deste formato, porque o `casar_palavras.py` lê assim:

```
## 3. (12,5 – 18 s)
**Fala:** Bateu aquela fome. E a geladeira da loja… tá ligada. E cheia.

**Cena:** A **geladeira** entra na palavra "geladeira", à direita do menino. O menino aponta para ela.
```

- A **Fala** fica numa linha só.
- Na **Cena**, sempre diga em que palavra cada objeto entra (é a regra do projeto).
- Os tempos no título do bloco são estimativa. Os de verdade saem da narração.

## Quantas palavras cabem
A voz fala de 2 a 2,6 palavras por segundo. Então:
- bloco de 5 s: 11 a 13 palavras
- bloco de 6 s: 13 a 16 palavras
- bloco de 8 s: 16 a 20 palavras

Antes de entregar o roteiro, conte as palavras de cada bloco e confira as três regras.

## O que dá para usar nas cenas (sem fazer nada novo)
- **Personagens:** menino, segurança.
- **Poses:** parado, acenando, apontando, pensando, assustado, comemorando, correndo.
- **Objetos:** cama, relógio, geladeira, porta (abre e mostra olhinhos), ponto de exclamação, balão de fala, cartão de opção A/B.
- **Lugar:** corredor de shopping à noite, com café, lanchonete e loja de móveis acesos.

Se a história pedir outra coisa (outro personagem, outro objeto, outro lugar), avise antes: precisa ser desenhado.

## Exemplo pronto
`animado/exemplo/roteiro.md` (o "Trancado no shopping"), já narrado e renderizado; as cenas dele estão em `animado/exemplo/index.html` e os sons em `animado/exemplo/deixas.mjs`.

## Ideias de história nesse formato
1. Você dorme na cama da loja de móveis e acorda com o shopping trancado e o segurança fazendo a ronda.
2. Você fica preso no elevador do shopping com o segurança, e a luz apaga.
3. Você acha uma porta escondida atrás da geladeira da lanchonete, e ela leva para um corredor que não está no mapa.
4. Você é o segurança do shopping no primeiro dia, e às 3 da manhã todas as vitrines acendem sozinhas.
5. Você esquece o celular no café, volta para buscar depois que fecha e encontra a cafeteira ligada.
6. Você ganha uma noite inteira sozinho no shopping como prêmio, mas o relógio para à meia-noite.
7. Você se esconde num guarda-roupa da loja de móveis numa brincadeira, e quando sai o shopping está vazio.
8. Você trabalha na lanchonete e vê pela câmera alguém abrindo a geladeira às 2 da manhã.
9. Você entra no shopping para fugir da chuva, e um balão de fala aparece em cima de cada manequim.
10. Você acorda no sofá da loja de móveis com o segurança te encarando e dizendo: "Eu sei o que você fez."
