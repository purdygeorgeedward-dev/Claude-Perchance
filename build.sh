#!/bin/sh
# Builds installable packages into dist/.
set -e
cd "$(dirname "$0")"
rm -rf dist && mkdir -p dist/ext
cp -r manifest.json rules.json src icons dist/ext/
(cd dist/ext && zip -qr ../claude-drawing-hand.zip . && cp ../claude-drawing-hand.zip ../claude-drawing-hand.xpi)
echo "Built dist/claude-drawing-hand.zip and dist/claude-drawing-hand.xpi"
