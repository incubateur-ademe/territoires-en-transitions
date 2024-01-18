-- Deploy tet:collectivite/bucket to pg
-- requires: collectivite/collectivite
-- requires: utilisateur/droits

BEGIN;

create table if not exists collectivite_bucket
(
    collectivite_id integer references collectivite,
    bucket_id       text references storage.buckets,
    primary key (collectivite_id, bucket_id)
);
comment on table collectivite_bucket
    is 'Collectivité to bucket relationship';

alter table collectivite_bucket
    enable row level security;

create policy allow_read
    on collectivite_bucket
    using (true);

create policy allow_read
    on storage.objects for select
    using (is_authenticated());

create or replace function
    is_bucket_writer(id text)
    returns boolean
as
$$
select count(*) > 0
from collectivite_bucket cb
where is_any_role_on(cb.collectivite_id)
  and cb.bucket_id = is_bucket_writer.id
$$ language sql;
comment on function is_bucket_writer is
    'Returns true if current user can write on a bucket id';

create policy allow_insert
    on storage.objects for insert
    with check (is_bucket_writer(bucket_id));

create policy allow_update
    on storage.objects for update
    with check (is_bucket_writer(bucket_id));

create function private.create_bucket(collectivite public.collectivite) returns void
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
