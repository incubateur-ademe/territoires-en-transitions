#!/usr/bin/env bash
# Exporte COOLIFY_ENDPOINT et COOLIFY_TOKEN pour le provider Terraform `coolify`
# (infra/coolify-preprod/) et les scripts d'API Coolify. À SOURCER, comme
# scripts/tf-env.sh :
#
#     source infra/scripts/coolify-env.sh
#
# Le token API Coolify (format {id}|{token}) est créé UNE fois dans l'UI
# (Security > API Tokens, scope root), puis stocké dans Scaleway Secret Manager.
# On ne le met jamais en clair dans le repo ni dans le state (R4).

export COOLIFY_ENDPOINT="${COOLIFY_ENDPOINT:-https://coolify.preprod.territoiresentransitions.fr/api/v1}"
_secret_name="${COOLIFY_TOKEN_SECRET_NAME:-tet-preprod-coolify-api-token}"

if [ -z "${COOLIFY_TOKEN:-}" ] && command -v scw >/dev/null 2>&1; then
  # raw=true renvoie la charge utile telle quelle (pas de JSON, pas de base64).
  COOLIFY_TOKEN="$(scw secret version access-by-path \
    secret-name="$_secret_name" secret-path=/ revision=latest raw=true 2>/dev/null || true)"
fi

if [ -z "${COOLIFY_TOKEN:-}" ]; then
  echo "coolify-env.sh : COOLIFY_TOKEN introuvable." >&2
  echo "  1. Créer un token dans Coolify (Security > API Tokens, scope root)." >&2
  echo "  2. Le stocker dans Secret Manager :" >&2
  echo "       scw secret create name=$_secret_name" >&2
  echo "       scw secret version create secret-name=$_secret_name secret-path=/ data='<id>|<token>'" >&2
  echo "  ou l'exporter manuellement : export COOLIFY_TOKEN='<id>|<token>'" >&2
  return 1 2>/dev/null || exit 1
fi

export COOLIFY_TOKEN
# Le provider Terraform `coolify` exige `token` : on le fournit via TF_VAR_*.
export TF_VAR_coolify_token="$COOLIFY_TOKEN"
echo "coolify-env.sh : COOLIFY_TOKEN chargé, endpoint=$COOLIFY_ENDPOINT"
