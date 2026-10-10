#!/bin/bash
set -euo pipefail
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
test_dir=$(mktemp -d)
trap 'rm -rf "$test_dir"' EXIT
mkdir "$test_dir/bin"
cat > "$test_dir/bin/psql" <<'FAKE'
#!/bin/bash
[[ "${TARGET_QUERY_FAILS:-false}" != true ]] || exit 1
if [[ " $* " == *" --file="* ]]; then
    [[ "${TARGET_SCHEMA_FAILS:-false}" != true ]] || exit 1
    exit 0
fi
cat "$TARGET_REGISTRY"
FAKE
cat > "$test_dir/bin/pg_restore" <<'FAKE'
#!/bin/bash
[[ "${ARCHIVE_READ_FAILS:-false}" != true ]] || exit 1
if [[ " $* " == *" --list "* ]]; then
    [[ "${MISSING_QUEUE:-false}" == true ]] || printf '1; 0 1 TABLE DATA private indicateur_reconciliation_formule owner\n'
    [[ "${MISSING_REPAIR:-false}" == true ]] || printf '2; 0 2 TABLE DATA private indicateur_valeur_date_repair owner\n'
    exit 0
fi
awk -F '\t' '{ print "id\thash\t" $1 "\t" $2 "\tnote" }' "$SOURCE_REGISTRY"
FAKE
chmod +x "$test_dir/bin/psql" "$test_dir/bin/pg_restore"
registry() {
    local phase="$1"
    printf 'baseline\ttet\n' > "$test_dir/$phase"
    [[ "$phase" != legacy ]] || return 0
    printf 'indicateur/periodicite_schema\ttet\n' >> "$test_dir/$phase"
    [[ "$phase" != schema ]] || return 0
    printf 'indicateur/verrouiller-graphe-calcul-indicateur\ttet\n' >> "$test_dir/$phase"
    [[ "$phase" != incomplete ]] || return 0
    for change in reserver-ecriture-valeurs-backend; do
        printf 'indicateur/%s\ttet\n' "$change" >> "$test_dir/$phase"
    done
    if [[ "$phase" == reconciliation ]]; then
        printf 'indicateur/reconciliation_formules\ttet\n' >> "$test_dir/$phase"
    fi
    if [[ "$phase" == contract ]]; then
        printf 'indicateur/periodicite_obligatoire\ttet\nindicateur/dependances_formules\ttet\nindicateur/periodicite_formules\ttet\n' >> "$test_dir/$phase"
        printf 'indicateur/periodicite_activation\ttet\n' >> "$test_dir/$phase"
    fi
}
for phase in legacy schema incomplete annual reconciliation contract; do registry "$phase"; done
cp "$test_dir/contract" "$test_dir/contract-margny"
printf 'indicateur/margny_indicateurs_mensuels\ttet\n' >> "$test_dir/contract-margny"
cp "$test_dir/contract-margny" "$test_dir/cleaned"
printf 'indicateur/periodicite_nettoyage\ttet\n' >> "$test_dir/cleaned"
cp "$test_dir/contract" "$test_dir/later"
printf 'indicateur/periodicite_nettoyage\ttet\n' >> "$test_dir/later"
: > "$test_dir/empty"
sed 's/tet$/another-project/' "$test_dir/annual" > "$test_dir/wrong-project"
sed '/indicateur\/dependances_formules/d' "$test_dir/cleaned" > "$test_dir/cleaned-no-extractor"
sed '/indicateur\/periodicite_formules/d' "$test_dir/cleaned" > "$test_dir/cleaned-no-formulas"
sed '/indicateur\/periodicite_activation/d' "$test_dir/cleaned" > "$test_dir/cleaned-no-activation"
sed '/indicateur\/periodicite_obligatoire/d' "$test_dir/cleaned" > "$test_dir/cleaned-no-obligatoire"
cp "$test_dir/cleaned" "$test_dir/cleaned-queue"
printf 'indicateur/reconciliation_formules\ttet\n' >> "$test_dir/cleaned-queue"
checks=0
check() {
    local expected="$1" source="$2" target="$3"
    shift 3
    local actual=success
    env PATH="$test_dir/bin:$PATH" TO_DB_URL=postgresql://localhost/test \
        SOURCE_REGISTRY="$test_dir/$source" TARGET_REGISTRY="$test_dir/$target" \
        "$@" bash "$script_dir/check-restore-compatibility.sh" "$test_dir/backup.dump" > "$test_dir/output" 2>&1 || actual=failure
    if [[ "$actual" != "$expected" ]]; then
        echo "FAIL: $source -> $target (expected $expected)" >&2
        cat "$test_dir/output" >&2
        exit 1
    fi
    checks=$((checks + 1))
}
check success cleaned cleaned
for phase in legacy schema incomplete annual reconciliation contract contract-margny later empty wrong-project; do
    check failure "$phase" cleaned
    check failure cleaned "$phase"
done
check success cleaned cleaned MISSING_QUEUE=true
check failure cleaned cleaned TARGET_SCHEMA_FAILS=true
check success cleaned-queue cleaned-queue
check failure cleaned-queue cleaned
check failure cleaned cleaned-queue
check failure cleaned-queue cleaned-queue MISSING_QUEUE=true
check failure cleaned cleaned ARCHIVE_READ_FAILS=true
check failure cleaned cleaned TARGET_QUERY_FAILS=true
for phase in cleaned-no-extractor cleaned-no-formulas cleaned-no-activation cleaned-no-obligatoire; do
    check failure "$phase" cleaned
    check failure cleaned "$phase"
done
printf 'PASS: %s restore compatibility checks\n' "$checks"
