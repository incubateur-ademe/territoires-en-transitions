-- Deploy tet:plan_action/fiches to pg

BEGIN;


alter table collectivite
  drop column dans_aire_urbaine;

drop table imports.unite_urbaine;

COMMIT;

