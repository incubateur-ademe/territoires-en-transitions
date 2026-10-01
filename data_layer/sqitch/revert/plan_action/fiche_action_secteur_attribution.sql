-- Revert tet:plan_action/fiche_action_secteur_attribution from pg

BEGIN;

DROP TABLE public.fiche_action_secteur_attribution;
DROP TYPE public.secteur_reglementaire;

COMMIT;
