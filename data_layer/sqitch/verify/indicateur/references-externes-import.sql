-- Verify tet:indicateur/references-externes-import on pg
BEGIN;

SELECT libelle_source, unite_import, type_import, cibles_import, annee_cible,
       valeur_min, valeur_max, plafond_cible, libelles_cible, unites_acceptees
FROM public.indicateur_reference_externe WHERE false;

DO $$
BEGIN
    ASSERT EXISTS (SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.indicateur_reference_externe'::regclass
        AND conname = 'indicateur_reference_externe_libelle_source_check');
    ASSERT EXISTS (SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.indicateur_reference_externe'::regclass
        AND conname = 'indicateur_reference_externe_unite_import_check');
END $$;

ROLLBACK;
