-- Revert tet:collectivite/bucket from pg

BEGIN;

drop function private.create_bucket(collectivite public.collectivite);
drop policy allow_update on storage.objects;
drop policy allow_insert on storage.objects;
drop policy allow_read on storage.objects;
drop table collectivite_bucket;

COMMIT;
