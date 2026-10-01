BEGIN;
DO $$
BEGIN
    -- A later activation migration deliberately removes these checks.
    IF NOT EXISTS (SELECT FROM sqitch.changes WHERE project = 'tet' AND change = 'indicateur/periodicite_activation') THEN
        ASSERT (SELECT count(*) = 3 FROM pg_constraint
            WHERE conname IN ('indicateur_definition_annual_release',
                              'indicateur_aggregation_annual_release',
                              'indicateur_valeur_annual_release')
              AND conrelid IN ('public.indicateur_definition'::regclass, 'public.indicateur_valeur'::regclass)
              AND convalidated), 'Les contraintes de la livraison annuelle sont requises';
    END IF;
END $$;
ROLLBACK;
