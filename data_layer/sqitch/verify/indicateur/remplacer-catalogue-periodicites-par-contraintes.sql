-- Verify tet:indicateur/remplacer-catalogue-periodicites-par-contraintes on pg
BEGIN;
DO $$
DECLARE
    table_name text;
    check_expression text;
    periodicite_code text;
    accepted boolean;
    annual_contract boolean;
BEGIN
    ASSERT to_regclass('public.indicateur_periodicite') IS NULL,
        'Le catalogue SQL inutilisé doit être supprimé';
    ASSERT to_regprocedure('public.empecher_modification_periodicite()') IS NULL,
        'Le trigger propre au catalogue doit être supprimé';
    FOREACH table_name IN ARRAY ARRAY['indicateur_definition', 'indicateur_valeur'] LOOP
        SELECT pg_get_expr(conbin, conrelid) INTO STRICT check_expression
        FROM pg_constraint
        WHERE conrelid = format('public.%I', table_name)::regclass
          AND conname = table_name || '_periodicite_check'
          AND contype = 'c' AND convalidated;
        ASSERT NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid = format('public.%I', table_name)::regclass
              AND conname = table_name || '_periodicite_fkey'
        ), 'La clé étrangère doit être remplacée par un CHECK';
        -- L’activation élargit ce CHECK ; son revert restaure le contrat annuel.
        SELECT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid = format('public.%I', table_name)::regclass
              AND conname = table_name || '_schema_annuel'
        ) INTO annual_contract;
        FOREACH periodicite_code IN ARRAY ARRAY[
            'annuelle', 'semestrielle', 'trimestrielle', 'mensuelle',
            'hebdomadaire', 'quotidienne', ''
        ] LOOP
            EXECUTE format(
                'SELECT (%s) FROM (VALUES ($1::text)) AS input(periodicite)',
                check_expression
            ) INTO accepted USING periodicite_code;
            ASSERT accepted IS NOT DISTINCT FROM (
                periodicite_code = 'annuelle' OR (
                    NOT annual_contract AND periodicite_code IN (
                        'semestrielle', 'trimestrielle', 'mensuelle'
                    )
                )
            ), 'Le CHECK doit respecter le contrat annuel ou activé';
        END LOOP;
    END LOOP;
END $$;
ROLLBACK;
