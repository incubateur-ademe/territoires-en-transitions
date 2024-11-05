-- Deploy tet:plan_action to pg

BEGIN;

alter table fiche_action
  add column created_by uuid default auth.uid() references auth.users;

COMMIT;
