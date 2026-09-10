#!/usr/bin/env bash

set -euo pipefail

readonly database_name_pattern='^periodicite_migration_lifecycle_test_[a-zA-Z0-9_]+$'

fail() {
  echo "ERREUR: $*" >&2
  exit 2
}

normalize_database_url() {
  local database_url="${1#db:}"

  case "$database_url" in
    pg://*) printf 'postgresql://%s\n' "${database_url#pg://}" ;;
    postgres://* | postgresql://*) printf '%s\n' "$database_url" ;;
    *) fail 'PERIODICITE_MIGRATION_ADMIN_DATABASE_URL doit être une URL PostgreSQL' ;;
  esac
}

validate_database_name() {
  local database_name="$1"

  [[ "$database_name" =~ $database_name_pattern ]] ||
    fail "nom de base de cycle de vie inattendu: '$database_name'"
  ((${#database_name} <= 63)) ||
    fail 'le nom de la base de cycle de vie dépasse 63 caractères'
}

validate_query() {
  local query="$1"
  local -a parameters=()
  local parameter
  local key

  [[ -z "$query" ]] && return

  IFS='&' read -r -a parameters <<<"$query"
  for parameter in "${parameters[@]}"; do
    [[ "$parameter" == *=* ]] || fail "paramètre de connexion mal formé: '$parameter'"
    key="${parameter%%=*}"
    case "$key" in
      application_name | connect_timeout | sslmode) ;;
      *) fail "paramètre de connexion non autorisé: '$key'" ;;
    esac
  done
}

build_database_url() {
  local admin_database_url
  local database_name="$2"
  local database_url_without_query
  local query=''

  admin_database_url="$(normalize_database_url "$1")"
  validate_database_name "$database_name"
  [[ "$admin_database_url" != *'#'* ]] || fail "l'URL PostgreSQL ne doit pas contenir de fragment"

  database_url_without_query="${admin_database_url%%\?*}"
  if [[ "$admin_database_url" == *\?* ]]; then
    query="${admin_database_url#*\?}"
  fi

  [[ "$database_url_without_query" =~ ^postgres(ql)?://.+/[^/?]+$ ]] ||
    fail 'PERIODICITE_MIGRATION_ADMIN_DATABASE_URL doit être une URL PostgreSQL avec une base explicite'
  validate_query "$query"

  if [[ -n "$query" ]]; then
    printf '%s/%s?%s\n' "${database_url_without_query%/*}" "$database_name" "$query"
  else
    printf '%s/%s\n' "${database_url_without_query%/*}" "$database_name"
  fi
}

assert_local_disposable_url() {
  local database_url="$1"
  local database_name="$2"
  local database_url_without_query="${database_url%%\?*}"
  local authority_and_path="${database_url_without_query#*://}"
  local authority="${authority_and_path%%/*}"
  local host_and_port="${authority##*@}"
  local url_database_name="${database_url_without_query##*/}"

  validate_database_name "$database_name"
  [[ "$url_database_name" == "$database_name" ]] ||
    fail "l'URL ne cible pas la base jetable attendue '$database_name'"

  if [[ ! "$host_and_port" =~ ^(localhost|127\.0\.0\.1|supabase_db_tet)(:[0-9]+)?$ ]] &&
    [[ ! "$host_and_port" =~ ^\[::1\](:[0-9]+)?$ ]]; then
    fail "le cycle destructif exige la base Supabase CI ou une adresse loopback, pas '$host_and_port'"
  fi
}

clone_database_schema() {
  local source_database_url="$1"
  local target_database_name="$2"
  local schema_archive
  local schema_toc
  local filtered_schema_toc
  local registry_archive
  local excluded_pg_cron_entries
  local superuser_password="${POSTGRES_PASSWORD:-}"
  local source_state
  local target_state

  [[ -n "$superuser_password" ]] ||
    fail 'POSTGRES_PASSWORD est obligatoire pour restaurer le clone avec supabase_admin'

  source_state="$(
    psql \
      --quiet \
      --no-psqlrc \
      --tuples-only \
      --no-align \
      --set=ON_ERROR_STOP=1 \
      --dbname="$source_database_url" \
      --command="
        SELECT count(*) = 4
        FROM sqitch.changes
        WHERE project = 'tet'
          AND change IN (
            'indicateur/periodicite',
            'indicateur/import_emt_valeur',
            'indicateur/reconciliation_formules',
            'indicateur/dependances_formules'
          )
      "
  )"
  [[ "$source_state" == 't' ]] ||
    fail 'la base préparée ne contient pas le expand complet de périodicité'

  schema_archive="$(mktemp)"
  schema_toc="$(mktemp)"
  filtered_schema_toc="$(mktemp)"
  registry_archive="$(mktemp)"
  trap 'rm -f "${schema_archive:-}" "${schema_toc:-}" "${filtered_schema_toc:-}" "${registry_archive:-}"' EXIT

  pg_dump \
    "$source_database_url" \
    --format=custom \
    --schema-only \
    --exclude-schema=posthog \
    --exclude-schema=graphql_public \
    --file="$schema_archive"
  pg_restore --list "$schema_archive" >"$schema_toc"

  excluded_pg_cron_entries="$(
    awk '
      / EXTENSION - pg_cron[[:space:]]*$/ || / COMMENT - EXTENSION pg_cron[[:space:]]*$/ { count++ }
      END { print count + 0 }
    ' "$schema_toc"
  )"
  case "$excluded_pg_cron_entries" in
    0 | 2) ;;
    *) fail "archive inattendue: $excluded_pg_cron_entries entrées pg_cron trouvées" ;;
  esac

  # Extension-owned functions can leave ACL entries in the archive even when
  # their schema is excluded. Keep the ACLs for all schemas restored below.
  sed \
    -e '/ EXTENSION - pg_cron[[:space:]]*$/d' \
    -e '/ COMMENT - EXTENSION pg_cron[[:space:]]*$/d' \
    -e '/ ACL - SCHEMA \(cron\|graphql_public\|posthog\)[[:space:]]/d' \
    -e '/ ACL \(cron\|graphql_public\|posthog\) /d' \
    -e '/ DEFAULT ACL \(cron\|graphql_public\|posthog\) /d' \
    "$schema_toc" >"$filtered_schema_toc"

  PGPASSWORD="$superuser_password" pg_restore \
    --exit-on-error \
    --use-list="$filtered_schema_toc" \
    --username=supabase_admin \
    --dbname="$target_database_name" \
    "$schema_archive"

  pg_dump \
    "$source_database_url" \
    --format=custom \
    --data-only \
    --schema=sqitch \
    --file="$registry_archive"
  PGPASSWORD="$superuser_password" pg_restore \
    --exit-on-error \
    --username=supabase_admin \
    --dbname="$target_database_name" \
    "$registry_archive"

  # pg_dump restaure les vues matérialisées WITH NO DATA. Les scripts de
  # reporting de la migration lisent celle-ci pendant le revert et le deploy.
  PGPASSWORD="$superuser_password" psql \
    --quiet \
    --no-psqlrc \
    --set=ON_ERROR_STOP=1 \
    --username=supabase_admin \
    --dbname="$target_database_name" \
    --command='REFRESH MATERIALIZED VIEW stats.collectivite'

  target_state="$(
    PGPASSWORD="$superuser_password" psql \
      --quiet \
      --no-psqlrc \
      --tuples-only \
      --no-align \
      --set=ON_ERROR_STOP=1 \
      --dbname="$target_database_name" \
      --username=supabase_admin \
      --command="
        SELECT concat_ws('|',
          to_regclass('public.indicateur_periodicite'),
          to_regclass('migration.indicateur_valeur_periodicite_audit'),
          count(*) = 4
        )
        FROM sqitch.changes
        WHERE project = 'tet'
          AND change IN (
            'indicateur/periodicite',
            'indicateur/import_emt_valeur',
            'indicateur/reconciliation_formules',
            'indicateur/dependances_formules'
          )
      "
  )"
  [[ "$target_state" == 'indicateur_periodicite|migration.indicateur_valeur_periodicite_audit|t' ]] ||
    fail "clone de schéma incomplet: '$target_state'"
}

