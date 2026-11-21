# O painel no ChatGPT (Codex)

Para quem não usa o Claude: o painel também funciona com o **Codex**, o assistente de programação que vem dentro do
**app do ChatGPT para Mac** (versão 26.1103 ou mais nova). O Codex usa a assinatura do ChatGPT da pessoa (Plus, Pro,
Business…), e cada vídeo gasta o limite de uso desse plano, como no Claude.

## Para o aluno (o que muda, em português simples)

- **Instalar:** o app do ChatGPT para Mac. O painel acha o Codex sozinho dentro do app. Não precisa do Claude.
- **Conectar:** no topo do painel, "Conectar minha conta" abre a página do ChatGPT; a pessoa entra e volta.
- **Escolher quem responde:** com o Claude e o ChatGPT instalados, o topo mostra "Usar o ChatGPT" / "Usar o Claude".
  Sem escolha, vale o Claude. A troca vale para as próximas mensagens; cada um continua a sua própria conversa do projeto
  (o ChatGPT começa lendo o histórico do chat, para saber o que já foi combinado).
- **Internet, uma vez só:** na primeira mensagem aparece o cartão "Liberar a internet para o ChatGPT (Codex) trabalhar".
  Sem ela, os estilos não geram o vídeo (eles baixam as ferramentas de vídeo, fontes e vozes). Só o "Permitir" fica
  gravado (`"codex_rede": true` em `.painel/config.json`); se a pessoa negar, o chat explica que o vídeo não sai sem
  internet e o cartão aparece de novo na próxima mensagem.
- **Pasta de trabalho:** precisa passar pelo instalador (ele cria `_ferramentas/.venv` com o Python do áudio). Uma pasta
  copiada à mão fica sem esse Python e o ChatGPT reclama que "o Python padrão não tem os recursos de áudio".
- **Cartões de permissão:** iguais aos do Claude. O comum roda direto; o arriscado (apagar arquivo da pessoa, comando fora
  do comum, gastar crédito) vira Permitir/Negar no chat. "Trabalhar sozinho" funciona igual.
- **Higgsfield (capa caprichada, voz do Higgsfield):** no ChatGPT não existe o conector do app do Claude. O painel usa o
  **programa do Higgsfield no computador** (o CLI): a pessoa instala e entra na conta uma vez, no Terminal
  (`higgsfield auth login`). Depois, o painel mostra o preço e pede licença antes de cada geração, como no Claude.
  Quem não quiser instalar usa a capa simples (grátis) e a voz grátis ou a própria.
- **O que fica igual:** os 10 estilos, as etapas, as perguntas com botões, a entrega e a aprovação no painel.

## Como funciona por dentro

| Peça | Claude | Codex |
|---|---|---|
| Quem roda | `claude -p --output-format stream-json`, `--resume` | `codex exec --json`, `codex exec resume <id>` (motor_codex.py) |
| Conversa | `<projeto>/.sessao.json` | `<projeto>/.sessao-codex.json` (as duas convivem) |
| Instruções do painel | `--append-system-prompt` | `-c developer_instructions=…` (as mesmas, sem a parte do MCP + o bloco do Codex) |
| Área isolada | `sandbox` no settings do Claude (isolado.json) | perfil de permissão `painel` passado por `-c` (nada é gravado em ~/.codex): grava só na pasta de trabalho, temporárias e caches; nega NAO_LER, `.painel`, `~/.codex/auth.json` e `~/.config/higgsfield` |
| Rede | só os domínios de DOMINIOS | liga ou desliga (cartão uma vez). O filtro por domínio do Codex é experimental (`features.network_proxy`): ficou desligado para não quebrar npx, pip e o navegador do render |
| Cartões | `--permission-prompt-tool mcp__painel__aprovar` (aprovador.py) | gancho `PreToolUse` (gancho_codex.py) em todo comando, `apply_patch` e ferramenta; pergunta na mesma rota `/api/v2/aprovar`. O `codex exec` não tem tela de aprovação (`approval_policy = never`): quem barra é o gancho |
| Plugins e MCP da pessoa | desligados no settings | `--ignore-user-config` (só o gancho do painel carrega; por isso `--dangerously-bypass-hook-trust`) |
| Higgsfield | MCP do conector do claude.ai | ponte: `codex_bin/higgsfield` (no PATH dos comandos) → `/api/v2/higgsfield` com um bilhete por projeto → o painel roda o CLI de verdade fora da área isolada, com cartão quando gasta crédito. `auth` é recusado; arquivo enviado só de dentro da pasta de trabalho |
| Skills | `~/.claude/skills` | `~/.agents/skills` (o instalador espelha as do produto quando acha o Codex) |
| Cache do npm | `~/.npm` liberado | `npm_config_cache=<pasta>/_ferramentas/.npm-cache` (e `~/.npm` liberado no perfil) |

