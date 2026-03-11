-- Deploy tet:collectivite/preferences to pg

BEGIN;

alter table collectivite
  add column if not exists preferences jsonb not null default '{"referentiels":{"display":{"cae":true,"eci":true,"te":true}}}'::jsonb;

COMMIT;
