-- Verify tet:indicateur/periodicite_activation on pg
BEGIN;
DO $$
DECLARE
    table_name text;
    check_expression text;
    periodicite_code text;
    accepted boolean;
BEGIN
    ASSERT NOT EXISTS (SELECT FROM pg_attribute
        WHERE attrelid = 'public.indicateur_definition'::regclass
          AND attname IN ('aggregation_resultat', 'aggregation_objectif')
          AND NOT attisdropped
    ), 'La définition ne doit pas proposer de règles d’agrégation temporelle';
    ASSERT NOT EXISTS (SELECT FROM pg_constraint
        WHERE conrelid IN ('public.indicateur_definition'::regclass, 'public.indicateur_valeur'::regclass)
          AND conname IN ('indicateur_definition_schema_annuel', 'indicateur_valeur_schema_annuel')
    ), 'Les restrictions annuelles de préparation doivent être retirées';
    ASSERT NOT EXISTS (
        SELECT FROM (VALUES
            ('public.indicateur_definition'::regclass, 'empecher_changement_periodicite_indicateur'),
            ('public.indicateur_groupe'::regclass, 'verifier_periodicite_groupe_indicateur'),
            ('public.indicateur_valeur'::regclass, 'verifier_periodicite_valeur_indicateur')
        ) AS attendu(relation, nom)
        WHERE NOT EXISTS (
            SELECT FROM pg_trigger
            WHERE tgrelid = attendu.relation AND tgname = attendu.nom
              AND tgenabled = 'O' AND NOT tgisinternal
        )
    ), 'Les règles de cadence des définitions, groupes et valeurs doivent être actives';
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
