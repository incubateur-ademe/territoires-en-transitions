BEGIN;
DO $$
BEGIN
    ASSERT to_regclass('migration.indicateur_valeur_periodicite_audit') IS NULL
       AND to_regclass('private.indicateur_valeur_write_acl') IS NULL,
        'Les tables temporaires de retour arrière doivent être retirées';
    ASSERT to_regprocedure('migration.assainir_audit_periodicite_indicateur()') IS NULL
       AND to_regprocedure('migration.verifier_retrait_periodicite_indicateur()') IS NULL
       AND to_regprocedure('migration.auditer_et_normaliser_dates_indicateur()') IS NULL
       AND to_regprocedure('migration.auditer_et_normaliser_date_indicateur_en_transition()') IS NULL,
        'Les fonctions temporaires de transition doivent être retirées';
    ASSERT NOT EXISTS (SELECT FROM pg_trigger
        WHERE tgrelid = 'public.indicateur_valeur'::regclass
          AND tgname IN ('assainir_audit_periodicite_indicateur', 'auditer_et_normaliser_date_indicateur_en_transition')),
        'Les écritures ne doivent plus maintenir un audit de transition';
    ASSERT to_regclass('private.indicateur_valeur_date_repair') IS NULL,
        'L archive temporaire doit disparaître après la reprise mensuelle';
    ASSERT NOT EXISTS (SELECT FROM pg_constraint
        WHERE conrelid IN ('public.indicateur_definition'::regclass, 'public.indicateur_valeur'::regclass)
          AND conname IN ('indicateur_definition_schema_annuel', 'indicateur_valeur_schema_annuel',
                         'indicateur_definition_annual_release', 'indicateur_aggregation_annual_release',
                         'indicateur_valeur_annual_release')),
        'Aucune restriction annuelle temporaire ne doit subsister';
END $$;
ROLLBACK;
