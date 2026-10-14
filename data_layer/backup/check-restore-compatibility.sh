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
        $1 == "indicateur/periodicite_nettoyage" { later = 1 }
        END {
            if (!seen || later || reconciliation) print "unsupported"
            else if (schema) {
                if (activation && mandatory && integrity && extractor && formulas && reporting) print "contract"
                else if (!activation && mandatory && integrity && extractor && formulas && reporting) print "prepared"
                else if (activation || mandatory || integrity) print "incomplete"
                else if (extractor && formulas && reporting) print "reporting"
                else if (reporting) print "incomplete"
                else if (extractor && formulas) print "formulas"
                else if (extractor || formulas) print "incomplete"
                else print "schema"
            }
            else if (extractor || mandatory || integrity || formulas || reporting || reconciliation || activation) print "incomplete"
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
    legacy:legacy|legacy:schema|schema:schema|formulas:formulas|reporting:reporting|prepared:prepared|contract:contract) ;;
    *) echo "Refusing to restore: incompatible indicator releases ($source_phase -> $target_phase)." >&2; exit 1 ;;
esac
# Verify the physical schema before restore.sh truncates any table.
if [[ "$target_phase" == legacy ]]; then
    psql --no-psqlrc --no-password --set ON_ERROR_STOP=1 --dbname="$TO_DB_URL" >/dev/null <<'SQL'
DO $$
BEGIN
    ASSERT NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_schema = 'public'
                         AND table_name IN ('indicateur_definition', 'indicateur_valeur')
                         AND column_name = 'periodicite'),
        'Le schéma historique ne doit pas contenir de colonne periodicite';
    ASSERT to_regclass('public.indicateur_periodicite') IS NULL,
        'Le schéma historique ne doit pas contenir de catalogue de périodicités';
END $$;
SQL
elif [[ "$target_phase" != contract ]]; then
    # The shared verifier accepts activated schemas too. This release must
    # still have both annual-only constraints, whatever the registry says.
    psql --no-psqlrc --no-password --set ON_ERROR_STOP=1 --dbname="$TO_DB_URL" >/dev/null <<'SQL'
DO $$
BEGIN
    ASSERT (SELECT count(*) = 2 FROM pg_constraint
        WHERE contype = 'c' AND convalidated
          AND ((conrelid = 'public.indicateur_definition'::regclass
                AND conname = 'indicateur_definition_schema_annuel')
            OR (conrelid = 'public.indicateur_valeur'::regclass
                AND conname = 'indicateur_valeur_schema_annuel'))),
        'La restauration annuelle exige les deux contraintes annuelles actives';
END $$;
SQL
fi
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
verify_changes=()
if [[ "$target_phase" != legacy ]]; then
    verify_changes+=(indicateur/periodicite_schema)
fi
if [[ "$target_phase" != legacy && "$target_phase" != schema ]]; then
    verify_changes+=(
        indicateur/remplacer-catalogue-periodicites-par-contraintes
        indicateur/dependances_formules
        indicateur/periodicite_formules
    )
fi
if [[ "$target_phase" == reporting || "$target_phase" == prepared || "$target_phase" == contract ]]; then
    verify_changes+=(stats/report_indicateur_resultat_periode)
fi
if [[ "$target_phase" == prepared || "$target_phase" == contract ]]; then
    verify_changes+=(indicateur/periodicite_obligatoire indicateur/periodicite_integrite)
fi
if [[ "$target_phase" == contract ]]; then
    verify_changes+=(indicateur/periodicite_activation)
fi
for change in "${verify_changes[@]}"; do
    psql --no-psqlrc --no-password --set ON_ERROR_STOP=1 --dbname="$TO_DB_URL" \
        --file="$script_dir/../sqitch/verify/$change.sql" >/dev/null
done
printf '%s\n' "$target_phase"
