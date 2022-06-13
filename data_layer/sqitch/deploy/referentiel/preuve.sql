-- Deploy tet:referentiel/preuve to pg
-- requires: collectivite/bucket
-- requires: utilisateur/droits

BEGIN;

-- Create file action relation table.
create table preuve_fichier
(
    collectivite_id integer references collectivite      not null,
    action_id       action_id references action_relation not null,
    file_id         uuid references storage.objects      not null,
    commentaire     text                                 not null default '',
    primary key (collectivite_id, action_id, file_id)
);
comment on table preuve_fichier is
    'A preuve fichier links a file from storage to an action for a collectivité.';
alter table preuve_fichier
    enable row level security;

create policy allow_read
    on preuve_fichier for select
    using (is_authenticated());

create policy allow_insert
    on preuve_fichier for insert
    with check (is_bucket_writer(
        (select o.bucket_id
         from storage.objects o
         where o.id = preuve_fichier.file_id)));

create policy allow_update
    on preuve_fichier for update
    using (is_bucket_writer(
        (select o.bucket_id
         from storage.objects o
         where o.id = preuve_fichier.file_id)));

create policy allow_delete
    on preuve_fichier for delete
    using (is_bucket_writer(
        (select o.bucket_id
         from storage.objects o
         where o.id = preuve_fichier.file_id)));


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


-- Convenience upsert functions so the client does not have to know about object ids
create or replace function upsert_preuve_fichier(
    collectivite_id integer,
    action_id action_id,
    filename text,
    commentaire text
)
    returns void
as
$$
with file as (select obj.id
              from storage.objects obj
                       join collectivite_bucket cb on obj.bucket_id = cb.bucket_id
              where cb.collectivite_id = upsert_preuve_fichier.collectivite_id
                and obj.name = filename)
insert
into preuve_fichier(collectivite_id, action_id, file_id, commentaire)
select collectivite_id, action_id, file.id, upsert_preuve_fichier.commentaire
from file
on conflict (collectivite_id, action_id, file_id) do update set commentaire = upsert_preuve_fichier.commentaire;
$$ language sql;
comment on function upsert_preuve_fichier is 'Upsert a preuve';

create or replace function delete_preuve_fichier(
    collectivite_id integer,
    action_id action_id,
    filename text
)
    returns void
as
$$
with file as (select obj.id
              from storage.objects obj
                       join collectivite_bucket cb on obj.bucket_id = cb.bucket_id
              where cb.collectivite_id = delete_preuve_fichier.collectivite_id
                and obj.name = filename)
delete
from preuve_fichier
where preuve_fichier.collectivite_id = delete_preuve_fichier.collectivite_id
  and preuve_fichier.action_id = delete_preuve_fichier.action_id
  and preuve_fichier.file_id in (select id from file);
$$ language sql;
comment on function delete_preuve_fichier is 'Delete a preuve';


-- Client view
create view action_preuve_fichier
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
         left join preuve_fichier p on p.file_id = obj.id;


-- Handle file deletion.
create or replace function remove_preuve_fichier()
    returns trigger
as
$$
begin
    delete
    from preuve_fichier
    where file_id = old.id;
    return old;
end
$$ language plpgsql security definer;

create trigger remove_preuve_fichier_before_file_delete
    before delete
    on storage.objects
    for each row
execute procedure remove_preuve_fichier();

create table preuve_lien
(
    id              serial primary key,
    collectivite_id integer references collectivite,
    action_id       action_id references action_relation,
    url             text            not null,
    titre           text            not null,
    commentaire     text default '' not null
);
comment on table preuve_lien is 'A preuve lien links an url to an action of a collectivité.';

create policy allow_read
    on preuve_lien for select
    using (is_authenticated());

create policy allow_insert
    on preuve_lien for insert
    with check (is_any_role_on(collectivite_id));

create policy allow_update
    on preuve_lien for update
    using (is_any_role_on(collectivite_id));

create policy allow_delete
    on preuve_lien for delete
    using (is_any_role_on(collectivite_id));


create or replace view preuve
as
select 'fichier' as type,
       null      as id,
       f.action_id,
       f.collectivite_id,
       f.commentaire,
       f.filename,
       f.bucket_id,
       f.path,
       null      as url,
       null      as titre
from action_preuve_fichier f
union
select 'lien' as type,
       l.id,
       l.action_id,
       l.collectivite_id,
       l.commentaire,
       null   as filename,
       null   as bucket_id,
       null   as path,
       l.url,
       l.titre
from preuve_lien l;
comment on view preuve is
    'List both preuve fichier and preuve lien';

COMMIT;
