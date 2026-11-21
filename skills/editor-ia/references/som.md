# Som: efeitos, trilha e master

## Efeitos (SFX) automáticos

O `montar_vertical.py` gera os efeitos de cada cena pelo tipo e pelos tempos do plano (lista final em `vertical/work/sfx_events.json`). Os níveis são o **pico** de cada golpe na trilha de efeitos (dBFS), calibrados no corte-modelo para ficarem sob a voz:

| momento | efeito | nível |
|---|---|---|
| card dividido descendo / subindo | whoosh (pan −0,2 / +0,2) | −13 / −16 |
| card novo por wipe | whoosh (pan ±0,4) | −15 |
| tela cheia entrando | whoosh | −11 a −12 |
| ícone/chip/adesivo aparecendo | pop | −14 a −17 |
| carimbo | impacto grave (impact2) · + sino se verde | −9 / −19 |
| gancho | riser até a saída, impacto em cada linha, whoosh na saída | −20 / −12…−14 / −10 |
| glitch | glitch + impacto (e a trilha cai) | −13 / −14 |
| X se desenhando, aviso | erro | −14 a −15 |
| digitação, mensagem chegando | typing / click + notificação | −20 / −21 + −18 |
| número contando | clique a cada 0,07 s | −22 |
| revelação, ideia | ping + brilho (sparkle) | −13…−17 / −15…−20 |

**Biblioteca:** os arquivos vêm da biblioteca embutida do HyperFrames (pacote media-use, licença Pixabay) e são copiados para `vertical/assets/sfx/` de cada projeto — não vão dentro da skill. Sem o plugin, o `sons.py` **sintetiza** versões de todos os efeitos (nunca falha). Nomes disponíveis: `whoosh`, `whooshBig`, `pop`, `impact`, `impact2`, `glitch`, `typing`, `notify`, `ping`, `sparkle`, `riser`, `click`, `error`, `chime`, e o sintetizado `urna` (bipes do "FIM" da urna).

**Extras e ajustes** no `plano.json`:

```json
"som": {
  "extra": [{"t": "~e aí ele falou", "s": "impact", "db": -12, "len": 1.3}, {"t": "@40.2", "s": "ping", "db": -16, "pan": 0.3}],
  "sem_auto": ["b04-perguntas"],
  "drops": [["~silêncio", "~silêncio>"]]
}
```

`from`/`len` recortam um pedaço do arquivo; `pan` de −1 a 1. Em cada cena, `"sfx": false` desliga os automáticos dela. Se o montador avisar pico acima de −1 dBFS na trilha de efeitos (golpes empilhados), abaixe o `db` de algum ou afaste os tempos.

## Trilha

- **Sintetizada** (padrão, livre de direitos): `"clima"`: `curioso` (92 bpm, pentatônica menor — histórias, curiosidades), `tenso` (84 bpm, menor/frígio — polêmica, perigo, crime), `inspirador` (100 bpm, maior com palmas — superação, carreira, conselho), `leve` (108 bpm, maior saltitante — humor, histórias engraçadas). `bpm` muda o andamento.
- **Arquivo do usuário**: `"musica": "trilhas/minha.mp3"` (de preferência instrumental e com licença para redes sociais). O montador repete com cruzamento até cobrir o corte, aplica os drops e o fade.
- Nível: `musica_lufs` (−30) — baixo de propósito: a voz manda.
- **Drops**: a trilha fica muda em cada `glitch` (e nos `som.drops`) e volta em 0,15 s.

## Carve (a trilha abre espaço para a voz)

Com o plugin do HyperFrames, o montador instala `@hyperframes/core` na pasta do projeto e roda o carve (`carve.mjs --comp index.html --bed music --voice aroll`): ele analisa a voz e grava no `<audio id="music">` cortes de EQ automáticos nas faixas da voz (160 Hz–2,5 kHz) e um ajuste de nível — o mesmo que o painel do Studio faz. Sem o plugin (ou se o carve falhar), o montador usa `music_duck.wav`: a trilha já abaixada −10 dB onde há voz.

## Master (depois do render)

`masterizar.py work/vertical_raw.mp4 entrega --name corte_vertical_<nome> --voice vertical/assets/aroll.mp4 --sfx vertical/assets/sfx.wav --music vertical/assets/music_raw.wav`

- Mede o render (BS.1770 com gate), aplica um ganho para **−14 LUFS integrado** e um limitador com look-ahead (teto −1,3 dBTP medido com 4x oversampling), com uma passada de correção. O vídeo é copiado sem recompressão; o áudio vai em AAC 256 kb/s.
- Confere o arquivo final com o `ebur128` do FFmpeg e imprime o resumo: tem que dar ~−14 LUFS e true peak ≤ −1 dBTP.
- Grava `entrega/stems/` (voz, sfx, trilha e master com o mesmo ganho) para quem quiser remixar.
