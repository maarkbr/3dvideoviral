# Conferir, mostrar e renderizar

## Prévia (sempre no painel do app)
```
npx --yes hyperframes@0.9.58 preview --no-open --port 3010   (na pasta do vídeo, em segundo plano)
```
- Ligue a prévia com `--no-open`: sem essa opção, o HyperFrames abre o navegador sozinho no meio do trabalho.
- Mostre o endereço que ele imprime para a pessoa abrir (no painel do app do Claude, se tiver, ou no navegador).
- Use uma porta diferente para cada vídeo (3004, 3005, 3006...).
- Se o painel mostrar uma versão antiga depois de mudar um arquivo da `biblioteca/`, o estúdio guardou cópia. Recarregue a prévia pedindo os arquivos de novo (`fetch(arquivo, { cache: 'reload' })` dentro da prévia e depois recarregar).
- O painel não mostra imagens soltas do computador. Para ver imagens, abra pelo servidor da prévia: `http://localhost:<porta>/api/projects/<id>/preview/<caminho>`.

## Checagem
```
cd <pasta-do-video> && npx --yes hyperframes@0.9.58 check
```
Tem que dar `Check passed`, sem erros. Avisos que importam:
- `outside_safe_zone`: algo na faixa de baixo, onde ficam os botões das redes. Suba.
- `line_unread`: legenda que some rápido demais. A última frase precisa de pelo menos 2 s.
- `gsap_tween_tail`: duas animações brigando pela mesma parte do corpo. Afaste no tempo.
- Avisos de contraste em texto com contorno grosso podem ser ignorados.

## Quadros parados (antes de renderizar, sempre)
```
PY <skill>/animado/scripts/quadros.py <pasta-do-video> "2.3,6,8.2,15.5,24,28.8,31,35.2,40.2,42.8" "cama entra|trancado|relógio|..."
```
- Um quadro por momento importante (um por bloco, mais as entradas de objeto).
- Antes de mostrar, olhe você mesmo os quadros e melhore o que estiver pobre: personagem pequeno, objeto atrás da cabeça, coisa cortada na borda, legenda em cima do rosto.
- Para provar a regra do objeto, tire um quadro logo antes da palavra (o objeto não aparece) e um logo depois (está começando a entrar).
- Mostre a página no painel do app e **espere a aprovação** para renderizar.

## Renderizar
```
cd <pasta-do-video> && npx --yes hyperframes@0.9.58 render -o renders/<nome>.mp4 --fps 30 --quality looks
```
Rode em segundo plano: demora por volta de 1 minuto.

## Conferir o MP4
```
PY <skill>/animado/scripts/conferir.py <pasta>/renders/<nome>.mp4 "1.62,2.3,6,8.2,11,15.5,19.7,24,28.8,31,35.2,40.2,43"
```
Tem que dar:
- 1080×1920, 30 fps, a duração certa;
- som em -14 LUFS (± 0,5), pico abaixo de -1 dBTP;
- 0 trechos pretos e 0 travados;
- a folha de quadros do vídeo final com tudo no lugar (3D, personagens, objetos, legenda).

Depois abra o MP4 no painel do app pelo endereço da prévia (`.../preview/renders/<nome>.mp4`).

## O que dizer no fim
O que foi feito, os números da conferência, onde está o arquivo, e o que **não** foi conferido (o som de ouvido).
