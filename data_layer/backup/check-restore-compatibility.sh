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
        $1 == "indicateur/periodicite_integrite" { integrity = 1 }
        $1 == "indicateur/periodicite_formules" { formulas = 1 }
        $1 == "stats/report_indicateur_resultat_periode" { reporting = 1 }
        $1 == "indicateur/reconciliation_formules" { reconciliation = 1 }
        $1 == "indicateur/periodicite_activation" { activation = 1 }
        $1 == "indicateur/margny_indicateurs_mensuels" { margny = 1 }
        $1 == "indicateur/periodicite_nettoyage" { cleaned = 1 }
        END {
            if (!reconciliation && seen && schema && extractor && mandatory && integrity && formulas && reporting && activation && margny && cleaned) print "cleaned"
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
    cleaned:cleaned) ;;
    *) echo "Refusing to restore: incompatible indicator releases ($source_phase -> $target_phase)." >&2; exit 1 ;;
esac
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
verify_changes=(
    indicateur/periodicite_schema
    indicateur/remplacer-catalogue-periodicites-par-contraintes
    indicateur/periodicite_obligatoire
    indicateur/periodicite_integrite
    indicateur/dependances_formules
    indicateur/periodicite_formules
    stats/report_indicateur_resultat_periode
    indicateur/periodicite_activation
    indicateur/periodicite_nettoyage
)
for change in "${verify_changes[@]}"; do
    psql --no-psqlrc --no-password --set ON_ERROR_STOP=1 --dbname="$TO_DB_URL" \
        --file="$script_dir/../sqitch/verify/$change.sql" >/dev/null
done
printf '%s\n' "$target_phase"
