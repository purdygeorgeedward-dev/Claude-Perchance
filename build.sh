#!/bin/sh
# Builds installable packages into dist/.
set -e
cd "$(dirname "$0")"
rm -rf dist && mkdir -p dist/ext
cp -r manifest.json rules.json src icons dist/ext/
(cd dist/ext && zip -qr ../claude-perchance.zip . && cp ../claude-perchance.zip ../claude-perchance.xpi)
echo "Built dist/claude-perchance.zip and dist/claude-perchance.xpi"
