#!/usr/bin/env bash
# Charge les credentials Scaleway depuis `scw config` et les exporte sous les
# noms attendus par Terraform :
#   - AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY → backend S3 (state distant)
#   - SCW_ACCESS_KEY    / SCW_SECRET_KEY         → provider scaleway/scaleway
#   - SCW_DEFAULT_PROJECT_ID / SCW_DEFAULT_ORGANIZATION_ID
#
# Usage : doit être *sourcé*, pas exécuté, pour que les exports persistent
# dans le shell appelant :
#
#     source infra/scripts/tf-env.sh
#     cd infra/preprod && terraform init
#
# Pré-requis : `scw init` exécuté au moins une fois (crée ~/.config/scw/config.yaml).

# Garde-fou : refuse l'exécution directe (sinon les exports sont perdus avec
# le sous-shell). Détection compatible bash et zsh.
_tf_sourced=0
if [ -n "${ZSH_VERSION:-}" ]; then
  case "${ZSH_EVAL_CONTEXT:-}" in *:file*) _tf_sourced=1 ;; esac
elif [ -n "${BASH_VERSION:-}" ]; then
  [ "${BASH_SOURCE[0]}" != "$0" ] && _tf_sourced=1
fi
if [ "$_tf_sourced" -ne 1 ]; then
  echo "tf-env.sh : doit être sourcé, pas exécuté." >&2
  echo "  Utilisation : source ${BASH_SOURCE[0]:-$0}" >&2
  exit 1
fi
unset _tf_sourced

if ! command -v scw >/dev/null 2>&1; then
  echo "tf-env.sh : la CLI 'scw' est introuvable dans le PATH." >&2
  echo "  Installation : brew install scw   (puis 'scw init')" >&2
  return 1
fi

_scw_access_key="$(scw config get access-key 2>/dev/null)"
_scw_secret_key="$(scw config get secret-key 2>/dev/null)"
_scw_project_id="$(scw config get default-project-id 2>/dev/null)"
_scw_org_id="$(scw config get default-organization-id 2>/dev/null)"

if [ -z "$_scw_access_key" ] || [ -z "$_scw_secret_key" ]; then
  echo "tf-env.sh : 'scw config' ne renvoie pas de credentials." >&2
  echo "  Lance 'scw init' pour configurer la CLI, ou vérifie ~/.config/scw/config.yaml." >&2
  unset _scw_access_key _scw_secret_key _scw_project_id _scw_org_id
  return 1
fi

export AWS_ACCESS_KEY_ID="$_scw_access_key"
export AWS_SECRET_ACCESS_KEY="$_scw_secret_key"
export SCW_ACCESS_KEY="$_scw_access_key"
export SCW_SECRET_KEY="$_scw_secret_key"
[ -n "$_scw_project_id" ] && export SCW_DEFAULT_PROJECT_ID="$_scw_project_id"
[ -n "$_scw_org_id" ]     && export SCW_DEFAULT_ORGANIZATION_ID="$_scw_org_id"

echo "tf-env.sh : credentials Scaleway exportés (access-key ${_scw_access_key:0:6}…)."

unset _scw_access_key _scw_secret_key _scw_project_id _scw_org_id
