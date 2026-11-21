# Instalação e verificação (Fase 1)

Tudo roda na máquina do usuário, de graça, sem conta em serviço nenhum (o Scribe, abaixo, é um opcional pago). O que a edição precisa:

| item | para quê | como instalar (Windows · Mac) |
|---|---|---|
| Python 3.10 a 3.13 (o 3.14+ ainda não instala o faster-whisper: o pacote `av` não compila) | transcrição, corte, som, montagem | `winget install Python.Python.3.12` · `brew install python@3.12`; crie o `.venv` com esse Python (`python3.12 -m venv .venv`) |
| ambiente virtual `.venv` na pasta do projeto | isolar os pacotes Python (nunca instalar no sistema) | `python -m venv .venv` |
| pacotes do `requirements.txt` | faster-whisper (transcrição), numpy, scipy, opencv (rosto) | `.venv/Scripts/python -m pip install -r <skill>/requirements.txt` (Mac: `.venv/bin/python`) |
| FFmpeg + ffprobe | cortar, medir, renderizar áudio | `winget install Gyan.FFmpeg` · `brew install ffmpeg` |
| Node.js 22+ | o HyperFrames roda nele | `winget install OpenJS.NodeJS.LTS` · `brew install node` |
| plugin HyperFrames no Claude Code | monta, confere e renderiza o vídeo; traz a biblioteca de efeitos sonoros e o Studio | `claude plugin marketplace add heygen-com/hyperframes` e `claude plugin install hyperframes@hyperframes` |
| ~10 GB livres | modelos do Whisper (`small` ~0,5 GB + `large-v3-turbo` ~1,6 GB), cortes, renders | — |
| *opcional:* chave do ElevenLabs | transcrição **Scribe**, literal: pega "é", "né", gaguejos e repetições que o Whisper esconde (decupagem bem melhor) | conta em elevenlabs.io → chave de API → arquivo `.env` na pasta do projeto com `ELEVENLABS_API_KEY=...`. Custa ~US$0,22 por hora de áudio; o áudio do trecho é enviado para a ElevenLabs |

## Passo a passo

1. **Escaneie antes de perguntar.** Rode `python <skill>/scripts/verificar_ambiente.py --projeto .` (com o Python do sistema na primeira vez; depois, com o do `.venv`). Ele imprime ✓/✗ e o comando que resolve cada ✗.
2. **Reporte como checklist** (uma linha por item) e o plano para os que faltam, em ordem.
3. **Instale você mesmo o que é automático**, pedindo uma vez: FFmpeg e Node pelo `winget`/`brew`; o `.venv` e o `pip install -r requirements.txt` na pasta do projeto. Depois de instalar FFmpeg/Node pelo winget, o terminal atual pode não enxergar o PATH novo: feche e abra o terminal do app, ou rode pelo caminho completo.
4. **Plugin do HyperFrames.** Os dois comandos `claude plugin ...` podem ser rodados por você no terminal (são do próprio Claude Code). O script `scripts/hf.mjs` acha o plugin instalado sozinho (qualquer versão), então não precisa reiniciar a sessão para usar a linha de comando. Sem o plugin, o `hf.mjs` cai para `npx hyperframes@latest` (funciona para render, mas sem o carve e sem a biblioteca de efeitos — aí os efeitos saem sintetizados).
5. **Scribe (opcional).** Pergunte uma vez: "Você tem (ou quer criar) uma chave do ElevenLabs para a transcrição literal? Corta melhor os vícios; custa centavos por corte." · "Não, usar o Whisper grátis (Recomendado se não quer conta)". Com chave, grave no `.env` da pasta do projeto (nunca no chat de volta, nunca em outro arquivo) e confirme com `verificar_ambiente.py`.
6. **Verifique de novo** com o `verificar_ambiente.py` e declare a configuração completa só com tudo em ✓ (o OpenCV é opcional; o modelo do Whisper baixa sozinho na primeira transcrição).

## O Studio (prévia e editor do HyperFrames)

- O Studio é a prévia do projeto no navegador: dá play, pula para qualquer ponto, clica num elemento para editar texto e arrasta clipes na linha do tempo. Abra com `node <skill>/scripts/hf.mjs preview` dentro da pasta do projeto (`vertical/`). Para o agente, use `preview --background`, confira com `preview --status` e pare com `preview --stop`.
- O **app desktop do HyperFrames** (gratuito) é opcional: tem o assistente Framey, que edita por conversa. Mencione quando o `preview` ou o `render` imprimir a linha sobre ele; nunca chame o app de "Studio".

## Onde fica cada coisa

```
<pasta do projeto>/            (ex.: Área de Trabalho/Edição de vídeos)
  .venv/                       ambiente Python local
  .models/                     modelo do Whisper (ou a pasta em $CORTES_MODELOS)
  podcast.mp4                  o podcast inteiro (ou em qualquer lugar; use o caminho)
  cortes/
    mapa.md, transcricao.json  mapa do podcast inteiro (modo "melhores cortes")
    01-<nome-do-corte>/        um corte por pasta (veja varios-cortes.md)
```

Rode os scripts **a partir da pasta do projeto** (onde ficam `.venv` e `.models`) ou defina `CORTES_MODELOS` com o caminho da pasta de modelos.
