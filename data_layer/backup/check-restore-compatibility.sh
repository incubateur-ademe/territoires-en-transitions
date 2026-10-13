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
            if (!seen || later || reconciliation) print "unsupported"
            else if (schema) {
                if (activation && mandatory && extractor && formulas) print "contract"
                else if (activation || mandatory || extractor || formulas) print "incomplete"
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
    legacy:legacy|legacy:schema|schema:schema) ;;
    *) echo "Refusing to restore: incompatible indicator releases ($source_phase -> $target_phase)." >&2; exit 1 ;;
esac
# Verify the physical schema before restore.sh truncates any table.
# The shared Sqitch verifier also accepts later schemas with this audit marker.
psql --no-psqlrc --no-password --set ON_ERROR_STOP=1 --dbname="$TO_DB_URL" >/dev/null <<'SQL'
DO $$
BEGIN
    ASSERT to_regclass('migration.indicateur_valeur_periodicite_audit') IS NULL,
        'La restauration annuelle refuse une cible déjà normalisée';
END $$;
SQL
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
else
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    psql --no-psqlrc --no-password --set ON_ERROR_STOP=1 --dbname="$TO_DB_URL" \
        --file="$script_dir/../sqitch/verify/indicateur/periodicite_schema.sql" >/dev/null
fi
printf '%s\n' "$target_phase"
