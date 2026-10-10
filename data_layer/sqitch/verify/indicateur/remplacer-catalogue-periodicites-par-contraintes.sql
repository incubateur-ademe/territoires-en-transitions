-- Verify tet:indicateur/remplacer-catalogue-periodicites-par-contraintes on pg
BEGIN;
DO $$
DECLARE
    table_name text;
    check_expression text;
    periodicite_code text;
    accepted boolean;
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
        -- Vérifie le contrat de la contrainte réellement installée, indépendamment
        -- du garde-fou annuel hérité du schéma préparatoire.
        FOREACH periodicite_code IN ARRAY ARRAY[
            'annuelle', 'semestrielle', 'trimestrielle', 'mensuelle',
            'hebdomadaire', 'quotidienne', ''
        ] LOOP
            EXECUTE format(
                'SELECT (%s) FROM (VALUES ($1::text)) AS input(periodicite)',
                check_expression
            ) INTO accepted USING periodicite_code;
            ASSERT accepted IS NOT DISTINCT FROM (periodicite_code = 'annuelle'),
                'Le CHECK doit accepter uniquement la périodicité annuelle';
        END LOOP;
    END LOOP;
END $$;
ROLLBACK;
