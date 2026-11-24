#!/bin/bash
# Estúdio de desenho 3D: render no seu Mac (usa a placa de vídeo pelo ANGLE/Metal)
cd "$(dirname "$0")"
echo "=== Estúdio de desenho 3D: render no seu Mac ==="
command -v node >/dev/null || { echo "Falta o Node.js. Instale em https://nodejs.org e rode de novo."; read -n1; exit 1; }
if [ ! -d node_modules ]; then echo "Instalando as peças do estúdio (só na primeira vez)..."; npm install --no-audit --no-fund || { echo "Falhou a instalação. Mande um print desta janela no chat."; read -n1; exit 1; }; fi
mkdir -p out/tmp; export TEMP="$PWD/out/tmp" TMP="$PWD/out/tmp" TMPDIR="$PWD/out/tmp/"
COMP="${1:-Salario}"; QUADROS="${2:-}"; ARGQ=""; [ -n "$QUADROS" ] && ARGQ="--frames=$QUADROS"
echo "Renderizando $COMP..."
npx remotion render src/index.ts "$COMP" "out/$COMP.mp4" $ARGQ --gl=angle --codec=h264 --crf=16 || { echo "Deu erro. Mande um print desta janela no chat."; read -n1; exit 1; }
echo; echo "Pronto! O vídeo está em: $PWD/out/$COMP.mp4"; open out; read -n1
