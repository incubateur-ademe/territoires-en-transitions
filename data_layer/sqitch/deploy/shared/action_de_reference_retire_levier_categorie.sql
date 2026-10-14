-- Deploy tet:shared/action_de_reference_retire_levier_categorie to pg
-- requires: shared/action_de_reference_leviers_categories

BEGIN;

DO
$$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM public.action_de_reference GROUP BY titre HAVING count(*) > 1
        ) THEN
            RAISE EXCEPTION 'action_de_reference : des titres sont dupliqués, l unicité sur titre est impossible';
        END IF;
    END
$$;

UPDATE public.action_de_reference
SET leviers = ARRAY[levier],
    categories = ARRAY[categorie]
WHERE cardinality(leviers) = 0 OR cardinality(categories) = 0;

ALTER TABLE public.action_de_reference
    DROP CONSTRAINT action_de_reference_unique,
    ADD CONSTRAINT action_de_reference_titre_unique UNIQUE (titre),
    ADD CONSTRAINT action_de_reference_leviers_categories_non_vides
        CHECK (cardinality(leviers) > 0 AND cardinality(categories) > 0),
    DROP COLUMN levier,
    DROP COLUMN categorie;

COMMIT;
