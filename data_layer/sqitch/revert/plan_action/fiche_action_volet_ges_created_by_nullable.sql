-- Revert tet:plan_action/fiche_action_volet_ges_created_by_nullable from pg

BEGIN;

alter table fiche_action_volet_ges
  alter column created_by set not null;

COMMIT;
