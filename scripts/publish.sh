#!/bin/zsh
# Controlla i dati del giorno e li pubblica su GitHub Pages.
# Uso: ./scripts/publish.sh
set -e
cd "$(dirname "$0")/.."

node scripts/validate-data.mjs

DATA=$(node -p "require('./docs/data/latest.json').date")
mkdir -p docs/data/archive
cp docs/data/latest.json "docs/data/archive/$DATA.json"
# tiene in archivio solo gli ultimi 14 giorni
ls -1 docs/data/archive/*.json | sort -r | tail -n +15 | xargs -I{} rm -f {}

git add docs/data
if git diff --cached --quiet; then
  echo "Nessuna novità da pubblicare."
  exit 0
fi
git commit -q -m "Edizione $DATA"
git push -q origin main
echo "Pubblicata l'edizione $DATA."
