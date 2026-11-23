#!/usr/bin/env bash
# Publie la release GitHub d'une mise en production.
#
# - Tag CalVer vAAAA.M.N : N-ième mise en prod du mois (heure de Paris).
# - Notes : les commits feat et fix depuis la release précédente, regroupés
#   par domaine (le scope du commit).
# - Le tag est créé par l'API GitHub sur le commit promu : aucun push git.
#
# Usage : publish-release.sh <sha>...
#   Un sha par application promue ; ils doivent être identiques.
#   DRY_RUN=1 affiche le tag et les notes sans rien publier.
set -euo pipefail

: "${1:?usage : publish-release.sh <sha>...}"
repo="${GITHUB_REPOSITORY:-incubateur-ademe/territoires-en-transitions}"

if [ "$(printf '%s\n' "$@" | sort -u | wc -l)" -ne 1 ]; then
  echo "::error::Les applications ne sont pas au même commit ($*) : pas de release." >&2
  exit 1
fi
sha="$(git rev-parse --verify "$1^{commit}")"

# Relance du workflow sans nouveau commit : la release existe déjà.
released="$(git tag --points-at "$sha" --list 'v[0-9]*' | head -n 1)"
if [ -n "$released" ]; then
  echo "$sha est déjà publié : $released."
  exit 0
fi

from="$(git describe --tags --abbrev=0 --match 'v[0-9]*' "$sha")"

month="$(TZ=Europe/Paris date +%Y.%-m)"
# Compteur strictement numérique : un tag suffixé (v2026.11.1-hotfix1) ne compte pas.
last="$(git tag --list "v$month.*" | sed -nE "s/^v$month\.([0-9]+)$/\1/p" | sort -n | tail -n 1)"
# 10# : un tag posé à la main avec un zéro initial (v2026.11.08) n'est pas lu en octal.
tag="v$month.$((10#${last:-0} + 1))"

# section <titre> <type de commit>
section() {
  local lines
  lines="$(git log --format='%s (%h)' "$from..$sha" \
    | sed -nE \
      -e "s/^$2\(([^)]+)\)!?: (.*)/- **\1 :** \2/p" \
      -e "s/^$2!?: (.*)/- \1/p" \
    | LC_ALL=C sort -s -t: -k1,1)"
  [ -z "$lines" ] || printf '## %s\n\n%s\n\n' "$1" "$lines"
}

notes="$(section '✨ Nouveautés' feat; section '🐛 Corrections' fix)"
[ -n "$notes" ] || notes='Maintenance technique, sans changement visible.'
notes="$notes

**Tous les changements :** https://github.com/$repo/compare/$from...$tag"

if [ -n "${DRY_RUN:-}" ]; then
  printf '%s sur %s (depuis %s)\n\n%s\n' "$tag" "$sha" "$from" "$notes"
  exit 0
fi

printf '%s\n' "$notes" \
  | gh release create "$tag" --repo "$repo" --target "$sha" --title "$tag" --notes-file -
