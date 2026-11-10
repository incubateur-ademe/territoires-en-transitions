#!/usr/bin/env bash
# Charge les credentials Scaleway depuis `scw config` et les exporte sous les
# noms attendus par Terraform :
#   - AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY → backend S3 (state distant)
#   - TF_VAR_scaleway_secret_key                 → provider grafana (Cockpit)
#
# SCW_ACCESS_KEY / SCW_SECRET_KEY / SCW_DEFAULT_ORGANIZATION_ID ne sont PAS
# exportés : le provider scaleway lit déjà le profil actif de `scw config`, et
# les doubler en env déclenche le warning « Multiple variable sources detected ».
#
# SCW_DEFAULT_PROJECT_ID n'est volontairement PAS exporté : le provider
# scaleway donne priorité aux variables d'environnement sur son propre bloc
# (project_id = var.project_id), ce qui ferait cibler le projet par défaut de
# `scw config` au lieu de celui du stack.
#
# Usage : doit être *sourcé*, pas exécuté, pour que les exports persistent
# dans le shell appelant :
#
#     source infra/scripts/tf-env.sh
#     cd infra/platform && terraform init
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
  # return si sourcé depuis un shell non détecté (ksh, sh…) : ne pas le fermer.
  return 1 2>/dev/null || exit 1
fi
unset _tf_sourced

if ! command -v scw >/dev/null 2>&1; then
  echo "tf-env.sh : la CLI 'scw' est introuvable dans le PATH." >&2
  echo "  Installation : brew install scw   (puis 'scw init')" >&2
  return 1
fi

_scw_access_key="$(scw config get access-key 2>/dev/null)"
_scw_secret_key="$(scw config get secret-key 2>/dev/null)"

if [ -z "$_scw_access_key" ] || [ -z "$_scw_secret_key" ]; then
  echo "tf-env.sh : 'scw config' ne renvoie pas de credentials." >&2
  echo "  Lance 'scw init' pour configurer la CLI, ou vérifie ~/.config/scw/config.yaml." >&2
  unset _scw_access_key _scw_secret_key
  return 1
fi

export AWS_ACCESS_KEY_ID="$_scw_access_key"
export AWS_SECRET_ACCESS_KEY="$_scw_secret_key"
export TF_VAR_scaleway_secret_key="$_scw_secret_key"

echo "tf-env.sh : credentials Scaleway exportés (access-key ${_scw_access_key:0:6}…)."
# Un SCW_DEFAULT_PROJECT_ID hérité du shell écraserait le project_id des stacks.
unset SCW_DEFAULT_PROJECT_ID

unset _scw_access_key _scw_secret_key