assert_pre_expand() {
  local database_url="$1"
  local pre_expand_state

  pre_expand_state="$(
    psql \
      --quiet \
      --no-psqlrc \
      --tuples-only \
      --no-align \
      --set=ON_ERROR_STOP=1 \
      --dbname="$database_url" \
      --command="
        SELECT concat_ws('|',
          to_regclass('public.indicateur_periodicite') IS NULL,
          NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'indicateur_definition'
              AND column_name = 'periodicite'
          ),
          to_regclass('private.indicateur_reconciliation_formule') IS NULL,
          to_regprocedure('private.extraire_dependances_formule_indicateur(text)') IS NULL,
          NOT EXISTS (
            SELECT 1
            FROM sqitch.changes
            WHERE project = 'tet'
              AND change IN (
                'indicateur/periodicite',
                'indicateur/import_emt_valeur',
                'indicateur/reconciliation_formules',
                'indicateur/dependances_formules',
                'indicateur/periodicite_obligatoire',
                'indicateur/periodicite_formules',
                'stats/report_indicateur_resultat_periode'
              )
          )
        )
      "
  )"
  [[ "$pre_expand_state" == 't|t|t|t|t' ]] ||
    fail "la base jetable n'est pas exactement pré-expand: '$pre_expand_state'"
}

