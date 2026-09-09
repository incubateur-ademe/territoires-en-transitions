#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
database_script="$script_dir/periodicite-migration-lifecycle-database.sh"
valid_name='periodicite_migration_lifecycle_test_123_4'

database_url="$({
  PERIODICITE_MIGRATION_ADMIN_DATABASE_URL='db:postgresql://postgres:p%40ss@database:5432/postgres?sslmode=disable&connect_timeout=5'
  PERIODICITE_MIGRATION_DATABASE_NAME="$valid_name"
  export PERIODICITE_MIGRATION_ADMIN_DATABASE_URL PERIODICITE_MIGRATION_DATABASE_NAME
  bash "$database_script" database-url
})"

expected_url="postgresql://postgres:p%40ss@database:5432/$valid_name?sslmode=disable&connect_timeout=5"
if [[ "$database_url" != "$expected_url" ]]; then
  echo "ÉCHEC: URL attendue '$expected_url', obtenue '$database_url'." >&2
  exit 1
fi

normalized_pg_url="$({
  PERIODICITE_MIGRATION_ADMIN_DATABASE_URL='db:pg://postgres:postgres@supabase_db_tet:5432/postgres'
  PERIODICITE_MIGRATION_DATABASE_NAME="$valid_name"
  export PERIODICITE_MIGRATION_ADMIN_DATABASE_URL PERIODICITE_MIGRATION_DATABASE_NAME
  bash "$database_script" database-url
})"
expected_pg_url="postgresql://postgres:postgres@supabase_db_tet:5432/$valid_name"
if [[ "$normalized_pg_url" != "$expected_pg_url" ]]; then
  echo "ÉCHEC: URL pg normalisée attendue '$expected_pg_url', obtenue '$normalized_pg_url'." >&2
  exit 1
fi

for local_url in \
  "postgresql://postgres:postgres@127.0.0.1:54322/$valid_name" \
  "postgresql://postgres:postgres@localhost/$valid_name" \
  "db:pg://postgres:postgres@supabase_db_tet:5432/$valid_name"; do
  PERIODICITE_MIGRATION_ADMIN_DATABASE_URL="$local_url" \
    PERIODICITE_MIGRATION_DATABASE_NAME="$valid_name" \
    bash "$database_script" assert-disposable-url
done

expect_rejection() {
  local admin_database_url="$1"
  local database_name="$2"
  local command="${3:-database-url}"

  if PERIODICITE_MIGRATION_ADMIN_DATABASE_URL="$admin_database_url" \
    PERIODICITE_MIGRATION_DATABASE_NAME="$database_name" \
    bash "$database_script" "$command" >/dev/null 2>&1; then
    echo "ÉCHEC: la commande '$command' a accepté '$admin_database_url' / '$database_name'." >&2
    exit 1
  fi
}

expect_rejection 'https://database/postgres' "$valid_name"
expect_rejection 'postgresql://database' "$valid_name"
expect_rejection 'postgresql://database/postgres#fragment' "$valid_name"
expect_rejection 'postgresql://database/postgres?dbname=postgres' "$valid_name"
expect_rejection 'postgresql://database/postgres?host=elsewhere' "$valid_name"
expect_rejection 'postgresql://database/postgres' 'postgres'
expect_rejection 'postgresql://database/postgres' 'contest'
expect_rejection 'postgresql://database/postgres' 'latest'
expect_rejection 'postgresql://database/postgres' 'periodicite_migration_lifecycle_test_bad-name'
expect_rejection 'postgresql://database/postgres' 'periodicite_migration_lifecycle_test_123_4' destroy
expect_rejection "postgresql://postgres:secret@db.example.com/$valid_name" "$valid_name" assert-disposable-url
expect_rejection "postgresql://postgres:secret@127.0.0.1/postgres" "$valid_name" assert-disposable-url
expect_rejection "postgresql://postgres:secret@127.0.0.1/$valid_name?host=db.example.com" "$valid_name" assert-disposable-url

echo 'Contrat du gestionnaire de base jetable de périodicité validé.'

