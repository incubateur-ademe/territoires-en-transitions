-- Revert tet:shared/action_de_reference_retire_levier_categorie from pg

BEGIN;

ALTER TABLE public.action_de_reference
    DROP CONSTRAINT action_de_reference_leviers_categories_non_vides;

ALTER TABLE public.action_de_reference
    ADD COLUMN levier public.levier_ges_id,
    ADD COLUMN categorie public.volet_categorie;

UPDATE public.action_de_reference
SET levier = leviers[1],
    categorie = categories[1];

ALTER TABLE public.action_de_reference
    ALTER COLUMN levier SET NOT NULL,
    ALTER COLUMN categorie SET NOT NULL,
    DROP CONSTRAINT action_de_reference_titre_unique,
    ADD CONSTRAINT action_de_reference_unique UNIQUE (levier, categorie, titre);

COMMIT;
