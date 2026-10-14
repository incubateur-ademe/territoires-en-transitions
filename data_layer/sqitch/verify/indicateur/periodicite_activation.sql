-- Verify tet:indicateur/periodicite_activation on pg
BEGIN;
DO $$
DECLARE
    table_name text;
    check_expression text;
    periodicite_code text;
    accepted boolean;
BEGIN
    -- #5296 supprime ces colonnes ; tant qu’elles existent, elles restent à NULL.
    IF EXISTS (SELECT FROM pg_attribute
        WHERE attrelid = 'public.indicateur_definition'::regclass
          AND attname IN ('aggregation_resultat', 'aggregation_objectif')
          AND NOT attisdropped
    ) THEN
        ASSERT EXISTS (SELECT FROM pg_constraint
            WHERE conrelid = 'public.indicateur_definition'::regclass
              AND conname = 'indicateur_definition_sans_aggregation'
              AND contype = 'c' AND convalidated
        ), 'Les colonnes d’agrégation conservées doivent rester désactivées';
    END IF;
    ASSERT NOT EXISTS (SELECT FROM pg_constraint
        WHERE conrelid IN ('public.indicateur_definition'::regclass, 'public.indicateur_valeur'::regclass)
          AND conname IN ('indicateur_definition_schema_annuel', 'indicateur_valeur_schema_annuel')
    ), 'Les restrictions annuelles de préparation doivent être retirées';
    FOREACH table_name IN ARRAY ARRAY['indicateur_definition', 'indicateur_valeur'] LOOP
        SELECT pg_get_expr(conbin, conrelid) INTO STRICT check_expression
        FROM pg_constraint
        WHERE conrelid = format('public.%I', table_name)::regclass
          AND conname = table_name || '_periodicite_check'
          AND contype = 'c' AND convalidated;
        FOREACH periodicite_code IN ARRAY ARRAY[
            'annuelle', 'semestrielle', 'trimestrielle', 'mensuelle', 'hebdomadaire', ''
        ] LOOP
            EXECUTE format(
                'SELECT (%s) FROM (VALUES ($1::text)) AS input(periodicite)',
                check_expression
            ) INTO accepted USING periodicite_code;
            ASSERT accepted IS NOT DISTINCT FROM (periodicite_code IN (
                'annuelle', 'semestrielle', 'trimestrielle', 'mensuelle'
            )), 'L’activation doit ouvrir exactement les quatre cadences';
        END LOOP;
    END LOOP;
END $$;
ROLLBACK;
