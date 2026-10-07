#!/bin/bash
set -euo pipefail
: "${TO_DB_URL:?Missing TO_DB_URL}"
[[ "$#" == 1 ]] || { echo 'Usage: TO_DB_URL=... check-restore-compatibility.sh backup.dump' >&2; exit 2; }

# The standalone schema release accepts only the old contract and its additive
# preparation. Inspect the snapshot registry before restore.sh truncates data.
source_phase=$(pg_restore --data-only --schema=sqitch --table=changes --file=- "$1" | awk -F '\t' '
    $4 == "tet" { seen = 1 }
    $3 == "indicateur/periodicite_schema" && $4 == "tet" { prepared = 1 }
    $3 ~ /^indicateur\/(periodicite|periodicite_obligatoire|periodicite_annuelle|periodicite_activation)$/ && $4 == "tet" { backend = 1 }
    END { print !seen ? "unknown" : backend ? "backend" : prepared ? "schema" : "legacy" }
')
target_phase=$(psql --no-psqlrc --no-password --set ON_ERROR_STOP=1 --tuples-only --no-align --dbname="$TO_DB_URL" <<'SQL'
SELECT CASE
  WHEN to_regclass('migration.indicateur_valeur_periodicite_audit') IS NOT NULL THEN 'backend'
  WHEN EXISTS (SELECT 1 FROM sqitch.changes WHERE project = 'tet' AND change = 'indicateur/periodicite_schema')
   AND (SELECT count(*) = 2 FROM information_schema.columns WHERE table_schema = 'public'
        AND table_name IN ('indicateur_definition', 'indicateur_valeur') AND column_name = 'periodicite')
   AND to_regclass('public.indicateur_periodicite') IS NOT NULL
   AND (SELECT count(*) = 2 FROM pg_constraint WHERE conname IN ('indicateur_definition_schema_annuel','indicateur_valeur_schema_annuel')
        AND conrelid IN ('public.indicateur_definition'::regclass,'public.indicateur_valeur'::regclass)) THEN 'schema'
  WHEN NOT EXISTS (SELECT 1 FROM sqitch.changes WHERE project = 'tet' AND change = 'indicateur/periodicite_schema')
   AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
                   AND table_name IN ('indicateur_definition','indicateur_valeur') AND column_name = 'periodicite')
   AND to_regclass('public.indicateur_periodicite') IS NULL THEN 'legacy'
  ELSE 'unknown' END;
SQL
)
case "$source_phase:$target_phase" in
    legacy:legacy|legacy:schema|schema:schema) ;;
    *) echo "Refusing to restore: incompatible indicator schemas ($source_phase -> $target_phase)." >&2; exit 1 ;;
esac
