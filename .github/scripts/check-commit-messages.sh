#!/usr/bin/env bash
# Vérifie que les sujets de commit lus sur stdin (un par ligne) suivent
# Conventional Commits : « type(scope): description ». Le changelog des
# releases en dépend (publish-release.sh).
set -euo pipefail

pattern='^(feat|fix|perf|refactor|test|docs|chore|ci|build|style|revert)(\([^)]+\))?!?: .+'

bad="$(grep -vE "$pattern" || true)"
if [ -n "$bad" ]; then
  echo "Sujets de commit hors convention :"
  printf '%s\n' "$bad" | sed 's/^/  /'
  echo "Attendu : type(scope): description, par exemple « fix(plans): corrige l'import »."
  echo "Types : feat, fix, perf, refactor, test, docs, chore, ci, build, style, revert."
  exit 1
fi
