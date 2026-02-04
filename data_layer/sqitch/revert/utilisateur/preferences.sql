-- Revert tet:utilisateur/preferences from pg

BEGIN;

alter table dcp
  drop column preferences;

COMMIT;
