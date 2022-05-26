create table labellisation_preuve_fichier
(
    collectivite_id integer references collectivite          not null,
    demande_id      integer references labellisation.demande not null,
    file_id         uuid references storage.objects          not null,
    commentaire     text                                     not null default '',
    primary key (collectivite_id, demande_id, file_id)
);
comment on table labellisation_preuve_fichier is
    'Lie un fichier à une demande de labellisation d''une collectivité. '
        'On peut lier plusieurs fichiers à une demande.';

alter table labellisation_preuve_fichier
    enable row level security;

create policy allow_read
    on labellisation_preuve_fichier for select
    using (is_authenticated());

create policy allow_insert
    on labellisation_preuve_fichier for insert
    with check (is_bucket_writer(
        (select o.bucket_id
         from storage.objects o
         where o.id = labellisation_preuve_fichier.file_id)));

create policy allow_update
    on labellisation_preuve_fichier for update
    using (is_bucket_writer(
        (select o.bucket_id
         from storage.objects o
         where o.id = labellisation_preuve_fichier.file_id)));

create policy allow_delete
    on labellisation_preuve_fichier for delete
    using (is_bucket_writer(
        (select o.bucket_id
         from storage.objects o
         where o.id = labellisation_preuve_fichier.file_id)));



create or replace function upsert_labellisation_preuve_fichier(
    collectivite_id integer,
    demande_id integer,
    filename text,
    commentaire text
)
    returns void
as
$$
with file as (select obj.id
              from storage.objects obj
                       join collectivite_bucket cb on obj.bucket_id = cb.bucket_id
              where cb.collectivite_id = upsert_labellisation_preuve_fichier.collectivite_id
                and obj.name = filename)
insert
into labellisation_preuve_fichier(collectivite_id, demande_id, file_id, commentaire)
select collectivite_id, demande_id, file.id, upsert_labellisation_preuve_fichier.commentaire
from file
on conflict (collectivite_id, demande_id, file_id) do update set commentaire = upsert_labellisation_preuve_fichier.commentaire;
$$ language sql;
comment on function upsert_labellisation_preuve_fichier is
    'Upsert une preuve de demande de labellisation.';

create or replace function delete_labellisation_preuve_fichier(
    collectivite_id integer,
    demande_id integer,
    filename text
)
    returns void
as
$$
with file as (select obj.id
              from storage.objects obj
                       join collectivite_bucket cb on obj.bucket_id = cb.bucket_id
              where cb.collectivite_id = delete_labellisation_preuve_fichier.collectivite_id
                and obj.name = filename)
delete
from labellisation_preuve_fichier
where labellisation_preuve_fichier.collectivite_id = delete_labellisation_preuve_fichier.collectivite_id
  and labellisation_preuve_fichier.demande_id = delete_labellisation_preuve_fichier.demande_id
  and labellisation_preuve_fichier.file_id in (select id from file);
$$ language sql;
comment on function delete_labellisation_preuve_fichier is
    'Supprime une preuve de demande de labellisation.';


create view action_labellisation_preuve_fichier
as
select c.id                            as collectivite_id,
       cb.bucket_id                    as bucket_id,
       p.demande_id                    as demande_id,
       obj.name                        as filename,
       cb.bucket_id || '/' || obj.name as path,
       coalesce(p.commentaire, '')     as commentaire
from collectivite c
         join collectivite_bucket cb on c.id = cb.collectivite_id
         join lateral (select id, name, path_tokens
                       from storage.objects o
                       where o.bucket_id = cb.bucket_id) as obj on true
         left join labellisation_preuve_fichier p on p.file_id = obj.id;
comment on view action_labellisation_preuve_fichier is
    'Fichier preuve par demande de labellisation par collectivité.';


-- Handle file deletion.
create or replace function remove_labellisation_preuve_fichier()
    returns trigger
as
$$
begin
    delete
    from labellisation_preuve_fichier
    where file_id = old.id;
    return old;
end
$$ language plpgsql security definer;

create trigger remove_labellisation_preuve_fichier_before_file_delete
    before delete
    on storage.objects
    for each row
execute procedure remove_labellisation_preuve_fichier();


create or replace function
    labellisation.critere_fichier(collectivite_id integer)
    returns table
            (
                referentiel   referentiel,
                preuve_nombre integer,
                atteint       bool
            )
as
$$
with ref as (select unnest(enum_range(null::referentiel)) as referentiel)
select r.referentiel,
       count(lpf.file_id),
       count(lpf.file_id) > 0
from ref r
         left join lateral (select *
                            from labellisation.demande ld
                            where ld.referentiel = r.referentiel
                              and ld.collectivite_id = critere_fichier.collectivite_id) ld on true
         left join labellisation_preuve_fichier lpf on ld.id = lpf.demande_id
group by r.referentiel;
$$ language sql;
comment on function labellisation.critere_fichier is
    'Renvoie le critère fichier preuve pour une collectivité donnée.';
