# Imagens, logos e b-roll

Ordem de preferência: o que o Lucas já tem → print/logo oficial → Pexels → gerado por IA (só se ele pedir).
Tudo vai para a pasta do vídeo (`NN-nome/imagens/` e `NN-nome/broll/`) antes de entrar no plano, com a origem
anotada em `creditos.md` (os scripts anotam sozinhos).

## Logo ou ícone de app/site citado
1. O pack de edições da pessoa (pastas de inserts/logos/elementos — ver `pack-de-edicoes.md`), se ela tiver.
2. Site oficial: página de imprensa/brand/press kit, ou o `apple-touch-icon`/ícone da loja de apps. Ache a URL
   com o navegador embutido (ou WebSearch) e baixe:
   `python3 scripts/imagem_web.py "<url>" "$V/imagens" capcut-logo` (converte webp/avif/ico em PNG).
3. Wikimedia Commons para marcas conhecidas (prefira PNG).
4. Sem PNG: print da página no navegador embutido (screenshot) e recorte.
Depois, `grafico.py logo` para pôr o logo num cartão da identidade, ou use o PNG puro em `modo: "centro"`/`"pip"`.

## Print de site/app que ele não mostrou na gravação
Abra a página no navegador embutido, tire o print e salve em `imagens/`. Só de páginas públicas; nada com dado
pessoal ou de cliente.

## B-roll do Pexels
Quando ele fala de algo concreto que não está na tela (dinheiro, celular, pessoa editando, cliente, escritório):
```bash
python3 scripts/pexels.py videos "video editing desk" "$V/broll" --n 3 --min-dur 4
python3 scripts/pexels.py fotos "money counting hands" "$V/imagens" --n 2
```
- Chave em `~/.claude/skills/edicao-youtube/.env` (`PEXELS_API_KEY=...`). Sem chave: avise o Lucas (ele cria grátis
  em pexels.com/api e cola no arquivo) e siga sem b-roll do Pexels.
- Termo em inglês, 2 ou 3 palavras concretas. Olhe 1 quadro de cada opção antes de escolher.
- No plano: `modo: "cheia"`, 2–4 s, `src` no trecho bom do clipe, sem som (já sai mudo).

## Banco do pack de edições
No pack (ver `pack-de-edicoes.md`): banco de vídeos, backgrounds, transições (film burn), overlays (light leaks,
poeira). Copie para `broll/` antes de usar.

## Regras
- Nada de logo/print de marca que ele não citou; nada de pessoa reconhecível como se endossasse algo.
- Imagem de IA: só fundo/objeto, sem texto (a IA erra letra) e sem rosto real; mostre o custo antes.
