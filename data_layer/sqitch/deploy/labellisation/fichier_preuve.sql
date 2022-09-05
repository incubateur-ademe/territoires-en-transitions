-- Deploy tet:labellisation/fichier_preuve to pg
-- requires: labellisation/labellisation
-- requires: collectivite/bucket

BEGIN;

-- on enlève `referentiel/preuve` qui est emmêlé avec la présente `labellisation/fichier_preuve`
drop view if exists retool_score; -- depends on preuve.
drop view preuve;
drop function upsert_preuve_fichier;
drop function delete_preuve_fichier;

-- partially remove previous version
drop function upsert_labellisation_preuve_fichier;
drop function delete_labellisation_preuve_fichier;
drop view action_preuve_fichier;
drop trigger remove_preuve_fichier_before_file_delete on storage.objects;
drop view action_labellisation_preuve_fichier;
drop trigger remove_labellisation_preuve_fichier_before_file_delete on storage.objects;
drop function remove_labellisation_preuve_fichier;

-- todo : enlever le contenu une fois la migration résolue.
--- drop table labellisation_preuve_fichier; -- labellisation
--- drop table preuve_lien;                  -- referentiel
--- drop table preuve_fichier;               -- referentiel


create table labellisation.bibliotheque_fichier
(
    id              serial primary key,
    collectivite_id integer references collectivite,
    hash            varchar(64), -- sha 256 calculé par le client et utilisé comme filename dans storage
    filename        text,        -- le nom d'origine du fichier chez l'utilisateur
    unique (collectivite_id, hash)
);

create view bibliotheque_fichier
as
select bf.id,
       bf.collectivite_id,
       bf.hash,
       bf.filename,
       o.bucket_id                      as bucked_id,
       o.id                             as file_id,
       (o.metadata ->> 'size')::integer as filesize
from labellisation.bibliotheque_fichier bf
         join collectivite_bucket cb on cb.collectivite_id = bf.collectivite_id
         join storage.objects o on o.name = bf.hash and o.bucket_id = cb.bucket_id;


create function add_bibliotheque_fichier(
    collectivite_id integer,
    hash varchar(64),
    filename text
)
    returns bibliotheque_fichier
as
$$
declare
    object_id    uuid;
    inserted     integer;
    return_value bibliotheque_fichier;
begin
    if have_edition_acces(add_bibliotheque_fichier.collectivite_id)
    then
        select o.id
        into object_id
        from storage.objects o
                 join collectivite_bucket cb on o.bucket_id = cb.bucket_id
        where cb.collectivite_id = add_bibliotheque_fichier.collectivite_id
          and o.name = add_bibliotheque_fichier.hash;

        if object_id is null
        then
            perform set_config('response.status', '404', true);
            return null;
        end if;

        insert into labellisation.bibliotheque_fichier(collectivite_id, hash, filename)
        values (add_bibliotheque_fichier.collectivite_id,
                add_bibliotheque_fichier.hash,
                add_bibliotheque_fichier.filename)
        returning id into inserted;

        select *
        from bibliotheque_fichier bf
        where bf.id = inserted
        into return_value;

        perform set_config('response.status', '201', true);
        return return_value;
    else
        perform set_config('response.status', '403', true);
        return null;
    end if;
end;
$$ language plpgsql security definer;
comment on function add_bibliotheque_fichier is
    'Ajoute un fichier présent dan le bucket de la collectivité à l''adresse `bucket/hash`, dans la bibliothèque de fichiers.';

COMMIT;
