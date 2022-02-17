-- Create collectivité bucket  relation table.
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


-- Create file action relation table.
create table if not exists preuve
(
    collectivite_id integer references collectivite      not null,
    action_id       action_id references action_relation not null,
    file_id         uuid references storage.objects      not null,
    commentaire     text                                 not null default '',
    primary key (collectivite_id, action_id, file_id)
);
alter table preuve
    enable row level security;
create policy allow_read
    on preuve for select
    using (is_authenticated());
create policy allow_insert
    on preuve for insert
    with check (is_bucket_writer(
        (select o.bucket_id
         from storage.objects o
         where o.id = preuve.file_id
        )));
create policy allow_update
    on preuve for update
    using (is_bucket_writer(
        (select o.bucket_id
         from storage.objects o
         where o.id = preuve.file_id
        )));


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



-- Convenience upsert function so the client does not have to know about object ids
create or replace function upsert_preuve(
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
    where cb.collectivite_id = upsert_preuve.collectivite_id
      and obj.name = filename
)
insert
into preuve(collectivite_id, action_id, file_id, commentaire)
select collectivite_id, action_id, file.id, upsert_preuve.commentaire
from file
on conflict (collectivite_id, action_id, file_id) do update set commentaire = upsert_preuve.commentaire;
$$ language sql;
comment on function upsert_preuve is 'Upsert a commentaire on a preuve file';


-- Client view
create view fichier_preuve
as
select c.id                            as collectivite_id,
       cb.bucket_id                    as bucket_id,
       p.action_id                     as action_id,
       obj.name                        as filename,
       cb.bucket_id || '/' || obj.name as path,
       coalesce(p.commentaire, '')     as commentaire
from collectivite c
         join collectivite_bucket cb on c.id = cb.collectivite_id
         join lateral (select id, name, path_tokens
                       from storage.objects o
                       where o.bucket_id = cb.bucket_id) as obj on true
         left join preuve p on p.file_id = obj.id;


-- Handle file deletion.
create or replace function remove_preuve()
    returns trigger
as
$$
begin
    delete
    from preuve
    where file_id = old.id;
    return old;
end
$$ language plpgsql security definer;

create trigger remove_preuve_before_file_delete
    before delete
    on storage.objects
    for each row
execute procedure remove_preuve();