Arquivos novos: `scripts/motor_codex.py`, `scripts/gancho_codex.py`, `scripts/codex_bin/higgsfield` (+ `.cmd` no Windows),
`references/higgsfield-cli.md`. Mudanças pequenas: `central.py` (escolha do motor e desvio no `_roda`, `login`, `conectar`),
`painel.py` (rotas `/api/v2/motor` e `/api/v2/higgsfield`, motor no `/api/v2/estado`), `web/central.js` (topo, troca,
nome do assistente nos textos), `instalar.py` (espelho em `~/.agents/skills`).

Limites conhecidos:
- O gancho é uma barreira de verdade para comando e edição, mas a documentação do Codex avisa que algumas ferramentas
  especiais podem não passar por ele; a área isolada é a segunda barreira.
- Sem filtro de domínio, um comando dentro da área isolada alcança qualquer site (no Claude, só a lista). As chaves e
  logins continuam fora do alcance (perfil nega a leitura).
- A voz do Higgsfield pelo CLI gera fala por fala: pode mostrar um cartão por fala; "Sempre neste projeto" resolve.

## Windows (não testado)

Hoje o painel no Windows não roda o Claude por dentro (modo recado). Com o Codex, o que muda:

1. **Achar o Codex:** `codex.cmd` do npm (`npm i -g @openai/codex`) ou o app do Codex para Windows. O `acha_codex()` já
   procura `codex.cmd`, `%APPDATA%\npm\codex.cmd` e as pastas do app; conferir o caminho real do app do ChatGPT para
   Windows quando houver um aluno com ele.
2. **Área isolada:** a do Codex no Windows ainda é experimental (`windows_sandbox_service` em desenvolvimento na 0.167).
   O `central.autonomo()` já fica sempre desligado no Windows, então tudo o que não é leitura ou edição na pasta vira
   cartão. Testar se o perfil `painel` (negar leitura de NAO_LER) é respeitado; se não for, o gancho ainda barra os
   comandos que citam as pastas de chave.
3. **Gancho:** o comando é montado com `subprocess.list2cmdline` no Windows (aspas do cmd). Se o Codex rodar o gancho pelo
   PowerShell, pode precisar de `commandWindows` no hook.
4. **Ponte do Higgsfield:** `codex_bin/higgsfield.cmd` chama o `higgsfield` (Python) ao lado; precisa do `python` no PATH.
   O CLI do Higgsfield no Windows guarda o login em outra pasta: acrescentar essa pasta à lista de negação do perfil.
5. **Shell:** no Windows o Codex usa o PowerShell; `allow_login_shell` não tem efeito. As skills que chamam `python3`
   precisam do `python` (ou do `py`) no Windows: é o mesmo problema que o Claude já tem lá.
6. **Instalador:** `espelha_no_codex` já roda no Windows (copia para `%USERPROFILE%\.agents\skills`); falta trocar o aviso
   "no Windows o painel ainda não roda o Claude por dentro" por um que ofereça o Codex.

## Testes no Mac (09/11/2026, ChatGPT 26.1103, Codex 0.167, pela pasta de teste ~/Edicao-teste-codex)

Pedido curto pelo painel, com o ChatGPT (Codex) respondendo, "Trabalhar sozinho" ligado:

