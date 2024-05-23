-- Deploy tet:plan_action/fiches to pg

BEGIN;

DROP FUNCTION public.fiche_action_service_tag(public.fiches_action);
DROP FUNCTION public.fiche_action_structure_tag(public.fiches_action);

COMMIT;
