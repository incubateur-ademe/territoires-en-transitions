-- Deploy tet:plan_action to pg

BEGIN;

alter table fiche_action
  drop column created_by;
COMMIT;
