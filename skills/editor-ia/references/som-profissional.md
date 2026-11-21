# Som profissional: SFX Kit + Openverse + Earshot

O Claude monta o vídeo, mas não escuta o que faz. Estas três ferramentas grátis resolvem isso. Use as três em qualquer edição desta skill, sempre na ordem abaixo.

## Instalação (uma vez por computador; pergunte antes de instalar)

1. **SFX Kit** (320 sons CC0, uso comercial e sem crédito): numa pasta de ferramentas (ex.: `~/ferramentas`), rode
   `git clone --depth 1 https://github.com/wyzowl/sfx-kit`. Se não tiver git, baixe o ZIP do GitHub e descompacte.
2. **Earshot** (o "ouvido" do Claude, licença MIT; precisa de Python 3.10+ e ffmpeg; roda na CPU):
   ```
   git clone --depth 1 https://github.com/Leonxlnx/earshot && cd earshot
   python3 -m venv .venv
   .venv/bin/python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
   .venv/bin/python -m pip install -e ".[mcp]"
   .venv/bin/python -m earshot doctor --load
   ```
   No Windows, troque `.venv/bin/python` por `.venv\Scripts\python`. **Não** use `pip install earshot`: esse nome no PyPI é outro programa. No primeiro uso, ele baixa dois modelos abertos (~1,1 GB).
3. **Ligar o Earshot no Claude Code:** `claude mcp add earshot --scope user -e EARSHOT_THREADS=3 -- <pasta>/earshot/.venv/bin/python -m earshot mcp`. Depois, feche e abra o Claude. Opcional: copie `earshot/skills/earshot` para a pasta de skills.
4. **Openverse:** não precisa instalar. A API é aberta e não pede chave (veja abaixo).

## Como usar em cada vídeo

1. **Liste os momentos que pedem som:** cortes, texto ou elemento importante entrando, cliques, revelações e o CTA. Não ponha som em toda entrada: o resto respira.
2. **SFX Kit primeiro.** Leia `sfx-kit/GUIDE.md` e `sfx-kit/catalogue.md`. Para cada momento, escolha um som que combine e respeite o "quando não usar" dele. Encaixe pelo **ponto de sincronia**: o som começa em `momento − sync`. Use o volume sugerido para quando tem voz por cima.
3. **Faltou som?** Busque no Openverse, sempre só com licença comercial:
   `https://api.openverse.org/v1/audio/?q=TERMO&license_type=commercial&page_size=20` (TERMO em inglês: whoosh, pop, click…).
   Baixe o arquivo do campo `url` para `sons/` e anote o campo `license` em `creditos.txt`. Se for `by`, copie também o `attribution` e ponha esse crédito na legenda ou na descrição do post.
4. **Ainda não existe?** Crie com o Earshot (`earshot sfx` / `kit`, ou `forge`).
5. **Mixe tudo abaixo da voz:** voz em −16 a −15 LUFS, efeitos de 3 a 6 dB por baixo, master final em −14 LUFS e pico máximo de −1 dBTP.
6. **Confira escutando:** antes de entregar, passe o vídeo final pelo Earshot (ferramenta `listen` ou `sheet` do MCP, ou `earshot sheet video.mp4`). Corrija os sons que entraram fora do tempo do corte ou altos demais, e escute de novo.

## Cuidados
- Menos é mais: som em todo corte cansa.
- A voz manda: efeito nunca disputa com a fala.
- Licença em dia: CC0 e SFX Kit não pedem crédito; CC BY pede; CC BY-NC nunca em vídeo que vende (o filtro `license_type=commercial` já tira esses).
