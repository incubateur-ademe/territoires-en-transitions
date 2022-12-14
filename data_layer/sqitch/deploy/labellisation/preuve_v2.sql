-- Deploy tet:labellisation/preuve_v2 to pg

BEGIN;

alter type preuve_type add value if not exists 'audit' after 'labellisation';

commit;

begin;

create table preuve_audit
(
    id       serial primary key,
    like labellisation.preuve_base including all,
    audit_id integer references audit not null
);
comment on table preuve_audit is
    'Permet de stocker les rapports d''audit';

do
$$
    declare
        name text;
    begin
        -- Pour chaque type, et donc chaque table nommée preuve_[type]
        foreach name in array enum_range(NULL::preuve_type)
            loop
                -- On drop les anciennes policies
                execute format('drop policy if exists allow_read on preuve_%I;', name);
                execute format('drop policy if exists allow_insert on preuve_%I;', name);
                execute format('drop policy if exists allow_update on preuve_%I;', name);

                --- Tous les membres de Territoires en transitions peuvent lire.
                execute format('create policy allow_read
                    on preuve_%I for select
                    using (is_authenticated());', name);
                --- Seuls les membres ayant un accès en édition peuvent écrire.
                execute format('create policy allow_insert
                    on preuve_%I for insert
                    with check (have_edition_acces(collectivite_id));', name);
                execute format('create policy allow_update
                    on preuve_%I for update
                    using (have_edition_acces(collectivite_id));', name);
            end loop;
    end;
$$;


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
       null:: jsonb                                as rapport,
       null:: jsonb                                 as audit
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
       jsonb_build_object(
               'id', prd.id,
               'nom', prd.nom,
               'description', prd.description),
       null,
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
       coalesce(d.collectivite_id, pa.collectivite_id),
       fs.snippet,
       coalesce(p.lien, pa.lien),
       coalesce(p.commentaire, pa.commentaire),
       coalesce(p.modified_at, pa.modified_at),
       coalesce(p.modified_by, pa.modified_by),
       utilisateur.modified_by_nom(coalesce(p.modified_by, pa.modified_by)),
       null,
       null,
       jsonb_build_object(
               'en_cours', d.en_cours,
               'referentiel', d.referentiel,
               'etoiles', d.etoiles,
               'date', d.date,
               'id', d.id,
               'audit_id', pa.audit_id
           ),
       null,
       null
from labellisation.demande d
         left join preuve_labellisation p on p.demande_id = d.id
         left join audit a on d.id = a.demande_id
         left join preuve_audit pa on a.id = pa.audit_id
         left join labellisation.bibliotheque_fichier_snippet fs on fs.id = p.fichier_id
union all

select 'audit',
       p.id,
       a.collectivite_id,
       fs.snippet,
       p.lien,
       p.commentaire,
       p.modified_at,
       p.modified_by,
       utilisateur.modified_by_nom(p.modified_by),
       null,
       null,
       null,
       null,
       jsonb_build_object('id', a.id, 'referentiel', a.referentiel, 'date_debut', a.date_debut, 'date_fin', a.date_fin)
from audit a
         join preuve_audit p on p.audit_id = a.id
         left join labellisation.bibliotheque_fichier_snippet fs on fs.id = p.fichier_id
where a.demande_id is null

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
       jsonb_build_object('date', p.date),
       null
from preuve_rapport p
         left join labellisation.bibliotheque_fichier_snippet fs on fs.id = p.fichier_id
;



COMMIT;