command="${1:-}"
admin_database_url="${PERIODICITE_MIGRATION_ADMIN_DATABASE_URL:-}"
database_name="${PERIODICITE_MIGRATION_DATABASE_NAME:-}"

[[ -n "$command" ]] || fail 'commande attendue: database-url, assert-disposable-url, create, assert-pre-expand ou drop'
[[ -n "$admin_database_url" ]] || fail 'PERIODICITE_MIGRATION_ADMIN_DATABASE_URL est obligatoire'
[[ -n "$database_name" ]] || fail 'PERIODICITE_MIGRATION_DATABASE_NAME est obligatoire'

database_url="$(build_database_url "$admin_database_url" "$database_name")"
admin_database_url="$(normalize_database_url "$admin_database_url")"

case "$command" in
  database-url)
    printf '%s\n' "$database_url"
    ;;
  assert-disposable-url)
    assert_local_disposable_url "$admin_database_url" "$database_name"
    ;;
  create)
    command -v createdb >/dev/null || fail 'createdb est introuvable'
    command -v dropdb >/dev/null || fail 'dropdb est introuvable'
    command -v awk >/dev/null || fail 'awk est introuvable'
    command -v pg_dump >/dev/null || fail 'pg_dump est introuvable'
    command -v pg_restore >/dev/null || fail 'pg_restore est introuvable'
    command -v psql >/dev/null || fail 'psql est introuvable'
    command -v sed >/dev/null || fail 'sed est introuvable'

    createdb --maintenance-db="$admin_database_url" "$database_name"
    # An `if ! clone...` condition disables errexit inside the whole function.
    # Run the clone unconditionally so a failed restore stops before later ACLs
    # or validation can make an incomplete database look successful. This trap
    # belongs to the parent; the subshell owns its temporary-file cleanup.
    trap 'echo "ERREUR: clone de schéma incomplet; suppression de la base jetable." >&2
      dropdb \
        --if-exists \
        --force \
        --maintenance-db="$admin_database_url" \
        "$database_name" >/dev/null' ERR
    (clone_database_schema "$admin_database_url" "$database_name")
    trap - ERR
    ;;
  assert-pre-expand)
    command -v psql >/dev/null || fail 'psql est introuvable'
    assert_pre_expand "$database_url"
    ;;
  drop)
    command -v dropdb >/dev/null || fail 'dropdb est introuvable'
    dropdb \
      --if-exists \
      --force \
      --maintenance-db="$admin_database_url" \
      "$database_name"
    ;;
  *) fail "commande inconnue: '$command'" ;;
esac
