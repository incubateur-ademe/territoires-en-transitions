-- Deploy tet:indicateur/fusion to pg

BEGIN;

alter table public.indicateur_definition
  drop column if exists version;

COMMIT;
