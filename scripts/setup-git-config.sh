#!/usr/bin/env sh
# scripts/setup-git-config.sh
#
# Registers the custom `ours-then-install` merge driver for pnpm-lock.yaml.
# This driver:
#   1. Accepts the incoming (theirs) version of the lockfile — avoiding
#      hundreds of conflict markers — then
#   2. Runs `pnpm install` to reconcile the result so node_modules stays
#      consistent.
#
# HOW TO USE
#   Run once after cloning, or any time you switch machines:
#     sh scripts/setup-git-config.sh
#
# This script is also called automatically by `pnpm prepare` (husky init)
# so new contributors never have to think about it.
#
# WHY THIS FILE EXISTS
#   Git merge drivers cannot be stored inside .gitattributes alone — the
#   [merge "driver-name"] section must live in git config.  Since git config
#   is not committed, every developer's machine needs a one-time setup.

set -e

echo "🔧  Registering pnpm-lock.yaml merge driver..."

git config merge.ours-then-install.name \
  "Accept incoming lockfile, then run pnpm install"

# %O = base,  %A = ours (written in-place),  %B = theirs
# We copy %B (upstream version) into %A (our working copy), then install.
git config merge.ours-then-install.driver \
  "cp %B %A && pnpm install"

echo "✅  Done. Git will now resolve pnpm-lock.yaml conflicts automatically."
