-- Deploy tet:shared/action_de_reference_retire_levier_categorie to pg
-- requires: shared/action_de_reference_leviers_categories

BEGIN;

ALTER TABLE public.action_de_reference
    DROP CONSTRAINT action_de_reference_unique,
    ADD CONSTRAINT action_de_reference_titre_unique UNIQUE (titre),
    DROP COLUMN levier,
    DROP COLUMN categorie;

COMMIT;
