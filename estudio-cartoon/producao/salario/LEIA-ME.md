# O Salário que Já Chega Gasto: produção

Curta vertical 1080 × 1920, 30 fps, 101,1 s (3.033 quadros), feito no estúdio de desenho 3D (`estudio-cartoon/`).
Roteiro e fontes: o documento "O Salário que Já Chega Gasto" (versão 2 da narração).

## Onde está cada coisa
| O quê | Onde |
|---|---|
| Composição Remotion | `src/videos/salario/` (cópia do motor do kit; `Root.tsx` registra `Salario`) |
| Tomadas, câmeras e foco | `src/videos/salario/story.ts` (seção "filme") |
| Elenco, atuação e adereços | `src/videos/salario/cast.ts` (função `filme`) |
| Cozinha e colunas de juros | `src/videos/salario/cozinha.ts` |
| Dados, legenda, cor por cena, fade | `src/videos/salario/LetrasFilme.tsx` |
| Tempos de cada palavra | `producao/salario/tempos.json` → `src/videos/salario/tempos.ts` |
| Narração original (intocada) | `public/salario/narracao-original.mp3` (e `narracao.wav`, a mesma em WAV) |
| Trilha, efeitos e mix | `producao/salario/audio.py` → `stems/` e `public/salario/mix.wav` |
| Vídeo final | `out/salario/O-Salario-que-Ja-Chega-Gasto.mp4` (e na pasta `Prontos/` do repositório) |

## Refazer
1. Tempos: `python3 producao/salario/alinhar.py public/salario/narracao.wav` (Whisper alinhado a `falas.txt`), depois gere `tempos.ts` (bloco no histórico do projeto).
2. Som: `cd producao/salario && python3 audio.py`.
3. Quadros de teste: `COMP=Salario node scripts/bridge-stills.mjs out/salario/x_ 100,500 0.5`.
4. Vídeo: Windows `Renderizar-Windows.bat` (padrão: `Salario`, filme inteiro); Mac `Renderizar-Mac.command`.

## Técnicas
- **Montagem pela voz:** 14 tomadas, uma por fala, com corte 2 quadros antes da primeira palavra. Expressões, adereços, dados e efeitos entram na palavra exata (`W(fala, "palavra")`).
- **Câmera:** cada plano tem uma aproximação lenta, e nenhum quadro fica parado. Usa dolly-out para revelar (cozinha), grua (rua de manhã e ao entardecer), tracking lateral (fila de vizinhos), contra-plongée que sobe com as colunas e desiste da última, plongée sobre a mesa e push-in final até o rosto.
- **Atuação:** a Jéssica (uniforme verde-água), o Marcos e a Bia têm figurinos próprios. Cada plano tem um arco de emoção (sorriso → choque → nervoso; susto → alívio; desconfiança; incredulidade), com piscadas e respiração do kit. Os vizinhos variam de expressão.
- **Cenários:** cozinha 3D nova (azulejo com faixa, reboco, piso, janela, bancada, armários, geladeira, mesa, cadeiras e lâmpada com bulbo que gera brilho), rua da cidade do kit e praça das colunas.
- **Dados:** cartões com número que conta, fonte e período em letra pequena. As colunas 3D têm a escala real entre si (15 : 64 : 451,7).
- **Cor:** dia nas cenas de rua e de manhã; flashback em tom quente com vinheta; noite azulada com a lâmpada quente; entardecer dourado; fade para preto na última palavra.
- **Som:** trilha original em 9 seções. Tem silêncio total na revelação (fala 10) e na frase final, um acorde maior de "falsa esperança" e cordas que crescem até o pico. Os efeitos são do SFX Kit (CC0). A voz fica em primeiro plano: a trilha fica 15 dB abaixo e baixa mais 6 dB quando a voz fala, e os efeitos nunca passam de 70% do pico da voz.

## Limitações
- **Bonecos e boca:** os bonecos são cartões 2D do kit, sem dedos nem sincronização labial. Ninguém fala em cena (a narração é em off), então as bocas mostram a emoção, não as palavras.
- **Mãos:** o kit não segura objetos. Celular, contracheque e cartas flutuam junto à mão.
- **Luz da noite:** o kit só tem luz de dia e de entardecer. A noite é dia mais o tratamento de cor da camada 2D.
- **Áudio:** a narração não foi cortada nem acelerada. O master aplica um único ganho linear (+10,7 dB, de −24 para −14 LUFS) e um limitador de pico.
