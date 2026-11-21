# Padrões do estilo Lucas Editor (YouTube)

O que vale por padrão em todo vídeo. Saiu das edições reais do canal do Lucas Editor e do que ele mesmo corrigiu à mão
no Premiere (vídeo "Vídeos 3D sem aparecer", nov/2026). As preferências de CADA pessoa ficam na pasta de trabalho dela
(`<pasta de trabalho>/youtube/preferencias.md`) e valem mais que isto.

## Cortes (o que mais pesa)
- **Fica sempre a última tentativa completa** de cada frase. Quem grava sozinho repete a mesma frase 2 a 5 vezes.
- **Ritmo dinâmico**: pausa a partir de 0,12 s sai; nenhuma emenda fica com mais de 0,08 s de silêncio (nas emendas
  feitas à mão pelo Lucas, a mediana é 0,03 s). **Respiração sai toda.** Esperas (o Claude trabalhando, render, upload)
  saem inteiras, a menos que algo importante esteja acontecendo na tela.
- **Muletas** saem: "Então / E / Aí / Daí / Bom" abrindo frase depois de pausa, e "tá? / né?" fechando frase antes de
  pausa ("é para preencher silêncio"). Sobra de "tipo", "assim", "é…" sem sentido: tire quando atrapalhar.
- Repetição de ideia que só quem gravou percebe (falou uma coisa e repete com outras palavras mais tarde): a IA não vê
  congruência. Marque o que suspeitar e deixe a pessoa decidir.
- Nunca comer palavra da versão final. Emenda dentro de palavra colada: corte no começo do "f"/"s".

## Imagem
- **Gravação de tela**: enquadramento FIXO o vídeo todo, sem a barra de cima do sistema (data, ícones) e sem o Dock
  ou a barra de tarefas — "deixa só o meio". Nada de deslocar o quadro clipe a clipe: dá "corte seco, a tela pula".
- **Zoom** só em poucos lugares, onde a pessoa aponta com o mouse, mostrando inteiro o que ela está apontando, e
  sempre **suave com keyframes** (0,8 s para entrar e 0,8 s para sair), nunca entrando no corte.
- Vídeo que a pessoa dá play na tela (exemplo, resultado): melhor pôr o próprio arquivo do vídeo por cima, com o som
  original, do que a gravação da tela.
- Resolução: quem edita escolhe — Full HD (mínimo; HD 720p não), 2K ou 4K. Fps da gravação.

- **Tela do Claude (ou de outra IA) trabalhando:** mostre a interface inteira, afastada, num quadro com perspectiva bem sutil que aproxima e afasta devagar. Não dê zoom em cima do texto. Quando a pessoa fala do prompt, traga para a frente, em perspectiva, o próprio balão do prompt na tela gravada (não um cartão refeito) e passe o marca-texto no trecho que ela está falando; depois volte para a IA trabalhando, acelerada e com um contador de tempo.
- **Prints de páginas de referência** (canal, vídeo, perfil): print limpo e nítido, só da parte que importa (o cabeçalho, os vídeos com as views), sem a interface do site em volta. Na intro, em perspectiva 3D, aproximando no número.

- **Tutorial (clique por clique):** dê zoom onde a pessoa clica no momento em que ela fala do botão (ex.: "clica em Sign up" → zoom no Sign up com o cursor, depois volta para a janela de cadastro) e mostre onde fica no site (o menu) antes da ferramenta aberta. Se a fala cita algo que a tela não mostra bem (menu, botão fora do recorte, opção escolhida rápido), ponha um letreiro amarelo na hora da fala. Confira se o recorte não corta o botão citado (o Sign up fica no canto da página).
- **Nenhuma tela de gravação parada:** todo trecho de tela tem uma aproximação lenta e contínua (1,00 → 1,07) quando não tem zoom próprio.

## Intro (os primeiros 30–60 s)
- Motion design em lettering: rótulo pequeno em serifa itálica sobre a palavra gigante, letra a letra com desfoque,
  brilho na cor, tracking que fecha, camadas. Animação simples de texto (só subir/aparecer) não serve.
- Uma troca visual a cada 1,5–2 s; prints e vídeos em perspectiva 3D quando o assunto tem números (seguidores, views),
  com destaque medido no print (nunca chutar a posição); @ e bio de terceiros borrados.
- Mockups bem feitos (ex.: o MacBook 3D de `template/componentes/notebook-3d.html`), nada de dois retângulos.

