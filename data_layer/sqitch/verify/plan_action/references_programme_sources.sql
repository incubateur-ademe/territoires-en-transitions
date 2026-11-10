-- Verify tet:plan_action/references_programme_sources on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT count(*) = 8
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND is_nullable = 'YES'
            AND column_default IS NULL
            AND (
                (table_name = 'axe' AND column_name IN ('reference_programme', 'reference_code')
                    AND data_type = 'text')
                OR (table_name = 'axe' AND column_name = 'engagements_codes' AND udt_name = '_text')
                OR (table_name = 'axe' AND column_name = 'indicateur_source_metadonnee_id'
                    AND data_type = 'integer')
                OR (table_name = 'fiche_action' AND column_name IN ('reference_programme', 'reference_kind', 'reference_code', 'reference_parent_code')
                    AND data_type = 'text')
            )
    ), 'Les huit colonnes doivent être nullable, sans valeur par défaut et du type attendu';

    ASSERT (
        SELECT count(*) = 4 FROM pg_constraint
        WHERE contype = 'c' AND convalidated
            AND (
                (conrelid = 'public.axe'::regclass
                    AND conname IN ('axe_reference_check', 'axe_engagements_codes_check', 'axe_indicateur_source_root_check'))
                OR (conrelid = 'public.fiche_action'::regclass AND conname = 'fiche_action_reference_check')
            )
    ), 'Les contraintes des références et de la source réservée à la racine doivent être validées';

    ASSERT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.axe'::regclass
            AND conname = 'axe_indicateur_source_metadonnee_id_key' AND contype = 'u'
    ), 'Une métadonnée ne peut appartenir qu''à un plan';

    ASSERT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.axe'::regclass
            AND conname = 'axe_indicateur_source_metadonnee_id_fkey'
            AND confrelid = 'public.indicateur_source_metadonnee'::regclass
            AND contype = 'f' AND confdeltype = 'r' AND convalidated
    ), 'La métadonnée attachée au plan doit être protégée de la suppression';

    ASSERT (
        SELECT count(*) = 2 FROM pg_trigger
        WHERE NOT tgisinternal AND tgenabled = 'O' AND tgtype = 23
            AND tgfoid = 'private.protect_plan_reference_fields()'::regprocedure
            AND (
                (tgrelid = 'public.axe'::regclass AND tgname = 'axe_protect_reference_fields' AND tgnargs = 4)
                OR (tgrelid = 'public.fiche_action'::regclass AND tgname = 'fiche_action_protect_reference_fields' AND tgnargs = 4)
            )
    ), 'Les attributions publiques doivent être protégées à l''insertion et à la modification';

    ASSERT private.are_plan_reference_codes_valid(ARRAY[]::text[]),
        'Une sélection vide est valide';
    ASSERT NOT private.are_plan_reference_codes_valid(ARRAY['   ']::text[])
        AND NOT private.are_plan_reference_codes_valid(ARRAY[NULL]::text[]),
        'Une sélection ne peut contenir de code blanc ou NULL';
END;
$$;

ROLLBACK;
