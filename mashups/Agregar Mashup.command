#!/bin/zsh
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "No se encontró Node.js. Instálalo desde https://nodejs.org y vuelve a abrir este archivo."
  read "?Pulsa Enter para cerrar..."
  exit 1
fi
node agregar-mashup.mjs
read "?Pulsa Enter para cerrar..."
