#!/usr/bin/env sh
# Actual Sqitch files commit their transactions. Run only in an EMPTY, disposable
# local database created/dropped by the caller; never in a shared or restored DB.
# INDICATEUR_VALEURS_ACL_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/periodicite_migration_lifecycle_test_acl_local \
#   sh data_layer/tests/indicateur/reserver-ecriture-valeurs-backend.spec.sh
set -eu

acl_database_url="${INDICATEUR_VALEURS_ACL_TEST_DATABASE_URL:?Provide an empty disposable local test database}"
# Keep this driver usable in the pg_prove image (POSIX shell, no Node runtime).
# A strict URL grammar rejects options that could redirect a connection.
if ! printf '%s\n' "$acl_database_url" | awk '
  /^postgres(ql)?:\/\/([A-Za-z0-9._~:%+-]+@)?(localhost|127\.0\.0\.1|\[::1\])(:[0-9]+)?\/periodicite_migration_lifecycle_test_acl_[a-z0-9_]+$/ { valid = 1 }
  END { exit !(valid && NR == 1) }
'; then
  echo 'Use a loopback PostgreSQL URL without options and a database named periodicite_migration_lifecycle_test_acl_*' >&2
  exit 2
fi
fixture_database_name="${acl_database_url##*/}"
[ "${#fixture_database_name}" -le 63 ] || exit 2
script_dir="$(cd "$(dirname "$0")" && pwd)"
data_layer_dir="$(cd "$script_dir/../.." && pwd)"
psql_test() {
  psql --no-psqlrc --no-password --quiet --set=ON_ERROR_STOP=1 \
    --set=VERBOSITY=verbose --dbname="$acl_database_url" "$@"
}

# Failed migration transactions need a separate connection with ON_ERROR_STOP.
# Save their actual SQLSTATE so the pgTAP session can make the assertions.
if [ "${1:-}" = expected-failure ]; then
  direction="${2:?Migration direction required}"
  scenario="${3:?Test scenario required}"
  case "$direction" in deploy | verify | revert) ;; *) exit 2 ;; esac
  error_log="$(mktemp)"
  trap 'rm -f "$error_log"' 0
  actual_state=00000
  if ! psql_test --file="$data_layer_dir/sqitch/$direction/indicateur/reserver-ecriture-valeurs-backend.sql" >"$error_log" 2>&1; then
    actual_state="$(sed -n 's/.*ERROR:[[:space:]]*\([[:alnum:]]\{5\}\):.*/\1/p' "$error_log" | head -n 1)"
    actual_state="${actual_state:-unknown}"
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
  AND NOT EXISTS (SELECT FROM pg_class relation JOIN pg_namespace schema ON schema.oid=relation.relnamespace WHERE schema.nspname='public' AND relation.relkind IN ('r','p','v','m'))
  AND to_regnamespace('private') IS NULL;
SQL
)"
if [ "$fixture_is_empty" != t ]; then
  echo 'Refusing a database with existing objects or an unexpected name.' >&2
  exit 2
fi
export INDICATEUR_VALEURS_ACL_TEST_RUNNER="$script_dir/reserver-ecriture-valeurs-backend.spec.sh"
pg_prove --dbname="$acl_database_url" --ext .psql --verbose "$script_dir/reserver-ecriture-valeurs-backend.assertions.psql"
printf 'Synthetic fixtures remain in %s; caller must drop the disposable database.\n' "$fixture_database_name"
