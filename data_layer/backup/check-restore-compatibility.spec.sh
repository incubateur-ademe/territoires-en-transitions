#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHECK_SCRIPT="$SCRIPT_DIR/check-restore-compatibility.sh"
TEST_DIRECTORY=$(mktemp -d)
trap 'rm -rf "$TEST_DIRECTORY"' EXIT
mkdir -p "$TEST_DIRECTORY/bin"
DUMP_FILE="$TEST_DIRECTORY/backup.dump"
printf 'test archive\n' > "$DUMP_FILE"

cat > "$TEST_DIRECTORY/bin/psql" <<'MOCK'
#!/bin/bash
set -eu
if [ "${TARGET_QUERY_FAILS:-false}" = true ]; then exit 1; fi
if [[ " $* " == *" -Atc "* ]]; then
    printf '%s\n' "${TARGET_FINAL:-t}"
else
    # Verify the shell propagates SQL failures. Real contracts run in the
    # migration lifecycle suite against PostgreSQL, not these command doubles.
    if [ "${TARGET_CONTRACT_FAILS:-false}" = true ]; then exit 1; fi
    [[ " $* " == *"--command=SET plpgsql.check_asserts = on; "* ]] || exit 1
    [[ " $* " == *" --file="*"/periodicite_nettoyage.sql "* ]] || exit 1
fi
MOCK

cat > "$TEST_DIRECTORY/bin/pg_restore" <<'MOCK'
#!/bin/bash
set -eu
if [[ " $* " == *" --list "* ]]; then
    if [ "${ARCHIVE_LIST_FAILS:-false}" = true ]; then exit 1; fi
    printf '1; 0 1 TABLE DATA sqitch changes postgres\n'
    if [ "${ARCHIVE_QUEUE_MISSING:-false}" != true ]; then
        printf '2; 0 2 TABLE DATA private indicateur_reconciliation_formule postgres\n'
    fi
else
    if [ "${SOURCE_REGISTRY_MISSING:-false}" != true ]; then
        printf 'COPY sqitch.changes (change_id, script_hash, change, project, note) FROM stdin;\n'
        for change in indicateur/periodicite_activation indicateur/margny_indicateurs_mensuels indicateur/periodicite_nettoyage; do
            if [ "${SOURCE_CHANGE_MISSING:-}" != "$change" ]; then
                printf 'id\thash\t%s\t%s\tnote\n' "$change" "${SOURCE_PROJECT:-tet}"
            fi
        done
        printf '\\.\n'
    fi
    # A reader that emitted valid rows and then failed must still be rejected.
    if [ "${ARCHIVE_READ_FAILS:-false}" = true ]; then exit 1; fi
fi
MOCK
chmod +x "$TEST_DIRECTORY/bin/psql" "$TEST_DIRECTORY/bin/pg_restore"

assert_exit() {
    local expected="$1" description="$2"
    shift 2
    local actual=0
    env PATH="$TEST_DIRECTORY/bin:$PATH" TO_DB_URL=postgresql://target/db \
        "$@" bash "$CHECK_SCRIPT" "$DUMP_FILE" > "$TEST_DIRECTORY/output" 2>&1 || actual=$?
    if [ "$actual" -ne "$expected" ]; then
        echo "FAIL: $description (expected $expected, got $actual)" >&2
        cat "$TEST_DIRECTORY/output" >&2
        exit 1
    fi
}

assert_exit 0 'the final schema accepts a final archive with an empty queue' env
assert_exit 1 'an earlier target is rejected' env TARGET_FINAL=f
assert_exit 1 'a target connection error aborts the check' env TARGET_QUERY_FAILS=true
assert_exit 1 'a final SQL contract failure aborts the check' env TARGET_CONTRACT_FAILS=true
assert_exit 1 'a missing activation marker is rejected' env SOURCE_CHANGE_MISSING=indicateur/periodicite_activation
assert_exit 1 'a missing Margny marker is rejected' env SOURCE_CHANGE_MISSING=indicateur/margny_indicateurs_mensuels
assert_exit 1 'a missing cleanup marker is rejected' env SOURCE_CHANGE_MISSING=indicateur/periodicite_nettoyage
assert_exit 1 'a missing registry is rejected' env SOURCE_REGISTRY_MISSING=true
assert_exit 1 'markers from another project are rejected' env SOURCE_PROJECT=other
assert_exit 1 'an archive stream error is rejected even after valid markers' env ARCHIVE_READ_FAILS=true
assert_exit 1 'an archive listing error is rejected' env ARCHIVE_LIST_FAILS=true
assert_exit 1 'a missing durable queue is rejected' env ARCHIVE_QUEUE_MISSING=true
assert_exit 2 'a missing target URL is rejected' env -u TO_DB_URL

echo 'Restore compatibility guards: 13 checks passed.'
