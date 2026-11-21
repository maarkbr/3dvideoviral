# Vários cortes do mesmo podcast (modo lote)

Quando o usuário quer vários cortes, faça **uma etapa para todos de uma vez**, com um gate só por etapa. É mais rápido para ele (aprova em bloco) e para a máquina (o que é pesado roda em sequência, sem você parado esperando).

## Pastas

```
cortes/
  transcricao.json        o podcast inteiro (uma vez só)
  mapa.md                 os blocos com nota ★
  01-papo-china/          um corte por pasta, numerado na ordem de prioridade
    edl.json  decupagem.md  corte_bruto.mp4 (+ .segments.json, .words.json)
    work/transcricao.json          janela do podcast (tempos absolutos)
    work/transcricao_corte.json    o corte final (tempos do corte)
    work/enquadramento.json/.jpg
    plano.json  vertical/  entrega/
  02-…/
```

## Ordem

1. **Transcrever o podcast inteiro** e gerar o mapa (`selecao-de-cortes.md`).
2. **Selecionar** 5–10 candidatos → tabela → pergunta de múltipla escolha. Crie as pastas dos escolhidos.
3. **Decupar todos**: para cada corte, transcreva a janela com `small` + prompt, leia, escreva `edl.json` e `decupagem.md`. Depois:
   `python <skill>/scripts/lote.py cortes brutos` (corta e renderiza todos) → `python <skill>/scripts/lote.py cortes qa` (confere as emendas de todos). Corrija as emendas acusadas e rode `brutos --refazer` só se precisar (ou `cortar.py` direto no corte).
4. **⛔ Gate dos brutos**: uma lista com o caminho, a duração e a primeira frase de cada corte bruto; opções "Aprovar todos (Recomendado)" · "Quero mudar algum".
5. **Preparar a vertical de todos**: `lote.py cortes preparar` (transcreve cada corte final + enquadramento do rosto).
6. **Planejar**: escreva o `plano.json` de cada corte (o trabalho criativo: o roteiro de cenas). Faça um por vez, com a transcrição do corte aberta.
7. **Montar todos**: `lote.py cortes montar` (gera e confere cada projeto; o log de cada um fica em `<corte>/work/montar.log`). Olhe as fotos de cada um (`montar_vertical.py <plano> --fotos auto` quando quiser conferir um corte específico).
8. **⛔ Gate do render**: abra a prévia do primeiro (ou do que o usuário quiser) no Studio; opções "Renderizar todos (Recomendado)" · "Revisar um por um".
9. **Renderizar e masterizar todos**: `lote.py cortes render` (um por vez; ~5–8 min por minuto de vídeo). Rode em segundo plano.
10. **Entregar**: `lote.py cortes status` mostra o painel; mande a lista de arquivos finais com duração e LUFS de cada um.

`lote.py cortes tudo` roda brutos → preparar → montar → render pulando o que já existe (útil para retomar depois de uma pausa). `--refazer` força refazer a etapa.

## Tempo (máquina comum, CPU)

| etapa | tempo aproximado |
|---|---|
| transcrição do podcast inteiro (`small`) | 1/4 a 1/6 da duração (2 h → 20–40 min) |
| decupagem de um corte (você lendo e escrevendo o edl) | 5–10 min |
| corte bruto + QA | 1–3 min por corte |
| preparar (transcrição do corte + rosto) | 1–2 min por corte |
| montar + check | 2–5 min por corte |
| render + master | ~5–8x a duração do corte (60 s → 5–8 min) |

Para um vídeo tutorial ou uma demonstração, faça **um trecho só** (modo trecho específico): do pedido à entrega em ~30–40 min.
