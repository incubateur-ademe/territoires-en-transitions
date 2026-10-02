#!/usr/bin/env bash
# Migration unique : fait adopter le Postgres et le Redis preprod existants par
# le stack infra/nonprod, au lieu de les recréer en double.
#
# Avant le refactor « Coolify sur serveur dédié », preprod avait son propre
# stack (infra/preprod, state tet-preprod-tfstate/preprod/terraform.tfstate).
# Le stack nonprod déclare les mêmes instances (tet-preprod-pg,
# tet-preprod-redis) : sans cette migration, son premier apply en créerait de
# nouvelles, vides, pendant que les anciennes resteraient orphelines.
#
# Le script :
#   1. sauvegarde localement l'ancien state (et celui de nonprod s'il existe) ;
#   2. importe dans nonprod les ressources RDB/Redis, avec les IDs lus dans
#      l'ancien state (aucun ID en dur dans le repo) ;
#   3. reporte tls_enabled sur le Redis importé, que l'import laisse à null
#      (sinon le plan exige un remplacement, bloqué par prevent_destroy) ;
#   4. les retire de l'ancien state, qui ne doit plus jamais les gérer.
#
# Il ne fait AUCUN apply. Le plan qui suit montre ce que l'apply changera, à
# relire avant d'appliquer (cf. infra/README.md « Migration du state preprod ») :
#   - private_network : bascule de l'ancien PN tet-preprod-pn vers le PN
#     nonprod, en place — c'est l'instant où les applis de l'ancien Coolify
#     perdent l'accès à la base ;
#   - mots de passe admin PG / Redis et supabase_auth_admin régénérés : les
#     random_password ne sont pas importés (leur import passerait la valeur en
#     clair sur la ligne de commande), et les anciens contenaient #, ? et %
#     qui cassaient les URI.
#
# Idempotent : une ressource déjà présente dans le state nonprod est ignorée.
#
# Par défaut, affiche les commandes sans rien modifier. CONFIRM=yes exécute.
#
# Prérequis : source infra/scripts/tf-env.sh ; infra/platform appliqué ;
# infra/nonprod/terraform.tfvars renseigné ; terraform init fait dans nonprod.
set -euo pipefail

: "${AWS_ACCESS_KEY_ID:?credentials absents — source infra/scripts/tf-env.sh}"

_OLD_BUCKET="${OLD_STATE_BUCKET:-tet-preprod-tfstate}"
_OLD_KEY="${OLD_STATE_KEY:-preprod/terraform.tfstate}"
_S3_ENDPOINT="https://s3.fr-par.scw.cloud"
_confirm="${CONFIRM:-no}"

for bin in terraform jq aws; do
  command -v "$bin" >/dev/null 2>&1 || {
    echo "✗ '$bin' requis mais introuvable." >&2
    exit 1
  }
done

_infra_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
_nonprod="${_infra_dir}/nonprod"
_backup_dir="${_infra_dir}/.state-backups/$(date -u +%Y%m%dT%H%M%SZ)"

_run() {
  if [ "${_confirm}" = "yes" ]; then
    "$@"
  else
    printf '  [dry-run] %q' "$1"
    shift
    printf ' %q' "$@"
    printf '\n'
  fi
}

mkdir -p "${_backup_dir}"
chmod 700 "${_infra_dir}/.state-backups" "${_backup_dir}"

echo "→ Sauvegarde des states dans ${_backup_dir}…"
aws s3 cp --endpoint-url "${_S3_ENDPOINT}" --region fr-par --only-show-errors \
  "s3://${_OLD_BUCKET}/${_OLD_KEY}" "${_backup_dir}/preprod.tfstate"
