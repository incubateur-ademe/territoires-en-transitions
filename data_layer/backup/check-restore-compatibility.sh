#!/bin/bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
    echo "Usage: TO_DB_URL=... $0 <backup.dump>" >&2
    exit 2
fi

if [ -z "${TO_DB_URL:-}" ]; then
    echo "Missing TO_DB_URL environment variable" >&2
    exit 2
fi

DUMP_FILE="$1"
EXPAND_CHANGE="indicateur/periodicite"
EXPAND_IMPORT_CHANGE="indicateur/import_emt_valeur"
EXPAND_RECONCILIATION_CHANGE="indicateur/reconciliation_formules"
EXPAND_DEPENDENCIES_CHANGE="indicateur/dependances_formules"
TARGET_CONTRACT_CHANGE="indicateur/periodicite_obligatoire"
SOURCE_FORMULA_CHANGE="indicateur/periodicite_formules"
SOURCE_FINAL_CHANGE="stats/report_indicateur_resultat_periode"
SQITCH_PROJECT="tet"

# The registry identifies the intended phase, while the physical object checks
# below prove that the target can safely execute that phase's restore path.
# This includes the column contract and the exact phase-specific write guard;
# an object with the right name but the wrong trigger semantics is drift. A
# connection, registry or schema-drift error must stop the restore before any
# table is truncated. In pg_trigger.tgtype, 23 is ROW + BEFORE + INSERT + UPDATE.
target_phase=$(psql \
    --dbname "$TO_DB_URL" \
    --no-psqlrc \
    --tuples-only \
    --no-align \
    --set ON_ERROR_STOP=1 \
    --command "
        WITH registry_phase AS (
            SELECT CASE
                WHEN count(*) FILTER (
                    WHERE change = '$EXPAND_CHANGE'
                ) > 0
                 AND count(*) FILTER (
                    WHERE change = '$EXPAND_IMPORT_CHANGE'
                ) > 0
                 AND count(*) FILTER (
                    WHERE change = '$EXPAND_RECONCILIATION_CHANGE'
                ) > 0
                 AND count(*) FILTER (
                    WHERE change = '$EXPAND_DEPENDENCIES_CHANGE'
                ) > 0
                 AND count(*) FILTER (
                    WHERE change = '$TARGET_CONTRACT_CHANGE'
                ) > 0
                 AND count(*) FILTER (
                    WHERE change = '$SOURCE_FORMULA_CHANGE'
                ) > 0
                 AND count(*) FILTER (
                    WHERE change = '$SOURCE_FINAL_CHANGE'
                ) > 0
                    THEN 'contract'
                WHEN count(*) FILTER (
                    WHERE change IN (
                        '$TARGET_CONTRACT_CHANGE',
                        '$SOURCE_FORMULA_CHANGE',
                        '$SOURCE_FINAL_CHANGE'
                    )
                ) > 0
                    THEN 'partial-contract'
                WHEN count(*) FILTER (
                    WHERE change = '$EXPAND_CHANGE'
                ) > 0
                 AND count(*) FILTER (
                    WHERE change = '$EXPAND_IMPORT_CHANGE'
                ) > 0
                 AND count(*) FILTER (
                    WHERE change = '$EXPAND_RECONCILIATION_CHANGE'
                ) > 0
                 AND count(*) FILTER (
                    WHERE change = '$EXPAND_DEPENDENCIES_CHANGE'
                ) > 0
                    THEN 'expand'
                WHEN count(*) FILTER (
                    WHERE change IN (
                        '$EXPAND_CHANGE',
                        '$EXPAND_IMPORT_CHANGE',
                        '$EXPAND_RECONCILIATION_CHANGE',
                        '$EXPAND_DEPENDENCIES_CHANGE'
                    )
                ) > 0
                    THEN 'partial-expand'
                ELSE 'legacy'
            END AS phase,
            count(*) > 0 AS registry_seen
            FROM sqitch.changes
            WHERE project = '$SQITCH_PROJECT'
        ),
        physical_state AS (
            SELECT
                to_regclass(
                    'public.indicateur_periodicite'
                ) IS NOT NULL AS periodicity_catalog_exists,
                EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'indicateur_definition'
                      AND column_name = 'periodicite'
                ) AS periodicity_column_exists,
                EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'indicateur_definition'
                      AND column_name = 'periodicite'
                      AND data_type = 'text'
                      AND is_nullable = 'YES'
                      AND column_default = '''annuelle''::text'
                ) AS periodicity_column_is_expand_compatible,
                EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'indicateur_definition'
                      AND column_name = 'periodicite'
                      AND data_type = 'text'
                      AND is_nullable = 'NO'
                      AND column_default IS NULL
                ) AS periodicity_column_is_contract_compatible,
                to_regprocedure(
                    'public.indicateur_date_debut_periode(text,date)'
                ) IS NOT NULL AS canonical_date_function_exists,
                to_regclass(
                    'migration.indicateur_valeur_periodicite_audit'
                ) IS NOT NULL AS audit_table_exists,
                to_regclass(
                    'private.indicateur_reconciliation_formule'
                ) IS NOT NULL AS reconciliation_queue_exists,
                to_regclass(
                    'private.indicateur_definition_dependance_calcul'
                ) IS NOT NULL AS dependency_projection_exists,
                to_regprocedure(
                    'private.extraire_dependances_formule_indicateur(text)'
                ) IS NOT NULL AS dependency_extractor_exists,
                to_regprocedure(
                    'private.verifier_periodicite_dependances_formule(integer,text[])'
                ) IS NOT NULL AS dependency_verifier_exists,
                to_regprocedure(
                    'migration.auditer_et_normaliser_dates_indicateur()'
                ) IS NOT NULL AS audit_function_exists,
                to_regprocedure(
                    'migration.auditer_et_normaliser_date_indicateur_en_transition()'
                ) IS NOT NULL AS transition_date_function_exists,
                EXISTS (
                    SELECT 1
                    FROM pg_trigger
                    WHERE tgrelid = to_regclass('public.indicateur_valeur')
                      AND tgname =
                          'auditer_et_normaliser_date_indicateur_en_transition'
                      AND NOT tgisinternal
                ) AS transition_date_trigger_exists,
                EXISTS (
                    SELECT 1
                    FROM pg_trigger trigger_state
                    WHERE trigger_state.tgrelid =
                          to_regclass('public.indicateur_valeur')
                      AND trigger_state.tgname =
                          'auditer_et_normaliser_date_indicateur_en_transition'
                      AND trigger_state.tgenabled = 'O'
                      AND NOT trigger_state.tgisinternal
                      AND trigger_state.tgconstraint = 0
                      AND trigger_state.tgtype::integer = 23
                      AND trigger_state.tgfoid = to_regprocedure(
                          'migration.auditer_et_normaliser_date_indicateur_en_transition()'
                      )
                      AND (
                          SELECT array_agg(
                              attribute.attname
                              ORDER BY attribute.attname
                          )
                          FROM unnest(
                              trigger_state.tgattr::smallint[]
                          ) AS updated(attnum)
                          JOIN pg_attribute attribute
                            ON attribute.attrelid = trigger_state.tgrelid
                           AND attribute.attnum = updated.attnum
                      ) = ARRAY[
                          'collectivite_id',
                          'date_valeur',
                          'indicateur_id',
                          'metadonnee_id'
                      ]::name[]
                ) AS transition_date_trigger_is_valid,
                to_regprocedure(
                    'public.verifier_date_valeur_selon_periodicite()'
                ) IS NOT NULL AS strict_date_function_exists,
                EXISTS (
                    SELECT 1
                    FROM pg_trigger
                    WHERE tgrelid = to_regclass('public.indicateur_valeur')
                      AND tgname = 'verifier_date_valeur_selon_periodicite'
                      AND NOT tgisinternal
                ) AS strict_date_trigger_exists,
                EXISTS (
                    SELECT 1
                    FROM pg_trigger trigger_state
                    WHERE trigger_state.tgrelid =
                          to_regclass('public.indicateur_valeur')
                      AND trigger_state.tgname =
                          'verifier_date_valeur_selon_periodicite'
                      AND trigger_state.tgenabled = 'O'
                      AND NOT trigger_state.tgisinternal
                      AND trigger_state.tgconstraint = 0
                      AND trigger_state.tgtype::integer = 23
                      AND trigger_state.tgfoid = to_regprocedure(
                          'public.verifier_date_valeur_selon_periodicite()'
                      )
                      AND (
                          SELECT array_agg(
                              attribute.attname
                              ORDER BY attribute.attname
                          )
                          FROM unnest(
                              trigger_state.tgattr::smallint[]
                          ) AS updated(attnum)
                          JOIN pg_attribute attribute
                            ON attribute.attrelid = trigger_state.tgrelid
                           AND attribute.attnum = updated.attnum
                      ) = ARRAY[
                          'date_valeur',
                          'indicateur_id'
                      ]::name[]
                ) AS strict_date_trigger_is_valid
        )
        SELECT CASE
            WHEN NOT registry_seen
                THEN 'missing-registry'
            WHEN phase = 'legacy'
             AND NOT periodicity_catalog_exists
             AND NOT periodicity_column_exists
             AND NOT canonical_date_function_exists
             AND NOT audit_table_exists
             AND NOT reconciliation_queue_exists
             AND NOT dependency_projection_exists
             AND NOT dependency_extractor_exists
             AND NOT dependency_verifier_exists
             AND NOT audit_function_exists
             AND NOT transition_date_function_exists
             AND NOT transition_date_trigger_exists
             AND NOT strict_date_function_exists
             AND NOT strict_date_trigger_exists
                THEN 'legacy'
            WHEN phase = 'expand'
             AND periodicity_catalog_exists
             AND periodicity_column_is_expand_compatible
             AND canonical_date_function_exists
             AND audit_table_exists
             AND reconciliation_queue_exists
             AND dependency_extractor_exists
             AND audit_function_exists
             AND transition_date_function_exists
             AND transition_date_trigger_is_valid
             AND NOT strict_date_function_exists
             AND NOT strict_date_trigger_exists
             AND NOT dependency_projection_exists
             AND NOT dependency_verifier_exists
                THEN 'expand'
            WHEN phase = 'contract'
             AND periodicity_catalog_exists
             AND periodicity_column_is_contract_compatible
             AND canonical_date_function_exists
             AND audit_table_exists
             AND reconciliation_queue_exists
             AND dependency_projection_exists
             AND dependency_extractor_exists
             AND dependency_verifier_exists
             AND NOT audit_function_exists
             AND NOT transition_date_function_exists
             AND NOT transition_date_trigger_exists
             AND strict_date_function_exists
             AND strict_date_trigger_is_valid
                THEN 'contract'
            WHEN phase IN ('partial-expand', 'partial-contract')
                THEN phase
            ELSE 'physical-drift-' || phase
        END
        FROM registry_phase
        CROSS JOIN physical_state;
    ")

case "$target_phase" in
    legacy|expand|contract)
        ;;
    partial-expand)
        echo "Refusing to restore: target is inside a partial periodicity expand." >&2
        exit 1
        ;;
    partial-contract)
        echo "Refusing to restore: target is inside a partial periodicity contract." >&2
        exit 1
        ;;
    missing-registry)
        echo "Refusing to restore: target has no Sqitch registry state." >&2
        exit 1
        ;;
    physical-drift-*)
        echo "Refusing to restore: target schema objects disagree with its Sqitch phase." >&2
        exit 1
        ;;
    *)
        echo "Refusing to restore: unexpected target periodicity phase." >&2
        exit 1
        ;;
esac

# pg_dump includes sqitch.changes in the same consistent snapshot as the
# business data. Inspect that archived COPY stream instead of trusting mutable
# metadata or a date supplied by the operator.
source_phase=$(pg_restore \
    --data-only \
    --schema=sqitch \
    --table=changes \
    --file=- \
    "$DUMP_FILE" \
    | awk -F '\t' \
        -v expand_change="$EXPAND_CHANGE" \
        -v import_change="$EXPAND_IMPORT_CHANGE" \
        -v reconciliation_change="$EXPAND_RECONCILIATION_CHANGE" \
        -v dependencies_change="$EXPAND_DEPENDENCIES_CHANGE" \
        -v mandatory_change="$TARGET_CONTRACT_CHANGE" \
        -v formula_change="$SOURCE_FORMULA_CHANGE" \
        -v final_change="$SOURCE_FINAL_CHANGE" \
        -v project="$SQITCH_PROJECT" '
        $4 == project { registry_seen = 1 }
        $3 == expand_change && $4 == project { expand_applied = 1 }
        $3 == import_change && $4 == project { import_applied = 1 }
        $3 == reconciliation_change && $4 == project { reconciliation_applied = 1 }
        $3 == dependencies_change && $4 == project { dependencies_applied = 1 }
        $3 == mandatory_change && $4 == project { mandatory_applied = 1 }
        $3 == formula_change && $4 == project { formula_applied = 1 }
        $3 == final_change && $4 == project { final_applied = 1 }
        END {
            expand_complete = expand_applied && import_applied \
                && reconciliation_applied && dependencies_applied
            if (!registry_seen) {
                print "missing-registry"
            } else if (expand_complete && mandatory_applied && formula_applied && final_applied) {
                print "contract"
            } else if (mandatory_applied || formula_applied || final_applied) {
                print "partial-contract"
            } else if (expand_complete) {
                print "expand"
            } else if (expand_applied || import_applied \
                       || reconciliation_applied || dependencies_applied) {
                print "partial-expand"
            } else {
                print "legacy"
            }
        }
    ')

case "$source_phase" in
    legacy|expand|contract)
        ;;
    partial-expand)
        echo "Refusing to restore: backup is inside a partial periodicity expand." >&2
        exit 1
        ;;
    partial-contract)
        echo "Refusing to restore: backup is inside a partial periodicity contract." >&2
        exit 1
        ;;
    missing-registry)
        echo "Refusing to restore: backup has no Sqitch registry state." >&2
        exit 1
        ;;
    *)
        echo "Refusing to restore: unexpected backup periodicity phase." >&2
        exit 1
        ;;
esac

archive_has_table_data() {
    local schema="$1"
    local table="$2"

    pg_restore --list "$DUMP_FILE" \
        | awk -v schema="$schema" -v table="$table" '
            $4 == "TABLE" && $5 == "DATA" \
                && $6 == schema && $7 == table { found = 1 }
            END { exit !found }
        '
}

# Both rows sets are durable domain/migration state in expand and contract.
# Without their TABLE DATA entries, the table-by-table restore would truncate
# valid target state and could otherwise treat a selective archive as empty.
if [ "$source_phase" != "legacy" ]; then
    if ! archive_has_table_data \
        migration indicateur_valeur_periodicite_audit; then
        echo "Refusing to restore: backup lacks periodicity audit data." >&2
        exit 1
    fi
    if ! archive_has_table_data \
        private indicateur_reconciliation_formule; then
        echo "Refusing to restore: backup lacks formula reconciliation data." >&2
        exit 1
    fi
fi

if [ "$source_phase" != "$target_phase" ]; then
    echo "Refusing to restore: periodicity phases differ" >&2
    echo "(backup: $source_phase, target: $target_phase)." >&2
    exit 1
fi

echo "Restore compatibility: source and target phase is $target_phase." >&2
printf '%s\n' "$target_phase"
