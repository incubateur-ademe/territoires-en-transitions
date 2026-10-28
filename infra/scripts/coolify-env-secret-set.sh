#!/usr/bin/env bash
# Dépose une nouvelle version d'un secret de variable d'environnement Coolify.
# La valeur est lue sur l'entrée standard, jamais en argument : elle n'apparaît
# ni dans `ps` ni dans l'historique du shell.
#
#   infra/scripts/coolify-env-secret-set.sh <env> <nom-court> < fichier
#   pbpaste | infra/scripts/coolify-env-secret-set.sh preprod brevo-api-key
#
# Le secret doit exister (coquille créée par infra/coolify/env-secrets.tf) :
# tet-<env>-<nom-court> dans /coolify-env/<env>. Une valeur identique à la
# dernière version n'en crée pas de nouvelle.
#
# Ensuite, pour la pousser dans Coolify : incrémenter coolify_env_revision dans
# infra/coolify/terraform.tfvars et appliquer infra/coolify.
#
# Variables optionnelles :
#   SECRET_PROJECT_ID   projet Scaleway du secret ; défaut : project_id de
#                       infra/coolify/terraform.tfvars (la prod a le sien)
#   STRIP_NEWLINE       false pour garder un retour à la ligne final (défaut :
#                       il est retiré, sauf pour un PEM)
set -euo pipefail

[ $# -eq 2 ] || {
  echo "Usage : $0 <env> <nom-court>   (valeur sur l'entrée standard)" >&2
  exit 2
}
_env="$1"
_name="tet-${1}-${2}"
_path="/coolify-env/${1}"

for bin in scw jq base64; do
  command -v "$bin" >/dev/null 2>&1 || {
    echo "✗ '$bin' requis mais introuvable." >&2
    exit 1
  }
done

if [ -z "${SECRET_PROJECT_ID:-}" ]; then
  _tfvars="$(git rev-parse --show-toplevel)/infra/coolify/terraform.tfvars"
  SECRET_PROJECT_ID="$(sed -nE \
    's/^[[:space:]]*project_id[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/p' "$_tfvars" | head -n1)"
fi
: "${SECRET_PROJECT_ID:?SECRET_PROJECT_ID introuvable}"

if [ -t 0 ]; then
  echo "✗ Valeur attendue sur l'entrée standard (fichier, pipe ou heredoc)." >&2
  exit 2
fi

umask 077
_tmp="$(mktemp -d)"
trap 'rm -rf "$_tmp"' EXIT
cat >"$_tmp/value"

# Un retour à la ligne final laissé par un éditeur ou par `echo` finirait dans
# la variable, et casserait une URL ou une clé. Un PEM, lui, le garde.
if [ "${STRIP_NEWLINE:-true}" = "true" ] && ! grep -q -- '-----BEGIN' "$_tmp/value"; then
  printf '%s' "$(cat "$_tmp/value")" >"$_tmp/value"
fi
[ -s "$_tmp/value" ] || {
  echo "✗ Valeur vide, rien n'est déposé." >&2
  exit 1
}

_id="$(scw secret secret list name="$_name" path="$_path" project-id="$SECRET_PROJECT_ID" -o json \
  | jq -r '.[0].id // empty')"
if [ -z "$_id" ]; then
  echo "✗ Secret ${_path}/${_name} introuvable. Est-il au manifeste (infra/coolify/env-manifest.tf), et infra/coolify appliqué ?" >&2
  exit 1
fi

# Pas de nouvelle version si la valeur n'a pas changé.
if scw secret version access "$_id" revision=latest -o json 2>/dev/null \
  | jq -r '.data' | base64 --decode 2>/dev/null | cmp -s - "$_tmp/value"; then
  echo "✓ ${_name} : valeur identique à la dernière version, rien à faire."
  exit 0
fi

scw secret version create "$_id" data=@"$_tmp/value" -o json >/dev/null
echo "✓ ${_name} : nouvelle version déposée."
echo "  Pour la pousser : incrémenter coolify_env_revision (infra/coolify/terraform.tfvars), puis apply."
