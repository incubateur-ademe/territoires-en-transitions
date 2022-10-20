-- Deploy tet:labellisation/fichier_preuve to pg
-- requires: labellisation/labellisation
-- requires: collectivite/bucket

BEGIN;

-- drop les dépendances.
drop function add_bibliotheque_fichier;
drop view preuve;
drop view labellisation.bibliotheque_fichier_snippet;
drop view bibliotheque_fichier;

-- modifie la table
alter table labellisation.bibliotheque_fichier
    alter column hash type varchar(64);

-- restaure les dépendances.
create view bibliotheque_fichier
as
select bf.id,
       bf.collectivite_id,
       bf.hash,
       bf.filename,
       o.bucket_id                      as bucket_id,
       o.id                             as file_id,
       (o.metadata ->> 'size')::integer as filesize
from labellisation.bibliotheque_fichier bf
         join collectivite_bucket cb on cb.collectivite_id = bf.collectivite_id
         join storage.objects o on o.name = bf.hash and o.bucket_id = cb.bucket_id;


-- Vue partielle `bibliotheque_fichier` en json.
create view labellisation.bibliotheque_fichier_snippet as
select id,
       jsonb_build_object(
               'filename', filename,
               'hash', hash,
               'bucket_id', bucket_id,
               'filesize', filesize) as snippet
from public.bibliotheque_fichier;
comment on view bibliotheque_fichier is 'Vue partielle de la table `public.bibliotheque_fichier` en json.';

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


-- La vue utilisée par le client qui regroupe tout les types de preuves.
create or replace view preuve
as
-- Les preuves complémentaires.
select -- champs communs
       'complementaire':: preuve_type              as preuve_type,
       pc.id,
       pc.collectivite_id,
       fs.snippet                                  as fichier,
       pc.lien,
       pc.commentaire,
       pc.modified_at                              as created_at,
       pc.modified_by                              as created_by,
       utilisateur.modified_by_nom(pc.modified_by) as created_by_nom,
       snippet.snippet                             as action,
       null:: jsonb                                as preuve_reglementaire,
       null:: jsonb                                as demande,
       null:: jsonb                                as rapport
from preuve_complementaire pc
         left join labellisation.bibliotheque_fichier_snippet fs
                   on fs.id = pc.fichier_id
         left join labellisation.action_snippet snippet
                   on snippet.action_id = pc.action_id
                       and snippet.collectivite_id = pc.collectivite_id
union all

-- Toutes les preuves réglementaires par collectivité, avec ou sans fichier.
select 'reglementaire',
       pr.id,
       c.id,
       fs.snippet,
       pr.lien,
       pr.commentaire,
       pr.modified_at,
       pr.modified_by,
       utilisateur.modified_by_nom(pr.modified_by),
       snippet.snippet,
       (select jsonb_build_object(
                       'id', prd.id,
                       'nom', prd.nom,
                       'description', prd.description)),
       null,
       null
from collectivite c -- toutes les collectivités ...
         left join preuve_reglementaire_definition prd on true -- ... x toutes les preuves réglementaires
         left join preuve_reglementaire pr on prd.id = pr.preuve_id and c.id = pr.collectivite_id
         left join preuve_action pa on prd.id = pa.preuve_id
         left join labellisation.bibliotheque_fichier_snippet fs on fs.id = pr.fichier_id
         left join labellisation.action_snippet snippet
                   on snippet.action_id = pa.action_id and snippet.collectivite_id = c.id
union all

select 'labellisation',
       p.id,
       d.collectivite_id,
       fs.snippet,
       p.lien,
       p.commentaire,
       p.modified_at,
       p.modified_by,
       utilisateur.modified_by_nom(p.modified_by),
       null,
       null,
       (select jsonb_build_object(
                       'en_cours', d.en_cours,
                       'referentiel', d.referentiel,
                       'etoiles', d.etoiles,
                       'date', d.date,
                       'id', d.id
                   )),
       null
from labellisation.demande d
         join preuve_labellisation p on p.demande_id = d.id
         left join labellisation.bibliotheque_fichier_snippet fs on fs.id = p.fichier_id

union all
select 'rapport',
       p.id,
       p.collectivite_id,
       fs.snippet,
       p.lien,
       p.commentaire,
       p.modified_at,
       p.modified_by,
       utilisateur.modified_by_nom(p.modified_by),
       null,
       null,
       null,
       jsonb_build_object('date', p.date)
from preuve_rapport p
         left join labellisation.bibliotheque_fichier_snippet fs on fs.id = p.fichier_id
;
comment on view preuve is 'Regroupe tout les types de preuves.';

COMMIT;
