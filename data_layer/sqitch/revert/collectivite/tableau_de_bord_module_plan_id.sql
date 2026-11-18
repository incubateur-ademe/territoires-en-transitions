-- Revert tet:collectivite/tableau_de_bord_module_plan_id from pg

BEGIN;

DELETE FROM public.tableau_de_bord_module
WHERE plan_id IS NOT NULL;

ALTER TABLE public.tableau_de_bord_module
    DROP COLUMN plan_id;

COMMIT;
