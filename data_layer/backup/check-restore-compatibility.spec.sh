#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHECK_SCRIPT="$SCRIPT_DIR/check-restore-compatibility.sh"
TEST_DIRECTORY=$(mktemp -d)
FAKE_BIN="$TEST_DIRECTORY/bin"
DUMP_FILE="$TEST_DIRECTORY/backup.dump"

cleanup() {
    rm -rf "$TEST_DIRECTORY"
}
trap cleanup EXIT

mkdir -p "$FAKE_BIN"
printf 'test archive\n' > "$DUMP_FILE"

printf '%s\n' \
    '#!/bin/bash' \
    'if [ "${TARGET_QUERY_FAILS:-false}" = "true" ]; then exit 1; fi' \
    'case "${TARGET_SCHEMA_DRIFT:-}" in' \
    '  expand-*) printf "physical-drift-expand\n" ;;' \
    '  contract-*) printf "physical-drift-contract\n" ;;' \
    '  *) printf "%s\n" "${TARGET_PHASE:-legacy}" ;;' \
    'esac' \
    > "$FAKE_BIN/psql"

printf '%s\n' \
    '#!/bin/bash' \
    'if [ "${ARCHIVE_READ_FAILS:-false}" = "true" ]; then exit 1; fi' \
    'if [[ " $* " == *" --list "* ]]; then' \
    '  printf "1; 0 1 TABLE DATA sqitch changes owner\\n"' \
    '  if [ "${ARCHIVE_AUDIT_TABLE_MISSING:-false}" != "true" ]; then' \
    '    printf "2; 0 2 TABLE DATA migration indicateur_valeur_periodicite_audit owner\\n"' \
    '  fi' \
    '  if [ "${ARCHIVE_QUEUE_TABLE_MISSING:-false}" != "true" ]; then' \
    '    printf "3; 0 3 TABLE DATA private indicateur_reconciliation_formule owner\\n"' \
    '  fi' \
    '  exit 0' \
    'fi' \
    'if [ "${SOURCE_PHASE:-legacy}" != "missing-registry" ]; then' \
    '  printf "change-id\\thash\\tbaseline/change\\ttet\\tnote\\n"' \
    'fi' \
    'if [ "${SOURCE_PHASE:-legacy}" = "partial-expand" ]; then' \
    '  printf "change-id\\thash\\tindicateur/periodicite\\ttet\\tnote\\n"' \
    'fi' \
    'if [ "${SOURCE_PHASE:-legacy}" = "expand" ] || [ "${SOURCE_PHASE:-legacy}" = "partial-contract" ] || [ "${SOURCE_PHASE:-legacy}" = "contract" ]; then' \
    '  printf "change-id\\thash\\tindicateur/periodicite\\ttet\\tnote\\n"' \
    '  printf "change-id\\thash\\tindicateur/import_emt_valeur\\ttet\\tnote\\n"' \
    '  printf "change-id\\thash\\tindicateur/reconciliation_formules\\ttet\\tnote\\n"' \
    '  printf "change-id\\thash\\tindicateur/dependances_formules\\ttet\\tnote\\n"' \
    'fi' \
    'if [ "${SOURCE_PHASE:-legacy}" = "partial-contract" ] || [ "${SOURCE_PHASE:-legacy}" = "contract" ]; then' \
    '  printf "change-id\\thash\\tindicateur/periodicite_obligatoire\\ttet\\tnote\\n"' \
    'fi' \
    'if [ "${SOURCE_PHASE:-legacy}" = "contract" ]; then' \
    '  printf "change-id\\thash\\tindicateur/periodicite_formules\\ttet\\tnote\\n"' \
    '  printf "change-id\\thash\\tstats/report_indicateur_resultat_periode\\ttet\\tnote\\n"' \
    'fi' \
    > "$FAKE_BIN/pg_restore"

chmod +x "$FAKE_BIN/psql" "$FAKE_BIN/pg_restore"

assert_success() {
    local description="$1"
    shift

    if ! env PATH="$FAKE_BIN:/usr/bin:/bin" TO_DB_URL="postgresql://target/db" "$@" >/dev/null 2>&1; then
        echo "FAIL: $description" >&2
        exit 1
    fi
}

assert_failure() {
    local description="$1"
    shift

    if env PATH="$FAKE_BIN:/usr/bin:/bin" TO_DB_URL="postgresql://target/db" "$@" >/dev/null 2>&1; then
        echo "FAIL: $description" >&2
        exit 1
    fi
}

assert_failure_with_message() {
    local description="$1"
    local expected_message="$2"
    shift 2
    local output_file="$TEST_DIRECTORY/failure-output"

    if env PATH="$FAKE_BIN:/usr/bin:/bin" TO_DB_URL="postgresql://target/db" \
        "$@" >"$output_file" 2>&1; then
        echo "FAIL: $description" >&2
        exit 1
    fi

    if ! grep --fixed-strings --quiet "$expected_message" "$output_file"; then
        echo "FAIL: $description (unexpected error)" >&2
        cat "$output_file" >&2
        exit 1
    fi
}

assert_success \
    "a legacy target accepts a legacy backup" \
    env TARGET_PHASE=legacy SOURCE_PHASE=legacy \
    bash "$CHECK_SCRIPT" "$DUMP_FILE"

