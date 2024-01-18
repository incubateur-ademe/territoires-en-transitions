-- Verify tet:collectivite/bucket on pg

BEGIN;

select collectivite_id, bucket_id
from collectivite_bucket
where false;

comment on policy allow_update on storage.objects is '';
comment on policy allow_insert on storage.objects is '';
comment on policy allow_read on storage.objects is '';

ROLLBACK;
