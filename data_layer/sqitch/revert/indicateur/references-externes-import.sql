-- Revert tet:indicateur/references-externes-import from pg
BEGIN;

ALTER TABLE public.indicateur_reference_externe
    DROP COLUMN libelle_source,
    DROP COLUMN unite_import,
    DROP COLUMN type_import,
    DROP COLUMN cibles_import,
    DROP COLUMN annee_cible,
    DROP COLUMN valeur_min,
    DROP COLUMN valeur_max,
    DROP COLUMN plafond_cible,
    DROP COLUMN libelles_cible,
    DROP COLUMN unites_acceptees;

COMMIT;
