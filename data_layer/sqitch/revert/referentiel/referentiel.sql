-- Deploy tet:referentiel/referentiel to pg

BEGIN;

alter table referentiel_definition
  drop column locked;

COMMIT;
