-- Verify tet:collectivite/tableau_de_bord_module_plan_id on pg

BEGIN;

SELECT plan_id
FROM public.tableau_de_bord_module
WHERE false;

ROLLBACK;
