# A voz da narração: própria, áudio pronto ou ElevenLabs (direto ou pelo Higgsfield)

**Na instalação, pergunte à pessoa qual ela quer** (uma pergunta só, com as opções e o resumo abaixo) e instale apenas o que ela escolher. Anote a escolha na pasta do projeto, em `voz/escolha.txt`, para não perguntar de novo.

| Opção | Custo | Licença para página que vende | Precisa |
|---|---|---|---|
| **1. A própria voz** | zero | sim | um celular perto da boca, num lugar quieto |
| **2. ElevenLabs** | pago (o plano Starter, a partir de ~US$ 6/mês, já tem licença comercial e clonagem; confira o preço atual em elevenlabs.io/pricing) | sim, nos planos pagos (o grátis não tem) | conta e chave de API |
| **3. Higgsfield (ElevenLabs v4 pelos créditos)** | créditos do Higgsfield (~0,5 por fala curta, por tentativa; mostre o custo antes) | conforme os termos do Higgsfield | o Higgsfield conectado no app do Claude (conector personalizado, sem instalar nada) |
| **4. Áudio pronto** | zero | sim, se a voz for da pessoa ou licenciada | a pessoa manda o arquivo (no painel, pelo +) |

## 1. A própria voz
A pessoa grava as falas e põe em `Bruto/`. Pode errar e repetir: use a skill editor-ia para cortar erros e repetições. Depois, acelere ~15% sem mudar o tom e encurte as pausas para no máximo ~0,12 s.

## 2. ElevenLabs
- Peça a chave de API (Profile → API Keys) e guarde no ambiente, nunca no código nem no chat: `export ELEVENLABS_API_KEY=...` ou num `.env` fora de pastas compartilhadas.
- Para clonar a voz da pessoa, use o Instant Voice Cloning no site (com uns 30 s de áudio limpo). Se ela não quiser clonar, ela escolhe uma voz pronta em português na biblioteca.
- Gere uma fala por arquivo: `python scripts/voz_ia.py --motor elevenlabs --voz <voice_id> 1 2 3 4 5 6`. O modelo é o `eleven_multilingual_v2`.

## 3. Higgsfield (pelo MCP, o conector do app do Claude)
- **Conectar, uma vez só (não instala nada):** no app do Claude, Configurações → Conectores → **Adicionar conector personalizado**, nome `Higgsfield`, URL `https://mcp.higgsfield.ai/mcp` → **Conectar** → entrar na conta do Higgsfield e autorizar. O "Higgsfield AI" da lista de conectores prontos **não serve** (não gera nada). Precisa de plano pago no Higgsfield; quem ainda não tem conta cria pelo link https://higgsfield.ai?fpr=lucas-28cba0 (é o link de parceiro do Lucas Editor; quem assina por ele ajuda o projeto).
- **Ache as ferramentas:** elas têm `higgsfield` no nome (ex.: `mcp__claude_ai_Higgsfield__generate_audio_batch`); procure com o ToolSearch (`higgsfield generate audio`, `higgsfield jobs wait`). Não achou? Espere 10 s (`sleep 10`) e procure de novo; se ainda não houver, explique como conectar (acima). Nunca peça senha nem chave no chat.
- **Voz:** a **Marcus** foi a aprovada pelo Lucas (a **Andre** tem sotaque): o script já sabe o id das duas. Outra voz: `list_voices` (pode ouvir pelo `preview_url`) e passe o `voice_id` em `--voz` (`--tipo element` se for uma voz da própria pessoa).
- **Gerar, em 3 passos** (quem gera é você, pela ferramenta; o script prepara e confere):
  1. `python scripts/voz_ia.py --motor higgsfield --voz Marcus 1 2 3 …` grava `voz/higgsfield-pedido.json`.
  2. **Preço sem gastar:** `generate_audio` com `params` = o `"preco"` do arquivo (todas as falas juntas). Diga o valor à pessoa antes. Depois `generate_audio_batch` com `requests` = cada lote de `"lotes"` (até 12 falas por vez) e `jobs_wait` com os `job_id` (espera até 15 s por chamada; repita até `all_terminal`). Não passe `use_unlim`. Se der tempo esgotado ao gerar, **não gere de novo** antes de conferir os jobs (gasta em dobro).
  3. Grave `{"1": "<result_url>", "2": "<result_url>", …}` (o número é o `index`) em `voz/higgsfield-resultados.json` e rode `python scripts/voz_ia.py --motor higgsfield --voz Marcus --resultados voz/higgsfield-resultados.json 1 2 3 …`. Ele baixa, corta o "Bom." e confere cada fala com o Whisper. Os áudios finais são `voz/f1.wav`, `f2.wav`… (os `bN.wav` ainda têm o "Bom." na frente: não use). Se sair `REFAZER: 2 5`, repita os passos só com essas falas (cada tentativa gasta créditos; no máximo 3, depois ele fica com a melhor e avisa).
- Para soar certo: "I.A." (não "IA"), "três D", nome de marca em letra normal (caixa alta sai soletrada).
- Quem já tem o CLI `higgsfield` instalado e logado ainda pode usar o jeito antigo: `--motor higgsfield-cli` (gera e confere sozinho).

## 4. Áudio pronto
- A pessoa grava fora (ou já tem a narração) e manda o arquivo. Use direto como gravação: no 3D, `voz_3d.py --gravacao <arquivo>`; no motion, `voz_motion.py --gravacao <arquivo>`; no Bit e no vídeo falado, o fluxo da editor-ia (corte de erros e velocidade).
