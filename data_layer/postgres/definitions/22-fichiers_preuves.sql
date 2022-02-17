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


-- Set policies on buckets
create policy allow_read
    on storage.objects for select
    using (is_authenticated());

create policy allow_insert
    on storage.objects for insert
    with check (is_bucket_writer(bucket_id));

create policy au
    on storage.objects for update
    with check (is_bucket_writer(bucket_id));


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
    commentaire text not null default ''
);
alter table fichier_preuve_commentaire
    enable row level security;

create policy allow_read
    on fichier_preuve_commentaire for select
    using (is_authenticated());

create policy allow_insert
    on fichier_preuve_commentaire for insert
    with check (is_bucket_writer(
        (select o.bucket_id
         from storage.objects o
         where o.id = fichier_preuve_commentaire.file_id
        )));

create policy allow_update
    on fichier_preuve_commentaire for update
    using (is_bucket_writer(
        (select o.bucket_id
         from storage.objects o
         where o.id = fichier_preuve_commentaire.file_id
        )));


-- Convenience upsert function so the client does not have to know about object ids
create or replace function upsert_fichier_preuve_commentaire(
    collectivite_id integer,
    action_id action_id,
    filename text,
    commentaire text
)
returns void
as
$$
with file as (
    select obj.id
    from storage.objects obj
             join collectivite_bucket cb on obj.bucket_id = cb.bucket_id
    where cb.collectivite_id = upsert_fichier_preuve_commentaire.collectivite_id
      and obj.path_tokens[1] = action_id::text
      and obj.path_tokens[2] = filename
)
insert into fichier_preuve_commentaire
select file.id, upsert_fichier_preuve_commentaire.commentaire
    from file
    on conflict (file_id) do update set commentaire = upsert_fichier_preuve_commentaire.commentaire;
$$ language sql;
comment on function upsert_fichier_preuve_commentaire is 'Upsert a commentaire on a preuve file';


-- Client view
create view fichier_preuve
as
select c.id                                           as collectivite_id,
       cb.bucket_id                                   as bucket_id,
       a.id                                           as action_id,
       obj.name                                       as filename,
       cb.bucket_id || '/' || obj.name as path,
       coalesce(fc.commentaire, '')                   as commentaire
from collectivite c
         join collectivite_bucket cb on c.id = cb.collectivite_id
         join lateral (select id, name, path_tokens
                       from storage.objects o
                       where o.bucket_id = cb.bucket_id) as obj on true
         join action_relation a on a.id = obj.path_tokens[1]
         left join fichier_preuve_commentaire fc on fc.file_id = obj.id;



