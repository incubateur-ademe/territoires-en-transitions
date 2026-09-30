#!/usr/bin/env bash
# Exporte COOLIFY_ENDPOINT et COOLIFY_TOKEN pour le provider Terraform `coolify`
# (infra/coolify/) et les scripts d'API Coolify. À SOURCER, comme
# scripts/tf-env.sh :
#
#     source infra/scripts/coolify-env.sh
#
# Le token API Coolify (format {id}|{token}) est créé UNE fois dans l'UI
# (Security > API Tokens, scope root), puis stocké dans Scaleway Secret Manager.
# On ne le met jamais en clair dans le repo ni dans le state (R4).

# L'instance Coolify est transverse : un seul endpoint pilote tous les
# environnements, d'où l'absence de préfixe d'environnement ici.
export COOLIFY_ENDPOINT="${COOLIFY_ENDPOINT:-https://coolify.territoiresentransitions.fr/api/v1}"
_secret_name="${COOLIFY_TOKEN_SECRET_NAME:-tet-platform-coolify-api-token}"
# Projet du secret. Sans valeur, scw prend le projet par défaut du profil : si
# celui-ci vise un autre projet, le token est introuvable, ou pire, c'est un
# secret homonyme d'un autre projet qui est lu.
_project_arg=()
[ -n "${COOLIFY_TOKEN_SECRET_PROJECT_ID:-}" ] && _project_arg=(project-id="$COOLIFY_TOKEN_SECRET_PROJECT_ID")

if [ -z "${COOLIFY_TOKEN:-}" ] && command -v scw >/dev/null 2>&1; then
  # Secret Manager renvoie la valeur encodée en base64 dans .data → on décode.
  COOLIFY_TOKEN="$(scw secret version access-by-path \
    secret-name="$_secret_name" secret-path=/ revision=latest "${_project_arg[@]}" \
    --output=json 2>/dev/null | jq -r '.data // empty' | base64 --decode 2>/dev/null || true)"
fi

if [ -z "${COOLIFY_TOKEN:-}" ]; then
  echo "coolify-env.sh : COOLIFY_TOKEN introuvable." >&2
  echo "  1. Créer un token dans Coolify (Security > API Tokens, scope root)." >&2
  echo "  2. Le stocker dans Secret Manager :" >&2
  echo "       _id=\"\$(scw secret secret create name=$_secret_name -o json | jq -r .id)\"" >&2
  echo "       scw secret version create \"\$_id\" data='<id>|<token>'" >&2
  echo "  ou l'exporter manuellement : export COOLIFY_TOKEN='<id>|<token>'" >&2
  return 1 2>/dev/null || exit 1
fi

export COOLIFY_TOKEN
# Le provider Terraform `coolify` exige `token` : on le fournit via TF_VAR_*.
export TF_VAR_coolify_token="$COOLIFY_TOKEN"
echo "coolify-env.sh : COOLIFY_TOKEN chargé, endpoint=$COOLIFY_ENDPOINT"
unset _project_arg
