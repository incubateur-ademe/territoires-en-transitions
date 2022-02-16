-- Create relation table.
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

-- Can the user write in the bucket ?
create or replace function
    is_bucket_writer(id integer)
    returns boolean
as
$$
select count(*) > 0
from collectivite_bucket cb
         join private_utilisateur_droit d on d.collectivite_id = cb.collectivite_id
where cb.bucket_id = is_bucket_writer.id
  and d.user_id = auth.uid()
  and d.active
$$ language sql;
comment on function is_bucket_writer is
    'Returns true if current user can write on a bucket id';


-- Set policies on buckets
create policy allow_read
    on storage.objects for select
    using (is_authenticated());

create policy allow_insert
    on storage.objects for insert
    with check (is_bucket_writer(id));

create policy au
    on storage.objects for update
    with check (is_bucket_writer(id));


-- Create bucket for collectivités
create schema if not exists private;
create or replace
    function private.create_bucket(collectivite public.collectivite)
    returns void
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

-- Create and register the trigger
create or replace
    function after_collectivite_insert_create_bucket()
    returns trigger
as
$$
begin
    perform private.create_bucket(new);
    return null; -- result is ignored since this is an after trigger
end;
$$ language plpgsql;
create trigger after_collectivite_write
    after insert
    on collectivite
    for each row
execute procedure after_collectivite_insert_create_bucket();


-- Create bucket for each collectivité.
select id
from collectivite c
         join lateral ( select private.create_bucket(c) ) cb on true;


-- File comments
create table if not exists fichier_preuve_commentaire
(
    file_id     uuid references storage.objects primary key,
    bucket_id   text references storage.buckets not null,
    commentaire text                            not null default ''
);
alter table fichier_preuve_commentaire
    enable row level security;

create policy allow_read
    on fichier_preuve_commentaire for select
    using (is_authenticated());

create policy allow_insert
    on fichier_preuve_commentaire for insert
    with check (is_bucket_writer(bucket_id)
    -- sanity check
    and exists(select *
               from storage.objects o
               where o.bucket_id = bucket_id
                 and o.id = fichier_preuve_commentaire.file_id));

create policy allow_update
    on fichier_preuve_commentaire for update
    -- sanity check
    with check (is_bucket_writer(bucket_id)
    and exists(select *
               from storage.objects o
               where o.bucket_id = bucket_id
                 and o.id = fichier_preuve_commentaire.file_id));


-- Client view
create view fichier_preuve
as
select c.id                         as collectivite_id,
       cb.bucket_id                 as bucket_id,
       obj.name                     as file,
       obj.id                       as file_id,
       a.id                         as action_id,
       coalesce(fc.commentaire, '') as commentaire
from collectivite c
         join collectivite_bucket cb on c.id = cb.collectivite_id
         join lateral (select id, name, path_tokens
                       from storage.objects o
                       where o.bucket_id = cb.bucket_id) as obj on true
         join action_relation a on a.id = obj.path_tokens[1]
         left join fichier_preuve_commentaire fc on fc.file_id = obj.id;
