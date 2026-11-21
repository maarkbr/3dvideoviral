# Conferência: quadros, render e prova final

## Quadros parados (antes do render)

1. No projeto, rodar `npx hyperframes snapshot --at <segundos separados por vírgula> --no-end -o .prints/vN`. Escolher **um segundo dentro de cada plano**, de preferência perto do meio.
2. Abrir as folhas (`contact-sheet*.jpg`) com Read e olhar **tudo**. A lista do que já deu errado e como resolver:

| Problema | Como resolver |
|---|---|
| Close perto demais (só um olho, cabeça cortada) | Afastar para 3 a 3,5 m (tabela em `camera-e-luz.md`). |
| Câmera atrás da cabeça de alguém, com um borrão escuro na frente | Mover o boneco naquele período ou subir a câmera. |
| Texto da placa cortado | Use `escrever(...)`, que diminui a letra sozinha; confira se a câmera cabe a largura da placa. |
| Branco sobre branco (giz no muro claro) | Trocar a cor do texto. |
| Legenda em cima de texto da cena | Apontar a câmera mais para baixo, para o texto subir no quadro. |
| Noite clara, parecendo dia nublado | Pouca luz de céu e postes extras perto da ação. |
| Placa sumindo no escuro | Brilho próprio na placa (`emissive`). |
| Objeto pequeno virando bloco feio no close (peças de dominó) | Tirar o objeto ou fazer com detalhe. |
| Pose que não se lê (braço indo para a câmera) | Abrir para o lado e para cima. |
| Cachorro ou objeto tampando o plano | Mudar de lugar naquele período. |
| Gente demais ou de menos | Praça viva: pipoqueiro, crianças correndo, conversas. |

3. Rodar `npx hyperframes check`. O resultado precisa ser:
   - **0 erros**;
   - nenhum aviso de área segura (`outside_safe_zone`);
   - "canvas encosta na borda" e "linha do tempo densa" são normais.
4. Rodar `PY ferramentas/pagina_quadros.py <projeto> .prints/vN [.prints/ajuste]`, servir a pasta `quadros/` (veja "Painel" no SKILL.md) e abrir no painel.
5. **Parar e esperar o "pode renderizar".** Antes, avisar o que não dá para ver nos quadros: o som (o Claude não ouve) e a duração da voz.

## Render

- **Comando:** `npx hyperframes render --fps 60 --output render/<nome>.mp4`, em segundo plano.
- **Tempo:** uns 2 a 3 minutos para 1 minuto de vídeo.
- **Quando falha por "disk capture":** é falta de disco temporário. Rode de novo com `--workers 1`, que manda os quadros direto para o vídeo sem guardar. Não apagar nada do Lucas para liberar espaço; só com o "sim" dele.

## Prova final

- **Comando:** `PY ferramentas/conferir_video.py <projeto>`.
- **O que ele confere:**
  - formato 1080x1920 a 60 quadros por segundo, com som;
  - duração igual à do mix;
  - −14 LUFS, com pico até −1 dB;
  - nenhum trecho preto e nenhuma imagem congelada;
  - som começando no mesmo instante do mix.
- **Folha:** grava `render/folha-video.jpg`. **Abrir a folha e olhar**: se algum quadro estiver errado, corrigir e renderizar de novo.
- **Resultado:** precisa terminar em **APROVADO**. Mostrar o comando e a saída para a pessoa.

## Mostrar no painel

1. Copiar o vídeo para a página: `ffmpeg -i render/<nome>.mp4 -c copy -movflags +faststart quadros/<nome>.mp4`. O faststart faz o vídeo tocar na hora.
2. Abrir `quadros/video.html` (no painel do app do Claude, se tiver, ou no navegador).
3. Conferir se o vídeo carregou: a duração e o tamanho aparecem no player.

## Disco

- **Ocupam espaço:** os prints de teste (`.prints/`) e os renders.
- **Para apagar:** só com o "sim" da pessoa.
