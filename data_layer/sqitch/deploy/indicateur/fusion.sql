-- Deploy tet:indicateur/fusion to pg

BEGIN;

alter table public.indicateur_definition
  add column if not exists version varchar(16) not null default '1.0.0';

COMMIT;
