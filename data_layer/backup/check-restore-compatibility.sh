#!/bin/bash
set -euo pipefail
: "${TO_DB_URL:?Missing TO_DB_URL}"
[[ "$#" == 1 ]] || { echo 'Usage: TO_DB_URL=... check-restore-compatibility.sh backup.dump' >&2; exit 2; }

# Restore complete releases only, without intermediate normalization states.
classify_release() {
    awk -F '\t' '
        $2 != "tet" { next }
        { seen = 1 }
        $1 == "indicateur/periodicite_schema" { schema = 1 }
        $1 == "indicateur/dependances_formules" { extractor = 1 }
        $1 == "indicateur/periodicite_obligatoire" { mandatory = 1 }
        $1 == "indicateur/periodicite_formules" { formulas = 1 }
        $1 == "indicateur/reconciliation_formules" { reconciliation = 1 }
        $1 == "indicateur/periodicite_activation" { activation = 1 }
        $1 == "indicateur/margny_indicateurs_mensuels" { margny = 1 }
        $1 == "indicateur/periodicite_nettoyage" { cleaned = 1 }
        END {
            if (seen && schema && extractor && mandatory && formulas && activation && margny && cleaned) print reconciliation ? "cleaned-queue" : "cleaned"
            else print "unsupported"
        }
    '
}

# The archived registry belongs to the same snapshot as the restored data.
source_phase=$(pg_restore --data-only --schema=sqitch --table=changes --file=- "$1" \
    | awk -F '\t' '$4 == "tet" { print $3 "\t" $4 }' | classify_release)
target_phase=$(psql --no-psqlrc --no-password --set ON_ERROR_STOP=1 \
    --tuples-only --no-align --field-separator=$'\t' --dbname="$TO_DB_URL" \
    --command="SELECT change, project FROM sqitch.changes" | classify_release)

case "$source_phase:$target_phase" in
    cleaned:cleaned|cleaned-queue:cleaned-queue) ;;
    *) echo "Refusing to restore: incompatible indicator releases ($source_phase -> $target_phase)." >&2; exit 1 ;;
esac
if [[ "$source_phase" == cleaned-queue ]]; then
pg_restore --list "$1" | awk '
    $4 == "TABLE" && $5 == "DATA" && $6 == "private" && $7 == "indicateur_reconciliation_formule" { found = 1 }
    END { exit !found }
' || { echo 'Refusing to restore: backup lacks formula reconciliation data.' >&2; exit 1; }
fi
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
verify_changes=(periodicite_schema periodicite_obligatoire periodicite_formules periodicite_activation periodicite_nettoyage)
if [[ "$target_phase" == cleaned-queue ]]; then
    verify_changes+=(reconciliation_formules)
fi
for change in "${verify_changes[@]}"; do
    psql --no-psqlrc --no-password --set ON_ERROR_STOP=1 --dbname="$TO_DB_URL" \
        --file="$script_dir/../sqitch/verify/indicateur/$change.sql" >/dev/null
done
printf '%s\n' "$target_phase"
