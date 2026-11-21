# Exportar para o Premiere (opcional) e voltar dele

Para quem quer mexer à mão (cortar um erro que só ela vê, um silêncio, trocar a ordem). Não é obrigatório: o vídeo
pode sair pronto pelo `renderizar.py`. `S=~/.claude/skills/edicao-youtube/scripts`, `PY` = Python do painel.

## 1. Mandar a sequência
```bash
$PY -I $S/premiere_xml.py "$V/trabalho" "$V/premiere/<nome>.xml" --nome "<sequência>" \
   [--intro intro-vN-video.mp4 --voz-intro intro-vN-voz.wav --stem intro-vN-efeitos.wav --stem intro-vN-trilha.wav] \
   [--audio audio_da_gravacao.wav] [--extra video_pronto.mp4@SEG_BRUTO] [--marca SEG_BRUTO "texto"] [--marca-ed SEG "texto"]
```
- Sequência na resolução escolhida (job.json `"resolucao"` ou `--resolucao`) e no fps da gravação; V1 intro +
  gravação; A1/A2 a voz; um par de faixas por stem; `--extra` entra desativado em V2 (ex.: o vídeo pronto que aparece
  tocando na tela); marcadores nos pontos para conferir (o que a IA ficou na dúvida).
- Stems da intro: `mixar_intro.py PASTA_HF "$V" --versao vN` (voz, efeitos SEM a voz — ele confere —, trilha e o
  vídeo sem som). Intro em 2K/4K: renderize em 4K (`--resolution landscape-4k`); o Premiere reduz.
- **Abrir**: Mac com o Premiere aberto → `open -a "Adobe Premiere Pro <ano>" "<xml>"` (com um projeto aberto, a
  sequência entra nele; sem projeto, ele cria um novo — peça para salvar). Windows ou se não abrir: Arquivo →
  Importar → o XML. Diga à pessoa o nome da sequência nova.
- O projeto que o Premiere cria do XML só vai para o disco quando a pessoa salva: peça para salvar (Cmd/Ctrl+S).

## 2. Ler o que a pessoa fez (sem ela exportar nada)
O Premiere salva sozinho a cada ~2 min em `Documentos/Adobe/Premiere Pro/<versão>/Adobe Premiere Pro Auto-Save/`.
O auto-save mais novo tem as edições, mesmo sem ela salvar.
- `premiere_ler.py AUTOSAVE.prproj saida.json [--sequencia "nome"]`: cortes, clipes desativados, volume de cada
  clipe (o Premiere guarda linear: 0,1778 = 0 dB; rampa de volume vira o valor final), escala, marcadores.
- **Ache a sequência que ela editou** lendo TODAS: às vezes ela continua na antiga, não na que você mandou.
- Antes de usar, confira que não veio auto-save novo depois de ela dizer que parou (compare os arquivos).
- Guarde uma cópia do auto-save lido em `$V/premiere/edicoes/`.

## 3. Trocar algo sem perder o que ela fez (qualidade, intro, som das demos)
Nunca refaça do edl.json depois que ela editou. Refaça a partir da sequência DELA:
```bash
$PY -I $S/premiere_refazer.py AUTOSAVE.prproj "$V/premiere/<nome> FINAL.xml" --sequencia "<a dela>" --nome "<nova>" \
   --resolucao <escolhida> --fps 60 --trocar intro-vN-video.mp4=intro-vM-video.mp4 ... \
   [--enquadrar enquadramento.json] [--ganhos ganhos.json --ganhos-arquivo <áudio>] [--musica trilha-corpo.wav@<início>] \
   [--demo fonte.mp4@INICIO_BRUTO@FIM_BRUTO@GANHO_DB ...]
```
Mantém cortes, clipes que ela trocou (ex.: vídeos de demo na V1), volume de cada clipe (o efeito do PAR L/R: se ela
subiu só a A1, vale 20·log10((gL+gR)/2) nas duas) e o tamanho relativo do que ela pôs. `--demo` põe o som limpo de
um vídeo que tocou na tela em duas faixas novas, picado igual aos cortes dela (para ela ajustar).
Depois de abrir: leia o auto-save seguinte e compare (cortes iguais = 0 diferenças; escala/posição dos zooms = o
calculado; keyframes no lugar). Se precisar calibrar algo no Premiere com uma sequência de teste, diga o nome dela
para a pessoa apagar.

Formato do XML (calibrado no Premiere 2026): Centro do Movimento em frações do tamanho da MÍDIA a partir do centro
da sequência; `<when>` do keyframe em quadros da MÍDIA (como o `<in>`); nível de áudio linear (1 = 0 dB).

## 4. Finalizar depois que ela termina a decupagem
Ela avisa "terminei". A partir do auto-save:
1. `premiere_aprender.py "$V/trabalho" AUTOSAVE rel.md --sequencia "<a dela>"` → o que ela tirou além da skill
   (silêncio/respiro, muleta, retake, frase), o que trouxe de volta, as pausas que deixa. Leve as regras para
   `<pasta de trabalho>/youtube/preferencias.md` (e, se forem claras, proponha mudar o padrão da skill);
2. `enquadrar_tela.py AUTOSAVE enquadramento.json --sequencia "<a dela>"` (base fixa + zoom suave; ~5 min por hora de bruto);
3. `nivelar_voz.py AUTOSAVE ganhos.json --sequencia ... --audio <áudio da gravação>`;
4. `trilha_corpo.py AUTOSAVE trilha-corpo.wav --sequencia ... --voz <áudio> --musicas "<5–7 instrumentais do pack>"`;
5. `premiere_refazer.py` com tudo (acima) → sequência "FINAL" na resolução escolhida; abra e confira pelo auto-save.
