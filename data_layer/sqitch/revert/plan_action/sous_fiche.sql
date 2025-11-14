-- Revert tet:plan_action/sous_fiche from pg

BEGIN;

alter table fiche_action
  drop column if exists parent_id;

COMMIT;
