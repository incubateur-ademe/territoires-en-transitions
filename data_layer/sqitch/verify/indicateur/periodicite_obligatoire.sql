-- Verify tet:indicateur/periodicite_obligatoire on pg
BEGIN;
DO $$
BEGIN
    ASSERT (SELECT attnotnull FROM pg_attribute
            WHERE attrelid='public.indicateur_definition'::regclass AND attname='periodicite'),
        'La cadence reste obligatoire après retrait de la restriction annuelle';
    ASSERT to_regclass('public.unique_indicateur_valeur_utilisateur') IS NULL
       AND to_regclass('public.unique_indicateur_valeur_importee') IS NULL,
        'Les anciens index ne doivent plus fusionner des séries de cadences différentes';
    ASSERT to_regclass('public.unique_indicateur_valeur_utilisateur_periode') IS NOT NULL
       AND to_regclass('public.unique_indicateur_valeur_importee_periode') IS NOT NULL,
        'Les upserts doivent conserver leurs index par cadence';
END $$;
ROLLBACK;