- **Vale também para tutorial e patrocínio montados com tela gravada à parte:** a intro é SEMPRE uma cena em motion (HyperFrames), nunca os resultados lado a lado tocando com som nem a tela gravada crua. Os resultados entram em celulares 3D, sem som e flutuando, com o letreiro de cada fala ("sem câmera", "sem gravar"…) e uma pílula em cada um quando ele é citado. A narração entra direto, sem esperar os vídeos falarem.
- **Ao apresentar a ferramenta ou o patrocinador:** as páginas do produto em perspectiva 3D, grandes e em movimento (aproxima, gira de leve, uma entra por trás da outra), com o #publi na palavra "patrocinado".
- **Enumeração na fala vira cena em motion:** "3 coisas", passos, regras do teste, dicas e recapitulação viram cartões e letreiros que entram na palavra falada (número grande, item riscado no que "não fazer", comando digitado numa caixa). Cartão estático em tela cheia não serve.

## Som
- Voz sempre na frente. Efeitos da intro ~4,6 dB acima do que parecia "discreto" (o Lucas subiu: estavam baixos).
- Trilha da intro ~25 dB abaixo da voz, com ducking e EQ em 2,5 kHz.
- **Trilha baixinha no corpo inteiro** (retenção): instrumental calma, sem voz cantada, ~23 dB abaixo da voz, sumindo
  onde toca um vídeo com som próprio.
- Falas baixas (quando a pessoa volta de uma espera falando baixinho) sobem até o nível normal.
- Master final −14 LUFS, −1 dBTP.

## Conferência antes de entregar (erros que mais voltam)
- **Retake que sobra:** confira cada linha marcada com ◐ ou ✂ no `qa_transcricao.txt` ouvindo o trecho com o modelo large do Whisper. O modelo pequeno não pega palavra dobrada ("eu… eu"), nem começo falso, nem frase repetida.
- **Tela parada ou repetida é erro:** nada de imagem parada por mais de uns 4 segundos, nem um material que já apareceu enquanto a pessoa fala de outra coisa. Confira em folhas de quadros a cada 2 ou 3 segundos, junto com a transcrição, antes de montar e de novo depois do render.
- **Corte depois da mixagem:** se um trecho sair depois que o som já foi mixado, refaça a trilha na linha do tempo nova e reajuste os tempos das animações. Nunca corte o áudio já mixado, porque a música pula.
- **Narração gravada antes da tela:** compare cada fala com o que aconteceu na gravação. O que não bater vira uma lista de falas para a pessoa regravar, com o texto novo. Nunca monte a imagem fingindo que aconteceu o que ela disse.
- **Dados pessoais na gravação da tela inteira:** passe OCR nos quadros atrás de WhatsApp, e-mail, códigos, chaves e abas pessoais. Corte a barra de abas e o endereço do navegador e borre o que sobrar.

- **Retake fora da transcrição pequena:** o modelo small às vezes nem transcreve uma tentativa (ex.: "o outro é uma influenciadora" antes de "ou até um influenciador que não existe") e ela fica no corte. Transcreva a voz JÁ CORTADA inteira com o large-v3-turbo e leia procurando frase dita duas vezes.
- **Comando ou palavra que a pessoa tenta falar e desiste** ("cancel out…" e depois "o comando que tá na tela"): corte a tentativa e deixe o comando escrito na tela.

## Conversa com a pessoa
- Diga sempre que ela pode receber o vídeo pronto aqui, sem editor, e pedir ajustes em palavras — ou exportar para
  o Premiere ou o CapCut se quiser mexer em algo à mão (não é obrigatório).
- Pergunte de uma vez só o que não estiver nas preferências dela; sem resposta, use estes padrões e diga quais usou.
- A regra de muletas é mais agressiva que a edição manual do Lucas (num vídeo de 20 min ela pega ~3x mais): no
  primeiro vídeo da pessoa, pergunte se ficou bom ou se quer só as do começo da frase.

## Retakes e emendas (18/11)
- **Nunca entregar com retake.** O Whisper do áudio já cortado esconde a sobra de 0,1–0,3 s da 1ª tentativa colada antes da
  boa e a palavra comida quando a muleta "E" é cortada sem pausa. Rode `conferir_retakes.py` (palavra a palavra e emenda por
  emenda no envelope de 10 ms).
- **Emenda no quadro:** os cortes são em quadros de 33 ms; um quadro a mais deixa "q-", "pra-" da palavra tirada, um a menos
  come a 1ª sílaba. Rode `aparar_emendas.py` depois do `cortes.py`.
- **Repetição curta:** "as as imagens", "do… do painel" passam pelo conferidor porque o Whisper escreve uma palavra só. O
  `achar_repeticoes.py` acha pela transcrição original (as duas cópias dentro da edição). O sinal de som sozinho dá alarme
  falso: confira com a transcrição da janela.

