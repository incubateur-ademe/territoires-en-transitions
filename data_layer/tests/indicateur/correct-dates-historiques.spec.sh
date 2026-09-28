#!/usr/bin/env bash
# Actual Sqitch files commit their transactions. Run only in an EMPTY, disposable
# local database created/dropped by the caller; never in a shared or restored DB.
# INDICATEUR_DATA_REPAIR_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/tet_indicateur_data_repair_test_local \
#   bash data_layer/tests/indicateur/correct-dates-historiques.spec.sh
set -euo pipefail

repair_database_url="${INDICATEUR_DATA_REPAIR_TEST_DATABASE_URL:?Provide an empty disposable local test database}"
fixture_database_name="$(DATABASE_URL="$repair_database_url" node --input-type=module <<'JS'
const fail = () => {
  console.error('Use a loopback PostgreSQL URL without query parameters and a database named tet_indicateur_data_repair_test_*');
  process.exit(2);
};
let url;
try { url = new URL(process.env.DATABASE_URL); } catch { fail(); }
if (!['postgres:', 'postgresql:'].includes(url.protocol) ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    url.search || url.hash ||
    !/^\/tet_indicateur_data_repair_test_[a-z0-9_]+$/.test(url.pathname)) fail();
console.log(url.pathname.slice(1));
JS
)"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
data_layer_dir="$(cd "$script_dir/../.." && pwd)"
psql_test() {
  psql --no-psqlrc --no-password --quiet --set=ON_ERROR_STOP=1 \
    --set=VERBOSITY=verbose --dbname="$repair_database_url" "$@"
}

# Failed migration transactions need a separate connection with ON_ERROR_STOP.
# Save their actual SQLSTATE so the pgTAP session can make the assertions.
if [[ "${1:-}" == expected-failure ]]; then
  direction="${2:?Migration direction required}"
  scenario="${3:?Test scenario required}"
  [[ "$direction" == deploy || "$direction" == verify || "$direction" == revert ]] || exit 2
  error_log="$(mktemp)"
  trap 'rm -f "$error_log"' EXIT
  actual_state=00000
  if ! psql_test --file="$data_layer_dir/sqitch/$direction/indicateur/correct-dates-historiques.sql" >"$error_log" 2>&1; then
    actual_state=unknown
    error_output="$(cat "$error_log")"
    if [[ "$error_output" =~ ERROR:[[:space:]]+([[:alnum:]]{5}): ]]; then
      actual_state="${BASH_REMATCH[1]}"
    fi
  fi
  psql_test --set=scenario="$scenario" --set=actual_state="$actual_state" <<'SQL'
INSERT INTO public.fixture_migration_outcome (scenario, sqlstate)
VALUES (:'scenario', :'actual_state');
SQL
  exit 0
fi

# This guard precedes every CREATE/TRUNCATE in the suite.
fixture_is_empty="$(psql_test --tuples-only --no-align --set=database_name="$fixture_database_name" <<'SQL'
SELECT current_database() = :'database_name'
  AND to_regclass('public.indicateur_definition') IS NULL
  AND to_regclass('public.indicateur_valeur') IS NULL;
SQL
)"
if [[ "$fixture_is_empty" != t ]]; then
  echo 'Refusing a database with existing indicator tables or an unexpected name.' >&2
  exit 2
fi
export INDICATEUR_DATA_REPAIR_TEST_RUNNER="$script_dir/correct-dates-historiques.spec.sh"
pg_prove --dbname="$repair_database_url" --ext .psql --verbose "$script_dir/correct-dates-historiques.assertions.psql"
printf 'Synthetic fixtures remain in %s; caller must drop the disposable database.\n' "$fixture_database_name"
