-- Deploy tet:indicateur/source to pg

BEGIN;

alter table indicateur_source enable row level security;
create policy allow_read on indicateur_source for select using (is_authenticated());

COMMIT;
