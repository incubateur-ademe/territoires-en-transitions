-- Deploy tet:utilisateur/preferences to pg

BEGIN;

alter table dcp
  add column preferences jsonb;

COMMIT;
