# Higgsfield pelo CLI (quando quem responde no painel é o ChatGPT/Codex)

O Codex não tem o conector do Higgsfield do app do Claude. No painel, o comando `higgsfield` é uma **ponte**: o painel roda o
CLI do Higgsfield com a conta da pessoa e **mostra um cartão antes de qualquer ação que gasta crédito**. Consultar, ver preço,
enviar imagem de modelo e esperar um job não gastam e não perguntam. O login do Higgsfield fica com o painel: nunca rode
`higgsfield auth` (é recusado) e nunca tente ler `~/.config/higgsfield`.

O que a pessoa precisa: o CLI instalado e logado uma vez no computador (`higgsfield auth login` no Terminal dela, fora do painel)
e plano pago no Higgsfield. Se a ponte disser que o CLI não está instalado, diga isso em uma frase e ofereça a capa simples (grátis).

Use sempre `--json` quando for ler a resposta.

## Equivalência com o MCP que as skills citam

| Na skill (MCP) | No Codex (CLI) | Gasta crédito? |
|---|---|---|
| `balance` | `higgsfield account status --json` | não |
| `media_upload` + `enviar_referencias.py` + `media_confirm` | `higgsfield upload create <arquivo> --json` (um por arquivo; devolve o id) | não |
| `generate_image` com `get_cost: true` | `higgsfield generate cost gpt_image_2_6 --prompt "…" --aspect_ratio 9:16 --quality high --resolution 2k --image <id1> --image <id2> --json` | não |
| `generate_image` | o mesmo com `generate create` no lugar de `generate cost`, mais `--wait --json` | **sim (cartão)** |
| `jobs_wait` | `higgsfield generate wait <job_id> --json` | não |
| `show_generations` | `higgsfield generate list --json` | não |
| `list_voices` | `higgsfield voices list --json` | não |
| narração (`voz_ia.py --motor higgsfield`) | `voz_ia.py --motor higgsfield-cli --voz <nome> 1 2 3 …` | **sim (cartão)** |

## Capa caprichada, passo a passo

1. `higgsfield account status --json` → o saldo.
2. Imagens de modelo (até 8, na ordem do prompt: Image 1 = o modelo de arte, depois os quadros, a foto/print da pessoa, a logo):
   `higgsfield upload create <arquivo> --json` para cada uma, de dentro da pasta de trabalho (arquivos de fora são recusados). Guarde os ids.
3. Preço sem gastar: `higgsfield generate cost gpt_image_2_6 --prompt "<prompt>" --aspect_ratio 9:16 --quality high --resolution 2k --image <id> … --json`.
   Diga o preço à pessoa se ela ainda não viu.
4. Gerar: `higgsfield generate create gpt_image_2_6 …` (os mesmos parâmetros) `--wait --json`. O painel mostra o cartão
   "Desenhar no Higgsfield (gasta créditos da sua conta)" com o prompt; se a pessoa negar, nada é cobrado: siga com a capa simples.
5. Se der tempo esgotado, **não gere de novo**: `higgsfield generate list --json` e `higgsfield generate wait <job_id> --json`
   (gerar de novo cobra de novo).
6. Salvar: `python scripts/salvar_capa.py "<link https do resultado>" "<Prontos>/<nome>-capa.jpg" --formato 9:16 --original "<pasta do vídeo>/capa/<nome>-capa-original.png"`.

Para as 3 capas do YouTube (16:9), o cartão tem "Sempre neste projeto": a pessoa libera uma vez e as outras duas saem sem cartão.
