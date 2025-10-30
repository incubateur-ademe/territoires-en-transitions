-- Deploy tet:plan_action/soft_delete_fiche to pg

BEGIN;

alter table fiche_action
  add column deleted boolean default false;

COMMIT;
