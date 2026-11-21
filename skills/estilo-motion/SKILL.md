---
name: estilo-motion
description: Cria vídeos motion de produto e serviço (SaaS, aplicativo, loja, negócio local, infoproduto) inteiramente em código, na identidade visual do cliente — frase com a palavra-chave numa caixa da cor da marca, logo revelado, celular com a tela do app ou uma conversa, painel com número contando, lista com checks, recursos flutuando, número grande no anel, foto do cliente em tela cheia e chamada final com botão e cursor clicando — sincronizados com a narração, com efeitos sonoros e master em −14 LUFS. Use quando a pessoa pedir vídeo motion, motion design, anúncio animado, vídeo de produto, vídeo para SaaS ou aplicativo, vídeo para cliente com a marca dele, ou escolher o estilo Motion no painel do Edição com IA.
---

# Estilo Motion

Vídeo vertical 1080x1920, de 20 a 60 s. A tela inteira é motion na identidade do cliente, amarrado à narração.

Uma informação por tela, e cada fala do roteiro vira uma cena. Leia antes de montar:
- `references/cenas.md`: as 9 cenas do kit e os campos de cada uma;
- `references/regras-motion.md`: roteiro, acabamento e o que nunca fazer.

## Antes de tudo: a pasta do projeto
Trabalhe dentro da pasta de trabalho do Edição com IA (a que tem `marca.json` e `_ferramentas/`), com **um vídeo por subpasta** (ex.: `motion/barbearia-boost/`). A marca do cliente (cor, nome, logo e tema claro ou escuro) vem do `marca.json` da pasta de trabalho. Se for um cliente diferente do canal, ponha um `marca.json` próprio dentro da subpasta do vídeo: o mais próximo vale. Material do cliente (logo, prints do app, fotos) vai em `<vídeo>/assets/`.

## Fluxo (pare para aprovação onde está ⛔)
1. **Briefing.** O que é o produto, para quem, a dor principal, os 3 a 5 benefícios reais, a oferta e a chamada final (comentar, link, WhatsApp). Conte o material: com 6 ou mais fotos ou vídeos bons do cliente, use mais cenas `foto` (vitrine). Com pouco material, use mais tipografia, celular e painel. Não invente número, preço, depoimento nem resultado: pergunte.
2. **Roteiro** ⛔. Escreva o `roteiro.json` (formato em `modelo/roteiro.json`), de 6 a 12 blocos, cada um com uma `fala` curta (6 a 16 palavras, números por extenso) e a `cena`.
   - **Estrutura:** gancho com a dor (pergunta ou frase forte) → agravante → a marca entra (`logo`, com `transicao: "circulo"`) → como funciona (celular, painel ou recursos) → benefícios (lista) → prova ou oferta (número) → chamada final (`cta`).
   - **Palavra-chave:** marque com `*asteriscos*`. Ela ganha a caixa na cor da marca quando a narração disser essa palavra.
   - Mostre as falas e as cenas e espere a aprovação.
3. **Projeto.** `python scripts/novo_projeto_motion.py <pasta do vídeo>` (com `--exemplo`, vem o anúncio do Edição com IA para estudar). Ponha o `roteiro.json` aprovado e o material em `assets/`.
4. **Voz.** Use a voz escolhida (`voz/escolha.txt` da pasta de trabalho; se não tiver, pergunte, seguindo `references/voz-ia.md`).
   - Voz de IA: escreva `voz/b1.txt`… e rode `python scripts/voz_ia.py --motor <voicestudio|elevenlabs> --voz <id> 1 2 3 …`. Depois `python scripts/voz_motion.py <pasta> --falas voz/f1.wav voz/f2.wav …`.
   - Voz própria: a pessoa grava as falas em `Bruto/` (corte erros antes com a editor-ia). Depois `python scripts/voz_motion.py <pasta> --gravacao Bruto/voz.m4a`.
   - **Sem narração** (só trilha): pule este passo. Cada bloco dura o `dur` dele (padrão 2,6 s).
5. **Montar** ⛔. `python scripts/montar_motion.py <pasta>` gera o `index.html` e o `work/sons.json`. Depois:
   - `npx --yes hyperframes@0.9.13 snapshot --at <um tempo no meio de cada cena> --no-end --output work/snap`;
   - olhe todos os quadros com a lista de `regras-motion.md`, corrija o roteiro (não o `index.html`) e monte de novo;
   - mostre a folha de quadros para a pessoa aprovar.
6. **Render.** `npx --yes hyperframes@0.9.13 render . --fps 30 --crf 16 --browser-timeout 240 -o work/video.mp4`, em segundo plano.
7. **Som e entrega.** Pergunte uma vez se a pessoa tem um pack de edições (`references/pack.md`) e use uma trilha dele (`--trilha`): sem trilha, o fim do vídeo fica mudo e o conferidor reprova. `python scripts/finalizar_motion.py <pasta> Prontos/<nome>.mp4 [--trilha musica.mp3]`. Ele põe whoosh nas trocas de cena, pop na palavra-chave, assinatura no logo e clique no botão (SFX Kit, CC0), abaixa a trilha quando a voz fala e entrega em −14 LUFS. Escute com o Earshot se ele estiver instalado (`references/som-profissional.md`). Você não ouve o áudio: diga isso e peça para a pessoa escutar. Entregue em `Prontos/`. Se veio do painel, rode `pronto` (skill `painel-edicao-com-ia`).

## Quando o pedido vem pelo painel
Se a mensagem chegou pelo chat do painel do Edição com IA (a pasta é `projetos/<id>/` dentro da pasta de trabalho), siga `references/processo-no-painel.md`: as mesmas paradas desta skill, mas marcadas na coluna de etapas e perguntadas com botões (`painel.py pergunta`). A pessoa não vê o terminal.

## O que nunca fazer
- Inventar número, preço, depoimento, resultado ou logo. Valor que aparece na tela tem que ser do cliente.
- Copiar a marca, a interface ou o vídeo de outra empresa. Telas de app só do próprio cliente. A conversa do `celular` é genérica, desenhada pelo kit.
- Mexer no `index.html` à mão: ele é refeito pelo `montar_motion.py`. Ajuste o `roteiro.json` (ou o `kit/` do projeto, se for um efeito só deste vídeo).
- Usar `Math.random()`, `Date.now()` ou mudar texto com JavaScript durante o vídeo: o HyperFrames renderiza os quadros fora de ordem.
