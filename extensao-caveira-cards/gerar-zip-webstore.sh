#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# gerar-zip-webstore.sh
# Gera o ZIP correto para submissão na Chrome Web Store.
#
# O arquivo ZIP deve conter APENAS o conteúdo da pasta caveira-cards/,
# com o manifest.json na RAIZ do zip (não em subpasta).
#
# Uso:  bash gerar-zip-webstore.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

PASTA="caveira-cards"
OUTPUT="CaveiraCards-webstore.zip"

# Remove zip antigo
rm -f "$OUTPUT"

# Entra na pasta da extensão e zipa o conteúdo
cd "$PASTA"
zip -r "../$OUTPUT" . \
  --exclude "*.py" \
  --exclude "*.apkg" \
  --exclude ".gitignore" \
  --exclude ".DS_Store" \
  --exclude "__pycache__/*"
cd ..

echo ""
echo "✓ ZIP gerado: $OUTPUT"
echo ""
echo "Estrutura do zip (primeiros arquivos):"
unzip -l "$OUTPUT" | head -20
echo ""
echo "➜ Faça upload deste arquivo em: https://chrome.google.com/webstore/developer/dashboard"
