# Voz, legenda e som

## Voz (`ferramentas/voz.py`)

- **De onde vem a voz:** a pessoa grava, ou voz de IA (`referencias/voz-ia.md`, com o custo mostrado antes).
- **Comando:** `PY ferramentas/voz.py <projeto> <arquivo> [velocidade]`.
  - Copia a voz para `assets/audio/` e acelera se pedir (`atempo`, que não muda o tom).
  - Grava `narracao.wav` e tira o tempo de cada palavra com o **Whisper local** (modelo "small", português, de graça). Sai `transcript.json`.
- **Ritmo:** a referência fala uns 250 palavras por minuto. Se a voz vier bem abaixo disso, avisar a duração e oferecer acelerar 1,25x **antes** de montar os planos. O "Cem Palavras" foi de 77 s para 62 s.

## Tempo de cada palavra (`ferramentas/alinhar.py`)

- **Comando:** `PY ferramentas/alinhar.py <projeto>`.
- **O que faz:**
  - Lê o `roteiro.txt` e alinha palavra por palavra com o que o Whisper ouviu.
  - Quando o Whisper erra ("sem" no lugar de "cem", "Foi" no lugar de "Fui"), vale o texto do roteiro com o tempo do áudio.
  - Números que o Whisper escreve em algarismo ("1958") viram palavras por extenso para o alinhamento ("mil novecentos e cinquenta e oito").
  - O começo de cada bloco encosta no fim do silêncio real mais perto, para o corte cair no lugar certo.
- **O que grava:**
  - `cena/tempos.js`: `DURACAO`, `BLOCOS` e `LEGENDA`, que o vídeo usa;
  - `assets/audio/palavras.json`: os mesmos tempos, mais as frases, para a trilha e as páginas;
  - a duração nova dentro do `index.html`.
- **Conferir:** quantas palavras "bateram exatas". No "Cem Palavras" foram 182 de 192; as outras são erros do Whisper que o roteiro corrige.

## Legenda (`index.html` + `motor.js`)

- **Uma palavra por vez**, trocando junto com a fala, sem animação: aparece e troca, seco.
- **Fonte e cor:** Inter 800, 92 px, branca, contorno escuro de 14 px e uma sombra embaixo.
- **Escrita:** minúscula como na fala, maiúscula só em nome, número em algarismo (`{100|cem}` no roteiro).
- **Posição:** caixa entre 1130 e 1250 px (~62% da altura), dentro da área segura do Shorts, Reels e TikTok.
  - A checagem do HyperFrames avisa se sair dela.
  - A legenda não pode cobrir texto da cena.

## Som (tudo feito em código)

### Biblioteca (`ferramentas/som_biblioteca.py`), que não muda

- **Instrumentos:**
  - `caixinha(freq)`: caixinha de música; é a cara da trilha.
  - `pizz(freq)`: pizzicato.
  - `pad([freqs], duração)`: tapete suave.
  - `batida()`: coração, tum-tum.
  - `nota(midi)`: dá a frequência da nota.
- **Efeitos:**
  - transição: `whoosh(rev)`;
  - objetos e ação: `fita()` (esparadrapo), `giz()`, `risco()` (prego, pedrinha, agulha), `tique()` (relógio), `plim()`;
  - impacto: `estrondo()` (revelação e impacto), `tum()` (congelar);
  - ambiente: `sino()`, `grilos(buf, de, até)`, `chiado_disco(buf, de, até)` (filme antigo).
- **Utilidades:** `somar(trilha, segundo, som, ganho)`, `eco(trilha)`, `gravar(...)`.

### Trilha do episódio (`ferramentas/trilha.py`), que muda a cada vídeo

- **Música por período:**
  - dia: caixinha brincalhona com pizzicato;
  - noite: notas soltas e tapete grave;
  - suspense: coração batendo;
  - congelar: a música corta e sobe um grave até a revelação;
  - lembrança: valsa de caixinha antiga, um pouco desafinada;
  - fim: a caixinha sozinha, a última nota soando.
- **Efeitos no segundo exato** da palavra: `palavra(bloco, i)` ou `B[n]["ini"]`. Exemplos do "Cem Palavras":
  - whoosh em toda troca de período;
  - "plim" quando aparece o número;
  - esparadrapo no "mudo" e giz no muro;
  - grilos à noite e os três "risc";
  - estrondo no "1.460.000" e no "Fui eu";
  - chiado de disco em 1958, relógio que para e sino;
  - pedrinha no banco.
- **Rodar:** `PY ferramentas/trilha.py <projeto>`. Sai `musica.wav` e `efeitos.wav`.

### Mix (`ferramentas/mixar.py`)

- **Comando:** `PY ferramentas/mixar.py <projeto>`.
- **O que faz:** voz na frente, música a −11 dB e efeitos a −8 dB. Depois ajusta tudo para **−14 LUFS**, com o limitador segurando o pico abaixo de −1 dB.
- **O que sai:** `mix.wav`, que é o som do vídeo (`<audio>` no `index.html`).
- **O Claude não ouve:** ele só mede os níveis. Dizer isso e pedir para a pessoa escutar antes de aprovar.