| Estilo | Resultado | Tempo | Observação |
|---|---|---|---|
| Palitinho | passou: 6,6 s | 4,6 min | só o cartão da internet (1ª vez) |
| Vídeo falado | passou: 17,9 s, -14 LUFS | 10,3 min | a prévia do HyperFrames gravava em ~/.local/state/hyperframes: liberado no perfil depois |
| Vídeo 3D | passou: 7,7 s | 10,0 min | |
| Motion | passou: 7,5 s | 3,3 min | |
| Mapas | passou: 7,1 s | 3,8 min | |
| Ponte do Higgsfield | passou | — | saldo e preço sem cartão; gerar abriu o cartão "Desenhar no Higgsfield" com o prompt; negado = nada cobrado; ler ~/.config/higgsfield bloqueado |
| Cortes, YouTube, Bit, Documentário, Capa e título | não testados pelo painel | — | o Lucas decidiu não testar todos; veja abaixo o teste das skills avulsas |

Regressão do Claude (mesmo painel, motor trocado para o Claude): passou. Gravou o arquivo, mostrou o passo em português e
continuou a mesma conversa na 2ª mensagem (`.sessao.json`; nenhum `.sessao-codex.json` criado).

Skills avulsas no Codex fora do painel (teste da conversa do painel dos alunos, `codex exec` com workspace-write e rede):
estilo-bit, video-3d, estilo-motion, estilo-mapas, estilo-documentario, capas-com-ia (capa simples) e edicao-youtube rodaram
inteiras; estilo-palitinho e editor-ia rodaram até onde o teste pediu (a falha do `cortes.py` foi do clipe de teste, que
acaba no meio de uma palavra). No documentário, a 1ª captura saiu com imagem quebrada até rodar o `preparar.py` das fotos
(é da skill, não do motor). O aviso `EPERM mkdir ~/.cache/hyperframes/history` daquele teste não aparece no painel (o perfil
libera `~/.cache`); no painel sobra só `uv_os_setpriority returned EPERM` no render, que é inofensivo.

## 2.2.16 (PARADA em 12/11/2026, não publicada): PowerShell no Windows

Decisão do orquestrador: parada até a semana de 16/11 (limite do plano). A 2.2.15 já resolve o travamento; no Windows o aluno
segue clicando em Permitir. Regra de permissão no Windows é segurança: reconferir com calma antes de publicar.

