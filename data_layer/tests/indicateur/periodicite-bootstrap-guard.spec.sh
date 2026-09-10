#!/usr/bin/env bash

set -euo pipefail

admin_database_url="${PERIODICITE_BOOTSTRAP_TEST_DATABASE_URL:-}"
admin_database_url="${admin_database_url#db:}"

if [[ ! "$admin_database_url" =~ ^postgres(ql)?:// ]]; then
  echo "PERIODICITE_BOOTSTRAP_TEST_DATABASE_URL doit être une URL PostgreSQL d'administration." >&2
  exit 2
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(cd "$script_dir/../../.." && pwd)"
guard_script="$repository_root/data_layer/scripts/check-periodicite-bootstrap.sql"
test_database="periodicite_bootstrap_guard_test_${BASHPID}"

if [[ ! "$test_database" =~ ^periodicite_bootstrap_guard_test_[0-9]+$ ]]; then
  echo "Nom de base de test inattendu." >&2
  exit 2
fi

database_url_without_query="${admin_database_url%%\?*}"
database_query=""
if [[ "$admin_database_url" == *\?* ]]; then
  database_query="?${admin_database_url#*\?}"
fi
test_database_url="${database_url_without_query%/*}/${test_database}${database_query}"
database_created=false

cleanup() {
  if [[ "$database_created" == true ]]; then
    dropdb \
      --if-exists \
      --force \
      --maintenance-db="$admin_database_url" \
      "$test_database" >/dev/null
  fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

run_guard() {
  psql \
    --quiet \
    --no-psqlrc \
    --set=ON_ERROR_STOP=1 \
    --dbname="$test_database_url" \
    --file="$guard_script"
}

psql_test() {
  psql \
    --quiet \
    --no-psqlrc \
    --set=ON_ERROR_STOP=1 \
    --dbname="$test_database_url" \
    "$@"
}

expect_guard_failure() {
  local message="$1"
  if run_guard >/dev/null 2>&1; then
    echo "ÉCHEC: $message" >&2
    exit 1
  fi
}

createdb --maintenance-db="$admin_database_url" "$test_database"
database_created=true

# Une base réellement neuve n'a pas encore de registre Sqitch.
run_guard >/dev/null

# La disparition du registre ne transforme pas un schéma applicatif existant
# en bootstrap neuf.
psql_test \
  --command="CREATE TABLE public.collectivite (id integer PRIMARY KEY)" >/dev/null
expect_guard_failure "un schéma applicatif sans registre Sqitch a été autorisé."
psql_test \
  --command="DROP TABLE public.collectivite" >/dev/null

# Sqitch peut aussi avoir créé son registre avant d'y enregistrer un changement.
psql_test \
  --command="CREATE SCHEMA sqitch; CREATE TABLE sqitch.changes (change text NOT NULL, project text NOT NULL)" >/dev/null
run_guard >/dev/null

psql_test \
  --command="CREATE TABLE public.indicateur_definition (id integer PRIMARY KEY)" >/dev/null
expect_guard_failure "un registre vide ne doit pas masquer un schéma applicatif existant."
psql_test \
  --command="DROP TABLE public.indicateur_definition" >/dev/null

# Un autre projet du même registre ne rend pas le plan `tet` non vierge.
psql_test \
  --command="INSERT INTO sqitch.changes (change, project) VALUES ('indicateur/periodicite_obligatoire', 'autre-projet')" >/dev/null
run_guard >/dev/null

# Dès qu'un changement existe, le bootstrap ne peut plus franchir implicitement
# une éventuelle fenêtre expand/contract.
psql_test \
  --command="INSERT INTO sqitch.changes (change, project) VALUES ('socle/deja_deploye', 'tet')" >/dev/null
expect_guard_failure "une base non vide sans contract enregistré a été autorisée."

# Un contract déjà enregistré rend le bootstrap idempotent.
psql_test \
  --command="INSERT INTO sqitch.changes (change, project) VALUES ('indicateur/periodicite_obligatoire', 'tet')" >/dev/null
run_guard >/dev/null

echo "Garde de bootstrap de la périodicité validé sur une base jetable."
