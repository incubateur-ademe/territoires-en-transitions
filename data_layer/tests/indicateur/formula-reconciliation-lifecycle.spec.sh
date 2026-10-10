#!/usr/bin/env bash
set -euo pipefail
: "${FORMULA_RECONCILIATION_TEST_DATABASE_URL:?The isolated CI database is required}"
database_url="$FORMULA_RECONCILIATION_TEST_DATABASE_URL"
# This script temporarily reverts the queue. Use only the disposable Supabase CI stack.
[[ "$database_url" == 'postgresql://postgres:postgres@supabase_db_tet:5432/postgres' ]] || {
    echo 'Refusing to run outside the disposable Supabase CI database.' >&2; exit 2;
}
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(cd "$script_dir/../../.." && pwd)"
psql_test() {
  psql --quiet --no-psqlrc --set=ON_ERROR_STOP=1 --dbname="$database_url" "$@"
}

scalar() {
  psql_test --tuples-only --no-align --command="$1"
}

assert_equal() {
  local expected="$1"
  local actual="$2"
  local message="$3"
  if [[ "$actual" != "$expected" ]]; then
    echo "ÉCHEC: $message (attendu: $expected, obtenu: $actual)" >&2
    exit 1
  fi
}

apply_change() {
  psql_test --file="$repository_root/$1" >/dev/null
}

expect_change_failure() {
  local change="$1"
  local message="$2"
  if psql_test --file="$repository_root/$change" >/dev/null 2>&1; then
    echo "ÉCHEC: $message" >&2
    exit 1
  fi
}

wait_for_sleeping_session() {
  local application_name="$1"
  local attempt
  for attempt in {1..50}; do
    if [[ "$(scalar "SELECT count(*) FROM pg_stat_activity WHERE application_name = '$application_name' AND wait_event = 'PgSleep'")" == "1" ]]; then
      return
    fi
    sleep 0.1
  done
  echo "ÉCHEC: la session concurrente $application_name n'a pas atteint son point de synchronisation" >&2
  exit 1
}

wait_for_advisory_lock_session() {
  local application_name="$1"
  local attempt
  for attempt in {1..50}; do
    if [[ "$(scalar "SELECT count(*) FROM pg_locks verrou JOIN pg_stat_activity session ON session.pid = verrou.pid WHERE session.application_name = '$application_name' AND verrou.locktype = 'advisory' AND NOT verrou.granted")" == "1" ]]; then
      return
    fi
    sleep 0.1
  done
  echo "ÉCHEC: la session concurrente $application_name n'attend pas le verrou du graphe" >&2
  exit 1
}

wait_for_relation_lock_session() {
  local application_name="$1"
  local attempt
  for attempt in {1..50}; do
    if [[ "$(scalar "SELECT count(*) FROM pg_locks verrou JOIN pg_stat_activity session ON session.pid = verrou.pid WHERE session.application_name = '$application_name' AND verrou.locktype = 'relation' AND NOT verrou.granted")" != "0" ]]; then
      return
    fi
    sleep 0.1
  done
  echo "ÉCHEC: la session concurrente $application_name n'attend pas un verrou de table" >&2
  exit 1
}


fixture_suffix="${BASHPID}-$(date +%s%N)"
collectivite_id="$(scalar "INSERT INTO public.collectivite (nom, type) VALUES ('Queue lifecycle $fixture_suffix', 'epci') RETURNING id")"
target_id="$(scalar "INSERT INTO public.indicateur_definition (collectivite_id, titre, unite) VALUES ($collectivite_id, 'Queue target', 'kWh') RETURNING id")"
formula_source_id="$(scalar "INSERT INTO public.indicateur_definition (identifiant_referentiel, titre, unite) VALUES ('cycle-formula-source-$fixture_suffix', 'Queue source', 'kWh') RETURNING id")"
formula_target_id="$(scalar "INSERT INTO public.indicateur_definition (identifiant_referentiel, titre, unite) VALUES ('cycle-formula-target-$fixture_suffix', 'Queue formula', 'kWh') RETURNING id")"
cleanup() {
    # The sourced scenarios may have reverted the queue before failing.
    if [[ "$(scalar "SELECT to_regclass('private.indicateur_reconciliation_formule')")" == "" ]]; then
        apply_change data_layer/sqitch/deploy/indicateur/reconciliation_formules.sql
    fi
    scalar "DELETE FROM public.indicateur_definition WHERE id IN ($target_id, $formula_target_id, $formula_source_id); DELETE FROM public.collectivite_bucket WHERE collectivite_id = $collectivite_id; DELETE FROM public.collectivite WHERE id = $collectivite_id" >/dev/null
    rm -f "${reconciliation_producer_log:-}" "${reconciliation_revert_log:-}" "${reconciliation_reader_log:-}"
}
trap cleanup EXIT
apply_change data_layer/sqitch/revert/indicateur/reconciliation_formules.sql
source "$script_dir/formula-reconciliation-lifecycle.assertions.sh"
apply_change data_layer/sqitch/deploy/indicateur/reconciliation_formules.sql
apply_change data_layer/sqitch/verify/indicateur/reconciliation_formules.sql
echo 'PASS: formula reconciliation rollback concurrency and restore preservation'
