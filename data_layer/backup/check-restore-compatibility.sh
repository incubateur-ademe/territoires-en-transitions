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
        $1 == "indicateur/periodicite_nettoyage" { later = 1 }
        END {
            if (!seen || later) print "unsupported"
            else if (schema) {
                if (activation && mandatory && extractor && formulas) print reconciliation ? "reconciliation" : "contract"
                else if (activation || mandatory || extractor || formulas || reconciliation) print "incomplete"
                else print "schema"
            }
            else if (extractor || mandatory || formulas || reconciliation || activation) print "incomplete"
            else print "legacy"
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
    legacy:legacy|legacy:schema|schema:schema|contract:contract|reconciliation:reconciliation) ;;
    *) echo "Refusing to restore: incompatible indicator releases ($source_phase -> $target_phase)." >&2; exit 1 ;;
esac
if [[ "$source_phase" == reconciliation ]]; then
    pg_restore --list "$1" | awk '
        $4 == "TABLE" && $5 == "DATA" && $6 == "private" && $7 == "indicateur_reconciliation_formule" { found = 1 }
        END { exit !found }
    ' || { echo 'Refusing to restore: backup lacks formula reconciliation data.' >&2; exit 1; }
fi
# Verify the physical schema before restore.sh truncates any table.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
verify_changes=()
if [[ "$target_phase" == schema || "$target_phase" == contract || "$target_phase" == reconciliation ]]; then
    verify_changes+=(periodicite_schema)
fi
if [[ "$target_phase" == contract || "$target_phase" == reconciliation ]]; then
    verify_changes+=(periodicite_obligatoire periodicite_formules periodicite_activation)
fi
if [[ "$target_phase" == reconciliation ]]; then
    verify_changes+=(reconciliation_formules)
fi
for change in "${verify_changes[@]}"; do
    psql --no-psqlrc --no-password --set ON_ERROR_STOP=1 --dbname="$TO_DB_URL" \
        --file="$script_dir/../sqitch/verify/indicateur/$change.sql" >/dev/null
done
printf '%s\n' "$target_phase"
