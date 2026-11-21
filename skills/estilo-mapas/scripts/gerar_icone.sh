#!/bin/bash
# gerar_icone.sh <nome> "<descrição do objeto em inglês>"
# Gera um ícone 3D polido pelo GPT Image (Higgsfield CLI), remove o fundo verde e guarda em <skill>/icones3d/<nome>.png.
# Custa ~2,75 créditos. O <nome> é o que vai no roteiro (campo "emoji" dos itens/cena; o nome do campo é antigo, o conteúdo é o ícone).
# Sem o CLI (higgsfield)? Peça o mesmo ao conector Higgsfield do Claude (generate_image, gpt_image_2_6, 1:1) com o prompt abaixo,
# salve a imagem, e tire o fundo verde com: ffmpeg -i in.png -vf "colorkey=0x00FF00:0.32:0.12,despill=type=green:mix=.5,scale=512:512" <nome>.png
SK="$(cd "$(dirname "$0")/.." && pwd)"; N=$1; D=$2
[ -z "$N" ] || [ -z "$D" ] && { echo 'uso: gerar_icone.sh <nome> "<descrição em inglês>"'; exit 1; }
P="A single premium 3D rendered icon of $D. Glossy, soft studio lighting, subtle rim light, rich saturated colors, clean modern game-asset look, centered, filling about 80 percent of the frame, no text, no letters, no watermark. Plain flat pure green chroma-key background (#00FF00), no shadow on the background, no floor."
U=$(higgsfield generate create gpt_image_2_6 --prompt "$P" --aspect_ratio 1:1 --quality high --resolution 1k --wait --json 2>/dev/null | python3 -c "import json,sys;d=json.load(sys.stdin);d=d[0] if isinstance(d,list) else d;print(d.get('result_url') or ((d.get('results') or [{}])[0].get('url','')))")
[ -z "$U" ] && { echo "falhou $N (não reenvie sozinho: confira antes se o job foi cobrado: higgsfield generate list)"; exit 1; }
curl -s -o "/tmp/$N.raw.png" "$U"
ffmpeg -v error -y -i "/tmp/$N.raw.png" -vf "colorkey=0x00FF00:0.32:0.12,despill=type=green:mix=.5,scale=512:512" "$SK/icones3d/$N.png" && echo "ok $N -> $SK/icones3d/$N.png"
