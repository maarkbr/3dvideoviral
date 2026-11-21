# Decupagem e corte bruto (Fase 4)

O corte bruto é o vídeo horizontal original, só com a história: sem silêncio, sem erro, sem nada fora do contexto central. É ele que o usuário aprova antes da edição vertical. "Pegar só o contexto central da história… o mais dinâmico possível."

## 1. Transcrição precisa do trecho

`transcrever.py <podcast.mp4> cortes/01-x/work/transcricao.json --inicio 13:07 --fim 16:20 --modelo large-v3-turbo --prompt "nome do podcast, nome do convidado, termos difíceis"`

- **Motor.** Com chave do ElevenLabs (`ELEVENLABS_API_KEY` no `.env` da pasta do projeto), o `transcrever.py` usa o **Scribe** sozinho: transcrição literal, com "é", "né", "hum", gaguejos, falsos começos e repetições — exatamente o que a decupagem precisa ver. Sem chave, usa o **Whisper** (grátis, local), que **"limpa" a fala e esconde boa parte desses vícios**: eles não aparecem na transcrição e ficam no corte. Com Whisper, avise o usuário numa linha que vícios e repetições podem escapar e procure as repetições à mão (frase que recomeça com as mesmas 3–5 palavras logo adiante). Na janela do corte use `large-v3-turbo` (mais preciso; ~1,6 GB na primeira vez); `small` só para varrer o episódio inteiro.

- Os tempos saem **absolutos** (do arquivo original). Cada palavra tem índice `i`.
- O `--prompt` com nomes próprios, gírias e assuntos melhora muito a grafia. Guarde o mesmo prompt no `edl.json` (campo `prompt`) para o QA e o lote reaproveitarem.

## 2. Leia e decida o que fica

Leia a transcrição inteira com os índices. Monte a lista de trechos mantidos (por índice de palavra) e, dentro deles, as palavras derrubadas. **O que sai:**

- **silêncios** acima de ~0,25–0,30 s dentro da fala (o `cortar.py` corta sozinho pelo `max_gap`). Mais apertado que isso a fala fica sem fôlego e os fins de frase parecem cortados;
- **erros**: começo de frase abandonado, gaguejo, palavra repetida, frase que ele refaz logo depois (fica a versão mais clara);
- **muletas soltas**: "tipo", "cara", "né", "sei lá", "é…", "então" quando não carregam sentido;
- **interrupções do apresentador**, comentários paralelos, propaganda/patrocínio no meio da história;
- **tangentes e repetições**: o mesmo argumento dito duas vezes, detalhes que a frase seguinte já resume, o punchline repetido;
- **tudo depois do fechamento** (o apresentador puxando outro assunto).

**O que fica:** a montagem da situação, cada virada, a frase de efeito, reações do apresentador que *somam* (uma risada, um "sério?" curto), e o fechamento.

**Palavra grudada:** uma muleta curta ("né", "tá", "ó", "é") colada na palavra de antes ou de depois, sem pausa, **não sai sem comer o fim (ou o começo) da frase** — é o defeito que mais aparece ("as frases ficaram cortadas"). O `cortar.py` detecta isso pelo áudio e **mantém** essas muletas sozinho (`keep_glued_fillers`, padrão ligado; ele avisa quantas manteve). Se a muleta precisa mesmo sair, derrube junto a palavra vizinha ou reescreva o trecho para cortar numa pausa.

## 3. edl.json

```json
{
  "source": "C:/…/podcast.mp4",
  "transcript": "work/transcricao.json",
  "prompt": "nome do podcast, nome do convidado, termos difíceis",
  "model": "small",
  "max_gap": 0.28, "keep_gap": 0.08, "tail_gap": 0.2, "crossfade": 0.03,
  "out": "corte_bruto.mp4",
  "keep": [
    {"a": 39, "b": 53, "note": "abre: papo de bêbado na China"},
    {"a": 98, "b": 131, "drop": [118, 119, 120], "note": "a lacrada; sem o 'sei lá'"}
  ],
  "overrides": {"205": {"in": 837.17}}
}
```

- `keep` em ordem de tempo; `a`/`b` inclusivos; `drop` = palavras removidas dentro do trecho.
- `tail_gap`: folga depois da última palavra de cada pedaço (o fim da sílaba decai abaixo do limiar de fala; com menos de ~0,15 s o fim da frase soa cortado). `audio` + `audio_offset`: áudio limpo separado (ex.: Adobe Podcast) com a mesma linha do tempo do vídeo.
- `fps` é lido do arquivo quando falta. `overrides` = ajuste fino de uma borda (`in`/`out` em segundos da fonte) por índice de palavra.
- Exemplo completo: `exemplos/reels-5-passos/edl.json` (Reels gravado, com as tentativas repetidas removidas).

## 4. Corte, confira, ajuste

1. `cortar.py cortes/01-x/edl.json --render` → `corte_bruto.mp4`, `corte_bruto.mp4.segments.json` (onde cada pedaço entrou) e `.words.json`.
   - Cada corte vai para o **vale de energia** mais próximo da palavra (o Whisper erra as bordas em até ~0,25 s, quase sempre terminando cedo), com ar só onde o nível fica baixo, vídeo no quadro exato e crossfade de 30 ms no áudio. Áudio e vídeo saem com a mesma duração.
2. `qa_corte.py cortes/01-x/corte_bruto.mp4.segments.json cortes/01-x/work/transcricao.json --prompt "…"` transcreve cada pedaço sozinho e acusa **EXTRA** (sílaba de fora vazou) ou **MISSING** (palavra mantida foi comida) nas bordas.
3. Para cada emenda acusada: `sondar_emenda.py <podcast> <t0> <t1>` mostra as palavras e o envelope de volume em volta; corrija com `overrides` (ou tire a palavra problemática) e rode `cortar.py --render` de novo. Para só re-renderizar com um ajuste: `render_corte.py <segments.json> --set "k:in=812.95"`.
4. `ver_emendas.py cortes/01-x/corte_bruto.mp4.segments.json` mede cada emenda na fonte e acusa **FIM CORTADO** / **INÍCIO CORTADO** (a fala continua do outro lado do corte, sem pausa) e desenha a folha `work/emendas.png` (onda: em cor o que ficou, em cinza o que saiu, linha vermelha no corte). **Olhe a folha.** Uma respiração antes da frase pode ser alarme falso; fala contínua em cinza logo depois de um fim em cor é palavra comida: solte a palavra seguinte, mova o corte para a próxima pausa, ou mantenha a muleta. Meta: nenhuma emenda acusada que você não consiga justificar.
5. Ouça você mesmo 2–3 emendas críticas antes de mostrar.

## 5. decupagem.md (vai junto do corte bruto)

Escreva para o usuário, em português simples: a história que ficou (5–8 tópicos), uma tabela "o que saiu e por quê" (tempo no podcast · trecho · motivo), como as emendas foram feitas, e pontos para a edição vertical (planos abertos, ganchos fortes, palavras que a transcrição errou). Modelo: `exemplos/reels-5-passos/LEIA-ME.md`.

## ⛔ GATE: aprovação do corte bruto

Mostre o `corte_bruto.mp4` (caminho clicável) + a decupagem e pergunte com opções clicáveis: **"Aprovado, pode fazer a vertical (Recomendado)"** · "Quero mudar algo". No modo lote, um gate só para todos os brutos (lista com caminho e duração de cada).
