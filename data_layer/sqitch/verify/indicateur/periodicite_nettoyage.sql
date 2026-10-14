BEGIN;
DO $$
BEGIN
    ASSERT NOT EXISTS (SELECT FROM pg_attribute
        WHERE attrelid = 'public.indicateur_definition'::regclass
          AND attname IN ('aggregation_resultat', 'aggregation_objectif')
          AND NOT attisdropped
    ), 'Les colonnes inutilisées d’agrégation doivent être supprimées';
    ASSERT to_regclass('private.indicateur_valeur_date_repair') IS NULL,
        'L archive temporaire doit disparaître après la reprise mensuelle';
    ASSERT NOT EXISTS (SELECT FROM pg_constraint
        WHERE conrelid IN ('public.indicateur_definition'::regclass, 'public.indicateur_valeur'::regclass)
          AND conname IN ('indicateur_definition_schema_annuel', 'indicateur_valeur_schema_annuel')),
        'Aucune restriction annuelle temporaire ne doit subsister';
END $$;
ROLLBACK;