# Exercise the clone command as a separate shell, just like the CI docker exec.
# In particular, a failed pg_restore must stop before the registry is restored.
mock_directory="$(mktemp -d)"
trap 'rm -rf "$mock_directory"' EXIT
mkdir "$mock_directory/bin"
cat > "$mock_directory/bin/postgres-test-command" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
command_name="${0##*/}"
printf '%s\n' "$command_name" >> "$CLONE_TEST_TRACE"
case "$command_name" in
  psql)
    if [[ "$*" == *'concat_ws'* ]]; then
      echo 'indicateur_periodicite|migration.indicateur_valeur_periodicite_audit|t'
    elif [[ "$*" == *'SELECT count(*)'* ]]; then
      echo t
    fi
    ;;
  pg_restore)
    if [[ "${1:-}" == --list ]]; then
      cat <<'TOC'
1; 0 0 EXTENSION - pg_cron
2; 0 0 COMMENT - EXTENSION pg_cron
3; 0 0 ACL - SCHEMA cron supabase_admin
4; 0 0 ACL cron TABLE job supabase_admin
5; 0 0 DEFAULT ACL cron DEFAULT PRIVILEGES FOR TABLES supabase_admin
6; 0 0 ACL - SCHEMA graphql_public supabase_admin
7; 0 0 ACL graphql_public FUNCTION graphql(text, text, jsonb, jsonb) supabase_admin
8; 0 0 DEFAULT ACL graphql_public DEFAULT PRIVILEGES FOR FUNCTIONS supabase_admin
9; 0 0 ACL - SCHEMA posthog postgres
10; 0 0 ACL posthog TABLE events postgres
11; 0 0 DEFAULT ACL posthog DEFAULT PRIVILEGES FOR TABLES postgres
12; 0 0 ACL storage TABLE buckets supabase_storage_admin
TOC
    else
      for argument in "$@"; do
        if [[ "$argument" == --use-list=* ]]; then
          cat "${argument#--use-list=}" > "$CLONE_TEST_FILTERED_TOC"
          if [[ "${CLONE_TEST_FAIL_RESTORE:-false}" == true ]]; then
            echo 'forced schema pg_restore failure' >&2
            exit 17
          fi
        fi
      done
    fi
    ;;
esac
MOCK
chmod +x "$mock_directory/bin/postgres-test-command"
for postgres_command in createdb dropdb pg_dump pg_restore psql; do
  ln -s postgres-test-command "$mock_directory/bin/$postgres_command"
done

export CLONE_TEST_TRACE="$mock_directory/commands.log"
export CLONE_TEST_FILTERED_TOC="$mock_directory/filtered.toc"
export PERIODICITE_MIGRATION_ADMIN_DATABASE_URL='postgresql://postgres:test-only@localhost/postgres'
export PERIODICITE_MIGRATION_DATABASE_NAME="$valid_name"
export POSTGRES_PASSWORD='test-only'

if PATH="$mock_directory/bin:$PATH" CLONE_TEST_FAIL_RESTORE=true \
  bash "$database_script" create >"$mock_directory/failure.log" 2>&1; then
  echo 'ÉCHEC: une restauration de schéma échouée a été considérée comme réussie.' >&2
  exit 1
else
  restore_status=$?
fi
[[ "$restore_status" == 17 ]] || {
  cat "$mock_directory/failure.log" >&2
  echo "ÉCHEC: le statut pg_restore n'a pas été propagé ($restore_status)." >&2
  exit 1
}
[[ "$(awk '$0 == "dropdb" { count++ } END { print count + 0 }' "$CLONE_TEST_TRACE")" == 1 ]] || {
  echo 'ÉCHEC: le clone incomplet doit être supprimé exactement une fois.' >&2
  exit 1
}
[[ "$(awk '$0 == "pg_dump" { count++ } END { print count + 0 }' "$CLONE_TEST_TRACE")" == 1 ]] || {
  echo 'ÉCHEC: le registre ne doit pas être copié après un échec de restauration du schéma.' >&2
  exit 1
}
[[ "$(cat "$CLONE_TEST_FILTERED_TOC")" == '12; 0 0 ACL storage TABLE buckets supabase_storage_admin' ]] || {
  echo 'ÉCHEC: seuls les ACL des schémas exclus doivent être retirés du TOC.' >&2
  exit 1
}

: > "$CLONE_TEST_TRACE"
PATH="$mock_directory/bin:$PATH" bash "$database_script" create
if grep -q '^dropdb$' "$CLONE_TEST_TRACE"; then
  echo 'ÉCHEC: le clone réussi ne doit pas être supprimé.' >&2
  exit 1
fi

echo 'Échec de restauration, nettoyage du clone et filtrage des ACL exclus validés.'
