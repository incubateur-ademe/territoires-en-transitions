-- Revert tet:plan_action/fiche_action_levier from pg

BEGIN;

DROP TABLE IF EXISTS public.fiche_action_levier CASCADE;
DROP TYPE IF EXISTS public.levier_id;
DROP TYPE IF EXISTS public.levier_categorie;

COMMIT;
