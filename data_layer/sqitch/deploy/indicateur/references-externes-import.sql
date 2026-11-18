-- Deploy tet:indicateur/references-externes-import to pg
-- requires: indicateur/references-externes
BEGIN;

ALTER TABLE public.indicateur_reference_externe
    ADD COLUMN libelle_source text,
    ADD COLUMN unite_import text,
    ADD COLUMN type_import text CHECK (type_import IN ('action', 'cibles')),
    ADD COLUMN cibles_import text,
    ADD COLUMN annee_cible integer CHECK (annee_cible BETWEEN 1000 AND 9999),
    ADD COLUMN valeur_min double precision,
    ADD COLUMN valeur_max double precision,
    ADD COLUMN plafond_cible text,
    ADD COLUMN libelles_cible text,
    ADD COLUMN unites_acceptees text,
    ADD CONSTRAINT indicateur_reference_externe_bornes_import_check CHECK (valeur_min <= valeur_max),
    ADD CONSTRAINT indicateur_reference_externe_libelle_source_check
        CHECK (libelle_source IS NULL OR (libelle_source <> '' AND libelle_source = btrim(libelle_source))),
    ADD CONSTRAINT indicateur_reference_externe_unite_import_check
        CHECK (unite_import IS NULL OR (unite_import <> '' AND unite_import = btrim(unite_import)));

COMMENT ON COLUMN public.indicateur_reference_externe.libelle_source
    IS 'Libellé de l''engagement ou de la cible dans la source externe, publié depuis Sheets.';
COMMENT ON COLUMN public.indicateur_reference_externe.unite_import
    IS 'Unité attendue dans le document, sans conversion numérique. Obligatoire pour les cibles du format d''engagements 2.';

COMMIT;
