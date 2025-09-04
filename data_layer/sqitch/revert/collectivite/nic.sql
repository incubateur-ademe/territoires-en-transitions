-- Revert tet:collectivite/nic from pg

BEGIN;

alter table collectivite
  drop column nic cascade;

COMMIT;