assert_success \
    "an expand target accepts an expand backup" \
    env TARGET_PHASE=expand SOURCE_PHASE=expand \
    bash "$CHECK_SCRIPT" "$DUMP_FILE"

assert_success \
    "a post-contract target accepts a post-contract backup" \
    env TARGET_PHASE=contract SOURCE_PHASE=contract \
    bash "$CHECK_SCRIPT" "$DUMP_FILE"

assert_failure \
    "a contract target rejects an older expand backup" \
    env TARGET_PHASE=contract SOURCE_PHASE=expand \
    bash "$CHECK_SCRIPT" "$DUMP_FILE"

assert_failure \
    "an expand target rejects a newer contract backup" \
    env TARGET_PHASE=expand SOURCE_PHASE=contract \
    bash "$CHECK_SCRIPT" "$DUMP_FILE"

assert_failure \
    "a partial-contract target rejects every backup" \
    env TARGET_PHASE=partial-contract SOURCE_PHASE=contract \
    bash "$CHECK_SCRIPT" "$DUMP_FILE"

assert_failure \
    "a partial-contract backup is rejected" \
    env TARGET_PHASE=contract SOURCE_PHASE=partial-contract \
    bash "$CHECK_SCRIPT" "$DUMP_FILE"

assert_failure \
    "a partial-expand target rejects every backup" \
    env TARGET_PHASE=partial-expand SOURCE_PHASE=expand \
    bash "$CHECK_SCRIPT" "$DUMP_FILE"

assert_failure \
    "a partial-expand backup is rejected" \
    env TARGET_PHASE=expand SOURCE_PHASE=partial-expand \
    bash "$CHECK_SCRIPT" "$DUMP_FILE"

assert_failure \
    "a target registry read failure is fail-closed" \
    env TARGET_QUERY_FAILS=true SOURCE_PHASE=contract \
    bash "$CHECK_SCRIPT" "$DUMP_FILE"

assert_failure \
    "an unexpected target registry result is fail-closed" \
    env TARGET_PHASE=unexpected SOURCE_PHASE=contract \
    bash "$CHECK_SCRIPT" "$DUMP_FILE"

assert_failure \
    "a target without the Sqitch registry is fail-closed" \
    env TARGET_PHASE=missing-registry SOURCE_PHASE=legacy \
    bash "$CHECK_SCRIPT" "$DUMP_FILE"

assert_failure \
    "physical target drift is fail-closed" \
    env TARGET_PHASE=physical-drift-contract SOURCE_PHASE=contract \
    bash "$CHECK_SCRIPT" "$DUMP_FILE"

physical_drift_message="target schema objects disagree with its Sqitch phase"

assert_failure_with_message \
    "an expand target rejects a NOT NULL periodicite column" \
    "$physical_drift_message" \
    env TARGET_SCHEMA_DRIFT=expand-not-null SOURCE_PHASE=expand \
    bash "$CHECK_SCRIPT" "$DUMP_FILE"

assert_failure_with_message \
    "an expand target rejects a missing compatibility default" \
    "$physical_drift_message" \
    env TARGET_SCHEMA_DRIFT=expand-missing-default SOURCE_PHASE=expand \
    bash "$CHECK_SCRIPT" "$DUMP_FILE"

assert_failure_with_message \
    "an expand target rejects the strict guard in place of the transition guard" \
    "$physical_drift_message" \
    env TARGET_SCHEMA_DRIFT=expand-strict-guard SOURCE_PHASE=expand \
    bash "$CHECK_SCRIPT" "$DUMP_FILE"

assert_failure_with_message \
    "a contract target rejects a nullable periodicite column" \
    "$physical_drift_message" \
    env TARGET_SCHEMA_DRIFT=contract-nullable SOURCE_PHASE=contract \
    bash "$CHECK_SCRIPT" "$DUMP_FILE"

assert_failure_with_message \
    "a contract target rejects the expand compatibility default" \
    "$physical_drift_message" \
    env TARGET_SCHEMA_DRIFT=contract-default SOURCE_PHASE=contract \
    bash "$CHECK_SCRIPT" "$DUMP_FILE"

assert_failure_with_message \
    "a contract target rejects the transition guard in place of the strict guard" \
    "$physical_drift_message" \
    env TARGET_SCHEMA_DRIFT=contract-transition-guard SOURCE_PHASE=contract \
    bash "$CHECK_SCRIPT" "$DUMP_FILE"

assert_failure \
    "an archive registry read failure is fail-closed" \
    env TARGET_PHASE=contract ARCHIVE_READ_FAILS=true \
    bash "$CHECK_SCRIPT" "$DUMP_FILE"

assert_failure \
    "an archive without the Sqitch registry is fail-closed" \
    env TARGET_PHASE=legacy SOURCE_PHASE=missing-registry \
    bash "$CHECK_SCRIPT" "$DUMP_FILE"

assert_failure \
    "an expand archive without its audit table data is fail-closed" \
    env TARGET_PHASE=expand SOURCE_PHASE=expand ARCHIVE_AUDIT_TABLE_MISSING=true \
    bash "$CHECK_SCRIPT" "$DUMP_FILE"

assert_failure \
    "an expand archive without its reconciliation queue data is fail-closed" \
    env TARGET_PHASE=expand SOURCE_PHASE=expand ARCHIVE_QUEUE_TABLE_MISSING=true \
    bash "$CHECK_SCRIPT" "$DUMP_FILE"

echo "Restore compatibility checks passed."
