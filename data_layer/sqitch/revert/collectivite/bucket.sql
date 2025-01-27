
BEGIN;

create or replace function private.create_bucket(collectivite public.collectivite) returns void
as
$$
declare
    preexists bool;
    bucket_id text;
begin
    -- check if bucket already exists
    select into preexists count(*) > 0
    from storage.buckets
             join collectivite_bucket cb on buckets.id = cb.bucket_id
    where collectivite_id = collectivite.id;

    if preexists
    then
        raise notice 'bucket already exist for collectivite (%)', collectivite.id;
    else
        -- generate id
        select gen_random_uuid()::text into bucket_id;

        -- create the bucket
        insert into storage.buckets
        values (bucket_id, 'Preuves de la collectivite: ' || collectivite.id, null);

        -- save the relationship
        insert into collectivite_bucket
        values (collectivite.id, bucket_id);
    end if;
end
$$ language plpgsql;

COMMIT;
