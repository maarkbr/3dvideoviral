# Imagens para os vídeos

Ordem de preferência: imagens da própria pessoa → bancos gratuitos → geradas por IA (só se a pessoa tiver e quiser usar).

## 1. Da pessoa: pasta `Imagens/`
Logo, prints, fotos e produtos dela. Use primeiro. Não use imagem de terceiro sem a pessoa confirmar que pode.

## 2. Bancos gratuitos (sem custo)
A pessoa cria uma chave grátis no site e cola num arquivo `.env` na pasta do projeto. Nunca escreva a chave no chat, no plano ou em outro arquivo.

| Banco | Chave grátis | Variável | Busca |
|---|---|---|---|
| Pexels | pexels.com/api | `PEXELS_API_KEY` | `GET https://api.pexels.com/v1/search?query=<termo>&orientation=portrait&per_page=10`, cabeçalho `Authorization: <chave>` (vídeos: `/videos/search`) |
| Pixabay | pixabay.com/api/docs | `PIXABAY_API_KEY` | `GET https://pixabay.com/api/?key=<chave>&q=<termo>&orientation=vertical&safesearch=true` (vídeos: `/api/videos/`) |

- Busque em inglês, com 2 ou 3 palavras concretas ("video editing desk", "smartphone night").
- Baixe para `Imagens/banco/`, com o nome do banco e o id no arquivo, e anote em `Imagens/creditos.md` o link de origem e o autor.
- As duas licenças permitem uso comercial sem pagar. Mesmo assim: não use foto de pessoa reconhecível como se ela endossasse algo, nem marca de terceiros em destaque.
- Sem chave: avise que dá para seguir sem foto, usando só as cenas animadas do `template/`.

## 3. Geradas por IA (opcional, pago)
Se a pessoa tiver Higgsfield, ou outro gerador, conectado: gere só fundos, texturas e objetos, sem texto (a IA erra letra) e sem rosto de pessoa real. Mostre o custo antes de gerar.

## Regras
- Texto e interface (telas de app, números, títulos) se montam em HTML no `template/`, nunca em imagem gerada.
- Nada de print de notícia ou post de outra pessoa sem a fonte aparecer na tela.
