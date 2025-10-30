-- Revert tet:plan_action/soft_delete_fiche from pg

BEGIN;

alter table fiche_action
  drop column deleted;

COMMIT;
