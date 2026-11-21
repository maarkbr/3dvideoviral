#!/usr/bin/env bash
# Instalador do Edição com IA (Mac e Linux).
#   bash instalar.sh --pasta "~/Meu Canal" --sim                 cria a pasta, instala o painel e testa
#   bash instalar.sh --pasta "~/Meu Canal" --estilo video-3d --sim   instala também um estilo (ou --todos)
#   bash instalar.sh --pasta "~/Meu Canal" --conferir            só confere
# Quem faz o trabalho é o instalar.py (o mesmo no Windows). Este arquivo só garante um Python para rodá-lo.
AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY="$(command -v python3 || true)"
if [ "$(uname)" = "Darwin" ] && [ "$PY" = "/usr/bin/python3" ] && ! xcode-select -p >/dev/null 2>&1; then PY=""; fi
if [ -z "$PY" ]; then
  if command -v brew >/dev/null 2>&1; then
    echo "Instalando o Python 3.12 pelo Homebrew…"; brew install python@3.12 && PY="$(command -v python3.12 || command -v python3)"
  fi
fi
if [ -z "$PY" ]; then
  echo "Falta o Python 3 neste computador. Instale em https://www.python.org/downloads/ (ou: brew install python@3.12) e rode de novo."
  exit 1
fi
exec "$PY" "$AQUI/skills/painel-edicao-com-ia/scripts/instalar.py" "$@"
