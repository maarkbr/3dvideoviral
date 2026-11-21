# Exportar para o CapCut (opcional)

A Claude escreve a linha do tempo direto no projeto do CapCut (sem abrir o CapCut): cortes, zooms, cenas, textos,
legenda, música e efeitos. A pessoa abre, dá o toque dela e exporta no CapCut. Não é obrigatório: o vídeo pode sair
pronto pelo `renderizar.py`. `S=~/.claude/skills/edicao-youtube/scripts`.

## Regras duras
1. **CapCut fechado na hora de gravar.** `python3 $S/capcut.py aberto` antes; pergunte "O CapCut está fechado
   (Cmd+Q / fechar de verdade)?" antes de cada instalação. Os scripts recusam gravar se ele estiver aberto ou se o
   projeto mudou depois de lido.
2. **Nunca inventar objeto do CapCut.** Tudo é clonado de um `modelos.json` colhido dos projetos DA PESSOA
   (`capcut.py colher`). Na primeira vez: peça para ela criar no CapCut um projeto 16:9 "MODELOS YOUTUBE" com um
   vídeo, uma música, um texto de legenda, um título e uma palavra grande no estilo dela (ou com os presets que ela
   já usa) e fechar o CapCut; então `python3 $S/capcut.py colher "<pasta de trabalho>/youtube/modelos.json"
   "MODELOS YOUTUBE"` e ajuste os `"apelidos"` (`legenda`, `titulo`, `palavra`) para os ids certos (o comando lista
   fonte e animação de cada texto). Faltou um modelo (camada de ajuste, música com fade)? Peça para ela fazer um clipe
   assim nesse projeto e colha de novo.
3. **Backup sempre.** `instalar()` copia o projeto para `<projeto>/_backup_claude/<data>_<etapa>/` e confere o md5
   das cópias da linha do tempo.
4. **Mídia com caminho real e estável**: copie o que vem do Drive/internet para a pasta do vídeo antes de usar.
5. **As edições da pessoa valem mais**: se ela já mexeu no projeto, rode `aprender.py` ANTES de montar de novo e
   preserve o que ela fez (ou monte num projeto novo "… v2").
Pasta dos projetos: Mac `~/Movies/CapCut/User Data/Projects/com.lveditor.draft`, Windows
`%LOCALAPPDATA%\CapCut\User Data\Projects\com.lveditor.draft` (ou `CAPCUT_PROJETOS=<pasta>`).

## Passos
```bash
python3 $S/capcut.py listar                      # projetos existentes
python3 $S/novo_projeto.py "NN nome do vídeo"    # projeto vazio 16:9 (ou ela cria: Criar projeto → renomear → fechar)
```
**Plano** (`trabalho/plano.json`, formato no topo de `montar.py`; `"modelos"` = o modelos.json dela). Siga
`estilo-do-canal.md`. Âncore tudo por `frase` (sobrevive a recortes), não por segundo.
- Intro pronta (HyperFrames) entra como `"intro_pronta": {"arquivo": ".../intro-vN.mov", "ate": <última palavra>}` no
  job.json — o arquivo SEM master (voz no nível do bruto). Tire do plano as cenas e a trilha da intro antiga.
- Corpo: zoom no que ela mostra (`zooms` no job.json, `foco` em 0..1 — olhe um quadro do bruto naquele tempo), `cenas`
  com logo/print do site/app citado (`imagens-e-broll.md`), b-roll do Pexels quando fala de algo concreto fora da
  tela, cartão de tópico em cada passo, `textos` com a palavra-chave nos momentos fortes.
- Legenda: `"legenda": {"modelo": "legenda", "max_palavras": 3, "maiusculas": true, "destaques": "auto"}`.
- Som: trilha do pack ~23 dB abaixo da voz no corpo; efeitos de UI do pack ~8–10 dB abaixo da voz.
```bash
python3 $S/montar.py "$V/trabalho" --so-montar          # valida sem gravar
$PY -I $S/previa.py "$V/trabalho/montado/draft.json" "$V/previa.mp4" --tam 960x540
python3 $S/montar.py "$V/trabalho"                      # instala (backup + cópias + md5), depois de ela fechar o CapCut
```
Olhe a prévia em folhas de contato e conserte o que estiver feio. Diga para abrir o CapCut e clicar no projeto;
arquivo vermelho → "reconectar mídia" apontando para a pasta do vídeo. **Resolução**: no CapCut se escolhe na
exportação (1080p, 2K ou 4K) — diga qual escolher (a do job.json).

## Aprender com o que ela mudou
Quando ela terminar os ajustes e fechar o CapCut:
```bash
python3 $S/aprender.py "$V/trabalho" "NN nome do vídeo"   # aprendizado.md: cortes, cenas, textos e áudio que ela mudou
```
Separe **preferência** (vale para os próximos) de **acidente do vídeo** e acrescente as preferências em
`<pasta de trabalho>/youtube/preferencias.md` (data, vídeo, regra, porquê).

## Problemas
- Linha do tempo vazia no CapCut: ele estava aberto na hora da gravação. Feche e rode `montar.py` de novo.
- Mídia vermelha: caminho mudou ou arquivo só na nuvem. Copie para a pasta do vídeo e monte de novo.
- Legenda/cena cedo ou tarde: o tempo do Whisper deriva em frase longa; ancore em outra frase próxima.
- "frase não encontrada": escreva como está em `palavras_tl.json`.
- Projeto não aparece: crie pelo CapCut e use esse nome. Texto grande/pequeno demais: modelo colhido de projeto 9:16.
