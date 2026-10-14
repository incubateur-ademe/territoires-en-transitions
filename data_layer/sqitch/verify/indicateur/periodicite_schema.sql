-- Verify tet:indicateur/periodicite_schema on pg
BEGIN;
DO $$
BEGIN
    ASSERT (SELECT count(*) = 2 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name IN ('indicateur_definition', 'indicateur_valeur')
              AND column_name = 'periodicite' AND column_default = '''annuelle''::text'),
        'Les producteurs historiques doivent conserver le défaut annuel';
    IF to_regclass('public.indicateur_periodicite') IS NOT NULL THEN
        ASSERT (SELECT count(*) = 4 FROM public.indicateur_periodicite),
            'Les quatre politiques doivent être présentes';
        ASSERT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.indicateur_periodicite'::regclass
                       AND tgname = 'empecher_modification_periodicite' AND tgenabled = 'O'),
            'Le catalogue doit être immuable';
        ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.indicateur_periodicite'::regclass),
            'Le catalogue doit être protégé par RLS';
    ELSE
        -- La livraison annuelle remplace le catalogue par deux CHECK.
        ASSERT (SELECT count(*) = 2 FROM pg_constraint
                WHERE contype = 'c' AND convalidated
                  AND ((conrelid = 'public.indicateur_definition'::regclass
                        AND conname = 'indicateur_definition_periodicite_check')
                    OR (conrelid = 'public.indicateur_valeur'::regclass
                        AND conname = 'indicateur_valeur_periodicite_check'))),
            'Le schéma ultérieur doit conserver les restrictions de périodicité';
    END IF;
    ASSERT to_regclass('public.unique_indicateur_valeur_utilisateur_periode') IS NOT NULL
       AND to_regclass('public.unique_indicateur_valeur_importee_periode') IS NOT NULL,
        'Les nouveaux index doivent être présents';
    -- periodicite_obligatoire retire les anciens index et rend la cadence NOT NULL.
    IF NOT (SELECT attnotnull FROM pg_attribute
            WHERE attrelid = 'public.indicateur_definition'::regclass
              AND attname = 'periodicite') THEN
        ASSERT to_regclass('public.unique_indicateur_valeur_utilisateur') IS NOT NULL
           AND to_regclass('public.unique_indicateur_valeur_importee') IS NOT NULL,
            'Les anciens upserts doivent conserver leurs index';
        ASSERT (SELECT count(*) = 2 FROM pg_constraint
                WHERE (conrelid = 'public.indicateur_definition'::regclass
                       AND conname = 'indicateur_definition_schema_annuel')
                   OR (conrelid = 'public.indicateur_valeur'::regclass
                       AND conname = 'indicateur_valeur_schema_annuel')),
            'La préparation doit rester annuelle';
    END IF;
END $$;
ROLLBACK;