terraform -chdir="${_nonprod}" state pull >"${_backup_dir}/nonprod.tfstate"
chmod 600 "${_backup_dir}"/*.tfstate
_old="${_backup_dir}/preprod.tfstate"

# ID d'une ressource de l'ancien state. Adresse : [module.]type.nom
_old_id() {
  local module="" addr="$1"
  case "${addr}" in
    module.*)
      module="${addr%.*.*}"
      addr="${addr#"${module}".}"
      ;;
  esac
  jq -r --arg m "${module}" --arg t "${addr%%.*}" --arg n "${addr#*.}" '
    .resources[]
    | select((.module // "") == $m and .type == $t and .name == $n)
    | .instances[0].attributes.id' "${_old}"
}

_nonprod_has() {
  terraform -chdir="${_nonprod}" state list 2>/dev/null | grep -qxF "$1"
}

# ancienne adresse → nouvelle adresse (identiques sauf l'ACL, passée en count)
_imports=(
  "module.postgres.scaleway_rdb_instance.main|module.postgres.scaleway_rdb_instance.main"
  "module.postgres.scaleway_rdb_database.main|module.postgres.scaleway_rdb_database.main"
  "module.postgres.scaleway_rdb_privilege.admin|module.postgres.scaleway_rdb_privilege.admin"
  "scaleway_rdb_user.supabase_auth_admin|scaleway_rdb_user.supabase_auth_admin"
  "scaleway_rdb_privilege.supabase_auth_admin|scaleway_rdb_privilege.supabase_auth_admin"
  "module.redis.scaleway_redis_cluster.main|module.redis.scaleway_redis_cluster.main"
)

# L'ACL n'existe dans nonprod que si pg_allowed_ips est non vide (endpoint
# public). Sinon, l'apply supprimera l'endpoint public et l'ACL devient sans
# objet.
_pg_acl_count="$(echo 'length(var.pg_allowed_ips)' | terraform -chdir="${_nonprod}" console)"
if [ "${_pg_acl_count}" -gt 0 ]; then
  _imports+=("module.postgres.scaleway_rdb_acl.main|module.postgres.scaleway_rdb_acl.main[0]")
else
  echo "  pg_allowed_ips vide : ACL non importée, l'endpoint public sera supprimé à l'apply."
fi

echo "→ Import dans le state nonprod…"
for pair in "${_imports[@]}"; do
  _from="${pair%%|*}"
  _to="${pair#*|}"
  if _nonprod_has "${_to}"; then
    echo "  ${_to} : déjà dans nonprod, ignoré."
    continue
  fi
  _id="$(_old_id "${_from}")"
  if [ -z "${_id}" ] || [ "${_id}" = "null" ]; then
    echo "✗ ${_from} introuvable dans l'ancien state." >&2
    exit 1
  fi
  _run terraform -chdir="${_nonprod}" import -input=false "${_to}" "${_id}"
done

# L'import Redis laisse tls_enabled à null dans le state (le provider ne le relit
# pas), alors que l'attribut force le remplacement : le plan demanderait de
# détruire le cluster, bloqué par prevent_destroy. On reporte la valeur de
# l'ancien state.
_redis_addr="module.redis.scaleway_redis_cluster.main"
_redis_patch() {
  local tmp="${_backup_dir}/nonprod.tls-patch.tfstate"
  terraform -chdir="${_nonprod}" state pull |
    jq --argjson tls "$1" '
      (.resources[]
       | select(.module == "module.redis" and .type == "scaleway_redis_cluster")
       | .instances[0].attributes.tls_enabled) = $tls
      | .serial += 1' >"${tmp}"
  chmod 600 "${tmp}"
  terraform -chdir="${_nonprod}" state push "${tmp}"
}
_old_tls="$(jq -r '
  .resources[]
  | select(.module == "module.redis" and .type == "scaleway_redis_cluster")
  | .instances[0].attributes.tls_enabled' "${_old}")"
_nonprod_tls="$(terraform -chdir="${_nonprod}" state pull | jq -r '
  [.resources[]
   | select(.module == "module.redis" and .type == "scaleway_redis_cluster")
   | .instances[0].attributes.tls_enabled][0]')"
if [ "${_nonprod_tls}" = "null" ] && [ -n "${_old_tls}" ] && [ "${_old_tls}" != "null" ]; then
  echo "→ Report de tls_enabled=${_old_tls} sur ${_redis_addr}…"
  _run _redis_patch "${_old_tls}"
fi

# Retrait de l'ancien state : un workspace jetable pointant sur l'ancien backend.
echo "→ Retrait des ressources de l'ancien state (${_OLD_BUCKET}/${_OLD_KEY})…"
_old_ws="$(mktemp -d)"
trap 'rm -rf "${_old_ws}"' EXIT
cat >"${_old_ws}/backend.tf" <<EOF
terraform {
  backend "s3" {
    bucket = "${_OLD_BUCKET}"
    key    = "${_OLD_KEY}"
    region = "fr-par"
    endpoints = {
      s3 = "${_S3_ENDPOINT}"
    }
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
    use_path_style              = true
    use_lockfile                = true
  }
}
EOF
terraform -chdir="${_old_ws}" init -input=false >/dev/null

_to_remove=()
for pair in "${_imports[@]}"; do
  _to_remove+=("${pair%%|*}")
done
# L'ACL reste dans l'ancien state si elle n'a pas été importée : on la retire
# aussi, l'ancien stack ne doit plus toucher à l'instance.
if [ "${_pg_acl_count}" -eq 0 ]; then
  _to_remove+=("module.postgres.scaleway_rdb_acl.main")
fi
_to_remove+=(
  "module.postgres.random_password.admin"
  "module.redis.random_password.admin"
  "random_password.supabase_auth_admin"
)
for addr in "${_to_remove[@]}"; do
  if terraform -chdir="${_old_ws}" state list 2>/dev/null | grep -qxF "${addr}"; then
    _run terraform -chdir="${_old_ws}" state rm "${addr}"
  fi
done

if [ "${_confirm}" = "yes" ]; then
  echo "✓ Migration du state terminée. Sauvegardes : ${_backup_dir}"
  echo "  Étape suivante : terraform -chdir=infra/nonprod plan, à relire avant tout apply."
else
  echo "✓ Dry-run terminé. Relancer avec CONFIRM=yes pour exécuter."
fi
