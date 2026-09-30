-- Deploy tet:plan_action/drop_fiche_action_volet_ges_created_by to pg
-- requires: plan_action/fiche_action_volet_ges_created_by_nullable

BEGIN;

alter table public.fiche_action_volet_ges
  drop column created_by;

COMMIT;
