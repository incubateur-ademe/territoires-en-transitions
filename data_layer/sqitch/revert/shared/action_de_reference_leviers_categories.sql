-- Revert tet:shared/action_de_reference_leviers_categories from pg

BEGIN;

ALTER TABLE public.action_de_reference
    DROP COLUMN categories,
    DROP COLUMN leviers;

COMMIT;
