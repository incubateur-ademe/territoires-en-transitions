
BEGIN;

create or replace function private.create_bucket(collectivite public.collectivite) returns void
as
$$
declare
    preexists bool;
    bucket_id text;
begin
    -- check if bucket already exists
    select into bucket_id id
    from storage.buckets
    where name = 'Preuves de la collectivite: ' || collectivite.id
    limit 1;

    if bucket_id is not null
    then
        -- be sure that the relationship exists
        insert into collectivite_bucket
        values (collectivite.id, bucket_id) on conflict do nothing;

        raise notice 'bucket already exist for collectivite (%): %', collectivite.id, bucket_id;
       
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
