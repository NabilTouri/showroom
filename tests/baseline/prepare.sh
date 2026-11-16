#!/usr/bin/env bash
# Builds the original app (commit 7885117) in a git worktree outside the repository, for
# tests/baseline/compare.spec.ts. Usage: tests/baseline/prepare.sh [dir] (default ../showroom-baseline)
set -euo pipefail
REPO="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
DIR="$(realpath -m "${1:-$REPO/../showroom-baseline}")"
REF=7885117

if [ ! -d "$DIR" ]; then git -C "$REPO" worktree add --detach "$DIR" "$REF"; fi
cd "$DIR"
git checkout --quiet --force "$REF"
# The original grain textures use Math.random(); the current app uses a seeded generator
# (mulberry32, seeds 1 and 2 in creation order). Apply the same generator to the baseline so that
# both apps produce identical textures and screenshots can be compared pixel by pixel.
node "$REPO/tests/baseline/seed-baseline.mjs" src/car/textures.js
npm ci --no-audit --no-fund
npx vite build
echo "Baseline ready in $DIR"
