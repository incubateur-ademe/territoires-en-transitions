-- Deploy tet:plan_action/fiche_action_volet_ges_created_by_nullable to pg
-- requires: plan_action/classification_volets

BEGIN;

alter table fiche_action_volet_ges
  alter column created_by drop not null;

COMMIT;
