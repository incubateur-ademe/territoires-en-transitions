BEGIN;
DO $$
BEGIN
    ASSERT NOT EXISTS (SELECT FROM pg_constraint
        WHERE conrelid IN ('public.indicateur_definition'::regclass, 'public.indicateur_valeur'::regclass)
          AND conname IN ('indicateur_definition_annual_release', 'indicateur_aggregation_annual_release', 'indicateur_valeur_annual_release')
    ), 'Les contraintes temporaires annuelles doivent être retirées';
END $$;
ROLLBACK;
