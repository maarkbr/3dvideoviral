# A voz da narração: própria ou de IA

Pergunte uma vez (e anote em `<pasta de trabalho>/cidade/voz.txt`, para não perguntar de novo):

| Opção | Custo | Precisa |
|---|---|---|
| **A própria voz** | zero | um celular perto da boca, num lugar quieto; pode errar e repetir (corte com a skill editor-ia) |
| **Higgsfield** (ElevenLabs pelos créditos) | uns 1,5 crédito por vídeo de 60 s | o Higgsfield conectado no app do Claude |
| **ElevenLabs** (conta própria) | o plano da pessoa | a chave de API dela, guardada fora do projeto |

## Higgsfield, pelo conector do app do Claude
- **Conectar (uma vez, não instala nada):** no app do Claude, Configurações → Conectores → Adicionar conector
  personalizado, nome `Higgsfield`, URL `https://mcp.higgsfield.ai/mcp` → Conectar. Sem conta:
  https://higgsfield.ai?fpr=lucas-28cba0
- **Ache as ferramentas** pelo ToolSearch (`higgsfield generate audio`, `job display`).
- **Voz:** a **Marcus** é a aprovada no estilo (id `6f98d3dd-324f-4845-8c28-c1d1647a06cd`, `voice_type: preset`). Para
  uma criança contando, dá para escolher outra com `list_voices` (ouça pelo `preview_url`).
- **Gere o roteiro inteiro numa fala só** (soa natural e custa menos):
  1. Preço sem gastar: `generate_audio` com `params` = `{"model": "elevenlabs_v4", "prompt": <texto>, "dialogue":
     [{"text": <texto>, "voice_type": "preset", "voice_id": <id>}], "get_cost": true}`. Diga o valor à pessoa.
  2. Com o ok, o mesmo `generate_audio` sem `get_cost`; espere com `job_display` (`id` do job) até `completed`.
  3. Baixe o `rawUrl` para `<projeto>/assets/audio/` e siga para o `ferramentas/voz.py`.
- Para soar certo: números por extenso, siglas como se fala ("I.A."), nome de marca em letra normal.
