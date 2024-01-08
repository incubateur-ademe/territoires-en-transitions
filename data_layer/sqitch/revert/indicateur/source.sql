-- Deploy tet:indicateur/source to pg

BEGIN;

drop policy allow_read on indicateur_source;
alter table indicateur_source disable row level security;

COMMIT;
