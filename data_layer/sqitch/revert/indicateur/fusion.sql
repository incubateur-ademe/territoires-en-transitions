-- Deploy tet:indicateur/fusion to pg

BEGIN;

drop table if exists public.indicateur_source_source_calcul;

alter table public.indicateur_definition
  drop column if exists version;

COMMIT;