Estado na fonte (`scripts/central.py`): `SHELLS = ("Bash", "PowerShell")`, `PS_SENSIVEIS`, `PS_BLOQUEIA`, `PS_LEITURA`,
`_norm()` e `Central._ps_avalia(cmd)` ("direto" | "sempre" | None), usada por `_bash_permitido` e `chave_sempre`.
O Bash (Mac) não mudou. Lista de permitidos: python/py/node só com script (direto só se o script está nas pastas de skills;
fora delas vira cartão com "Permitir sempre"), `npx hyperframes`, ffmpeg/ffprobe (sem `-safe`), `New-Item -ItemType Directory`
e leitura (Get-ChildItem, Get-Content, Test-Path, Select-String, Get-Location, Set-Location…). Cartão com $ ( [ { + * ?,
-Recurse, Env:, partes de caminho começando com ".", ":" fora de X:\ dentro da área, caminho começando com \ ou /,
palavras sensíveis (.painel, .ssh, .aws, credentials…).

Testado só no Mac, imitando o Windows: as baterias da conversa do painel dos alunos (teste_ps.py e teste_ps2.py no
scratchpad dela) dão 0 e 4 diretos (os 4 dentro da área). Cópias de antes em
`/private/tmp/claude-501/-Users-lucasbarros-assistente-lucas-produtos-editor-ia-painel/6410d9ec-de94-4283-a324-13cefb65c91b/scratchpad/antes-2214/`.

Falta reconferir antes de publicar:
1. Num Windows de verdade (ou com um print de um cartão do aluno): o nome da ferramenta é mesmo "PowerShell"? Qual é o
   formato do `command` que chega ao aprovador?
2. O `os.path.realpath` do Windows com caminhos do tipo `C:\…`, `\\?\…` e links de pasta (junction).
3. Uma revisão de fora (a conversa do painel dos alunos ou o revisor) só da `_ps_avalia`, procurando nova fuga: aspas,
   caracteres de escape do PowerShell, nomes curtos 8.3 (PROGRA~1), argumentos do ffmpeg que gravam ou leem fora.
4. Se não der para fechar com segurança: publicar só a parte "sempre" para os scripts das skills e deixar o resto em cartão.

Revisão da conversa do painel dos alunos (12/11, depois da parada): 58 casos, realpath igual, raiz C:\Users\aluno\Edicao-com-IA,
HOME=C:\Users\aluno. Aprovada por ela, com uma pendência pequena: `ffmpeg -f lavfi -i movie='\Users\…\v.mp4'` roda direto e lê
mídia de fora da pasta. Fechar na retomada: `movie=`, `amovie=` e `-f lavfi` viram cartão. Mesmo aprovada, segue parada até
16/11 por decisão do orquestrador: falta o item 1 acima (o nome real da ferramenta e um print de cartão de um Windows).

**Cuidado ao publicar antes de 16/11:** o `montar_pacote.py` empacota a pasta `painel/` inteira, então qualquer publicação
(até uma atualização só de skill) levaria a regra do PowerShell junto. Desde a 2.2.15 só mudou `scripts/central.py`. A cópia
publicada da 2.2.15 está em `painel/central-publicada-2.2.15-NAO-USAR/central.py` (fica fora do pacote pelo "-NAO-USAR"):
para publicar algo antes, troque o `scripts/central.py` por ela, monte, publique e devolva o novo. As cópias "antes" no
/private/tmp podem sumir na limpeza; a de referência é essa.

**Retomada em 16/11:** pendência do ffmpeg fechada em `_ps_avalia`: `-f lavfi`, `movie=` e `amovie=` viram cartão; valor
depois de "=" que pareça caminho (`subtitles=\Users\…`, `=C:sem-barra`) vira cartão; caminho de disco em qualquer ponto do
texto precisa estar na área; ":" no meio de filtro (`scale=1080:1920`, `loudnorm=I=-14:TP=-1`, `-c:v`) é aceito.
Baterias: teste_ps 0/16 diretos, teste_ps2 4/23 e casos.txt 8/58 diretos (todos dentro da área), casos-skill.txt: os 2
scripts de skill diretos e as 2 fugas em cartão. Ainda não testado num Windows de verdade (item 1 acima).

## Seletor de modelo de IA (19/11/2026, na fonte, não publicado)

Pedido de aluno: mostrar o modelo em uso e deixar trocar. Topo do painel: seletor ao lado de "Claude conectado" (some no
celular); a escolha fica em `.painel/config.json` (`modelo_claude` / `modelo_codex`) e vale para as próximas mensagens.
Lista única em `scripts/central.py` (`MODELOS`): no Claude, `""` (padrão) + os apelidos `opus`, `sonnet`, `haiku` (já apontam
para a versão mais nova); no ChatGPT, `""` + os modelos que o Codex instalado lista (`motor_codex.modelos_codex()`, do
`~/.codex/models_cache.json`). Claude: `--model <apelido>`; Codex: `-m <slug>` (também no `exec resume`). Durante o pedido o
status mostra "Claude trabalhando · <modelo>": no Claude é o modelo que ele mesmo informa (evento init); no Codex, o escolhido.
Rotas: `POST /api/v2/modelo` (só chave do navegador; recusa modelo fora da lista); `modelos` no `/api/v2/estado`, `modelo`
no `/api/v2/projeto/<id>`. Teste numa pasta de aluno limpa: Haiku escolhido → o Claude informou `claude-haiku-5-5` e
respondeu; modelo inventado recusado. Codex: só conferido o comando (`-m` no novo e na continuação), porque o app do ChatGPT
não estava mais instalado neste Mac.
