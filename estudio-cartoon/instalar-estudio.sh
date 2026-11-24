#!/usr/bin/env bash
# Prepara o estúdio de desenho 3D (bonecos 2D com traço num mundo 3D com contorno preto) numa sessão nova.
# uso: bash estudio-cartoon/instalar-estudio.sh
set -e
AQUI="$(cd "$(dirname "$0")" && pwd)"
# 1) skill cartoon-3d-short (kit do Mr Omi, licença MIT): o passo a passo, as medidas de estilo e os modelos de código
if [ ! -f ~/.claude/skills/cartoon-3d-short/SKILL.md ]; then
  git clone --depth 1 https://github.com/mromidev/claude-animated-shorts ~/.claude/skills/cartoon-3d-short
fi
# 2) plugins de design (freshtechbro/claudedesignskills): Three.js, GSAP, Blender, Rive, Lottie, design moderno
if command -v claude >/dev/null; then
  claude plugin marketplace add freshtechbro/claudedesignskills || true
  for p in core-3d-animation authoring-motion animation-components meta-skills; do claude plugin install "$p@claude-design-skillstack" || true; done
fi
# 3) Remotion + three.js do projeto
cd "$AQUI" && npm install --no-audit --no-fund
echo "Estúdio pronto. Teste: node scripts/bridge-stills.mjs out/teste/x_ 60,700 0.5"
